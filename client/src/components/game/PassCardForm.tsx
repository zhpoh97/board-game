import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSocket } from '../../socket';
import { ClientEvent, CritterType, ALL_CRITTERS } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';

export default function PassCardForm() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [claimedType, setClaimedType] = useState<CritterType | null>(null);

  if (!state) return null;

  const otherPlayers = state.players.filter((p) => p.id !== state.myId && p.isConnected);

  const handleSubmit = () => {
    if (!selectedCardId || !targetId || !claimedType) return;
    getSocket().emit(ClientEvent.GAME_PASS_CARD, {
      cardId: selectedCardId,
      targetPlayerId: targetId,
      claimedType,
    });
    setSelectedCardId(null);
    setTargetId(null);
    setClaimedType(null);
  };

  return (
    <div className="pass-card-form">
      <h3>{t('pass.title')}</h3>

      <div className="form-step">
        <label>{selectedCardId ? t('pass.step1Selected') : t('pass.step1Click')}</label>
      </div>

      <div className="form-step">
        <label>{t('pass.step2')}</label>
        <div className="target-buttons">
          {otherPlayers.map((p) => (
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
        <label>{t('pass.step3')}</label>
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
        disabled={!selectedCardId || !targetId || !claimedType}
      >
        {t('pass.submit')}
      </button>
    </div>
  );
}
