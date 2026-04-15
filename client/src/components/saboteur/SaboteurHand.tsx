import { useGameStore } from '../../store/useGameStore';
import { SaboteurPhase } from '@cockroach-poker/shared';
import SaboteurCardComponent from './SaboteurCard';

export default function SaboteurHand() {
  const sabState = useGameStore((s) => s.sabState);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);

  if (!sabState || sabState.myRole === 'observer') return null;

  const isMyTurn = sabState.currentPlayerId === sabState.myId && sabState.phase === SaboteurPhase.PLAYING;

  return (
    <div className="sab-hand">
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
