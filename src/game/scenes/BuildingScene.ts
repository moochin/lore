import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { Player } from '../entities/Player';

// Simple building interior: 10x8 room
const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 8;

function generateBuildingMap(): number[][] {
  const map: number[][] = [];

  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      // Walls around the edge
      if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
        // Door at bottom center
        if (y === ROOM_HEIGHT - 1 && x >= 4 && x <= 5) {
          row.push(6); // door tile
        } else {
          row.push(3); // wall tile
        }
      } else {
        row.push(5); // floor tile
      }
    }
    map.push(row);
  }

  return map;
}

export class BuildingScene extends Phaser.Scene {
  private player!: Player;
  private exitZone!: Phaser.GameObjects.Zone;
  private nearExit = false;
  private exitHint!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BuildingScene' });
  }

  create() {
    const mapData = generateBuildingMap();

    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    tilemap.addTilesetImage('3', 'tile_wall', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('5', 'tile_floor', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('6', 'tile_door', TILE_SIZE, TILE_SIZE);

    // Set collision on walls
    tilemap.setCollision([3]);

    const collisionLayer = tilemap.layers[0].tilemapLayer;

    // Place player near the door
    const spawnX = 4.5 * TILE_SIZE;
    const spawnY = (ROOM_HEIGHT - 2) * TILE_SIZE;
    this.player = new Player(this, spawnX, spawnY);

    // Collision with walls
    this.physics.add.collider(this.player.sprite, collisionLayer);

    // Exit zone at the door
    this.exitZone = this.add.zone(
      4.5 * TILE_SIZE,
      (ROOM_HEIGHT - 0.5) * TILE_SIZE,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(this.exitZone, true);

    this.physics.add.overlap(this.player.sprite, this.exitZone, () => {
      this.nearExit = true;
    });

    // Camera setup for small room
    this.cameras.main.centerOn(
      (ROOM_WIDTH * TILE_SIZE) / 2,
      (ROOM_HEIGHT * TILE_SIZE) / 2,
    );

    // Exit hint
    this.exitHint = this.add.text(0, 0, 'Press E to exit', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    });
    this.exitHint.setDepth(1000);
    this.exitHint.setVisible(false);

    // Interior decoration: info text on the wall
    this.infoText = this.add.text(
      TILE_SIZE * 2,
      TILE_SIZE * 1.5,
      '  Welcome to the Guild Hall!\n  This building will show\n  service details in M2.',
      {
        fontSize: '8px',
        color: '#ffe0a0',
        backgroundColor: '#5a4a3a',
        padding: { x: 4, y: 4 },
      },
    );
    this.infoText.setDepth(10);
  }

  update() {
    this.player.update();

    if (this.nearExit) {
      this.exitHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
      );
      this.exitHint.setVisible(true);

      if (this.player.interactPressed()) {
        this.scene.start('OverworldScene', { fromBuilding: true });
      }
    } else {
      this.exitHint.setVisible(false);
    }

    this.nearExit = false;
  }
}
