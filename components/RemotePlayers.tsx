import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { WSPlayerState } from '../types';
import * as THREE from 'three';

interface RemotePlayersProps {
  localPlayerId: string;
  playersRef: React.MutableRefObject<Record<string, WSPlayerState>>;
}

const RemotePlayerMesh: React.FC<{ data: WSPlayerState }> = ({ data }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Linear interpolation for smoothness
      const targetPos = new THREE.Vector3(data.x, data.y, data.z);
      meshRef.current.position.lerp(targetPos, 0.15);
      
      // Interpolate rotation
      const currentRotation = meshRef.current.rotation.y;
      // Simple shortest path angle interpolation could be added here
      meshRef.current.rotation.y = THREE.MathUtils.lerp(currentRotation, data.rotation || 0, 0.15);
    }
  });

  return (
    <group ref={meshRef} position={[data.x, data.y, data.z]}>
      {/* Remote Player Body */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial 
          color={data.color || '#ccc'} 
          emissive={data.color || '#ccc'}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Remote Visor */}
      <mesh position={[0, 0.4, 0.4]}>
         <boxGeometry args={[0.6, 0.2, 0.2]} />
         <meshStandardMaterial color="#ff0044" emissive="#ff0044" emissiveIntensity={1} />
      </mesh>

      <Html position={[0, 1.8, 0]} center>
        <div className="bg-black/40 text-gray-200 text-xs px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
          {data.username || 'Unknown'}
        </div>
      </Html>
    </group>
  );
};

const RemotePlayers: React.FC<RemotePlayersProps> = ({ localPlayerId, playersRef }) => {
  const [playerIds, setPlayerIds] = useState<string[]>([]);

  useFrame(() => {
    const currentIds = Object.keys(playersRef.current).filter(id => id !== localPlayerId);
    
    if (currentIds.length !== playerIds.length || !currentIds.every(id => playerIds.includes(id))) {
      setPlayerIds(currentIds);
    }
  });

  return (
    <>
      {playerIds.map(id => (
        <RemotePlayerMesh key={id} data={playersRef.current[id]} />
      ))}
    </>
  );
};

export default RemotePlayers;