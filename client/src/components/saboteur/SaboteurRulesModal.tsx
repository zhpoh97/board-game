import { useI18n } from '../../i18n/useI18n';

interface Props {
  onClose: () => void;
}

export default function SaboteurRulesModal({ onClose }: Props) {
  const { lang } = useI18n();
  const zh = lang === 'zh';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{zh ? '矿坑矿工 - 游戏规则' : 'Saboteur - How to Play'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <section>
            <h3>{zh ? '概述' : 'Overview'}</h3>
            <p>
              {zh
                ? '玩家被秘密分配为矿工或破坏者。矿工们合作挖掘隧道通往金矿，破坏者则暗中阻止他们。没人知道谁是谁！'
                : 'Players are secretly assigned as Miners or Saboteurs. Miners work together to dig tunnels toward the gold, while Saboteurs secretly try to stop them. Nobody knows who is who!'}
            </p>
          </section>

          <section>
            <h3>{zh ? '你的回合' : 'On Your Turn'}</h3>
            <p>{zh ? '选择以下三种操作之一：' : 'Choose one of three actions:'}</p>
            <ul>
              <li>
                <strong>{zh ? '放置隧道牌' : 'Play a Path Card'}</strong> —{' '}
                {zh
                  ? '将隧道牌放在棋盘上扩展矿道。牌必须与相邻的牌匹配（隧道口对隧道口），且必须与起点连通。如果你有损坏的工具，则不能放置隧道牌。'
                  : 'Place a tunnel card on the board to extend the mine. Cards must match adjacent cards (openings must align) and must connect back to the start. You cannot play path cards if any of your tools are broken.'}
              </li>
              <li>
                <strong>{zh ? '使用行动牌' : 'Play an Action Card'}</strong> —{' '}
                {zh ? '对其他玩家或棋盘使用特殊效果。' : 'Use a special effect on other players or the board.'}
              </li>
              <li>
                <strong>{zh ? '弃牌' : 'Discard'}</strong> —{' '}
                {zh ? '丢弃一张手牌（面朝下）。' : 'Discard a card from your hand (face down).'}
              </li>
            </ul>
            <p>{zh ? '出牌后从牌堆摸一张牌。' : 'After playing, draw a card from the deck.'}</p>
          </section>

          <section>
            <h3>{zh ? '行动牌' : 'Action Cards'}</h3>
            <ul>
              <li>
                <strong>{zh ? '破坏工具' : 'Break Tool'} ({'\u26CF\uFE0F\u{1F4A1}\u{1F6D2}'})</strong> —{' '}
                {zh
                  ? '损坏另一个玩家的镐、灯或矿车。工具被损坏的玩家不能放置隧道牌。'
                  : 'Break another player\'s pickaxe, lantern, or cart. A player with any broken tool cannot place path cards.'}
              </li>
              <li>
                <strong>{zh ? '修复工具' : 'Repair Tool'}</strong> —{' '}
                {zh
                  ? '修复任意玩家的一个损坏工具。有些修复牌可以选择修复两种工具之一。'
                  : 'Fix any player\'s broken tool. Some repair cards let you choose between two tool types.'}
              </li>
              <li>
                <strong>{zh ? '落石' : 'Rockfall'} ({'\u{1FAA8}'})</strong> —{' '}
                {zh
                  ? '移除棋盘上的一张隧道牌（起点除外）。'
                  : 'Remove a path card from the board (except the start card).'}
              </li>
              <li>
                <strong>{zh ? '地图' : 'Map'} ({'\u{1F5FA}\uFE0F'})</strong> —{' '}
                {zh
                  ? '偷看一张目标牌，只有你能看到结果。'
                  : 'Secretly peek at one of the goal cards. Only you see the result.'}
              </li>
            </ul>
          </section>

          <section>
            <h3>{zh ? '死路牌' : 'Dead-End Cards'}</h3>
            <p>
              {zh
                ? '有些隧道牌看起来有开口，但内部不连通（用深棕色线条表示）。这些死路牌可以被破坏者利用来阻断矿道！'
                : 'Some path cards have openings but no internal connections (shown with dark brown lines). These dead-end cards can be used by saboteurs to block the tunnel!'}
            </p>
          </section>

          <section>
            <h3>{zh ? '获胜条件' : 'Winning'}</h3>
            <ul>
              <li>
                <strong>{zh ? '矿工获胜' : 'Miners win'}</strong> —{' '}
                {zh
                  ? '如果隧道从起点连通到藏有金子的目标牌。'
                  : 'If a connected tunnel reaches the goal card with gold.'}
              </li>
              <li>
                <strong>{zh ? '破坏者获胜' : 'Saboteurs win'}</strong> —{' '}
                {zh
                  ? '如果牌堆用完且所有玩家手牌打完，金矿仍未被找到。'
                  : 'If the deck runs out and all hands are empty without the gold being reached.'}
              </li>
            </ul>
            <p>
              {zh
                ? '获胜方的每位玩家获得金块奖励。游戏共3轮，总金块最多的玩家获胜！'
                : 'Each player on the winning side earns gold nuggets. The game plays 3 rounds, and the player with the most total gold wins!'}
            </p>
          </section>

          <section>
            <h3>{zh ? '目标牌' : 'Goal Cards'}</h3>
            <p>
              {zh
                ? '棋盘右侧有3张目标牌（上、中、下）。其中只有1张藏有金子，其余是石头。用地图牌偷看来找到金子的位置！'
                : 'There are 3 goal cards on the right side of the board (top, middle, bottom). Only 1 has gold — the others are stone. Use map cards to peek and find the gold!'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
