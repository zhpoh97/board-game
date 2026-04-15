import { GameVariant, GameStateForClient, VARIANT_MIN_PLAYERS, GameType, SaboteurGameStateForClient } from '@cockroach-poker/shared';
import { GameEngine } from '../game/GameEngine.js';
import { SaboteurEngine } from '../game/SaboteurEngine.js';

export class Room {
  readonly code: string;
  adminSessionId: string;
  readonly createdAt: number;
  readonly gameType: GameType;
  engine: GameEngine | null = null;
  saboteurEngine: SaboteurEngine | null = null;
  private _cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(code: string, adminSessionId: string, gameType: GameType = GameType.COCKROACH_POKER) {
    this.code = code;
    this.adminSessionId = adminSessionId;
    this.createdAt = Date.now();
    this.gameType = gameType;

    if (gameType === GameType.COCKROACH_POKER) {
      this.engine = new GameEngine();
    } else {
      this.saboteurEngine = new SaboteurEngine();
    }
  }

  get variant(): GameVariant {
    return this.engine?.variant ?? GameVariant.BASE;
  }

  set variant(v: GameVariant) {
    if (this.engine) this.engine.variant = v;
  }

  getStateForPlayer(sessionId: string): GameStateForClient | SaboteurGameStateForClient {
    if (this.gameType === GameType.SABOTEUR && this.saboteurEngine) {
      const state = this.saboteurEngine.getStateForPlayer(sessionId);
      if (!state) {
        // Return a minimal state for unknown sessions
        return this.saboteurEngine.getStateForPlayer(sessionId)!;
      }
      state.roomCode = this.code;
      state.isAdmin = sessionId === this.adminSessionId;
      state.adminId = this.adminSessionId;
      return state;
    }

    const state = this.engine!.getStateForPlayer(sessionId);
    state.roomCode = this.code;
    state.isAdmin = sessionId === this.adminSessionId;
    state.adminId = this.adminSessionId;
    return state;
  }

  getAllSessionIds(): string[] {
    if (this.gameType === GameType.SABOTEUR && this.saboteurEngine) {
      return [
        ...this.saboteurEngine.players.keys(),
        ...this.saboteurEngine.observers.keys(),
      ];
    }
    return [
      ...this.engine!.players.keys(),
      ...this.engine!.observers.keys(),
    ];
  }

  getConnectedCount(): number {
    let count = 0;
    if (this.gameType === GameType.SABOTEUR && this.saboteurEngine) {
      for (const p of this.saboteurEngine.players.values()) if (p.isConnected) count++;
      // Saboteur observers are always considered connected
      count += this.saboteurEngine.observers.size;
    } else if (this.engine) {
      for (const p of this.engine.players.values()) if (p.isConnected) count++;
      for (const o of this.engine.observers.values()) if (o.isConnected) count++;
    }
    return count;
  }

  tryTransferAdmin(): string | null {
    const players = this.gameType === GameType.SABOTEUR
      ? this.saboteurEngine?.players
      : this.engine?.players;
    const observers = this.gameType === GameType.SABOTEUR
      ? this.saboteurEngine?.observers
      : this.engine?.observers;

    if (players) {
      for (const [id, p] of players) {
        if ((p as any).isConnected && id !== this.adminSessionId) {
          this.adminSessionId = id;
          return id;
        }
      }
    }
    if (observers) {
      for (const [id, o] of observers) {
        if ((o as any).isConnected && id !== this.adminSessionId) {
          this.adminSessionId = id;
          return id;
        }
      }
    }
    return null;
  }

  setCleanupTimer(callback: () => void, delayMs: number): void {
    this.clearCleanupTimer();
    this._cleanupTimer = setTimeout(callback, delayMs);
  }

  clearCleanupTimer(): void {
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  canChangeVariant(newVariant: GameVariant): { ok: boolean; error?: string } {
    if (this.gameType !== GameType.COCKROACH_POKER) {
      return { ok: false, error: 'Variants only apply to Cockroach Poker' };
    }
    const minPlayers = VARIANT_MIN_PLAYERS[newVariant];
    const currentPlayers = this.engine!.players.size;
    if (currentPlayers < minPlayers) {
      return { ok: false, error: `${newVariant} variant requires at least ${minPlayers} players (currently ${currentPlayers})` };
    }
    return { ok: true };
  }

  // Helper to add player to the appropriate engine
  addPlayer(sessionId: string, nickname: string): { id: string; isObserver: boolean } {
    if (this.gameType === GameType.SABOTEUR) {
      this.saboteurEngine!.addPlayer(sessionId, nickname);
      return { id: sessionId, isObserver: false };
    } else {
      return this.engine!.addPlayer(sessionId, nickname);
    }
  }

  addObserver(sessionId: string, nickname: string): void {
    if (this.gameType === GameType.SABOTEUR) {
      this.saboteurEngine!.addObserver(sessionId, nickname);
    } else {
      // CP engine handles observer via addPlayer auto-detect
      this.engine!.addPlayer(sessionId, nickname);
    }
  }

  removePlayer(sessionId: string): void {
    if (this.gameType === GameType.SABOTEUR) {
      this.saboteurEngine!.removePlayer(sessionId);
    } else {
      this.engine!.removePlayer(sessionId);
    }
  }

  setConnected(sessionId: string, connected: boolean): void {
    if (this.gameType === GameType.SABOTEUR) {
      this.saboteurEngine!.setConnected(sessionId, connected);
    } else {
      if (connected) {
        this.engine!.setConnected(sessionId);
      } else {
        this.engine!.setDisconnected(sessionId);
      }
    }
  }
}
