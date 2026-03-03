import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { Player } from '../entities/Player';

// Simple overworld map layout
// 0 = grass, 1 = path, 2 = water, 3 = wall, 4 = tree
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

function generateOverworldMap(): number[][] {
  const map: number[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Border: water on edges
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        row.push(2);
      }
      // Second border: trees
      else if (x === 1 || x === MAP_WIDTH - 2 || y === 1 || y === MAP_HEIGHT - 2) {
        row.push(4);
      }
      // Path running through the middle
      else if (y >= 14 && y <= 15 && x >= 2 && x <= MAP_WIDTH - 3) {
        row.push(1);
      }
      // Vertical path to building area
      else if (x >= 19 && x <= 20 && y >= 8 && y <= 14) {
        row.push(1);
      }
      // Scattered trees for scenery
      else if (
        (x === 5 && y === 5) ||
        (x === 6 && y === 5) ||
        (x === 10 && y === 8) ||
        (x === 30 && y === 6) ||
        (x === 31 && y === 6) ||
        (x === 25 && y === 20) ||
        (x === 8 && y === 22) ||
        (x === 9 && y === 22) ||
        (x === 35 && y === 22) ||
        (x === 12 && y === 12) ||
        (x === 33 && y === 10) ||
        (x === 34 && y === 10) ||
        (x === 15 && y === 24) ||
        (x === 28 && y === 24)
      ) {
        row.push(4);
      }
      // Everything else is grass
      else {
        row.push(0);
      }
    }
    map.push(row);
  }

  return map;
}

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  private buildingZone!: Phaser.GameObjects.Zone;
  private interactHint!: Phaser.GameObjects.Text;
  private nearBuilding = false;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(data?: { fromBuilding?: boolean }) {
    const mapData = generateOverworldMap();

    // Create a tilemap from the data
    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    // Add tile images as individual tile textures
    tilemap.addTilesetImage('0', 'tile_grass', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('1', 'tile_path', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('2', 'tile_water', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('3', 'tile_wall', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('4', 'tile_tree', TILE_SIZE, TILE_SIZE);

    // We used a data-based tilemap, so the layer is auto-created
    const layer = tilemap.layers[0].tilemapLayer;
    if (!layer) {
      // Fallback: create the layer manually
      const tilesets = ['0', '1', '2', '3', '4'];
      tilemap.createLayer(0, tilesets, 0, 0);
    }

    // Set collision on water and tree tiles
    tilemap.setCollision([2, 4]);

    this.collisionLayer = tilemap.layers[0].tilemapLayer;

    // Place the building sprite
    const buildingX = 19 * TILE_SIZE;
    const buildingY = 6 * TILE_SIZE;
    const buildingSprite = this.add.image(
      buildingX + TILE_SIZE * 1.5,
      buildingY + TILE_SIZE * 1.5,
      'building',
    );
    buildingSprite.setDepth(buildingY + TILE_SIZE * 3);

    // Building entry zone (in front of the door)
    this.buildingZone = this.add.zone(
      buildingX + TILE_SIZE * 1.5,
      buildingY + TILE_SIZE * 3 + 4,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(this.buildingZone, true);

    // Add collision bodies for building walls (around the building, excluding door)
    const wallBodies = [
      // Left side of building
      { x: buildingX, y: buildingY, w: TILE_SIZE * 3, h: TILE_SIZE * 2.5 },
      // Left of door
      { x: buildingX, y: buildingY + TILE_SIZE * 2.5, w: TILE_SIZE * 1, h: TILE_SIZE * 0.5 },
      // Right of door
      {
        x: buildingX + TILE_SIZE * 2,
        y: buildingY + TILE_SIZE * 2.5,
        w: TILE_SIZE * 1,
        h: TILE_SIZE * 0.5,
      },
    ];

    wallBodies.forEach(({ x, y, w, h }) => {
      const wallBody = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(wallBody, true);
      this.physics.add.collider(this.player?.sprite || this.add.zone(0, 0, 0, 0), wallBody);
    });

    // Determine player spawn position
    let spawnX = 10 * TILE_SIZE;
    let spawnY = 14 * TILE_SIZE;
    if (data?.fromBuilding) {
      spawnX = 19.5 * TILE_SIZE;
      spawnY = 10 * TILE_SIZE;
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);

    // Re-add wall collisions with actual player sprite
    wallBodies.forEach(({ x, y, w, h }) => {
      const wallBody = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(wallBody, true);
      this.physics.add.collider(this.player.sprite, wallBody);
    });

    // Tilemap collision
    this.physics.add.collider(this.player.sprite, this.collisionLayer);

    // Building entry overlap
    this.physics.add.overlap(this.player.sprite, this.buildingZone, () => {
      this.nearBuilding = true;
    });

    // Camera setup
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(
      0,
      0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );

    // Interact hint text
    this.interactHint = this.add.text(0, 0, 'Press E to enter', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    });
    this.interactHint.setDepth(1000);
    this.interactHint.setVisible(false);

    // World bounds
    this.physics.world.setBounds(
      0,
      0,
      MAP_WIDTH * TILE_SIZE,
      MAP_HEIGHT * TILE_SIZE,
    );
  }

  update() {
    this.player.update();

    // Check building proximity
    if (this.nearBuilding) {
      this.interactHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
      );
      this.interactHint.setVisible(true);

      if (this.player.interactPressed()) {
        this.scene.start('BuildingScene');
      }
    } else {
      this.interactHint.setVisible(false);
    }

    // Reset for next frame
    this.nearBuilding = false;
  }
}
