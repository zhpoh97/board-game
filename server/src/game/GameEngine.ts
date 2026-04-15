import {
  Card, CritterType, GamePhase, GameVariant, GameStateForClient,
  PlayerPublicState, RoundResolutionInfo, RoyalEffectInfo,
  LOSE_THRESHOLD, LOSE_ALL_TYPES_COUNT, VARIANT_MIN_PLAYERS,
} from '@cockroach-poker/shared';
import { createDeck } from './Deck.js';
import { CardChain } from './CardChain.js';
import { log } from '../utils/logger.js';

export interface PlayerData {
  id: string;
  sessionId: string;
  nickname: string;
  hand: Card[];
  faceUpCards: Card[];
  isConnected: boolean;
}

export class GameEngine {
  phase: GamePhase = GamePhase.WAITING;
  variant: GameVariant = GameVariant.BASE;
  players: Map<string, PlayerData> = new Map(); // keyed by player ID (sessionId)
  observers: Map<string, { id: string; sessionId: string; nickname: string; isConnected: boolean }> = new Map();
  playerOrder: string[] = []; // player IDs in seating order
  activePlayerId: string | null = null;
  currentChain: CardChain | null = null;
  loserId: string | null = null;
  loseReason: string | null = null;
  private _chainPeekerId: string | null = null; // who is currently in CHAIN_PASSING state

  get chainPeekerId(): string | null { return this._chainPeekerId; }

  addPlayer(sessionId: string, nickname: string): { id: string; isObserver: boolean } {
    const existing = this.players.get(sessionId) || this.observers.get(sessionId);
    if (existing) {
      existing.isConnected = true;
      return { id: existing.id, isObserver: this.observers.has(sessionId) };
    }

    const isObserver = this.players.size >= 6 || this.phase !== GamePhase.WAITING;
    const playerInfo = { id: sessionId, sessionId, nickname, isConnected: true };

    if (isObserver) {
      this.observers.set(sessionId, playerInfo);
    } else {
      this.players.set(sessionId, { ...playerInfo, hand: [], faceUpCards: [] });
    }

    return { id: sessionId, isObserver };
  }

  removePlayer(sessionId: string): void {
    this.players.delete(sessionId);
    this.observers.delete(sessionId);
    this.playerOrder = this.playerOrder.filter(id => id !== sessionId);
  }

  setDisconnected(sessionId: string): void {
    const player = this.players.get(sessionId);
    if (player) player.isConnected = false;
    const observer = this.observers.get(sessionId);
    if (observer) observer.isConnected = false;
  }

  setConnected(sessionId: string): void {
    const player = this.players.get(sessionId);
    if (player) player.isConnected = true;
    const observer = this.observers.get(sessionId);
    if (observer) observer.isConnected = true;
  }

  toggleRole(sessionId: string): { success: boolean; error?: string; isObserver: boolean } {
    if (this.phase !== GamePhase.WAITING) {
      return { success: false, error: 'Cannot change role during a game', isObserver: this.observers.has(sessionId) };
    }

    if (this.players.has(sessionId)) {
      // Player → Observer
      const player = this.players.get(sessionId)!;
      this.players.delete(sessionId);
      this.observers.set(sessionId, { id: player.id, sessionId: player.sessionId, nickname: player.nickname, isConnected: player.isConnected });
      return { success: true, isObserver: true };
    } else if (this.observers.has(sessionId)) {
      // Observer → Player
      if (this.players.size >= 6) {
        return { success: false, error: 'Room is full (max 6 players)', isObserver: true };
      }
      const obs = this.observers.get(sessionId)!;
      this.observers.delete(sessionId);
      this.players.set(sessionId, { id: obs.id, sessionId: obs.sessionId, nickname: obs.nickname, hand: [], faceUpCards: [], isConnected: obs.isConnected });
      return { success: true, isObserver: false };
    }

    return { success: false, error: 'Player not found', isObserver: false };
  }

  canStart(): { ok: boolean; error?: string } {
    const minPlayers = VARIANT_MIN_PLAYERS[this.variant];
    if (this.players.size < minPlayers) {
      return { ok: false, error: `Need at least ${minPlayers} players for ${this.variant} variant` };
    }
    return { ok: true };
  }

  startGame(): { success: boolean; error?: string } {
    const check = this.canStart();
    if (!check.ok) return { success: false, error: check.error };

    const deck = createDeck(this.variant);
    this.playerOrder = [...this.players.keys()];
    const playerCount = this.playerOrder.length;

    // Deal cards evenly
    let cardIndex = 0;
    while (cardIndex < deck.length) {
      const playerId = this.playerOrder[cardIndex % playerCount];
      this.players.get(playerId)!.hand.push(deck[cardIndex]);
      cardIndex++;
    }

    // Reset face-up cards
    for (const player of this.players.values()) {
      player.faceUpCards = [];
    }

    // Pick random first player
    this.activePlayerId = this.playerOrder[Math.floor(Math.random() * playerCount)];
    this.currentChain = null;
    this.loserId = null;
    this.loseReason = null;
    this._chainPeekerId = null;
    this.phase = GamePhase.ROUND_START;

    // Check if active player has empty hand (shouldn't happen at start, but safety check)
    const emptyHandResult = this.checkEmptyHand();
    if (emptyHandResult) return { success: true };

    log('GameEngine', `Game started with ${playerCount} players, variant: ${this.variant}`);
    return { success: true };
  }

  passCard(fromId: string, cardId: string, targetId: string, claimedType: CritterType): { success: boolean; error?: string } {
    if (this.phase !== GamePhase.ROUND_START) {
      return { success: false, error: 'Not the right phase to pass a card' };
    }
    if (this.activePlayerId !== fromId) {
      return { success: false, error: 'It\'s not your turn' };
    }
    const player = this.players.get(fromId);
    if (!player) return { success: false, error: 'Player not found' };

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in your hand' };

    if (!this.players.has(targetId)) return { success: false, error: 'Target is not a player' };
    if (targetId === fromId) return { success: false, error: 'Cannot pass to yourself' };
    const target = this.players.get(targetId)!;
    if (!target.isConnected) return { success: false, error: 'Target player is disconnected' };

    const card = player.hand.splice(cardIndex, 1)[0];
    this.currentChain = new CardChain(card, fromId, claimedType, targetId);
    this._chainPeekerId = null;
    this.phase = GamePhase.AWAITING_RESPONSE;

    log('GameEngine', `${fromId} passed card to ${targetId}, claimed: ${claimedType}`);
    return { success: true };
  }

  callTrueFalse(callerId: string, guess: boolean): { success: boolean; error?: string; resolution?: RoundResolutionInfo } {
    if (this.phase !== GamePhase.AWAITING_RESPONSE) {
      return { success: false, error: 'Not the right phase to call' };
    }
    if (!this.currentChain || this.currentChain.currentTarget !== callerId) {
      return { success: false, error: 'You are not the current target' };
    }

    const chain = this.currentChain;
    const card = chain.card;
    const isClaimTrue = card.critter === chain.claimedType;
    const guessedCorrectly = guess === isClaimTrue;

    // If guess is wrong, the caller (target) gets the card. If correct, the passer gets it.
    const loserId = guessedCorrectly ? chain.currentFrom : callerId;
    const loser = this.players.get(loserId)!;
    loser.faceUpCards.push(card);

    const reason = guessedCorrectly
      ? `${this.players.get(callerId)!.nickname} guessed correctly! ${this.players.get(chain.currentFrom)!.nickname} gets the card.`
      : `${this.players.get(callerId)!.nickname} guessed wrong! They get the card.`;

    const resolution: RoundResolutionInfo = {
      card,
      loserId,
      reason,
      wasCorrectGuess: guessedCorrectly,
    };

    this.phase = GamePhase.ROUND_RESOLUTION;
    this.currentChain = null;
    this._chainPeekerId = null;

    log('GameEngine', `Call result: ${reason}`);
    return { success: true, resolution };
  }

  peekAndPass(callerId: string): { success: boolean; error?: string; card?: Card } {
    if (this.phase !== GamePhase.AWAITING_RESPONSE) {
      return { success: false, error: 'Not the right phase to peek' };
    }
    if (!this.currentChain || this.currentChain.currentTarget !== callerId) {
      return { success: false, error: 'You are not the current target' };
    }

    // Check if there are valid targets to pass to
    const connectedPlayerIds = this.playerOrder.filter(id => {
      const p = this.players.get(id)!;
      return p.isConnected && id !== callerId;
    });
    const validTargets = this.currentChain.getValidTargets(connectedPlayerIds);
    if (validTargets.length === 0) {
      return { success: false, error: 'No valid players to pass to. You must call True or False.' };
    }

    this.currentChain.markAsSeen(callerId);
    this._chainPeekerId = callerId;
    this.phase = GamePhase.CHAIN_PASSING;

    log('GameEngine', `${callerId} peeked at the card`);
    return { success: true, card: this.currentChain.card };
  }

  passAfterPeek(fromId: string, targetId: string, claimedType: CritterType): { success: boolean; error?: string } {
    if (this.phase !== GamePhase.CHAIN_PASSING) {
      return { success: false, error: 'Not the right phase to pass after peek' };
    }
    if (this._chainPeekerId !== fromId) {
      return { success: false, error: 'You are not the player who peeked' };
    }
    if (!this.currentChain) return { success: false, error: 'No active chain' };

    if (!this.players.has(targetId)) return { success: false, error: 'Target is not a player' };
    if (targetId === fromId) return { success: false, error: 'Cannot pass to yourself' };
    if (!this.currentChain.canPassTo(targetId)) {
      return { success: false, error: 'That player has already seen this card' };
    }
    const target = this.players.get(targetId)!;
    if (!target.isConnected) return { success: false, error: 'Target player is disconnected' };

    this.currentChain.passTo(targetId, claimedType, fromId);
    this._chainPeekerId = null;
    this.phase = GamePhase.AWAITING_RESPONSE;

    log('GameEngine', `${fromId} passed card to ${targetId} after peek, claimed: ${claimedType}`);
    return { success: true };
  }

  resolveRound(): { nextActiveId: string; royalEffect?: RoyalEffectInfo; gameOver: boolean } | null {
    if (this.phase !== GamePhase.ROUND_RESOLUTION) return null;

    // Check for royal effect (the last resolution's card is on someone's face-up pile now)
    let royalEffect: RoyalEffectInfo | undefined;

    // We need to find the card that was just placed - it's the last card in some player's faceUpCards
    // We'll check all players for royal cards that were just added
    // Actually, we should track this from the resolution. Let's check all face-up cards.
    if (this.variant === GameVariant.ROYAL) {
      royalEffect = this.applyRoyalEffect();
    }

    // Check lose condition
    for (const player of this.players.values()) {
      const critterCounts = new Map<CritterType, number>();
      for (const card of player.faceUpCards) {
        const count = (critterCounts.get(card.critter) || 0) + 1;
        critterCounts.set(card.critter, count);
        if (count >= LOSE_THRESHOLD) {
          this.loserId = player.id;
          this.loseReason = `${player.nickname} has ${LOSE_THRESHOLD} ${card.critter} cards face-up!`;
          this.phase = GamePhase.GAME_OVER;
          log('GameEngine', `Game over: ${this.loseReason}`);
          return { nextActiveId: player.id, royalEffect, gameOver: true };
        }
      }

      // Check if player has one of every critter type
      if (critterCounts.size >= LOSE_ALL_TYPES_COUNT) {
        this.loserId = player.id;
        this.loseReason = `${player.nickname} has collected all ${LOSE_ALL_TYPES_COUNT} critter types!`;
        this.phase = GamePhase.GAME_OVER;
        log('GameEngine', `Game over: ${this.loseReason}`);
        return { nextActiveId: player.id, royalEffect, gameOver: true };
      }
    }

    // The loser of the round starts the next round
    // We need to figure out who just got the card - find who has the most recently added face-up card
    // This is tracked by the caller - the loserId from the resolution
    // We'll use a simpler approach: the caller passes in who lost
    const nextActiveId = this.findRoundLoser();
    this.activePlayerId = nextActiveId;
    this.phase = GamePhase.ROUND_START;

    // Check empty hand
    this.checkEmptyHand();

    return { nextActiveId, royalEffect, gameOver: (this.phase as GamePhase) === GamePhase.GAME_OVER };
  }

  private findRoundLoser(): string {
    // The round loser is whoever most recently got a face-up card
    // We track this via the resolution - but since we're called after resolution,
    // we need to track it differently. Let's add a field.
    // For now, use a simple heuristic: the last card was added to someone's pile.
    // Actually, we should just set this in callTrueFalse. Let me add a field.
    return this._lastRoundLoserId || this.activePlayerId || this.playerOrder[0];
  }

  private _lastRoundLoserId: string | null = null;

  setLastRoundLoser(loserId: string): void {
    this._lastRoundLoserId = loserId;
  }

  private checkEmptyHand(): boolean {
    if (!this.activePlayerId) return false;
    const player = this.players.get(this.activePlayerId);
    if (player && player.hand.length === 0) {
      this.loserId = this.activePlayerId;
      this.loseReason = `${player.nickname} has no cards to play!`;
      this.phase = GamePhase.GAME_OVER;
      log('GameEngine', `Game over: ${this.loseReason}`);
      return true;
    }
    return false;
  }

  private applyRoyalEffect(): RoyalEffectInfo | undefined {
    // Find all royal cards in face-up piles and apply their effect
    // Royal effect: when a royal card is revealed face-up, all OTHER players with face-up cards of that critter take one back into hand
    // We only apply this for newly placed cards. Track with a flag.
    // Simple approach: check each player's face-up cards for royals and see if the effect applies.
    // Actually, the royal effect triggers when the card is first placed face-up.
    // We should only trigger for the card that was JUST placed. Let's find it.

    for (const player of this.players.values()) {
      const lastCard = player.faceUpCards[player.faceUpCards.length - 1];
      if (lastCard && lastCard.isRoyal && !this._processedRoyalCards.has(lastCard.id)) {
        this._processedRoyalCards.add(lastCard.id);
        const critter = lastCard.critter;
        const affectedPlayers: { playerId: string; cardId: string }[] = [];

        for (const otherPlayer of this.players.values()) {
          if (otherPlayer.id === player.id) continue;
          const idx = otherPlayer.faceUpCards.findIndex(c => c.critter === critter && c.id !== lastCard.id);
          if (idx !== -1) {
            const returnedCard = otherPlayer.faceUpCards.splice(idx, 1)[0];
            otherPlayer.hand.push(returnedCard);
            affectedPlayers.push({ playerId: otherPlayer.id, cardId: returnedCard.id });
          }
        }

        if (affectedPlayers.length > 0) {
          return { critter, affectedPlayers };
        }
      }
    }
    return undefined;
  }

  private _processedRoyalCards: Set<string> = new Set();

  getCanPeekAndPass(playerId: string): boolean {
    if (!this.currentChain) return false;
    if (this.currentChain.currentTarget !== playerId) return false;
    const connectedPlayerIds = this.playerOrder.filter(id => {
      const p = this.players.get(id)!;
      return p.isConnected && id !== playerId;
    });
    return this.currentChain.getValidTargets(connectedPlayerIds).length > 0;
  }

  getStateForPlayer(sessionId: string): GameStateForClient {
    const isPlayer = this.players.has(sessionId);
    const isObs = this.observers.has(sessionId);
    const myHand = isPlayer ? this.players.get(sessionId)!.hand : [];

    // In WAITING phase, playerOrder is empty — use the players map directly
    const playerIds = this.playerOrder.length > 0
      ? this.playerOrder
      : [...this.players.keys()];

    const players: PlayerPublicState[] = playerIds.map(id => {
      const p = this.players.get(id)!;
      return {
        id: p.id,
        nickname: p.nickname,
        faceUpCards: p.faceUpCards,
        handCount: p.hand.length,
        isConnected: p.isConnected,
        isObserver: false,
      };
    });

    const observers: PlayerPublicState[] = [...this.observers.values()].map(o => ({
      id: o.id,
      nickname: o.nickname,
      faceUpCards: [],
      handCount: 0,
      isConnected: o.isConnected,
      isObserver: true,
    }));

    return {
      phase: this.phase,
      variant: this.variant,
      roomCode: '', // filled by Room
      players,
      observers,
      myHand,
      activePlayerId: this.activePlayerId,
      currentChain: this.currentChain?.toPublicInfo() || null,
      canPeekAndPass: this.getCanPeekAndPass(sessionId),
      myId: sessionId,
      myRole: isObs ? 'observer' : 'player',
      isAdmin: false, // filled by Room
      adminId: '', // filled by Room
      loserId: this.loserId,
      loseReason: this.loseReason,
    };
  }

  restart(): void {
    for (const player of this.players.values()) {
      player.hand = [];
      player.faceUpCards = [];
    }
    this.playerOrder = [];
    this.activePlayerId = null;
    this.currentChain = null;
    this._chainPeekerId = null;
    this.loserId = null;
    this.loseReason = null;
    this._lastRoundLoserId = null;
    this._processedRoyalCards.clear();
    this.phase = GamePhase.WAITING;
    log('GameEngine', 'Game reset');
  }
}
