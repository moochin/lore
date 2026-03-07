import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { generateWorld, generateWorldMapData, MAP_WIDTH, MAP_HEIGHT, TILE, VILLAGE_BIOMES, type BiomeType } from '../systems/MapGenerator';
import { generateNPCDialogue } from '../systems/DialogueSystem';
import {
  getAllTeams,
  getEntityByRef,
} from '../../data/catalog-provider';
import { useGameStore, type DialogueLine } from '../../store/gameStore';
import type { WorldState, BuildingState } from '../../data/types';

/** Map a component's spec.type to its sprite key */
function getBuildingSpriteKey(building: BuildingState): string {
  if (building.buildingType === 'api') return 'building_api';
  const ct = building.componentType ?? 'service';
  if (ct === 'website') return 'building_website';
  if (ct === 'library') return 'building_library';
  return 'building_service';
}

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildingZones: { zone: Phaser.GameObjects.Zone; entityRef: string }[] = [];
  private interactHint!: Phaser.GameObjects.Text;
  private nearTarget: { type: 'building' | 'npc'; ref: string } | null = null;
  private worldState!: WorldState;
  private dialogueJustEnded = false;
  private mKey!: Phaser.Input.Keyboard.Key;

  // Village discovery
  private villageSprites: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  // Biome particles
  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private discoveryPopup: Phaser.GameObjects.Text | null = null;
  private discoveryTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(data?: { fromBuilding?: boolean; buildingRef?: string }) {
    // Scene transition — fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Track scene in store
    useGameStore.getState().setCurrentScene('OverworldScene');

    // Generate world from all teams
    const teams = getAllTeams();
    this.worldState = generateWorld(teams);

    // Generate tile map
    const mapData = generateWorldMapData(MAP_WIDTH, MAP_HEIGHT, this.worldState);

    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tsGrass = tilemap.addTilesetImage('grass', 'tile_grass', TILE_SIZE, TILE_SIZE, 0, 0, TILE.GRASS)!;
    const tsPath = tilemap.addTilesetImage('path', 'tile_path', TILE_SIZE, TILE_SIZE, 0, 0, TILE.PATH)!;
    const tsWater = tilemap.addTilesetImage('water', 'tile_water', TILE_SIZE, TILE_SIZE, 0, 0, TILE.WATER)!;
    const tsWall = tilemap.addTilesetImage('wall', 'tile_wall', TILE_SIZE, TILE_SIZE, 0, 0, TILE.WALL)!;
    const tsTree = tilemap.addTilesetImage('tree', 'tile_tree', TILE_SIZE, TILE_SIZE, 0, 0, TILE.TREE)!;
    const tsFloor = tilemap.addTilesetImage('floor', 'tile_floor', TILE_SIZE, TILE_SIZE, 0, 0, TILE.FLOOR)!;
    const tsDoor = tilemap.addTilesetImage('door', 'tile_door', TILE_SIZE, TILE_SIZE, 0, 0, TILE.DOOR)!;
    const tsRock = tilemap.addTilesetImage('rock', 'tile_rock', TILE_SIZE, TILE_SIZE, 0, 0, TILE.ROCK)!;
    const tsSwamp = tilemap.addTilesetImage('swamp', 'tile_swamp', TILE_SIZE, TILE_SIZE, 0, 0, TILE.SWAMP)!;
    const tsSand = tilemap.addTilesetImage('sand', 'tile_sand', TILE_SIZE, TILE_SIZE, 0, 0, TILE.SAND)!;
    const tsDenseTree = tilemap.addTilesetImage('dense_tree', 'tile_dense_tree', TILE_SIZE, TILE_SIZE, 0, 0, TILE.DENSE_TREE)!;
    const tsFlower = tilemap.addTilesetImage('flower', 'tile_flower', TILE_SIZE, TILE_SIZE, 0, 0, TILE.FLOWER)!;

    const allTilesets = [tsGrass, tsPath, tsWater, tsWall, tsTree, tsFloor, tsDoor, tsRock, tsSwamp, tsSand, tsDenseTree, tsFlower];
    const collisionLayer = tilemap.createLayer(0, allTilesets, 0, 0)!;
    collisionLayer.setCollision([TILE.WATER, TILE.TREE, TILE.ROCK, TILE.DENSE_TREE]);

    // Determine player spawn
    let spawnX = 120 * TILE_SIZE;
    let spawnY = 100 * TILE_SIZE;
    if (data?.fromBuilding && data.buildingRef) {
      for (const village of this.worldState.villages) {
        const building = village.buildings.find((b) => b.entityRef === data.buildingRef);
        if (building) {
          spawnX = (building.position.x + 1.5) * TILE_SIZE;
          spawnY = (building.position.y + 4) * TILE_SIZE;
          break;
        }
      }
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, collisionLayer);

    // Place all villages
    this.npcs = [];
    this.buildingZones = [];
    this.villageSprites = new Map();

    for (const village of this.worldState.villages) {
      const sprites: Phaser.GameObjects.GameObject[] = [];

      // Village name banner
      const bannerX = (village.worldPosition.x + 22) * TILE_SIZE;
      const bannerY = (village.worldPosition.y + 1) * TILE_SIZE;
      const banner = this.add.text(bannerX, bannerY, village.teamName, {
        fontSize: '14px',
        color: '#ffe0a0',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      });
      banner.setOrigin(0.5, 0.5);
      banner.setDepth(1000);
      sprites.push(banner);

      // Place buildings
      for (const building of village.buildings) {
        const placed = this.placeBuilding(building);
        sprites.push(...placed);
      }

      // Place NPCs
      for (const npcState of village.npcs) {
        const npc = this.placeNPC(npcState);
        sprites.push(npc.sprite);
      }

      this.villageSprites.set(village.teamRef, sprites);

      // Set initial alpha based on discovery state
      const discovered = useGameStore.getState().discoveredVillages.includes(village.teamRef);
      if (!discovered) {
        for (const s of sprites) {
          if ('setAlpha' in s) (s as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0.3);
        }
      }
    }

    // Biome particle emitters — one per village
    this.particleEmitters = [];
    this.worldState.villages.forEach((village, i) => {
      const biome: BiomeType = VILLAGE_BIOMES[i] ?? 'plains';
      const emitter = this.createBiomeEmitter(village.worldPosition, biome);
      if (emitter) this.particleEmitters.push(emitter);
    });

    // Camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // Interact hint
    this.interactHint = this.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    });
    this.interactHint.setDepth(1000);
    this.interactHint.setVisible(false);

    // World bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // M key for mini-map toggle
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Discovery popup (reusable)
    this.discoveryPopup = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffd700',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 6 },
    });
    this.discoveryPopup.setOrigin(0.5, 0.5);
    this.discoveryPopup.setDepth(2000);
    this.discoveryPopup.setScrollFactor(0);
    this.discoveryPopup.setPosition(400, 80);
    this.discoveryPopup.setVisible(false);
  }

  private placeBuilding(building: BuildingState): Phaser.GameObjects.GameObject[] {
    const placed: Phaser.GameObjects.GameObject[] = [];
    const bx = building.position.x * TILE_SIZE;
    const by = building.position.y * TILE_SIZE;

    const spriteKey = getBuildingSpriteKey(building);
    const sprite = this.add.image(
      bx + TILE_SIZE * 1.5,
      by + TILE_SIZE * 1.5,
      spriteKey,
    );
    sprite.setDepth(by + TILE_SIZE * 3);
    placed.push(sprite);

    // Building name label
    const label = this.add.text(
      bx + TILE_SIZE * 1.5,
      by - 2 * (TILE_SIZE / 16),
      building.name,
      {
        fontSize: '10px',
        color: '#ffe0a0',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      },
    );
    label.setOrigin(0.5, 1);
    label.setDepth(1000);
    placed.push(label);

    // Entry zone
    const zone = this.add.zone(
      bx + TILE_SIZE * 1.5,
      by + TILE_SIZE * 3 + TILE_SIZE * 0.25,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(zone, true);
    this.buildingZones.push({ zone, entityRef: building.entityRef });

    // Collision walls
    const wallDefs = [
      { x: bx, y: by, w: TILE_SIZE * 3, h: TILE_SIZE * 2.5 },
      { x: bx, y: by + TILE_SIZE * 2.5, w: TILE_SIZE * 1, h: TILE_SIZE * 0.5 },
      { x: bx + TILE_SIZE * 2, y: by + TILE_SIZE * 2.5, w: TILE_SIZE * 1, h: TILE_SIZE * 0.5 },
    ];
    for (const def of wallDefs) {
      const wallBody = this.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h);
      this.physics.add.existing(wallBody, true);
      this.physics.add.collider(this.player.sprite, wallBody);
    }

    // Overlap for entry
    this.physics.add.overlap(this.player.sprite, zone, () => {
      this.nearTarget = { type: 'building', ref: building.entityRef };
    });

    return placed;
  }

  private placeNPC(npcState: {
    entityRef: string;
    name: string;
    position: { x: number; y: number };
    spriteIndex: number;
  }): NPC {
    const px = npcState.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = npcState.position.y * TILE_SIZE + TILE_SIZE / 2;
    const textureKey = `npc_${npcState.spriteIndex % 6}`;

    // Determine entity kind for emote selection
    const entityKind = this.inferEntityKind(npcState.entityRef);

    const npc = new NPC(this, px, py, textureKey, npcState.entityRef, npcState.name, true, entityKind);
    this.npcs.push(npc);

    this.physics.add.collider(this.player.sprite, npc.sprite);

    const interactZone = this.add.zone(px, py, TILE_SIZE * 2.5, TILE_SIZE * 2.5);
    this.physics.add.existing(interactZone, true);
    this.physics.add.overlap(this.player.sprite, interactZone, () => {
      this.nearTarget = { type: 'npc', ref: npcState.entityRef };
    });

    return npc;
  }

  private createBiomeEmitter(
    worldPos: { x: number; y: number },
    biome: BiomeType,
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    // Village centre in world pixels
    const cx = (worldPos.x + 22) * TILE_SIZE;
    const cy = (worldPos.y + 18) * TILE_SIZE;
    const halfW = 22 * TILE_SIZE;
    const halfH = 18 * TILE_SIZE;

    const zone = new Phaser.Geom.Rectangle(-halfW, -halfH, halfW * 2, halfH * 2);

    const configs: Record<BiomeType, Phaser.Types.GameObjects.Particles.ParticleEmitterConfig> = {
      forest: {
        emitZone: { type: 'random', source: zone },
        lifespan: 4000,
        speedX: { min: -10, max: 10 },
        speedY: { min: 15, max: 35 },
        gravityY: 5,
        quantity: 1,
        frequency: 700,
        alpha: { start: 0.8, end: 0 },
        scale: { start: 1, end: 0.6 },
        maxParticles: 0,
      },
      rocky: {
        emitZone: { type: 'random', source: zone },
        lifespan: 5000,
        speedX: { min: -5, max: 5 },
        speedY: { min: 10, max: 25 },
        gravityY: 3,
        quantity: 1,
        frequency: 600,
        alpha: { start: 0.7, end: 0 },
        scale: { start: 1, end: 0.5 },
        maxParticles: 0,
      },
      swamp: {
        emitZone: { type: 'random', source: zone },
        lifespan: 3500,
        speedX: { min: -8, max: 8 },
        speedY: { min: -8, max: 8 },
        gravityY: -2,
        quantity: 1,
        frequency: 900,
        alpha: { start: 0.3, end: 0.9 },
        scale: { start: 0.8, end: 1.2 },
        maxParticles: 0,
      },
      desert: {
        emitZone: { type: 'random', source: zone },
        lifespan: 3000,
        speedX: { min: 20, max: 45 },
        speedY: { min: -5, max: 5 },
        gravityY: 0,
        quantity: 1,
        frequency: 500,
        alpha: { start: 0.6, end: 0 },
        scale: { start: 1, end: 0.4 },
        maxParticles: 0,
      },
      meadow: {
        emitZone: { type: 'random', source: zone },
        lifespan: 5000,
        speedX: { min: -6, max: 6 },
        speedY: { min: -20, max: -8 },
        gravityY: -1,
        quantity: 1,
        frequency: 800,
        alpha: { start: 0.6, end: 0 },
        scale: { start: 1, end: 0.5 },
        maxParticles: 0,
      },
      plains: {
        emitZone: { type: 'random', source: zone },
        lifespan: 4000,
        speedX: { min: -6, max: 6 },
        speedY: { min: -3, max: 3 },
        gravityY: 1,
        quantity: 1,
        frequency: 1200,
        alpha: { start: 0.4, end: 0 },
        scale: { start: 0.8, end: 0.3 },
        maxParticles: 0,
      },
    };

    const textureMap: Record<BiomeType, string> = {
      forest: 'particle_leaf',
      rocky:  'particle_snow',
      swamp:  'particle_firefly',
      desert: 'particle_sand',
      meadow: 'particle_pollen',
      plains: 'particle_dust',
    };

    const emitter = this.add.particles(cx, cy, textureMap[biome], configs[biome]);
    emitter.setDepth(500);
    return emitter;
  }

  private inferEntityKind(entityRef: string): string {
    const entity = getEntityByRef(entityRef);
    if (!entity) return 'default';
    const ownedRef = entity.relations?.find((r) => r.type === 'ownerOf')?.targetRef;
    if (!ownedRef) return 'default';
    if (ownedRef.startsWith('api:')) return 'api';
    const owned = getEntityByRef(ownedRef);
    if (!owned) return 'service';
    const specType = (owned.spec.type as string) ?? 'service';
    if (specType === 'website') return 'website';
    if (specType === 'library') return 'library';
    return 'service';
  }

  update(_time: number) {
    const store = useGameStore.getState();

    // M key toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      store.toggleMiniMap();
    }

    // Update player position in store (for mini-map)
    store.updatePlayerPosition(this.player.sprite.x, this.player.sprite.y);

    // Check village discovery
    this.checkVillageDiscovery();

    // If dialogue is active, freeze player
    if (store.dialogueActive) {
      this.player.sprite.setVelocity(0, 0);
      this.interactHint.setVisible(false);

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

      this.nearTarget = null;
      return;
    }

    // If detail panel is open, freeze player
    if (store.detailPanelEntity) {
      this.player.sprite.setVelocity(0, 0);
      this.interactHint.setVisible(false);
      this.nearTarget = null;
      if (this.dialogueJustEnded) {
        this.dialogueJustEnded = false;
      }
      return;
    }

    // Normal movement
    this.player.update();

    // Update NPCs — set proximity flag and update behavior
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;
    const proximityDist = TILE_SIZE * 3;
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - playerX;
      const dy = npc.sprite.y - playerY;
      npc.playerNearby = Math.sqrt(dx * dx + dy * dy) < proximityDist;
      npc.update(_time);
    }

    // Handle interaction
    if (this.nearTarget) {
      const hintText =
        this.nearTarget.type === 'npc' ? 'Press E to talk' : 'Press E to enter';
      this.interactHint.setText(hintText);
      this.interactHint.setPosition(
        this.player.sprite.x - 30 * (TILE_SIZE / 16),
        this.player.sprite.y - 20 * (TILE_SIZE / 16),
      );
      this.interactHint.setVisible(true);

      if (this.player.interactPressed()) {
        if (this.nearTarget.type === 'npc') {
          this.startNPCDialogue(this.nearTarget.ref);
        } else {
          this.enterBuilding(this.nearTarget.ref);
        }
      }
    } else {
      this.interactHint.setVisible(false);
    }

    this.nearTarget = null;
  }

  private checkVillageDiscovery() {
    const store = useGameStore.getState();
    const px = this.player.sprite.x / TILE_SIZE;
    const py = this.player.sprite.y / TILE_SIZE;

    for (const village of this.worldState.villages) {
      if (store.discoveredVillages.includes(village.teamRef)) continue;

      const vcx = village.worldPosition.x + 22;
      const vcy = village.worldPosition.y + 18;
      const dx = Math.abs(px - vcx);
      const dy = Math.abs(py - vcy);

      if (dx < 28 && dy < 22) {
        // Discover this village
        store.discoverVillage(village.teamRef);

        // Reveal sprites
        const sprites = this.villageSprites.get(village.teamRef);
        if (sprites) {
          for (const s of sprites) {
            if ('setAlpha' in s) (s as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(1);
          }
        }

        // Show discovery popup
        this.showDiscoveryPopup(village.teamName);
      }
    }
  }

  private showDiscoveryPopup(name: string) {
    if (!this.discoveryPopup) return;
    this.discoveryPopup.setText(`Discovered: ${name}!`);
    this.discoveryPopup.setVisible(true);
    this.discoveryPopup.setAlpha(1);

    if (this.discoveryTimer) this.discoveryTimer.destroy();
    this.discoveryTimer = this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: this.discoveryPopup,
        alpha: 0,
        duration: 500,
        onComplete: () => this.discoveryPopup?.setVisible(false),
      });
    });
  }

  private startNPCDialogue(ref: string) {
    const entity = getEntityByRef(ref);
    if (!entity) return;

    const displayName =
      (entity.spec.profile as { displayName?: string })?.displayName ??
      entity.metadata.name;
    const role = (entity.spec.role as string) ?? 'Villager';

    const rawLines = generateNPCDialogue(entity);
    const dialogueLines: DialogueLine[] = rawLines.map((text) => ({
      speaker: `${displayName} — ${role}`,
      text,
    }));

    useGameStore.getState().startDialogue(dialogueLines, ref);
    useGameStore.getState().unlockEntity(ref);

    const npc = this.npcs.find((n) => n.entityRef === ref);
    if (npc) {
      npc.facePlayer(this.player.sprite.x, this.player.sprite.y);
    }
  }

  private enterBuilding(ref: string) {
    useGameStore.getState().unlockEntity(ref);
    useGameStore.getState().setActiveBuilding(ref);
    // Fade out then start building scene
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('BuildingScene', { entityRef: ref });
    });
  }
}
