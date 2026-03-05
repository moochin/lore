# CLAUDE.md — AI Assistant Guide for LORE

**LORE** (Logically Orchestrated RPG Environment) transforms software catalogs (Backstage) into an explorable 16-bit pixel art RPG world. Teams become villages, services become buildings, colleagues become NPCs. No combat — pure exploration and catalog discovery.

---

## Project Stack

- **Language:** TypeScript (strict mode)
- **Framework:** React 19 + Phaser 3.90 (game engine)
- **State:** Zustand 5
- **Build:** Vite 7 + `tsc -b`
- **Tests:** Vitest 4 + jsdom
- **Runtime target:** Browser (no SSR, no Node runtime code in src)

---

## Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # TypeScript check + Vite production build → /dist
npm run preview    # Preview production build
npm test           # Single test run (vitest run)
npm run test:watch # Vitest watch mode
```

There is no linting script configured — TypeScript strict mode (`"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`) acts as the linter.

---

## Architecture

### React ↔ Phaser Bridge

The two rendering systems are decoupled via **Zustand store** (`src/gameStore.ts`):

- React components read from the store and render UI overlays (dialogue, detail panel, mini-map, connection screen)
- Phaser scenes write to the store on game events (NPC interaction, building entry, entity unlock)
- `GameContainer.tsx` mounts the Phaser canvas into the React tree
- **Never** call React setState from inside Phaser scenes — always go through the Zustand store

### Scene Flow

```
BootScene  →  OverworldScene  ↔  BuildingScene
```

- **BootScene** (`src/BootScene.ts`): Procedurally generates ALL visual assets at startup using Canvas 2D — player sprites, tile textures, building art, NPC sprites, furniture. Zero external image files.
- **OverworldScene** (`src/OverworldScene.ts`): 240×200 tile world map with 6 guild villages, roads, biomes, NPC/building interaction zones, transitions into buildings.
- **BuildingScene** (`src/BuildingScene.ts`): 20×14 interior room scenes themed by entity kind (service/website/library/api), with furniture and NPCs.

### Data Layer

```
Backstage Catalog API
       ↓
 catalog.ts (REST client, cursor pagination)
       ↓
 live-catalog.ts (cache + normalization)
       ↓
 catalog-provider.ts (mock/live adapter — single import point)
       ↓
 MapGenerator.ts → OverworldScene / BuildingScene
```

- **Always import catalog data via `catalog-provider.ts`**, never directly from `catalog.ts` or `mock-catalog.ts`
- `mock-catalog.ts` has 6 teams, 21 users, 18 components, 7 APIs for offline/demo use
- Live mode activates when Backstage URL + token are set via the **B** key connection screen

### State Management (`src/gameStore.ts`)

The Zustand store is the single source of truth for:
- UI overlay visibility (dialogue, detail panel, mini-map, intro modal, connection screen)
- Currently active entity / dialogue lines / speaker
- Unlocked entities and discovered villages (persisted to localStorage)
- Backstage connection credentials and live/mock mode toggle

Persist keys in localStorage: `lore-unlocks`, `lore-villages`, `lore-intro-shown`

### Security (`src/tokenStore.ts`)

Backstage tokens are encrypted with **AES-256-GCM** (Web Crypto API):
- Encryption key stored in `sessionStorage` (ephemeral — cleared on tab close)
- Encrypted payload stored in `localStorage`
- Never log or expose tokens; never store raw tokens in localStorage

---

## Directory Structure

```
/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component — wires all UI overlays
│   ├── config.ts             # Phaser game config (800×600, tile 16px, arcade physics)
│   ├── types.ts              # Backstage entity TypeScript interfaces
│   ├── gameStore.ts          # Zustand store (central state)
│   │
│   ├── components/
│   │   ├── GameContainer.tsx # Phaser canvas mount
│   │   ├── DialogueBox.tsx   # NPC dialogue UI (typewriter effect)
│   │   ├── DetailPanel.tsx   # Entity metadata side panel
│   │   ├── MiniMap.tsx       # Village discovery mini-map
│   │   ├── IntroModal.tsx    # First-launch modal
│   │   └── ConnectionScreen.tsx  # Backstage URL+token entry
│   │
│   ├── scenes/
│   │   ├── BootScene.ts      # Procedural asset generation
│   │   ├── OverworldScene.ts # Main world map scene
│   │   └── BuildingScene.ts  # Interior room scenes
│   │
│   ├── entities/
│   │   ├── Player.ts         # Player sprite + WASD movement
│   │   └── NPC.ts            # NPC sprite + idle behavior
│   │
│   ├── systems/
│   │   ├── MapGenerator.ts   # Catalog → world map conversion
│   │   ├── DialogueSystem.ts # RPG dialogue generation from entity metadata
│   │   └── UnlockSystem.ts   # Entity unlock tracking
│   │
│   └── services/
│       ├── catalog-provider.ts  # SINGLE import point for catalog data
│       ├── catalog.ts           # Backstage REST API client
│       ├── live-catalog.ts      # Live data cache/adapter
│       ├── mock-catalog.ts      # Offline/demo mock data
│       └── tokenStore.ts        # Encrypted token persistence
│
├── src/**/*.test.ts          # Co-located tests (Vitest)
├── examples/backstage/       # Example Backstage catalog data
├── index.html                # App entry HTML
├── vite.config.ts            # CSP headers, git hash embed
├── vitest.config.ts          # jsdom environment, globals
├── tsconfig.json             # Strict TypeScript config
└── SPEC.md                   # Detailed project specification
```

---

## Key Conventions

### TypeScript

- **Strict mode is mandatory** — `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. The build (`tsc -b`) will fail on violations.
- Use interfaces from `src/types.ts` for all Backstage entity shapes (`Entity`, `Relation`, `EntityKind`, etc.)
- Entity references follow Backstage format: `kind:namespace/name` (e.g., `component:default/auth-service`, `user:default/alice-chen`)

### Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `BootScene`, `NPC`, `CatalogClient` |
| Functions/vars | camelCase | `generateDialogue`, `entityRef` |
| Constants | UPPER_SNAKE_CASE | `TILE_SIZE`, `MAP_WIDTH`, `TILE.GRASS` |
| Component style objects | `S.` prefix | `S.overlay`, `S.card`, `S.button` |
| Test files | `*.test.ts` | `gameStore.test.ts` |

### React Components

- Inline style objects use a local `const S = { ... }` pattern — keep style logic close to the component, not in separate CSS files
- Phaser key capture interferes with text inputs — always call `event.stopPropagation()` in `onKeyDown` handlers inside input fields
- No CSS modules, no Tailwind — plain inline styles only

### Phaser Scenes

- Tile size is **16px** (constant `TILE_SIZE` from `config.ts`)
- Overworld map is **240×200 tiles** (3840×3200 pixels)
- Building interiors are **20×14 tiles**
- Use Y coordinate as depth for natural sprite layering: `sprite.setDepth(sprite.y)`
- Scene transitions use 300–400ms fade in/out
- Interaction zones use Phaser `Zone` objects (not physics bodies) for building entry and NPC proximity

### Map Generation

- Teams → Villages (6 biomes: forest, desert, tundra, swamp, mountain, plains)
- Components/APIs → Buildings within their owning team's village
- Users → NPCs inside buildings
- All terrain, buildings, and furniture are procedurally drawn in `BootScene.ts` using Canvas 2D; do not import image files

### Dialogue

- NPC dialogue is generated by `DialogueSystem.ts` from entity metadata (name, description, kind, relations, owned components)
- Dialogue references cross-team API dependencies to encode architectural relationships
- Lines are stored in the Zustand store; `DialogueBox.tsx` renders them with typewriter effect (25ms/char)

---

## Testing

Tests live alongside source files as `*.test.ts`. The test environment is jsdom (browser DOM simulation).

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
```

Key test files:
- `src/gameStore.test.ts` — ~161 tests; covers all store actions, UI state transitions, persistence
- `src/systems/DialogueSystem.test.ts` — Dialogue generation for various entity types
- `src/systems/MapGenerator.test.ts` — Village/building/NPC placement logic
- `src/services/catalog-provider.test.ts` — Mock/live adapter switching
- `src/services/catalog.test.ts` — Backstage API client with paginated responses
- `src/services/live-catalog.test.ts` — Live data normalization and caching

When adding new features:
1. Add tests for any new store actions in `gameStore.test.ts`
2. Add tests for new system logic (map gen, dialogue, unlocks)
3. Keep Phaser scene logic (rendering, physics) out of unit tests — test the data/state layer

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_CSP_ORIGIN` | Restricts CSP `connect-src` to a specific origin in production |
| `VITE_GIT_HASH` | Injected automatically by Vite config from `git rev-parse --short HEAD` |

The Backstage URL and token are entered at runtime via the **B** key connection screen, not via env vars (though README documents an env var approach for embedding them at build time).

---

## Player Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Move player |
| E | Interact with NPC / enter building |
| Q | Toggle entity detail panel |
| M | Toggle mini-map |
| B | Toggle Backstage connection screen |
| ESC | Close dialogue / panels |

---

## Common Patterns

### Adding a new UI overlay

1. Add visibility state + toggle action to `src/gameStore.ts`
2. Create component in `src/components/`
3. Mount it in `src/App.tsx` alongside existing overlays
4. Use the `S.` style object pattern for inline styles

### Adding a new entity kind

1. Add the kind string to the `EntityKind` type in `src/types.ts`
2. Handle the new kind in `MapGenerator.ts` (building type, placement rules)
3. Add dialogue templates in `DialogueSystem.ts`
4. Add building/furniture sprites in `BootScene.ts` if needed

### Connecting to a live Backstage instance

1. Press **B** in game
2. Enter your Backstage URL (e.g., `https://backstage.example.com`)
3. Enter a service-to-service token or leave blank for guest auth (localhost only)
4. The game reloads world data from the live catalog

For CORS: Backstage must allow requests from the app origin. For production, set `VITE_CSP_ORIGIN` to your Backstage URL.

---

## What NOT to Do

- **Do not** call React state setters from inside Phaser scenes — use Zustand store actions
- **Do not** import image assets — all art is procedurally generated in `BootScene.ts`
- **Do not** bypass the `catalog-provider.ts` adapter — never import `mock-catalog.ts` or `catalog.ts` directly in scenes
- **Do not** store raw tokens in localStorage — always use `tokenStore.ts`
- **Do not** add `any` types — TypeScript strict mode is enforced; use proper interfaces
- **Do not** add CSS files — use the `S.` inline style pattern
- **Do not** use `console.log` for game state debugging in production — use the Zustand store's devtools or Vitest tests

---

## References

- `SPEC.md` — Full project specification, world metaphor mapping, milestone history, data model
- `README.md` — Quick start, controls, Backstage connection guide, ASCII world map
- `examples/backstage/entities.json` — Sample Backstage catalog structure for testing live connection
