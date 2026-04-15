import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, GameVariant, GamePhase, GameType, SaboteurPhase } from '@cockroach-poker/shared';
import { roomManager } from '../../room/RoomManager.js';
import { generateSessionId } from '../../utils/idGenerator.js';
import { log } from '../../utils/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvent.ROOM_CREATE, (data: { nickname: string; gameType?: string }, callback?: (res: unknown) => void) => {
    const { nickname } = data;
    if (!nickname || nickname.trim().length === 0) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Nickname is required' });
      return;
    }
    if (nickname.trim().length > 20) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Nickname must be 20 characters or less' });
      return;
    }

    // Check if already in a room
    const existingSessionId = (socket.data as { sessionId?: string }).sessionId;
    if (existingSessionId && roomManager.getRoomBySession(existingSessionId)) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'You are already in a room. Leave first.' });
      return;
    }

    const sessionId = existingSessionId || generateSessionId();
    socket.data.sessionId = sessionId;

    const gameType = data.gameType === GameType.SABOTEUR ? GameType.SABOTEUR : GameType.COCKROACH_POKER;
    const room = roomManager.createRoom(sessionId, gameType);
    room.addPlayer(sessionId, nickname.trim());
    roomManager.mapSessionToRoom(sessionId, room.code);

    socket.join(room.code);
    socket.emit(ServerEvent.ROOM_CREATED, {
      roomCode: room.code,
      sessionId,
      gameState: room.getStateForPlayer(sessionId),
    });

    log('RoomHandlers', `${nickname} created room ${room.code} (${gameType})`);
  });

  socket.on(ClientEvent.ROOM_JOIN, (data: { roomCode: string; nickname: string }) => {
    const { roomCode, nickname } = data;
    if (!nickname || nickname.trim().length === 0) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Nickname is required' });
      return;
    }
    if (nickname.trim().length > 20) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Nickname must be 20 characters or less' });
      return;
    }
    if (!roomCode) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Room code is required' });
      return;
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: `Room "${roomCode.toUpperCase()}" not found` });
      return;
    }

    // Check if already in a different room
    const existingSessionId = (socket.data as { sessionId?: string }).sessionId;
    if (existingSessionId) {
      const existingRoom = roomManager.getRoomBySession(existingSessionId);
      if (existingRoom && existingRoom.code !== room.code) {
        socket.emit(ServerEvent.ROOM_ERROR, { message: 'You are already in another room. Leave first.' });
        return;
      }
    }

    // Check duplicate nickname (works for both game types)
    const allIds = room.getAllSessionIds();
    let nameTaken = false;
    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const eng = room.saboteurEngine;
      for (const id of allIds) {
        if (id === existingSessionId) continue;
        const p = eng.players.get(id);
        const o = eng.observers.get(id);
        const n = p?.nickname || o?.nickname;
        if (n && n.toLowerCase() === nickname.trim().toLowerCase()) { nameTaken = true; break; }
      }
    } else if (room.engine) {
      const allPlayers = [...room.engine.players.values(), ...room.engine.observers.values()];
      nameTaken = allPlayers.some(p => p.nickname.toLowerCase() === nickname.trim().toLowerCase() && p.id !== existingSessionId);
    }
    if (nameTaken) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'That nickname is already taken in this room' });
      return;
    }

    const sessionId = existingSessionId || generateSessionId();
    socket.data.sessionId = sessionId;

    // Add player (both engines handle the max player / observer logic)
    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const eng = room.saboteurEngine;
      const playerCount = eng.players.size;
      if (playerCount >= 6) {
        eng.addObserver(sessionId, nickname.trim());
      } else {
        eng.addPlayer(sessionId, nickname.trim());
      }
    } else {
      room.engine!.addPlayer(sessionId, nickname.trim());
    }

    roomManager.mapSessionToRoom(sessionId, room.code);

    socket.join(room.code);
    socket.emit(ServerEvent.ROOM_JOINED, {
      sessionId,
      gameState: room.getStateForPlayer(sessionId),
    });

    // Notify others
    socket.to(room.code).emit(ServerEvent.ROOM_PLAYER_JOINED, {
      player: { id: sessionId, nickname: nickname.trim(), isObserver: false },
    });

    // Broadcast updated lobby
    broadcastLobby(io, room);

    log('RoomHandlers', `${nickname} joined room ${room.code}`);
  });

  socket.on(ClientEvent.ROOM_LEAVE, () => {
    handleLeave(io, socket);
  });

  socket.on(ClientEvent.ROOM_KICK, (data: { targetSessionId: string }) => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) return;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can kick players' });
      return;
    }

    // Check phase for both game types
    const inLobby = room.gameType === GameType.SABOTEUR
      ? room.saboteurEngine?.phase === SaboteurPhase.WAITING
      : room.engine?.phase === GamePhase.WAITING;

    if (!inLobby) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Cannot kick players during a game' });
      return;
    }

    const { targetSessionId } = data;
    if (targetSessionId === sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Cannot kick yourself' });
      return;
    }

    // Find the target's socket and disconnect them from the room
    const targetSockets = io.sockets.adapter.rooms.get(room.code);
    if (targetSockets) {
      for (const socketId of targetSockets) {
        const s = io.sockets.sockets.get(socketId);
        if (s && (s.data as { sessionId?: string }).sessionId === targetSessionId) {
          s.leave(room.code);
          s.data.sessionId = undefined;
          s.emit(ServerEvent.ROOM_KICKED, { reason: 'You were kicked by the admin' });
        }
      }
    }

    // Get nickname before removing
    let nickname = 'Unknown';
    if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
      const p = room.saboteurEngine.players.get(targetSessionId);
      const o = room.saboteurEngine.observers.get(targetSessionId);
      nickname = p?.nickname || o?.nickname || 'Unknown';
    } else if (room.engine) {
      const target = room.engine.players.get(targetSessionId) || room.engine.observers.get(targetSessionId);
      nickname = target?.nickname || 'Unknown';
    }

    room.removePlayer(targetSessionId);
    roomManager.unmapSession(targetSessionId);

    io.to(room.code).emit(ServerEvent.ROOM_PLAYER_LEFT, { playerId: targetSessionId, nickname });
    broadcastLobby(io, room);

    log('RoomHandlers', `${nickname} was kicked from room ${room.code}`);
  });

  socket.on(ClientEvent.ROOM_CLOSE, () => {
    const sessionId = (socket.data as { sessionId?: string }).sessionId;
    if (!sessionId) return;

    const room = roomManager.getRoomBySession(sessionId);
    if (!room) return;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can close the room' });
      return;
    }

    io.to(room.code).emit(ServerEvent.ROOM_CLOSED, {});

    // Remove all sockets from the room
    const roomSockets = io.sockets.adapter.rooms.get(room.code);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          s.leave(room.code);
          s.data.sessionId = undefined;
        }
      }
    }

    roomManager.deleteRoom(room.code);
    log('RoomHandlers', `Room ${room.code} closed by admin`);
  });
}

export function handleLeave(io: Server, socket: Socket): void {
  const sessionId = (socket.data as { sessionId?: string }).sessionId;
  if (!sessionId) return;

  const room = roomManager.getRoomBySession(sessionId);
  if (!room) return;

  // Get nickname before removing
  let nickname = 'Unknown';
  if (room.gameType === GameType.SABOTEUR && room.saboteurEngine) {
    const p = room.saboteurEngine.players.get(sessionId);
    const o = room.saboteurEngine.observers.get(sessionId);
    nickname = p?.nickname || o?.nickname || 'Unknown';
  } else if (room.engine) {
    const player = room.engine.players.get(sessionId) || room.engine.observers.get(sessionId);
    nickname = player?.nickname || 'Unknown';
  }

  room.removePlayer(sessionId);
  roomManager.unmapSession(sessionId);
  socket.leave(room.code);
  socket.data.sessionId = undefined;

  io.to(room.code).emit(ServerEvent.ROOM_PLAYER_LEFT, { playerId: sessionId, nickname });

  // Transfer admin if needed
  if (room.adminSessionId === sessionId) {
    const newAdmin = room.tryTransferAdmin();
    if (!newAdmin) {
      roomManager.scheduleCleanup(room.code);
    }
  }

  broadcastLobby(io, room);

  // If no connected players, schedule cleanup
  if (room.getConnectedCount() === 0) {
    roomManager.scheduleCleanup(room.code);
  }

  log('RoomHandlers', `${nickname} left room ${room.code}`);
}

export function broadcastLobby(io: Server, room: import('../../room/Room.js').Room): void {
  for (const sessionId of room.getAllSessionIds()) {
    const roomSockets = io.sockets.adapter.rooms.get(room.code);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const s = io.sockets.sockets.get(socketId);
        if (s && (s.data as { sessionId?: string }).sessionId === sessionId) {
          s.emit(ServerEvent.LOBBY_UPDATED, room.getStateForPlayer(sessionId));
        }
      }
    }
  }
}
