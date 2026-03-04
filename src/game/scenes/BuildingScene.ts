import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { Player } from '../entities/Player';
import { getEntityByRef } from '../../data/mock-catalog';
import { generateBuildingInfo } from '../systems/DialogueSystem';
import { useGameStore } from '../../store/gameStore';
import type { Entity } from '../../data/types';

const ROOM_WIDTH = 12;
const ROOM_HEIGHT = 10;

function generateBuildingMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
        if (y === ROOM_HEIGHT - 1 && x >= 5 && x <= 6) {
          row.push(6); // door
        } else {
          row.push(3); // wall
        }
      } else {
        row.push(5); // floor
      }
    }
    map.push(row);
  }
  return map;
}

export class BuildingScene extends Phaser.Scene {
  private player!: Player;
  private nearExit = false;
  private exitHint!: Phaser.GameObjects.Text;
  private entityRef = '';
  private componentEntity: Entity | null = null;
  private qKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BuildingScene' });
  }

  create(data?: { entityRef?: string }) {
    this.entityRef = data?.entityRef ?? '';
    this.componentEntity = this.entityRef
      ? getEntityByRef(this.entityRef) ?? null
      : null;

    const mapData = generateBuildingMap();

    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    tilemap.addTilesetImage('3', 'tile_wall', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('5', 'tile_floor', TILE_SIZE, TILE_SIZE);
    tilemap.addTilesetImage('6', 'tile_door', TILE_SIZE, TILE_SIZE);

    tilemap.setCollision([3]);
    const collisionLayer = tilemap.layers[0].tilemapLayer;

    // Player near the door
    const spawnX = 5.5 * TILE_SIZE;
    const spawnY = (ROOM_HEIGHT - 2) * TILE_SIZE;
    this.player = new Player(this, spawnX, spawnY);
    this.physics.add.collider(this.player.sprite, collisionLayer);

    // Exit zone
    const exitZone = this.add.zone(
      5.5 * TILE_SIZE,
      (ROOM_HEIGHT - 0.5) * TILE_SIZE,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(exitZone, true);
    this.physics.add.overlap(this.player.sprite, exitZone, () => {
      this.nearExit = true;
    });

    // Camera
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

    // Q key for detail panel
    this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Render building content
    this.renderBuildingContent();
  }

  private renderBuildingContent() {
    if (!this.componentEntity) {
      this.add
        .text(TILE_SIZE * 2, TILE_SIZE * 1.5, 'An empty room.', {
          fontSize: '8px',
          color: '#ffe0a0',
          backgroundColor: '#5a4a3a',
          padding: { x: 4, y: 4 },
        })
        .setDepth(10);
      return;
    }

    const info = generateBuildingInfo(this.componentEntity);

    // Title plaque
    const name = info[0] ?? this.componentEntity.metadata.name;
    this.add
      .text(TILE_SIZE * 1.5, TILE_SIZE * 1.2, name, {
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffe0a0',
        backgroundColor: '#5a4a3a',
        padding: { x: 6, y: 3 },
      })
      .setDepth(10);

    // Type + lifecycle line
    if (info[1]) {
      this.add
        .text(TILE_SIZE * 1.5, TILE_SIZE * 2.2, info[1], {
          fontSize: '7px',
          color: '#aaccff',
          backgroundColor: '#3a3a5a',
          padding: { x: 4, y: 2 },
        })
        .setDepth(10);
    }

    // Description and other info
    const descLines = info.slice(3).filter((l) => l.length > 0);
    if (descLines.length > 0) {
      this.add
        .text(TILE_SIZE * 1.5, TILE_SIZE * 3.2, descLines.join('\n'), {
          fontSize: '7px',
          color: '#d4c4a0',
          backgroundColor: '#4a3a2a',
          padding: { x: 4, y: 4 },
          wordWrap: { width: (ROOM_WIDTH - 3) * TILE_SIZE },
        })
        .setDepth(10);
    }

    // Tags
    const tags = this.componentEntity.metadata.tags ?? [];
    if (tags.length > 0) {
      this.add
        .text(
          TILE_SIZE * 7,
          TILE_SIZE * 1.2,
          tags.map((t) => `[${t}]`).join(' '),
          { fontSize: '6px', color: '#88cc88' },
        )
        .setDepth(10);
    }

    // View Details hint
    this.add
      .text(
        TILE_SIZE * 1.5,
        TILE_SIZE * (ROOM_HEIGHT - 3),
        'Press Q to view full details',
        {
          fontSize: '7px',
          color: '#aaaaff',
          backgroundColor: '#2a2a4a',
          padding: { x: 4, y: 2 },
        },
      )
      .setDepth(10);
  }

  update() {
    this.player.update();

    // Q key to show detail panel
    if (
      this.componentEntity &&
      Phaser.Input.Keyboard.JustDown(this.qKey)
    ) {
      useGameStore.getState().showDetailPanel(this.componentEntity);
    }

    // Detail panel open — freeze
    if (useGameStore.getState().detailPanelEntity) {
      this.player.sprite.setVelocity(0, 0);
      return;
    }

    if (this.nearExit) {
      this.exitHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
      );
      this.exitHint.setVisible(true);

      if (this.player.interactPressed()) {
        this.scene.start('OverworldScene', {
          fromBuilding: true,
          buildingRef: this.entityRef,
        });
      }
    } else {
      this.exitHint.setVisible(false);
    }

    this.nearExit = false;
  }
}
