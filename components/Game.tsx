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
  const remotePlayersRef = useRef<Record<string, WSPlayerState>>({});
  const [connected, setConnected] = useState(false);
  const movementRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize WebSocket connection
    gameSocket.connect(localPlayer.id, localPlayer.username, localPlayer.color);
    
    // Optimistically set connected for UI, though socket.ts handles actual state
    setConnected(true);

    const unsubscribe = gameSocket.onMessage((data) => {
      if (data.type === 'state') {
        // The server sends the full state of all players
        // payload: { players: { [id]: { ... } } }
        const allPlayers = data.payload.players || {};
        
        // Filter out local player from the remote list
        const remotes: Record<string, WSPlayerState> = {};
        Object.keys(allPlayers).forEach((key) => {
          if (key !== localPlayer.id) {
            remotes[key] = allPlayers[key];
          }
        });

        // Update the ref directly for performance (no re-renders)
        remotePlayersRef.current = remotes;
      }
    });

    return () => {
      unsubscribe();
      gameSocket.disconnect();
    };
  }, [localPlayer]);

  return (
    <div className="relative w-full h-full bg-black touch-none">
      {/* 3D Scene - Always render even if connecting */}
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
      
      {/* Connection Status Indicator */}
      {!gameSocket.isConnected && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/80 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse pointer-events-none">
           Connecting to Server...
         </div>
      )}
    </div>
  );
};

export default Game;