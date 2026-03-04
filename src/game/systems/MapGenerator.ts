import {
  Entity,
  VillageState,
  BuildingState,
  NPCState,
  WorldState,
} from '../../data/types';
import {
  entityRef,
  getTeamMembers,
  getTeamComponents,
  getTeamApis,
} from '../../data/mock-catalog';

// Relative building offsets within a village footprint (~40x35 tiles)
const BUILDING_OFFSETS: { x: number; y: number }[] = [
  { x: 5,  y: 4 },
  { x: 18, y: 3 },
  { x: 32, y: 5 },
  { x: 4,  y: 16 },
  { x: 32, y: 18 },
  { x: 18, y: 24 },
];

// Relative NPC offsets within a village footprint (near buildings)
const NPC_OFFSETS: { x: number; y: number }[] = [
  { x: 10, y: 8 },
  { x: 24, y: 7 },
  { x: 28, y: 9 },
  { x: 9,  y: 20 },
  { x: 28, y: 22 },
];

// Village positions on the 200x160 overworld (top-left of ~40x35 footprint)
const VILLAGE_POSITIONS: { x: number; y: number }[] = [
  { x: 25,  y: 20 },  // northwest — Platform Team
  { x: 125, y: 18 },  // northeast — Payments Guild
  { x: 25,  y: 100 }, // southwest — Frontend Collective
  { x: 125, y: 102 }, // southeast — Data Forge
];

export function generateWorld(teams: Entity[]): WorldState {
  const villages: VillageState[] = [];

  teams.forEach((team, i) => {
    if (i >= VILLAGE_POSITIONS.length) return;
    const worldPos = VILLAGE_POSITIONS[i];
    const members = getTeamMembers(team);
    const components = getTeamComponents(team);
    const apis = getTeamApis(team);
    const village = generateVillage(team, components, apis, members, worldPos);
    villages.push(village);
  });

  return { villages };
}

export function generateVillage(
  team: Entity,
  components: Entity[],
  apis: Entity[],
  members: Entity[],
  worldPosition: { x: number; y: number },
): VillageState {
  const buildings: BuildingState[] = [];
  const npcs: NPCState[] = [];

  const allBuildingEntities: { entity: Entity; type: 'component' | 'api' }[] = [
    ...components.map((e) => ({ entity: e, type: 'component' as const })),
    ...apis.map((e) => ({ entity: e, type: 'api' as const })),
  ];

  allBuildingEntities.forEach((item, i) => {
    if (i >= BUILDING_OFFSETS.length) return;
    const offset = BUILDING_OFFSETS[i];
    buildings.push({
      entityRef: entityRef(item.entity),
      name: item.entity.metadata.name,
      position: { x: worldPosition.x + offset.x, y: worldPosition.y + offset.y },
      buildingType: item.type,
    });
  });

  members.forEach((member, i) => {
    if (i >= NPC_OFFSETS.length) return;
    const offset = NPC_OFFSETS[i];
    npcs.push({
      entityRef: entityRef(member),
      name: (member.spec.profile as { displayName?: string })?.displayName ?? member.metadata.name,
      position: { x: worldPosition.x + offset.x, y: worldPosition.y + offset.y },
      spriteIndex: i,
    });
  });

  return {
    teamRef: entityRef(team),
    teamName:
      (team.spec.profile as { displayName?: string })?.displayName ?? team.metadata.name,
    worldPosition,
    buildings,
    npcs,
  };
}

/**
 * Generate the overworld tile map for the entire world.
 * 0=grass, 1=path, 2=water, 4=tree
 */
export function generateWorldMapData(
  width: number,
  height: number,
  world: WorldState,
): number[][] {
  const map: number[][] = [];

  // Base terrain
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        row.push(2); // water border
      } else if (x <= 3 || x >= width - 4 || y <= 3 || y >= height - 4) {
        row.push(4); // tree border
      } else {
        row.push(0); // grass
      }
    }
    map.push(row);
  }

  // Main crossroads — horizontal and vertical through center
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);

  // Horizontal main road
  for (let x = 4; x < width - 4; x++) {
    map[centerY][x] = 1;
    map[centerY + 1][x] = 1;
  }

  // Vertical main road
  for (let y = 4; y < height - 4; y++) {
    map[y][centerX] = 1;
    map[y][centerX + 1] = 1;
  }

  // Connect each village to the crossroads
  for (const village of world.villages) {
    const vx = village.worldPosition.x;
    const vy = village.worldPosition.y;
    const villageCenterX = vx + 20;
    const villageCenterY = vy + 15;

    // Internal village paths — horizontal through village center
    for (let x = vx + 2; x < vx + 38 && x < width - 4; x++) {
      if (map[villageCenterY]) map[villageCenterY][x] = 1;
      if (map[villageCenterY + 1]) map[villageCenterY + 1][x] = 1;
    }

    // Vertical paths from buildings to village center path
    for (const building of village.buildings) {
      const bx = building.position.x + 1;
      const by = building.position.y + 3;
      const startY = Math.min(by, villageCenterY);
      const endY = Math.max(by, villageCenterY);
      for (let y = startY; y <= endY; y++) {
        if (map[y]) {
          map[y][bx] = 1;
          if (bx + 1 < width - 4) map[y][bx + 1] = 1;
        }
      }
    }

    // Path in front of each building door
    for (const building of village.buildings) {
      const bx = building.position.x;
      const by = building.position.y;
      if (map[by + 3]) {
        map[by + 3][bx + 1] = 1;
        map[by + 3][bx + 2] = 1;
      }
    }

    // Road from village center to the main crossroads
    // Horizontal leg to centerX
    const roadY = villageCenterY;
    const startX = Math.min(villageCenterX, centerX);
    const endX = Math.max(villageCenterX, centerX);
    for (let x = startX; x <= endX; x++) {
      if (map[roadY]) map[roadY][x] = 1;
      if (map[roadY + 1]) map[roadY + 1][x] = 1;
    }

    // Vertical leg to centerY
    const startYroad = Math.min(villageCenterY, centerY);
    const endYroad = Math.max(villageCenterY + 1, centerY + 1);
    for (let y = startYroad; y <= endYroad; y++) {
      if (map[y]) {
        map[y][centerX] = 1;
        map[y][centerX + 1] = 1;
      }
    }
  }

  // Scatter trees across wilderness (avoid paths, villages, borders)
  const treeSeeds = generateTreePositions(width, height, world);
  for (const pos of treeSeeds) {
    if (
      pos.x > 3 && pos.x < width - 4 &&
      pos.y > 3 && pos.y < height - 4 &&
      map[pos.y][pos.x] === 0
    ) {
      map[pos.y][pos.x] = 4;
    }
  }

  return map;
}

function generateTreePositions(
  width: number,
  height: number,
  world: WorldState,
): { x: number; y: number }[] {
  const trees: { x: number; y: number }[] = [];

  // Use a simple hash-based pseudo-random placement
  for (let i = 0; i < 200; i++) {
    const x = ((i * 137 + 59) % (width - 8)) + 4;
    const y = ((i * 211 + 43) % (height - 8)) + 4;

    // Skip if too close to any village center
    const tooClose = world.villages.some((v) => {
      const dx = x - (v.worldPosition.x + 20);
      const dy = y - (v.worldPosition.y + 15);
      return Math.abs(dx) < 22 && Math.abs(dy) < 18;
    });

    if (!tooClose) {
      trees.push({ x, y });
      // Sometimes add neighbor for grove effect
      if (i % 3 === 0) trees.push({ x: x + 1, y });
      if (i % 5 === 0) trees.push({ x, y: y + 1 });
    }
  }

  return trees;
}
