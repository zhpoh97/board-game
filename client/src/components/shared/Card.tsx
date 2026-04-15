import { Card as CardType } from '@cockroach-poker/shared';
import { useI18n } from '../../i18n/useI18n';

const CRITTER_EMOJI: Record<string, string> = {
  cockroach: '\u{1FAB3}',
  rat: '\u{1F400}',
  stink_bug: '\u{1FAB2}',
  toad: '\u{1F438}',
  bat: '\u{1F987}',
  fly: '\u{1FAB0}',
  scorpion: '\u{1F982}',
  spider: '\u{1F577}',
};

const CRITTER_COLOR: Record<string, string> = {
  cockroach: '#8B4513',
  rat: '#6B7280',
  stink_bug: '#22C55E',
  toad: '#10B981',
  bat: '#7C3AED',
  fly: '#3B82F6',
  scorpion: '#DC2626',
  spider: '#1F2937',
};

interface CardProps {
  card: CardType;
  faceUp: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CardComponent({ card, faceUp, size = 'medium' }: CardProps) {
  const { t } = useI18n();

  if (!faceUp) {
    return (
      <div className={`card card-back card-${size}`}>
        <div className="card-back-pattern">
          <div className="card-back-inner">
            <span className="card-back-icon">?</span>
          </div>
        </div>
      </div>
    );
  }

  const emoji = CRITTER_EMOJI[card.critter] || '?';
  const name = t(`critter.${card.critter}` as any);
  const accentColor = CRITTER_COLOR[card.critter] || '#6B7280';

  return (
    <div
      className={`card card-front card-${size} ${card.isRoyal ? 'card-royal' : ''}`}
      style={{ '--card-accent': accentColor } as React.CSSProperties}
    >
      <span className="card-corner card-corner-top">{emoji}</span>
      <span className="card-emoji-main">{emoji}</span>
      <span className="card-name">{name}</span>
      <span className="card-corner card-corner-bottom">{emoji}</span>
      {card.isRoyal && (
        <span className="card-royal-badge">
          <span className="card-crown">{'\u{1F451}'}</span>
          <span className="card-royal-text">{t('card.royal')}</span>
        </span>
      )}
    </div>
  );
}
