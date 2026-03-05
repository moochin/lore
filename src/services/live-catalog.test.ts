import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Entity } from '../data/types';

// Mock CatalogClient so we control what getAllEntities returns
vi.mock('./catalog', () => ({
  CatalogClient: vi.fn(),
}));

import { CatalogClient } from './catalog';
import {
  initializeLiveCatalog,
  clearLiveCatalog,
  getAllLiveEntities,
  getLiveEntitiesByKind,
  getEntityByRef,
  getAllTeams,
  getTeamMembers,
  getTeamComponents,
  getTeamApis,
  entityRef,
  getComponentOwner,
  getApiOwnerTeam,
} from './live-catalog';

// ── Factories ──────────────────────────────────────────────────────────────

function makeEntity(
  kind: Entity['kind'],
  name: string,
  specOverrides: Record<string, unknown> = {},
  relations: Entity['relations'] = [],
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind,
    metadata: { name },
    spec: specOverrides,
    relations,
  };
}

// Set up a fake CatalogClient instance before each test.
// Must use a regular function (not arrow) so it can be called with `new`.
function setupCache(entities: Entity[]) {
  const mockClient = { getAllEntities: vi.fn().mockResolvedValue(entities) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(CatalogClient).mockImplementation(function () { return mockClient; } as any);
  return mockClient;
}

// ── entityRef ──────────────────────────────────────────────────────────────

describe('entityRef', () => {
  it('formats as "kind:default/name" in lowercase kind', () => {
    const entity = makeEntity('Component', 'auth-service');
    expect(entityRef(entity)).toBe('component:default/auth-service');
  });

  it('lowercases the kind regardless of original casing', () => {
    const entity = makeEntity('Group', 'platform-team');
    expect(entityRef(entity)).toBe('group:default/platform-team');
  });
});

// ── getEntityByRef ─────────────────────────────────────────────────────────

describe('getEntityByRef', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns undefined for an invalid ref format', () => {
    expect(getEntityByRef('not-a-valid-ref')).toBeUndefined();
  });

  it('returns undefined for a ref that does not match any entity', async () => {
    setupCache([makeEntity('Component', 'svc-a')]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getEntityByRef('component:default/ghost')).toBeUndefined();
  });

  it('resolves a valid ref to the matching entity', async () => {
    const entity = makeEntity('Component', 'auth-service');
    setupCache([entity]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const found = getEntityByRef('component:default/auth-service');
    expect(found?.metadata.name).toBe('auth-service');
  });

  it('is case-insensitive on the kind segment', async () => {
    const entity = makeEntity('Component', 'auth-service');
    setupCache([entity]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    // "Component" should resolve the same as "component"
    expect(getEntityByRef('Component:default/auth-service')?.metadata.name).toBe('auth-service');
  });
});

// ── getAllTeams ────────────────────────────────────────────────────────────

describe('getAllTeams', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns only Group entities with spec.type === "team"', async () => {
    const team = makeEntity('Group', 'alpha-team', { type: 'team' });
    const dept = makeEntity('Group', 'engineering', { type: 'department' });
    const user = makeEntity('User', 'alice');
    setupCache([team, dept, user]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const teams = getAllTeams();
    expect(teams).toHaveLength(1);
    expect(teams[0].metadata.name).toBe('alpha-team');
  });

  it('returns empty array when no team groups exist', async () => {
    setupCache([makeEntity('Group', 'engineering', { type: 'department' })]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getAllTeams()).toHaveLength(0);
  });
});

// ── getLiveEntitiesByKind ──────────────────────────────────────────────────

describe('getLiveEntitiesByKind', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns entities of the requested kind', async () => {
    setupCache([
      makeEntity('Component', 'svc-a'),
      makeEntity('API', 'api-a'),
      makeEntity('Component', 'svc-b'),
    ]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const components = getLiveEntitiesByKind('Component');
    expect(components).toHaveLength(2);
    expect(components.every((e) => e.kind === 'Component')).toBe(true);
  });

  it('returns an empty array when no entities of that kind exist', async () => {
    setupCache([makeEntity('User', 'alice')]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getLiveEntitiesByKind('Component')).toHaveLength(0);
  });
});

// ── getTeamMembers ─────────────────────────────────────────────────────────

describe('getTeamMembers', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns User entities referenced by hasMember relations', async () => {
    const alice = makeEntity('User', 'alice');
    const team = makeEntity('Group', 'alpha-team', { type: 'team' }, [
      { type: 'hasMember', targetRef: 'user:default/alice' },
    ]);
    setupCache([alice, team]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const members = getTeamMembers(team);
    expect(members).toHaveLength(1);
    expect(members[0].metadata.name).toBe('alice');
  });

  it('ignores relations that are not hasMember', async () => {
    const team = makeEntity('Group', 'alpha-team', { type: 'team' }, [
      { type: 'ownerOf', targetRef: 'component:default/svc-a' },
    ]);
    setupCache([team]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getTeamMembers(team)).toHaveLength(0);
  });

  it('returns empty array when team has no relations', async () => {
    const team = makeEntity('Group', 'alpha-team', { type: 'team' });
    setupCache([team]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getTeamMembers(team)).toHaveLength(0);
  });
});

// ── getTeamComponents ──────────────────────────────────────────────────────

describe('getTeamComponents', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns only component entities from ownerOf relations', async () => {
    const svc = makeEntity('Component', 'svc-a');
    const api = makeEntity('API', 'api-a');
    const team = makeEntity('Group', 'alpha-team', { type: 'team' }, [
      { type: 'ownerOf', targetRef: 'component:default/svc-a' },
      { type: 'ownerOf', targetRef: 'api:default/api-a' },
    ]);
    setupCache([svc, api, team]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const components = getTeamComponents(team);
    expect(components).toHaveLength(1);
    expect(components[0].metadata.name).toBe('svc-a');
  });
});

// ── getTeamApis ────────────────────────────────────────────────────────────

describe('getTeamApis', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns only api entities from ownerOf relations', async () => {
    const svc = makeEntity('Component', 'svc-a');
    const api = makeEntity('API', 'api-a');
    const team = makeEntity('Group', 'alpha-team', { type: 'team' }, [
      { type: 'ownerOf', targetRef: 'component:default/svc-a' },
      { type: 'ownerOf', targetRef: 'api:default/api-a' },
    ]);
    setupCache([svc, api, team]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const apis = getTeamApis(team);
    expect(apis).toHaveLength(1);
    expect(apis[0].metadata.name).toBe('api-a');
  });
});

// ── initializeLiveCatalog ──────────────────────────────────────────────────

describe('initializeLiveCatalog', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns ok: true', async () => {
    setupCache([]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.ok).toBe(true);
  });

  it('returns entityCount and teamCount', async () => {
    const team = makeEntity('Group', 'alpha-team', { type: 'team' });
    const component = makeEntity('Component', 'svc-a');
    setupCache([team, component]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.entityCount).toBe(2);
    expect(result.teamCount).toBe(1);
  });

  it('warns when catalog returns 0 entities', async () => {
    setupCache([]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/0 entities/i);
  });

  it('warns when entities exist but no team groups are found', async () => {
    setupCache([makeEntity('Component', 'svc-a')]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/no teams/i);
  });

  it('returns no warnings when entities and teams both exist', async () => {
    setupCache([
      makeEntity('Group', 'alpha-team', { type: 'team' }),
      makeEntity('Component', 'svc-a'),
    ]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.warnings).toHaveLength(0);
  });

  it('filters out malformed entities missing kind', async () => {
    const valid = makeEntity('Component', 'svc-a');
    const malformed = { apiVersion: 'v1', kind: '', metadata: { name: 'bad' }, spec: {} } as unknown as Entity;
    setupCache([valid, malformed]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    // Only the valid one should be in the cache
    expect(result.entityCount).toBe(1);
  });

  it('filters out malformed entities missing metadata.name', async () => {
    const valid = makeEntity('Component', 'svc-a');
    const malformed = { apiVersion: 'v1', kind: 'Component', metadata: { name: '' }, spec: {} } as Entity;
    setupCache([valid, malformed]);
    const result = await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(result.entityCount).toBe(1);
  });
});

// ── getAllLiveEntities & clearLiveCatalog ──────────────────────────────────

describe('getAllLiveEntities / clearLiveCatalog', () => {
  it('returns all loaded entities', async () => {
    clearLiveCatalog();
    const entities = [makeEntity('Component', 'svc-a'), makeEntity('User', 'alice')];
    setupCache(entities);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getAllLiveEntities()).toHaveLength(2);
  });

  it('returns empty array after clearLiveCatalog', async () => {
    setupCache([makeEntity('Component', 'svc-a')]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    clearLiveCatalog();
    expect(getAllLiveEntities()).toHaveLength(0);
  });
});

// ── getComponentOwner ──────────────────────────────────────────────────────

describe('getComponentOwner', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns the first team member who owns the component', async () => {
    const alice = makeEntity('User', 'alice', {}, [
      { type: 'ownerOf', targetRef: 'component:default/svc-a' },
    ]);
    const team = makeEntity('Group', 'alpha-team', { type: 'team' }, [
      { type: 'hasMember', targetRef: 'user:default/alice' },
    ]);
    const svc = makeEntity('Component', 'svc-a', {}, [
      { type: 'ownedBy', targetRef: 'group:default/alpha-team' },
    ]);
    setupCache([alice, team, svc]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const owner = getComponentOwner(svc);
    expect(owner?.metadata.name).toBe('alice');
  });

  it('returns undefined when component has no ownedBy relation', async () => {
    const svc = makeEntity('Component', 'svc-a');
    setupCache([svc]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getComponentOwner(svc)).toBeUndefined();
  });
});

// ── getApiOwnerTeam ────────────────────────────────────────────────────────

describe('getApiOwnerTeam', () => {
  beforeEach(() => {
    clearLiveCatalog();
  });

  it('returns the team that owns the API', async () => {
    const team = makeEntity('Group', 'alpha-team', { type: 'team' });
    const api = makeEntity('API', 'payments-api', {}, [
      { type: 'ownedBy', targetRef: 'group:default/alpha-team' },
    ]);
    setupCache([team, api]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    const ownerTeam = getApiOwnerTeam('api:default/payments-api');
    expect(ownerTeam?.metadata.name).toBe('alpha-team');
  });

  it('returns undefined when api ref does not resolve', async () => {
    setupCache([]);
    await initializeLiveCatalog({ baseUrl: 'https://example.com', token: 'tok' });
    expect(getApiOwnerTeam('api:default/ghost-api')).toBeUndefined();
  });
});
