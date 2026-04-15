import { io, Socket } from 'socket.io-client';
import { ServerEvent, GameType } from '@cockroach-poker/shared';
import { useGameStore } from './store/useGameStore';
import { useUIStore } from './store/useUIStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    setupListeners(socket);
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function setupListeners(socket: Socket): void {
  const gameStore = useGameStore.getState;
  const uiStore = useUIStore.getState;

  socket.on('connect', () => {
    uiStore().setConnected(true);
    const sessionId = localStorage.getItem('cp_sessionId');
    const roomCode = localStorage.getItem('cp_roomCode');
    if (sessionId && roomCode) {
      socket.emit('room:reconnect', { sessionId, roomCode });
    }
  });

  socket.on('disconnect', () => {
    uiStore().setConnected(false);
  });

  socket.on(ServerEvent.ROOM_CREATED, (data) => {
    localStorage.setItem('cp_sessionId', data.sessionId);
    localStorage.setItem('cp_roomCode', data.roomCode);
    // Check if it's a saboteur game state
    if (data.gameState?.gameType === GameType.SABOTEUR) {
      gameStore().setSabState(data.gameState);
    } else {
      gameStore().setGameState(data.gameState);
    }
  });

  socket.on(ServerEvent.ROOM_JOINED, (data) => {
    localStorage.setItem('cp_sessionId', data.sessionId);
    localStorage.setItem('cp_roomCode', data.gameState.roomCode);
    if (data.gameState?.gameType === GameType.SABOTEUR) {
      gameStore().setSabState(data.gameState);
    } else {
      gameStore().setGameState(data.gameState);
    }
  });

  socket.on(ServerEvent.ROOM_CLOSED, () => {
    gameStore().clearState();
    localStorage.removeItem('cp_sessionId');
    localStorage.removeItem('cp_roomCode');
    uiStore().addToast('Room was closed by the admin', 'warning');
  });

  socket.on(ServerEvent.ROOM_KICKED, (data) => {
    gameStore().clearState();
    localStorage.removeItem('cp_sessionId');
    localStorage.removeItem('cp_roomCode');
    uiStore().addToast(data.reason || 'You were kicked from the room', 'error');
  });

  socket.on(ServerEvent.ROOM_ERROR, (data) => {
    uiStore().addToast(data.message, 'error');
    if (data.message?.includes('not found') || data.message?.includes('no longer exists')) {
      localStorage.removeItem('cp_sessionId');
      localStorage.removeItem('cp_roomCode');
      gameStore().clearState();
    }
  });

  socket.on(ServerEvent.LOBBY_UPDATED, (data) => {
    if (data?.gameType === GameType.SABOTEUR) {
      gameStore().setSabState(data);
    } else {
      gameStore().setGameState(data);
    }
  });

  // ─── Cockroach Poker Events ───
  socket.on(ServerEvent.GAME_STATE_SYNC, (data) => {
    gameStore().setGameState(data);
    if (data.phase === 'ROUND_START') {
      gameStore().clearResolution();
      gameStore().clearPeekedCard();
    }
  });

  socket.on(ServerEvent.GAME_CARD_REVEALED, (data) => {
    gameStore().setResolution(data);
    const critterName = data.card.critter.replace('_', ' ');
    const msg = data.wasCorrectGuess
      ? `Correct! The card was a ${critterName}${data.card.isRoyal ? ' (Royal)' : ''}`
      : `Wrong! The card was a ${critterName}${data.card.isRoyal ? ' (Royal)' : ''}`;
    uiStore().addToast(msg, data.wasCorrectGuess ? 'success' : 'warning');
  });

  socket.on(ServerEvent.GAME_CARD_PEEKED, (data) => {
    gameStore().setPeekedCard(data.card);
  });

  socket.on(ServerEvent.GAME_ROYAL_EFFECT, (data) => {
    const critter = data.critter.replace('_', ' ');
    uiStore().addToast(`Royal effect! ${critter} cards returned to hands`, 'info');
  });

  socket.on(ServerEvent.GAME_OVER, (data) => {
    uiStore().addToast(data.reason || 'Game over!', 'warning');
  });

  // ─── Saboteur Events ───
  socket.on(ServerEvent.SAB_STATE_SYNC, (data) => {
    gameStore().setSabState(data);
  });

  socket.on(ServerEvent.SAB_GOAL_PEEKED, (data) => {
    gameStore().setSabPeekedGoal(data);
  });

  // ─── Common Events ───
  socket.on(ServerEvent.ROOM_PLAYER_JOINED, (data) => {
    const label = data.player.reconnected ? 'reconnected' : 'joined';
    uiStore().addToast(`${data.player.nickname} ${label}`, 'info');
  });

  socket.on(ServerEvent.ROOM_PLAYER_LEFT, (data) => {
    const label = data.disconnected ? 'disconnected' : 'left';
    uiStore().addToast(`${data.nickname} ${label}`, 'info');
  });
}
