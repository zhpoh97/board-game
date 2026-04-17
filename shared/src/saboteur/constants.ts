import { Direction, Tool, SaboteurCardKind, PathCardDef, SaboteurRole } from './types.js';

const { TOP, RIGHT, BOTTOM, LEFT } = Direction;

// ─── Path Card Templates ───
// Each template defines the shape. 'connected' templates have internal tunnels
// connecting the openings. 'dead' templates have openings that lead nowhere.

export const PATH_TEMPLATES: Record<string, PathCardDef> = {
  // Connected paths
  straight_h:  { openings: { top: false, right: true, bottom: false, left: true },  connectedGroups: [[LEFT, RIGHT]] },
  straight_v:  { openings: { top: true, right: false, bottom: true, left: false },  connectedGroups: [[TOP, BOTTOM]] },
  curve_tr:    { openings: { top: true, right: true, bottom: false, left: false },  connectedGroups: [[TOP, RIGHT]] },
  curve_tl:    { openings: { top: true, right: false, bottom: false, left: true },  connectedGroups: [[TOP, LEFT]] },
  curve_br:    { openings: { top: false, right: true, bottom: true, left: false },  connectedGroups: [[BOTTOM, RIGHT]] },
  curve_bl:    { openings: { top: false, right: false, bottom: true, left: true },  connectedGroups: [[BOTTOM, LEFT]] },
  t_no_top:    { openings: { top: false, right: true, bottom: true, left: true },   connectedGroups: [[RIGHT, BOTTOM, LEFT]] },
  t_no_right:  { openings: { top: true, right: false, bottom: true, left: true },   connectedGroups: [[TOP, BOTTOM, LEFT]] },
  t_no_bottom: { openings: { top: true, right: true, bottom: false, left: true },   connectedGroups: [[TOP, RIGHT, LEFT]] },
  t_no_left:   { openings: { top: true, right: true, bottom: true, left: false },   connectedGroups: [[TOP, RIGHT, BOTTOM]] },
  cross:       { openings: { top: true, right: true, bottom: true, left: true },    connectedGroups: [[TOP, RIGHT, BOTTOM, LEFT]] },

  // Dead-end paths (openings exist but don't connect through)
  dead_straight_h:  { openings: { top: false, right: true, bottom: false, left: true },  connectedGroups: [] },
  dead_straight_v:  { openings: { top: true, right: false, bottom: true, left: false },  connectedGroups: [] },
  dead_t_no_top:    { openings: { top: false, right: true, bottom: true, left: true },   connectedGroups: [] },
  dead_t_no_right:  { openings: { top: true, right: false, bottom: true, left: true },   connectedGroups: [] },
  dead_t_no_bottom: { openings: { top: true, right: true, bottom: false, left: true },   connectedGroups: [] },
  dead_t_no_left:   { openings: { top: true, right: true, bottom: true, left: false },   connectedGroups: [] },
  dead_cross:       { openings: { top: true, right: true, bottom: true, left: true },    connectedGroups: [] },
};

// ─── Deck Composition ───
export const PATH_CARD_COUNTS: Record<string, number> = {
  straight_h: 3,
  straight_v: 4,
  curve_tr: 4,
  curve_tl: 3,
  curve_br: 3,
  curve_bl: 3,
  t_no_top: 2,
  t_no_right: 2,
  t_no_bottom: 2,
  t_no_left: 2,
  cross: 5,
  dead_straight_h: 1,
  dead_straight_v: 1,
  dead_t_no_top: 1,
  dead_t_no_right: 1,
  dead_t_no_bottom: 1,
  dead_t_no_left: 1,
  dead_cross: 1,
};

export const ACTION_CARD_COUNTS = {
  break_pickaxe: 3,
  break_lantern: 3,
  break_cart: 3,
  repair_pickaxe: 2,
  repair_lantern: 2,
  repair_cart: 2,
  repair_pickaxe_lantern: 1,
  repair_pickaxe_cart: 1,
  repair_lantern_cart: 1,
  rockfall: 3,
  map: 6,
};

// ─── Role Distribution by Player Count ───
export const SABOTEUR_COUNTS: Record<number, number> = {
  2: 1,
  3: 1,
  4: 1,
  5: 2,
  6: 2,
};

// ─── Hand Size by Player Count ───
export const HAND_SIZE: Record<number, number> = {
  2: 6,
  3: 6,
  4: 6,
  5: 6,
  6: 5,
};

// ─── Board Layout ───
export const START_POSITION = { x: 0, y: 0 };
export const GOAL_POSITIONS = [
  { x: 8, y: -2 },
  { x: 8, y: 0 },
  { x: 8, y: 2 },
];

// Start card: crossroads, always placed
export const START_CARD_TEMPLATE = 'cross';

// ─── Scoring ───
// Miners split gold nuggets: 3 players → 3 each, 4 → 2 each, etc.
// Saboteurs get gold if they win.
// Simplified: winning side gets points based on player count
export const MINER_WIN_GOLD: Record<number, number> = {
  2: 3,
  3: 3,
  4: 2,
  5: 2,
  6: 2,
};

export const SABOTEUR_WIN_GOLD: Record<number, number> = {
  2: 4,
  3: 4,
  4: 4,
  5: 3,
  6: 3,
};

// ─── Rounds ───
export const TOTAL_ROUNDS = 3;

// ─── Direction Helpers ───
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.TOP]: Direction.BOTTOM,
  [Direction.BOTTOM]: Direction.TOP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

export const DIRECTION_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  [Direction.TOP]: { dx: 0, dy: -1 },
  [Direction.BOTTOM]: { dx: 0, dy: 1 },
  [Direction.LEFT]: { dx: -1, dy: 0 },
  [Direction.RIGHT]: { dx: 1, dy: 0 },
};

export const ALL_DIRECTIONS = [Direction.TOP, Direction.RIGHT, Direction.BOTTOM, Direction.LEFT];

export const SABOTEUR_MIN_PLAYERS = 2;
export const SABOTEUR_MAX_PLAYERS = 6;
