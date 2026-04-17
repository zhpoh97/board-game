import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import { ClientEvent } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';

export default function GameOverOverlay() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { loserId, loseReason, players, myId, isAdmin } = state;
  const loser = players.find((p) => p.id === loserId);
  const isLoser = loserId === myId;

  const handleRestart = () => {
    getSocket().emit(ClientEvent.GAME_RESTART);
  };

  const handleLeave = () => {
    getSocket().emit(ClientEvent.ROOM_LEAVE);
    localStorage.removeItem('cp_sessionId');
    localStorage.removeItem('cp_roomCode');
    useGameStore.getState().clearState();
    navigate('/', { replace: true });
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <h2>{t('gameover.title')}</h2>
        <div className="loser-info">
          {isLoser ? (
            <p className="loser-text">{t('gameover.youLost')}</p>
          ) : (
            <p className="loser-text">{t('gameover.otherLost', { name: loser?.nickname || '???' })}</p>
          )}
          <p className="lose-reason">{loseReason}</p>
        </div>

        <div className="game-over-actions">
          {isAdmin && (
            <button className="btn btn-primary btn-large" onClick={handleRestart}>
              {t('gameover.playAgain')}
            </button>
          )}
          {!isAdmin && (
            <p className="hint">{t('gameover.waitingAdmin')}</p>
          )}
          <button className="btn btn-secondary" onClick={handleLeave}>
            {t('gameover.leaveRoom')}
          </button>
        </div>
      </div>
    </div>
  );
}
