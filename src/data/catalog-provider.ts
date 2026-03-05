/**
 * Unified catalog provider.
 *
 * Dynamically switches between mock catalog and live Backstage data
 * based on connection state. This is the single source of truth for
 * entity data throughout the game.
 */

import type { Entity } from './types';
import * as mockCatalog from './mock-catalog';
import * as liveCatalog from '../services/live-catalog';

// Current data source
let useLive = false;

/**
 * Enable live catalog data (after Backstage connection).
 */
export function enableLiveCatalog(): void {
  useLive = true;
}

/**
 * Disable live catalog and revert to mock data.
 */
export function disableLiveCatalog(): void {
  liveCatalog.clearLiveCatalog();
  useLive = false;
}

/**
 * Check if currently using live catalog.
 */
export function isUsingLiveCatalog(): boolean {
  return useLive;
}

// ── Unified API ────────────────────────────────────────────────────

/**
 * Get all entities from the active catalog (mock or live).
 */
export function getAllEntities(): Entity[] {
  if (useLive) {
    return liveCatalog.getAllLiveEntities();
  }
  return mockCatalog.mockCatalog;
}

/**
 * Get entity by reference string.
 */
export function getEntityByRef(ref: string): Entity | undefined {
  if (useLive) {
    return liveCatalog.getEntityByRef(ref);
  }
  return mockCatalog.getEntityByRef(ref);
}

/**
 * Get entities by kind.
 */
export function getEntitiesByKind(kind: string): Entity[] {
  if (useLive) {
    return liveCatalog.getLiveEntitiesByKind(kind);
  }
  return mockCatalog.getEntitiesByKind(kind);
}

/**
 * Get all team entities.
 */
export function getAllTeams(): Entity[] {
  if (useLive) {
    return liveCatalog.getAllTeams();
  }
  return mockCatalog.getAllTeams();
}

/**
 * Get team by reference.
 */
export function getTeamByRef(ref: string): Entity | undefined {
  if (useLive) {
    return liveCatalog.getEntityByRef(ref);
  }
  return mockCatalog.getTeamByRef(ref);
}

/**
 * Get members of a team.
 */
export function getTeamMembers(teamEntity: Entity): Entity[] {
  if (useLive) {
    return liveCatalog.getTeamMembers(teamEntity);
  }
  return mockCatalog.getTeamMembers(teamEntity);
}

/**
 * Get components owned by a team.
 */
export function getTeamComponents(teamEntity: Entity): Entity[] {
  if (useLive) {
    return liveCatalog.getTeamComponents(teamEntity);
  }
  return mockCatalog.getTeamComponents(teamEntity);
}

/**
 * Get APIs owned by a team.
 */
export function getTeamApis(teamEntity: Entity): Entity[] {
  if (useLive) {
    return liveCatalog.getTeamApis(teamEntity);
  }
  return mockCatalog.getTeamApis(teamEntity);
}

/**
 * Generate an entity reference string.
 */
export function entityRef(entity: Entity): string {
  if (useLive) {
    return liveCatalog.entityRef(entity);
  }
  return mockCatalog.entityRef(entity);
}

/**
 * Get the owner (person) of a component.
 */
export function getComponentOwner(componentEntity: Entity): Entity | undefined {
  if (useLive) {
    return liveCatalog.getComponentOwner(componentEntity);
  }
  return mockCatalog.getComponentOwner(componentEntity);
}

/**
 * Get the team that owns an API.
 */
export function getApiOwnerTeam(apiRef: string): Entity | undefined {
  if (useLive) {
    return liveCatalog.getApiOwnerTeam(apiRef);
  }
  return mockCatalog.getApiOwnerTeam(apiRef);
}
