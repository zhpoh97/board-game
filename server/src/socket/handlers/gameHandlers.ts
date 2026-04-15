import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, CritterType, GamePhase, GameType, ROUND_RESOLUTION_DELAY_MS } from '@cockroach-poker/shared';
import { roomManager } from '../../room/RoomManager.js';
import { Room } from '../../room/Room.js';
import { GameEngine } from '../../game/GameEngine.js';
import { log } from '../../utils/logger.js';

function getCPRoom(socket: Socket): { room: Room; sessionId: string; engine: GameEngine } | null {
  const sessionId = (socket.data as { sessionId?: string }).sessionId;
  if (!sessionId) return null;
  const room = roomManager.getRoomBySession(sessionId);
  if (!room || room.gameType !== GameType.COCKROACH_POKER || !room.engine) return null;
  return { room, sessionId, engine: room.engine };
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvent.GAME_PASS_CARD, (data: { cardId: string; targetPlayerId: string; claimedType: CritterType }) => {
    const ctx = getCPRoom(socket);
    if (!ctx) return;
    const { room, sessionId, engine } = ctx;

    const { cardId, targetPlayerId, claimedType } = data;
    if (!Object.values(CritterType).includes(claimedType)) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Invalid critter type' });
      return;
    }

    const result = engine.passCard(sessionId, cardId, targetPlayerId, claimedType);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastGameState(io, room);
  });

  socket.on(ClientEvent.GAME_CALL_TRUE_FALSE, (data: { guess: boolean }) => {
    const ctx = getCPRoom(socket);
    if (!ctx) return;
    const { room, sessionId, engine } = ctx;

    const result = engine.callTrueFalse(sessionId, data.guess);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    engine.setLastRoundLoser(result.resolution!.loserId);

    io.to(room.code).emit(ServerEvent.GAME_CARD_REVEALED, result.resolution);
    broadcastGameState(io, room);

    setTimeout(() => {
      if (engine.phase !== GamePhase.ROUND_RESOLUTION) return;

      const resolveResult = engine.resolveRound();
      if (!resolveResult) return;

      if (resolveResult.royalEffect) {
        io.to(room.code).emit(ServerEvent.GAME_ROYAL_EFFECT, resolveResult.royalEffect);
      }

      if (resolveResult.gameOver) {
        io.to(room.code).emit(ServerEvent.GAME_OVER, {
          loserId: engine.loserId,
          reason: engine.loseReason,
        });
      }

      broadcastGameState(io, room);
    }, ROUND_RESOLUTION_DELAY_MS);
  });

  socket.on(ClientEvent.GAME_PEEK_AND_PASS, () => {
    const ctx = getCPRoom(socket);
    if (!ctx) return;
    const { room, sessionId, engine } = ctx;

    const result = engine.peekAndPass(sessionId);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    socket.emit(ServerEvent.GAME_CARD_PEEKED, { card: result.card });
    broadcastGameState(io, room);
  });

  socket.on(ClientEvent.GAME_PASS_AFTER_PEEK, (data: { targetPlayerId: string; claimedType: CritterType }) => {
    const ctx = getCPRoom(socket);
    if (!ctx) return;
    const { room, sessionId, engine } = ctx;

    const { targetPlayerId, claimedType } = data;
    if (!Object.values(CritterType).includes(claimedType)) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Invalid critter type' });
      return;
    }

    const result = engine.passAfterPeek(sessionId, targetPlayerId, claimedType);
    if (!result.success) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: result.error! });
      return;
    }

    broadcastGameState(io, room);
  });

  socket.on(ClientEvent.GAME_RESTART, () => {
    const ctx = getCPRoom(socket);
    if (!ctx) return;
    const { room, sessionId, engine } = ctx;

    if (room.adminSessionId !== sessionId) {
      socket.emit(ServerEvent.ROOM_ERROR, { message: 'Only the admin can restart the game' });
      return;
    }

    engine.restart();
    broadcastGameState(io, room);
    log('GameHandlers', `Game restarted in room ${room.code}`);
  });
}

export function broadcastGameState(io: Server, room: Room): void {
  const roomSockets = io.sockets.adapter.rooms.get(room.code);
  if (!roomSockets) return;

  for (const socketId of roomSockets) {
    const s = io.sockets.sockets.get(socketId);
    if (!s) continue;
    const sid = (s.data as { sessionId?: string }).sessionId;
    if (!sid) continue;
    s.emit(ServerEvent.GAME_STATE_SYNC, room.getStateForPlayer(sid));
  }
}
