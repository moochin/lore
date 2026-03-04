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
    this.generateBuildingSprite();
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
      // NPC sprites: 1 frame per direction (static, no walk cycle)
      const sw = T * directions.length;
      const sh = T;
      const canvas = this.textures.createCanvas(key, sw, sh)!;
      const ctx = canvas.getContext();

      directions.forEach((dir, col) => {
        this.drawCharacter(ctx, col * T, 0, dir, 0, palette.body, palette.hair, palette.skin);
      });

      canvas.refresh();

      // Register frames: one per direction
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

  private generateBuildingSprite() {
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
}
