import { useGameStore } from '../store/useGameStore';
import { GamePhase } from '@cockroach-poker/shared';
import GameStatus from '../components/game/GameStatus';
import TableView from '../components/game/TableView';
import HandView from '../components/game/HandView';
import ActionPanel from '../components/game/ActionPanel';
import GameOverOverlay from '../components/game/GameOverOverlay';

export default function GamePage() {
  const state = useGameStore((s) => s.state);

  if (!state) return null;

  const isObserver = state.myRole === 'observer';

  return (
    <div className="page game-page">
      <GameStatus />
      <div className="game-main">
        <TableView />
        <ActionPanel />
      </div>
      {!isObserver && <HandView />}
      {state.phase === GamePhase.GAME_OVER && <GameOverOverlay />}
    </div>
  );
}
