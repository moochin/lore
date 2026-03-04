import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { generateVillage, generateOverworldMapData } from '../systems/MapGenerator';
import { generateNPCDialogue } from '../systems/DialogueSystem';
import {
  platformTeam,
  getTeamMembers,
  getTeamComponents,
  getTeamApis,
  getEntityByRef,
} from '../../data/mock-catalog';
import { useGameStore, type DialogueLine } from '../../store/gameStore';
import type { VillageState, BuildingState } from '../../data/types';

const MAP_WIDTH = 120;
const MAP_HEIGHT = 90;

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private buildingZones: { zone: Phaser.GameObjects.Zone; entityRef: string }[] = [];
  private interactHint!: Phaser.GameObjects.Text;
  private nearTarget: { type: 'building' | 'npc'; ref: string } | null = null;
  private villageState!: VillageState;
  private dialogueJustEnded = false;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(data?: { fromBuilding?: boolean; buildingRef?: string }) {
    // Generate village from mock catalog
    const members = getTeamMembers(platformTeam);
    const components = getTeamComponents(platformTeam);
    const apis = getTeamApis(platformTeam);
    this.villageState = generateVillage(platformTeam, components, apis, members);

    // Generate tile map
    const mapData = generateOverworldMapData(MAP_WIDTH, MAP_HEIGHT, this.villageState);

    const tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tsGrass = tilemap.addTilesetImage('grass', 'tile_grass', TILE_SIZE, TILE_SIZE, 0, 0, 0)!;
    const tsPath = tilemap.addTilesetImage('path', 'tile_path', TILE_SIZE, TILE_SIZE, 0, 0, 1)!;
    const tsWater = tilemap.addTilesetImage('water', 'tile_water', TILE_SIZE, TILE_SIZE, 0, 0, 2)!;
    const tsWall = tilemap.addTilesetImage('wall', 'tile_wall', TILE_SIZE, TILE_SIZE, 0, 0, 3)!;
    const tsTree = tilemap.addTilesetImage('tree', 'tile_tree', TILE_SIZE, TILE_SIZE, 0, 0, 4)!;

    const collisionLayer = tilemap.createLayer(0, [tsGrass, tsPath, tsWater, tsWall, tsTree], 0, 0)!;
    collisionLayer.setCollision([2, 4]);

    // Determine player spawn
    let spawnX = 60 * TILE_SIZE;
    let spawnY = 70 * TILE_SIZE;
    if (data?.fromBuilding && data.buildingRef) {
      const building = this.villageState.buildings.find(
        (b) => b.entityRef === data.buildingRef,
      );
      if (building) {
        spawnX = (building.position.x + 1.5) * TILE_SIZE;
        spawnY = (building.position.y + 4) * TILE_SIZE;
      }
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);
    this.physics.add.collider(this.player.sprite, collisionLayer);

    // Place buildings
    for (const building of this.villageState.buildings) {
      this.placeBuilding(building);
    }

    // Place NPCs
    this.npcs = [];
    for (const npcState of this.villageState.npcs) {
      this.placeNPC(npcState);
    }

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

    // Village name banner
    const nameText = this.add.text(
      60 * TILE_SIZE,
      5 * TILE_SIZE,
      this.villageState.teamName,
      {
        fontSize: '14px',
        color: '#ffe0a0',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      },
    );
    nameText.setOrigin(0.5, 0.5);
    nameText.setDepth(1000);
  }

  private placeBuilding(building: BuildingState) {
    const bx = building.position.x * TILE_SIZE;
    const by = building.position.y * TILE_SIZE;

    const sprite = this.add.image(
      bx + TILE_SIZE * 1.5,
      by + TILE_SIZE * 1.5,
      'building',
    );
    sprite.setDepth(by + TILE_SIZE * 3);

    // Building name label
    const label = this.add.text(
      bx + TILE_SIZE * 1.5,
      by - 2,
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

    // Entry zone in front of door
    const zone = this.add.zone(
      bx + TILE_SIZE * 1.5,
      by + TILE_SIZE * 3 + 4,
      TILE_SIZE * 2,
      TILE_SIZE,
    );
    this.physics.add.existing(zone, true);
    this.buildingZones.push({ zone, entityRef: building.entityRef });

    // Collision walls around building
    const wallDefs = [
      { x: bx, y: by, w: TILE_SIZE * 3, h: TILE_SIZE * 2.5 },
      { x: bx, y: by + TILE_SIZE * 2.5, w: TILE_SIZE * 1, h: TILE_SIZE * 0.5 },
      {
        x: bx + TILE_SIZE * 2,
        y: by + TILE_SIZE * 2.5,
        w: TILE_SIZE * 1,
        h: TILE_SIZE * 0.5,
      },
    ];
    for (const def of wallDefs) {
      const wallBody = this.add.zone(
        def.x + def.w / 2,
        def.y + def.h / 2,
        def.w,
        def.h,
      );
      this.physics.add.existing(wallBody, true);
      this.physics.add.collider(this.player.sprite, wallBody);
    }

    // Overlap for entry
    this.physics.add.overlap(this.player.sprite, zone, () => {
      this.nearTarget = { type: 'building', ref: building.entityRef };
    });
  }

  private placeNPC(npcState: {
    entityRef: string;
    name: string;
    position: { x: number; y: number };
    spriteIndex: number;
  }) {
    const px = npcState.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = npcState.position.y * TILE_SIZE + TILE_SIZE / 2;
    const textureKey = `npc_${npcState.spriteIndex % 6}`;

    const npc = new NPC(this, px, py, textureKey, npcState.entityRef, npcState.name);
    this.npcs.push(npc);

    // Collision so player can't walk through NPC
    this.physics.add.collider(this.player.sprite, npc.sprite);

    // Interaction zone (larger than sprite)
    const interactZone = this.add.zone(px, py, TILE_SIZE * 2.5, TILE_SIZE * 2.5);
    this.physics.add.existing(interactZone, true);
    this.physics.add.overlap(this.player.sprite, interactZone, () => {
      this.nearTarget = { type: 'npc', ref: npcState.entityRef };
    });
  }

  update(_time: number) {
    const store = useGameStore.getState();

    // If dialogue is active, freeze player
    if (store.dialogueActive) {
      this.player.sprite.setVelocity(0, 0);
      this.interactHint.setVisible(false);

      if (this.player.interactPressed()) {
        store.advanceDialogue();
        // Check if dialogue just ended
        if (!useGameStore.getState().dialogueActive) {
          this.dialogueJustEnded = true;
          // Show detail panel for the NPC
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

    // Update NPCs
    for (const npc of this.npcs) {
      npc.update(_time);
    }

    // Handle interaction
    if (this.nearTarget) {
      const hintText =
        this.nearTarget.type === 'npc' ? 'Press E to talk' : 'Press E to enter';
      this.interactHint.setText(hintText);
      this.interactHint.setPosition(
        this.player.sprite.x - 30,
        this.player.sprite.y - 20,
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

    // Make the NPC face the player
    const npc = this.npcs.find((n) => n.entityRef === ref);
    if (npc) {
      npc.facePlayer(this.player.sprite.x, this.player.sprite.y);
    }
  }

  private enterBuilding(ref: string) {
    useGameStore.getState().unlockEntity(ref);
    useGameStore.getState().setActiveBuilding(ref);
    this.scene.start('BuildingScene', { entityRef: ref });
  }
}
