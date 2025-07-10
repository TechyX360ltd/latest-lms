import React, { useEffect, useRef, useState } from 'react';

export function ConfirmEmailToast({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const totalDuration = 20000; // 20 seconds
    const interval = 100; // ms
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += interval;
      setProgress(100 - (elapsed / totalDuration) * 100);
      if (elapsed >= totalDuration) {
        clearInterval(intervalRef.current!);
        onClose();
      }
    }, interval);
    return () => clearInterval(intervalRef.current!);
  }, [onClose]);

  return (
    <div className="fixed top-8 left-0 z-50 flex justify-start pointer-events-none w-full">
      <div
        className="rounded-lg shadow-lg px-6 py-4 max-w-md w-full animate-slide-in-left pointer-events-auto relative ml-4"
        style={{ background: 'rgba(251,191,36,0.3)', color: '#b45309', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      >
        <div className="font-semibold mb-2">Please check your email and confirm your account to continue.</div>
        <div className="absolute top-2 right-4 cursor-pointer text-lg" style={{ color: '#b45309' }} onClick={onClose}>&times;</div>
        <div className="w-full h-1 bg-orange-200 rounded mt-2 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-100 linear"
            style={{ width: `${progress}%` }}
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
      `}</style>
    </div>
  );
} 