import { useGameStore } from '../../store/gameStore';

export function unlockEntity(ref: string): void {
  useGameStore.getState().unlockEntity(ref);
}

export function isUnlocked(ref: string): boolean {
  return useGameStore.getState().unlockedEntities.includes(ref);
}
