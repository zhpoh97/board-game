import { useGameStore } from '../../store/useGameStore';
import { CritterType, LOSE_THRESHOLD, LOSE_ALL_TYPES_COUNT } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';
import CardComponent from '../shared/Card';

export default function TableView() {
  const { t } = useI18n();
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { players, myId, activePlayerId, currentChain } = state;

  return (
    <div className="table-view">
      {players.map((player) => {
        const grouped = new Map<CritterType, typeof player.faceUpCards>();
        for (const card of player.faceUpCards) {
          if (!grouped.has(card.critter)) grouped.set(card.critter, []);
          grouped.get(card.critter)!.push(card);
        }

        const isActive = player.id === activePlayerId;
        const isTarget = currentChain?.currentTarget === player.id;
        const isMe = player.id === myId;
        const hasSeen = currentChain?.seenByIds.includes(player.id);

        let maxCount = 0;
        for (const cards of grouped.values()) {
          if (cards.length > maxCount) maxCount = cards.length;
        }
        const uniqueTypes = grouped.size;
        const inDanger = maxCount >= LOSE_THRESHOLD - 1 || uniqueTypes >= LOSE_ALL_TYPES_COUNT - 1;

        return (
          <div
            key={player.id}
            className={`player-slot ${isMe ? 'is-me' : ''} ${isActive ? 'is-active' : ''} ${isTarget ? 'is-target' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
          >
            <div className="player-slot-header">
              <span className="player-name">
                {player.nickname}
                {isMe && ` ${t('table.you')}`}
              </span>
              <span className="hand-count">{t('table.cards', { count: String(player.handCount) })}</span>
              {!player.isConnected && <span className="offline-indicator">{t('table.offline')}</span>}
              {hasSeen && <span className="seen-indicator">{t('table.sawCard')}</span>}
              {inDanger && <span className="danger-indicator">!</span>}
            </div>
            <div className="face-up-cards">
              {player.faceUpCards.length === 0 ? (
                <span className="no-cards">{t('table.noCards')}</span>
              ) : (
                [...grouped.entries()].map(([critter, cards]) => (
                  <div key={critter} className={`critter-group ${cards.length >= LOSE_THRESHOLD - 1 ? 'danger' : ''}`}>
                    {cards.map((card) => (
                      <CardComponent key={card.id} card={card} faceUp size="small" />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
