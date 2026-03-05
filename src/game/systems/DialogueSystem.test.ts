import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNPCDialogue, generateBuildingInfo, generateBuildingNPCDialogue } from './DialogueSystem';
import type { Entity } from '../../data/types';

vi.mock('../../data/catalog-provider', () => ({
  entityRef: (e: Entity) => `${e.kind.toLowerCase()}:default/${e.metadata.name}`,
  getEntityByRef: vi.fn(),
  getApiOwnerTeam: vi.fn(),
}));

import { getEntityByRef, getApiOwnerTeam } from '../../data/catalog-provider';

// ── Factories ──────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<Entity> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: { name: 'alice' },
    spec: {},
    ...overrides,
  };
}

function makeComponent(overrides: Partial<Entity> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'auth-service' },
    spec: { type: 'service', lifecycle: 'production' },
    ...overrides,
  };
}

function makeGroup(overrides: Partial<Entity> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Group',
    metadata: { name: 'platform-team' },
    spec: { type: 'team' },
    ...overrides,
  };
}

function makeApi(overrides: Partial<Entity> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'API',
    metadata: { name: 'payments-api' },
    spec: { type: 'openapi' },
    ...overrides,
  };
}

// ── generateNPCDialogue ────────────────────────────────────────────────────

describe('generateNPCDialogue', () => {
  beforeEach(() => {
    vi.mocked(getEntityByRef).mockReturnValue(undefined);
    vi.mocked(getApiOwnerTeam).mockReturnValue(undefined);
  });

  it('uses displayName from spec.profile in the greeting', () => {
    const user = makeUser({ spec: { profile: { displayName: 'Alice Smith' } } });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('Alice Smith');
  });

  it('falls back to metadata.name when displayName is absent', () => {
    const user = makeUser({ spec: {} });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('alice');
  });

  it('defaults to "adventurer" when spec.role is absent', () => {
    const user = makeUser({ spec: {} });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('adventurer');
  });

  it('uses spec.role in the greeting', () => {
    const user = makeUser({ spec: { role: 'engineer' } });
    // rpgFlavor is not applied to the greeting itself, the role is inserted verbatim
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('engineer');
  });

  it('falls back to "this guild" when no team relation exists', () => {
    const user = makeUser({ spec: {} });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('this guild');
  });

  it('falls back to "this guild" when memberOf relation does not resolve', () => {
    vi.mocked(getEntityByRef).mockReturnValue(undefined);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'memberOf', targetRef: 'group:default/unknown' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('this guild');
  });

  it('uses the team displayName when the team entity resolves', () => {
    const team = makeGroup({
      spec: { type: 'team', profile: { displayName: 'Platform Guild' } },
    });
    vi.mocked(getEntityByRef).mockReturnValue(team);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'memberOf', targetRef: 'group:default/platform-team' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('Platform Guild');
  });

  it('uses team metadata.name when team has no displayName', () => {
    const team = makeGroup({ spec: { type: 'team' } });
    vi.mocked(getEntityByRef).mockReturnValue(team);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'memberOf', targetRef: 'group:default/platform-team' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines[0]).toContain('platform-team');
  });

  it('produces exactly 2 lines (greeting + closing) when entity has no description or relations', () => {
    const user = makeUser({ spec: {}, metadata: { name: 'carol' } });
    const lines = generateNPCDialogue(user);
    expect(lines).toHaveLength(2);
  });

  it('applies rpgFlavor to the description line', () => {
    const user = makeUser({
      spec: {},
      metadata: {
        name: 'bob',
        description: 'An engineer focused on infrastructure.',
      },
    });
    const lines = generateNPCDialogue(user);
    expect(lines.some((l) => l.includes('artisan'))).toBe(true);
    expect(lines.some((l) => l.includes("the realm's foundations"))).toBe(true);
    expect(lines.some((l) => l.includes('devoted to the craft of'))).toBe(true);
  });

  it('generates "battle-tested and reliable" for production lifecycle', () => {
    const component = makeComponent({ spec: { type: 'service', lifecycle: 'production' } });
    vi.mocked(getEntityByRef).mockReturnValue(component);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'ownerOf', targetRef: 'component:default/auth-service' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines.some((l) => l.includes('battle-tested and reliable'))).toBe(true);
  });

  it('generates experimentation text for experimental lifecycle', () => {
    const component = makeComponent({ spec: { type: 'service', lifecycle: 'experimental' } });
    vi.mocked(getEntityByRef).mockReturnValue(component);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'ownerOf', targetRef: 'component:default/auth-service' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines.some((l) => l.includes('still being forged in the fires of experimentation'))).toBe(true);
  });

  it('generates "in active development" for any other lifecycle value', () => {
    const component = makeComponent({ spec: { type: 'service', lifecycle: 'deprecated' } });
    vi.mocked(getEntityByRef).mockReturnValue(component);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'ownerOf', targetRef: 'component:default/auth-service' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines.some((l) => l.includes('in active development'))).toBe(true);
  });

  it('generates an API ownership line including the api type', () => {
    const api = makeApi({ spec: { type: 'grpc' }, metadata: { name: 'data-api' } });
    vi.mocked(getEntityByRef).mockReturnValue(api);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'ownerOf', targetRef: 'api:default/data-api' }],
    });
    const lines = generateNPCDialogue(user);
    expect(lines.some((l) => l.includes('data-api') && l.includes('grpc'))).toBe(true);
  });

  it('skips owned entities that do not resolve via getEntityByRef', () => {
    vi.mocked(getEntityByRef).mockReturnValue(undefined);
    const user = makeUser({
      spec: {},
      relations: [{ type: 'ownerOf', targetRef: 'component:default/ghost-service' }],
    });
    // Should not throw and should still produce greeting + closing
    expect(() => generateNPCDialogue(user)).not.toThrow();
    const lines = generateNPCDialogue(user);
    expect(lines).toHaveLength(2);
  });

  it('always ends with one of the known closing lines', () => {
    const closings = [
      'May your deploys be swift and your logs be clear!',
      'Safe travels through the service mesh, friend.',
      'Return anytime — my door is always open.',
      'Go forth, and may your pipelines never fail!',
    ];
    const user = makeUser({ spec: {} });
    const lines = generateNPCDialogue(user);
    expect(closings).toContain(lines[lines.length - 1]);
  });
});

// ── generateBuildingInfo ───────────────────────────────────────────────────

describe('generateBuildingInfo', () => {
  beforeEach(() => {
    vi.mocked(getEntityByRef).mockReturnValue(undefined);
  });

  it('formats the first line as "=== <name> ==="', () => {
    const lines = generateBuildingInfo(makeComponent());
    expect(lines[0]).toBe('=== auth-service ===');
  });

  it('includes type and lifecycle on the second line', () => {
    const lines = generateBuildingInfo(makeComponent({ spec: { type: 'service', lifecycle: 'production' } }));
    expect(lines[1]).toContain('service');
    expect(lines[1]).toContain('production');
  });

  it('falls back to kind.toLowerCase() for type when spec.type is absent', () => {
    const entity = makeApi({ spec: {} });
    const lines = generateBuildingInfo(entity);
    expect(lines[1]).toContain('api');
  });

  it('falls back to "unknown" for lifecycle when spec.lifecycle is absent', () => {
    const entity = makeComponent({ spec: { type: 'service' } });
    const lines = generateBuildingInfo(entity);
    expect(lines[1]).toContain('unknown');
  });

  it('includes "No description available." when description is absent', () => {
    const entity = makeComponent({ metadata: { name: 'auth-service' } });
    const lines = generateBuildingInfo(entity);
    expect(lines).toContain('No description available.');
  });

  it('includes the description when present', () => {
    const entity = makeComponent({
      metadata: { name: 'auth-service', description: 'Handles authentication.' },
    });
    const lines = generateBuildingInfo(entity);
    expect(lines).toContain('Handles authentication.');
  });

  it('includes a Tags line when tags are present', () => {
    const entity = makeComponent({
      metadata: { name: 'auth-service', tags: ['typescript', 'nodejs'] },
    });
    const lines = generateBuildingInfo(entity);
    const tagsLine = lines.find((l) => l.startsWith('Tags:'));
    expect(tagsLine).toBeTruthy();
    expect(tagsLine).toContain('typescript');
    expect(tagsLine).toContain('nodejs');
  });

  it('omits the Tags section when no tags are present', () => {
    const entity = makeComponent({ metadata: { name: 'auth-service' } });
    const lines = generateBuildingInfo(entity);
    expect(lines.some((l) => l.startsWith('Tags:'))).toBe(false);
  });

  it('includes a Provides section for providesApi relations', () => {
    vi.mocked(getEntityByRef).mockReturnValue(makeApi({ metadata: { name: 'auth-api' } }));
    const entity = makeComponent({
      relations: [{ type: 'providesApi', targetRef: 'api:default/auth-api' }],
    });
    const lines = generateBuildingInfo(entity);
    expect(lines).toContain('Provides:');
    expect(lines.some((l) => l.includes('auth-api'))).toBe(true);
  });

  it('includes a Consumes section for consumesApi relations', () => {
    vi.mocked(getEntityByRef).mockReturnValue(makeApi({ metadata: { name: 'payment-api' } }));
    const entity = makeComponent({
      relations: [{ type: 'consumesApi', targetRef: 'api:default/payment-api' }],
    });
    const lines = generateBuildingInfo(entity);
    expect(lines).toContain('Consumes:');
    expect(lines.some((l) => l.includes('payment-api'))).toBe(true);
  });

  it('falls back to raw targetRef when the API entity does not resolve', () => {
    vi.mocked(getEntityByRef).mockReturnValue(undefined);
    const entity = makeComponent({
      relations: [{ type: 'consumesApi', targetRef: 'api:default/unknown-api' }],
    });
    const lines = generateBuildingInfo(entity);
    expect(lines.some((l) => l.includes('api:default/unknown-api'))).toBe(true);
  });
});

// ── generateBuildingNPCDialogue ────────────────────────────────────────────

describe('generateBuildingNPCDialogue', () => {
  it('uses displayName from spec.profile in the greeting', () => {
    const npc = makeUser({ spec: { profile: { displayName: 'Sir Bob' } } });
    const lines = generateBuildingNPCDialogue(npc, makeComponent());
    expect(lines[0]).toContain('Sir Bob');
  });

  it('falls back to metadata.name when no displayName', () => {
    const npc = makeUser({ spec: {} });
    const lines = generateBuildingNPCDialogue(npc, makeComponent());
    expect(lines[0]).toContain('alice');
  });

  it('includes the component name in the greeting', () => {
    const npc = makeUser({ spec: {} });
    const component = makeComponent({ metadata: { name: 'payment-gateway' } });
    const lines = generateBuildingNPCDialogue(npc, component);
    expect(lines[0]).toContain('payment-gateway');
  });

  it('generates production lifecycle flavour text', () => {
    const lines = generateBuildingNPCDialogue(
      makeUser({ spec: {} }),
      makeComponent({ spec: { lifecycle: 'production', type: 'service' } }),
    );
    expect(lines.some((l) => l.includes('It has proven itself in many battles'))).toBe(true);
  });

  it('generates experimental lifecycle flavour text', () => {
    const lines = generateBuildingNPCDialogue(
      makeUser({ spec: {} }),
      makeComponent({ spec: { lifecycle: 'experimental', type: 'service' } }),
    );
    expect(lines.some((l) => l.includes("forging it in the fires of experimentation"))).toBe(true);
  });

  it('generates fallback lifecycle flavour text for non-standard values', () => {
    const lines = generateBuildingNPCDialogue(
      makeUser({ spec: {} }),
      makeComponent({ spec: { lifecycle: 'deprecated', type: 'service' } }),
    );
    expect(lines.some((l) => l.includes('actively shaping it'))).toBe(true);
  });

  it('includes component type in the lifecycle line', () => {
    const lines = generateBuildingNPCDialogue(
      makeUser({ spec: {} }),
      makeComponent({ spec: { lifecycle: 'production', type: 'website' } }),
    );
    expect(lines.some((l) => l.includes('website'))).toBe(true);
  });

  it('includes a tags line when component has tags', () => {
    const component = makeComponent({
      metadata: { name: 'auth-service', tags: ['rust', 'grpc'] },
      spec: { lifecycle: 'production', type: 'service' },
    });
    const lines = generateBuildingNPCDialogue(makeUser({ spec: {} }), component);
    expect(lines.some((l) => l.includes('rust') && l.includes('grpc'))).toBe(true);
  });

  it('omits the tags line when no tags', () => {
    const component = makeComponent({ metadata: { name: 'auth-service' } });
    const lines = generateBuildingNPCDialogue(makeUser({ spec: {} }), component);
    expect(lines.some((l) => l.startsWith('We work with'))).toBe(false);
  });

  it('applies rpgFlavor to the component description', () => {
    const component = makeComponent({
      metadata: {
        name: 'auth-service',
        description: 'Designed by engineers to build and maintain infrastructure.',
      },
      spec: { lifecycle: 'production', type: 'service' },
    });
    const lines = generateBuildingNPCDialogue(makeUser({ spec: {} }), component);
    expect(lines.some((l) => l.includes('crafted'))).toBe(true);
    expect(lines.some((l) => l.includes('artisan'))).toBe(true);
  });

  it('always ends with the Q hint line', () => {
    const lines = generateBuildingNPCDialogue(makeUser({ spec: {} }), makeComponent());
    expect(lines[lines.length - 1]).toBe(
      'Feel free to look around, and press Q if you want the full details!',
    );
  });
});
