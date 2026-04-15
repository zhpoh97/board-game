export enum CritterType {
  COCKROACH = 'cockroach',
  RAT = 'rat',
  STINK_BUG = 'stink_bug',
  TOAD = 'toad',
  BAT = 'bat',
  FLY = 'fly',
  SCORPION = 'scorpion',
  SPIDER = 'spider',
}

export enum GamePhase {
  WAITING = 'WAITING',
  ROUND_START = 'ROUND_START',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  CHAIN_PASSING = 'CHAIN_PASSING',
  ROUND_RESOLUTION = 'ROUND_RESOLUTION',
  GAME_OVER = 'GAME_OVER',
}

export enum GameVariant {
  BASE = 'base',
  ROYAL = 'royal',
}

export interface Card {
  id: string;
  critter: CritterType;
  isRoyal: boolean;
}

export interface ChainStep {
  from: string;
  to: string;
  claimedType: CritterType;
}

export interface ChainPublicInfo {
  claimedType: CritterType;
  currentTarget: string;
  from: string;
  seenByIds: string[];
  originalPasser: string;
}

export interface PlayerPublicState {
  id: string;
  nickname: string;
  faceUpCards: Card[];
  handCount: number;
  isConnected: boolean;
  isObserver: boolean;
}

export interface GameStateForClient {
  phase: GamePhase;
  variant: GameVariant;
  roomCode: string;
  players: PlayerPublicState[];
  observers: PlayerPublicState[];
  myHand: Card[];
  activePlayerId: string | null;
  currentChain: ChainPublicInfo | null;
  canPeekAndPass: boolean;
  myId: string;
  myRole: 'player' | 'observer';
  isAdmin: boolean;
  adminId: string;
  loserId: string | null;
  loseReason: string | null;
}

export interface RoundResolutionInfo {
  card: Card;
  loserId: string;
  reason: string;
  wasCorrectGuess: boolean;
}

export interface RoyalEffectInfo {
  critter: CritterType;
  affectedPlayers: { playerId: string; cardId: string }[];
}
