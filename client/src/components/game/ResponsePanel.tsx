import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import { ClientEvent } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';

export default function ResponsePanel() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);

  if (!state || !state.currentChain) return null;

  const { currentChain, canPeekAndPass, players } = state;
  const fromName = players.find((p) => p.id === currentChain.from)?.nickname || '???';
  const critterName = t(`critter.${currentChain.claimedType}` as any);

  const handleCall = (guess: boolean) => {
    getSocket().emit(ClientEvent.GAME_CALL_TRUE_FALSE, { guess });
  };

  const handlePeek = () => {
    getSocket().emit(ClientEvent.GAME_PEEK_AND_PASS);
  };

  return (
    <div className="response-panel">
      <div className="claim-display">
        {t('response.claim', { name: fromName, critter: critterName })}
      </div>

      <div className="response-buttons">
        <button className="btn btn-success btn-large" onClick={() => handleCall(true)}>
          {t('response.true')}
          <span className="btn-hint">{t('response.trueHint')}</span>
        </button>
        <button className="btn btn-danger btn-large" onClick={() => handleCall(false)}>
          {t('response.false')}
          <span className="btn-hint">{t('response.falseHint')}</span>
        </button>
        {canPeekAndPass && (
          <button className="btn btn-secondary btn-large" onClick={handlePeek}>
            {t('response.peek')}
            <span className="btn-hint">{t('response.peekHint')}</span>
          </button>
        )}
      </div>

      {!canPeekAndPass && (
        <p className="hint">{t('response.noPlayers')}</p>
      )}
    </div>
  );
}
