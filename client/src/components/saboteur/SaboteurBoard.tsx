import { BoardCell, GoalCardPublic, Direction, START_POSITION, GOAL_POSITIONS } from '@cockroach-poker/shared';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface SaboteurBoardProps {
  board: BoardCell[];
  goals: GoalCardPublic[];
  onCellClick?: (x: number, y: number) => void;
  validPlacements?: { x: number; y: number }[];
}

export default function SaboteurBoardView({ board, goals, onCellClick, validPlacements }: SaboteurBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Compute grid bounds
  const bounds = useMemo(() => {
    let minX = -1, maxX = 9, minY = -2, maxY = 2;
    for (const cell of board) {
      minX = Math.min(minX, cell.x - 1);
      maxX = Math.max(maxX, cell.x + 1);
      minY = Math.min(minY, cell.y - 1);
      maxY = Math.max(maxY, cell.y + 1);
    }
    return { minX, maxX, minY, maxY };
  }, [board]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cellSize = isMobile ? 48 : 72;

  // Auto-scroll to start position on mount
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    hasScrolled.current = true;
    const container = scrollRef.current;
    // Start is at column (START_POSITION.x - bounds.minX) and row (START_POSITION.y - bounds.minY)
    const startCol = START_POSITION.x - bounds.minX;
    const startRow = START_POSITION.y - bounds.minY;
    const gap = isMobile ? 1 : 2;
    const padding = isMobile ? 4 : 6;
    const scrollX = startCol * (cellSize + gap) + padding - container.clientWidth / 2 + cellSize / 2;
    const scrollY = startRow * (cellSize + gap) + padding - container.clientHeight / 2 + cellSize / 2;
    container.scrollTo(scrollX, scrollY);
  }, [bounds, cellSize, isMobile]);
  const boardMap = useMemo(() => {
    const m = new Map<string, BoardCell>();
    for (const cell of board) m.set(`${cell.x},${cell.y}`, cell);
    return m;
  }, [board]);

  const goalMap = useMemo(() => {
    const m = new Map<string, GoalCardPublic>();
    for (const g of goals) m.set(`${g.x},${g.y}`, g);
    return m;
  }, [goals]);

  const validSet = useMemo(() => {
    const s = new Set<string>();
    if (validPlacements) {
      for (const p of validPlacements) s.add(`${p.x},${p.y}`);
    }
    return s;
  }, [validPlacements]);

  const rows: React.ReactNode[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    const cells: React.ReactNode[] = [];
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const key = `${x},${y}`;
      const cell = boardMap.get(key);
      const goal = goalMap.get(key);
      const isStart = x === START_POSITION.x && y === START_POSITION.y;
      const isValid = validSet.has(key);

      cells.push(
        <div
          key={key}
          className={`sab-grid-cell ${cell ? 'sab-cell-filled' : ''} ${isStart ? 'sab-cell-start' : ''} ${isValid ? 'sab-cell-valid' : ''} ${goal ? 'sab-cell-goal' : ''}`}
          style={{ width: cellSize, height: cellSize }}
          onClick={() => onCellClick?.(x, y)}
        >
          {cell && <PathCellPreview cell={cell} size={cellSize - 4} />}
          {goal && !cell && (
            <div className={`sab-goal ${goal.revealed ? (goal.hasGold ? 'sab-goal-gold' : 'sab-goal-stone') : ''}`}>
              {goal.revealed ? (goal.hasGold ? '\u{1F4B0}' : '\u{1FAA8}') : '?'}
            </div>
          )}
          {isValid && !cell && !goal && <div className="sab-valid-marker">+</div>}
        </div>
      );
    }
    rows.push(<div key={y} className="sab-grid-row">{cells}</div>);
  }

  return (
    <div className="sab-board-scroll" ref={scrollRef}>
      <div className="sab-board-container">
        <div className="sab-board">{rows}</div>
      </div>
    </div>
  );
}

function PathCellPreview({ cell, size }: { cell: BoardCell; size: number }) {
  const mid = size / 2;
  const { openings, connectedGroups } = cell.card;

  const edgeMid: Record<Direction, [number, number]> = {
    [Direction.TOP]: [mid, 0],
    [Direction.BOTTOM]: [mid, size],
    [Direction.LEFT]: [0, mid],
    [Direction.RIGHT]: [size, mid],
  };

  const isDeadEnd = connectedGroups.length === 0 && Object.values(openings).some(v => v);
  const lines: React.ReactNode[] = [];

  for (const group of connectedGroups) {
    for (const dir of group) {
      const [ex, ey] = edgeMid[dir];
      lines.push(
        <line key={dir} x1={ex} y1={ey} x2={mid} y2={mid}
          stroke="#c8a84e" strokeWidth={7} strokeLinecap="round" />
      );
    }
  }

  if (isDeadEnd) {
    for (const [dir, open] of Object.entries(openings) as [Direction, boolean][]) {
      if (!open) continue;
      const [ex, ey] = edgeMid[dir];
      const stubX = ex + (mid - ex) * 0.4;
      const stubY = ey + (mid - ey) * 0.4;
      lines.push(
        <line key={`dead-${dir}`} x1={ex} y1={ey} x2={stubX} y2={stubY}
          stroke="#8B4513" strokeWidth={7} strokeLinecap="round" />
      );
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={0} y={0} width={size} height={size} rx={2}
        fill={isDeadEnd ? '#2a1a0a' : '#1a1a0a'} />
      {lines}
      <circle cx={mid} cy={mid} r={3.5}
        fill={connectedGroups.length > 0 ? '#c8a84e' : isDeadEnd ? '#8B4513' : 'transparent'} />
    </svg>
  );
}
