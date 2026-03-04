import {
  Entity,
  VillageState,
  BuildingState,
  NPCState,
} from '../../data/types';
import { entityRef } from '../../data/mock-catalog';

const VILLAGE_CENTER_Y = 14;

// Building placement positions (tile coords for top-left of 3x3 building)
// Arranged in a semicircle around the village center
const BUILDING_SLOTS: { x: number; y: number }[] = [
  { x: 10, y: 6 },
  { x: 18, y: 4 },
  { x: 26, y: 6 },
  { x: 8, y: 14 },
  { x: 28, y: 14 },
  { x: 14, y: 20 },
];

// NPC placement positions (near corresponding buildings or along paths)
const NPC_SLOTS: { x: number; y: number }[] = [
  { x: 14, y: 9 },
  { x: 22, y: 7 },
  { x: 30, y: 9 },
  { x: 12, y: 17 },
  { x: 32, y: 17 },
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

  // Scatter some decorative trees (avoiding buildings, npcs, and paths)
  const treePositions = [
    { x: 4, y: 4 }, { x: 5, y: 4 },
    { x: 35, y: 4 }, { x: 36, y: 4 },
    { x: 4, y: 24 }, { x: 5, y: 24 },
    { x: 35, y: 24 }, { x: 36, y: 24 },
    { x: 16, y: 10 }, { x: 24, y: 10 },
    { x: 6, y: 18 }, { x: 34, y: 18 },
    { x: 20, y: 22 }, { x: 22, y: 22 },
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
