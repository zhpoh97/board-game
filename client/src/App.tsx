import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useGameStore } from './store/useGameStore';
import { useUIStore } from './store/useUIStore';
import { connectSocket } from './socket';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import SaboteurGamePage from './pages/SaboteurGamePage';
import ToastContainer from './components/shared/ToastContainer';
import { GamePhase, SaboteurPhase } from '@cockroach-poker/shared';

export default function App() {
  const state = useGameStore((s) => s.state);
  const sabState = useGameStore((s) => s.sabState);
  const isConnected = useUIStore((s) => s.isConnected);
  const navigate = useNavigate();

  useEffect(() => {
    connectSocket();
  }, []);

  // Auto-navigate based on game state
  useEffect(() => {
    // Saboteur game
    if (sabState) {
      if (sabState.phase === SaboteurPhase.WAITING) {
        navigate(`/lobby/${sabState.roomCode}`, { replace: true });
      } else {
        navigate(`/sab/${sabState.roomCode}`, { replace: true });
      }
      return;
    }

    // Cockroach Poker game
    if (state) {
      if (state.phase === GamePhase.WAITING) {
        navigate(`/lobby/${state.roomCode}`, { replace: true });
      } else {
        navigate(`/game/${state.roomCode}`, { replace: true });
      }
      return;
    }

    navigate('/', { replace: true });
  }, [state?.phase, state?.roomCode, sabState?.phase, sabState?.roomCode]);

  return (
    <div className="app">
      {!isConnected && (
        <div className="connection-bar">Reconnecting to server...</div>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
        <Route path="/sab/:roomCode" element={<SaboteurGamePage />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}
