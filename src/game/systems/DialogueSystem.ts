import { Entity } from '../../data/types';
import { entityRef, getEntityByRef } from '../../data/mock-catalog';

/**
 * Generates RPG-flavored dialogue lines for an NPC based on their entity data.
 */
export function generateNPCDialogue(npcEntity: Entity): string[] {
  const displayName =
    (npcEntity.spec.profile as { displayName?: string })?.displayName ??
    npcEntity.metadata.name;
  const role = (npcEntity.spec.role as string) ?? 'adventurer';
  const description = npcEntity.metadata.description ?? '';

  const lines: string[] = [];

  // Greeting
  const greetings = [
    `Hail, traveler! I am ${displayName}, ${role} of the Platform Guild.`,
    `Well met! The name's ${displayName}. I serve as ${role} here.`,
    `Greetings, wanderer. I'm ${displayName} — ${role} by trade.`,
  ];
  lines.push(greetings[hashString(displayName) % greetings.length]);

  // Description / role flavor
  if (description) {
    lines.push(rpgFlavor(description));
  }

  // Talk about owned components
  const ownedRefs =
    npcEntity.relations?.filter((r) => r.type === 'ownerOf') ?? [];
  for (const rel of ownedRefs) {
    const owned = getEntityByRef(rel.targetRef);
    if (!owned) continue;

    if (owned.kind === 'Component') {
      const lifecycle = (owned.spec.lifecycle as string) ?? 'active';
      const lifecycleText =
        lifecycle === 'production'
          ? 'battle-tested and reliable'
          : lifecycle === 'experimental'
            ? 'still being forged in the fires of experimentation'
            : 'in active development';
      lines.push(
        `I tend to the ${owned.metadata.name} — it is ${lifecycleText}.`,
      );
    } else if (owned.kind === 'API') {
      const apiType = (owned.spec.type as string) ?? 'unknown';
      lines.push(
        `I guard the ancient scrolls of the ${owned.metadata.name} (${apiType}). Seek them within its halls.`,
      );
    }
  }

  // Closing
  const closings = [
    'May your deploys be swift and your logs be clear!',
    'Safe travels through the service mesh, friend.',
    'Return anytime — my door is always open.',
    'Go forth, and may your pipelines never fail!',
  ];
  lines.push(closings[hashString(entityRef(npcEntity)) % closings.length]);

  return lines;
}

/**
 * Generates info lines for a building interior based on its entity data.
 */
export function generateBuildingInfo(entity: Entity): string[] {
  const lines: string[] = [];
  const name = entity.metadata.name;
  const description = entity.metadata.description ?? 'No description available.';
  const tags = entity.metadata.tags ?? [];
  const lifecycle = (entity.spec.lifecycle as string) ?? 'unknown';
  const type = (entity.spec.type as string) ?? entity.kind.toLowerCase();

  lines.push(`=== ${name} ===`);
  lines.push(`Type: ${type} | Lifecycle: ${lifecycle}`);
  lines.push('');
  lines.push(description);

  if (tags.length > 0) {
    lines.push('');
    lines.push(`Tags: ${tags.join(', ')}`);
  }

  // Relations
  const consumed =
    entity.relations?.filter((r) => r.type === 'consumesApi') ?? [];
  const provided =
    entity.relations?.filter((r) => r.type === 'providesApi') ?? [];

  if (provided.length > 0) {
    lines.push('');
    lines.push('Provides:');
    for (const r of provided) {
      const api = getEntityByRef(r.targetRef);
      lines.push(`  • ${api?.metadata.name ?? r.targetRef}`);
    }
  }

  if (consumed.length > 0) {
    lines.push('');
    lines.push('Consumes:');
    for (const r of consumed) {
      const api = getEntityByRef(r.targetRef);
      lines.push(`  • ${api?.metadata.name ?? r.targetRef}`);
    }
  }

  return lines;
}

function rpgFlavor(text: string): string {
  return text
    .replace(/builds and maintains/gi, 'forges and guards')
    .replace(/infrastructure/gi, 'the realm\'s foundations')
    .replace(/specializes in/gi, 'has mastered the art of')
    .replace(/focused on/gi, 'devoted to the craft of')
    .replace(/engineer/gi, 'artisan')
    .replace(/designed/gi, 'crafted');
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
