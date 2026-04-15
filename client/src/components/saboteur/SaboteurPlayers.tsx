import { useGameStore } from '../../store/useGameStore';
import { Tool } from '@cockroach-poker/shared';

const TOOL_EMOJI: Record<Tool, string> = {
  [Tool.PICKAXE]: '\u26CF\uFE0F',
  [Tool.LANTERN]: '\u{1F4A1}',
  [Tool.CART]: '\u{1F6D2}',
};

export default function SaboteurPlayers() {
  const sabState = useGameStore((s) => s.sabState);
  if (!sabState) return null;

  return (
    <div className="sab-players">
      {sabState.players.map(p => {
        const isMe = p.id === sabState.myId;
        const isActive = p.id === sabState.currentPlayerId;
        return (
          <div key={p.id} className={`sab-player-slot ${isMe ? 'is-me' : ''} ${isActive ? 'is-active' : ''} ${!p.isConnected ? 'disconnected' : ''}`}>
            <div className="sab-player-name">
              {p.nickname}{isMe && ' (you)'}
            </div>
            <div className="sab-player-info">
              <span>{p.handCount} cards</span>
              {p.brokenTools.length > 0 && (
                <span className="sab-broken-tools">
                  {p.brokenTools.map(t => (
                    <span key={t} className="sab-broken-tool" title={`${t} broken`}>
                      {TOOL_EMOJI[t]}{'\u274C'}
                    </span>
                  ))}
                </span>
              )}
              {p.passed && <span className="sab-passed">passed</span>}
              {!p.isConnected && <span className="offline-indicator">offline</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
