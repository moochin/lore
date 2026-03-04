import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

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
    this.scene.start('OverworldScene');
  }

  private generateTileset() {
    const T = TILE_SIZE;

    // Grass tile (index 0)
    const grass = this.textures.createCanvas('tile_grass', T, T)!;
    const gctx = grass.getContext();
    gctx.fillStyle = '#4a8c3f';
    gctx.fillRect(0, 0, T, T);
    gctx.fillStyle = '#5a9c4f';
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(Math.random() * T);
      const y = Math.floor(Math.random() * T);
      gctx.fillRect(x, y, 1, 1);
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
      pctx.fillRect(x, y, 2, 1);
    }
    path.refresh();

    // Water tile (index 2)
    const water = this.textures.createCanvas('tile_water', T, T)!;
    const wctx = water.getContext();
    wctx.fillStyle = '#3366aa';
    wctx.fillRect(0, 0, T, T);
    wctx.fillStyle = '#4477bb';
    wctx.fillRect(2, 4, 4, 1);
    wctx.fillRect(10, 10, 3, 1);
    water.refresh();

    // Wall tile (index 3)
    const wall = this.textures.createCanvas('tile_wall', T, T)!;
    const wallCtx = wall.getContext();
    wallCtx.fillStyle = '#8b7355';
    wallCtx.fillRect(0, 0, T, T);
    wallCtx.fillStyle = '#7a6348';
    wallCtx.fillRect(0, 0, T, 1);
    wallCtx.fillRect(0, 8, T, 1);
    wallCtx.fillStyle = '#9c8466';
    wallCtx.fillRect(0, 4, T, 1);
    wall.refresh();

    // Tree tile (index 4)
    const tree = this.textures.createCanvas('tile_tree', T, T)!;
    const tctx = tree.getContext();
    tctx.fillStyle = '#4a8c3f';
    tctx.fillRect(0, 0, T, T);
    tctx.fillStyle = '#8b6b3e';
    tctx.fillRect(6, 10, 4, 6);
    tctx.fillStyle = '#2d6b2e';
    tctx.fillRect(3, 2, 10, 9);
    tctx.fillStyle = '#3a7d3b';
    tctx.fillRect(4, 3, 8, 7);
    tree.refresh();

    // Floor tile (index 5)
    const floor = this.textures.createCanvas('tile_floor', T, T)!;
    const fctx = floor.getContext();
    fctx.fillStyle = '#a08060';
    fctx.fillRect(0, 0, T, T);
    fctx.fillStyle = '#907050';
    fctx.fillRect(0, 0, 8, 8);
    fctx.fillRect(8, 8, 8, 8);
    floor.refresh();

    // Door tile (index 6)
    const door = this.textures.createCanvas('tile_door', T, T)!;
    const dctx = door.getContext();
    dctx.fillStyle = '#c4a882';
    dctx.fillRect(0, 0, T, T);
    dctx.fillStyle = '#6b4226';
    dctx.fillRect(3, 2, 10, 14);
    dctx.fillStyle = '#8b5a2b';
    dctx.fillRect(4, 3, 8, 12);
    dctx.fillStyle = '#daa520';
    dctx.fillRect(10, 9, 2, 2);
    door.refresh();

    // Rock tile (index 7)
    const rock = this.textures.createCanvas('tile_rock', T, T)!;
    const rctx = rock.getContext();
    rctx.fillStyle = '#4a8c3f'; // grass background
    rctx.fillRect(0, 0, T, T);
    rctx.fillStyle = '#888888';
    rctx.fillRect(3, 5, 10, 8);
    rctx.fillStyle = '#999999';
    rctx.fillRect(4, 6, 8, 6);
    rctx.fillStyle = '#aaaaaa';
    rctx.fillRect(5, 7, 4, 3);
    rock.refresh();

    // Swamp tile (index 8)
    const swamp = this.textures.createCanvas('tile_swamp', T, T)!;
    const sctx = swamp.getContext();
    sctx.fillStyle = '#2a5c2a';
    sctx.fillRect(0, 0, T, T);
    sctx.fillStyle = '#3a6c3a';
    sctx.fillRect(2, 3, 5, 3);
    sctx.fillRect(9, 8, 4, 4);
    sctx.fillStyle = '#1a4c2a';
    sctx.fillRect(6, 11, 3, 2);
    sctx.fillStyle = '#4a7c4a';
    sctx.fillRect(0, 7, 3, 1);
    sctx.fillRect(11, 2, 2, 1);
    swamp.refresh();

    // Desert / sand tile (index 9)
    const sand = this.textures.createCanvas('tile_sand', T, T)!;
    const sdctx = sand.getContext();
    sdctx.fillStyle = '#d4b876';
    sdctx.fillRect(0, 0, T, T);
    sdctx.fillStyle = '#c4a866';
    sdctx.fillRect(3, 5, 4, 2);
    sdctx.fillRect(10, 10, 3, 1);
    sdctx.fillStyle = '#e4c886';
    sdctx.fillRect(7, 2, 2, 1);
    sdctx.fillRect(1, 12, 2, 1);
    sand.refresh();

    // Dense forest tile (index 10) — darker, denser tree
    const denseTree = this.textures.createCanvas('tile_dense_tree', T, T)!;
    const dtctx = denseTree.getContext();
    dtctx.fillStyle = '#2a5c2e';
    dtctx.fillRect(0, 0, T, T);
    dtctx.fillStyle = '#5c3a1e';
    dtctx.fillRect(6, 11, 4, 5);
    dtctx.fillStyle = '#1a4a1e';
    dtctx.fillRect(2, 1, 12, 11);
    dtctx.fillStyle = '#2a5a2e';
    dtctx.fillRect(3, 2, 10, 9);
    dtctx.fillStyle = '#1a3a1e';
    dtctx.fillRect(5, 4, 6, 5);
    denseTree.refresh();

    // Flower patch tile (index 11)
    const flower = this.textures.createCanvas('tile_flower', T, T)!;
    const flctx = flower.getContext();
    flctx.fillStyle = '#4a8c3f';
    flctx.fillRect(0, 0, T, T);
    flctx.fillStyle = '#5a9c4f';
    flctx.fillRect(2, 2, 1, 1);
    flctx.fillRect(9, 6, 1, 1);
    // Flowers
    flctx.fillStyle = '#ff6688';
    flctx.fillRect(4, 3, 2, 2);
    flctx.fillStyle = '#ffdd44';
    flctx.fillRect(10, 9, 2, 2);
    flctx.fillStyle = '#8866ff';
    flctx.fillRect(2, 11, 2, 2);
    flctx.fillStyle = '#ff8844';
    flctx.fillRect(12, 4, 2, 2);
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

    NPC_PALETTES.forEach((palette, index) => {
      const key = `npc_${index}`;
      const sw = T * directions.length;
      const sh = T;
      const canvas = this.textures.createCanvas(key, sw, sh)!;
      const ctx = canvas.getContext();

      directions.forEach((dir, col) => {
        this.drawCharacter(ctx, col * T, 0, dir, 0, palette.body, palette.hair, palette.skin);
      });

      canvas.refresh();

      for (let i = 0; i < directions.length; i++) {
        this.textures.get(key).add(i, 0, i * T, 0, T, T);
      }
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
    const walkOffset = frame === 1 ? -1 : frame === 2 ? 1 : 0;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(ox + 4, oy + 6, 8, 7);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(ox + 5, oy + 1, 6, 5);

    // Hair
    ctx.fillStyle = hairColor;
    if (direction === 'up') {
      ctx.fillRect(ox + 5, oy + 1, 6, 2);
    } else {
      ctx.fillRect(ox + 5, oy + 1, 6, 1);
    }

    // Eyes
    if (direction !== 'up') {
      ctx.fillStyle = '#222222';
      if (direction === 'left') {
        ctx.fillRect(ox + 5, oy + 3, 1, 1);
      } else if (direction === 'right') {
        ctx.fillRect(ox + 10, oy + 3, 1, 1);
      } else {
        ctx.fillRect(ox + 6, oy + 3, 1, 1);
        ctx.fillRect(ox + 9, oy + 3, 1, 1);
      }
    }

    // Legs
    ctx.fillStyle = '#554433';
    ctx.fillRect(ox + 5 + walkOffset, oy + 13, 3, 3);
    ctx.fillRect(ox + 8 - walkOffset, oy + 13, 3, 3);
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
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building', BW, BH)!;
    const ctx = canvas.getContext();

    ctx.fillStyle = '#8b7355';
    ctx.fillRect(4, 12, BW - 8, BH - 12);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(0, 4, BW, 12);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(4, 0, BW - 8, 8);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(18, BH - 16, 12, 16);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(20, BH - 14, 8, 14);
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(6, 20, 8, 8);
    ctx.fillRect(34, 20, 8, 8);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(10, 20, 1, 8);
    ctx.fillRect(6, 24, 8, 1);
    ctx.fillRect(38, 20, 1, 8);
    ctx.fillRect(34, 24, 8, 1);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26, BH - 8, 2, 2);
    canvas.refresh();
  }

  // Forge-style building for services — stone walls, chimney with smoke
  private generateServiceBuilding() {
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_service', BW, BH)!;
    const ctx = canvas.getContext();

    // Stone walls
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(2, 10, BW - 4, BH - 10);
    // Stone texture
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(4, 14, 8, 6);
    ctx.fillRect(16, 18, 10, 6);
    ctx.fillRect(30, 14, 8, 8);

    // Dark roof
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(0, 4, BW, 10);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(4, 0, BW - 8, 8);

    // Chimney
    ctx.fillStyle = '#555555';
    ctx.fillRect(34, 0, 8, 10);
    // Smoke puffs
    ctx.fillStyle = '#aaaaaa88';
    ctx.fillRect(36, -2, 4, 3);

    // Door (arched, centered)
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(18, BH - 16, 12, 16);
    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(20, BH - 14, 8, 14);
    // Arch top
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(19, BH - 17, 10, 2);

    // Orange glow windows (forge fire)
    ctx.fillStyle = '#ff8833';
    ctx.fillRect(6, 18, 8, 6);
    ctx.fillRect(34, 18, 8, 6);
    // Window frames
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(10, 18, 1, 6);
    ctx.fillRect(6, 21, 8, 1);
    ctx.fillRect(38, 18, 1, 6);
    ctx.fillRect(34, 21, 8, 1);

    // Door handle
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26, BH - 8, 2, 2);

    canvas.refresh();
  }

  // Tower-style building for websites — tall, peaked roof, flag
  private generateWebsiteBuilding() {
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_website', BW, BH)!;
    const ctx = canvas.getContext();

    // Taller stone body
    ctx.fillStyle = '#8888aa';
    ctx.fillRect(6, 8, BW - 12, BH - 8);
    // Accent stripes
    ctx.fillStyle = '#7777aa';
    ctx.fillRect(6, 16, BW - 12, 2);
    ctx.fillRect(6, 26, BW - 12, 2);

    // Peaked roof
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(2, 4, BW - 4, 8);
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(8, 0, BW - 16, 6);

    // Flag pole
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(23, -4, 2, 8);
    // Flag
    ctx.fillStyle = '#dd3333';
    ctx.fillRect(25, -4, 8, 5);
    ctx.fillStyle = '#bb2222';
    ctx.fillRect(25, -2, 8, 1);

    // Large arched window
    ctx.fillStyle = '#aaccff';
    ctx.fillRect(14, 12, 20, 10);
    ctx.fillStyle = '#6688bb';
    ctx.fillRect(24, 12, 1, 10);
    ctx.fillRect(14, 17, 20, 1);

    // Door
    ctx.fillStyle = '#3a3a6a';
    ctx.fillRect(18, BH - 14, 12, 14);
    ctx.fillStyle = '#4a4a7a';
    ctx.fillRect(20, BH - 12, 8, 12);

    // Door handle
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26, BH - 8, 2, 2);

    canvas.refresh();
  }

  // Library building — wide, bookshelves visible through windows
  private generateLibraryBuilding() {
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_library', BW, BH)!;
    const ctx = canvas.getContext();

    // Warm wooden walls
    ctx.fillStyle = '#9c7a52';
    ctx.fillRect(2, 10, BW - 4, BH - 10);
    // Wood grain
    ctx.fillStyle = '#8c6a42';
    ctx.fillRect(4, 14, BW - 8, 1);
    ctx.fillRect(4, 22, BW - 8, 1);
    ctx.fillRect(4, 30, BW - 8, 1);

    // Sloped roof (brown)
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 4, BW, 10);
    ctx.fillStyle = '#5a3318';
    ctx.fillRect(6, 0, BW - 12, 6);

    // Windows showing bookshelves
    ctx.fillStyle = '#ffe8a0'; // warm light
    ctx.fillRect(6, 16, 10, 10);
    ctx.fillRect(32, 16, 10, 10);
    // Book spines
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(7, 17, 2, 8);
    ctx.fillStyle = '#3333aa';
    ctx.fillRect(10, 17, 2, 8);
    ctx.fillStyle = '#33aa33';
    ctx.fillRect(13, 17, 2, 8);
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(33, 17, 2, 8);
    ctx.fillStyle = '#aaaa33';
    ctx.fillRect(36, 17, 2, 8);
    ctx.fillStyle = '#8833aa';
    ctx.fillRect(39, 17, 2, 8);

    // Door (wide, wooden)
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(16, BH - 16, 16, 16);
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(18, BH - 14, 12, 14);
    // Door handles (double)
    ctx.fillStyle = '#daa520';
    ctx.fillRect(22, BH - 8, 2, 2);
    ctx.fillRect(26, BH - 8, 2, 2);

    canvas.refresh();
  }

  // Scroll hall / shrine for APIs — ornate, columns
  private generateApiBuilding() {
    const BW = TILE_SIZE * 3;
    const BH = TILE_SIZE * 3;
    const canvas = this.textures.createCanvas('building_api', BW, BH)!;
    const ctx = canvas.getContext();

    // White/marble walls
    ctx.fillStyle = '#ccccbb';
    ctx.fillRect(4, 10, BW - 8, BH - 10);
    // Marble veins
    ctx.fillStyle = '#bbbbaa';
    ctx.fillRect(8, 14, 12, 1);
    ctx.fillRect(20, 20, 14, 1);

    // Ornate roof (gold trim)
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, 4, BW, 10);
    ctx.fillStyle = '#7a6348';
    ctx.fillRect(4, 0, BW - 8, 6);
    // Gold trim
    ctx.fillStyle = '#daa520';
    ctx.fillRect(0, 13, BW, 1);
    ctx.fillRect(0, 4, BW, 1);

    // Columns on sides
    ctx.fillStyle = '#ddddcc';
    ctx.fillRect(4, 10, 4, BH - 10);
    ctx.fillRect(BW - 8, 10, 4, BH - 10);
    // Column detail
    ctx.fillStyle = '#ccccbb';
    ctx.fillRect(5, 12, 2, BH - 14);
    ctx.fillRect(BW - 7, 12, 2, BH - 14);

    // Scroll/symbol in window
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(14, 14, 20, 12);
    ctx.fillStyle = '#ffe0a0';
    // Scroll icon
    ctx.fillRect(18, 17, 12, 2);
    ctx.fillRect(18, 20, 10, 1);
    ctx.fillRect(18, 22, 8, 1);

    // Door (ornate)
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(18, BH - 16, 12, 16);
    ctx.fillStyle = '#6b5a4a';
    ctx.fillRect(20, BH - 14, 8, 14);
    ctx.fillStyle = '#daa520';
    ctx.fillRect(26, BH - 8, 2, 2);
    // Gold arch
    ctx.fillStyle = '#daa520';
    ctx.fillRect(17, BH - 17, 14, 1);

    canvas.refresh();
  }

  // ── Furniture Sprites ──────────────────────────────────────

  private generateFurnitureSprites() {
    const T = TILE_SIZE;

    // ── Shared ──

    // Wooden crate (16x16)
    const crate = this.textures.createCanvas('furn_crate', T, T)!;
    const crCtx = crate.getContext();
    crCtx.fillStyle = '#8b6b3e';
    crCtx.fillRect(2, 3, 12, 11);
    crCtx.fillStyle = '#7a5a2e';
    crCtx.fillRect(2, 3, 12, 1);
    crCtx.fillRect(2, 8, 12, 1);
    crCtx.fillRect(2, 13, 12, 1);
    crCtx.fillStyle = '#6b4a1e';
    crCtx.fillRect(2, 3, 1, 11);
    crCtx.fillRect(13, 3, 1, 11);
    crCtx.fillStyle = '#9c7c4e';
    crCtx.fillRect(4, 5, 8, 2);
    crate.refresh();

    // Floor rug (16x16)
    const rug = this.textures.createCanvas('furn_rug', T, T)!;
    const rgCtx = rug.getContext();
    rgCtx.fillStyle = '#8b3333';
    rgCtx.fillRect(1, 2, 14, 12);
    rgCtx.fillStyle = '#aa4444';
    rgCtx.fillRect(2, 3, 12, 10);
    rgCtx.fillStyle = '#cc8844';
    rgCtx.fillRect(3, 4, 10, 1);
    rgCtx.fillRect(3, 11, 10, 1);
    rgCtx.fillRect(3, 4, 1, 8);
    rgCtx.fillRect(12, 4, 1, 8);
    rug.refresh();

    // Candle (16x16)
    const candle = this.textures.createCanvas('furn_candle', T, T)!;
    const caCtx = candle.getContext();
    caCtx.fillStyle = '#8b7355';
    caCtx.fillRect(5, 12, 6, 2); // dish
    caCtx.fillStyle = '#eeeedd';
    caCtx.fillRect(7, 6, 2, 7); // wax
    caCtx.fillStyle = '#ffaa22';
    caCtx.fillRect(7, 3, 2, 3); // flame body
    caCtx.fillStyle = '#ffdd44';
    caCtx.fillRect(7, 4, 2, 1); // flame bright
    caCtx.fillStyle = '#ff6600';
    caCtx.fillRect(7, 3, 2, 1); // flame tip
    candle.refresh();

    // ── Forge theme ──

    // Anvil (16x16)
    const anvil = this.textures.createCanvas('furn_anvil', T, T)!;
    const anCtx = anvil.getContext();
    anCtx.fillStyle = '#555555';
    anCtx.fillRect(3, 8, 10, 5); // base
    anCtx.fillStyle = '#666666';
    anCtx.fillRect(2, 5, 12, 3); // face
    anCtx.fillStyle = '#444444';
    anCtx.fillRect(1, 4, 4, 2); // horn
    anCtx.fillStyle = '#777777';
    anCtx.fillRect(4, 6, 8, 1); // highlight
    anvil.refresh();

    // Fireplace (16x32 — 1 wide, 2 tall)
    const fp = this.textures.createCanvas('furn_fireplace', T, T * 2)!;
    const fpCtx = fp.getContext();
    // Stone frame
    fpCtx.fillStyle = '#777777';
    fpCtx.fillRect(0, 0, T, T * 2);
    fpCtx.fillStyle = '#666666';
    fpCtx.fillRect(1, 0, 14, 4); // mantle
    fpCtx.fillRect(0, 0, 3, T * 2); // left pillar
    fpCtx.fillRect(13, 0, 3, T * 2); // right pillar
    // Firebox
    fpCtx.fillStyle = '#222222';
    fpCtx.fillRect(3, 6, 10, 20);
    // Fire
    fpCtx.fillStyle = '#ff4400';
    fpCtx.fillRect(4, 16, 8, 8);
    fpCtx.fillStyle = '#ff8833';
    fpCtx.fillRect(5, 14, 6, 6);
    fpCtx.fillStyle = '#ffcc22';
    fpCtx.fillRect(6, 12, 4, 5);
    // Logs
    fpCtx.fillStyle = '#5a3a1a';
    fpCtx.fillRect(4, 24, 8, 3);
    fpCtx.fillStyle = '#6b4a2a';
    fpCtx.fillRect(5, 22, 6, 3);
    fp.refresh();

    // Workbench (32x16 — 2 wide, 1 tall)
    const wb = this.textures.createCanvas('furn_workbench', T * 2, T)!;
    const wbCtx = wb.getContext();
    // Table top
    wbCtx.fillStyle = '#8b6b3e';
    wbCtx.fillRect(0, 3, 32, 5);
    wbCtx.fillStyle = '#7a5a2e';
    wbCtx.fillRect(0, 3, 32, 1);
    // Legs
    wbCtx.fillStyle = '#6b4a1e';
    wbCtx.fillRect(1, 8, 3, 7);
    wbCtx.fillRect(28, 8, 3, 7);
    wbCtx.fillRect(14, 8, 3, 7);
    // Tools on top
    wbCtx.fillStyle = '#888888'; // hammer head
    wbCtx.fillRect(5, 1, 4, 2);
    wbCtx.fillStyle = '#6b4a1e'; // hammer handle
    wbCtx.fillRect(6, 3, 2, 2);
    wbCtx.fillStyle = '#aa5522'; // tongs
    wbCtx.fillRect(20, 1, 6, 2);
    wb.refresh();

    // ── Office theme ──

    // Desk with monitor (32x16)
    const desk = this.textures.createCanvas('furn_desk', T * 2, T)!;
    const dkCtx = desk.getContext();
    // Desktop surface
    dkCtx.fillStyle = '#7a6a5a';
    dkCtx.fillRect(0, 5, 32, 4);
    dkCtx.fillStyle = '#6a5a4a';
    dkCtx.fillRect(0, 5, 32, 1);
    // Legs
    dkCtx.fillStyle = '#5a4a3a';
    dkCtx.fillRect(1, 9, 2, 6);
    dkCtx.fillRect(29, 9, 2, 6);
    // Monitor
    dkCtx.fillStyle = '#333333';
    dkCtx.fillRect(10, 0, 12, 5);
    dkCtx.fillStyle = '#4488aa';
    dkCtx.fillRect(11, 1, 10, 3); // screen
    // Monitor stand
    dkCtx.fillStyle = '#444444';
    dkCtx.fillRect(14, 5, 4, 1);
    // Keyboard
    dkCtx.fillStyle = '#555555';
    dkCtx.fillRect(9, 6, 8, 2);
    desk.refresh();

    // Chair (16x16)
    const chair = this.textures.createCanvas('furn_chair', T, T)!;
    const chCtx = chair.getContext();
    // Back
    chCtx.fillStyle = '#6b4a2a';
    chCtx.fillRect(4, 2, 8, 3);
    // Seat
    chCtx.fillStyle = '#8b6a4a';
    chCtx.fillRect(3, 5, 10, 5);
    // Legs
    chCtx.fillStyle = '#5a3a1a';
    chCtx.fillRect(4, 10, 2, 4);
    chCtx.fillRect(10, 10, 2, 4);
    chair.refresh();

    // Potted plant (16x16)
    const plant = this.textures.createCanvas('furn_plant', T, T)!;
    const plCtx = plant.getContext();
    // Pot
    plCtx.fillStyle = '#aa6633';
    plCtx.fillRect(5, 10, 6, 5);
    plCtx.fillStyle = '#994422';
    plCtx.fillRect(4, 10, 8, 1);
    // Leaves
    plCtx.fillStyle = '#33aa44';
    plCtx.fillRect(4, 4, 8, 6);
    plCtx.fillStyle = '#44bb55';
    plCtx.fillRect(3, 5, 3, 3);
    plCtx.fillRect(10, 5, 3, 3);
    plCtx.fillStyle = '#22882e';
    plCtx.fillRect(6, 2, 4, 3);
    // Stem
    plCtx.fillStyle = '#447733';
    plCtx.fillRect(7, 8, 2, 3);
    plant.refresh();

    // ── Library theme ──

    // Bookshelf (16x32 — 1 wide, 2 tall)
    const bs = this.textures.createCanvas('furn_bookshelf', T, T * 2)!;
    const bsCtx = bs.getContext();
    // Frame
    bsCtx.fillStyle = '#6b4226';
    bsCtx.fillRect(0, 0, T, T * 2);
    bsCtx.fillStyle = '#8b5a2b';
    bsCtx.fillRect(1, 1, 14, 30);
    // Shelves
    bsCtx.fillStyle = '#6b4226';
    bsCtx.fillRect(1, 7, 14, 1);
    bsCtx.fillRect(1, 15, 14, 1);
    bsCtx.fillRect(1, 23, 14, 1);
    // Books — row 1
    bsCtx.fillStyle = '#aa3333';
    bsCtx.fillRect(2, 1, 2, 6);
    bsCtx.fillStyle = '#3333aa';
    bsCtx.fillRect(5, 2, 2, 5);
    bsCtx.fillStyle = '#33aa33';
    bsCtx.fillRect(8, 1, 2, 6);
    bsCtx.fillStyle = '#aa8833';
    bsCtx.fillRect(11, 2, 2, 5);
    // Books — row 2
    bsCtx.fillStyle = '#8833aa';
    bsCtx.fillRect(2, 8, 2, 7);
    bsCtx.fillStyle = '#aa3355';
    bsCtx.fillRect(5, 9, 2, 6);
    bsCtx.fillStyle = '#3388aa';
    bsCtx.fillRect(8, 8, 2, 7);
    bsCtx.fillStyle = '#88aa33';
    bsCtx.fillRect(11, 9, 2, 6);
    // Books — row 3
    bsCtx.fillStyle = '#555588';
    bsCtx.fillRect(2, 16, 2, 7);
    bsCtx.fillStyle = '#885533';
    bsCtx.fillRect(5, 17, 2, 6);
    bsCtx.fillStyle = '#338855';
    bsCtx.fillRect(8, 16, 2, 7);
    bsCtx.fillStyle = '#aa5533';
    bsCtx.fillRect(11, 17, 2, 6);
    // Bottom section — scrolls
    bsCtx.fillStyle = '#ddc088';
    bsCtx.fillRect(3, 24, 10, 3);
    bsCtx.fillStyle = '#ccb078';
    bsCtx.fillRect(4, 25, 3, 1);
    bsCtx.fillRect(9, 25, 3, 1);
    bs.refresh();

    // Reading desk (16x16)
    const rd = this.textures.createCanvas('furn_reading_desk', T, T)!;
    const rdCtx = rd.getContext();
    // Desk
    rdCtx.fillStyle = '#7a5a3a';
    rdCtx.fillRect(1, 5, 14, 4);
    rdCtx.fillStyle = '#6a4a2a';
    rdCtx.fillRect(1, 5, 14, 1);
    // Legs
    rdCtx.fillStyle = '#5a3a1a';
    rdCtx.fillRect(2, 9, 2, 5);
    rdCtx.fillRect(12, 9, 2, 5);
    // Open book
    rdCtx.fillStyle = '#eeddbb';
    rdCtx.fillRect(3, 2, 10, 4);
    rdCtx.fillStyle = '#444444';
    rdCtx.fillRect(8, 2, 1, 4); // spine
    rdCtx.fillStyle = '#888888'; // text lines
    rdCtx.fillRect(4, 3, 3, 1);
    rdCtx.fillRect(4, 5, 2, 1);
    rdCtx.fillRect(9, 3, 3, 1);
    rdCtx.fillRect(9, 5, 4, 1);
    rd.refresh();

    // Scroll rack (16x16)
    const sr = this.textures.createCanvas('furn_scroll_rack', T, T)!;
    const srCtx = sr.getContext();
    // Frame
    srCtx.fillStyle = '#6b4a2a';
    srCtx.fillRect(2, 1, 2, 14);
    srCtx.fillRect(12, 1, 2, 14);
    srCtx.fillRect(2, 1, 12, 1);
    srCtx.fillRect(2, 7, 12, 1);
    srCtx.fillRect(2, 13, 12, 1);
    // Scrolls
    srCtx.fillStyle = '#ddc088';
    srCtx.fillRect(5, 2, 6, 2);
    srCtx.fillRect(5, 4, 5, 2);
    srCtx.fillStyle = '#ccb078';
    srCtx.fillRect(5, 8, 6, 2);
    srCtx.fillRect(6, 10, 4, 2);
    sr.refresh();

    // ── Scroll Hall theme ──

    // Pedestal (16x16)
    const ped = this.textures.createCanvas('furn_pedestal', T, T)!;
    const peCtx = ped.getContext();
    // Base
    peCtx.fillStyle = '#ccccbb';
    peCtx.fillRect(3, 12, 10, 3);
    // Column
    peCtx.fillStyle = '#ddddcc';
    peCtx.fillRect(5, 4, 6, 8);
    // Capital (top)
    peCtx.fillStyle = '#ccccbb';
    peCtx.fillRect(3, 2, 10, 3);
    // Gold trim
    peCtx.fillStyle = '#daa520';
    peCtx.fillRect(3, 2, 10, 1);
    peCtx.fillRect(3, 14, 10, 1);
    // Glowing orb on top
    peCtx.fillStyle = '#44aaff';
    peCtx.fillRect(6, 0, 4, 2);
    peCtx.fillStyle = '#66ccff';
    peCtx.fillRect(7, 0, 2, 1);
    ped.refresh();

    // Pillar (16x32 — 1 wide, 2 tall)
    const pil = this.textures.createCanvas('furn_pillar', T, T * 2)!;
    const piCtx = pil.getContext();
    // Base
    piCtx.fillStyle = '#bbbbaa';
    piCtx.fillRect(2, 28, 12, 4);
    // Shaft
    piCtx.fillStyle = '#ddddcc';
    piCtx.fillRect(4, 4, 8, 24);
    // Light side
    piCtx.fillStyle = '#eeeedd';
    piCtx.fillRect(4, 4, 3, 24);
    // Capital
    piCtx.fillStyle = '#ccccbb';
    piCtx.fillRect(2, 0, 12, 5);
    piCtx.fillStyle = '#bbbbaa';
    piCtx.fillRect(3, 1, 10, 3);
    // Gold trim
    piCtx.fillStyle = '#daa520';
    piCtx.fillRect(2, 0, 12, 1);
    piCtx.fillRect(2, 4, 12, 1);
    pil.refresh();

    // Rune circle (32x32 — 2x2 tiles)
    const rc = this.textures.createCanvas('furn_rune_circle', T * 2, T * 2)!;
    const rcCtx = rc.getContext();
    // Outer circle (approximated with rects)
    rcCtx.fillStyle = '#2244aa44';
    // Fill a rough circle
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = x - 16;
        const dy = y - 16;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 14 && dist > 11) {
          rcCtx.fillStyle = '#4488ff';
          rcCtx.fillRect(x, y, 1, 1);
        } else if (dist < 11 && dist > 9) {
          rcCtx.fillStyle = '#2244aa33';
          rcCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Inner glow
    rcCtx.fillStyle = '#44aaff44';
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = x - 16;
        const dy = y - 16;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          rcCtx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Rune marks at cardinal directions
    rcCtx.fillStyle = '#88ddff';
    rcCtx.fillRect(15, 3, 2, 3);  // N
    rcCtx.fillRect(15, 26, 2, 3); // S
    rcCtx.fillRect(3, 15, 3, 2);  // W
    rcCtx.fillRect(26, 15, 3, 2); // E
    // Diagonal marks
    rcCtx.fillRect(6, 6, 2, 2);
    rcCtx.fillRect(24, 6, 2, 2);
    rcCtx.fillRect(6, 24, 2, 2);
    rcCtx.fillRect(24, 24, 2, 2);
    // Center dot
    rcCtx.fillStyle = '#aaeeff';
    rcCtx.fillRect(15, 15, 2, 2);
    rc.refresh();
  }
}
