import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, GameType, Tool } from '@cockroach-poker/shared';
import { roomManager } from '../../room/RoomManager.js';
import { Room } from '../../room/Room.js';
import { log } from '../../utils/logger.js';

function getSabRoom(socket: Socket): { room: Room; sessionId: string } | null {
  const sessionId = (socket.data as { sessionId?: string }).sessionId;
  if (!sessionId) return null;
  const room = roomManager.getRoomBySession(sessionId);
  if (!room || room.gameType !== GameType.SABOTEUR || !room.saboteurEngine) return null;
  return { room, sessionId };
}

export function registerSaboteurHandlers(io: Server, socket: Socket): void {

  socket.on(ClientEvent.SAB_PLAY_PATH, (data: { cardId: string; x: number; y: number }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.playPath(sessionId, data.cardId, data.x, data.y);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_PLAY_BREAK, (data: { cardId: string; targetPlayerId: string }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.playBreak(sessionId, data.cardId, data.targetPlayerId);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_PLAY_REPAIR, (data: { cardId: string; targetPlayerId: string; tool: Tool }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.playRepair(sessionId, data.cardId, data.targetPlayerId, data.tool);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_PLAY_ROCKFALL, (data: { cardId: string; x: number; y: number }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.playRockfall(sessionId, data.cardId, data.x, data.y);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_PLAY_MAP, (data: { cardId: string; goalX: number; goalY: number }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.playMap(sessionId, data.cardId, data.goalX, data.goalY);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    // Send goal info privately to the player
    if (result.goal) {
      socket.emit(ServerEvent.SAB_GOAL_PEEKED, result.goal);
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_MAP_PEEK_DONE, () => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.mapPeekDone(sessionId);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_DISCARD, (data: { cardId: string }) => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    const result = room.saboteurEngine!.discard(sessionId, data.cardId);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastSaboteurState(io, room);
  });

  socket.on(ClientEvent.SAB_NEXT_ROUND, () => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can start the next round' });
      return;
    }

    const hasNext = room.saboteurEngine!.nextRound();
    broadcastSaboteurState(io, room);
  });

  // Restart (reuse existing event)
  socket.on(ClientEvent.GAME_RESTART, () => {
    const ctx = getSabRoom(socket);
    if (!ctx) return;
    const { room, sessionId } = ctx;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can restart' });
      return;
    }

    room.saboteurEngine!.restart();
    broadcastSaboteurState(io, room);
    log('SaboteurHandlers', `Saboteur restarted in room ${room.code}`);
  });
}

export function broadcastSaboteurState(io: Server, room: Room): void {
  const roomSockets = io.sockets.adapter.rooms.get(room.code);
  if (!roomSockets) return;

  for (const socketId of roomSockets) {
    const s = io.sockets.sockets.get(socketId);
    if (!s) continue;
    const sid = (s.data as { sessionId?: string }).sessionId;
    if (!sid) continue;
    s.emit(ServerEvent.SAB_STATE_SYNC, room.getStateForPlayer(sid));
  }
}
