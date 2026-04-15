import { create } from 'zustand';
import { GameStateForClient, Card, RoundResolutionInfo, SaboteurGameStateForClient } from '@cockroach-poker/shared';

interface GameStore {
  state: GameStateForClient | null;
  sabState: SaboteurGameStateForClient | null;
  resolution: RoundResolutionInfo | null;
  peekedCard: Card | null;
  selectedCardId: string | null;
  sabPeekedGoal: { x: number; y: number; hasGold: boolean } | null;
  setGameState: (state: GameStateForClient) => void;
  setSabState: (state: SaboteurGameStateForClient) => void;
  setResolution: (resolution: RoundResolutionInfo) => void;
  setPeekedCard: (card: Card) => void;
  setSelectedCardId: (id: string | null) => void;
  setSabPeekedGoal: (goal: { x: number; y: number; hasGold: boolean } | null) => void;
  clearPeekedCard: () => void;
  clearResolution: () => void;
  clearState: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  state: null,
  sabState: null,
  resolution: null,
  peekedCard: null,
  selectedCardId: null,
  sabPeekedGoal: null,
  setGameState: (state) => set({ state }),
  setSabState: (sabState) => set({ sabState }),
  setResolution: (resolution) => set({ resolution }),
  setPeekedCard: (card) => set({ peekedCard: card }),
  setSelectedCardId: (selectedCardId) => set({ selectedCardId }),
  setSabPeekedGoal: (sabPeekedGoal) => set({ sabPeekedGoal }),
  clearPeekedCard: () => set({ peekedCard: null }),
  clearResolution: () => set({ resolution: null }),
  clearState: () => set({ state: null, sabState: null, resolution: null, peekedCard: null, selectedCardId: null, sabPeekedGoal: null }),
}));
