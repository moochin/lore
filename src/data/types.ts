// Backstage-compatible entity types

export interface EntityMeta {
  name: string;
  description?: string;
  tags?: string[];
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface Relation {
  type: string; // e.g. 'ownedBy', 'consumesApi', 'memberOf', 'providesApi'
  targetRef: string; // e.g. 'group:default/platform-team'
}

export type EntityKind =
  | 'Component'
  | 'API'
  | 'User'
  | 'Group'
  | 'System'
  | 'Domain'
  | 'Resource';

export interface Entity {
  apiVersion: string;
  kind: EntityKind;
  metadata: EntityMeta;
  spec: Record<string, unknown>;
  relations?: Relation[];
}

// World generation output types

export interface NPCState {
  entityRef: string; // e.g. 'user:default/alice'
  name: string;
  position: { x: number; y: number }; // tile coordinates
  spriteIndex: number;
}

export interface BuildingState {
  entityRef: string; // e.g. 'component:default/auth-service'
  name: string;
  position: { x: number; y: number }; // tile coordinates (top-left of 3x3)
  buildingType: 'component' | 'api';
  componentType?: string; // e.g. 'service', 'website', 'library' — determines sprite
}

export interface VillageState {
  teamRef: string;
  teamName: string;
  worldPosition: { x: number; y: number }; // tile coordinates on overworld
  buildings: BuildingState[];
  npcs: NPCState[];
}

export interface WorldState {
  villages: VillageState[];
}
