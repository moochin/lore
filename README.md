# LORE

**Logically Orchestrated RPG Environment**

> *Your software catalog, reimagined as a 16-bit RPG.*

Teams become villages. Services become buildings. Your colleagues become NPCs who share the lore of your organization — all rendered in pixel art, powered by Phaser 3.

No combat. No grinding. Just exploration, discovery, and learning.

---

## The World

```
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ~                                      ~
    ~   [Platform Team]    [SRE Wardens]   ~
    ~     (forest)           (plains)      ~
    ~          \               /           ~
    ~           \    ~river~  /            ~
    ~            \           /             ~
    ~   [Frontend     [Payments            ~
    ~    Collective]   Guild]              ~
    ~     (swamp)      (rocky)             ~
    ~            \           /             ~
    ~             \         /              ~
    ~         [Security Order]             ~
    ~           (meadow)                   ~
    ~                                      ~
    ~       [Data Forge]                   ~
    ~         (desert)                     ~
    ~                                      ~
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

Six guilds have settled across the realm. Each village sits within its own biome — dense forests, rocky highlands, misty swamps, arid deserts, and flowering meadows. Winding roads connect them all through the wilderness.

## What You'll Find

- **Villages** — one per team, filled with buildings and NPCs
- **Buildings** — each represents a service or API, with distinct architecture (forges for services, towers for websites, libraries for shared code, scroll halls for APIs)
- **NPCs** — your colleagues, speaking in RPG-flavored dialogue about the real systems they maintain
- **Cross-team connections** — NPCs reference other guilds and their APIs through conversation
- **A mini-map** — tracks your discoveries as you explore

## Controls

| Key | Action |
|---|---|
| **WASD** / **Arrows** | Move |
| **E** | Talk to NPCs / Enter buildings |
| **Q** | View full entity details (inside buildings) |
| **M** | Toggle mini-map |
| **ESC** | Close panels |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and begin your adventure.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Shell | React 19 + TypeScript |
| Game Engine | Phaser 3.90 |
| Build Tool | Vite 7 |
| State | Zustand |
| Art | 100% procedurally generated via Canvas 2D — zero external assets |
| Persistence | localStorage |

## How It Works

All pixel art is generated programmatically at boot time — every tile, building, character sprite, and terrain type is drawn with Canvas 2D in `BootScene.ts`. There are no image files in this project.

The world is generated from a mock Backstage catalog (`mock-catalog.ts`) containing 6 teams, 21 users, 18 components, and 7 APIs. The `MapGenerator` paints biome terrain, carves meandering roads, places rivers and ponds, and lays out each village.

Your progress (discovered villages, unlocked entities) persists across sessions via localStorage.

## Vision

LORE will eventually connect to real data sources — Backstage, Azure DevOps, JIRA, C4 architecture models — letting you explore any organization's landscape as a living RPG world.

---

*May your deploys be swift and your logs be clear.*
