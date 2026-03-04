import {
  Entity,
  VillageState,
  BuildingState,
  NPCState,
} from '../../data/types';
import { entityRef } from '../../data/mock-catalog';

const VILLAGE_CENTER_Y = 22;

// Building placement positions (tile coords for top-left of 3x3 building)
// Spread across the 60x45 map for more adventuring between them
const BUILDING_SLOTS: { x: number; y: number }[] = [
  { x: 8,  y: 6 },   // auth-service — top-left
  { x: 28, y: 5 },   // user-api — top-center
  { x: 50, y: 7 },   // dashboard-ui — top-right
  { x: 6,  y: 26 },  // data-pipeline — mid-left
  { x: 48, y: 28 },  // user-rest-api — mid-right
  { x: 28, y: 36 },  // events-grpc-api — bottom-center
];

// NPC placement positions (near corresponding buildings)
const NPC_SLOTS: { x: number; y: number }[] = [
  { x: 13, y: 9 },   // near auth-service
  { x: 33, y: 8 },   // near user-api
  { x: 47, y: 11 },  // near dashboard-ui
  { x: 11, y: 30 },  // near data-pipeline
  { x: 45, y: 32 },  // near user-rest-api
];

export function generateVillage(
  team: Entity,
  components: Entity[],
  apis: Entity[],
  members: Entity[],
): VillageState {
  const buildings: BuildingState[] = [];
  const npcs: NPCState[] = [];

  // Place buildings for components
  const allBuildingEntities: { entity: Entity; type: 'component' | 'api' }[] = [
    ...components.map((e) => ({ entity: e, type: 'component' as const })),
    ...apis.map((e) => ({ entity: e, type: 'api' as const })),
  ];

  allBuildingEntities.forEach((item, i) => {
    if (i >= BUILDING_SLOTS.length) return;
    const slot = BUILDING_SLOTS[i];
    buildings.push({
      entityRef: entityRef(item.entity),
      name: item.entity.metadata.name,
      position: { x: slot.x, y: slot.y },
      buildingType: item.type,
    });
  });

  // Place NPCs for team members
  members.forEach((member, i) => {
    if (i >= NPC_SLOTS.length) return;
    const slot = NPC_SLOTS[i];
    npcs.push({
      entityRef: entityRef(member),
      name: (member.spec.profile as { displayName?: string })?.displayName ?? member.metadata.name,
      position: { x: slot.x, y: slot.y },
      spriteIndex: i,
    });
  });

  return {
    teamRef: entityRef(team),
    teamName:
      (team.spec.profile as { displayName?: string })?.displayName ?? team.metadata.name,
    buildings,
    npcs,
  };
}

/**
 * Generate the overworld tile map with village layout.
 * 0=grass, 1=path, 2=water, 4=tree
 * Buildings and NPCs are placed as sprites on top, not in the tilemap.
 */
export function generateOverworldMapData(
  width: number,
  height: number,
  village: VillageState,
): number[][] {
  const map: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // Border: water on edges
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(2);
      }
      // Second border: trees
      else if (x === 1 || x === width - 2 || y === 1 || y === height - 2) {
        row.push(4);
      } else {
        row.push(0); // grass by default
      }
    }
    map.push(row);
  }

  // Place paths connecting buildings to village center
  const cy = VILLAGE_CENTER_Y;

  // Main horizontal path
  for (let x = 2; x < width - 2; x++) {
    if (map[cy]) map[cy][x] = 1;
    if (map[cy + 1]) map[cy + 1][x] = 1;
  }

  // Vertical paths to each building
  for (const building of village.buildings) {
    const bx = building.position.x + 1; // center of 3-wide building
    const by = building.position.y + 3; // bottom of building

    // Path from building down (or up) to the main horizontal path
    const startY = Math.min(by, cy);
    const endY = Math.max(by, cy);
    for (let y = startY; y <= endY; y++) {
      if (map[y]) {
        map[y][bx] = 1;
        if (bx + 1 < width - 2) map[y][bx + 1] = 1;
      }
    }
  }

  // Clear grass under building footprints (they'll be covered by sprites)
  // And add path tiles in front of each building door
  for (const building of village.buildings) {
    const bx = building.position.x;
    const by = building.position.y;
    // Path in front of building door
    if (map[by + 3]) {
      map[by + 3][bx + 1] = 1;
      map[by + 3][bx + 2] = 1;
    }
  }

  // Scatter decorative trees across the larger map
  const treePositions = [
    { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 20, y: 4 }, { x: 21, y: 4 },
    { x: 40, y: 4 }, { x: 41, y: 4 }, { x: 55, y: 4 }, { x: 56, y: 4 },
    { x: 4, y: 14 }, { x: 5, y: 14 }, { x: 18, y: 15 }, { x: 38, y: 14 },
    { x: 55, y: 16 }, { x: 56, y: 16 },
    { x: 20, y: 18 }, { x: 42, y: 18 },
    { x: 4, y: 34 }, { x: 5, y: 34 }, { x: 22, y: 32 },
    { x: 38, y: 34 }, { x: 55, y: 36 }, { x: 56, y: 36 },
    { x: 4, y: 40 }, { x: 5, y: 40 }, { x: 20, y: 40 },
    { x: 40, y: 40 }, { x: 55, y: 40 }, { x: 56, y: 40 },
    { x: 16, y: 20 }, { x: 44, y: 20 },
  ];

  for (const pos of treePositions) {
    if (
      pos.x > 1 &&
      pos.x < width - 2 &&
      pos.y > 1 &&
      pos.y < height - 2 &&
      map[pos.y][pos.x] === 0 // only place on grass
    ) {
      map[pos.y][pos.x] = 4;
    }
  }

  return map;
}
