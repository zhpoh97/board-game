import { Card, CritterType, GameVariant, ALL_CRITTERS, CARDS_PER_CRITTER, ROYAL_CARDS_PER_CRITTER } from '@cockroach-poker/shared';
import { v4 as uuidv4 } from 'uuid';

export function createDeck(variant: GameVariant): Card[] {
  const cards: Card[] = [];

  for (const critter of ALL_CRITTERS) {
    for (let i = 0; i < CARDS_PER_CRITTER; i++) {
      cards.push({ id: uuidv4(), critter, isRoyal: false });
    }
    if (variant === GameVariant.ROYAL) {
      for (let i = 0; i < ROYAL_CARDS_PER_CRITTER; i++) {
        cards.push({ id: uuidv4(), critter, isRoyal: true });
      }
    }
  }

  return shuffle(cards);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
