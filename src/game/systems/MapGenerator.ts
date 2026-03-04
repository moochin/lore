import {
  Entity,
  VillageState,
  BuildingState,
  NPCState,
} from '../../data/types';
import { entityRef } from '../../data/mock-catalog';

const VILLAGE_CENTER_Y = 45;

// Building placement positions (tile coords for top-left of 3x3 building)
// Spread across the 120x90 map for a real adventure between them
const BUILDING_SLOTS: { x: number; y: number }[] = [
  { x: 15,  y: 12 },  // auth-service — top-left
  { x: 55,  y: 10 },  // user-api — top-center
  { x: 95,  y: 14 },  // dashboard-ui — top-right
  { x: 12,  y: 55 },  // data-pipeline — mid-left
  { x: 100, y: 58 },  // user-rest-api — mid-right
  { x: 55,  y: 72 },  // events-grpc-api — bottom-center
];

// NPC placement positions (near corresponding buildings)
const NPC_SLOTS: { x: number; y: number }[] = [
  { x: 22, y: 16 },   // near auth-service
  { x: 62, y: 14 },   // near user-api
  { x: 88, y: 18 },   // near dashboard-ui
  { x: 18, y: 59 },   // near data-pipeline
  { x: 94, y: 62 },   // near user-rest-api
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
      // Border: water on edges (2 tiles thick)
      if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        row.push(2);
      }
      // Tree border (2 tiles thick)
      else if (x <= 3 || x >= width - 4 || y <= 3 || y >= height - 4) {
        row.push(4);
      } else {
        row.push(0); // grass by default
      }
    }
    map.push(row);
  }

  // Place paths connecting buildings to village center
  const cy = VILLAGE_CENTER_Y;

  // Main horizontal path (2 tiles wide)
  for (let x = 4; x < width - 4; x++) {
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
        if (bx + 1 < width - 4) map[y][bx + 1] = 1;
      }
    }
  }

  // Add path tiles in front of each building door
  for (const building of village.buildings) {
    const bx = building.position.x;
    const by = building.position.y;
    if (map[by + 3]) {
      map[by + 3][bx + 1] = 1;
      map[by + 3][bx + 2] = 1;
    }
  }

  // Scatter decorative trees across the larger map
  const treePositions: { x: number; y: number }[] = [];

  // Groves in the corners and edges
  const groveSeeds = [
    { cx: 10, cy: 8 }, { cx: 30, cy: 7 }, { cx: 75, cy: 8 }, { cx: 110, cy: 10 },
    { cx: 8, cy: 25 }, { cx: 40, cy: 22 }, { cx: 80, cy: 24 }, { cx: 112, cy: 26 },
    { cx: 10, cy: 38 }, { cx: 70, cy: 36 }, { cx: 105, cy: 40 },
    { cx: 25, cy: 52 }, { cx: 85, cy: 50 }, { cx: 110, cy: 52 },
    { cx: 8, cy: 65 }, { cx: 45, cy: 62 }, { cx: 75, cy: 65 }, { cx: 112, cy: 68 },
    { cx: 15, cy: 78 }, { cx: 50, cy: 80 }, { cx: 90, cy: 78 }, { cx: 105, cy: 82 },
    { cx: 30, cy: 32 }, { cx: 65, cy: 55 }, { cx: 35, cy: 68 }, { cx: 80, cy: 72 },
  ];

  // Each grove is a small cluster of 2-4 trees
  for (const seed of groveSeeds) {
    treePositions.push({ x: seed.cx, y: seed.cy });
    treePositions.push({ x: seed.cx + 1, y: seed.cy });
    treePositions.push({ x: seed.cx, y: seed.cy + 1 });
  }

  // Individual scattered trees for variety
  const scatteredTrees = [
    { x: 20, y: 18 }, { x: 45, y: 15 }, { x: 68, y: 12 }, { x: 85, y: 20 },
    { x: 35, y: 28 }, { x: 60, y: 30 }, { x: 95, y: 32 },
    { x: 22, y: 42 }, { x: 50, y: 48 }, { x: 78, y: 42 },
    { x: 30, y: 58 }, { x: 65, y: 60 }, { x: 88, y: 55 },
    { x: 42, y: 70 }, { x: 70, y: 75 }, { x: 100, y: 70 },
    { x: 38, y: 82 }, { x: 62, y: 84 }, { x: 82, y: 82 },
  ];
  treePositions.push(...scatteredTrees);

  for (const pos of treePositions) {
    if (
      pos.x > 3 &&
      pos.x < width - 4 &&
      pos.y > 3 &&
      pos.y < height - 4 &&
      map[pos.y][pos.x] === 0 // only place on grass
    ) {
      map[pos.y][pos.x] = 4;
    }
  }

  return map;
}
