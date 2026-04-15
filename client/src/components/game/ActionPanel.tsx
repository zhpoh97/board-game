import { useGameStore } from '../../store/useGameStore';
import { GamePhase } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';
import PassCardForm from './PassCardForm';
import ResponsePanel from './ResponsePanel';
import PeekPassForm from './PeekPassForm';
import ChainInfo from './ChainInfo';

export default function ActionPanel() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const peekedCard = useGameStore((s) => s.peekedCard);
  const resolution = useGameStore((s) => s.resolution);

  if (!state) return null;

  const { phase, myId, activePlayerId, currentChain } = state;
  const isObserver = state.myRole === 'observer';

  const formatCritter = (critter: string) => {
    return t(`critter.${critter}` as any);
  };

  const renderAction = () => {
    if (isObserver) {
      return <div className="action-info">{t('action.observing')}</div>;
    }

    if (phase === GamePhase.ROUND_START && activePlayerId === myId) {
      return <PassCardForm />;
    }

    if (phase === GamePhase.AWAITING_RESPONSE && currentChain?.currentTarget === myId) {
      return <ResponsePanel />;
    }

    if (phase === GamePhase.CHAIN_PASSING && currentChain?.seenByIds[currentChain.seenByIds.length - 1] === myId) {
      return <PeekPassForm />;
    }

    if (phase === GamePhase.ROUND_RESOLUTION && resolution) {
      return (
        <div className="action-info resolution">
          <div className="resolution-card">
            {t('action.cardWas', { critter: formatCritter(resolution.card.critter) })}
            {resolution.card.isRoyal && <span className="royal-tag"> {t('action.royal')}</span>}
          </div>
          <div className="resolution-result">{resolution.reason}</div>
        </div>
      );
    }

    if (phase === GamePhase.ROUND_START) {
      const activeName = state.players.find((p) => p.id === activePlayerId)?.nickname || '???';
      return <div className="action-info">{t('status.waitingPass', { name: activeName })}</div>;
    }

    if (phase === GamePhase.AWAITING_RESPONSE && currentChain) {
      const targetName = state.players.find((p) => p.id === currentChain.currentTarget)?.nickname || '???';
      return <div className="action-info">{t('status.waitingRespond', { name: targetName })}</div>;
    }

    if (phase === GamePhase.CHAIN_PASSING && currentChain) {
      const lastSeen = currentChain.seenByIds[currentChain.seenByIds.length - 1];
      const peekerName = state.players.find((p) => p.id === lastSeen)?.nickname || '???';
      return <div className="action-info">{t('status.otherPeeked', { name: peekerName })}</div>;
    }

    return null;
  };

  return (
    <div className="action-panel">
      {currentChain && <ChainInfo />}
      {renderAction()}
    </div>
  );
}
