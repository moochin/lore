![Lore Logo](lore-logo.png)

# ⚔️ LORE

### *logically-orchestrated-rpg-environment*

> **Your software catalog has a story to tell. LORE lets you live it.**

---

Struggling to get engagement with your shiny new backstage instance? Want to drive more engagement? Want to encourage teams to keep it up to date?

**What if you could turn your backstage into an exporable world...**

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
| **B** | Open Backstage connection panel |
| **ESC** | Close any open panel |

---

## ⚡ Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and step through the gate.

By default LORE runs on built-in mock data — no setup required. To connect your real Backstage instance, press **B** at any time to open the connection panel, paste your catalog URL and a service token, and watch your organisation materialise.

---

## 🔌 Backstage Connection

LORE can connect to a live Backstage instance and generate the world from your real catalog data. Press **B** in-game (or use the connection screen on first launch) and provide:

| Field | What to enter |
|---|---|
| **Catalog URL** | Your Backstage base URL, e.g. `https://backstage.example.com` |
| **API Token** | A Backstage external access token for the Catalog API |

Once connected, LORE fetches groups, components, APIs, and users from the `/api/catalog/entities` endpoint and rebuilds the world around your real organisation. Your token is encrypted in `localStorage` using a session-derived key — it never leaves the browser.

You can disconnect or reconfigure at any time by pressing **B** again.

---

### 🔑 Getting an API Token

LORE sends requests as `Authorization: Bearer <token>`. The simplest way to grant access is an **external access token** configured directly in your Backstage `app-config.yaml`.

**Step 1 — Add a static external access token** ([Backstage docs: Service-to-service auth](https://backstage.io/docs/auth/service-to-service-auth#static-tokens))

```yaml
# app-config.yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${LORE_TOKEN}   # set this env var to a long random secret
          subject: lore-explorer
```

Generate a suitable secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Step 2 — Restart Backstage** to pick up the config change.

**Step 3 — Paste the token value** into LORE's API Token field.

> **Note:** `externalAccess` static tokens require Backstage **v1.20+**. For older versions, see [legacy static token auth](https://backstage.io/docs/tutorials/authenticate-api-requests).

---

### 🌐 CORS Configuration

Because LORE runs in your browser, requests go directly from your origin to Backstage. If your instance is on a different domain you may need to allow LORE's origin explicitly. ([Backstage docs: CORS](https://backstage.io/docs/conf/writing#cors))

```yaml
# app-config.yaml
backend:
  cors:
    origin: https://your-lore-deployment.example.com
    methods: [GET]
    credentials: false
```

For local development you can allow all origins temporarily:
```yaml
backend:
  cors:
    origin: '*'
```

---

### 🚀 Pre-configured Deployments (env vars)

For hosted or automated deployments where you want the connection screen skipped entirely, set both env vars at **build time**:

```bash
VITE_BACKSTAGE_BASE_URL=https://backstage.example.com
VITE_BACKSTAGE_TOKEN=your-token-here
```

When both are present, LORE auto-connects on load and goes straight to the game — no connection screen, no manual entry required.

> [!WARNING]
> `VITE_*` variables are **baked into the compiled JavaScript bundle**. Anyone who can load the page can read the token value from the source. Only use this approach for:
> - **Private/internal deployments** behind authentication (SSO, VPN, etc.)
> - Environments where the Backstage token is low-privilege and read-only
>
> For public deployments, leave these env vars unset and let users supply their own tokens through the connection panel.

---

### 💻 Local Development (no token needed)

When you point LORE at `localhost` or `127.0.0.1`, it automatically attempts guest auth — no token required. This works out of the box with a standard local Backstage dev setup ([Backstage docs: Guest auth provider](https://backstage.io/docs/auth/guest/provider)).

```bash
# Start your local Backstage
yarn dev

# Point LORE at:
http://localhost:7007
```

Leave the API Token field blank and LORE will negotiate a guest token automatically.

---

## 🔮 The Vision

LORE already connects to live Backstage instances, transforming your real teams into villages, your services into buildings, and your colleagues into NPCs with genuine things to say.

**But this is just the beginning.**

Future expeditions will chart:

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
| 🔐 Token Storage | AES-GCM encrypted localStorage |
| 💾 Persistence | localStorage |

---

*May your deploys be swift, your logs be clear, and your on-call shifts be quiet.* 🏕️
