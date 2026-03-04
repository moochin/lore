import { Entity } from './types';

// ============================================================
// PLATFORM TEAM
// ============================================================

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
    profile: { displayName: 'Platform Team' },
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

const aliceChen: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'alice-chen',
    description: 'Tech Lead for the Platform Team. Specializes in distributed systems and API design.',
  },
  spec: {
    profile: { displayName: 'Alice Chen', email: 'alice@example.com' },
    role: 'Tech Lead',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/auth-service' },
    { type: 'ownerOf', targetRef: 'api:default/user-rest-api' },
  ],
};

const bobMartinez: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'bob-martinez',
    description: 'Senior Backend Engineer. Maintains the data pipeline and event-driven architecture.',
  },
  spec: {
    profile: { displayName: 'Bob Martinez', email: 'bob@example.com' },
    role: 'Senior Backend Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/data-pipeline' },
    { type: 'ownerOf', targetRef: 'api:default/events-grpc-api' },
  ],
};

const carolOkonkwo: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'carol-okonkwo',
    description: 'Frontend Engineer specializing in React and design systems. Leads the dashboard UI.',
  },
  spec: {
    profile: { displayName: 'Carol Okonkwo', email: 'carol@example.com' },
    role: 'Frontend Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/dashboard-ui' },
  ],
};

const daveKim: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'dave-kim',
    description: 'DevOps Engineer focused on CI/CD, observability, and infrastructure automation.',
  },
  spec: {
    profile: { displayName: 'Dave Kim', email: 'dave@example.com' },
    role: 'DevOps Engineer',
    memberOf: ['platform-team'],
  },
  relations: [{ type: 'memberOf', targetRef: 'group:default/platform-team' }],
};

const eveJohansson: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'eve-johansson',
    description: 'Full-stack engineer and API specialist. Designed the user REST API.',
  },
  spec: {
    profile: { displayName: 'Eve Johansson', email: 'eve@example.com' },
    role: 'Full-Stack Engineer',
    memberOf: ['platform-team'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/platform-team' },
    { type: 'ownerOf', targetRef: 'component:default/user-api' },
    { type: 'ownerOf', targetRef: 'api:default/user-rest-api' },
  ],
};

const authService: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'auth-service',
    description: 'Handles authentication and authorization via OAuth2 and JWT tokens. Central gateway for all user sessions.',
    tags: ['auth', 'security', 'java'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/platform-team',
    providesApis: ['api:default/user-rest-api'],
    consumesApis: ['api:default/payment-gateway-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform-team' },
    { type: 'providesApi', targetRef: 'api:default/user-rest-api' },
    { type: 'consumesApi', targetRef: 'api:default/payment-gateway-api' },
  ],
};

const userApi: Entity = {
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
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/platform-team' }],
};

const dashboardUi: Entity = {
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
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/platform-team' }],
};

const dataPipeline: Entity = {
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

const userRestApi: Entity = {
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
    { type: 'apiConsumedBy', targetRef: 'component:default/web-app' },
  ],
};

const eventsGrpcApi: Entity = {
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
    { type: 'apiConsumedBy', targetRef: 'component:default/analytics-engine' },
  ],
};

// ============================================================
// PAYMENTS GUILD
// ============================================================

export const paymentsGuild: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'payments-guild',
    description: 'The Payments Guild handles all financial transactions, billing, and invoice processing across the realm.',
    tags: ['payments', 'fintech', 'billing'],
  },
  spec: {
    type: 'team',
    profile: { displayName: 'Payments Guild' },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/frank-wilson' },
    { type: 'hasMember', targetRef: 'user:default/grace-liu' },
    { type: 'hasMember', targetRef: 'user:default/henry-patel' },
    { type: 'hasMember', targetRef: 'user:default/iris-nakamura' },
    { type: 'ownerOf', targetRef: 'component:default/payment-processor' },
    { type: 'ownerOf', targetRef: 'component:default/billing-service' },
    { type: 'ownerOf', targetRef: 'component:default/invoice-manager' },
    { type: 'ownerOf', targetRef: 'api:default/payment-gateway-api' },
  ],
};

const frankWilson: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'frank-wilson',
    description: 'Engineering Manager for the Payments Guild. 10 years in fintech.',
  },
  spec: {
    profile: { displayName: 'Frank Wilson', email: 'frank@example.com' },
    role: 'Engineering Manager',
    memberOf: ['payments-guild'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/payments-guild' },
    { type: 'ownerOf', targetRef: 'component:default/payment-processor' },
  ],
};

const graceLiu: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'grace-liu',
    description: 'Backend Engineer specializing in payment processing and PCI compliance.',
  },
  spec: {
    profile: { displayName: 'Grace Liu', email: 'grace@example.com' },
    role: 'Backend Engineer',
    memberOf: ['payments-guild'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/payments-guild' },
    { type: 'ownerOf', targetRef: 'component:default/billing-service' },
    { type: 'ownerOf', targetRef: 'api:default/payment-gateway-api' },
  ],
};

const henryPatel: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'henry-patel',
    description: 'Senior Engineer focused on invoicing systems and financial reporting.',
  },
  spec: {
    profile: { displayName: 'Henry Patel', email: 'henry@example.com' },
    role: 'Senior Engineer',
    memberOf: ['payments-guild'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/payments-guild' },
    { type: 'ownerOf', targetRef: 'component:default/invoice-manager' },
  ],
};

const irisNakamura: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'iris-nakamura',
    description: 'QA Engineer ensuring payment reliability and fraud detection accuracy.',
  },
  spec: {
    profile: { displayName: 'Iris Nakamura', email: 'iris@example.com' },
    role: 'QA Engineer',
    memberOf: ['payments-guild'],
  },
  relations: [{ type: 'memberOf', targetRef: 'group:default/payments-guild' }],
};

const paymentProcessor: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'payment-processor',
    description: 'Core payment processing engine. Handles credit cards, bank transfers, and digital wallets.',
    tags: ['payments', 'java', 'pci'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/payments-guild',
    providesApis: ['api:default/payment-gateway-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/payments-guild' },
    { type: 'providesApi', targetRef: 'api:default/payment-gateway-api' },
  ],
};

const billingService: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'billing-service',
    description: 'Manages subscription billing, usage metering, and recurring charge calculations.',
    tags: ['billing', 'subscriptions', 'go'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/payments-guild',
    consumesApis: ['api:default/reporting-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/payments-guild' },
    { type: 'consumesApi', targetRef: 'api:default/reporting-api' },
  ],
};

const invoiceManager: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'invoice-manager',
    description: 'Generates, stores, and delivers invoices. Supports PDF export and email delivery.',
    tags: ['invoices', 'pdf', 'typescript'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/payments-guild',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/payments-guild' }],
};

const paymentGatewayApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'payment-gateway-api',
    description: 'Unified payment gateway API for processing transactions across all payment methods.',
    tags: ['rest', 'payments', 'gateway'],
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
    owner: 'group:default/payments-guild',
    definition: 'openapi: 3.0.0',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/payments-guild' },
    { type: 'apiProvidedBy', targetRef: 'component:default/payment-processor' },
    { type: 'apiConsumedBy', targetRef: 'component:default/auth-service' },
  ],
};

// ============================================================
// FRONTEND COLLECTIVE
// ============================================================

export const frontendCollective: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'frontend-collective',
    description: 'The Frontend Collective builds user-facing applications, design systems, and the GraphQL gateway.',
    tags: ['frontend', 'react', 'design'],
  },
  spec: {
    type: 'team',
    profile: { displayName: 'Frontend Collective' },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/jasmine-brooks' },
    { type: 'hasMember', targetRef: 'user:default/kai-tanaka' },
    { type: 'hasMember', targetRef: 'user:default/luna-santos' },
    { type: 'ownerOf', targetRef: 'component:default/design-system' },
    { type: 'ownerOf', targetRef: 'component:default/web-app' },
    { type: 'ownerOf', targetRef: 'component:default/mobile-app' },
    { type: 'ownerOf', targetRef: 'api:default/graphql-gateway' },
  ],
};

const jasmineBrooks: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'jasmine-brooks',
    description: 'Lead Designer and frontend architect. Created the design system from scratch.',
  },
  spec: {
    profile: { displayName: 'Jasmine Brooks', email: 'jasmine@example.com' },
    role: 'Lead Designer',
    memberOf: ['frontend-collective'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/frontend-collective' },
    { type: 'ownerOf', targetRef: 'component:default/design-system' },
  ],
};

const kaiTanaka: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'kai-tanaka',
    description: 'Senior Frontend Engineer. Maintains the web application and GraphQL layer.',
  },
  spec: {
    profile: { displayName: 'Kai Tanaka', email: 'kai@example.com' },
    role: 'Senior Frontend Engineer',
    memberOf: ['frontend-collective'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/frontend-collective' },
    { type: 'ownerOf', targetRef: 'component:default/web-app' },
    { type: 'ownerOf', targetRef: 'api:default/graphql-gateway' },
  ],
};

const lunaSantos: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'luna-santos',
    description: 'Mobile engineer building the React Native app. Expert in cross-platform development.',
  },
  spec: {
    profile: { displayName: 'Luna Santos', email: 'luna@example.com' },
    role: 'Mobile Engineer',
    memberOf: ['frontend-collective'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/frontend-collective' },
    { type: 'ownerOf', targetRef: 'component:default/mobile-app' },
  ],
};

const designSystem: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'design-system',
    description: 'Shared component library with tokens, primitives, and composites for consistent UI across all products.',
    tags: ['design', 'react', 'storybook'],
  },
  spec: {
    type: 'library',
    lifecycle: 'production',
    owner: 'group:default/frontend-collective',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/frontend-collective' }],
};

const webApp: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'web-app',
    description: 'Primary customer-facing web application. Built with Next.js and the design system.',
    tags: ['frontend', 'nextjs', 'typescript'],
  },
  spec: {
    type: 'website',
    lifecycle: 'production',
    owner: 'group:default/frontend-collective',
    consumesApis: ['api:default/user-rest-api', 'api:default/graphql-gateway'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/frontend-collective' },
    { type: 'consumesApi', targetRef: 'api:default/user-rest-api' },
    { type: 'consumesApi', targetRef: 'api:default/graphql-gateway' },
  ],
};

const mobileApp: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'mobile-app',
    description: 'Cross-platform mobile application built with React Native. Mirrors web app functionality.',
    tags: ['mobile', 'react-native', 'ios', 'android'],
  },
  spec: {
    type: 'website',
    lifecycle: 'experimental',
    owner: 'group:default/frontend-collective',
    consumesApis: ['api:default/graphql-gateway'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/frontend-collective' },
    { type: 'consumesApi', targetRef: 'api:default/graphql-gateway' },
  ],
};

const graphqlGateway: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'graphql-gateway',
    description: 'Unified GraphQL gateway that aggregates backend services into a single query endpoint.',
    tags: ['graphql', 'gateway', 'federation'],
  },
  spec: {
    type: 'graphql',
    lifecycle: 'production',
    owner: 'group:default/frontend-collective',
    definition: 'type Query { ... }',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/frontend-collective' },
    { type: 'apiProvidedBy', targetRef: 'component:default/web-app' },
    { type: 'apiConsumedBy', targetRef: 'component:default/mobile-app' },
  ],
};

// ============================================================
// DATA FORGE
// ============================================================

export const dataForge: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'data-forge',
    description: 'The Data Forge team builds analytics, data warehousing, and reporting infrastructure.',
    tags: ['data', 'analytics', 'ml'],
  },
  spec: {
    type: 'team',
    profile: { displayName: 'Data Forge' },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/marco-rossi' },
    { type: 'hasMember', targetRef: 'user:default/nina-kowalski' },
    { type: 'hasMember', targetRef: 'user:default/omar-hassan' },
    { type: 'ownerOf', targetRef: 'component:default/analytics-engine' },
    { type: 'ownerOf', targetRef: 'component:default/data-warehouse' },
    { type: 'ownerOf', targetRef: 'api:default/reporting-api' },
  ],
};

const marcoRossi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'marco-rossi',
    description: 'Data Engineering Lead. Architect of the analytics engine and ETL pipelines.',
  },
  spec: {
    profile: { displayName: 'Marco Rossi', email: 'marco@example.com' },
    role: 'Data Engineering Lead',
    memberOf: ['data-forge'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/data-forge' },
    { type: 'ownerOf', targetRef: 'component:default/analytics-engine' },
    { type: 'ownerOf', targetRef: 'api:default/reporting-api' },
  ],
};

const ninaKowalski: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'nina-kowalski',
    description: 'Data Warehouse Engineer. Manages the Snowflake data warehouse and dbt models.',
  },
  spec: {
    profile: { displayName: 'Nina Kowalski', email: 'nina@example.com' },
    role: 'Data Warehouse Engineer',
    memberOf: ['data-forge'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/data-forge' },
    { type: 'ownerOf', targetRef: 'component:default/data-warehouse' },
  ],
};

const omarHassan: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'omar-hassan',
    description: 'ML Engineer building predictive models on top of the analytics engine.',
  },
  spec: {
    profile: { displayName: 'Omar Hassan', email: 'omar@example.com' },
    role: 'ML Engineer',
    memberOf: ['data-forge'],
  },
  relations: [{ type: 'memberOf', targetRef: 'group:default/data-forge' }],
};

const analyticsEngine: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'analytics-engine',
    description: 'Real-time analytics engine processing event streams for dashboards and alerting.',
    tags: ['analytics', 'spark', 'python'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/data-forge',
    consumesApis: ['api:default/events-grpc-api'],
    providesApis: ['api:default/reporting-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/data-forge' },
    { type: 'consumesApi', targetRef: 'api:default/events-grpc-api' },
    { type: 'providesApi', targetRef: 'api:default/reporting-api' },
  ],
};

const dataWarehouse: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'data-warehouse',
    description: 'Central data warehouse on Snowflake. Houses all historical data with dbt transformations.',
    tags: ['snowflake', 'dbt', 'sql'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/data-forge',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/data-forge' }],
};

const reportingApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'reporting-api',
    description: 'API for querying aggregated metrics, generating reports, and exporting data.',
    tags: ['rest', 'reporting', 'metrics'],
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
    owner: 'group:default/data-forge',
    definition: 'openapi: 3.0.0',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/data-forge' },
    { type: 'apiProvidedBy', targetRef: 'component:default/analytics-engine' },
    { type: 'apiConsumedBy', targetRef: 'component:default/billing-service' },
  ],
};

// ============================================================
// SECURITY ORDER
// ============================================================

export const securityOrder: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'security-order',
    description: 'The Security Order protects the realm from threats, manages vulnerability scanning, and enforces compliance across all services.',
    tags: ['security', 'compliance', 'scanning'],
  },
  spec: {
    type: 'team',
    profile: { displayName: 'Security Order' },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/petra-voss' },
    { type: 'hasMember', targetRef: 'user:default/quinn-reeves' },
    { type: 'hasMember', targetRef: 'user:default/raj-sharma' },
    { type: 'ownerOf', targetRef: 'component:default/vulnerability-scanner' },
    { type: 'ownerOf', targetRef: 'component:default/secret-vault' },
    { type: 'ownerOf', targetRef: 'component:default/compliance-engine' },
    { type: 'ownerOf', targetRef: 'api:default/security-audit-api' },
  ],
};

const petraVoss: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'petra-voss',
    description: 'Head of Security. Leads threat modeling, incident response, and security architecture reviews.',
  },
  spec: {
    profile: { displayName: 'Petra Voss', email: 'petra@example.com' },
    role: 'Head of Security',
    memberOf: ['security-order'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/security-order' },
    { type: 'ownerOf', targetRef: 'component:default/vulnerability-scanner' },
    { type: 'ownerOf', targetRef: 'api:default/security-audit-api' },
  ],
};

const quinnReeves: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'quinn-reeves',
    description: 'Security Engineer specializing in secrets management and cryptographic protocols.',
  },
  spec: {
    profile: { displayName: 'Quinn Reeves', email: 'quinn@example.com' },
    role: 'Security Engineer',
    memberOf: ['security-order'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/security-order' },
    { type: 'ownerOf', targetRef: 'component:default/secret-vault' },
  ],
};

const rajSharma: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'raj-sharma',
    description: 'Compliance Engineer focused on SOC2 auditing, GDPR enforcement, and regulatory reporting.',
  },
  spec: {
    profile: { displayName: 'Raj Sharma', email: 'raj@example.com' },
    role: 'Compliance Engineer',
    memberOf: ['security-order'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/security-order' },
    { type: 'ownerOf', targetRef: 'component:default/compliance-engine' },
  ],
};

const vulnerabilityScanner: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'vulnerability-scanner',
    description: 'Automated vulnerability scanning service that checks all deployed services for known CVEs and misconfigurations.',
    tags: ['security', 'scanning', 'python'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/security-order',
    providesApis: ['api:default/security-audit-api'],
    consumesApis: ['api:default/events-grpc-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/security-order' },
    { type: 'providesApi', targetRef: 'api:default/security-audit-api' },
    { type: 'consumesApi', targetRef: 'api:default/events-grpc-api' },
  ],
};

const secretVault: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'secret-vault',
    description: 'Centralized secrets management service backed by HashiCorp Vault. Handles key rotation and access policies.',
    tags: ['secrets', 'vault', 'go'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/security-order',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/security-order' }],
};

const complianceEngine: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'compliance-engine',
    description: 'Policy-as-code engine that enforces SOC2, GDPR, and HIPAA compliance rules across the organization.',
    tags: ['compliance', 'policy', 'rego'],
  },
  spec: {
    type: 'service',
    lifecycle: 'experimental',
    owner: 'group:default/security-order',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/security-order' }],
};

const securityAuditApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'security-audit-api',
    description: 'API for querying security scan results, compliance status, and audit trails.',
    tags: ['rest', 'security', 'audit'],
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
    owner: 'group:default/security-order',
    definition: 'openapi: 3.0.0',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/security-order' },
    { type: 'apiProvidedBy', targetRef: 'component:default/vulnerability-scanner' },
  ],
};

// ============================================================
// SRE WARDENS
// ============================================================

export const sreWardens: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Group',
  metadata: {
    name: 'sre-wardens',
    description: 'The SRE Wardens keep the realm running. They manage monitoring, incident response, and infrastructure reliability.',
    tags: ['sre', 'monitoring', 'reliability'],
  },
  spec: {
    type: 'team',
    profile: { displayName: 'SRE Wardens' },
    children: [],
  },
  relations: [
    { type: 'hasMember', targetRef: 'user:default/sam-oduya' },
    { type: 'hasMember', targetRef: 'user:default/tina-mueller' },
    { type: 'hasMember', targetRef: 'user:default/uri-ben-ari' },
    { type: 'ownerOf', targetRef: 'component:default/monitoring-stack' },
    { type: 'ownerOf', targetRef: 'component:default/incident-bot' },
    { type: 'ownerOf', targetRef: 'component:default/status-page' },
    { type: 'ownerOf', targetRef: 'api:default/alerting-api' },
  ],
};

const samOduya: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'sam-oduya',
    description: 'SRE Lead. Architected the monitoring stack and on-call rotation. Champion of error budgets.',
  },
  spec: {
    profile: { displayName: 'Sam Oduya', email: 'sam@example.com' },
    role: 'SRE Lead',
    memberOf: ['sre-wardens'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/sre-wardens' },
    { type: 'ownerOf', targetRef: 'component:default/monitoring-stack' },
    { type: 'ownerOf', targetRef: 'api:default/alerting-api' },
  ],
};

const tinaMueller: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'tina-mueller',
    description: 'Incident Response Engineer. Built the incident bot and manages runbooks.',
  },
  spec: {
    profile: { displayName: 'Tina Mueller', email: 'tina@example.com' },
    role: 'Incident Response Engineer',
    memberOf: ['sre-wardens'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/sre-wardens' },
    { type: 'ownerOf', targetRef: 'component:default/incident-bot' },
  ],
};

const uriBenAri: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'User',
  metadata: {
    name: 'uri-ben-ari',
    description: 'Platform Reliability Engineer. Maintains the public status page and uptime dashboards.',
  },
  spec: {
    profile: { displayName: 'Uri Ben-Ari', email: 'uri@example.com' },
    role: 'Reliability Engineer',
    memberOf: ['sre-wardens'],
  },
  relations: [
    { type: 'memberOf', targetRef: 'group:default/sre-wardens' },
    { type: 'ownerOf', targetRef: 'component:default/status-page' },
  ],
};

const monitoringStack: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'monitoring-stack',
    description: 'Full observability stack: Prometheus for metrics, Grafana for dashboards, and Loki for log aggregation.',
    tags: ['monitoring', 'prometheus', 'grafana'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/sre-wardens',
    providesApis: ['api:default/alerting-api'],
    consumesApis: ['api:default/events-grpc-api'],
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/sre-wardens' },
    { type: 'providesApi', targetRef: 'api:default/alerting-api' },
    { type: 'consumesApi', targetRef: 'api:default/events-grpc-api' },
  ],
};

const incidentBot: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'incident-bot',
    description: 'Slack-integrated incident management bot. Creates war rooms, pages on-call, and tracks incident timelines.',
    tags: ['incident', 'slack', 'typescript'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/sre-wardens',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/sre-wardens' }],
};

const statusPage: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'status-page',
    description: 'Public-facing status page showing real-time health of all services and historical uptime.',
    tags: ['status', 'frontend', 'react'],
  },
  spec: {
    type: 'website',
    lifecycle: 'production',
    owner: 'group:default/sre-wardens',
  },
  relations: [{ type: 'ownedBy', targetRef: 'group:default/sre-wardens' }],
};

const alertingApi: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'alerting-api',
    description: 'API for managing alert rules, notification channels, and incident escalation policies.',
    tags: ['rest', 'alerting', 'webhook'],
  },
  spec: {
    type: 'openapi',
    lifecycle: 'production',
    owner: 'group:default/sre-wardens',
    definition: 'openapi: 3.0.0',
  },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/sre-wardens' },
    { type: 'apiProvidedBy', targetRef: 'component:default/monitoring-stack' },
    { type: 'apiConsumedBy', targetRef: 'component:default/incident-bot' },
  ],
};

// ============================================================
// CATALOG AGGREGATION
// ============================================================

export const mockCatalog: Entity[] = [
  platformTeam, aliceChen, bobMartinez, carolOkonkwo, daveKim, eveJohansson,
  authService, userApi, dashboardUi, dataPipeline, userRestApi, eventsGrpcApi,
  paymentsGuild, frankWilson, graceLiu, henryPatel, irisNakamura,
  paymentProcessor, billingService, invoiceManager, paymentGatewayApi,
  frontendCollective, jasmineBrooks, kaiTanaka, lunaSantos,
  designSystem, webApp, mobileApp, graphqlGateway,
  dataForge, marcoRossi, ninaKowalski, omarHassan,
  analyticsEngine, dataWarehouse, reportingApi,
  securityOrder, petraVoss, quinnReeves, rajSharma,
  vulnerabilityScanner, secretVault, complianceEngine, securityAuditApi,
  sreWardens, samOduya, tinaMueller, uriBenAri,
  monitoringStack, incidentBot, statusPage, alertingApi,
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getEntityByRef(ref: string): Entity | undefined {
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

export function getAllTeams(): Entity[] {
  return mockCatalog.filter((e) => e.kind === 'Group' && (e.spec.type as string) === 'team');
}

export function getTeamByRef(ref: string): Entity | undefined {
  return getEntityByRef(ref);
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

export function getApiOwnerTeam(apiRef: string): Entity | undefined {
  const apiEntity = getEntityByRef(apiRef);
  if (!apiEntity) return undefined;
  const ownerRef = apiEntity.relations?.find(
    (r) => r.type === 'ownedBy' && r.targetRef.startsWith('group:'),
  )?.targetRef;
  return ownerRef ? getEntityByRef(ownerRef) : undefined;
}
