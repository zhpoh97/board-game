import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import { ClientEvent, CritterType, ALL_CRITTERS } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';
import CardComponent from '../shared/Card';

export default function PeekPassForm() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const peekedCard = useGameStore((s) => s.peekedCard);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [claimedType, setClaimedType] = useState<CritterType | null>(null);

  if (!state || !state.currentChain) return null;

  const { currentChain, players, myId } = state;

  const validTargets = players.filter(
    (p) => p.id !== myId && p.isConnected && !currentChain.seenByIds.includes(p.id)
  );

  const handleSubmit = () => {
    if (!targetId || !claimedType) return;
    getSocket().emit(ClientEvent.GAME_PASS_AFTER_PEEK, {
      targetPlayerId: targetId,
      claimedType,
    });
    setTargetId(null);
    setClaimedType(null);
  };

  return (
    <div className="peek-pass-form">
      {peekedCard && (
        <div className="peeked-card-display">
          <span>{t('peek.youPeeked')}</span>
          <CardComponent card={peekedCard} faceUp size="small" />
        </div>
      )}

      <div className="form-step">
        <label>{t('peek.passTo')}</label>
        <div className="target-buttons">
          {validTargets.map((p) => (
            <button
              key={p.id}
              className={`btn btn-target ${targetId === p.id ? 'active' : ''}`}
              onClick={() => setTargetId(p.id)}
            >
              {p.nickname}
            </button>
          ))}
        </div>
      </div>

      <div className="form-step">
        <label>{t('peek.declare')}</label>
        <div className="critter-buttons">
          {ALL_CRITTERS.map((critter) => (
            <button
              key={critter}
              className={`btn btn-critter ${claimedType === critter ? 'active' : ''}`}
              onClick={() => setClaimedType(critter)}
            >
              {t(`critter.${critter}` as any)}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-large"
        onClick={handleSubmit}
        disabled={!targetId || !claimedType}
      >
        {t('peek.submit')}
      </button>
    </div>
  );
}
