import { Entity } from '../../data/types';
import { entityRef, getEntityByRef, getApiOwnerTeam } from '../../data/mock-catalog';

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

  // Determine team name
  const teamRef = npcEntity.relations?.find((r) => r.type === 'memberOf')?.targetRef;
  const teamEntity = teamRef ? getEntityByRef(teamRef) : undefined;
  const teamName = teamEntity
    ? (teamEntity.spec.profile as { displayName?: string })?.displayName ?? teamEntity.metadata.name
    : 'this guild';

  // Greeting
  const greetings = [
    `Hail, traveler! I am ${displayName}, ${role} of the ${teamName}.`,
    `Well met! The name's ${displayName}. I serve as ${role} in the ${teamName}.`,
    `Greetings, wanderer. I'm ${displayName} — ${role} of the ${teamName}.`,
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

  // Cross-team API references
  const consumedApis =
    npcEntity.relations
      ?.filter((r) => r.type === 'ownerOf')
      .flatMap((r) => {
        const owned = getEntityByRef(r.targetRef);
        if (!owned) return [];
        return owned.relations?.filter((rel) => rel.type === 'consumesApi') ?? [];
      }) ?? [];

  for (const apiRel of consumedApis) {
    const ownerTeam = getApiOwnerTeam(apiRel.targetRef);
    if (ownerTeam && ownerTeam !== teamEntity) {
      const otherTeamName =
        (ownerTeam.spec.profile as { displayName?: string })?.displayName ?? ownerTeam.metadata.name;
      const apiEntity = getEntityByRef(apiRel.targetRef);
      const apiName = apiEntity?.metadata.name ?? 'their API';
      const crossLines = [
        `We depend on the ${otherTeamName}'s ${apiName} — reliable folk, they are.`,
        `Our work connects to the ${otherTeamName} village through their ${apiName}.`,
        `The ${otherTeamName} provides the ${apiName} that powers part of our craft.`,
      ];
      lines.push(crossLines[hashString(apiName) % crossLines.length]);
      break; // One cross-reference per NPC is enough
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

/**
 * Generates dialogue for an NPC inside a building, focused on the component they work on.
 */
export function generateBuildingNPCDialogue(npcEntity: Entity, componentEntity: Entity): string[] {
  const displayName =
    (npcEntity.spec.profile as { displayName?: string })?.displayName ??
    npcEntity.metadata.name;
  const compName = componentEntity.metadata.name;
  const description = componentEntity.metadata.description ?? '';
  const lifecycle = (componentEntity.spec.lifecycle as string) ?? 'active';
  const type = (componentEntity.spec.type as string) ?? 'service';

  const lines: string[] = [];

  // Greeting — building-specific
  const greetings = [
    `Welcome to the ${compName} workshop! I'm ${displayName}, and I look after things here.`,
    `Ah, a visitor! I'm ${displayName}. This is where the ${compName} is maintained.`,
    `You've found the ${compName} quarters. I'm ${displayName} — let me tell you about this place.`,
  ];
  lines.push(greetings[hashString(displayName + compName) % greetings.length]);

  // Component description
  if (description) {
    lines.push(rpgFlavor(description));
  }

  // Type and lifecycle flavor
  const lifecycleText =
    lifecycle === 'production'
      ? 'It has proven itself in many battles — stable and trusted.'
      : lifecycle === 'experimental'
        ? 'It\'s still young — we\'re forging it in the fires of experimentation.'
        : 'We\'re actively shaping it into something greater.';
  lines.push(`This ${type} is ${lifecycle}. ${lifecycleText}`);

  // Tags
  const tags = componentEntity.metadata.tags ?? [];
  if (tags.length > 0) {
    lines.push(`We work with the arts of ${tags.join(', ')} here.`);
  }

  // Closing
  lines.push('Feel free to look around, and press Q if you want the full details!');

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
