export declare enum GameType {
    COCKROACH_POKER = "cockroach_poker",
    SABOTEUR = "saboteur"
}
export declare enum SaboteurRole {
    MINER = "miner",
    SABOTEUR = "saboteur"
}
export declare enum SaboteurPhase {
    WAITING = "waiting",
    PLAYING = "playing",
    MAP_PEEK = "map_peek",// player is looking at a goal card
    ROUND_END = "round_end",
    GAME_OVER = "game_over"
}
export declare enum Direction {
    TOP = "top",
    RIGHT = "right",
    BOTTOM = "bottom",
    LEFT = "left"
}
export declare enum Tool {
    PICKAXE = "pickaxe",
    LANTERN = "lantern",
    CART = "cart"
}
export declare enum SaboteurCardKind {
    PATH = "path",
    BREAK = "break",
    REPAIR = "repair",
    ROCKFALL = "rockfall",
    MAP = "map"
}
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
    templateId: string;
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
    tools: Tool[];
}
export interface SaboteurRockfallCard {
    id: string;
    kind: SaboteurCardKind.ROCKFALL;
}
export interface SaboteurMapCard {
    id: string;
    kind: SaboteurCardKind.MAP;
}
export type SaboteurCard = SaboteurPathCard | SaboteurBreakCard | SaboteurRepairCard | SaboteurRockfallCard | SaboteurMapCard;
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
export interface SaboteurPlayerPublic {
    id: string;
    nickname: string;
    handCount: number;
    brokenTools: Tool[];
    isConnected: boolean;
    passed: boolean;
}
export interface SaboteurGameStateForClient {
    gameType: GameType.SABOTEUR;
    roomCode: string;
    phase: SaboteurPhase;
    myId: string;
    myRole: SaboteurRole | 'observer';
    myHand: SaboteurCard[];
    players: SaboteurPlayerPublic[];
    observers: {
        id: string;
        nickname: string;
    }[];
    board: BoardCell[];
    goals: GoalCardPublic[];
    currentPlayerId: string | null;
    deckRemaining: number;
    round: number;
    totalRounds: number;
    scores: Record<string, number>;
    winningSide: SaboteurRole | null;
    isAdmin: boolean;
    adminId: string;
}
export interface GoalCardPublic {
    x: number;
    y: number;
    revealed: boolean;
    hasGold?: boolean;
}
export declare enum SaboteurClientEvent {
    PLAY_PATH = "sab:playPath",
    PLAY_BREAK = "sab:playBreak",
    PLAY_REPAIR = "sab:playRepair",
    PLAY_ROCKFALL = "sab:playRockfall",
    PLAY_MAP = "sab:playMap",
    MAP_PEEK_DONE = "sab:mapPeekDone",
    DISCARD = "sab:discard",
    NEXT_ROUND = "sab:nextRound"
}
export declare enum SaboteurServerEvent {
    STATE_SYNC = "sab:stateSync",
    GOAL_PEEKED = "sab:goalPeeked",
    ROUND_END = "sab:roundEnd",
    GAME_OVER = "sab:gameOver"
}
//# sourceMappingURL=types.d.ts.map