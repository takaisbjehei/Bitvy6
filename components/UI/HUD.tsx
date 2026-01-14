import React from 'react';
import Chat from './Chat';
import Joystick from './Joystick';
import { LocalPlayerState } from '../../types';

interface HUDProps {
  localPlayer: LocalPlayerState;
  movementRef: React.MutableRefObject<{ x: number; y: number }>;
}

const HUD: React.FC<HUDProps> = ({ localPlayer, movementRef }) => {
  const handleJoystickMove = (x: number, y: number) => {
    movementRef.current = { x, y };
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 pointer-events-auto">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">Status</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-mono">ONLINE</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">ID: {localPlayer.id.slice(0, 8)}...</div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 pointer-events-auto hidden md:block">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Controls</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>Move</span> <span className="text-white">WASD / Arrows</span>
            <span>Chat</span> <span className="text-white">Focus Box</span>
          </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="flex justify-between items-end w-full">
        {/* Joystick - Visible on all devices for this demo, or hide on desktop via CSS if desired */}
        <div className="pointer-events-auto">
             <Joystick onMove={handleJoystickMove} />
        </div>

        {/* Chat */}
        <div className="pointer-events-auto w-full max-w-md ml-4 mb-4">
          <Chat localPlayer={localPlayer} />
        </div>
      </div>
    </div>
  );
};

export default HUD;