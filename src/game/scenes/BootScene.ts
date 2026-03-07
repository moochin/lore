import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';

const NPC_PALETTES = [
  { body: '#aa3355', hair: '#2b1a0e', skin: '#f0c8a0' },
  { body: '#33aa55', hair: '#d4a017', skin: '#e8b88a' },
  { body: '#5533aa', hair: '#8b0000', skin: '#f0c8a0' },
  { body: '#aa8833', hair: '#1a1a1a', skin: '#c8a070' },
  { body: '#338888', hair: '#704214', skin: '#f0c8a0' },
  { body: '#884433', hair: '#d4d4d4', skin: '#e8b88a' },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.generateTileset();
    this.generatePlayerSprite();
    this.generateBuildingSprites();
    this.generateFurnitureSprites();
    this.generateNPCSprites();
    this.generateEmoteSprites();
    this.generateParticleTextures();
    this.scene.start('OverworldScene');
  }

  private generateTileset() {
    const T = TILE_SIZE;
    const S = T / 16;

    // Grass tile (index 0)
    const grass = this.textures.createCanvas('tile_grass', T, T)!;
    const gctx = grass.getContext();
    gctx.fillStyle = '#4a8c3f';
    gctx.fillRect(0, 0, T, T);
    gctx.fillStyle = '#5a9c4f';
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(Math.random() * T);
      const y = Math.floor(Math.random() * T);
      gctx.fillRect(x, y, S, S);
    }
    grass.refresh();

    // Path tile (index 1)
    const path = this.textures.createCanvas('tile_path', T, T)!;
    const pctx = path.getContext();
    pctx.fillStyle = '#c4a882';
    pctx.fillRect(0, 0, T, T);
    pctx.fillStyle = '#b89c76';
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(Math.random() * T);
      const y = Math.floor(Math.random() * T);
      pctx.fillRect(x, y, 2 * S, S);
    }
    path.refresh();

    // Water tile (index 2) — base frame
    const water = this.textures.createCanvas('tile_water', T, T)!;
    const wctx = water.getContext();
    wctx.fillStyle = '#3366aa';
    wctx.fillRect(0, 0, T, T);
    wctx.fillStyle = '#4477bb';
    wctx.fillRect(2 * S, 4 * S, 4 * S, S);
    wctx.fillRect(10 * S, 10 * S, 3 * S, S);
    water.refresh();

    // Water animation frames (shifted wave highlights)
    // Frame 0 is a copy of the base water tile
    const w0 = this.textures.createCanvas('tile_water_0', T, T)!;
    const w0Ctx = w0.getContext();
    w0Ctx.fillStyle = '#3366aa';
    w0Ctx.fillRect(0, 0, T, T);
    w0Ctx.fillStyle = '#4477bb';
    w0Ctx.fillRect(2 * S, 4 * S, 4 * S, S);
    w0Ctx.fillRect(10 * S, 10 * S, 3 * S, S);
    w0.refresh();

    for (let f = 1; f <= 2; f++) {
      const wf = this.textures.createCanvas(`tile_water_${f}`, T, T)!;
      const wfCtx = wf.getContext();
      wfCtx.fillStyle = '#3366aa';
      wfCtx.fillRect(0, 0, T, T);
      wfCtx.fillStyle = '#4477bb';
      // Shift wave lines by f*4 sub-pixels, wrapping around
      const off = f * 4 * S;
      wfCtx.fillRect(((2 * S + off) % T), 4 * S, 4 * S, S);
      wfCtx.fillRect(((10 * S + off) % T), 10 * S, 3 * S, S);
      // Extra shimmer highlight
      wfCtx.fillStyle = '#5588cc';
      wfCtx.fillRect(((6 * S + off) % T), (7 + f * 2) * S, 3 * S, S);
      wf.refresh();
    }

    // Wall tile (index 3)
    const wall = this.textures.createCanvas('tile_wall', T, T)!;
    const wallCtx = wall.getContext();
    wallCtx.fillStyle = '#8b7355';
    wallCtx.fillRect(0, 0, T, T);
    wallCtx.fillStyle = '#7a6348';
    wallCtx.fillRect(0, 0, T, S);
    wallCtx.fillRect(0, 8 * S, T, S);
    wallCtx.fillStyle = '#9c8466';
    wallCtx.fillRect(0, 4 * S, T, S);
    wall.refresh();

    // Tree tile (index 4)
    const tree = this.textures.createCanvas('tile_tree', T, T)!;
    const tctx = tree.getContext();
    tctx.fillStyle = '#4a8c3f';
    tctx.fillRect(0, 0, T, T);
    tctx.fillStyle = '#8b6b3e';
    tctx.fillRect(6 * S, 10 * S, 4 * S, 6 * S);
    tctx.fillStyle = '#2d6b2e';
    tctx.fillRect(3 * S, 2 * S, 10 * S, 9 * S);
    tctx.fillStyle = '#3a7d3b';
    tctx.fillRect(4 * S, 3 * S, 8 * S, 7 * S);
    tree.refresh();

    // Floor tile (index 5)
    const floor = this.textures.createCanvas('tile_floor', T, T)!;
    const fctx = floor.getContext();
    fctx.fillStyle = '#a08060';
    fctx.fillRect(0, 0, T, T);
    fctx.fillStyle = '#907050';
    fctx.fillRect(0, 0, T / 2, T / 2);
    fctx.fillRect(T / 2, T / 2, T / 2, T / 2);
    floor.refresh();

    // Door tile (index 6)
    const door = this.textures.createCanvas('tile_door', T, T)!;
    const dctx = door.getContext();
    dctx.fillStyle = '#c4a882';
    dctx.fillRect(0, 0, T, T);
    dctx.fillStyle = '#6b4226';
    dctx.fillRect(3 * S, 2 * S, 10 * S, 14 * S);
    dctx.fillStyle = '#8b5a2b';
    dctx.fillRect(4 * S, 3 * S, 8 * S, 12 * S);
    dctx.fillStyle = '#daa520';
    dctx.fillRect(10 * S, 9 * S, 2 * S, 2 * S);
    door.refresh();

    // Rock tile (index 7)
    const rock = this.textures.createCanvas('tile_rock', T, T)!;
    const rctx = rock.getContext();
    rctx.fillStyle = '#4a8c3f'; // grass background
    rctx.fillRect(0, 0, T, T);
    rctx.fillStyle = '#888888';
    rctx.fillRect(3 * S, 5 * S, 10 * S, 8 * S);
    rctx.fillStyle = '#999999';
    rctx.fillRect(4 * S, 6 * S, 8 * S, 6 * S);
    rctx.fillStyle = '#aaaaaa';
    rctx.fillRect(5 * S, 7 * S, 4 * S, 3 * S);
    rock.refresh();

    // Swamp tile (index 8)
    const swamp = this.textures.createCanvas('tile_swamp', T, T)!;
    const sctx = swamp.getContext();
    sctx.fillStyle = '#2a5c2a';
    sctx.fillRect(0, 0, T, T);
    sctx.fillStyle = '#3a6c3a';
    sctx.fillRect(2 * S, 3 * S, 5 * S, 3 * S);
    sctx.fillRect(9 * S, 8 * S, 4 * S, 4 * S);
    sctx.fillStyle = '#1a4c2a';
    sctx.fillRect(6 * S, 11 * S, 3 * S, 2 * S);
    sctx.fillStyle = '#4a7c4a';
    sctx.fillRect(0, 7 * S, 3 * S, S);
    sctx.fillRect(11 * S, 2 * S, 2 * S, S);
    swamp.refresh();

    // Desert / sand tile (index 9)
    const sand = this.textures.createCanvas('tile_sand', T, T)!;
    const sdctx = sand.getContext();
    sdctx.fillStyle = '#d4b876';
    sdctx.fillRect(0, 0, T, T);
    sdctx.fillStyle = '#c4a866';
    sdctx.fillRect(3 * S, 5 * S, 4 * S, 2 * S);
    sdctx.fillRect(10 * S, 10 * S, 3 * S, S);
    sdctx.fillStyle = '#e4c886';
    sdctx.fillRect(7 * S, 2 * S, 2 * S, S);
    sdctx.fillRect(S, 12 * S, 2 * S, S);
    sand.refresh();

    // Dense forest tile (index 10) — darker, denser tree
    const denseTree = this.textures.createCanvas('tile_dense_tree', T, T)!;
    const dtctx = denseTree.getContext();
    dtctx.fillStyle = '#2a5c2e';
    dtctx.fillRect(0, 0, T, T);
    dtctx.fillStyle = '#5c3a1e';
    dtctx.fillRect(6 * S, 11 * S, 4 * S, 5 * S);
    dtctx.fillStyle = '#1a4a1e';
    dtctx.fillRect(2 * S, S, 12 * S, 11 * S);
    dtctx.fillStyle = '#2a5a2e';
    dtctx.fillRect(3 * S, 2 * S, 10 * S, 9 * S);
    dtctx.fillStyle = '#1a3a1e';
    dtctx.fillRect(5 * S, 4 * S, 6 * S, 5 * S);
    denseTree.refresh();

    // Flower patch tile (index 11)
    const flower = this.textures.createCanvas('tile_flower', T, T)!;
    const flctx = flower.getContext();
    flctx.fillStyle = '#4a8c3f';
    flctx.fillRect(0, 0, T, T);
    flctx.fillStyle = '#5a9c4f';
    flctx.fillRect(2 * S, 2 * S, S, S);
    flctx.fillRect(9 * S, 6 * S, S, S);
    // Flowers
    flctx.fillStyle = '#ff6688';
    flctx.fillRect(4 * S, 3 * S, 2 * S, 2 * S);
    flctx.fillStyle = '#ffdd44';
    flctx.fillRect(10 * S, 9 * S, 2 * S, 2 * S);
    flctx.fillStyle = '#8866ff';
    flctx.fillRect(2 * S, 11 * S, 2 * S, 2 * S);
    flctx.fillStyle = '#ff8844';
    flctx.fillRect(12 * S, 4 * S, 2 * S, 2 * S);
    flower.refresh();
  }

  private generatePlayerSprite() {
    const T = TILE_SIZE;
    const directions = ['down', 'left', 'right', 'up'];
    const frameCount = 3;

    const sw = T * frameCount;
    const sh = T * directions.length;
    const canvas = this.textures.createCanvas('player', sw, sh)!;
    const ctx = canvas.getContext();

    directions.forEach((dir, row) => {
      for (let frame = 0; frame < frameCount; frame++) {
        const ox = frame * T;
        const oy = row * T;
        this.drawCharacter(ctx, ox, oy, dir, frame, '#3355aa', '#8b4513', '#f0c8a0');
      }
    });

    canvas.refresh();

    directions.forEach((_dir, row) => {
      for (let i = 0; i < frameCount; i++) {
        this.textures.get('player').add(row * frameCount + i, 0, i * T, row * T, T, T);
      }
    });
  }

  private generateNPCSprites() {
    const T = TILE_SIZE;
    const directions = ['down', 'left', 'right', 'up'];
    const frameCount = 3;

    NPC_PALETTES.forEach((palette, index) => {
      const key = `npc_${index}`;
      const sw = T * frameCount;
      const sh = T * directions.length;
      const canvas = this.textures.createCanvas(key, sw, sh)!;
      const ctx = canvas.getContext();

      directions.forEach((dir, row) => {
        for (let frame = 0; frame < frameCount; frame++) {
          this.drawCharacter(ctx, frame * T, row * T, dir, frame, palette.body, palette.hair, palette.skin);
        }
      });

      canvas.refresh();

      directions.forEach((_dir, row) => {
        for (let i = 0; i < frameCount; i++) {
          this.textures.get(key).add(row * frameCount + i, 0, i * T, row * T, T, T);
        }
      });
    });
  }

  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    direction: string,
    frame: number,
    bodyColor: string,
    hairColor: string,
    skinColor: string,
  ) {
    const S = TILE_SIZE / 16;
    const walkOffset = frame === 1 ? -S : frame === 2 ? S : 0;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(ox + 4 * S, oy + 6 * S, 8 * S, 7 * S);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(ox + 5 * S, oy + S, 6 * S, 5 * S);

    // Hair
    ctx.fillStyle = hairColor;
    if (direction === 'up') {
      ctx.fillRect(ox + 5 * S, oy + S, 6 * S, 2 * S);
    } else {
      ctx.fillRect(ox + 5 * S, oy + S, 6 * S, S);
    }

    // Eyes
    if (direction !== 'up') {
      ctx.fillStyle = '#222222';
      if (direction === 'left') {
        ctx.fillRect(ox + 5 * S, oy + 3 * S, S, S);
      } else if (direction === 'right') {
        ctx.fillRect(ox + 10 * S, oy + 3 * S, S, S);
      } else {
        ctx.fillRect(ox + 6 * S, oy + 3 * S, S, S);
        ctx.fillRect(ox + 9 * S, oy + 3 * S, S, S);
      }
    }

    // Legs
    ctx.fillStyle = '#554433';
    ctx.fillRect(ox + 5 * S + walkOffset, oy + 13 * S, 3 * S, 3 * S);
    ctx.fillRect(ox + 8 * S - walkOffset, oy + 13 * S, 3 * S, 3 * S);
  }

  private generateBuildingSprites() {
    // Generate different building sprites per component type
    this.generateServiceBuilding();
    this.generateWebsiteBuilding();
    this.generateLibraryBuilding();
    this.generateApiBuilding();
    // Keep a default 'building' as fallback
    this.generateDefaultBuilding();
  }

  private generateDefaultBuilding() {
    const S = TILE_SIZE / 16;
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building', BW, BH)!;
    const ctx = canvas.getContext();

    ctx.fillStyle = '#8b7355';
    ctx.fillRect(4 * S, 12 * S, BW - 8 * S, BH - 12 * S);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(0, 4 * S, BW, 12 * S);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(4 * S, 0, BW - 8 * S, 8 * S);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(18 * S, BH - 16 * S, 12 * S, 16 * S);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(20 * S, BH - 14 * S, 8 * S, 14 * S);
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(6 * S, 20 * S, 8 * S, 8 * S);
    ctx.fillRect(34 * S, 20 * S, 8 * S, 8 * S);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(10 * S, 20 * S, S, 8 * S);
    ctx.fillRect(6 * S, 24 * S, 8 * S, S);
    ctx.fillRect(38 * S, 20 * S, S, 8 * S);
    ctx.fillRect(34 * S, 24 * S, 8 * S, S);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26 * S, BH - 8 * S, 2 * S, 2 * S);
    canvas.refresh();
  }

  // Forge-style building for services — stone walls, chimney with smoke
  private generateServiceBuilding() {
    const S = TILE_SIZE / 16;
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_service', BW, BH)!;
    const ctx = canvas.getContext();

    // Stone walls
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(2 * S, 10 * S, BW - 4 * S, BH - 10 * S);
    // Stone texture
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(4 * S, 14 * S, 8 * S, 6 * S);
    ctx.fillRect(16 * S, 18 * S, 10 * S, 6 * S);
    ctx.fillRect(30 * S, 14 * S, 8 * S, 8 * S);

    // Dark roof
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(0, 4 * S, BW, 10 * S);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(4 * S, 0, BW - 8 * S, 8 * S);

    // Chimney
    ctx.fillStyle = '#555555';
    ctx.fillRect(34 * S, 0, 8 * S, 10 * S);
    // Smoke puffs
    ctx.fillStyle = '#aaaaaa88';
    ctx.fillRect(36 * S, -2 * S, 4 * S, 3 * S);

    // Door (arched, centered)
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(18 * S, BH - 16 * S, 12 * S, 16 * S);
    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(20 * S, BH - 14 * S, 8 * S, 14 * S);
    // Arch top
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(19 * S, BH - 17 * S, 10 * S, 2 * S);

    // Orange glow windows (forge fire)
    ctx.fillStyle = '#ff8833';
    ctx.fillRect(6 * S, 18 * S, 8 * S, 6 * S);
    ctx.fillRect(34 * S, 18 * S, 8 * S, 6 * S);
    // Window frames
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(10 * S, 18 * S, S, 6 * S);
    ctx.fillRect(6 * S, 21 * S, 8 * S, S);
    ctx.fillRect(38 * S, 18 * S, S, 6 * S);
    ctx.fillRect(34 * S, 21 * S, 8 * S, S);

    // Door handle
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26 * S, BH - 8 * S, 2 * S, 2 * S);

    canvas.refresh();
  }

  // Tower-style building for websites — tall, peaked roof, flag
  private generateWebsiteBuilding() {
    const S = TILE_SIZE / 16;
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_website', BW, BH)!;
    const ctx = canvas.getContext();

    // Taller stone body
    ctx.fillStyle = '#8888aa';
    ctx.fillRect(6 * S, 8 * S, BW - 12 * S, BH - 8 * S);
    // Accent stripes
    ctx.fillStyle = '#7777aa';
    ctx.fillRect(6 * S, 16 * S, BW - 12 * S, 2 * S);
    ctx.fillRect(6 * S, 26 * S, BW - 12 * S, 2 * S);

    // Peaked roof
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(2 * S, 4 * S, BW - 4 * S, 8 * S);
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(8 * S, 0, BW - 16 * S, 6 * S);

    // Flag pole
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(23 * S, -4 * S, 2 * S, 8 * S);
    // Flag
    ctx.fillStyle = '#dd3333';
    ctx.fillRect(25 * S, -4 * S, 8 * S, 5 * S);
    ctx.fillStyle = '#bb2222';
    ctx.fillRect(25 * S, -2 * S, 8 * S, S);

    // Large arched window
    ctx.fillStyle = '#aaccff';
    ctx.fillRect(14 * S, 12 * S, 20 * S, 10 * S);
    ctx.fillStyle = '#6688bb';
    ctx.fillRect(24 * S, 12 * S, S, 10 * S);
    ctx.fillRect(14 * S, 17 * S, 20 * S, S);

    // Door
    ctx.fillStyle = '#3a3a6a';
    ctx.fillRect(18 * S, BH - 14 * S, 12 * S, 14 * S);
    ctx.fillStyle = '#4a4a7a';
    ctx.fillRect(20 * S, BH - 12 * S, 8 * S, 12 * S);

    // Door handle
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26 * S, BH - 8 * S, 2 * S, 2 * S);

    canvas.refresh();
  }

  // Library building — wide, bookshelves visible through windows
  private generateLibraryBuilding() {
    const S = TILE_SIZE / 16;
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_library', BW, BH)!;
    const ctx = canvas.getContext();

    // Warm wooden walls
    ctx.fillStyle = '#9c7a52';
    ctx.fillRect(2 * S, 10 * S, BW - 4 * S, BH - 10 * S);
    // Wood grain
    ctx.fillStyle = '#8c6a42';
    ctx.fillRect(4 * S, 14 * S, BW - 8 * S, S);
    ctx.fillRect(4 * S, 22 * S, BW - 8 * S, S);
    ctx.fillRect(4 * S, 30 * S, BW - 8 * S, S);

    // Sloped roof (brown)
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 4 * S, BW, 10 * S);
    ctx.fillStyle = '#5a3318';
    ctx.fillRect(6 * S, 0, BW - 12 * S, 6 * S);

    // Windows showing bookshelves
    ctx.fillStyle = '#ffe8a0'; // warm light
    ctx.fillRect(6 * S, 16 * S, 10 * S, 10 * S);
    ctx.fillRect(32 * S, 16 * S, 10 * S, 10 * S);
    // Book spines
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(7 * S, 17 * S, 2 * S, 8 * S);
    ctx.fillStyle = '#3333aa';
    ctx.fillRect(10 * S, 17 * S, 2 * S, 8 * S);
    ctx.fillStyle = '#33aa33';
    ctx.fillRect(13 * S, 17 * S, 2 * S, 8 * S);
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(33 * S, 17 * S, 2 * S, 8 * S);
    ctx.fillStyle = '#aaaa33';
    ctx.fillRect(36 * S, 17 * S, 2 * S, 8 * S);
    ctx.fillStyle = '#8833aa';
    ctx.fillRect(39 * S, 17 * S, 2 * S, 8 * S);

    // Door (wide, wooden)
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(16 * S, BH - 16 * S, 16 * S, 16 * S);
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(18 * S, BH - 14 * S, 12 * S, 14 * S);
    // Door handles (double)
    ctx.fillStyle = '#daa520';
    ctx.fillRect(22 * S, BH - 8 * S, 2 * S, 2 * S);
    ctx.fillRect(26 * S, BH - 8 * S, 2 * S, 2 * S);

    canvas.refresh();
  }

  // Scroll hall / shrine for APIs — ornate, columns
  private generateApiBuilding() {
    const S = TILE_SIZE / 16;
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_api', BW, BH)!;
    const ctx = canvas.getContext();

    // White/marble walls
    ctx.fillStyle = '#ccccbb';
    ctx.fillRect(4 * S, 10 * S, BW - 8 * S, BH - 10 * S);
    // Marble veins
    ctx.fillStyle = '#bbbbaa';
    ctx.fillRect(8 * S, 14 * S, 12 * S, S);
    ctx.fillRect(20 * S, 20 * S, 14 * S, S);

    // Ornate roof (gold trim)
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, 4 * S, BW, 10 * S);
    ctx.fillStyle = '#7a6348';
    ctx.fillRect(4 * S, 0, BW - 8 * S, 6 * S);
    // Gold trim
    ctx.fillStyle = '#daa520';
    ctx.fillRect(0, 13 * S, BW, S);
    ctx.fillRect(0, 4 * S, BW, S);

    // Columns on sides
    ctx.fillStyle = '#ddddcc';
    ctx.fillRect(4 * S, 10 * S, 4 * S, BH - 10 * S);
    ctx.fillRect(BW - 8 * S, 10 * S, 4 * S, BH - 10 * S);
    // Column detail
    ctx.fillStyle = '#ccccbb';
    ctx.fillRect(5 * S, 12 * S, 2 * S, BH - 14 * S);
    ctx.fillRect(BW - 7 * S, 12 * S, 2 * S, BH - 14 * S);

    // Scroll/symbol in window
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(14 * S, 14 * S, 20 * S, 12 * S);
    ctx.fillStyle = '#ffe0a0';
    // Scroll icon
    ctx.fillRect(18 * S, 17 * S, 12 * S, 2 * S);
    ctx.fillRect(18 * S, 20 * S, 10 * S, S);
    ctx.fillRect(18 * S, 22 * S, 8 * S, S);

    // Door (ornate)
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(18 * S, BH - 16 * S, 12 * S, 16 * S);
    ctx.fillStyle = '#6b5a4a';
    ctx.fillRect(20 * S, BH - 14 * S, 8 * S, 14 * S);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26 * S, BH - 8 * S, 2 * S, 2 * S);
    // Gold arch
    ctx.fillStyle = '#daa520';
    ctx.fillRect(17 * S, BH - 17 * S, 14 * S, S);

    canvas.refresh();
  }

  // ── Furniture Sprites ──────────────────────────────────────

  private generateFurnitureSprites() {
    const T = TILE_SIZE;
    const S = T / 16;

    // ── Shared ──

    // Wooden crate
    const crate = this.textures.createCanvas('furn_crate', T, T)!;
    const crCtx = crate.getContext();
    crCtx.fillStyle = '#8b6b3e';
    crCtx.fillRect(2 * S, 3 * S, 12 * S, 11 * S);
    crCtx.fillStyle = '#7a5a2e';
    crCtx.fillRect(2 * S, 3 * S, 12 * S, S);
    crCtx.fillRect(2 * S, 8 * S, 12 * S, S);
    crCtx.fillRect(2 * S, 13 * S, 12 * S, S);
    crCtx.fillStyle = '#6b4a1e';
    crCtx.fillRect(2 * S, 3 * S, S, 11 * S);
    crCtx.fillRect(13 * S, 3 * S, S, 11 * S);
    crCtx.fillStyle = '#9c7c4e';
    crCtx.fillRect(4 * S, 5 * S, 8 * S, 2 * S);
    crate.refresh();

    // Floor rug
    const rug = this.textures.createCanvas('furn_rug', T, T)!;
    const rgCtx = rug.getContext();
    rgCtx.fillStyle = '#8b3333';
    rgCtx.fillRect(S, 2 * S, 14 * S, 12 * S);
    rgCtx.fillStyle = '#aa4444';
    rgCtx.fillRect(2 * S, 3 * S, 12 * S, 10 * S);
    rgCtx.fillStyle = '#cc8844';
    rgCtx.fillRect(3 * S, 4 * S, 10 * S, S);
    rgCtx.fillRect(3 * S, 11 * S, 10 * S, S);
    rgCtx.fillRect(3 * S, 4 * S, S, 8 * S);
    rgCtx.fillRect(12 * S, 4 * S, S, 8 * S);
    rug.refresh();

    // Candle
    const candle = this.textures.createCanvas('furn_candle', T, T)!;
    const caCtx = candle.getContext();
    caCtx.fillStyle = '#8b7355';
    caCtx.fillRect(5 * S, 12 * S, 6 * S, 2 * S); // dish
    caCtx.fillStyle = '#eeeedd';
    caCtx.fillRect(7 * S, 6 * S, 2 * S, 7 * S); // wax
    caCtx.fillStyle = '#ffaa22';
    caCtx.fillRect(7 * S, 3 * S, 2 * S, 3 * S); // flame body
    caCtx.fillStyle = '#ffdd44';
    caCtx.fillRect(7 * S, 4 * S, 2 * S, S); // flame bright
    caCtx.fillStyle = '#ff6600';
    caCtx.fillRect(7 * S, 3 * S, 2 * S, S); // flame tip
    candle.refresh();

    // Candle flame overlay (flame pixels only, for flicker animation)
    const cflame = this.textures.createCanvas('furn_candle_flame', T, T)!;
    const cfCtx = cflame.getContext();
    cfCtx.fillStyle = '#ffaa22';
    cfCtx.fillRect(7 * S, 3 * S, 2 * S, 3 * S); // flame body
    cfCtx.fillStyle = '#ffdd44';
    cfCtx.fillRect(7 * S, 4 * S, 2 * S, S); // flame bright
    cfCtx.fillStyle = '#ff6600';
    cfCtx.fillRect(7 * S, 3 * S, 2 * S, S); // flame tip
    cflame.refresh();

    // ── Forge theme ──

    // Anvil
    const anvil = this.textures.createCanvas('furn_anvil', T, T)!;
    const anCtx = anvil.getContext();
    anCtx.fillStyle = '#555555';
    anCtx.fillRect(3 * S, 8 * S, 10 * S, 5 * S); // base
    anCtx.fillStyle = '#666666';
    anCtx.fillRect(2 * S, 5 * S, 12 * S, 3 * S); // face
    anCtx.fillStyle = '#444444';
    anCtx.fillRect(S, 4 * S, 4 * S, 2 * S); // horn
    anCtx.fillStyle = '#777777';
    anCtx.fillRect(4 * S, 6 * S, 8 * S, S); // highlight
    anvil.refresh();

    // Fireplace (1 wide, 2 tall)
    const fp = this.textures.createCanvas('furn_fireplace', T, T * 2)!;
    const fpCtx = fp.getContext();
    // Stone frame
    fpCtx.fillStyle = '#777777';
    fpCtx.fillRect(0, 0, T, T * 2);
    fpCtx.fillStyle = '#666666';
    fpCtx.fillRect(S, 0, 14 * S, 4 * S); // mantle
    fpCtx.fillRect(0, 0, 3 * S, T * 2); // left pillar
    fpCtx.fillRect(13 * S, 0, 3 * S, T * 2); // right pillar
    // Firebox
    fpCtx.fillStyle = '#222222';
    fpCtx.fillRect(3 * S, 6 * S, 10 * S, 20 * S);
    // Fire
    fpCtx.fillStyle = '#ff4400';
    fpCtx.fillRect(4 * S, 16 * S, 8 * S, 8 * S);
    fpCtx.fillStyle = '#ff8833';
    fpCtx.fillRect(5 * S, 14 * S, 6 * S, 6 * S);
    fpCtx.fillStyle = '#ffcc22';
    fpCtx.fillRect(6 * S, 12 * S, 4 * S, 5 * S);
    // Logs
    fpCtx.fillStyle = '#5a3a1a';
    fpCtx.fillRect(4 * S, 24 * S, 8 * S, 3 * S);
    fpCtx.fillStyle = '#6b4a2a';
    fpCtx.fillRect(5 * S, 22 * S, 6 * S, 3 * S);
    fp.refresh();

    // Fireplace flame overlay (fire pixels only, for flicker animation)
    const fpFlame = this.textures.createCanvas('furn_fireplace_flame', T, T * 2)!;
    const fpfCtx = fpFlame.getContext();
    fpfCtx.fillStyle = '#ff4400';
    fpfCtx.fillRect(4 * S, 16 * S, 8 * S, 8 * S);
    fpfCtx.fillStyle = '#ff8833';
    fpfCtx.fillRect(5 * S, 14 * S, 6 * S, 6 * S);
    fpfCtx.fillStyle = '#ffcc22';
    fpfCtx.fillRect(6 * S, 12 * S, 4 * S, 5 * S);
    fpFlame.refresh();

    // Workbench (2 wide, 1 tall)
    const wb = this.textures.createCanvas('furn_workbench', T * 2, T)!;
    const wbCtx = wb.getContext();
    // Table top
    wbCtx.fillStyle = '#8b6b3e';
    wbCtx.fillRect(0, 3 * S, T * 2, 5 * S);
    wbCtx.fillStyle = '#7a5a2e';
    wbCtx.fillRect(0, 3 * S, T * 2, S);
    // Legs
    wbCtx.fillStyle = '#6b4a1e';
    wbCtx.fillRect(S, 8 * S, 3 * S, 7 * S);
    wbCtx.fillRect(28 * S, 8 * S, 3 * S, 7 * S);
    wbCtx.fillRect(14 * S, 8 * S, 3 * S, 7 * S);
    // Tools on top
    wbCtx.fillStyle = '#888888'; // hammer head
    wbCtx.fillRect(5 * S, S, 4 * S, 2 * S);
    wbCtx.fillStyle = '#6b4a1e'; // hammer handle
    wbCtx.fillRect(6 * S, 3 * S, 2 * S, 2 * S);
    wbCtx.fillStyle = '#aa5522'; // tongs
    wbCtx.fillRect(20 * S, S, 6 * S, 2 * S);
    wb.refresh();

    // ── Office theme ──

    // Desk with monitor (2 wide, 1 tall)
    const desk = this.textures.createCanvas('furn_desk', T * 2, T)!;
    const dkCtx = desk.getContext();
    // Desktop surface
    dkCtx.fillStyle = '#7a6a5a';
    dkCtx.fillRect(0, 5 * S, T * 2, 4 * S);
    dkCtx.fillStyle = '#6a5a4a';
    dkCtx.fillRect(0, 5 * S, T * 2, S);
    // Legs
    dkCtx.fillStyle = '#5a4a3a';
    dkCtx.fillRect(S, 9 * S, 2 * S, 6 * S);
    dkCtx.fillRect(29 * S, 9 * S, 2 * S, 6 * S);
    // Monitor
    dkCtx.fillStyle = '#333333';
    dkCtx.fillRect(10 * S, 0, 12 * S, 5 * S);
    dkCtx.fillStyle = '#4488aa';
    dkCtx.fillRect(11 * S, S, 10 * S, 3 * S); // screen
    // Monitor stand
    dkCtx.fillStyle = '#444444';
    dkCtx.fillRect(14 * S, 5 * S, 4 * S, S);
    // Keyboard
    dkCtx.fillStyle = '#555555';
    dkCtx.fillRect(9 * S, 6 * S, 8 * S, 2 * S);
    desk.refresh();

    // Chair
    const chair = this.textures.createCanvas('furn_chair', T, T)!;
    const chCtx = chair.getContext();
    // Back
    chCtx.fillStyle = '#6b4a2a';
    chCtx.fillRect(4 * S, 2 * S, 8 * S, 3 * S);
    // Seat
    chCtx.fillStyle = '#8b6a4a';
    chCtx.fillRect(3 * S, 5 * S, 10 * S, 5 * S);
    // Legs
    chCtx.fillStyle = '#5a3a1a';
    chCtx.fillRect(4 * S, 10 * S, 2 * S, 4 * S);
    chCtx.fillRect(10 * S, 10 * S, 2 * S, 4 * S);
    chair.refresh();

    // Potted plant
    const plant = this.textures.createCanvas('furn_plant', T, T)!;
    const plCtx = plant.getContext();
    // Pot
    plCtx.fillStyle = '#aa6633';
    plCtx.fillRect(5 * S, 10 * S, 6 * S, 5 * S);
    plCtx.fillStyle = '#994422';
    plCtx.fillRect(4 * S, 10 * S, 8 * S, S);
    // Leaves
    plCtx.fillStyle = '#33aa44';
    plCtx.fillRect(4 * S, 4 * S, 8 * S, 6 * S);
    plCtx.fillStyle = '#44bb55';
    plCtx.fillRect(3 * S, 5 * S, 3 * S, 3 * S);
    plCtx.fillRect(10 * S, 5 * S, 3 * S, 3 * S);
    plCtx.fillStyle = '#22882e';
    plCtx.fillRect(6 * S, 2 * S, 4 * S, 3 * S);
    // Stem
    plCtx.fillStyle = '#447733';
    plCtx.fillRect(7 * S, 8 * S, 2 * S, 3 * S);
    plant.refresh();

    // ── Library theme ──

    // Bookshelf (1 wide, 2 tall)
    const bs = this.textures.createCanvas('furn_bookshelf', T, T * 2)!;
    const bsCtx = bs.getContext();
    // Frame
    bsCtx.fillStyle = '#6b4226';
    bsCtx.fillRect(0, 0, T, T * 2);
    bsCtx.fillStyle = '#8b5a2b';
    bsCtx.fillRect(S, S, 14 * S, 30 * S);
    // Shelves
    bsCtx.fillStyle = '#6b4226';
    bsCtx.fillRect(S, 7 * S, 14 * S, S);
    bsCtx.fillRect(S, 15 * S, 14 * S, S);
    bsCtx.fillRect(S, 23 * S, 14 * S, S);
    // Books — row 1
    bsCtx.fillStyle = '#aa3333';
    bsCtx.fillRect(2 * S, S, 2 * S, 6 * S);
    bsCtx.fillStyle = '#3333aa';
    bsCtx.fillRect(5 * S, 2 * S, 2 * S, 5 * S);
    bsCtx.fillStyle = '#33aa33';
    bsCtx.fillRect(8 * S, S, 2 * S, 6 * S);
    bsCtx.fillStyle = '#aa8833';
    bsCtx.fillRect(11 * S, 2 * S, 2 * S, 5 * S);
    // Books — row 2
    bsCtx.fillStyle = '#8833aa';
    bsCtx.fillRect(2 * S, 8 * S, 2 * S, 7 * S);
    bsCtx.fillStyle = '#aa3355';
    bsCtx.fillRect(5 * S, 9 * S, 2 * S, 6 * S);
    bsCtx.fillStyle = '#3388aa';
    bsCtx.fillRect(8 * S, 8 * S, 2 * S, 7 * S);
    bsCtx.fillStyle = '#88aa33';
    bsCtx.fillRect(11 * S, 9 * S, 2 * S, 6 * S);
    // Books — row 3
    bsCtx.fillStyle = '#555588';
    bsCtx.fillRect(2 * S, 16 * S, 2 * S, 7 * S);
    bsCtx.fillStyle = '#885533';
    bsCtx.fillRect(5 * S, 17 * S, 2 * S, 6 * S);
    bsCtx.fillStyle = '#338855';
    bsCtx.fillRect(8 * S, 16 * S, 2 * S, 7 * S);
    bsCtx.fillStyle = '#aa5533';
    bsCtx.fillRect(11 * S, 17 * S, 2 * S, 6 * S);
    // Bottom section — scrolls
    bsCtx.fillStyle = '#ddc088';
    bsCtx.fillRect(3 * S, 24 * S, 10 * S, 3 * S);
    bsCtx.fillStyle = '#ccb078';
    bsCtx.fillRect(4 * S, 25 * S, 3 * S, S);
    bsCtx.fillRect(9 * S, 25 * S, 3 * S, S);
    bs.refresh();

    // Reading desk
    const rd = this.textures.createCanvas('furn_reading_desk', T, T)!;
    const rdCtx = rd.getContext();
    // Desk
    rdCtx.fillStyle = '#7a5a3a';
    rdCtx.fillRect(S, 5 * S, 14 * S, 4 * S);
    rdCtx.fillStyle = '#6a4a2a';
    rdCtx.fillRect(S, 5 * S, 14 * S, S);
    // Legs
    rdCtx.fillStyle = '#5a3a1a';
    rdCtx.fillRect(2 * S, 9 * S, 2 * S, 5 * S);
    rdCtx.fillRect(12 * S, 9 * S, 2 * S, 5 * S);
    // Open book
    rdCtx.fillStyle = '#eeddbb';
    rdCtx.fillRect(3 * S, 2 * S, 10 * S, 4 * S);
    rdCtx.fillStyle = '#444444';
    rdCtx.fillRect(8 * S, 2 * S, S, 4 * S); // spine
    rdCtx.fillStyle = '#888888'; // text lines
    rdCtx.fillRect(4 * S, 3 * S, 3 * S, S);
    rdCtx.fillRect(4 * S, 5 * S, 2 * S, S);
    rdCtx.fillRect(9 * S, 3 * S, 3 * S, S);
    rdCtx.fillRect(9 * S, 5 * S, 4 * S, S);
    rd.refresh();

    // Scroll rack
    const sr = this.textures.createCanvas('furn_scroll_rack', T, T)!;
    const srCtx = sr.getContext();
    // Frame
    srCtx.fillStyle = '#6b4a2a';
    srCtx.fillRect(2 * S, S, 2 * S, 14 * S);
    srCtx.fillRect(12 * S, S, 2 * S, 14 * S);
    srCtx.fillRect(2 * S, S, 12 * S, S);
    srCtx.fillRect(2 * S, 7 * S, 12 * S, S);
    srCtx.fillRect(2 * S, 13 * S, 12 * S, S);
    // Scrolls
    srCtx.fillStyle = '#ddc088';
    srCtx.fillRect(5 * S, 2 * S, 6 * S, 2 * S);
    srCtx.fillRect(5 * S, 4 * S, 5 * S, 2 * S);
    srCtx.fillStyle = '#ccb078';
    srCtx.fillRect(5 * S, 8 * S, 6 * S, 2 * S);
    srCtx.fillRect(6 * S, 10 * S, 4 * S, 2 * S);
    sr.refresh();

    // ── Scroll Hall theme ──

    // Pedestal
    const ped = this.textures.createCanvas('furn_pedestal', T, T)!;
    const peCtx = ped.getContext();
    // Base
    peCtx.fillStyle = '#ccccbb';
    peCtx.fillRect(3 * S, 12 * S, 10 * S, 3 * S);
    // Column
    peCtx.fillStyle = '#ddddcc';
    peCtx.fillRect(5 * S, 4 * S, 6 * S, 8 * S);
    // Capital (top)
    peCtx.fillStyle = '#ccccbb';
    peCtx.fillRect(3 * S, 2 * S, 10 * S, 3 * S);
    // Gold trim
    peCtx.fillStyle = '#daa520';
    peCtx.fillRect(3 * S, 2 * S, 10 * S, S);
    peCtx.fillRect(3 * S, 14 * S, 10 * S, S);
    // Glowing orb on top
    peCtx.fillStyle = '#44aaff';
    peCtx.fillRect(6 * S, 0, 4 * S, 2 * S);
    peCtx.fillStyle = '#66ccff';
    peCtx.fillRect(7 * S, 0, 2 * S, S);
    ped.refresh();

    // Pillar (1 wide, 2 tall)
    const pil = this.textures.createCanvas('furn_pillar', T, T * 2)!;
    const piCtx = pil.getContext();
    // Base
    piCtx.fillStyle = '#bbbbaa';
    piCtx.fillRect(2 * S, 28 * S, 12 * S, 4 * S);
    // Shaft
    piCtx.fillStyle = '#ddddcc';
    piCtx.fillRect(4 * S, 4 * S, 8 * S, 24 * S);
    // Light side
    piCtx.fillStyle = '#eeeedd';
    piCtx.fillRect(4 * S, 4 * S, 3 * S, 24 * S);
    // Capital
    piCtx.fillStyle = '#ccccbb';
    piCtx.fillRect(2 * S, 0, 12 * S, 5 * S);
    piCtx.fillStyle = '#bbbbaa';
    piCtx.fillRect(3 * S, S, 10 * S, 3 * S);
    // Gold trim
    piCtx.fillStyle = '#daa520';
    piCtx.fillRect(2 * S, 0, 12 * S, S);
    piCtx.fillRect(2 * S, 4 * S, 12 * S, S);
    pil.refresh();

    // Rune circle (2x2 tiles)
    const rcSize = T * 2;
    const rc = this.textures.createCanvas('furn_rune_circle', rcSize, rcSize)!;
    const rcCtx = rc.getContext();
    const rcCenter = T; // center of the 2T x 2T canvas
    // Outer circle (approximated with rects)
    rcCtx.fillStyle = '#2244aa44';
    // Fill a rough circle
    for (let y = 0; y < rcSize; y++) {
      for (let x = 0; x < rcSize; x++) {
        const dx = x - rcCenter;
        const dy = y - rcCenter;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 14 * S && dist > 11 * S) {
          rcCtx.fillStyle = '#4488ff';
          rcCtx.fillRect(x, y, 1, 1);
        } else if (dist < 11 * S && dist > 9 * S) {
          rcCtx.fillStyle = '#2244aa33';
          rcCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Inner glow
    rcCtx.fillStyle = '#44aaff44';
    for (let y = 0; y < rcSize; y++) {
      for (let x = 0; x < rcSize; x++) {
        const dx = x - rcCenter;
        const dy = y - rcCenter;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8 * S) {
          rcCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Rune marks at cardinal directions
    rcCtx.fillStyle = '#88ddff';
    rcCtx.fillRect(15 * S, 3 * S, 2 * S, 3 * S);  // N
    rcCtx.fillRect(15 * S, 26 * S, 2 * S, 3 * S); // S
    rcCtx.fillRect(3 * S, 15 * S, 3 * S, 2 * S);  // W
    rcCtx.fillRect(26 * S, 15 * S, 3 * S, 2 * S); // E
    // Diagonal marks
    rcCtx.fillRect(6 * S, 6 * S, 2 * S, 2 * S);
    rcCtx.fillRect(24 * S, 6 * S, 2 * S, 2 * S);
    rcCtx.fillRect(6 * S, 24 * S, 2 * S, 2 * S);
    rcCtx.fillRect(24 * S, 24 * S, 2 * S, 2 * S);
    // Center dot
    rcCtx.fillStyle = '#aaeeff';
    rcCtx.fillRect(15 * S, 15 * S, 2 * S, 2 * S);
    rc.refresh();
  }

  // ── Emote Bubble Sprites ─────────────────────────────────────

  private generateEmoteSprites() {
    const S = TILE_SIZE / 16;
    const W = 14 * S;
    const H = 16 * S;

    const drawBubble = (ctx: CanvasRenderingContext2D) => {
      // White rounded-ish bubble
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(S, 0, W - 2 * S, H - 4 * S);
      ctx.fillRect(0, S, W, H - 6 * S);
      // Pointer triangle at bottom
      ctx.fillRect(5 * S, H - 4 * S, 4 * S, 2 * S);
      ctx.fillRect(6 * S, H - 2 * S, 2 * S, 2 * S);
      // Subtle border
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(0, S, S, H - 6 * S);
      ctx.fillRect(W - S, S, S, H - 6 * S);
      ctx.fillRect(S, 0, W - 2 * S, S);
      ctx.fillRect(S, H - 5 * S, W - 2 * S, S);
    };

    // Exclaim "!"
    const ex = this.textures.createCanvas('emote_exclaim', W, H)!;
    const exCtx = ex.getContext();
    drawBubble(exCtx);
    exCtx.fillStyle = '#dd3333';
    exCtx.fillRect(6 * S, 2 * S, 2 * S, 6 * S);
    exCtx.fillRect(6 * S, 9 * S, 2 * S, 2 * S);
    ex.refresh();

    // Thought "..."
    const th = this.textures.createCanvas('emote_thought', W, H)!;
    const thCtx = th.getContext();
    drawBubble(thCtx);
    thCtx.fillStyle = '#666666';
    thCtx.fillRect(3 * S, 5 * S, 2 * S, 2 * S);
    thCtx.fillRect(6 * S, 5 * S, 2 * S, 2 * S);
    thCtx.fillRect(9 * S, 5 * S, 2 * S, 2 * S);
    th.refresh();

    // Hammer (service)
    const hm = this.textures.createCanvas('emote_hammer', W, H)!;
    const hmCtx = hm.getContext();
    drawBubble(hmCtx);
    hmCtx.fillStyle = '#888888';
    hmCtx.fillRect(4 * S, 2 * S, 4 * S, 3 * S); // head
    hmCtx.fillStyle = '#8b6b3e';
    hmCtx.fillRect(6 * S, 5 * S, 2 * S, 6 * S); // handle
    hm.refresh();

    // Book (library)
    const bk = this.textures.createCanvas('emote_book', W, H)!;
    const bkCtx = bk.getContext();
    drawBubble(bkCtx);
    bkCtx.fillStyle = '#aa3333';
    bkCtx.fillRect(3 * S, 2 * S, 8 * S, 8 * S);
    bkCtx.fillStyle = '#eeddbb';
    bkCtx.fillRect(4 * S, 3 * S, 6 * S, 6 * S);
    bkCtx.fillStyle = '#444444';
    bkCtx.fillRect(7 * S, 2 * S, S, 8 * S); // spine
    bk.refresh();

    // Scroll (API)
    const sc = this.textures.createCanvas('emote_scroll', W, H)!;
    const scCtx = sc.getContext();
    drawBubble(scCtx);
    scCtx.fillStyle = '#ddc088';
    scCtx.fillRect(4 * S, 2 * S, 6 * S, 8 * S);
    scCtx.fillStyle = '#8b6b3e';
    scCtx.fillRect(3 * S, 2 * S, 8 * S, S);
    scCtx.fillRect(3 * S, 9 * S, 8 * S, S);
    scCtx.fillStyle = '#888888';
    scCtx.fillRect(5 * S, 4 * S, 4 * S, S);
    scCtx.fillRect(5 * S, 6 * S, 3 * S, S);
    sc.refresh();

    // Crystal (website)
    const cr = this.textures.createCanvas('emote_crystal', W, H)!;
    const crCtx = cr.getContext();
    drawBubble(crCtx);
    crCtx.fillStyle = '#4488ff';
    crCtx.fillRect(6 * S, 2 * S, 2 * S, 2 * S);
    crCtx.fillRect(5 * S, 4 * S, 4 * S, 4 * S);
    crCtx.fillRect(6 * S, 8 * S, 2 * S, 2 * S);
    crCtx.fillStyle = '#66aaff';
    crCtx.fillRect(6 * S, 4 * S, 2 * S, 2 * S); // highlight
    cr.refresh();
  }

  // ── Particle Textures ────────────────────────────────────────

  private generateParticleTextures() {
    // Leaf (forest) — 6x6 green/brown shape
    const leaf = this.textures.createCanvas('particle_leaf', 6, 6)!;
    const lctx = leaf.getContext();
    lctx.fillStyle = '#5a9c3a';
    lctx.fillRect(1, 0, 4, 2);
    lctx.fillRect(0, 2, 6, 2);
    lctx.fillRect(1, 4, 3, 1);
    lctx.fillStyle = '#7ab84e';
    lctx.fillRect(2, 1, 2, 1);
    leaf.refresh();

    // Sand wisp (desert) — 5x3 horizontal streak
    const sand = this.textures.createCanvas('particle_sand', 5, 3)!;
    const sctx = sand.getContext();
    sctx.fillStyle = '#c4a882';
    sctx.fillRect(0, 1, 5, 1);
    sctx.fillStyle = '#d4b892';
    sctx.fillRect(1, 1, 3, 1);
    sand.refresh();

    // Firefly (swamp) — 4x4 glow dot
    const firefly = this.textures.createCanvas('particle_firefly', 4, 4)!;
    const fctx = firefly.getContext();
    fctx.fillStyle = '#aadd44';
    fctx.fillRect(1, 1, 2, 2);
    fctx.fillStyle = '#ccff66';
    fctx.fillRect(1, 1, 1, 1); // bright center
    firefly.refresh();

    // Snowflake (rocky) — 5x5 cross shape
    const snow = this.textures.createCanvas('particle_snow', 5, 5)!;
    const nctx = snow.getContext();
    nctx.fillStyle = '#ddeeff';
    nctx.fillRect(2, 0, 1, 5); // vertical
    nctx.fillRect(0, 2, 5, 1); // horizontal
    nctx.fillStyle = '#ffffff';
    nctx.fillRect(2, 2, 1, 1); // center
    snow.refresh();

    // Pollen/seed (meadow) — 4x4 soft wisp
    const pollen = this.textures.createCanvas('particle_pollen', 4, 4)!;
    const pctx = pollen.getContext();
    pctx.fillStyle = '#ffffcc';
    pctx.fillRect(1, 0, 2, 4);
    pctx.fillRect(0, 1, 4, 2);
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(1, 1, 2, 2);
    pollen.refresh();

    // Dust mote (plains) — 3x3 speck
    const dust = this.textures.createCanvas('particle_dust', 3, 3)!;
    const dctx = dust.getContext();
    dctx.fillStyle = '#c8b898';
    dctx.fillRect(0, 1, 3, 1);
    dctx.fillRect(1, 0, 1, 3);
    dust.refresh();
  }
}
