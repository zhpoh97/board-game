import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, GameType } from '@cockroach-poker/shared';
import { roomManager } from '../../room/RoomManager.js';
import { handleLeave, broadcastLobby } from './roomHandlers.js';
import { broadcastGameState } from './gameHandlers.js';
import { broadcastSaboteurState } from './saboteurHandlers.js';
import { log } from '../../utils/logger.js';

export function registerConnectionHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvent.ROOM_RECONNECT, (data: { sessionId: string; roomCode: string }) => {
    const { sessionId, roomCode } = data;
    if (!sessionId || !roomCode) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Missing session or room info for reconnection' });
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Room no longer exists' });
      return;
    }

    // Check if this session exists in the room
    let isInRoom = false;
    let nickname = 'Unknown';

    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const eng = room.saboteurEngine;
      const p = eng.players.get(sessionId);
      const o = eng.observers.get(sessionId);
      isInRoom = !!(p || o);
      nickname = p?.nickname || o?.nickname || 'Unknown';
    } else if (room.engine) {
      const p = room.engine.players.get(sessionId);
      const o = room.engine.observers.get(sessionId);
      isInRoom = !!(p || o);
      nickname = p?.nickname || o?.nickname || 'Unknown';
    }

    if (!isInRoom) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Session not found in this room' });
      return;
    }

    // Restore connection
    socket.data.sessionId = sessionId;
    room.setConnected(sessionId, true);
    roomManager.cancelCleanup(room.code);
    socket.join(room.code);

    // Send full state
    const stateEvent = room.gameType === GameType.SABOTEUR ? ServerEvent.SAB_STATE_SYNC : ServerEvent.GAME_STATE_SYNC;
    socket.emit(stateEvent, room.getStateForPlayer(sessionId));

    // Notify others
    socket.to(room.code).emit(ServerEvent.ROOM_PLAYER_JOINED, {
      player: { id: sessionId, nickname, reconnected: true },
    });

    broadcastLobby(io, room);
    log('ConnectionHandlers', `${sessionId} reconnected to room ${roomCode}`);
  });

  socket.on('disconnect', () => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) return;

    room.setConnected(sessionId, false);

    // Transfer admin if needed
    if (room.adminSessionId === sessionId) {
      const newAdmin = room.tryTransferAdmin();
      if (newAdmin) {
        log('ConnectionHandlers', `Admin transferred to ${newAdmin} in room ${room.code}`);
      }
    }

    // Get nickname for notification
    let nickname = 'Unknown';
    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const p = room.saboteurEngine.players.get(sessionId);
      const o = room.saboteurEngine.observers.get(sessionId);
      nickname = p?.nickname || o?.nickname || 'Unknown';
    } else if (room.engine) {
      const p = room.engine.players.get(sessionId);
      const o = room.engine.observers.get(sessionId);
      nickname = p?.nickname || o?.nickname || 'Unknown';
    }

    socket.to(room.code).emit(ServerEvent.ROOM_PLAYER_LEFT, {
      playerId: sessionId,
      nickname,
      disconnected: true,
    });

    broadcastLobby(io, room);

    if (room.getConnectedCount() === 0) {
      roomManager.scheduleCleanup(room.code);
    }

    log('ConnectionHandlers', `${sessionId} disconnected from room ${room.code}`);
  });
}
