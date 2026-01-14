import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Game from './components/Game';
import { Player, LocalPlayerState } from './types';
import { PLAYER_COLORS } from './constants';
import { logoutPlayer } from './services/supabase';
import { gameSocket } from './services/socket';

const App: React.FC = () => {
  const [localPlayer, setLocalPlayer] = useState<LocalPlayerState | null>(null);

  const handleLoginSuccess = (player: Player) => {
    // Assign a random color on login
    const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
    
    setLocalPlayer({
      id: player.id,
      username: player.username,
      color: color
    });
  };

  useEffect(() => {
    const handleUnload = () => {
      if (localPlayer) {
        logoutPlayer(localPlayer.id);
        gameSocket.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [localPlayer]);

  return (
    <div className="w-full h-full bg-slate-900 text-white font-sans overflow-hidden">
      {!localPlayer ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Game localPlayer={localPlayer} />
      )}
    </div>
  );
};

export default App;
