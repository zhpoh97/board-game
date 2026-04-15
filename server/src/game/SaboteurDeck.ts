import {
  SaboteurCard, SaboteurPathCard, SaboteurBreakCard, SaboteurRepairCard,
  SaboteurRockfallCard, SaboteurMapCard, SaboteurCardKind, Tool,
  PATH_TEMPLATES, PATH_CARD_COUNTS, ACTION_CARD_COUNTS,
} from '@cockroach-poker/shared';

let nextId = 0;
function makeId(): string {
  return `sab_${nextId++}`;
}

export function buildSaboteurDeck(): SaboteurCard[] {
  const cards: SaboteurCard[] = [];
  nextId = 0;

  // Path cards
  for (const [templateId, count] of Object.entries(PATH_CARD_COUNTS)) {
    const template = PATH_TEMPLATES[templateId];
    if (!template) continue;
    for (let i = 0; i < count; i++) {
      const card: SaboteurPathCard = {
        id: makeId(),
        kind: SaboteurCardKind.PATH,
        templateId,
        openings: { ...template.openings },
        connectedGroups: template.connectedGroups.map(g => [...g]),
      };
      cards.push(card);
    }
  }

  // Break cards
  const breakTools: [string, Tool][] = [
    ['break_pickaxe', Tool.PICKAXE],
    ['break_lantern', Tool.LANTERN],
    ['break_cart', Tool.CART],
  ];
  for (const [key, tool] of breakTools) {
    const count = ACTION_CARD_COUNTS[key as keyof typeof ACTION_CARD_COUNTS];
    for (let i = 0; i < count; i++) {
      const card: SaboteurBreakCard = {
        id: makeId(),
        kind: SaboteurCardKind.BREAK,
        tool,
      };
      cards.push(card);
    }
  }

  // Repair cards (single tool)
  const repairSingle: [string, Tool][] = [
    ['repair_pickaxe', Tool.PICKAXE],
    ['repair_lantern', Tool.LANTERN],
    ['repair_cart', Tool.CART],
  ];
  for (const [key, tool] of repairSingle) {
    const count = ACTION_CARD_COUNTS[key as keyof typeof ACTION_CARD_COUNTS];
    for (let i = 0; i < count; i++) {
      const card: SaboteurRepairCard = {
        id: makeId(),
        kind: SaboteurCardKind.REPAIR,
        tools: [tool],
      };
      cards.push(card);
    }
  }

  // Repair cards (dual tool)
  const repairDual: [string, Tool, Tool][] = [
    ['repair_pickaxe_lantern', Tool.PICKAXE, Tool.LANTERN],
    ['repair_pickaxe_cart', Tool.PICKAXE, Tool.CART],
    ['repair_lantern_cart', Tool.LANTERN, Tool.CART],
  ];
  for (const [key, tool1, tool2] of repairDual) {
    const count = ACTION_CARD_COUNTS[key as keyof typeof ACTION_CARD_COUNTS];
    for (let i = 0; i < count; i++) {
      const card: SaboteurRepairCard = {
        id: makeId(),
        kind: SaboteurCardKind.REPAIR,
        tools: [tool1, tool2],
      };
      cards.push(card);
    }
  }

  // Rockfall
  for (let i = 0; i < ACTION_CARD_COUNTS.rockfall; i++) {
    const card: SaboteurRockfallCard = {
      id: makeId(),
      kind: SaboteurCardKind.ROCKFALL,
    };
    cards.push(card);
  }

  // Map
  for (let i = 0; i < ACTION_CARD_COUNTS.map; i++) {
    const card: SaboteurMapCard = {
      id: makeId(),
      kind: SaboteurCardKind.MAP,
    };
    cards.push(card);
  }

  return cards;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
