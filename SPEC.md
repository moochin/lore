# LORE — Logically Orchestrated RPG Environment

## Overview

LORE is a web application that connects to a Backstage instance and generates an explorable 16-bit pixel art RPG world using Phaser. Think *A Link to the Past* meets your software catalog — teams become villages, services become buildings, and your colleagues become NPCs who share the lore of your organization.

The player character represents the logged-in Backstage user. There is no combat — the core loop is **exploration, discovery, and learning**. You unlock the map by interacting with the world, talking to NPCs, and entering buildings to reveal what your organization has built.

**Future vision:** LORE will support multiple data sources beyond Backstage, including Azure DevOps, JIRA, and C4 architecture models — letting you explore any organization's landscape as a living RPG world.

---

## Current Status — M4 Complete ✓

> *Last updated: 2026-03-04*

**Phases complete:** M1, M2, M3, M4

The demo world is fully playable. Six guild villages span a 240×200-tile overworld with distinct biomes, meandering roads, a river, and themed building interiors. All art is generated procedurally at boot time — zero external asset files.

**What's running:**
- 6 teams, 21 users, 18 components, 7 APIs in the mock catalog
- Biome terrain per village (forest, rocky, swamp, desert, meadow, plains)
- 4 distinct building sprites (forge, tower, library, scroll hall) matching component type
- Themed building interiors: 15 furniture sprites, 4 layout themes with collision
- NPC dialogue with RPG-flavored lore referencing real catalog data
- Detail panel showing raw entity metadata after dialogue
- Mini-map with village discovery tracking
- localStorage persistence (progress survives refresh)
- Fade transitions between overworld and building scenes
- Intro modal on first launch

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
- Tile-based terrain (grass, paths, water, trees, rocks, swamp, sand, dense forest, flowers)
- Distinct building sprites for different component types (forge for services, tower for websites, library for shared libraries, scroll hall for APIs)
- Character sprites for NPCs with idle animations
- Smooth tile-to-tile movement with transitions between maps

### Asset Strategy
- **100% procedurally generated** via Canvas 2D in `BootScene.ts` — zero external image files
- Every tile, building sprite, character sprite, furniture piece, and terrain type is drawn programmatically at boot
- This eliminates external asset dependencies entirely and makes the project fully self-contained

---

## Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| **UI Shell** | React 19 + TypeScript |
| **Game Engine** | Phaser 3.90 (embedded in React via a container component) |
| **Build Tool** | Vite 7 |
| **State Management** | Zustand (shared state between React UI and Phaser) |
| **Art** | 100% procedurally generated via Canvas 2D — zero external assets |
| **Data Layer** | Mock JSON data (M1–M4), Backstage REST API (M5) |
| **Map Persistence** | localStorage (M4), backend/DB (future) |

### Project Structure

```
lore/
├── src/
│   ├── components/            # React UI components
│   │   ├── GameContainer.tsx  # Phaser mount point
│   │   ├── DetailPanel.tsx    # Entity info overlay
│   │   ├── MiniMap.tsx        # Village discovery mini-map
│   │   ├── DialogueBox.tsx    # RPG dialogue UI
│   │   └── IntroModal.tsx     # First-launch welcome screen
│   ├── game/                  # Phaser game code
│   │   ├── scenes/
│   │   │   ├── BootScene.ts       # Procedural sprite/tile generation
│   │   │   ├── OverworldScene.ts  # 240×200 tile overworld map
│   │   │   └── BuildingScene.ts   # Building interiors with furniture
│   │   ├── entities/
│   │   │   ├── Player.ts          # Player character + movement
│   │   │   └── NPC.ts             # NPC sprite + dialogue trigger
│   │   ├── systems/
│   │   │   └── MapGenerator.ts    # Catalog → world generation
│   │   └── config.ts             # Phaser game config
│   ├── data/
│   │   ├── mock-catalog.ts        # 6 teams, 21 users, 18 components, 7 APIs
│   │   └── types.ts               # Backstage entity type definitions
│   ├── store/
│   │   └── gameStore.ts           # Zustand store + localStorage persistence
│   ├── App.tsx
│   └── main.tsx
├── README.md
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
  unlockedEntities: string[];  // Entity refs the player has unlocked
  discoveredVillages: string[]; // Village refs the player has approached
  introShown: boolean;
  playerPosition: { x: number; y: number };
}

interface VillageState {
  teamRef: string;
  position: { x: number; y: number };  // Overworld tile position
  buildings: BuildingState[];
  npcs: NPCState[];
}

interface BuildingState {
  entityRef: string;
  name: string;
  position: { x: number; y: number };
  buildingType: 'component' | 'api';
  componentType?: string;  // 'service' | 'website' | 'library' → determines sprite + interior theme
}
```

---

## Map Generation Algorithm

When a catalog is loaded, LORE generates the world:

1. **Parse domains** → define regions on the overworld grid
2. **Parse systems** → group teams into clusters within regions
3. **Parse teams (groups)** → place a village for each team
4. **Paint biome terrain** around each village (radius-based, deterministic)
5. **Draw meandering roads** between villages with organic wobble paths
6. **Place rivers and ponds** for visual variety
7. **For each village:**
   - Parse team members → create NPCs
   - Parse owned components → create buildings (type determines sprite)
   - Parse owned APIs → embed in NPC dialogue
8. **Persist** the generated world state to localStorage

The map is **generated once and persisted**. It regenerates when the user manually triggers regeneration (Backstage hash-based regeneration planned for M5).

---

## Milestones

### M1 — Walking Skeleton ✓
**Goal:** Phaser boots inside React, player character walks on a tile map, can enter one hardcoded building.

**Deliverables:**
- [x] React + Vite project scaffolded with TypeScript
- [x] Phaser 3 embedded in a React component
- [x] Tile-based overworld renders from a procedurally generated tilemap
- [x] Player character with 4-directional movement and animation
- [x] Camera follows player
- [x] One building with entry/exit transitions (overworld ↔ interior)
- [x] Basic collision detection (can't walk through walls/water)

---

### M2 — Single Village ✓
**Goal:** A village generated from mock team data with buildings and NPCs you can talk to.

**Deliverables:**
- [x] Mock catalog data for 1 team (5-6 members, 3-4 components, 1-2 APIs)
- [x] Village map generated from mock data (buildings placed procedurally)
- [x] NPC sprites placed in the village for each team member
- [x] Dialogue system: approach NPC → RPG dialogue box appears
- [x] RPG-flavored dialogue generated from entity metadata
- [x] Detail panel: after dialogue, view real catalog data in a React overlay
- [x] Building interiors with contextual info (component description, docs links)
- [x] Interact-to-unlock: content starts locked, reveals on interaction

---

### M3 — Overworld ✓
**Goal:** Multiple villages on an overworld map with transitions and unlock tracking.

**Deliverables:**
- [x] Mock catalog expanded to 3-4 teams with inter-team relationships
- [x] Overworld map generated with multiple villages placed in a grid
- [x] Smooth transitions between overworld and village scenes
- [x] Villages show as distinct clusters on the overworld
- [x] Path connections between villages on the overworld
- [x] Interact-to-unlock at overworld level (villages reveal name on approach)
- [x] Mini-map component showing exploration/unlock progress
- [x] NPC dialogue references other teams and their APIs

---

### M4 — Full Mock World ✓
**Goal:** A rich, polished mock world with all entity types, persistence, and presentation quality.

**Deliverables:**
- [x] Rich mock catalog: 6 teams, 21 users, 18 components, 7 APIs
- [x] Domain-based regions on overworld — distinct biome terrain per village (forest, rocky, swamp, desert, meadow, plains)
- [x] All entity types represented: Components, APIs, Users
- [x] Map persistence in localStorage (resume where you left off)
- [x] Polished NPC dialogue with variety and personality
- [x] Transition animations between scenes (300ms fade out / 400ms fade in)
- [x] Responsive detail panels with full entity information

**Beyond original spec (bonus deliverables):**
- [x] 4 distinct building sprites matched to component type (forge/service, tower/website, library/library, scroll hall/API)
- [x] Meandering organic roads with wobble-based path algorithm
- [x] 12 terrain tile types including rock, swamp, sand, dense forest, flowers
- [x] 15 furniture sprites and 4 themed interior layouts (forge, office, library, scroll hall)
- [x] Furniture collision with physics zones; Y-based depth sorting for player
- [x] River and pond generation for visual variety
- [x] README.md with ASCII world map, controls, and tech overview

**Not implemented (descoped):**
- [ ] System groupings visible as distinct neighborhoods/clusters
- [ ] Catalog hash check / regeneration prompt
- [ ] Sound effects and ambient music
- [ ] Loading screen with LORE branding

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
