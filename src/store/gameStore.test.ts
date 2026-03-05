import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the store
vi.mock('../services/tokenStore', () => ({
  loadBaseUrl: vi.fn(() => null),
  hasLiveToken: vi.fn(() => false),
  clearCredentials: vi.fn(),
  loadToken: vi.fn(async () => null),
}));

vi.mock('../services/live-catalog', () => ({
  initializeLiveCatalog: vi.fn(async () => ({ ok: true, warnings: [], entityCount: 0, teamCount: 0 })),
  clearLiveCatalog: vi.fn(),
}));

vi.mock('../data/catalog-provider', () => ({
  disableLiveCatalog: vi.fn(),
  enableLiveCatalog: vi.fn(),
  isUsingLiveCatalog: vi.fn(() => false),
}));

import { useGameStore } from './gameStore';
import { clearCredentials } from '../services/tokenStore';
import { enableLiveCatalog, disableLiveCatalog } from '../data/catalog-provider';
import { initializeLiveCatalog } from '../services/live-catalog';

// Helper to reset Zustand state between tests
function resetStore() {
  useGameStore.setState({
    dialogueActive: false,
    dialogueLines: [],
    dialogueIndex: 0,
    dialogueEntityRef: null,
    detailPanelEntity: null,
    unlockedEntities: [],
    discoveredVillages: [],
    miniMapVisible: true,
    introShown: false,
    backstageConfigured: false,
    backstageBaseUrl: null,
    catalogLoading: false,
    catalogWarnings: [],
    configPanelOpen: false,
    activeBuilding: null,
    playerPosition: { x: 0, y: 0 },
    currentScene: 'OverworldScene',
  });
}

describe('gameStore — dialogue', () => {
  beforeEach(resetStore);

  const lines = [
    { speaker: 'Alice', text: 'Hello!' },
    { speaker: 'Alice', text: 'Goodbye!' },
  ];

  it('startDialogue sets dialogueActive, lines, index and entityRef', () => {
    useGameStore.getState().startDialogue(lines, 'user:default/alice');
    const s = useGameStore.getState();
    expect(s.dialogueActive).toBe(true);
    expect(s.dialogueLines).toEqual(lines);
    expect(s.dialogueIndex).toBe(0);
    expect(s.dialogueEntityRef).toBe('user:default/alice');
  });

  it('advanceDialogue increments dialogueIndex when not on last line', () => {
    useGameStore.getState().startDialogue(lines, 'user:default/alice');
    useGameStore.getState().advanceDialogue();
    expect(useGameStore.getState().dialogueIndex).toBe(1);
    expect(useGameStore.getState().dialogueActive).toBe(true);
  });

  it('advanceDialogue closes dialogue when on the last line', () => {
    useGameStore.getState().startDialogue(lines, 'user:default/alice');
    useGameStore.getState().advanceDialogue(); // move to index 1
    useGameStore.getState().advanceDialogue(); // last line — closes
    expect(useGameStore.getState().dialogueActive).toBe(false);
  });

  it('closeDialogue resets all dialogue fields', () => {
    useGameStore.getState().startDialogue(lines, 'user:default/alice');
    useGameStore.getState().closeDialogue();
    const s = useGameStore.getState();
    expect(s.dialogueActive).toBe(false);
    expect(s.dialogueLines).toHaveLength(0);
    expect(s.dialogueIndex).toBe(0);
    expect(s.dialogueEntityRef).toBeNull();
  });
});

describe('gameStore — detail panel', () => {
  beforeEach(resetStore);

  const entity = {
    apiVersion: 'backstage.io/v1alpha1' as const,
    kind: 'Component' as const,
    metadata: { name: 'svc-a' },
    spec: {},
  };

  it('showDetailPanel stores the entity', () => {
    useGameStore.getState().showDetailPanel(entity);
    expect(useGameStore.getState().detailPanelEntity).toEqual(entity);
  });

  it('hideDetailPanel clears the entity', () => {
    useGameStore.getState().showDetailPanel(entity);
    useGameStore.getState().hideDetailPanel();
    expect(useGameStore.getState().detailPanelEntity).toBeNull();
  });
});

describe('gameStore — unlockEntity', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('adds a ref to unlockedEntities', () => {
    useGameStore.getState().unlockEntity('component:default/svc-a');
    expect(useGameStore.getState().unlockedEntities).toContain('component:default/svc-a');
  });

  it('is idempotent — does not add the same ref twice', () => {
    useGameStore.getState().unlockEntity('component:default/svc-a');
    useGameStore.getState().unlockEntity('component:default/svc-a');
    expect(useGameStore.getState().unlockedEntities).toHaveLength(1);
  });

  it('persists to localStorage', () => {
    useGameStore.getState().unlockEntity('component:default/svc-a');
    const saved = JSON.parse(localStorage.getItem('lore-save')!);
    expect(saved.unlockedEntities).toContain('component:default/svc-a');
  });
});

describe('gameStore — discoverVillage', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('adds a ref to discoveredVillages', () => {
    useGameStore.getState().discoverVillage('group:default/alpha-team');
    expect(useGameStore.getState().discoveredVillages).toContain('group:default/alpha-team');
  });

  it('is idempotent — does not add the same village twice', () => {
    useGameStore.getState().discoverVillage('group:default/alpha-team');
    useGameStore.getState().discoverVillage('group:default/alpha-team');
    expect(useGameStore.getState().discoveredVillages).toHaveLength(1);
  });

  it('persists to localStorage', () => {
    useGameStore.getState().discoverVillage('group:default/alpha-team');
    const saved = JSON.parse(localStorage.getItem('lore-save')!);
    expect(saved.discoveredVillages).toContain('group:default/alpha-team');
  });
});

describe('gameStore — miniMap', () => {
  beforeEach(resetStore);

  it('toggleMiniMap flips miniMapVisible from true to false', () => {
    useGameStore.setState({ miniMapVisible: true });
    useGameStore.getState().toggleMiniMap();
    expect(useGameStore.getState().miniMapVisible).toBe(false);
  });

  it('toggleMiniMap flips miniMapVisible from false to true', () => {
    useGameStore.setState({ miniMapVisible: false });
    useGameStore.getState().toggleMiniMap();
    expect(useGameStore.getState().miniMapVisible).toBe(true);
  });
});

describe('gameStore — dismissIntro', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('sets introShown to true', () => {
    useGameStore.getState().dismissIntro();
    expect(useGameStore.getState().introShown).toBe(true);
  });

  it('persists introShown to localStorage', () => {
    useGameStore.getState().dismissIntro();
    const saved = JSON.parse(localStorage.getItem('lore-save')!);
    expect(saved.introShown).toBe(true);
  });
});

describe('gameStore — playerPosition', () => {
  beforeEach(resetStore);

  it('updatePlayerPosition stores x and y', () => {
    useGameStore.getState().updatePlayerPosition(42, 17);
    expect(useGameStore.getState().playerPosition).toEqual({ x: 42, y: 17 });
  });
});

describe('gameStore — setCurrentScene', () => {
  beforeEach(resetStore);

  it('updates the currentScene', () => {
    useGameStore.getState().setCurrentScene('BuildingScene');
    expect(useGameStore.getState().currentScene).toBe('BuildingScene');
  });
});

describe('gameStore — setActiveBuilding', () => {
  beforeEach(resetStore);

  it('stores the building ref', () => {
    useGameStore.getState().setActiveBuilding('component:default/svc-a');
    expect(useGameStore.getState().activeBuilding).toBe('component:default/svc-a');
  });

  it('clears the building ref when set to null', () => {
    useGameStore.getState().setActiveBuilding('component:default/svc-a');
    useGameStore.getState().setActiveBuilding(null);
    expect(useGameStore.getState().activeBuilding).toBeNull();
  });
});

describe('gameStore — disconnectBackstage', () => {
  beforeEach(resetStore);

  it('clears backstageConfigured and backstageBaseUrl', () => {
    useGameStore.setState({ backstageConfigured: true, backstageBaseUrl: 'https://bs.example.com' });
    useGameStore.getState().disconnectBackstage();
    const s = useGameStore.getState();
    expect(s.backstageConfigured).toBe(false);
    expect(s.backstageBaseUrl).toBeNull();
  });

  it('calls clearCredentials and disableLiveCatalog', () => {
    useGameStore.getState().disconnectBackstage();
    expect(clearCredentials).toHaveBeenCalled();
    expect(disableLiveCatalog).toHaveBeenCalled();
  });
});

describe('gameStore — setBackstageConnected', () => {
  beforeEach(resetStore);

  it('sets backstageConfigured and backstageBaseUrl on success', async () => {
    await useGameStore.getState().setBackstageConnected('https://bs.example.com');
    const s = useGameStore.getState();
    expect(s.backstageConfigured).toBe(true);
    expect(s.backstageBaseUrl).toBe('https://bs.example.com');
  });

  it('calls enableLiveCatalog on success', async () => {
    await useGameStore.getState().setBackstageConnected('https://bs.example.com');
    expect(enableLiveCatalog).toHaveBeenCalled();
  });

  it('stores catalog warnings from initializeLiveCatalog', async () => {
    vi.mocked(initializeLiveCatalog).mockResolvedValueOnce({
      ok: true,
      warnings: ['No teams found'],
      entityCount: 5,
      teamCount: 0,
    });
    await useGameStore.getState().setBackstageConnected('https://bs.example.com');
    expect(useGameStore.getState().catalogWarnings).toEqual(['No teams found']);
  });

  it('rethrows errors and resets catalogLoading to false', async () => {
    vi.mocked(initializeLiveCatalog).mockRejectedValueOnce(new Error('connection refused'));
    await expect(
      useGameStore.getState().setBackstageConnected('https://bs.example.com'),
    ).rejects.toThrow('connection refused');
    expect(useGameStore.getState().catalogLoading).toBe(false);
  });
});

describe('gameStore — configPanel', () => {
  beforeEach(resetStore);

  it('openConfigPanel sets configPanelOpen to true', () => {
    useGameStore.setState({ configPanelOpen: false });
    useGameStore.getState().openConfigPanel();
    expect(useGameStore.getState().configPanelOpen).toBe(true);
  });

  it('closeConfigPanel sets configPanelOpen to false', () => {
    useGameStore.setState({ configPanelOpen: true });
    useGameStore.getState().closeConfigPanel();
    expect(useGameStore.getState().configPanelOpen).toBe(false);
  });
});
