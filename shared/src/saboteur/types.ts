// ─── Game Type (shared across all games) ───
export enum GameType {
  COCKROACH_POKER = 'cockroach_poker',
  SABOTEUR = 'saboteur',
}

// ─── Saboteur Enums ───
export enum SaboteurRole {
  MINER = 'miner',
  SABOTEUR = 'saboteur',
}

export enum SaboteurPhase {
  WAITING = 'waiting',
  PLAYING = 'playing',
  MAP_PEEK = 'map_peek',       // player is looking at a goal card
  ROUND_END = 'round_end',
  GAME_OVER = 'game_over',
}

export enum Direction {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
}

export enum Tool {
  PICKAXE = 'pickaxe',
  LANTERN = 'lantern',
  CART = 'cart',
}

export enum SaboteurCardKind {
  PATH = 'path',
  BREAK = 'break',
  REPAIR = 'repair',
  ROCKFALL = 'rockfall',
  MAP = 'map',
}

// ─── Card Types ───
export interface PathCardDef {
  /** Which sides have openings */
  openings: Record<Direction, boolean>;
  /** Groups of sides that are connected through the card's interior.
   *  e.g. [['top','bottom'],['left','right']] means two separate tunnels cross. */
  connectedGroups: Direction[][];
}

export interface SaboteurPathCard {
  id: string;
  kind: SaboteurCardKind.PATH;
  templateId: string;   // references PATH_TEMPLATES key
  openings: Record<Direction, boolean>;
  connectedGroups: Direction[][];
}

export interface SaboteurBreakCard {
  id: string;
  kind: SaboteurCardKind.BREAK;
  tool: Tool;
}

export interface SaboteurRepairCard {
  id: string;
  kind: SaboteurCardKind.REPAIR;
  tools: Tool[];  // 1 or 2 tools that can be repaired
}

export interface SaboteurRockfallCard {
  id: string;
  kind: SaboteurCardKind.ROCKFALL;
}

export interface SaboteurMapCard {
  id: string;
  kind: SaboteurCardKind.MAP;
}

export type SaboteurCard =
  | SaboteurPathCard
  | SaboteurBreakCard
  | SaboteurRepairCard
  | SaboteurRockfallCard
  | SaboteurMapCard;

// ─── Board ───
export interface BoardCell {
  x: number;
  y: number;
  card: SaboteurPathCard;
}

export interface GoalCard {
  x: number;
  y: number;
  hasGold: boolean;
  revealed: boolean;
}

// ─── Player State (public) ───
export interface SaboteurPlayerPublic {
  id: string;
  nickname: string;
  handCount: number;
  brokenTools: Tool[];
  isConnected: boolean;
  passed: boolean;  // true if player discarded/has no cards this round
}

// ─── Client Game State ───
export interface SaboteurGameStateForClient {
  gameType: GameType.SABOTEUR;
  roomCode: string;
  phase: SaboteurPhase;
  myId: string;
  myRole: SaboteurRole | 'observer';
  myHand: SaboteurCard[];
  players: SaboteurPlayerPublic[];
  observers: { id: string; nickname: string }[];
  board: BoardCell[];
  goals: GoalCardPublic[];
  currentPlayerId: string | null;
  deckRemaining: number;
  round: number;
  totalRounds: number;
  scores: Record<string, number>;
  winningSide: SaboteurRole | null;  // set at round end
  isAdmin: boolean;
  adminId: string;
}

export interface GoalCardPublic {
  x: number;
  y: number;
  revealed: boolean;
  hasGold?: boolean;  // only present if revealed
}

// ─── Events (Saboteur-specific) ───
export enum SaboteurClientEvent {
  PLAY_PATH = 'sab:playPath',
  PLAY_BREAK = 'sab:playBreak',
  PLAY_REPAIR = 'sab:playRepair',
  PLAY_ROCKFALL = 'sab:playRockfall',
  PLAY_MAP = 'sab:playMap',
  MAP_PEEK_DONE = 'sab:mapPeekDone',
  DISCARD = 'sab:discard',
  NEXT_ROUND = 'sab:nextRound',
}

export enum SaboteurServerEvent {
  STATE_SYNC = 'sab:stateSync',
  GOAL_PEEKED = 'sab:goalPeeked',
  ROUND_END = 'sab:roundEnd',
  GAME_OVER = 'sab:gameOver',
}
