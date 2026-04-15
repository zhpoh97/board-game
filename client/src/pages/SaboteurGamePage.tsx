import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getSocket } from '../socket';
import {
  ClientEvent, SaboteurPhase, SaboteurCardKind, SaboteurPathCard,
  START_POSITION, Direction, OPPOSITE_DIRECTION, DIRECTION_OFFSET, ALL_DIRECTIONS,
  PATH_TEMPLATES,
} from '@cockroach-poker/shared';
import { useI18n } from '../i18n/useI18n';
import SaboteurBoardView from '../components/saboteur/SaboteurBoard';
import SaboteurHand from '../components/saboteur/SaboteurHand';
import SaboteurActions from '../components/saboteur/SaboteurActions';
import SaboteurPlayers from '../components/saboteur/SaboteurPlayers';
import SaboteurRulesModal from '../components/saboteur/SaboteurRulesModal';

export default function SaboteurGamePage() {
  const { t, lang, setLang } = useI18n();
  const [showRules, setShowRules] = useState(false);
  const sabState = useGameStore((s) => s.sabState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);

  if (!sabState) return null;

  const selectedCard = sabState.myHand.find(c => c.id === selectedCardId);
  const isMyTurn = sabState.currentPlayerId === sabState.myId && sabState.phase === SaboteurPhase.PLAYING;
  const hasBrokenTools = (sabState.players.find(p => p.id === sabState.myId)?.brokenTools.length ?? 0) > 0;

  // Compute valid placements for path cards
  const validPlacements = useMemo(() => {
    if (!isMyTurn || !selectedCard || selectedCard.kind !== SaboteurCardKind.PATH || hasBrokenTools) return [];
    return computeValidPlacements(selectedCard as SaboteurPathCard, sabState.board);
  }, [isMyTurn, selectedCard, sabState.board, hasBrokenTools]);

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn || !selectedCard) return;

    if (selectedCard.kind === SaboteurCardKind.PATH && !hasBrokenTools) {
      // Check if it's a valid placement
      if (validPlacements.some(p => p.x === x && p.y === y)) {
        getSocket().emit(ClientEvent.SAB_PLAY_PATH, { cardId: selectedCardId, x, y });
        setSelectedCardId(null);
      }
    }

    if (selectedCard.kind === SaboteurCardKind.ROCKFALL) {
      // Must click on an existing card that isn't the start
      if (x === START_POSITION.x && y === START_POSITION.y) return;
      const hasCard = sabState.board.some(c => c.x === x && c.y === y);
      if (hasCard) {
        getSocket().emit(ClientEvent.SAB_PLAY_ROCKFALL, { cardId: selectedCardId, x, y });
        setSelectedCardId(null);
      }
    }
  };

  const handleLeave = () => {
    const msg = lang === 'zh' ? '确定要离开游戏吗？' : 'Leave the game?';
    if (confirm(msg)) {
      getSocket().emit(ClientEvent.ROOM_LEAVE);
      localStorage.removeItem('cp_sessionId');
      localStorage.removeItem('cp_roomCode');
      useGameStore.getState().clearState();
    }
  };

  return (
    <div className="page sab-game-page">
      <div className="sab-status-bar">
        <div className="status-left">
          <span className="room-code">Room: {sabState.roomCode}</span>
          <span className="variant-badge">Saboteur</span>
          <span className="sab-round">Round {sabState.round}/{sabState.totalRounds}</span>
        </div>
        <div className="status-center">
          {sabState.myRole !== 'observer' && (
            <span className={`sab-role sab-role-${sabState.myRole}`}>
              You are a {sabState.myRole === 'miner' ? 'Miner \u26CF\uFE0F' : 'Saboteur \u{1F608}'}
            </span>
          )}
        </div>
        <div className="status-right">
          <button className="btn btn-small btn-secondary" onClick={() => setShowRules(true)}>
            {t('status.rules')}
          </button>
          <button className="btn btn-small btn-secondary" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
            {t('lang.toggle')}
          </button>
          <button className="btn btn-small btn-danger" onClick={handleLeave}>
            {t('status.quit')}
          </button>
        </div>
        {showRules && <SaboteurRulesModal onClose={() => setShowRules(false)} />}
      </div>

      <div className="sab-main">
        <div className="sab-left-panel">
          <SaboteurPlayers />
          <SaboteurActions />
        </div>
        <div className="sab-board-area">
          <SaboteurBoardView
            board={sabState.board}
            goals={sabState.goals}
            onCellClick={handleCellClick}
            validPlacements={validPlacements}
          />
        </div>
      </div>

      <SaboteurHand />
    </div>
  );
}

// Client-side valid placement computation (mirrors server logic)
function computeValidPlacements(
  card: SaboteurPathCard,
  board: { x: number; y: number; card: SaboteurPathCard }[]
): { x: number; y: number }[] {
  const boardMap = new Map<string, typeof board[0]>();
  for (const cell of board) boardMap.set(`${cell.x},${cell.y}`, cell);

  const goalPositions = new Set(['8,-1', '8,0', '8,1']);
  const checked = new Set<string>();
  const positions: { x: number; y: number }[] = [];

  for (const cell of board) {
    for (const dir of ALL_DIRECTIONS) {
      const { dx, dy } = DIRECTION_OFFSET[dir];
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      const key = `${nx},${ny}`;
      if (checked.has(key)) continue;
      checked.add(key);
      if (boardMap.has(key)) continue;
      if (goalPositions.has(key)) continue;

      // Check all adjacent cards for compatibility
      let hasAdjacent = false;
      let compatible = true;

      for (const d of ALL_DIRECTIONS) {
        const { dx: ddx, dy: ddy } = DIRECTION_OFFSET[d];
        const adjKey = `${nx + ddx},${ny + ddy}`;
        const neighbor = boardMap.get(adjKey);
        if (!neighbor) continue;
        hasAdjacent = true;
        const oppositeDir = OPPOSITE_DIRECTION[d];
        if (card.openings[d] !== neighbor.card.openings[oppositeDir]) {
          compatible = false;
          break;
        }
      }

      if (hasAdjacent && compatible) {
        positions.push({ x: nx, y: ny });
      }
    }
  }

  return positions;
}
