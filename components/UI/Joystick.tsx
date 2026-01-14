import React, { useRef, useState, useEffect } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const origin = useRef({ x: 0, y: 0 });

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    origin.current = { x: centerX, y: centerY };
    setActive(true);
    handleMove(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    const maxDist = 40; // Max radius
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;

    setPosition({ x, y });
    
    // Normalize output -1 to 1
    onMove(x / maxDist, y / maxDist);
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (active) {
        e.preventDefault(); // Prevent scrolling
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => {
      if (active) handleEnd();
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [active]);

  return (
    <div 
      className="absolute bottom-8 left-8 w-32 h-32 pointer-events-auto select-none"
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
    >
      <div 
        ref={containerRef}
        className="w-full h-full rounded-full bg-white/10 border-2 border-white/20 relative backdrop-blur-sm"
      >
        <div 
          ref={knobRef}
          className="absolute w-12 h-12 rounded-full bg-white/50 shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(${position.x - 24}px, ${position.y - 24}px)`,
          }}
        />
      </div>
    </div>
  );
};

export default Joystick;