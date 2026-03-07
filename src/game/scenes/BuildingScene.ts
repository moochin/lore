import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { getEntityByRef, getComponentOwner, entityRef as makeEntityRef } from '../../data/catalog-provider';
import { generateBuildingInfo, generateBuildingNPCDialogue } from '../systems/DialogueSystem';
import { useGameStore, type DialogueLine } from '../../store/gameStore';
import type { Entity } from '../../data/types';

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;

// ── Furniture Layout System ──────────────────────────────────

type InteriorTheme = 'service' | 'website' | 'library' | 'api';

interface FurniturePiece {
  key: string;
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
  collision: boolean;
}

const FURNITURE_LAYOUTS: Record<InteriorTheme, FurniturePiece[]> = {
  service: [
    { key: 'furn_fireplace', tileX: 17, tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_anvil',     tileX: 15, tileY: 3, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_workbench', tileX: 13, tileY: 1, widthTiles: 2, heightTiles: 1, collision: true },
    { key: 'furn_crate',     tileX: 1,  tileY: 8, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_crate',     tileX: 2,  tileY: 8, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_rug',       tileX: 10, tileY: 5, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_candle',    tileX: 8,  tileY: 1, widthTiles: 1, heightTiles: 1, collision: false },
  ],
  website: [
    { key: 'furn_desk',  tileX: 14, tileY: 2, widthTiles: 2, heightTiles: 1, collision: true },
    { key: 'furn_chair', tileX: 14, tileY: 3, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_desk',  tileX: 14, tileY: 5, widthTiles: 2, heightTiles: 1, collision: true },
    { key: 'furn_chair', tileX: 14, tileY: 6, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_plant', tileX: 17, tileY: 1, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_plant', tileX: 1,  tileY: 10, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_rug',   tileX: 10, tileY: 9, widthTiles: 1, heightTiles: 1, collision: false },
  ],
  library: [
    { key: 'furn_bookshelf',   tileX: 15, tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_bookshelf',   tileX: 17, tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_bookshelf',   tileX: 13, tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_reading_desk', tileX: 10, tileY: 3, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_candle',      tileX: 11, tileY: 3, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_scroll_rack', tileX: 1,  tileY: 8, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_scroll_rack', tileX: 1,  tileY: 10, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_rug',         tileX: 10, tileY: 5, widthTiles: 1, heightTiles: 1, collision: false },
  ],
  api: [
    { key: 'furn_pillar',      tileX: 8,  tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_pillar',      tileX: 12, tileY: 1, widthTiles: 1, heightTiles: 2, collision: true },
    { key: 'furn_pedestal',    tileX: 16, tileY: 3, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_pedestal',    tileX: 16, tileY: 6, widthTiles: 1, heightTiles: 1, collision: true },
    { key: 'furn_rune_circle', tileX: 14, tileY: 8, widthTiles: 2, heightTiles: 2, collision: false },
    { key: 'furn_candle',      tileX: 17, tileY: 3, widthTiles: 1, heightTiles: 1, collision: false },
    { key: 'furn_candle',      tileX: 17, tileY: 6, widthTiles: 1, heightTiles: 1, collision: false },
  ],
};

// ── Scene ─────────────────────────────────────────────────────

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
    // Scene transition — fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
    useGameStore.getState().setCurrentScene('BuildingScene');

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

    // Place themed furniture
    this.placeFurniture();

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
      this.add.text(npcX, npcY - 12 * (TILE_SIZE / 16), displayName, {
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

  private getInteriorTheme(): InteriorTheme {
    if (!this.componentEntity) return 'service';
    if (this.componentEntity.kind === 'API') return 'api';
    const specType = (this.componentEntity.spec.type as string) ?? 'service';
    if (specType === 'website') return 'website';
    if (specType === 'library') return 'library';
    return 'service';
  }

  private placeFurniture() {
    const theme = this.getInteriorTheme();
    const layout = FURNITURE_LAYOUTS[theme];

    for (const piece of layout) {
      const px = piece.tileX * TILE_SIZE + (piece.widthTiles * TILE_SIZE) / 2;
      const py = piece.tileY * TILE_SIZE + (piece.heightTiles * TILE_SIZE) / 2;

      const img = this.add.image(px, py, piece.key);

      if (piece.collision) {
        // Depth sort by bottom edge so player walks behind when above
        img.setDepth(piece.tileY * TILE_SIZE + piece.heightTiles * TILE_SIZE);
        // Static collision zone
        const zone = this.add.zone(px, py, piece.widthTiles * TILE_SIZE, piece.heightTiles * TILE_SIZE);
        this.physics.add.existing(zone, true);
        this.physics.add.collider(this.player.sprite, zone);
      } else {
        // Walkable — render below player
        img.setDepth(1);
      }

      // Flickering light effect for candles and fireplaces
      if (piece.key === 'furn_candle' || piece.key === 'furn_fireplace') {
        // Flame overlay — only the fire/flame pixels, placed on top
        const flameKey = `${piece.key}_flame`;
        const flame = this.add.image(px, py, flameKey);
        flame.setDepth(img.depth + 1);

        // Pulsing alpha on flame overlay only
        this.tweens.add({
          targets: flame,
          alpha: { from: 1, to: 0.4 },
          duration: 300 + Math.random() * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Warm glow circle underneath
        const glowRadius = piece.key === 'furn_fireplace' ? TILE_SIZE * 3 : TILE_SIZE * 1.5;
        const glow = this.add.circle(px, py, glowRadius, 0xff8833, 0.12);
        glow.setDepth(0);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.12, to: 0.04 },
          scaleX: { from: 1, to: 0.85 },
          scaleY: { from: 1, to: 0.85 },
          duration: 400 + Math.random() * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private renderBuildingContent() {
    // All HUD elements use setScrollFactor(0) so they stay fixed to the
    // camera viewport regardless of world position.
    const PANEL_W = 172;
    const PANEL_X = 4;
    const PANEL_Y = 4;
    const TEXT_X = PANEL_X + 6;
    const DEPTH = 2000;

    if (!this.componentEntity) {
      const bg = this.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, 32, 0x5a4a3a, 0.88)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH);
      void bg;
      this.add
        .text(TEXT_X, PANEL_Y + 8, 'An empty room.', {
          fontSize: '10px',
          color: '#ffe0a0',
        })
        .setScrollFactor(0)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 1);
      return;
    }

    const info = generateBuildingInfo(this.componentEntity);
    const name = info[0] ?? this.componentEntity.metadata.name;
    const typeLine = info[1] ?? '';
    const descLines = info.slice(3).filter((l) => l.length > 0);
    const tags = this.componentEntity.metadata.tags ?? [];

    // Measure panel height: title + type + desc lines + tags + q-hint
    const lineH = 14;
    let panelH = 8 + 16 + 4; // top pad + title + gap
    if (typeLine) panelH += lineH + 4;
    if (descLines.length > 0) panelH += descLines.length * lineH + 8;
    if (tags.length > 0) panelH += lineH + 4;
    panelH += lineH + 8; // q-hint + bottom pad

    // Panel background
    const bg = this.add
      .rectangle(PANEL_X, PANEL_Y, PANEL_W, panelH, 0x1a1408, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    void bg;

    // Left accent bar
    const accent = this.add
      .rectangle(PANEL_X, PANEL_Y, 3, panelH, 0xffe0a0, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    void accent;

    let curY = PANEL_Y + 8;

    // Title
    this.add
      .text(TEXT_X, curY, name, {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffe0a0',
        wordWrap: { width: PANEL_W - 12 },
      })
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
    curY += 16 + 4;

    // Type + lifecycle
    if (typeLine) {
      this.add
        .text(TEXT_X, curY, typeLine, {
          fontSize: '9px',
          color: '#aaccff',
          wordWrap: { width: PANEL_W - 12 },
        })
        .setScrollFactor(0)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 2);
      curY += lineH + 4;
    }

    // Description lines
    if (descLines.length > 0) {
      this.add
        .text(TEXT_X, curY, descLines.join('\n'), {
          fontSize: '9px',
          color: '#d4c4a0',
          wordWrap: { width: PANEL_W - 12 },
        })
        .setScrollFactor(0)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 2);
      curY += descLines.length * lineH + 8;
    }

    // Tags
    if (tags.length > 0) {
      this.add
        .text(TEXT_X, curY, tags.map((t) => `[${t}]`).join(' '), {
          fontSize: '9px',
          color: '#88cc88',
          wordWrap: { width: PANEL_W - 12 },
        })
        .setScrollFactor(0)
        .setOrigin(0, 0)
        .setDepth(DEPTH + 2);
      curY += lineH + 4;
    }

    // Q-hint separator line
    const sep = this.add
      .rectangle(PANEL_X + 3, curY, PANEL_W - 3, 1, 0x5a4a3a, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    void sep;
    curY += 4;

    // Q-hint
    this.add
      .text(TEXT_X, curY, 'Q — full details', {
        fontSize: '9px',
        color: '#aaaaff',
      })
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setDepth(DEPTH + 2);
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

    // Depth sort player so they walk behind tall furniture
    this.player.sprite.setDepth(this.player.sprite.y);

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
        this.player.sprite.x - 30 * (TILE_SIZE / 16),
        this.player.sprite.y - 20 * (TILE_SIZE / 16),
      );
      this.npcHint.setVisible(true);
      this.exitHint.setVisible(false);

      if (this.player.interactPressed()) {
        this.startInteriorNPCDialogue();
      }
    } else if (this.nearExit) {
      this.exitHint.setPosition(
        this.player.sprite.x - 30 * (TILE_SIZE / 16),
        this.player.sprite.y - 20 * (TILE_SIZE / 16),
      );
      this.exitHint.setVisible(true);
      this.npcHint.setVisible(false);

      if (this.player.interactPressed()) {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('OverworldScene', {
            fromBuilding: true,
            buildingRef: this.entityRef,
          });
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
