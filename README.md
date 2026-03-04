# ⚔️ LORE

### *logically-orchestrated-rpg-environment*

> **Your software catalog has a story to tell. LORE lets you live it.**

---

You open your Backstage catalog. Dozens of teams. Hundreds of services. A tangled web of APIs, dependencies, and ownership that nobody really *understands* — they just navigate it, carefully, hoping not to break something.

**What if you could just… explore it?**

LORE transforms your software catalog into a living, breathing 16-bit RPG world. Teams become villages. Services become buildings. Your colleagues become NPCs with real things to say about the systems they've built. And you — you're the adventurer walking between it all, piecing together how your organisation actually works.

No combat. No grinding. Just the thrill of discovery.

---

## 🗺️ The Realm

```
    ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
    ≈                                      ≈
    ≈  🌲 [Platform Team]  🌿 [SRE Wardens] ≈
    ≈      (deep forest)      (plains)     ≈
    ≈           \                /         ≈
    ≈            \   〰️ river 〰️ /          ≈
    ≈             \            /           ≈
    ≈  🌊 [Frontend    🪨 [Payments         ≈
    ≈     Collective]    Guild]            ≈
    ≈      (swamp)       (rocky)           ≈
    ≈             \            /           ≈
    ≈              \          /            ≈
    ≈          🌸 [Security Order]         ≈
    ≈               (meadow)              ≈
    ≈                                      ≈
    ≈          🏜️ [Data Forge]             ≈
    ≈               (desert)              ≈
    ≈                                      ≈
    ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
```

Six guilds have made their home across the realm. Each village grows from its own biome — dense forests, windswept plains, misty swamps, sun-baked deserts, and meadows in bloom. Winding roads weave between them through the wilderness, carved by travellers long before you arrived.

Somewhere in these villages is the knowledge you're looking for. You just have to go find it.

---

## 🏘️ What You'll Discover

🏰 **Villages** — one per team, each with its own character and layout. The Platform Team's forge-heavy district feels very different from the Payments Guild's tidy stone halls.

🔨 **Buildings** — every service, API, and library has its own home. Forges house backend services. Towers hold websites. Libraries shelter shared code. Scroll Halls safeguard APIs. Step inside to learn what each one actually does.

🧙 **NPCs** — your real colleagues, rendered as RPG characters with something genuine to say. Ask them about their work and they'll tell you — in character — about the systems they maintain, the APIs they depend on, and the guilds they respect (or fear).

🔗 **Cross-guild connections** — nothing exists in isolation. NPCs drop the names of services in other villages, hinting at dependencies you can then go and investigate yourself. The world rewards curiosity.

🗺️ **A living mini-map** — starts dark. Fills in as you explore. Each village you discover lights up with its name. A record of how far you've ventured.

💾 **Persistent progress** — close the tab and come back later. Your discoveries are saved. The world remembers you.

---

## 🎮 Controls

| Key | Action |
|---|---|
| **WASD** / **Arrow keys** | Move your character |
| **E** | Talk to an NPC / Enter a building |
| **Q** | View full entity details (inside buildings) |
| **M** | Toggle mini-map |
| **ESC** | Close any open panel |

---

## ⚡ Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and step through the gate.

---

## 🔮 The Vision

Right now, LORE runs on a mock catalog — six guilds, eighteen components, seven APIs, twenty-one adventurers.

**But this is just the beginning.**

The endgame is to point LORE at your *real* Backstage instance and watch your actual organisation appear: your teams in their villages, your services in their buildings, your colleagues ready to tell you what they know. Every onboarding call replaced by a walk through the realm. Every architecture diagram replaced by a building you can enter.

Future expeditions will chart:

- 🔌 **Live Backstage connection** — real catalog data, real world
- 🗂️ **Azure DevOps, JIRA, C4** — more data sources, richer lore
- 🧩 **Backstage plugin** — LORE running natively inside your catalog
- 🌐 **Multiplayer** — see your colleagues exploring the same world in real time
- 🏆 **Quests** — "Find every service with no owner." "Visit all six guilds." "Trace a request from frontend to database."

---

## 🛠️ How It's Built

There are **no image files** in this project. Every tile, building, character, and piece of furniture is drawn programmatically at boot time using Canvas 2D — a fully self-contained pixel art engine living inside `BootScene.ts`.

The world itself is generated from `mock-catalog.ts` by `MapGenerator.ts`, which:
- 🎨 Paints biome terrain around each village
- 🛤️ Carves meandering, organic roads between guilds
- 🌊 Draws a river and scatters wilderness ponds
- 🏗️ Places buildings and NPCs from catalog data

The React shell and Phaser game engine stay in sync through a shared Zustand store — game events flow up, UI actions flow down, and neither side knows too much about the other.

| Layer | Technology |
|---|---|
| 🖥️ UI Shell | React 19 + TypeScript |
| 🎮 Game Engine | Phaser 3.90 |
| ⚡ Build Tool | Vite 7 |
| 🗃️ State | Zustand |
| 🎨 Art | 100% procedurally generated via Canvas 2D |
| 💾 Persistence | localStorage |

---

*May your deploys be swift, your logs be clear, and your on-call shifts be quiet.* 🏕️
