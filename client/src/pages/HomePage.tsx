import { useState } from 'react';
import { getSocket } from '../socket';
import { ClientEvent, GameType } from '@cockroach-poker/shared';
import { useI18n } from '../i18n/useI18n';

export default function HomePage() {
  const { t, lang, setLang } = useI18n();
  const [nickname, setNickname] = useState(() => localStorage.getItem('cp_nickname') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [gameType, setGameType] = useState<GameType>(GameType.COCKROACH_POKER);

  const handleCreate = () => {
    if (!nickname.trim()) return;
    localStorage.setItem('cp_nickname', nickname.trim());
    getSocket().emit(ClientEvent.ROOM_CREATE, { nickname: nickname.trim(), gameType });
  };

  const handleJoin = () => {
    if (!nickname.trim() || !roomCode.trim()) return;
    localStorage.setItem('cp_nickname', nickname.trim());
    getSocket().emit(ClientEvent.ROOM_JOIN, {
      roomCode: roomCode.trim().toUpperCase(),
      nickname: nickname.trim(),
    });
  };

  return (
    <div className="page home-page">
      <div className="home-card">
        <button
          className="btn btn-small btn-secondary lang-toggle"
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
        >
          {t('lang.toggle')}
        </button>
        <h1>{lang === 'zh' ? '纸牌游戏' : 'Card Games'}</h1>
        <p className="subtitle">{lang === 'zh' ? '蟑螂扑克 & 矿坑矿工' : 'Cockroach Poker & Saboteur'}</p>

        {mode === 'menu' && (
          <div className="home-actions">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              {t('home.createRoom')}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              {t('home.joinRoom')}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="home-form">
            <div className="game-type-selector">
              <button
                className={`btn ${gameType === GameType.COCKROACH_POKER ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setGameType(GameType.COCKROACH_POKER)}
              >
                {lang === 'zh' ? '\u{1FAB3} 蟑螂扑克' : '\u{1FAB3} Cockroach Poker'}
              </button>
              <button
                className={`btn ${gameType === GameType.SABOTEUR ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setGameType(GameType.SABOTEUR)}
              >
                {lang === 'zh' ? '\u26CF\uFE0F 矿坑矿工' : '\u26CF\uFE0F Saboteur'}
              </button>
            </div>
            <input
              type="text"
              placeholder={t('home.nickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setMode('menu')}>
                {t('home.back')}
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!nickname.trim()}>
                {t('home.create')}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="home-form">
            <input
              type="text"
              placeholder={t('home.nickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <input
              type="text"
              placeholder={t('home.roomCode')}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setMode('menu')}>
                {t('home.back')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleJoin}
                disabled={!nickname.trim() || !roomCode.trim()}
              >
                {t('home.join')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
