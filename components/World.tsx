import React, { useMemo } from 'react';
import { Instance, Instances, Environment, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_SIZE } from '../constants';

const BUILDING_COUNT = 200;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 15;
const STREET_WIDTH = 4;
const BLOCK_SIZE = 8;

const City: React.FC = () => {
  const buildings = useMemo(() => {
    const items = [];
    // Generate buildings in a grid with streets
    const range = WORLD_SIZE - 5;
    
    for (let x = -range; x <= range; x += BLOCK_SIZE) {
      for (let z = -range; z <= range; z += BLOCK_SIZE) {
        // Skip center area for spawn point
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

        // 70% chance to have a building
        if (Math.random() > 0.3) {
          const height = Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT;
          // Random slight offset for variety
          const posX = x + (Math.random() - 0.5) * 1;
          const posZ = z + (Math.random() - 0.5) * 1;
          
          items.push({
            position: [posX, height / 2, posZ] as [number, number, number],
            scale: [BLOCK_SIZE - STREET_WIDTH, height, BLOCK_SIZE - STREET_WIDTH] as [number, number, number],
            color: Math.random() > 0.8 ? '#22aadd' : Math.random() > 0.8 ? '#aa22dd' : '#111116'
          });
        }
      }
    }
    return items;
  }, []);

  return (
    <group>
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#050510', 10, 60]} />
      
      {/* Ground (Asphalt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[WORLD_SIZE * 4, WORLD_SIZE * 4]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.8} 
          metalness={0.2}
        />
      </mesh>

      {/* Grid pattern on floor for Tron/Cyberpunk look */}
      <gridHelper args={[WORLD_SIZE * 4, WORLD_SIZE, 0x333333, 0x111111]} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <group key={i} position={b.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.scale} />
            <meshStandardMaterial 
              color={b.color} 
              roughness={0.2} 
              metalness={0.8}
              emissive={b.color}
              emissiveIntensity={b.color === '#111116' ? 0 : 0.5}
            />
          </mesh>
          {/* Windows / Light strips */}
          {b.color === '#111116' && (
             <mesh position={[0, Math.random() * b.scale[1] * 0.4, b.scale[2]/2 + 0.01]}>
               <planeGeometry args={[b.scale[0] * 0.8, 0.2]} />
               <meshBasicMaterial color="#ffffaa" />
             </mesh>
          )}
        </group>
      ))}

      {/* Center Platform (Spawn) */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 0.2, 32]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[4.5, 4.8, 32]} />
        <meshBasicMaterial color="#00ffcc" />
      </mesh>

    </group>
  );
};

export default City;