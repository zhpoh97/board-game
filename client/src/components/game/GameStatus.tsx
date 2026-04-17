import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import { GamePhase, ClientEvent } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';
import RulesModal from './RulesModal';

export default function GameStatus() {
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { phase, activePlayerId, players, currentChain, myId, variant, roomCode } = state;

  const getPlayerName = (id: string | null) => {
    if (!id) return '???';
    if (id === myId) return lang === 'zh' ? '你' : 'You';
    return players.find((p) => p.id === id)?.nickname || '???';
  };

  const formatCritter = (critter: string) => {
    return t(`critter.${critter}` as any);
  };

  const getStatusText = () => {
    switch (phase) {
      case GamePhase.ROUND_START:
        return activePlayerId === myId
          ? t('status.yourTurn')
          : t('status.waitingPass', { name: getPlayerName(activePlayerId) });
      case GamePhase.AWAITING_RESPONSE:
        if (!currentChain) return '';
        return currentChain.currentTarget === myId
          ? t('status.claimPrompt', { name: getPlayerName(currentChain.from), critter: formatCritter(currentChain.claimedType) })
          : t('status.waitingRespond', { name: getPlayerName(currentChain.currentTarget) });
      case GamePhase.CHAIN_PASSING:
        if (!currentChain) return '';
        const peeker = currentChain.seenByIds[currentChain.seenByIds.length - 1];
        return peeker === myId
          ? t('status.youPeeked')
          : t('status.otherPeeked', { name: getPlayerName(peeker) });
      case GamePhase.ROUND_RESOLUTION:
        return t('status.revealing');
      case GamePhase.GAME_OVER:
        return t('status.gameOver');
      default:
        return '';
    }
  };

  return (
    <div className="game-status">
      <div className="status-left">
        <span className="room-code">Room: {roomCode}</span>
        <span className="variant-badge">{variant}</span>
      </div>
      <div className="status-center">{getStatusText()}</div>
      <div className="status-right">
        {state.myRole === 'observer' && <span className="observer-badge">{t('status.observing')}</span>}
        <button className="btn btn-small btn-secondary" onClick={() => setShowRules(true)}>{t('status.rules')}</button>
        <button
          className="btn btn-small btn-secondary"
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
        >
          {t('lang.toggle')}
        </button>
        <button className="btn btn-small btn-danger" onClick={() => {
          const msg = lang === 'zh' ? '确定要离开游戏吗？' : 'Leave the game?';
          if (confirm(msg)) {
            getSocket().emit(ClientEvent.ROOM_LEAVE);
            localStorage.removeItem('cp_sessionId');
            localStorage.removeItem('cp_roomCode');
            useGameStore.getState().clearState();
            navigate('/', { replace: true });
          }
        }}>
          {t('status.quit')}
        </button>
      </div>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
