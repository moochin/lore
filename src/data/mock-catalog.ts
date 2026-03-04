import { Entity } from './types';

// --- Group (Team) ---

export const platformTeam: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'platform-team',
    description:
      'The Platform Team builds and maintains the core infrastructure, APIs, and developer tools that power the organization.',
    tags: ['platform', 'infrastructure', 'core'],
  },
  spec: {
    type: 'team',
    profile: {
      displayName: 'Platform Team',
    },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/alice-chen' },
    { type: 'hasMember', targetRef: 'user:default/bob-martinez' },
    { type: 'hasMember', targetRef: 'user:default/carol-okonkwo' },
    { type: 'hasMember', targetRef: 'user:default/dave-kim' },
    { type: 'hasMember', targetRef: 'user:default/eve-johansson' },
    { type: 'ownerOf', targetRef: 'component:default/auth-service' },
    { type: 'ownerOf', targetRef: 'component:default/user-api' },
    { type: 'ownerOf', targetRef: 'component:default/dashboard-ui' },
    { type: 'ownerOf', targetRef: 'component:default/data-pipeline' },
    { type: 'ownerOf', targetRef: 'api:default/user-rest-api' },
    { type: 'ownerOf', targetRef: 'api:default/events-grpc-api' },
  ],
};

// --- Users (Team Members) ---

export const aliceChen: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'alice-chen',
    description: 'Tech Lead for the Platform Team. Specializes in distributed systems and API design.',
    annotations: { 'backstage.io/managed-by-location': 'url:https://github.com/org' },
  },
  spec: {
    profile: {
      displayName: 'Alice Chen',
      email: 'alice@example.com',
      picture: '',
    },
    role: 'Tech Lead',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/auth-service' },
    { type: 'ownerOf', targetRef: 'api:default/user-rest-api' },
  ],
};

export const bobMartinez: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'bob-martinez',
    description: 'Senior Backend Engineer. Maintains the data pipeline and event-driven architecture.',
  },
  spec: {
    profile: {
      displayName: 'Bob Martinez',
      email: 'bob@example.com',
    },
    role: 'Senior Backend Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/data-pipeline' },
    { type: 'ownerOf', targetRef: 'api:default/events-grpc-api' },
  ],
};

export const carolOkonkwo: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'carol-okonkwo',
    description: 'Frontend Engineer specializing in React and design systems. Leads the dashboard UI.',
  },
  spec: {
    profile: {
      displayName: 'Carol Okonkwo',
      email: 'carol@example.com',
    },
    role: 'Frontend Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/dashboard-ui' },
  ],
};

export const daveKim: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'dave-kim',
    description: 'DevOps Engineer focused on CI/CD, observability, and infrastructure automation.',
  },
  spec: {
    profile: {
      displayName: 'Dave Kim',
      email: 'dave@example.com',
    },
    role: 'DevOps Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
  ],
};

export const eveJohansson: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'eve-johansson',
    description: 'Full-stack engineer and API specialist. Designed the user REST API.',
  },
  spec: {
    profile: {
      displayName: 'Eve Johansson',
      email: 'eve@example.com',
    },
    role: 'Full-Stack Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/user-api' },
    { type: 'ownerOf', targetRef: 'api:default/user-rest-api' },
  ],
};

// --- Components ---

export const authService: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'auth-service',
    description: 'Handles authentication and authorization via OAuth2 and JWT tokens. Central gateway for all user sessions.',
    tags: ['auth', 'security', 'java'],
    annotations: { 'backstage.io/techdocs-ref': 'dir:.' },
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/platform-team',
    providesApis: ['api:default/user-rest-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'providesApi', targetRef: 'api:default/user-rest-api' },
  ],
};

export const userApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'user-api',
    description: 'REST API for user management — CRUD operations, profile data, and role assignments.',
    tags: ['api', 'rest', 'typescript'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/platform-team',
    consumesApis: ['api:default/user-rest-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'consumesApi', targetRef: 'api:default/user-rest-api' },
  ],
};

export const dashboardUi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'dashboard-ui',
    description: 'Internal dashboard for monitoring platform health, user metrics, and system status.',
    tags: ['frontend', 'react', 'dashboard'],
  },
  spec: {
    type: 'website',
    lifecycle: 'production',
    owner: 'group:default/platform-team',
    consumesApis: ['api:default/user-rest-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'consumesApi', targetRef: 'api:default/user-rest-api' },
  ],
};

export const dataPipeline: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'data-pipeline',
    description: 'Event-driven data pipeline for processing and routing platform events. Built on Kafka.',
    tags: ['data', 'kafka', 'python'],
  },
  spec: {
    type: 'service',
    lifecycle: 'experimental',
    owner: 'group:default/platform-team',
    providesApis: ['api:default/events-grpc-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'providesApi', targetRef: 'api:default/events-grpc-api' },
  ],
};

// --- APIs ---

export const userRestApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'user-rest-api',
    description: 'RESTful API for user account management, authentication tokens, and profile operations.',
    tags: ['rest', 'openapi'],
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
    owner: 'group:default/platform-team',
    definition: 'openapi: 3.0.0',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'apiProvidedBy', targetRef: 'component:default/auth-service' },
    { type: 'apiConsumedBy', targetRef: 'component:default/user-api' },
    { type: 'apiConsumedBy', targetRef: 'component:default/dashboard-ui' },
  ],
};

export const eventsGrpcApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'events-grpc-api',
    description: 'gRPC API for publishing and subscribing to platform events. Powers real-time notifications.',
    tags: ['grpc', 'events', 'streaming'],
  },
  spec: {
    type: 'grpc',
    lifecycle: 'experimental',
    owner: 'group:default/platform-team',
    definition: 'syntax = "proto3";',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'apiProvidedBy', targetRef: 'component:default/data-pipeline' },
  ],
};

// --- Catalog aggregation ---

export const mockCatalog: Entity[] = [
  platformTeam,
  aliceChen,
  bobMartinez,
  carolOkonkwo,
  daveKim,
  eveJohansson,
  authService,
  userApi,
  dashboardUi,
  dataPipeline,
  userRestApi,
  eventsGrpcApi,
];

export function getEntityByRef(ref: string): Entity | undefined {
  // ref format: "kind:namespace/name" e.g. "user:default/alice-chen"
  const match = ref.match(/^(\w+):(\w+)\/(.+)$/);
  if (!match) return undefined;
  const [, kind, , name] = match;
  return mockCatalog.find(
    (e) => e.kind.toLowerCase() === kind.toLowerCase() && e.metadata.name === name,
  );
}

export function getEntitiesByKind(kind: string): Entity[] {
  return mockCatalog.filter((e) => e.kind.toLowerCase() === kind.toLowerCase());
}

export function getTeamMembers(teamEntity: Entity): Entity[] {
  const memberRefs =
    teamEntity.relations
      ?.filter((r) => r.type === 'hasMember')
      .map((r) => r.targetRef) ?? [];
  return memberRefs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

export function getTeamComponents(teamEntity: Entity): Entity[] {
  const refs =
    teamEntity.relations
      ?.filter((r) => r.type === 'ownerOf' && r.targetRef.startsWith('component:'))
      .map((r) => r.targetRef) ?? [];
  return refs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

export function getTeamApis(teamEntity: Entity): Entity[] {
  const refs =
    teamEntity.relations
      ?.filter((r) => r.type === 'ownerOf' && r.targetRef.startsWith('api:'))
      .map((r) => r.targetRef) ?? [];
  return refs.map((ref) => getEntityByRef(ref)).filter((e): e is Entity => !!e);
}

export function entityRef(entity: Entity): string {
  return `${entity.kind.toLowerCase()}:default/${entity.metadata.name}`;
}
