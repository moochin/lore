import { create } from 'zustand';

interface GameState {
  currentScene: string;
  setCurrentScene: (scene: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'OverworldScene',
  setCurrentScene: (scene) => set({ currentScene: scene }),
}));
