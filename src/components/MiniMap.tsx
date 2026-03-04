import { useGameStore } from '../store/gameStore';
import { getAllTeams, entityRef } from '../data/mock-catalog';
import { VILLAGE_POSITIONS, MAP_WIDTH, MAP_HEIGHT } from '../game/systems/MapGenerator';

const MINI_W = 192;
const MINI_H = 160;

export function MiniMap() {
  const miniMapVisible = useGameStore((s) => s.miniMapVisible);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const discoveredVillages = useGameStore((s) => s.discoveredVillages);
  const currentScene = useGameStore((s) => s.currentScene);

  if (!miniMapVisible || currentScene !== 'OverworldScene') return null;

  const teams = getAllTeams();
  const tileSize = 16;
  const scaleX = MINI_W / (MAP_WIDTH * tileSize);
  const scaleY = MINI_H / (MAP_HEIGHT * tileSize);
  const playerX = playerPosition.x * scaleX;
  const playerY = playerPosition.y * scaleY;

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      width: MINI_W,
      height: MINI_H,
      backgroundColor: '#1a3a1a',
      border: '2px solid #8b7355',
      borderRadius: 4,
      overflow: 'hidden',
      zIndex: 900,
      fontFamily: 'monospace',
    }}>
      {/* Village dots */}
      {teams.map((team, i) => {
        if (i >= VILLAGE_POSITIONS.length) return null;
        const pos = VILLAGE_POSITIONS[i];
        const ref = entityRef(team);
        const discovered = discoveredVillages.includes(ref);
        const displayName = (team.spec.profile as { displayName?: string })?.displayName ?? team.metadata.name;
        const dotX = ((pos.x + 22) * tileSize) * scaleX;
        const dotY = ((pos.y + 18) * tileSize) * scaleY;

        return (
          <div key={ref}>
            {/* Dot */}
            <div style={{
              position: 'absolute',
              left: dotX - 4,
              top: dotY - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: discovered ? '#ffd700' : '#555555',
              border: `1px solid ${discovered ? '#ffaa00' : '#333333'}`,
            }} />
            {/* Label */}
            {discovered && (
              <div style={{
                position: 'absolute',
                left: dotX + 6,
                top: dotY - 6,
                fontSize: 7,
                color: '#ffe0a0',
                whiteSpace: 'nowrap',
                textShadow: '1px 1px 0 #000',
              }}>
                {displayName}
              </div>
            )}
          </div>
        );
      })}

      {/* Player dot */}
      <div style={{
        position: 'absolute',
        left: playerX - 3,
        top: playerY - 3,
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '1px solid #3355aa',
        boxShadow: '0 0 4px #3355aa',
      }} />

      {/* "M" toggle hint */}
      <div style={{
        position: 'absolute',
        bottom: 2,
        right: 4,
        fontSize: 7,
        color: '#666',
      }}>
        M - toggle
      </div>
    </div>
  );
}
