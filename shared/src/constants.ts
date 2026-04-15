import { CritterType, GameVariant } from './types.js';

export const ALL_CRITTERS = Object.values(CritterType);

export const CARDS_PER_CRITTER = 8;
export const ROYAL_CARDS_PER_CRITTER = 1;

export const BASE_DECK_SIZE = ALL_CRITTERS.length * CARDS_PER_CRITTER; // 64
export const ROYAL_DECK_SIZE = BASE_DECK_SIZE + ALL_CRITTERS.length * ROYAL_CARDS_PER_CRITTER; // 72

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const LOSE_THRESHOLD = 4; // 4 of same critter face-up = lose
export const LOSE_ALL_TYPES_COUNT = ALL_CRITTERS.length; // having one of each type = lose

export const VARIANT_MIN_PLAYERS: Record<GameVariant, number> = {
  [GameVariant.BASE]: 2,
  [GameVariant.ROYAL]: 3,
};

export const ROOM_CODE_LENGTH = 4;
export const ROOM_CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export const ROUND_RESOLUTION_DELAY_MS = 2000; // 2 seconds for animation
