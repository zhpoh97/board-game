import { useGameStore } from '../../store/useGameStore';
import { useI18n } from '../../i18n/useI18n';

export default function ChainInfo() {
  const { lang } = useI18n();
  const state = useGameStore((s) => s.state);
  if (!state || !state.currentChain) return null;

  const { currentChain, players, myId } = state;

  const getName = (id: string) => {
    if (id === myId) return lang === 'zh' ? '你' : 'You';
    return players.find((p) => p.id === id)?.nickname || '???';
  };

  const seenNames = currentChain.seenByIds.map(getName);
  const label = lang === 'zh' ? '传牌路径：' : 'Card passed through: ';

  return (
    <div className="chain-info">
      <span className="chain-label">{label}</span>
      <span className="chain-names">{seenNames.join(' → ')}</span>
      <span className="chain-arrow"> → </span>
      <span className="chain-current">{getName(currentChain.currentTarget)}</span>
    </div>
  );
}
