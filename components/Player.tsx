import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { LocalPlayerState, WSPlayerState } from '../types';
import { PerspectiveCamera, Html, Trail } from '@react-three/drei';

interface PlayerControllerProps {
  localPlayer: LocalPlayerState;
  onMove: (state: Partial<WSPlayerState>) => void;
  movementRef: React.MutableRefObject<{ x: number; y: number }>;
}

const PlayerController: React.FC<PlayerControllerProps> = ({ localPlayer, onMove, movementRef }) => {
  const ref = useRef<Group>(null);
  const { camera } = useThree();
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  // Input handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.code]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.code]: false }));
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const speed = 10 * delta;
    
    const direction = new Vector3(0, 0, 0);

    // Keyboard Input
    if (keys['ArrowUp'] || keys['KeyW']) direction.z -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) direction.z += 1;
    if (keys['ArrowLeft'] || keys['KeyA']) direction.x -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) direction.x += 1;

    // Joystick Input
    if (movementRef.current) {
      direction.x += movementRef.current.x;
      direction.z += movementRef.current.y;
    }

    // Normalize diagonal movement
    if (direction.length() > 0) {
      if (direction.length() > 1) direction.normalize();
      direction.multiplyScalar(speed);
      
      // Rotate player visual to face direction
      const angle = Math.atan2(direction.x, direction.z);
      ref.current.rotation.y = angle;
    }

    ref.current.position.add(direction);

    // Camera Logic
    const cameraOffset = new Vector3(0, 8, 12); // Higher and further back
    const targetPos = ref.current.position.clone().add(cameraOffset);
    state.camera.position.lerp(targetPos, 0.1);
    state.camera.lookAt(ref.current.position);

    // Rate limit sending updates
    if (direction.length() > 0) {
      onMove({
        x: ref.current.position.x,
        y: ref.current.position.y,
        z: ref.current.position.z,
        rotation: ref.current.rotation.y,
        color: localPlayer.color,
        username: localPlayer.username
      });
    }
  });

  return (
    <group ref={ref} position={[0, 1, 0]}>
      {/* Player Light - Illuminates surroundings */}
      <pointLight position={[0, 2, 0]} intensity={2} distance={15} color={localPlayer.color} decay={2} />
      
      {/* Player Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial 
          color={localPlayer.color} 
          emissive={localPlayer.color}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Visor / Eyes */}
      <mesh position={[0, 0.4, 0.4]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.2]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Name Tag */}
      <Html position={[0, 1.8, 0]} center>
        <div className="bg-black/60 border border-white/20 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap font-bold">
          {localPlayer.username}
        </div>
      </Html>
    </group>
  );
};

export default PlayerController;