import { useGameStore } from '../../store/useGameStore';
import { GamePhase } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';
import CardComponent from '../shared/Card';

export default function HandView() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);

  if (!state) return null;

  const { myHand, phase, activePlayerId, myId } = state;
  const isMyTurn = activePlayerId === myId && phase === GamePhase.ROUND_START;

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };

  const sortedHand = [...myHand].sort((a, b) => {
    if (a.critter !== b.critter) return a.critter.localeCompare(b.critter);
    return a.isRoyal === b.isRoyal ? 0 : a.isRoyal ? -1 : 1;
  });

  return (
    <div className="hand-view">
      <div className="hand-label">{t('hand.label', { count: String(myHand.length) })}</div>
      <div className="hand-cards">
        {sortedHand.map((card) => (
          <div
            key={card.id}
            className={`hand-card-wrapper ${selectedCardId === card.id ? 'selected' : ''} ${isMyTurn ? 'clickable' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <CardComponent card={card} faceUp size="medium" />
          </div>
        ))}
      </div>
    </div>
  );
}
