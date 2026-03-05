import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateVillage,
  generateWorld,
  generateWorldMapData,
  TILE,
  VILLAGE_POSITIONS,
} from './MapGenerator';
import type { Entity, VillageState } from '../../data/types';

vi.mock('../../data/catalog-provider', () => ({
  entityRef: (e: Entity) => `${e.kind.toLowerCase()}:default/${e.metadata.name}`,
  getTeamMembers: vi.fn(),
  getTeamComponents: vi.fn(),
  getTeamApis: vi.fn(),
}));

import { getTeamMembers, getTeamComponents, getTeamApis } from '../../data/catalog-provider';

// ── Factories ──────────────────────────────────────────────────────────────

function makeTeam(name: string, displayName?: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Group',
    metadata: { name },
    spec: displayName ? { type: 'team', profile: { displayName } } : { type: 'team' },
  };
}

function makeComponent(name: string, type = 'service', lifecycle = 'production'): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name },
    spec: { type, lifecycle },
  };
}

function makeUser(name: string, displayName?: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: { name },
    spec: displayName ? { profile: { displayName } } : {},
  };
}

function makeApi(name: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: { name },
    spec: { type: 'openapi' },
  };
}

// ── generateVillage ────────────────────────────────────────────────────────

describe('generateVillage', () => {
  const worldPos = { x: 20, y: 20 };
  const team = makeTeam('alpha-team');

  it('creates one building per component entity', () => {
    const result = generateVillage(team, [makeComponent('svc-a'), makeComponent('svc-b')], [], [], worldPos);
    expect(result.buildings).toHaveLength(2);
  });

  it('creates one building per api entity', () => {
    const result = generateVillage(team, [], [makeApi('api-a'), makeApi('api-b')], [], worldPos);
    expect(result.buildings).toHaveLength(2);
  });

  it('combines components and apis into buildings (components first)', () => {
    const result = generateVillage(
      team,
      [makeComponent('svc-a')],
      [makeApi('api-a')],
      [],
      worldPos,
    );
    expect(result.buildings).toHaveLength(2);
    expect(result.buildings[0].buildingType).toBe('component');
    expect(result.buildings[1].buildingType).toBe('api');
  });

  it('caps buildings at 6 regardless of how many entities provided', () => {
    const components = Array.from({ length: 10 }, (_, i) => makeComponent(`svc-${i}`));
    const result = generateVillage(team, components, [], [], worldPos);
    expect(result.buildings).toHaveLength(6);
  });

  it('caps NPCs at 5 regardless of how many members provided', () => {
    const members = Array.from({ length: 8 }, (_, i) => makeUser(`user-${i}`));
    const result = generateVillage(team, [], [], members, worldPos);
    expect(result.npcs).toHaveLength(5);
  });

  it('offsets building positions from worldPosition', () => {
    const result = generateVillage(team, [makeComponent('svc-a')], [], [], worldPos);
    const b = result.buildings[0];
    expect(b.position.x).toBeGreaterThan(worldPos.x);
    expect(b.position.y).toBeGreaterThan(worldPos.y);
  });

  it('offsets NPC positions from worldPosition', () => {
    const result = generateVillage(team, [], [], [makeUser('alice')], worldPos);
    const npc = result.npcs[0];
    expect(npc.position.x).toBeGreaterThan(worldPos.x);
    expect(npc.position.y).toBeGreaterThan(worldPos.y);
  });

  it('sets entityRef on buildings as "kind:default/name"', () => {
    const result = generateVillage(team, [makeComponent('auth-service')], [], [], worldPos);
    expect(result.buildings[0].entityRef).toBe('component:default/auth-service');
  });

  it('sets entityRef on NPCs as "kind:default/name"', () => {
    const result = generateVillage(team, [], [], [makeUser('alice')], worldPos);
    expect(result.npcs[0].entityRef).toBe('user:default/alice');
  });

  it('uses displayName from spec.profile as NPC name', () => {
    const result = generateVillage(team, [], [], [makeUser('alice', 'Alice Smith')], worldPos);
    expect(result.npcs[0].name).toBe('Alice Smith');
  });

  it('falls back to metadata.name for NPC name when no displayName', () => {
    const result = generateVillage(team, [], [], [makeUser('bob')], worldPos);
    expect(result.npcs[0].name).toBe('bob');
  });

  it('assigns spriteIndex as the NPC position index (0-based)', () => {
    const members = [makeUser('a'), makeUser('b'), makeUser('c')];
    const result = generateVillage(team, [], [], members, worldPos);
    expect(result.npcs.map((n) => n.spriteIndex)).toEqual([0, 1, 2]);
  });

  it('sets teamRef via entityRef of the team', () => {
    const result = generateVillage(team, [], [], [], worldPos);
    expect(result.teamRef).toBe('group:default/alpha-team');
  });

  it('uses team displayName as teamName when available', () => {
    const namedTeam = makeTeam('alpha-team', 'Alpha Warriors');
    const result = generateVillage(namedTeam, [], [], [], worldPos);
    expect(result.teamName).toBe('Alpha Warriors');
  });

  it('falls back to team metadata.name as teamName when no displayName', () => {
    const result = generateVillage(team, [], [], [], worldPos);
    expect(result.teamName).toBe('alpha-team');
  });

  it('stores the worldPosition on the village', () => {
    const result = generateVillage(team, [], [], [], worldPos);
    expect(result.worldPosition).toEqual(worldPos);
  });

  it('stores the component type on each building', () => {
    const result = generateVillage(team, [makeComponent('svc-a', 'website')], [], [], worldPos);
    expect(result.buildings[0].componentType).toBe('website');
  });
});

// ── generateWorld ──────────────────────────────────────────────────────────

describe('generateWorld', () => {
  beforeEach(() => {
    vi.mocked(getTeamMembers).mockReturnValue([]);
    vi.mocked(getTeamComponents).mockReturnValue([]);
    vi.mocked(getTeamApis).mockReturnValue([]);
  });

  it('creates one village per team', () => {
    const world = generateWorld([makeTeam('a'), makeTeam('b')]);
    expect(world.villages).toHaveLength(2);
  });

  it('returns an empty villages array for an empty teams list', () => {
    const world = generateWorld([]);
    expect(world.villages).toHaveLength(0);
  });

  it('caps at 6 villages when more than 6 teams are provided', () => {
    const teams = Array.from({ length: 10 }, (_, i) => makeTeam(`team-${i}`));
    const world = generateWorld(teams);
    expect(world.villages).toHaveLength(6);
  });

  it('assigns worldPosition from VILLAGE_POSITIONS in order', () => {
    const teams = [makeTeam('a'), makeTeam('b')];
    const world = generateWorld(teams);
    expect(world.villages[0].worldPosition).toEqual(VILLAGE_POSITIONS[0]);
    expect(world.villages[1].worldPosition).toEqual(VILLAGE_POSITIONS[1]);
  });

  it('calls getTeamMembers, getTeamComponents, getTeamApis for each team', () => {
    const team = makeTeam('team-a');
    generateWorld([team]);
    expect(getTeamMembers).toHaveBeenCalledWith(team);
    expect(getTeamComponents).toHaveBeenCalledWith(team);
    expect(getTeamApis).toHaveBeenCalledWith(team);
  });

  it('uses data returned by catalog helpers when building villages', () => {
    const member = makeUser('alice');
    const component = makeComponent('svc-a');
    vi.mocked(getTeamMembers).mockReturnValue([member]);
    vi.mocked(getTeamComponents).mockReturnValue([component]);
    const world = generateWorld([makeTeam('team-a')]);
    expect(world.villages[0].npcs).toHaveLength(1);
    expect(world.villages[0].buildings).toHaveLength(1);
  });
});

// ── generateWorldMapData ───────────────────────────────────────────────────

describe('generateWorldMapData', () => {
  const emptyWorld = { villages: [] };

  it('returns a 2D array with the requested height', () => {
    const map = generateWorldMapData(20, 15, emptyWorld);
    expect(map).toHaveLength(15);
  });

  it('returns rows with the requested width', () => {
    const map = generateWorldMapData(20, 15, emptyWorld);
    expect(map[0]).toHaveLength(20);
  });

  it('fills the outer 2 rows and columns with WATER', () => {
    const W = 20;
    const H = 15;
    const map = generateWorldMapData(W, H, emptyWorld);

    for (let y = 0; y < H; y++) {
      expect(map[y][0], `left border y=${y}`).toBe(TILE.WATER);
      expect(map[y][1], `left border+1 y=${y}`).toBe(TILE.WATER);
      expect(map[y][W - 1], `right border y=${y}`).toBe(TILE.WATER);
      expect(map[y][W - 2], `right border-1 y=${y}`).toBe(TILE.WATER);
    }
    for (let x = 0; x < W; x++) {
      expect(map[0][x], `top border x=${x}`).toBe(TILE.WATER);
      expect(map[1][x], `top border+1 x=${x}`).toBe(TILE.WATER);
      expect(map[H - 1][x], `bottom border x=${x}`).toBe(TILE.WATER);
      expect(map[H - 2][x], `bottom border-1 x=${x}`).toBe(TILE.WATER);
    }
  });

  it('fills the inner border (rows/cols 2–3 and W-4 to W-3) with TREE', () => {
    const W = 20;
    const H = 15;
    const map = generateWorldMapData(W, H, emptyWorld);

    // Left inner border
    for (let y = 2; y < H - 2; y++) {
      expect(map[y][2], `tree x=2 y=${y}`).toBe(TILE.TREE);
      expect(map[y][3], `tree x=3 y=${y}`).toBe(TILE.TREE);
    }
    // Right inner border
    for (let y = 2; y < H - 2; y++) {
      expect(map[y][W - 4], `tree x=${W - 4} y=${y}`).toBe(TILE.TREE);
      expect(map[y][W - 3], `tree x=${W - 3} y=${y}`).toBe(TILE.TREE);
    }
  });

  it('paints PATH tiles along the horizontal village road', () => {
    const village: VillageState = {
      teamRef: 'group:default/team-a',
      teamName: 'Team A',
      worldPosition: { x: 4, y: 4 },
      buildings: [],
      npcs: [],
    };
    const mapW = 60;
    const mapH = 40;
    const map = generateWorldMapData(mapW, mapH, { villages: [village] });

    const villageCenterY = village.worldPosition.y + 18;
    // A tile mid-way through the village horizontal road should be PATH
    expect(map[villageCenterY][village.worldPosition.x + 10]).toBe(TILE.PATH);
  });

  it('paints PATH tiles from building positions down to village center', () => {
    const building = {
      entityRef: 'component:default/svc-a',
      name: 'svc-a',
      position: { x: 10, y: 6 },
      buildingType: 'component' as const,
    };
    const village: VillageState = {
      teamRef: 'group:default/team-a',
      teamName: 'Team A',
      worldPosition: { x: 4, y: 4 },
      buildings: [building],
      npcs: [],
    };
    const mapW = 80;
    const mapH = 60;
    const map = generateWorldMapData(mapW, mapH, { villages: [village] });

    const bx = building.position.x + 1;
    const by = building.position.y + 3;
    const villageCenterY = village.worldPosition.y + 18;
    const midY = Math.floor((by + villageCenterY) / 2);

    expect(map[midY][bx]).toBe(TILE.PATH);
  });

  it('only contains valid tile values', () => {
    const validTiles = new Set(Object.values(TILE));
    const map = generateWorldMapData(30, 25, emptyWorld);
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 30; x++) {
        expect(validTiles.has(map[y][x] as (typeof TILE)[keyof typeof TILE])).toBe(true);
      }
    }
  });
});
