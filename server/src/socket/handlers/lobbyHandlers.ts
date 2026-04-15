import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, GameVariant, GamePhase, GameType, SaboteurPhase, SABOTEUR_MIN_PLAYERS } from '@cockroach-poker/shared';
import { roomManager } from '../../room/RoomManager.js';
import { broadcastLobby } from './roomHandlers.js';
import { broadcastGameState } from './gameHandlers.js';
import { broadcastSaboteurState } from './saboteurHandlers.js';
import { log } from '../../utils/logger.js';

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvent.LOBBY_TOGGLE_ROLE, () => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Not in a room' });
      return;
    }

    // Only CP engine has toggleRole
    if (room.gameType === GameType.COCKROACH_POKER && room.engine) {
      const result = room.engine.toggleRole(sessionId);
      if (!result.success) {
        socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
        return;
      }
      broadcastLobby(io, room);
      log('LobbyHandlers', `${sessionId} toggled to ${result.isObserver ? 'observer' : 'player'}`);
    }
    // For Saboteur, toggling roles in lobby isn't needed (all are players until max)
  });

  socket.on(ClientEvent.LOBBY_SET_VARIANT, (data: { variant: GameVariant }) => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) return;

    if (room.gameType !== GameType.COCKROACH_POKER) return;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can change the variant' });
      return;
    }

    if (room.engine!.phase !== GamePhase.WAITING) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Cannot change variant during a game' });
      return;
    }

    const { variant } = data;
    if (variant !== GameVariant.BASE && variant !== GameVariant.ROYAL) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Invalid variant' });
      return;
    }

    room.variant = variant;
    broadcastLobby(io, room);
    log('LobbyHandlers', `Room ${room.code} variant set to ${variant}`);
  });

  socket.on(ClientEvent.LOBBY_START_GAME, () => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) return;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can start the game' });
      return;
    }

    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const eng = room.saboteurEngine;
      if (eng.players.size < SABOTEUR_MIN_PLAYERS) {
        socket.emit(ServerEvent.ROOM_ERROR, { message: `Need at least ${SABOTEUR_MIN_PLAYERS} players` });
        return;
      }
      eng.startGame();
      broadcastSaboteurState(io, room);
      log('LobbyHandlers', `Saboteur game started in room ${room.code}`);
    } else if (room.engine) {
      const result = room.engine.startGame();
      if (!result.success) {
        socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
        return;
      }
      broadcastGameState(io, room);
      log('LobbyHandlers', `Game started in room ${room.code}`);
    }
  });
}
