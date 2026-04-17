import { useGameStore } from '../../store/useGameStore';
import { SaboteurPhase } from '@cockroach-poker/shared';
import SaboteurCardComponent, { CARD_INFO } from './SaboteurCard';

const KIND_EMOJI: Record<string, string> = {
  PATH: '\u{1F6E4}\uFE0F',
  BREAK: '\u{1F6AB}',
  REPAIR: '\u{1F527}',
  ROCKFALL: '\u{1FAA8}',
  MAP: '\u{1F5FA}\uFE0F',
};

export default function SaboteurHand() {
  const sabState = useGameStore((s) => s.sabState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);

  if (!sabState || sabState.myRole === 'observer') return null;

  const isMyTurn = sabState.currentPlayerId === sabState.myId && sabState.phase === SaboteurPhase.PLAYING;
  const selectedCard = sabState.myHand.find(c => c.id === selectedCardId);
  const infoBanner = selectedCard ? CARD_INFO[selectedCard.kind] : null;
  const infoEmoji = selectedCard ? KIND_EMOJI[selectedCard.kind] : null;

  return (
    <div className="sab-hand">
      {infoBanner && (
        <div className="sab-hand-banner">
          <span className="sab-hand-banner-emoji">{infoEmoji}</span>
          <span className="sab-hand-banner-text">{infoBanner}</span>
        </div>
      )}
      <div className="sab-hand-label">
        Your Hand ({sabState.myHand.length}) &middot; Deck: {sabState.deckRemaining}
      </div>
      <div className="sab-hand-cards">
        {sabState.myHand.map((card) => (
          <div
            key={card.id}
            className={`sab-hand-wrapper ${selectedCardId === card.id ? 'selected' : ''} ${isMyTurn ? 'clickable' : ''}`}
            onClick={() => {
              if (!isMyTurn) return;
              setSelectedCardId(selectedCardId === card.id ? null : card.id);
            }}
          >
            <SaboteurCardComponent card={card} selected={selectedCardId === card.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
