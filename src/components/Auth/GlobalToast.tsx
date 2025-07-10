import React, { useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'confirmation' | 'celebration';

const bgColors: Record<ToastType, string> = {
  success: '#dcfce7', // green-100
  error: '#fee2e2',   // red-100
  confirmation: '#fef3c7', // orange-100
  celebration: '#f0abfc', // purple-200
};
const textColors: Record<ToastType, string> = {
  success: '#166534', // green-700
  error: '#991b1b',   // red-800
  confirmation: '#b45309', // orange-700
  celebration: '#a21caf', // purple-700
};

export function GlobalToast({ message, details, type, duration = 5000, onClose }: {
  message: string;
  details?: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = 100; // ms
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += interval;
      setProgress(100 - (elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(intervalRef.current!);
        onClose();
      }
    }, interval);
    return () => clearInterval(intervalRef.current!);
  }, [onClose, duration]);

  return (
    <div className="fixed top-8 left-0 z-50 flex justify-start pointer-events-none w-full">
      <div
        className={`rounded-lg shadow-lg px-6 py-4 max-w-md w-full animate-slide-in-left pointer-events-auto relative ml-4 ${type === 'celebration' ? 'ring-4 ring-pink-300 ring-offset-2' : ''}`}
        style={{ background: bgColors[type], color: textColors[type], boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        {type === 'celebration' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl select-none pointer-events-none animate-bounce">
            🎉✨🎊
          </div>
        )}
        <div className="font-semibold mb-2 flex items-center gap-2">
          {type === 'celebration' && <span className="text-2xl">🥳</span>}
          {message}
        </div>
        {details && <div className="text-xs mb-2" style={{ color: textColors[type], opacity: 0.8 }}>{details}</div>}
        <div className="absolute top-2 right-4 cursor-pointer text-lg" style={{ color: textColors[type] }} onClick={onClose}>&times;</div>
        <div className="w-full h-1 bg-gray-200 rounded mt-2 overflow-hidden">
          <div
            className="h-full transition-all duration-100 linear"
            style={{ width: `${progress}%`, background: textColors[type] }}
          />
        </div>
      </div>
      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .confetti {
          animation: confetti-fall 1.5s ease-in-out;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-40px) scale(1.2); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(60px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
} 