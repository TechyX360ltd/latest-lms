import React, { useEffect, useState } from 'react';

const COIN_COUNT = 24;
const COIN_EMOJI = '🪙'; // Use emoji for now, can swap for SVG if desired

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function CoinRain({ duration = 2500 }: { duration?: number }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {Array.from({ length: COIN_COUNT }).map((_, i) => {
        const left = random(0, 100);
        const delay = random(0, 1.2);
        const durationSec = random(1.5, 2.5);
        const size = random(32, 48);
        const rotate = random(-30, 30);
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-60px',
              fontSize: `${size}px`,
              transform: `rotate(${rotate}deg)`,
              animation: `coin-fall ${durationSec}s ${delay}s linear forwards`,
              filter: 'drop-shadow(0 2px 6px gold) drop-shadow(0 0 8px #ffd70088)'
            }}
          >
            {COIN_EMOJI}
          </span>
        );
      })}
      <style>{`
        @keyframes coin-fall {
          0% { opacity: 0; transform: translateY(-60px) scale(1) rotate(0deg); }
          10% { opacity: 1; }
          100% { opacity: 0.8; transform: translateY(100vh) scale(1.1) rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 