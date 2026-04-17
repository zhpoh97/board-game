import { SaboteurCard, SaboteurCardKind, Tool, Direction } from '@cockroach-poker/shared';

const TOOL_EMOJI: Record<Tool, string> = {
  [Tool.PICKAXE]: '\u26CF\uFE0F',
  [Tool.LANTERN]: '\u{1F4A1}',
  [Tool.CART]: '\u{1F6D2}',
};

export const CARD_INFO: Record<string, string> = {
  [SaboteurCardKind.BREAK]: 'Break a player\'s tool. They can\'t place path cards while any tool is broken.',
  [SaboteurCardKind.REPAIR]: 'Fix a player\'s broken tool so they can place path cards again.',
  [SaboteurCardKind.ROCKFALL]: 'Destroy a path card on the board (except the start card).',
  [SaboteurCardKind.MAP]: 'Secretly peek at one goal card to see if it has gold or stone.',
  [SaboteurCardKind.PATH]: 'Place this tunnel card on the board to extend the mine path.',
};

interface SabCardProps {
  card: SaboteurCard;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}

export default function SaboteurCardComponent({ card, selected, onClick, small }: SabCardProps) {
  const sizeClass = small ? 'sab-card-small' : 'sab-card';

  if (card.kind === SaboteurCardKind.PATH) {
    return (
      <div
        className={`${sizeClass} sab-card-path ${selected ? 'sab-card-selected' : ''}`}
        onClick={onClick}
      >
        <PathPreview
          openings={card.openings}
          connectedGroups={card.connectedGroups}
          small={small}
        />
      </div>
    );
  }

  if (card.kind === SaboteurCardKind.BREAK) {
    return (
      <div className={`${sizeClass} sab-card-action sab-card-break ${selected ? 'sab-card-selected' : ''}`} onClick={onClick}>
        <span className="sab-card-icon">{TOOL_EMOJI[card.tool]}</span>
        <span className="sab-card-label">Break</span>
      </div>
    );
  }

  if (card.kind === SaboteurCardKind.REPAIR) {
    return (
      <div className={`${sizeClass} sab-card-action sab-card-repair ${selected ? 'sab-card-selected' : ''}`} onClick={onClick}>
        <span className="sab-card-icon">{card.tools.map(t => TOOL_EMOJI[t]).join('')}</span>
        <span className="sab-card-label">Repair</span>
      </div>
    );
  }

  if (card.kind === SaboteurCardKind.ROCKFALL) {
    return (
      <div className={`${sizeClass} sab-card-action sab-card-rockfall ${selected ? 'sab-card-selected' : ''}`} onClick={onClick}>
        <span className="sab-card-icon">{'\u{1FAA8}'}</span>
        <span className="sab-card-label">Rockfall</span>
      </div>
    );
  }

  if (card.kind === SaboteurCardKind.MAP) {
    return (
      <div className={`${sizeClass} sab-card-action sab-card-map ${selected ? 'sab-card-selected' : ''}`} onClick={onClick}>
        <span className="sab-card-icon">{'\u{1F5FA}\uFE0F'}</span>
        <span className="sab-card-label">Map</span>
      </div>
    );
  }

  return null;
}

/** Renders a mini SVG preview of the tunnel paths on a card */
function PathPreview({ openings, connectedGroups, small }: {
  openings: Record<Direction, boolean>;
  connectedGroups: Direction[][];
  small?: boolean;
}) {
  const size = small ? 36 : 64;
  const mid = size / 2;
  const edgeMid: Record<Direction, [number, number]> = {
    [Direction.TOP]: [mid, 0],
    [Direction.BOTTOM]: [mid, size],
    [Direction.LEFT]: [0, mid],
    [Direction.RIGHT]: [size, mid],
  };

  const isDeadEnd = connectedGroups.length === 0 && Object.values(openings).some(v => v);

  const lines: React.ReactNode[] = [];

  // Draw connected groups as lines from each opening to center
  for (const group of connectedGroups) {
    for (const dir of group) {
      const [ex, ey] = edgeMid[dir];
      lines.push(
        <line key={`${dir}`} x1={ex} y1={ey} x2={mid} y2={mid}
          stroke="#c8a84e" strokeWidth={small ? 4 : 6} strokeLinecap="round" />
      );
    }
  }

  // Dead-end: draw openings as short stubs
  if (isDeadEnd) {
    for (const [dir, open] of Object.entries(openings) as [Direction, boolean][]) {
      if (!open) continue;
      const [ex, ey] = edgeMid[dir];
      const stubX = ex + (mid - ex) * 0.4;
      const stubY = ey + (mid - ey) * 0.4;
      lines.push(
        <line key={`dead-${dir}`} x1={ex} y1={ey} x2={stubX} y2={stubY}
          stroke="#8B4513" strokeWidth={small ? 4 : 6} strokeLinecap="round" />
      );
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sab-path-svg">
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={3}
        fill={isDeadEnd ? '#2a1a0a' : '#1a1a0a'} stroke="none" />
      {lines}
      <circle cx={mid} cy={mid} r={small ? 2 : 3}
        fill={connectedGroups.length > 0 ? '#c8a84e' : isDeadEnd ? '#8B4513' : 'transparent'} />
    </svg>
  );
}
