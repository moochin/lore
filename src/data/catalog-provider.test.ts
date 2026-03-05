import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Entity } from './types';

// We use manual mocks for both data sources so we can verify routing

vi.mock('./mock-catalog', () => ({
  mockCatalog: [{ kind: 'Component', metadata: { name: 'mock-svc' }, spec: {}, apiVersion: 'v1' }],
  getEntityByRef: vi.fn((ref: string) => ({ metadata: { name: `mock:${ref}` } })),
  getEntitiesByKind: vi.fn(() => []),
  getAllTeams: vi.fn(() => []),
  getTeamByRef: vi.fn(() => undefined),
  getTeamMembers: vi.fn(() => []),
  getTeamComponents: vi.fn(() => []),
  getTeamApis: vi.fn(() => []),
  entityRef: vi.fn((e: Entity) => `mock-ref:${e.metadata.name}`),
  getComponentOwner: vi.fn(() => undefined),
  getApiOwnerTeam: vi.fn(() => undefined),
}));

vi.mock('../services/live-catalog', () => ({
  getAllLiveEntities: vi.fn(() => []),
  getEntityByRef: vi.fn((ref: string) => ({ metadata: { name: `live:${ref}` } })),
  getLiveEntitiesByKind: vi.fn(() => []),
  getAllTeams: vi.fn(() => []),
  getTeamMembers: vi.fn(() => []),
  getTeamComponents: vi.fn(() => []),
  getTeamApis: vi.fn(() => []),
  entityRef: vi.fn((e: Entity) => `live-ref:${e.metadata.name}`),
  getComponentOwner: vi.fn(() => undefined),
  getApiOwnerTeam: vi.fn(() => undefined),
  clearLiveCatalog: vi.fn(),
}));

import * as mockCatalog from './mock-catalog';
import * as liveCatalog from '../services/live-catalog';
import {
  enableLiveCatalog,
  disableLiveCatalog,
  isUsingLiveCatalog,
  getEntityByRef,
  getAllTeams,
  getTeamMembers,
  getTeamComponents,
  getTeamApis,
  entityRef,
  getAllEntities,
} from './catalog-provider';

const dummyEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'svc-a' },
  spec: {},
};

// Reset to mock mode before each test
beforeEach(() => {
  disableLiveCatalog();
  vi.clearAllMocks();
});

// ── State transitions ──────────────────────────────────────────────────────

describe('isUsingLiveCatalog', () => {
  it('returns false by default', () => {
    expect(isUsingLiveCatalog()).toBe(false);
  });

  it('returns true after enableLiveCatalog', () => {
    enableLiveCatalog();
    expect(isUsingLiveCatalog()).toBe(true);
  });

  it('returns false after disableLiveCatalog', () => {
    enableLiveCatalog();
    disableLiveCatalog();
    expect(isUsingLiveCatalog()).toBe(false);
  });
});

describe('disableLiveCatalog', () => {
  it('calls clearLiveCatalog to flush the cache', () => {
    enableLiveCatalog();
    disableLiveCatalog();
    expect(liveCatalog.clearLiveCatalog).toHaveBeenCalled();
  });
});

// ── Routing in mock mode ───────────────────────────────────────────────────

describe('routing — mock mode', () => {
  it('getAllEntities returns the mock catalog array', () => {
    const result = getAllEntities();
    expect(result).toEqual(mockCatalog.mockCatalog);
  });

  it('getEntityByRef calls mock getEntityByRef', () => {
    getEntityByRef('component:default/svc-a');
    expect(mockCatalog.getEntityByRef).toHaveBeenCalledWith('component:default/svc-a');
    expect(liveCatalog.getEntityByRef).not.toHaveBeenCalled();
  });

  it('getAllTeams calls mock getAllTeams', () => {
    getAllTeams();
    expect(mockCatalog.getAllTeams).toHaveBeenCalled();
    expect(liveCatalog.getAllTeams).not.toHaveBeenCalled();
  });

  it('getTeamMembers calls mock getTeamMembers', () => {
    getTeamMembers(dummyEntity);
    expect(mockCatalog.getTeamMembers).toHaveBeenCalledWith(dummyEntity);
    expect(liveCatalog.getTeamMembers).not.toHaveBeenCalled();
  });

  it('getTeamComponents calls mock getTeamComponents', () => {
    getTeamComponents(dummyEntity);
    expect(mockCatalog.getTeamComponents).toHaveBeenCalledWith(dummyEntity);
    expect(liveCatalog.getTeamComponents).not.toHaveBeenCalled();
  });

  it('getTeamApis calls mock getTeamApis', () => {
    getTeamApis(dummyEntity);
    expect(mockCatalog.getTeamApis).toHaveBeenCalledWith(dummyEntity);
    expect(liveCatalog.getTeamApis).not.toHaveBeenCalled();
  });

  it('entityRef calls mock entityRef', () => {
    entityRef(dummyEntity);
    expect(mockCatalog.entityRef).toHaveBeenCalledWith(dummyEntity);
    expect(liveCatalog.entityRef).not.toHaveBeenCalled();
  });
});

// ── Routing in live mode ───────────────────────────────────────────────────

describe('routing — live mode', () => {
  beforeEach(() => {
    enableLiveCatalog();
    vi.clearAllMocks();
  });

  it('getAllEntities calls getAllLiveEntities', () => {
    getAllEntities();
    expect(liveCatalog.getAllLiveEntities).toHaveBeenCalled();
    expect(mockCatalog.mockCatalog).toBeTruthy(); // mock catalog unchanged, just not called
  });

  it('getEntityByRef calls live getEntityByRef', () => {
    getEntityByRef('component:default/svc-a');
    expect(liveCatalog.getEntityByRef).toHaveBeenCalledWith('component:default/svc-a');
    expect(mockCatalog.getEntityByRef).not.toHaveBeenCalled();
  });

  it('getAllTeams calls live getAllTeams', () => {
    getAllTeams();
    expect(liveCatalog.getAllTeams).toHaveBeenCalled();
    expect(mockCatalog.getAllTeams).not.toHaveBeenCalled();
  });

  it('getTeamMembers calls live getTeamMembers', () => {
    getTeamMembers(dummyEntity);
    expect(liveCatalog.getTeamMembers).toHaveBeenCalledWith(dummyEntity);
    expect(mockCatalog.getTeamMembers).not.toHaveBeenCalled();
  });

  it('getTeamComponents calls live getTeamComponents', () => {
    getTeamComponents(dummyEntity);
    expect(liveCatalog.getTeamComponents).toHaveBeenCalledWith(dummyEntity);
    expect(mockCatalog.getTeamComponents).not.toHaveBeenCalled();
  });

  it('getTeamApis calls live getTeamApis', () => {
    getTeamApis(dummyEntity);
    expect(liveCatalog.getTeamApis).toHaveBeenCalledWith(dummyEntity);
    expect(mockCatalog.getTeamApis).not.toHaveBeenCalled();
  });

  it('entityRef calls live entityRef', () => {
    entityRef(dummyEntity);
    expect(liveCatalog.entityRef).toHaveBeenCalledWith(dummyEntity);
    expect(mockCatalog.entityRef).not.toHaveBeenCalled();
  });
});
