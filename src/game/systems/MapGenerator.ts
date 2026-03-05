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
} from '../../data/catalog-provider';

// Tile indices — must match BootScene generation order
export const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  WALL: 3,
  TREE: 4,
  FLOOR: 5,
  DOOR: 6,
  ROCK: 7,
  SWAMP: 8,
  SAND: 9,
  DENSE_TREE: 10,
  FLOWER: 11,
} as const;

// Relative building offsets within a village footprint (~45x40 tiles)
const BUILDING_OFFSETS: { x: number; y: number }[] = [
  { x: 5, y: 5 },
  { x: 20, y: 3 },
  { x: 35, y: 6 },
  { x: 4, y: 18 },
  { x: 35, y: 20 },
  { x: 20, y: 28 },
];

// Relative NPC offsets within a village footprint
const NPC_OFFSETS: { x: number; y: number }[] = [
  { x: 12, y: 9 },
  { x: 26, y: 8 },
  { x: 30, y: 11 },
  { x: 10, y: 22 },
  { x: 30, y: 25 },
];

// 6 village positions on the 240x200 overworld
export const VILLAGE_POSITIONS: { x: number; y: number }[] = [
  { x: 20, y: 20 },   // NW — Platform Team
  { x: 140, y: 16 },   // NE — Payments Guild
  { x: 20, y: 100 },   // W — Frontend Collective
  { x: 140, y: 105 },  // E — Data Forge
  { x: 80, y: 150 },   // S — Security Order
  { x: 80, y: 50 },    // Center-N — SRE Wardens
];

// Biome assignments for each village (affects surrounding terrain)
export type BiomeType = 'forest' | 'plains' | 'swamp' | 'desert' | 'rocky' | 'meadow';
export const VILLAGE_BIOMES: BiomeType[] = [
  'forest',   // Platform Team — deep forest
  'rocky',    // Payments Guild — rocky highlands
  'swamp',    // Frontend Collective — misty swamp
  'desert',   // Data Forge — arid desert
  'meadow',   // Security Order — flower meadow
  'plains',   // SRE Wardens — open plains
];

export const MAP_WIDTH = 240;
export const MAP_HEIGHT = 200;

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
      componentType: (item.entity.spec.type as string) ?? 'service',
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
 * Generate the overworld tile map with biomes and meandering roads.
 * Tile indices: 0=grass, 1=path, 2=water, 4=tree, 7=rock, 8=swamp, 9=sand, 10=dense_tree, 11=flower
 */
export function generateWorldMapData(
  width: number,
  height: number,
  world: WorldState,
): number[][] {
  const map: number[][] = [];

  // Base terrain — all grass
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        row.push(TILE.WATER);
      } else if (x <= 3 || x >= width - 4 || y <= 3 || y >= height - 4) {
        row.push(TILE.TREE);
      } else {
        row.push(TILE.GRASS);
      }
    }
    map.push(row);
  }

  // Paint biome terrain around each village
  world.villages.forEach((village, i) => {
    const biome = VILLAGE_BIOMES[i] ?? 'plains';
    paintBiome(map, width, height, village.worldPosition, biome);
  });

  // Add scattered biome transitions between villages
  paintWildernessDetails(map, width, height, world);

  // Meandering roads connecting villages
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Connect all villages to a central hub point
  for (const village of world.villages) {
    const vcx = village.worldPosition.x + 22;
    const vcy = village.worldPosition.y + 18;
    drawMeanderingPath(map, width, height, vcx, vcy, centerX, centerY);
  }

  // Internal village paths
  for (const village of world.villages) {
    const vx = village.worldPosition.x;
    const vy = village.worldPosition.y;
    const villageCenterY = vy + 18;

    // Horizontal through village
    for (let x = vx + 2; x < vx + 43 && x < width - 4; x++) {
      if (map[villageCenterY]) map[villageCenterY][x] = TILE.PATH;
      if (map[villageCenterY + 1]) map[villageCenterY + 1][x] = TILE.PATH;
    }

    // Paths from each building to village center
    for (const building of village.buildings) {
      const bx = building.position.x + 1;
      const by = building.position.y + 3;
      const startY = Math.min(by, villageCenterY);
      const endY = Math.max(by, villageCenterY);
      for (let y = startY; y <= endY; y++) {
        if (map[y]) {
          map[y][bx] = TILE.PATH;
          if (bx + 1 < width - 4) map[y][bx + 1] = TILE.PATH;
        }
      }
    }

    // Door paths
    for (const building of village.buildings) {
      const bx = building.position.x;
      const by = building.position.y;
      if (map[by + 3]) {
        map[by + 3][bx + 1] = TILE.PATH;
        map[by + 3][bx + 2] = TILE.PATH;
      }
    }
  }

  // Water features — rivers and ponds
  drawRiver(map, width, height);
  drawPonds(map, width, height, world);

  // Scatter trees across wilderness
  const treeSeeds = generateTreePositions(width, height, world);
  for (const pos of treeSeeds) {
    if (
      pos.x > 3 && pos.x < width - 4 &&
      pos.y > 3 && pos.y < height - 4 &&
      map[pos.y][pos.x] === TILE.GRASS
    ) {
      map[pos.y][pos.x] = TILE.TREE;
    }
  }

  return map;
}

function paintBiome(
  map: number[][],
  width: number,
  height: number,
  pos: { x: number; y: number },
  biome: BiomeType,
) {
  const cx = pos.x + 22;
  const cy = pos.y + 18;
  const radius = 28;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) continue;
      if (map[y][x] !== TILE.GRASS) continue;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      // Pseudo-random based on position
      const h = pseudoHash(x * 1000 + y);
      const edgeFade = dist / radius; // 0 at center, 1 at edge

      switch (biome) {
        case 'forest':
          if (h % 5 === 0 && edgeFade < 0.8) map[y][x] = TILE.DENSE_TREE;
          else if (h % 7 === 0 && edgeFade < 0.6) map[y][x] = TILE.TREE;
          break;
        case 'rocky':
          if (h % 6 === 0 && edgeFade < 0.7) map[y][x] = TILE.ROCK;
          else if (h % 11 === 0) map[y][x] = TILE.SAND;
          break;
        case 'swamp':
          if (h % 4 === 0 && edgeFade < 0.7) map[y][x] = TILE.SWAMP;
          else if (h % 9 === 0 && edgeFade < 0.5) map[y][x] = TILE.TREE;
          break;
        case 'desert':
          if (edgeFade < 0.7) map[y][x] = TILE.SAND;
          else if (h % 3 === 0 && edgeFade < 0.9) map[y][x] = TILE.SAND;
          if (h % 12 === 0 && edgeFade < 0.5) map[y][x] = TILE.ROCK;
          break;
        case 'meadow':
          if (h % 5 === 0 && edgeFade < 0.7) map[y][x] = TILE.FLOWER;
          break;
        case 'plains':
          // Mostly grass with occasional flowers
          if (h % 10 === 0 && edgeFade < 0.5) map[y][x] = TILE.FLOWER;
          break;
      }
    }
  }

  // Clear a walkable area right around buildings (village core)
  for (let dy = -2; dy <= 38; dy++) {
    for (let dx = -2; dx <= 47; dx++) {
      const x = pos.x + dx;
      const y = pos.y + dy;
      if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) continue;
      const tile = map[y][x];
      // Only clear blocking tiles inside village core
      if (tile === TILE.DENSE_TREE || tile === TILE.ROCK || tile === TILE.SWAMP) {
        map[y][x] = TILE.GRASS;
      }
    }
  }
}

function paintWildernessDetails(
  map: number[][],
  width: number,
  height: number,
  world: WorldState,
) {
  // Scatter small rock clusters, flower patches, etc. in wilderness
  for (let i = 0; i < 80; i++) {
    const x = ((i * 179 + 67) % (width - 10)) + 5;
    const y = ((i * 223 + 89) % (height - 10)) + 5;

    // Skip if near a village
    const nearVillage = world.villages.some((v) => {
      const dx = x - (v.worldPosition.x + 22);
      const dy = y - (v.worldPosition.y + 18);
      return Math.abs(dx) < 26 && Math.abs(dy) < 22;
    });
    if (nearVillage) continue;

    if (map[y][x] !== TILE.GRASS) continue;

    const h = pseudoHash(x * 1000 + y);
    if (h % 4 === 0) {
      // Small rock cluster
      map[y][x] = TILE.ROCK;
      if (x + 1 < width - 4 && map[y][x + 1] === TILE.GRASS) map[y][x + 1] = TILE.ROCK;
    } else if (h % 4 === 1) {
      // Flower patch
      map[y][x] = TILE.FLOWER;
    }
  }
}

function drawMeanderingPath(
  map: number[][],
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  // Walk from (x1,y1) to (x2,y2) with random wobble
  let cx = x1;
  let cy = y1;
  let step = 0;

  while (Math.abs(cx - x2) > 1 || Math.abs(cy - y2) > 1) {
    // Paint 2-wide path
    for (let d = 0; d < 2; d++) {
      const px = cx;
      const py = cy + d;
      if (px >= 4 && px < width - 4 && py >= 4 && py < height - 4) {
        map[py][px] = TILE.PATH;
      }
      if (px + 1 < width - 4 && py >= 4 && py < height - 4) {
        map[py][px + 1] = TILE.PATH;
      }
    }

    // Move towards target with wobble
    const dx = x2 - cx;
    const dy = y2 - cy;
    const wobble = pseudoHash(cx + cy * width + step) % 7;
    step++;

    if (wobble < 2 && Math.abs(dy) > 2) {
      // Move vertically
      cy += dy > 0 ? 1 : -1;
    } else if (wobble < 4 && Math.abs(dx) > 2) {
      // Move horizontally
      cx += dx > 0 ? 1 : -1;
    } else {
      // Default: move in the dominant direction
      if (Math.abs(dx) > Math.abs(dy)) {
        cx += dx > 0 ? 1 : -1;
      } else {
        cy += dy > 0 ? 1 : -1;
      }
    }

    // Safety limit
    if (step > width + height + 200) break;
  }
}

function drawRiver(map: number[][], width: number, height: number) {
  // A winding river from top to bottom, offset to the right
  let rx = Math.floor(width * 0.7);
  for (let y = 4; y < height - 4; y++) {
    const wobble = pseudoHash(y * 13 + 77);
    if (wobble % 5 === 0) rx += 1;
    else if (wobble % 5 === 1) rx -= 1;
    rx = Math.max(4, Math.min(width - 6, rx));

    // Skip if inside a village
    const blocked = VILLAGE_POSITIONS.some((vp) => {
      return rx >= vp.x - 2 && rx <= vp.x + 50 && y >= vp.y - 2 && y <= vp.y + 42;
    });
    if (blocked) continue;

    for (let d = 0; d < 3; d++) {
      if (rx + d < width - 4 && map[y][rx + d] !== TILE.PATH) {
        map[y][rx + d] = TILE.WATER;
      }
    }
  }

  // Bridge over paths (where river crosses a path)
  for (let y = 4; y < height - 4; y++) {
    for (let x = 4; x < width - 4; x++) {
      if (map[y][x] === TILE.WATER) {
        // Check if adjacent to a path
        const hasPath =
          (x > 0 && map[y][x - 1] === TILE.PATH) ||
          (x < width - 1 && map[y][x + 1] === TILE.PATH);
        if (hasPath) {
          map[y][x] = TILE.PATH; // bridge
        }
      }
    }
  }
}

function drawPonds(
  map: number[][],
  width: number,
  height: number,
  world: WorldState,
) {
  // Small ponds in wilderness
  const pondPositions = [
    { x: 45, y: 75 },
    { x: 190, y: 85 },
    { x: 110, y: 170 },
  ];

  for (const pond of pondPositions) {
    const nearVillage = world.villages.some((v) => {
      const dx = pond.x - (v.worldPosition.x + 22);
      const dy = pond.y - (v.worldPosition.y + 18);
      return Math.abs(dx) < 26 && Math.abs(dy) < 22;
    });
    if (nearVillage) continue;

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = pond.x + dx;
        const y = pond.y + dy;
        if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) continue;
        const dist = Math.sqrt(dx * dx * 0.6 + dy * dy);
        if (dist < 3.5 && map[y][x] !== TILE.PATH) {
          map[y][x] = TILE.WATER;
        }
      }
    }
  }
}

function generateTreePositions(
  width: number,
  height: number,
  world: WorldState,
): { x: number; y: number }[] {
  const trees: { x: number; y: number }[] = [];

  for (let i = 0; i < 350; i++) {
    const x = ((i * 137 + 59) % (width - 8)) + 4;
    const y = ((i * 211 + 43) % (height - 8)) + 4;

    const tooClose = world.villages.some((v) => {
      const dx = x - (v.worldPosition.x + 22);
      const dy = y - (v.worldPosition.y + 18);
      return Math.abs(dx) < 24 && Math.abs(dy) < 20;
    });

    if (!tooClose) {
      trees.push({ x, y });
      if (i % 3 === 0) trees.push({ x: x + 1, y });
      if (i % 5 === 0) trees.push({ x, y: y + 1 });
    }
  }

  return trees;
}

function pseudoHash(n: number): number {
  let h = n;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return Math.abs(h);
}
