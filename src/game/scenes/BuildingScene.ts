import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { getEntityByRef, getComponentOwner, entityRef as makeEntityRef } from '../../data/mock-catalog';
import { generateBuildingInfo, generateBuildingNPCDialogue } from '../systems/DialogueSystem';
import { useGameStore, type DialogueLine } from '../../store/gameStore';
import type { Entity } from '../../data/types';

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;

function generateBuildingMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
        if (y === ROOM_HEIGHT - 1 && x >= 9 && x <= 10) {
          row.push(2); // door
        } else {
          row.push(0); // wall
        }
      } else {
        row.push(1); // floor
      }
    }
    map.push(row);
  }
  return map;
}

export class BuildingScene extends Phaser.Scene {
  private player!: Player;
  private interiorNpc: NPC | null = null;
  private nearExit = false;
  private nearNpc = false;
  private exitHint!: Phaser.GameObjects.Text;
  private npcHint!: Phaser.GameObjects.Text;
  private entityRef = '';
  private componentEntity: Entity | null = null;
  private ownerEntity: Entity | null = null;
  private qKey!: Phaser.Input.Keyboard.Key;
  private dialogueJustEnded = false;

  constructor() {
    super({ key: 'BuildingScene' });
  }

  create(data?: { entityRef?: string }) {
    this.entityRef = data?.entityRef ?? '';
    this.componentEntity = this.entityRef
      ? getEntityByRef(this.entityRef) ?? null
      : null;

    // Find the owner of this component to place as interior NPC
    this.ownerEntity = this.componentEntity
      ? getComponentOwner(this.componentEntity) ?? null
      : null;

    const mapData = generateBuildingMap();

    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tsWall = tilemap.addTilesetImage('wall', 'tile_wall', TILE_SIZE, TILE_SIZE, 0, 0, 0)!;
    const tsFloor = tilemap.addTilesetImage('floor', 'tile_floor', TILE_SIZE, TILE_SIZE, 0, 0, 1)!;
    const tsDoor = tilemap.addTilesetImage('door', 'tile_door', TILE_SIZE, TILE_SIZE, 0, 0, 2)!;

    const collisionLayer = tilemap.createLayer(0, [tsWall, tsFloor, tsDoor], 0, 0)!;
    collisionLayer.setCollision([0]);

    // World bounds to prevent player escaping the room
    this.physics.world.setBounds(0, 0, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

    // Player near the door
    const spawnX = 9.5 * TILE_SIZE;
    const spawnY = (ROOM_HEIGHT - 2) * TILE_SIZE;
    this.player = new Player(this, spawnX, spawnY);
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, collisionLayer);

    // Exit zone
    const exitZone = this.add.zone(
      9.5 * TILE_SIZE,
      (ROOM_HEIGHT - 0.5) * TILE_SIZE,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(exitZone, true);
    this.physics.add.overlap(this.player.sprite, exitZone, () => {
      this.nearExit = true;
    });

    // Place interior NPC if we have an owner
    this.interiorNpc = null;
    if (this.ownerEntity) {
      const npcRef = makeEntityRef(this.ownerEntity);
      const displayName =
        (this.ownerEntity.spec.profile as { displayName?: string })?.displayName ??
        this.ownerEntity.metadata.name;
      // Determine sprite index from owner name hash
      const spriteIdx = hashString(npcRef) % 6;
      const npcX = 4 * TILE_SIZE;
      const npcY = 4 * TILE_SIZE;
      this.interiorNpc = new NPC(
        this, npcX, npcY, `npc_${spriteIdx}`, npcRef, displayName,
      );
      this.physics.add.collider(this.player.sprite, this.interiorNpc.sprite);

      // NPC interaction zone
      const npcZone = this.add.zone(npcX, npcY, TILE_SIZE * 2.5, TILE_SIZE * 2.5);
      this.physics.add.existing(npcZone, true);
      this.physics.add.overlap(this.player.sprite, npcZone, () => {
        this.nearNpc = true;
      });

      // NPC name label
      this.add.text(npcX, npcY - 12, displayName, {
        fontSize: '8px',
        color: '#ffe0a0',
        backgroundColor: '#000000aa',
        padding: { x: 2, y: 1 },
      }).setOrigin(0.5, 1).setDepth(1000);
    }

    // Camera
    this.cameras.main.centerOn(
      (ROOM_WIDTH * TILE_SIZE) / 2,
      (ROOM_HEIGHT * TILE_SIZE) / 2,
    );

    // Exit hint
    this.exitHint = this.add.text(0, 0, 'Press E to exit', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    });
    this.exitHint.setDepth(1000);
    this.exitHint.setVisible(false);

    // NPC hint
    this.npcHint = this.add.text(0, 0, 'Press E to talk', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    });
    this.npcHint.setDepth(1000);
    this.npcHint.setVisible(false);

    // Q key for detail panel
    this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Render building content
    this.renderBuildingContent();
  }

  private renderBuildingContent() {
    const centerX = (ROOM_WIDTH * TILE_SIZE) / 2;

    if (!this.componentEntity) {
      this.add
        .text(centerX, -3 * TILE_SIZE, 'An empty room.', {
          fontSize: '10px',
          color: '#ffe0a0',
          backgroundColor: '#5a4a3a',
          padding: { x: 4, y: 4 },
        })
        .setOrigin(0.5, 0)
        .setDepth(10);
      return;
    }

    const info = generateBuildingInfo(this.componentEntity);

    // Title — centered above room
    const name = info[0] ?? this.componentEntity.metadata.name;
    this.add
      .text(centerX, -7 * TILE_SIZE, name, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffe0a0',
        backgroundColor: '#5a4a3a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Type + lifecycle line
    if (info[1]) {
      this.add
        .text(centerX, -5.5 * TILE_SIZE, info[1], {
          fontSize: '10px',
          color: '#aaccff',
          backgroundColor: '#3a3a5a',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 0)
        .setDepth(10);
    }

    // Description and other info
    const descLines = info.slice(3).filter((l) => l.length > 0);
    if (descLines.length > 0) {
      this.add
        .text(centerX, -4 * TILE_SIZE, descLines.join('\n'), {
          fontSize: '10px',
          color: '#d4c4a0',
          backgroundColor: '#4a3a2a',
          padding: { x: 6, y: 4 },
          wordWrap: { width: ROOM_WIDTH * TILE_SIZE },
        })
        .setOrigin(0.5, 0)
        .setDepth(10);
    }

    // Tags
    const tags = this.componentEntity.metadata.tags ?? [];
    if (tags.length > 0) {
      this.add
        .text(
          centerX,
          -1.5 * TILE_SIZE,
          tags.map((t) => `[${t}]`).join(' '),
          { fontSize: '9px', color: '#88cc88' },
        )
        .setOrigin(0.5, 0)
        .setDepth(10);
    }

    // View Details hint — inside room near bottom
    this.add
      .text(
        TILE_SIZE * 2,
        TILE_SIZE * (ROOM_HEIGHT - 3),
        'Press Q to view full details',
        {
          fontSize: '10px',
          color: '#aaaaff',
          backgroundColor: '#2a2a4a',
          padding: { x: 4, y: 2 },
        },
      )
      .setDepth(10);
  }

  update() {
    const store = useGameStore.getState();

    // Dialogue active — freeze and handle E to advance
    if (store.dialogueActive) {
      this.player.sprite.setVelocity(0, 0);
      this.exitHint.setVisible(false);
      this.npcHint.setVisible(false);

      if (this.player.interactPressed()) {
        store.advanceDialogue();
        if (!useGameStore.getState().dialogueActive) {
          this.dialogueJustEnded = true;
          const ref = store.dialogueEntityRef;
          if (ref) {
            const entity = getEntityByRef(ref);
            if (entity) {
              useGameStore.getState().showDetailPanel(entity);
            }
          }
        }
      }

      this.nearExit = false;
      this.nearNpc = false;
      return;
    }

    this.player.update();

    if (this.interiorNpc) {
      this.interiorNpc.update(0);
    }

    // Q key to show detail panel
    if (
      this.componentEntity &&
      Phaser.Input.Keyboard.JustDown(this.qKey)
    ) {
      useGameStore.getState().showDetailPanel(this.componentEntity);
    }

    // Detail panel open — freeze
    if (store.detailPanelEntity) {
      this.player.sprite.setVelocity(0, 0);
      if (this.dialogueJustEnded) {
        this.dialogueJustEnded = false;
      }
      return;
    }

    // NPC interaction takes priority over exit
    if (this.nearNpc && this.interiorNpc) {
      this.npcHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
      );
      this.npcHint.setVisible(true);
      this.exitHint.setVisible(false);

      if (this.player.interactPressed()) {
        this.startInteriorNPCDialogue();
      }
    } else if (this.nearExit) {
      this.exitHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
      );
      this.exitHint.setVisible(true);
      this.npcHint.setVisible(false);

      if (this.player.interactPressed()) {
        this.scene.start('OverworldScene', {
          fromBuilding: true,
          buildingRef: this.entityRef,
        });
      }
    } else {
      this.exitHint.setVisible(false);
      this.npcHint.setVisible(false);
    }

    this.nearExit = false;
    this.nearNpc = false;
  }

  private startInteriorNPCDialogue() {
    if (!this.ownerEntity || !this.componentEntity) return;

    const displayName =
      (this.ownerEntity.spec.profile as { displayName?: string })?.displayName ??
      this.ownerEntity.metadata.name;
    const role = (this.ownerEntity.spec.role as string) ?? 'Villager';
    const ref = makeEntityRef(this.ownerEntity);

    const rawLines = generateBuildingNPCDialogue(this.ownerEntity, this.componentEntity);
    const dialogueLines: DialogueLine[] = rawLines.map((text) => ({
      speaker: `${displayName} — ${role}`,
      text,
    }));

    useGameStore.getState().startDialogue(dialogueLines, ref);
    useGameStore.getState().unlockEntity(ref);

    if (this.interiorNpc) {
      this.interiorNpc.facePlayer(this.player.sprite.x, this.player.sprite.y);
    }
  }
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
