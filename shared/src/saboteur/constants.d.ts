import { Direction, PathCardDef } from './types.js';
export declare const PATH_TEMPLATES: Record<string, PathCardDef>;
export declare const PATH_CARD_COUNTS: Record<string, number>;
export declare const ACTION_CARD_COUNTS: {
    break_pickaxe: number;
    break_lantern: number;
    break_cart: number;
    repair_pickaxe: number;
    repair_lantern: number;
    repair_cart: number;
    repair_pickaxe_lantern: number;
    repair_pickaxe_cart: number;
    repair_lantern_cart: number;
    rockfall: number;
    map: number;
};
export declare const SABOTEUR_COUNTS: Record<number, number>;
export declare const HAND_SIZE: Record<number, number>;
export declare const START_POSITION: {
    x: number;
    y: number;
};
export declare const GOAL_POSITIONS: {
    x: number;
    y: number;
}[];
export declare const START_CARD_TEMPLATE = "cross";
export declare const MINER_WIN_GOLD: Record<number, number>;
export declare const SABOTEUR_WIN_GOLD: Record<number, number>;
export declare const TOTAL_ROUNDS = 3;
export declare const OPPOSITE_DIRECTION: Record<Direction, Direction>;
export declare const DIRECTION_OFFSET: Record<Direction, {
    dx: number;
    dy: number;
}>;
export declare const ALL_DIRECTIONS: Direction[];
export declare const SABOTEUR_MIN_PLAYERS = 2;
export declare const SABOTEUR_MAX_PLAYERS = 6;
//# sourceMappingURL=constants.d.ts.map