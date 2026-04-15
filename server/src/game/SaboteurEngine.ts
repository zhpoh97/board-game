import {
  SaboteurPhase, SaboteurRole, SaboteurCard, SaboteurCardKind,
  SaboteurPathCard, Tool, SaboteurGameStateForClient,
  SaboteurPlayerPublic, GoalCardPublic, Direction,
  SABOTEUR_COUNTS, HAND_SIZE, TOTAL_ROUNDS,
  MINER_WIN_GOLD, SABOTEUR_WIN_GOLD, START_POSITION,
  GameType,
} from '@cockroach-poker/shared';
import { SaboteurBoard } from './SaboteurBoard.js';
import { buildSaboteurDeck, shuffle } from './SaboteurDeck.js';

interface SaboteurPlayer {
  id: string;
  nickname: string;
  hand: SaboteurCard[];
  brokenTools: Set<Tool>;
  role: SaboteurRole;
  isConnected: boolean;
  passed: boolean; // true = no cards left, effectively passed for rest of round
}

export class SaboteurEngine {
  phase: SaboteurPhase = SaboteurPhase.WAITING;
  board: SaboteurBoard = new SaboteurBoard();
  players: Map<string, SaboteurPlayer> = new Map();
  observers: Map<string, { id: string; nickname: string }> = new Map();
  playerOrder: string[] = [];
  currentPlayerIndex = 0;
  deck: SaboteurCard[] = [];
  round = 1;
  scores: Map<string, number> = new Map();
  winningSide: SaboteurRole | null = null;

  // Map peek state
  private _mapPeekPlayerId: string | null = null;
  private _mapPeekGoal: { x: number; y: number; hasGold: boolean } | null = null;

  get currentPlayerId(): string | null {
    if (this.playerOrder.length === 0) return null;
    return this.playerOrder[this.currentPlayerIndex];
  }

  addPlayer(id: string, nickname: string): void {
    if (this.players.has(id)) return;
    this.players.set(id, {
      id, nickname, hand: [], brokenTools: new Set(),
      role: SaboteurRole.MINER, isConnected: true, passed: false,
    });
    this.playerOrder.push(id);
    if (!this.scores.has(id)) this.scores.set(id, 0);
  }

  addObserver(id: string, nickname: string): void {
    this.observers.set(id, { id, nickname });
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.playerOrder = this.playerOrder.filter(pid => pid !== id);
    this.observers.delete(id);
  }

  setConnected(id: string, connected: boolean): void {
    const p = this.players.get(id);
    if (p) p.isConnected = connected;
  }

  // ─── Game Start ───
  startRound(): void {
    this.board.init();
    this.winningSide = null;
    this._mapPeekPlayerId = null;
    this._mapPeekGoal = null;

    // Assign roles
    const numPlayers = this.players.size;
    const numSaboteurs = SABOTEUR_COUNTS[numPlayers] || 1;
    const roles: SaboteurRole[] = [];
    for (let i = 0; i < numSaboteurs; i++) roles.push(SaboteurRole.SABOTEUR);
    while (roles.length < numPlayers) roles.push(SaboteurRole.MINER);
    const shuffledRoles = shuffle(roles);

    let i = 0;
    for (const player of this.players.values()) {
      player.role = shuffledRoles[i++];
      player.hand = [];
      player.brokenTools = new Set();
      player.passed = false;
    }

    // Build and shuffle deck, deal hands
    this.deck = shuffle(buildSaboteurDeck());
    const handSize = HAND_SIZE[numPlayers] || 6;

    for (const player of this.players.values()) {
      player.hand = this.deck.splice(0, handSize);
    }

    this.currentPlayerIndex = 0;
    this.phase = SaboteurPhase.PLAYING;
  }

  startGame(): void {
    this.round = 1;
    this.scores = new Map();
    for (const id of this.playerOrder) {
      this.scores.set(id, 0);
    }
    this.startRound();
  }

  // ─── Actions ───

  playPath(playerId: string, cardId: string, x: number, y: number): { success: boolean; error?: string; goldReached?: boolean } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;

    // Can't play path cards with broken tools
    if (player.brokenTools.size > 0) return { success: false, error: 'You have broken tools' };

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];
    if (card.kind !== SaboteurCardKind.PATH) return { success: false, error: 'Not a path card' };

    if (!this.board.canPlace(card, x, y)) return { success: false, error: 'Invalid placement' };

    // Place the card
    player.hand.splice(cardIndex, 1);
    const goalReached = this.board.place(card, x, y);

    if (goalReached) {
      goalReached.revealed = true;
      if (goalReached.hasGold) {
        // Miners win!
        this.endRound(SaboteurRole.MINER);
        return { success: true, goldReached: true };
      }
      // Revealed a stone — continue playing
    }

    this.drawAndAdvance(player);
    return { success: true, goldReached: false };
  }

  playBreak(playerId: string, cardId: string, targetPlayerId: string): { success: boolean; error?: string } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];
    if (card.kind !== SaboteurCardKind.BREAK) return { success: false, error: 'Not a break card' };

    // Can't break own tools
    if (targetPlayerId === playerId) return { success: false, error: 'Cannot target yourself' };

    const target = this.players.get(targetPlayerId);
    if (!target) return { success: false, error: 'Target not found' };

    // Can't break a tool that's already broken
    if (target.brokenTools.has(card.tool)) return { success: false, error: 'Tool already broken' };

    player.hand.splice(cardIndex, 1);
    target.brokenTools.add(card.tool);

    this.drawAndAdvance(player);
    return { success: true };
  }

  playRepair(playerId: string, cardId: string, targetPlayerId: string, tool: Tool): { success: boolean; error?: string } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];
    if (card.kind !== SaboteurCardKind.REPAIR) return { success: false, error: 'Not a repair card' };

    const target = this.players.get(targetPlayerId);
    if (!target) return { success: false, error: 'Target not found' };

    // The chosen tool must be one the card can repair
    if (!card.tools.includes(tool)) return { success: false, error: 'Card cannot repair this tool' };

    // Target must have that tool broken
    if (!target.brokenTools.has(tool)) return { success: false, error: 'Tool is not broken' };

    player.hand.splice(cardIndex, 1);
    target.brokenTools.delete(tool);

    this.drawAndAdvance(player);
    return { success: true };
  }

  playRockfall(playerId: string, cardId: string, x: number, y: number): { success: boolean; error?: string } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];
    if (card.kind !== SaboteurCardKind.ROCKFALL) return { success: false, error: 'Not a rockfall card' };

    // Can't remove start card
    if (x === START_POSITION.x && y === START_POSITION.y) return { success: false, error: 'Cannot destroy start card' };

    if (!this.board.getCell(x, y)) return { success: false, error: 'No card at that position' };

    player.hand.splice(cardIndex, 1);
    this.board.removeCard(x, y);

    this.drawAndAdvance(player);
    return { success: true };
  }

  playMap(playerId: string, cardId: string, goalX: number, goalY: number): { success: boolean; error?: string; goal?: { x: number; y: number; hasGold: boolean } } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];
    if (card.kind !== SaboteurCardKind.MAP) return { success: false, error: 'Not a map card' };

    const goal = this.board.getGoalAt(goalX, goalY);
    if (!goal) return { success: false, error: 'Not a goal position' };

    player.hand.splice(cardIndex, 1);

    // Enter map peek phase — only this player sees the result
    this._mapPeekPlayerId = playerId;
    this._mapPeekGoal = { x: goal.x, y: goal.y, hasGold: goal.hasGold };
    this.phase = SaboteurPhase.MAP_PEEK;

    return { success: true, goal: { x: goal.x, y: goal.y, hasGold: goal.hasGold } };
  }

  mapPeekDone(playerId: string): { success: boolean; error?: string } {
    if (this.phase !== SaboteurPhase.MAP_PEEK) return { success: false, error: 'Not in map peek phase' };
    if (this._mapPeekPlayerId !== playerId) return { success: false, error: 'Not the peeking player' };

    this._mapPeekPlayerId = null;
    this._mapPeekGoal = null;
    this.phase = SaboteurPhase.PLAYING;

    const player = this.players.get(playerId)!;
    this.drawAndAdvance(player);
    return { success: true };
  }

  discard(playerId: string, cardId: string): { success: boolean; error?: string } {
    if (this.phase !== SaboteurPhase.PLAYING) return { success: false, error: 'Not in playing phase' };
    if (this.currentPlayerId !== playerId) return { success: false, error: 'Not your turn' };

    const player = this.players.get(playerId)!;
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    player.hand.splice(cardIndex, 1);

    this.drawAndAdvance(player);
    return { success: true };
  }

  // ─── Internal Helpers ───

  private drawAndAdvance(player: SaboteurPlayer): void {
    // Draw a card if deck has cards
    if (this.deck.length > 0) {
      player.hand.push(this.deck.shift()!);
    }

    // Mark player as passed if they have no cards
    if (player.hand.length === 0) {
      player.passed = true;
    }

    // Check if all players have passed (deck empty + all hands empty)
    const allPassed = [...this.players.values()].every(p => p.passed);
    if (allPassed) {
      // Saboteurs win — miners couldn't reach the gold
      this.endRound(SaboteurRole.SABOTEUR);
      return;
    }

    // Advance to next player who hasn't passed
    this.advanceTurn();
  }

  private advanceTurn(): void {
    const n = this.playerOrder.length;
    for (let i = 1; i <= n; i++) {
      const idx = (this.currentPlayerIndex + i) % n;
      const pid = this.playerOrder[idx];
      const player = this.players.get(pid);
      if (player && !player.passed && player.isConnected) {
        this.currentPlayerIndex = idx;
        return;
      }
    }
    // Shouldn't happen — if all passed, endRound already called
  }

  private endRound(winner: SaboteurRole): void {
    this.winningSide = winner;
    this.phase = SaboteurPhase.ROUND_END;

    // Award gold
    const numPlayers = this.players.size;
    for (const player of this.players.values()) {
      if (player.role === winner) {
        const gold = winner === SaboteurRole.MINER
          ? (MINER_WIN_GOLD[numPlayers] || 2)
          : (SABOTEUR_WIN_GOLD[numPlayers] || 3);
        this.scores.set(player.id, (this.scores.get(player.id) || 0) + gold);
      }
    }

    // Reveal all goals
    for (const goal of this.board.goals) {
      goal.revealed = true;
    }
  }

  nextRound(): boolean {
    if (this.phase !== SaboteurPhase.ROUND_END) return false;
    this.round++;
    if (this.round > TOTAL_ROUNDS) {
      this.phase = SaboteurPhase.GAME_OVER;
      return false;
    }
    this.startRound();
    return true;
  }

  // ─── State Serialization ───

  getStateForPlayer(sessionId: string): SaboteurGameStateForClient | null {
    const player = this.players.get(sessionId);
    const isObserver = this.observers.has(sessionId);
    if (!player && !isObserver) return null;

    const players: SaboteurPlayerPublic[] = this.playerOrder
      .map(id => this.players.get(id)!)
      .filter(Boolean)
      .map(p => ({
        id: p.id,
        nickname: p.nickname,
        handCount: p.hand.length,
        brokenTools: [...p.brokenTools],
        isConnected: p.isConnected,
        passed: p.passed,
      }));

    const observers = [...this.observers.values()].map(o => ({ id: o.id, nickname: o.nickname }));

    // Goals: hide gold unless revealed
    const goals: GoalCardPublic[] = this.board.getGoalsPublic();

    return {
      gameType: GameType.SABOTEUR,
      roomCode: '',  // filled in by Room
      phase: this.phase,
      myId: sessionId,
      myRole: isObserver ? 'observer' as const : (player?.role || SaboteurRole.MINER),
      myHand: player?.hand || [],
      players,
      observers,
      board: this.board.toArray(),
      goals,
      currentPlayerId: this.currentPlayerId,
      deckRemaining: this.deck.length,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      scores: Object.fromEntries(this.scores),
      winningSide: this.winningSide,
      isAdmin: false,  // filled in by Room
      adminId: '',     // filled in by Room
    };
  }

  restart(): void {
    this.round = 1;
    this.scores = new Map();
    for (const id of this.playerOrder) {
      this.scores.set(id, 0);
    }
    this.startRound();
  }
}
