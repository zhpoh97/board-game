import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import {
  ClientEvent, SaboteurPhase, SaboteurCardKind, Tool,
  SaboteurPathCard, START_POSITION, GOAL_POSITIONS,
  OPPOSITE_DIRECTION, DIRECTION_OFFSET, ALL_DIRECTIONS,
  PATH_TEMPLATES, Direction,
} from '@cockroach-poker/shared';

export default function SaboteurActions() {
  const sabState = useGameStore((s) => s.sabState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);
  const sabPeekedGoal = useGameStore((s) => s.sabPeekedGoal);
  const setSabPeekedGoal = useGameStore((s) => s.setSabPeekedGoal);

  if (!sabState) return null;

  const isMyTurn = sabState.currentPlayerId === sabState.myId && sabState.phase === SaboteurPhase.PLAYING;
  const selectedCard = sabState.myHand.find(c => c.id === selectedCardId);

  // Map peek phase
  if (sabState.phase === SaboteurPhase.MAP_PEEK && sabPeekedGoal) {
    return (
      <div className="sab-actions">
        <div className="sab-action-info">
          <p>You peeked at a goal card:</p>
          <div className="sab-peek-result">
            {sabPeekedGoal.hasGold ? '\u{1F4B0} Gold!' : '\u{1FAA8} Stone'}
          </div>
          <button className="btn btn-primary" onClick={() => {
            getSocket().emit(ClientEvent.SAB_MAP_PEEK_DONE);
            setSabPeekedGoal(null);
          }}>
            OK
          </button>
        </div>
      </div>
    );
  }

  if (sabState.phase === SaboteurPhase.ROUND_END) {
    return (
      <div className="sab-actions">
        <div className="sab-action-info">
          <h3>Round {sabState.round} Over!</h3>
          <p>
            {sabState.winningSide === 'miner' ? 'Miners found the gold!' : 'Saboteurs blocked the tunnel!'}
          </p>
          <p>Your role: <strong>{sabState.myRole === 'observer' ? 'Observer' : sabState.myRole}</strong></p>
          {sabState.isAdmin && sabState.round < sabState.totalRounds && (
            <button className="btn btn-primary" onClick={() => getSocket().emit(ClientEvent.SAB_NEXT_ROUND)}>
              Next Round
            </button>
          )}
          {sabState.isAdmin && sabState.round >= sabState.totalRounds && (
            <button className="btn btn-primary" onClick={() => getSocket().emit(ClientEvent.GAME_RESTART)}>
              New Game
            </button>
          )}
        </div>
      </div>
    );
  }

  if (sabState.phase === SaboteurPhase.GAME_OVER) {
    // Find winner by highest score
    const scores = Object.entries(sabState.scores).sort((a, b) => b[1] - a[1]);
    const winner = sabState.players.find(p => p.id === scores[0]?.[0]);

    return (
      <div className="sab-actions">
        <div className="sab-action-info">
          <h3>Game Over!</h3>
          <div className="sab-scores">
            {scores.map(([id, score]) => {
              const p = sabState.players.find(pl => pl.id === id);
              return (
                <div key={id} className="sab-score-row">
                  <span>{p?.nickname || '???'}</span>
                  <span>{score} gold</span>
                </div>
              );
            })}
          </div>
          {winner && <p><strong>{winner.nickname}</strong> wins!</p>}
          {sabState.isAdmin && (
            <button className="btn btn-primary" onClick={() => getSocket().emit(ClientEvent.GAME_RESTART)}>
              Play Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isMyTurn || sabState.myRole === 'observer') {
    const currentPlayer = sabState.players.find(p => p.id === sabState.currentPlayerId);
    return (
      <div className="sab-actions">
        <div className="sab-action-info">
          {sabState.myRole === 'observer'
            ? 'You are observing.'
            : `Waiting for ${currentPlayer?.nickname || '???'}...`}
        </div>
      </div>
    );
  }

  // Player's turn actions
  return (
    <div className="sab-actions">
      {!selectedCard && (
        <div className="sab-action-info">Select a card from your hand to play or discard.</div>
      )}

      {selectedCard && <SelectedCardActions />}
    </div>
  );
}

function SelectedCardActions() {
  const sabState = useGameStore((s) => s.sabState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  if (!sabState || !selectedCardId) return null;

  const card = sabState.myHand.find(c => c.id === selectedCardId);
  if (!card) return null;

  const hasBrokenTools = sabState.players.find(p => p.id === sabState.myId)?.brokenTools.length ?? 0;

  const handleDiscard = () => {
    getSocket().emit(ClientEvent.SAB_DISCARD, { cardId: selectedCardId });
    setSelectedCardId(null);
  };

  // Path card: show "click on board to place"
  if (card.kind === SaboteurCardKind.PATH) {
    return (
      <div className="sab-selected-actions">
        {hasBrokenTools > 0 ? (
          <p className="sab-warning">You have broken tools! Repair them before placing path cards.</p>
        ) : (
          <p>Click on a highlighted cell on the board to place this path card.</p>
        )}
        <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard Instead</button>
      </div>
    );
  }

  // Break card: choose target
  if (card.kind === SaboteurCardKind.BREAK) {
    const otherPlayers = sabState.players.filter(p => p.id !== sabState.myId && p.isConnected && !p.brokenTools.includes(card.tool));
    return (
      <div className="sab-selected-actions">
        <p>Break whose {card.tool}?</p>
        <div className="target-buttons">
          {otherPlayers.map(p => (
            <button key={p.id} className="btn btn-target" onClick={() => {
              getSocket().emit(ClientEvent.SAB_PLAY_BREAK, { cardId: selectedCardId, targetPlayerId: p.id });
              setSelectedCardId(null);
            }}>
              {p.nickname}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard Instead</button>
      </div>
    );
  }

  // Repair card: choose target and tool
  if (card.kind === SaboteurCardKind.REPAIR) {
    // Find players who have a broken tool this card can fix
    const validTargets = sabState.players.filter(p =>
      p.isConnected && p.brokenTools.some(t => card.tools.includes(t))
    );
    return (
      <div className="sab-selected-actions">
        <p>Repair whose tool?</p>
        <div className="target-buttons">
          {validTargets.map(p => (
            <div key={p.id} className="sab-repair-target">
              <span>{p.nickname}: </span>
              {p.brokenTools.filter(t => card.tools.includes(t)).map(tool => (
                <button key={tool} className="btn btn-target btn-small" onClick={() => {
                  getSocket().emit(ClientEvent.SAB_PLAY_REPAIR, { cardId: selectedCardId, targetPlayerId: p.id, tool });
                  setSelectedCardId(null);
                }}>
                  Fix {tool}
                </button>
              ))}
            </div>
          ))}
        </div>
        {validTargets.length === 0 && <p className="hint">No one has a broken tool this card can fix.</p>}
        <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard Instead</button>
      </div>
    );
  }

  // Rockfall card: click on board to remove
  if (card.kind === SaboteurCardKind.ROCKFALL) {
    return (
      <div className="sab-selected-actions">
        <p>Click on a card on the board to destroy it (not the start card).</p>
        <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard Instead</button>
      </div>
    );
  }

  // Map card: choose a goal to peek
  if (card.kind === SaboteurCardKind.MAP) {
    const unrevealed = sabState.goals.filter(g => !g.revealed);
    return (
      <div className="sab-selected-actions">
        <p>Choose a goal card to peek at:</p>
        <div className="target-buttons">
          {unrevealed.map(g => (
            <button key={`${g.x},${g.y}`} className="btn btn-target" onClick={() => {
              getSocket().emit(ClientEvent.SAB_PLAY_MAP, { cardId: selectedCardId, goalX: g.x, goalY: g.y });
              setSelectedCardId(null);
            }}>
              Goal ({g.y === -1 ? 'Top' : g.y === 0 ? 'Middle' : 'Bottom'})
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard Instead</button>
      </div>
    );
  }

  return <button className="btn btn-secondary btn-small" onClick={handleDiscard}>Discard</button>;
}
