/**
 * Live Backstage catalog adapter.
 *
 * Provides the same interface as mock-catalog.ts but fetches real data
 * from a connected Backstage instance via the CatalogClient.
 */

import type { Entity } from '../data/types';
import { CatalogClient, type BackstageConfig } from './catalog';

/**
 * Cache for live catalog data. Stores entities by kind for fast lookups.
 */
class LiveCatalogCache {
  private allEntities: Entity[] = [];
  private entitiesByKind: Map<string, Entity[]> = new Map();
  private loadPromise: Promise<void> | null = null;

  async load(client: CatalogClient): Promise<void> {
    // Avoid multiple concurrent loads
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        this.allEntities = await client.getAllEntities();
        // Index by kind for faster lookups
        this.entitiesByKind.clear();
        for (const entity of this.allEntities) {
          const kind = entity.kind.toLowerCase();
          if (!this.entitiesByKind.has(kind)) {
            this.entitiesByKind.set(kind, []);
          }
          this.entitiesByKind.get(kind)!.push(entity);
        }
      } catch (err) {
        console.error('Failed to load live catalog:', err);
        throw err;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  getAll(): Entity[] {
    return this.allEntities;
  }

  getByKind(kind: string): Entity[] {
    return this.entitiesByKind.get(kind.toLowerCase()) ?? [];
  }

  clear(): void {
    this.allEntities = [];
    this.entitiesByKind.clear();
    this.loadPromise = null;
  }
}

// Global cache instance
const cache = new LiveCatalogCache();

/**
 * Initialize the live catalog with a Backstage connection.
 * Must be called once before using any of the helper functions below.
 */
export async function initializeLiveCatalog(config: BackstageConfig): Promise<void> {
  const client = new CatalogClient(config);
  await cache.load(client);
}

/**
 * Clear the live catalog cache (e.g., when disconnecting).
 */
export function clearLiveCatalog(): void {
  cache.clear();
}

// ── Helper functions (matching mock-catalog.ts API) ──

/**
 * Get all entities from the live catalog.
 */
export function getAllLiveEntities(): Entity[] {
  return cache.getAll();
}

/**
 * Get all entities of a specific kind (e.g., 'Group', 'Component', 'API').
 */
export function getLiveEntitiesByKind(kind: string): Entity[] {
  return cache.getByKind(kind);
}

/**
 * Get entity by reference string (e.g., 'component:default/auth-service').
 */
export function getEntityByRef(ref: string): Entity | undefined {
  const match = ref.match(/^(\w+):(\w+)\/(.+)$/);
  if (!match) return undefined;
  const [, kind, , name] = match;
  return cache.getByKind(kind).find((e) => e.metadata.name === name);
}

/**
 * Get all team entities.
 */
export function getAllTeams(): Entity[] {
  return cache
    .getByKind('Group')
    .filter((e) => (e.spec.type as string) === 'team');
}

/**
 * Get members of a team (users in the 'hasMember' relations).
 */
export function getTeamMembers(teamEntity: Entity): Entity[] {
  const memberRefs =
    teamEntity.relations
      ?.filter((r) => r.type === 'hasMember')
      .map((r) => r.targetRef) ?? [];
  return memberRefs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

/**
 * Get components owned by a team.
 */
export function getTeamComponents(teamEntity: Entity): Entity[] {
  const refs =
    teamEntity.relations
      ?.filter((r) => r.type === 'ownerOf' && r.targetRef.startsWith('component:'))
      .map((r) => r.targetRef) ?? [];
  return refs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

/**
 * Get APIs owned by a team.
 */
export function getTeamApis(teamEntity: Entity): Entity[] {
  const refs =
    teamEntity.relations
      ?.filter((r) => r.type === 'ownerOf' && r.targetRef.startsWith('api:'))
      .map((r) => r.targetRef) ?? [];
  return refs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

/**
 * Generate an entity reference string from an entity.
 */
export function entityRef(entity: Entity): string {
  return `${entity.kind.toLowerCase()}:default/${entity.metadata.name}`;
}

/**
 * Get the owner (person) of a component.
 */
export function getComponentOwner(componentEntity: Entity): Entity | undefined {
  const ownerRef = componentEntity.relations?.find(
    (r) => r.type === 'ownedBy' && r.targetRef.startsWith('group:'),
  )?.targetRef;
  if (!ownerRef) return undefined;

  const group = getEntityByRef(ownerRef);
  if (!group) return undefined;

  const componentRefStr = entityRef(componentEntity);
  const members = getTeamMembers(group);
  return members.find((m) =>
    m.relations?.some(
      (r) => r.type === 'ownerOf' && r.targetRef === componentRefStr,
    ),
  ) ?? members[0];
}

/**
 * Get the team that owns an API.
 */
export function getApiOwnerTeam(apiRef: string): Entity | undefined {
  const apiEntity = getEntityByRef(apiRef);
  if (!apiEntity) return undefined;
  const ownerRef = apiEntity.relations?.find(
    (r) => r.type === 'ownedBy' && r.targetRef.startsWith('group:'),
  )?.targetRef;
  return ownerRef ? getEntityByRef(ownerRef) : undefined;
}
