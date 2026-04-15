import { useGameStore } from '../store/useGameStore';
import { getSocket } from '../socket';
import { ClientEvent, GameVariant, GamePhase, GameType, VARIANT_MIN_PLAYERS, SABOTEUR_MIN_PLAYERS } from '@cockroach-poker/shared';
import { useI18n } from '../i18n/useI18n';

export default function LobbyPage() {
  const { t, lang, setLang } = useI18n();
  const state = useGameStore((s) => s.state);
  const sabState = useGameStore((s) => s.sabState);

  // Determine which game type we're in
  const isSaboteur = !!sabState && !state;
  const gameState = isSaboteur ? sabState : state;
  if (!gameState) return null;

  const roomCode = gameState.roomCode;
  const isAdmin = gameState.isAdmin;
  const adminId = gameState.adminId;
  const myId = gameState.myId;

  // For CP
  const cpPlayers = !isSaboteur && state ? state.players : [];
  const cpObservers = !isSaboteur && state ? state.observers : [];
  const variant = !isSaboteur && state ? state.variant : GameVariant.BASE;

  // For Saboteur
  const sabPlayers = isSaboteur && sabState ? sabState.players : [];
  const sabObservers = isSaboteur && sabState ? sabState.observers : [];

  const players = isSaboteur ? sabPlayers : cpPlayers;
  const observers = isSaboteur ? sabObservers : cpObservers;

  const handleToggleRole = () => {
    if (!isSaboteur) getSocket().emit(ClientEvent.LOBBY_TOGGLE_ROLE);
  };

  const handleSetVariant = (v: GameVariant) => {
    getSocket().emit(ClientEvent.LOBBY_SET_VARIANT, { variant: v });
  };

  const handleStart = () => {
    getSocket().emit(ClientEvent.LOBBY_START_GAME);
  };

  const handleKick = (sessionId: string) => {
    getSocket().emit(ClientEvent.ROOM_KICK, { targetSessionId: sessionId });
  };

  const handleClose = () => {
    if (confirm('Close this room? Everyone will be disconnected.')) {
      getSocket().emit(ClientEvent.ROOM_CLOSE);
    }
  };

  const handleLeave = () => {
    getSocket().emit(ClientEvent.ROOM_LEAVE);
    localStorage.removeItem('cp_sessionId');
    localStorage.removeItem('cp_roomCode');
    useGameStore.getState().clearState();
  };

  const minPlayers = isSaboteur ? SABOTEUR_MIN_PLAYERS : VARIANT_MIN_PLAYERS[variant];
  const canStart = players.length >= minPlayers;
  const royalDisabled = !isSaboteur && cpPlayers.length < VARIANT_MIN_PLAYERS[GameVariant.ROYAL];

  const gameLabel = isSaboteur
    ? (lang === 'zh' ? '矿坑矿工' : 'Saboteur')
    : (variant === GameVariant.ROYAL ? t('lobby.royal') : t('lobby.base'));

  return (
    <div className="page lobby-page">
      <div className="lobby-card">
        <div className="lobby-header">
          <h2>{t('lobby.room', { roomCode })}</h2>
          <div className="lobby-header-right">
            <span className="variant-badge">{gameLabel}</span>
            <button className="btn btn-small btn-secondary" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
              {t('lang.toggle')}
            </button>
          </div>
        </div>

        <div className="lobby-section">
          <h3>{t('lobby.players', { count: String(players.length) })}</h3>
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id} className={`player-item ${!p.isConnected ? 'disconnected' : ''}`}>
                <span className="player-name">
                  {p.nickname}
                  {p.id === myId && ` ${t('lobby.you')}`}
                  {p.id === adminId && ` ${t('lobby.admin')}`}
                  {!p.isConnected && ` ${t('lobby.offline')}`}
                </span>
                {isAdmin && p.id !== myId && (
                  <button className="btn btn-small btn-danger" onClick={() => handleKick(p.id)}>
                    {t('lobby.kick')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {observers.length > 0 && (
          <div className="lobby-section">
            <h3>{t('lobby.observers', { count: String(observers.length) })}</h3>
            <ul className="player-list">
              {observers.map((o) => (
                <li key={o.id} className="player-item observer">
                  <span className="player-name">
                    {o.nickname}
                    {o.id === myId && ` ${t('lobby.you')}`}
                  </span>
                  {isAdmin && o.id !== myId && (
                    <button className="btn btn-small btn-danger" onClick={() => handleKick(o.id)}>
                      {t('lobby.kick')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isSaboteur && (
          <div className="lobby-section">
            <button className="btn btn-secondary" onClick={handleToggleRole}>
              {state?.myRole === 'observer' ? t('lobby.joinAsPlayer') : t('lobby.switchToObserver')}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="lobby-section admin-controls">
            {!isSaboteur && (
              <>
                <h3>{t('lobby.gameSettings')}</h3>
                <div className="variant-selector">
                  <button
                    className={`btn ${variant === GameVariant.BASE ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSetVariant(GameVariant.BASE)}
                  >
                    {t('lobby.base')}
                  </button>
                  <button
                    className={`btn ${variant === GameVariant.ROYAL ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSetVariant(GameVariant.ROYAL)}
                    disabled={royalDisabled}
                    title={royalDisabled ? t('lobby.royalRequires') : ''}
                  >
                    {t('lobby.royal')} {royalDisabled && t('lobby.royalMinPlayers')}
                  </button>
                </div>
              </>
            )}

            <button
              className="btn btn-primary btn-large"
              onClick={handleStart}
              disabled={!canStart}
            >
              {canStart ? t('lobby.startGame') : t('lobby.needPlayers', { min: String(minPlayers) })}
            </button>

            <button className="btn btn-danger" onClick={handleClose}>
              {t('lobby.closeRoom')}
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="lobby-section">
            <p className="waiting-text">{t('lobby.waiting')}</p>
            <button className="btn btn-secondary" onClick={handleLeave}>
              {t('lobby.leaveRoom')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
