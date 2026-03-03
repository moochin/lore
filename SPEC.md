# LORE — Logically Orchestrated RPG Environment

## Overview

LORE is a web application that connects to a Backstage instance and generates an explorable 16-bit pixel art RPG world using Phaser. Think *A Link to the Past* meets your software catalog — teams become villages, services become buildings, and your colleagues become NPCs who share the lore of your organization.

The player character represents the logged-in Backstage user. There is no combat — the core loop is **exploration, discovery, and learning**. You unlock the map by interacting with the world, talking to NPCs, and entering buildings to reveal what your organization has built.

**Future vision:** LORE will support multiple data sources beyond Backstage, including Azure DevOps, JIRA, and C4 architecture models — letting you explore any organization's landscape as a living RPG world.

---

## World Metaphor

| Backstage Entity | World Representation |
|---|---|
| **Domain** | Region / continent on the overworld map |
| **System** | District or named area grouping related villages |
| **Team** | Village / town |
| **Component** | Building within a team's village |
| **API** | Referenced in NPC dialogue and signage (dialogue-driven connections) |
| **User** | NPC inside their team's village |
| **Resource** | Interactable object inside a building (chest, bookshelf, artifact) |
| **Player** | The logged-in Backstage user entity |

### Relationships

Entity relationships (API dependencies, system connections, team interactions) are represented through **dialogue**. NPCs reference other teams and services conversationally:

> *"We maintain the Checkout Service in the big hall. It speaks with the Payment Guild's API — they're a reliable bunch over in the eastern village."*

This keeps the world uncluttered while embedding real architectural knowledge in explorable lore.

---

## Interaction Model

### Explore & Discover
- Top-down 4-directional movement on tile-based maps
- Camera follows the player
- Overworld map connects villages; entering a village transitions to a detailed interior map
- Buildings can be entered for interior views with more detail

### Interact to Unlock
- All villages and buildings are **visible** on the map from the start
- Content is **locked** until the player interacts: approaches, enters, or talks to NPCs
- Unlocking fills in the map details and reveals information
- A mini-map tracks unlock progress across the world

### NPC Dialogue System
- **Layer 1 — RPG Dialogue:** NPCs introduce themselves and their work in character, using RPG-flavored language that wraps real catalog data
- **Layer 2 — Real Data Panel:** After dialogue, the player can open a detail panel showing raw Backstage data (entity metadata, docs links, ownership, dependencies, recent activity)

### No Combat
- There are no enemies, health bars, or fighting mechanics
- The game is about curiosity, exploration, and understanding your organization

---

## Art Style

**16-bit pixel art** in the style of *The Legend of Zelda: A Link to the Past* and early *Pokémon* games:

- Top-down perspective
- Tile-based terrain (grass, paths, water, trees, fences)
- Distinct building sprites for different component types (e.g., a forge for a CI/CD pipeline, a library for a documentation service, a watchtower for a monitoring tool)
- Character sprites for NPCs with idle animations
- Smooth tile-to-tile movement with transitions between maps

### Asset Strategy
- Use free/open-source 16-bit tileset packs for the initial build (e.g., LPC — Liberated Pixel Cup assets)
- Custom sprites can be added later for distinct building types
- Keep a consistent palette and style guide

---

## Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| **UI Shell** | React 18 + TypeScript |
| **Game Engine** | Phaser 3 (embedded in React via a container component) |
| **Build Tool** | Vite |
| **State Management** | Zustand (shared state between React UI and Phaser) |
| **Data Layer** | Mock JSON data (M1–M4), Backstage REST API (M5) |
| **Map Persistence** | localStorage (M4), backend/DB (future) |
| **Styling** | CSS Modules or Tailwind for the React shell |
| **Testing** | Vitest + React Testing Library |

### Project Structure

```
lore/
├── public/
│   └── assets/
│       ├── tilesets/          # 16-bit tileset PNGs
│       ├── sprites/           # Character & object sprites
│       └── maps/              # Tiled JSON map data
├── src/
│   ├── components/            # React UI components
│   │   ├── GameContainer.tsx  # Phaser mount point
│   │   ├── DetailPanel.tsx    # Entity info overlay
│   │   ├── MiniMap.tsx        # Unlock progress mini-map
│   │   └── DialogueBox.tsx    # RPG dialogue UI
│   ├── game/                  # Phaser game code
│   │   ├── scenes/
│   │   │   ├── BootScene.ts       # Asset loading
│   │   │   ├── OverworldScene.ts  # Main overworld map
│   │   │   ├── VillageScene.ts    # Individual village maps
│   │   │   └── BuildingScene.ts   # Building interiors
│   │   ├── entities/
│   │   │   ├── Player.ts          # Player character
│   │   │   ├── NPC.ts             # NPC behavior & dialogue trigger
│   │   │   └── Building.ts        # Building entry trigger
│   │   ├── systems/
│   │   │   ├── DialogueSystem.ts  # Dialogue state machine
│   │   │   ├── UnlockSystem.ts    # Map unlock tracking
│   │   │   └── MapGenerator.ts    # Catalog → world generation
│   │   └── config.ts             # Phaser game config
│   ├── data/
│   │   ├── mock-catalog.ts        # Mock Backstage catalog
│   │   └── types.ts               # Backstage entity type definitions
│   ├── services/
│   │   ├── catalog.ts             # Backstage API client (M5)
│   │   └── persistence.ts         # Map save/load
│   ├── store/
│   │   └── gameStore.ts           # Zustand store
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── SPEC.md
```

### React ↔ Phaser Communication

Phaser runs inside a React-managed `<div>` container. Communication flows through a shared Zustand store:

- **React → Phaser:** UI actions (open detail panel, toggle mini-map) update the store; Phaser scenes subscribe to store changes
- **Phaser → React:** Game events (NPC interaction, building entry, unlock) update the store; React components re-render from store state

This keeps the game engine decoupled from the UI layer and makes both independently testable.

---

## Data Model

### Mock Catalog Schema (M1–M4)

The mock data follows Backstage's entity format:

```typescript
interface Entity {
  apiVersion: string;
  kind: 'Component' | 'API' | 'User' | 'Group' | 'System' | 'Domain' | 'Resource';
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    annotations?: Record<string, string>;
  };
  spec: Record<string, unknown>;
  relations?: Relation[];
}

interface Relation {
  type: string;        // e.g., 'ownedBy', 'consumesApi', 'memberOf'
  targetRef: string;   // e.g., 'group:default/payments-team'
}
```

### World State Schema

```typescript
interface WorldState {
  generatedAt: string;
  catalogHash: string;         // Detect when catalog changes
  villages: VillageState[];
  unlocked: Set<string>;       // Entity refs the player has unlocked
  playerPosition: { x: number; y: number; scene: string };
}

interface VillageState {
  teamRef: string;
  position: { x: number; y: number };  // Overworld grid position
  buildings: BuildingState[];
  npcs: NPCState[];
}
```

---

## Map Generation Algorithm

When a catalog is loaded, LORE generates the world:

1. **Parse domains** → define regions on the overworld grid
2. **Parse systems** → group teams into clusters within regions
3. **Parse teams (groups)** → place a village for each team
4. **For each village:**
   - Parse team members → create NPCs
   - Parse owned components → create buildings (type determines sprite)
   - Parse owned APIs → embed in NPC dialogue
   - Parse resources → place interactable objects in buildings
5. **Connect villages** with paths on the overworld
6. **Persist** the generated world state

The map is **generated once and persisted**. It regenerates when:
- The user manually triggers regeneration
- The catalog data hash changes (M5)

---

## Milestones

### M1 — Walking Skeleton
**Goal:** Phaser boots inside React, player character walks on a tile map, can enter one hardcoded building.

**Deliverables:**
- [ ] React + Vite project scaffolded with TypeScript
- [ ] Phaser 3 embedded in a React component
- [ ] Tile-based overworld renders from a static tilemap
- [ ] Player character with 4-directional movement and animation
- [ ] Camera follows player
- [ ] One building with entry/exit transitions (overworld ↔ interior)
- [ ] Basic collision detection (can't walk through walls/water)

**Testable at completion:** Launch the app, walk around a small map, enter and exit a building.

---

### M2 — Single Village
**Goal:** A village generated from mock team data with buildings and NPCs you can talk to.

**Deliverables:**
- [ ] Mock catalog data for 1 team (5-6 members, 3-4 components, 1-2 APIs)
- [ ] Village map generated from mock data (buildings placed procedurally)
- [ ] NPC sprites placed in the village for each team member
- [ ] Dialogue system: approach NPC → RPG dialogue box appears
- [ ] RPG-flavored dialogue generated from entity metadata
- [ ] Detail panel: after dialogue, view real catalog data in a React overlay
- [ ] Building interiors with contextual info (component description, docs links)
- [ ] Interact-to-unlock: content starts locked, reveals on interaction

**Testable at completion:** Walk into a village, talk to NPCs who introduce themselves in character, inspect buildings to learn about services, see real data in panels.

---

### M3 — Overworld
**Goal:** Multiple villages on an overworld map with transitions and unlock tracking.

**Deliverables:**
- [ ] Mock catalog expanded to 3-4 teams with inter-team relationships
- [ ] Overworld map generated with multiple villages placed in a grid
- [ ] Smooth transitions between overworld and village scenes
- [ ] Villages show as distinct clusters on the overworld
- [ ] Path connections between villages on the overworld
- [ ] Interact-to-unlock at overworld level (villages start as silhouettes, reveal on approach)
- [ ] Mini-map component showing exploration/unlock progress
- [ ] NPC dialogue references other teams and their APIs

**Testable at completion:** Spawn on overworld, walk between villages, enter each one, talk to NPCs who reference services in other villages, track progress on mini-map.

---

### M4 — Full Mock World
**Goal:** A rich, polished mock world with all entity types, persistence, and presentation quality.

**Deliverables:**
- [ ] Rich mock catalog: 6+ teams, 20+ components, multiple domains and systems
- [ ] Domain-based regions on overworld (visual terrain differences per domain)
- [ ] System groupings visible as neighborhoods/clusters
- [ ] All entity types represented: Components, APIs, Users, Systems, Domains, Resources
- [ ] Map persistence in localStorage (resume where you left off)
- [ ] Catalog hash check: detect mock data changes, prompt regeneration
- [ ] Polished NPC dialogue with variety and personality
- [ ] Transition animations between scenes
- [ ] Sound effects and ambient music (optional, toggleable)
- [ ] Responsive detail panels with full entity information
- [ ] Loading screen with LORE branding

**Testable at completion:** A complete, polished demo world that could be shown to stakeholders. Multiple regions, dozens of NPCs, persistent progress.

---

### M5 — Live Backstage Connection
**Goal:** Connect to a real Backstage instance and generate the world from live catalog data.

**Deliverables:**
- [ ] Backstage catalog API client (REST)
- [ ] Connection screen: enter Backstage URL + API token
- [ ] Auth token stored securely (session storage)
- [ ] Catalog data fetched and normalized to internal types
- [ ] World generated from real catalog data using existing generation logic
- [ ] Refresh/sync: detect catalog changes, offer to regenerate
- [ ] Error handling: offline mode, API failures, partial data
- [ ] Configuration panel for API connection settings

**Testable at completion:** Point LORE at a real Backstage instance, authenticate, and explore your actual org as an RPG world.

---

## Future Roadmap (Post-M5)

These are out of scope for the initial build but inform architectural decisions:

- **Additional data sources:** Azure DevOps, JIRA, C4 architecture models
- **Plugin architecture:** Adapter pattern for different catalog sources
- **Multiplayer:** See other users exploring the same world in real-time
- **Quests:** "Find all services with no owner", "Visit every team in the Platform domain"
- **Backstage plugin:** Run LORE as an embedded Backstage plugin
- **Custom sprites:** Upload custom sprites for specific component types
- **Backend persistence:** Server-side map storage for team-wide shared worlds

---

## Design Principles

1. **Lore first, data second.** The RPG experience is the hook — real data is always one interaction away, but never overwhelming.
2. **Generate, don't configure.** The world should emerge from catalog data with zero manual setup.
3. **Start mock, connect later.** Every feature works with mock data before we touch an API.
4. **Iterate and test.** Each milestone produces a testable, demoable artifact.
5. **Keep it fun.** This is meant to bring joy to exploring your tech landscape. If it feels like a dashboard, we've gone wrong.
