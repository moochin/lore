import { create } from 'zustand';
import type { Entity } from '../data/types';

export interface DialogueLine {
  speaker: string;
  text: string;
}

const STORAGE_KEY = 'lore-save';

interface SaveData {
  unlockedEntities: string[];
  discoveredVillages: string[];
  introShown: boolean;
}

function loadSave(): Partial<SaveData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SaveData>;
  } catch {
    return {};
  }
}

function persistSave(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable
  }
}

const saved = loadSave();

interface GameState {
  // Scene tracking
  currentScene: string;
  setCurrentScene: (scene: string) => void;

  // Dialogue system
  dialogueActive: boolean;
  dialogueLines: DialogueLine[];
  dialogueIndex: number;
  dialogueEntityRef: string | null;
  startDialogue: (lines: DialogueLine[], entityRef: string) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;

  // Detail panel
  detailPanelEntity: Entity | null;
  showDetailPanel: (entity: Entity) => void;
  hideDetailPanel: () => void;

  // Unlock tracking
  unlockedEntities: string[];
  unlockEntity: (ref: string) => void;

  // Village discovery
  discoveredVillages: string[];
  discoverVillage: (ref: string) => void;

  // Active building (for BuildingScene)
  activeBuilding: string | null;
  setActiveBuilding: (ref: string | null) => void;

  // Player position (for mini-map)
  playerPosition: { x: number; y: number };
  updatePlayerPosition: (x: number, y: number) => void;

  // Mini-map
  miniMapVisible: boolean;
  toggleMiniMap: () => void;

  // Intro modal
  introShown: boolean;
  dismissIntro: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: 'OverworldScene',
  setCurrentScene: (scene) => set({ currentScene: scene }),

  // Dialogue
  dialogueActive: false,
  dialogueLines: [],
  dialogueIndex: 0,
  dialogueEntityRef: null,
  startDialogue: (lines, entityRef) =>
    set({
      dialogueActive: true,
      dialogueLines: lines,
      dialogueIndex: 0,
      dialogueEntityRef: entityRef,
    }),
  advanceDialogue: () => {
    const { dialogueIndex, dialogueLines } = get();
    if (dialogueIndex < dialogueLines.length - 1) {
      set({ dialogueIndex: dialogueIndex + 1 });
    } else {
      set({ dialogueActive: false });
    }
  },
  closeDialogue: () =>
    set({
      dialogueActive: false,
      dialogueLines: [],
      dialogueIndex: 0,
      dialogueEntityRef: null,
    }),

  // Detail panel
  detailPanelEntity: null,
  showDetailPanel: (entity) => set({ detailPanelEntity: entity }),
  hideDetailPanel: () => set({ detailPanelEntity: null }),

  // Unlock tracking (persisted)
  unlockedEntities: saved.unlockedEntities ?? [],
  unlockEntity: (ref) => {
    const { unlockedEntities } = get();
    if (!unlockedEntities.includes(ref)) {
      const updated = [...unlockedEntities, ref];
      set({ unlockedEntities: updated });
      persistSave({
        unlockedEntities: updated,
        discoveredVillages: get().discoveredVillages,
        introShown: get().introShown,
      });
    }
  },

  // Village discovery (persisted)
  discoveredVillages: saved.discoveredVillages ?? [],
  discoverVillage: (ref) => {
    const { discoveredVillages } = get();
    if (!discoveredVillages.includes(ref)) {
      const updated = [...discoveredVillages, ref];
      set({ discoveredVillages: updated });
      persistSave({
        unlockedEntities: get().unlockedEntities,
        discoveredVillages: updated,
        introShown: get().introShown,
      });
    }
  },

  // Active building
  activeBuilding: null,
  setActiveBuilding: (ref) => set({ activeBuilding: ref }),

  // Player position
  playerPosition: { x: 0, y: 0 },
  updatePlayerPosition: (x, y) => set({ playerPosition: { x, y } }),

  // Mini-map
  miniMapVisible: true,
  toggleMiniMap: () => set((s) => ({ miniMapVisible: !s.miniMapVisible })),

  // Intro modal (persisted)
  introShown: saved.introShown ?? false,
  dismissIntro: () => {
    set({ introShown: true });
    persistSave({
      unlockedEntities: get().unlockedEntities,
      discoveredVillages: get().discoveredVillages,
      introShown: true,
    });
  },
}));
