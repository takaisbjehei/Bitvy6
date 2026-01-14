import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, SoftShadows } from '@react-three/drei';
import { LocalPlayerState, WSPlayerState } from '../types';
import { gameSocket } from '../services/socket';
import HUD from './UI/HUD';
import World from './World';
import PlayerController from './Player';
import RemotePlayers from './RemotePlayers';

interface GameProps {
  localPlayer: LocalPlayerState;
}

const Game: React.FC<GameProps> = ({ localPlayer }) => {
  // We use a Ref for remote players to avoid React render cycles for 60fps updates
  const remotePlayersRef = useRef<Record<string, WSPlayerState>>({});
  const [connected, setConnected] = useState(false);
  const movementRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Connect to WebSocket Server (now Supabase Broadcast)
    gameSocket.connect(localPlayer.id, localPlayer.username, localPlayer.color);
    setConnected(true);

    const unsubscribe = gameSocket.onMessage((data) => {
      if (data.type === 'player_update') {
        const player = data.payload as WSPlayerState;
        // Update specific player in ref
        if (player.id !== localPlayer.id) {
          remotePlayersRef.current[player.id] = {
            ...remotePlayersRef.current[player.id],
            ...player
          };
        }
      } else if (data.type === 'presence_sync') {
        // payload is the presence state object { [id]: [metas], ... }
        const presenceState = data.payload;
        // We can use this to clean up players who left
        // Simple logic: if a player ID is in remotePlayersRef but not in presenceState, remove them
        // Note: presence keys are often the IDs if configured that way, or we scan values.
        // In our socket.ts we set presence key to playerId
        
        const onlineIds = new Set(Object.keys(presenceState));
        
        Object.keys(remotePlayersRef.current).forEach(id => {
          if (!onlineIds.has(id)) {
            delete remotePlayersRef.current[id];
          }
        });
      }
    });

    return () => {
      unsubscribe();
      gameSocket.disconnect();
    };
  }, [localPlayer]);

  return (
    <div className="relative w-full h-full bg-black touch-none">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <SoftShadows size={10} samples={10} focus={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50]} />
        </directionalLight>
        
        <Sky sunPosition={[10, 20, 10]} turbidity={8} rayleigh={6} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <World />

        <PlayerController 
          localPlayer={localPlayer} 
          onMove={(pos) => gameSocket.sendMovement(pos)}
          movementRef={movementRef}
        />

        <RemotePlayers 
          localPlayerId={localPlayer.id} 
          playersRef={remotePlayersRef} 
        />
      </Canvas>

      {/* 2D UI Overlay */}
      <HUD localPlayer={localPlayer} movementRef={movementRef} />
      
      {/* Server Status Indicator */}
      {!connected && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/80 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
           Connecting to Game Server...
         </div>
      )}
    </div>
  );
};

export default Game;