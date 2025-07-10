import React from 'react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  points: number;
  coins: number;
  avatar_url?: string;
}

export default function LeaderboardPopup({
  open,
  onClose,
  userRank,
  leaderboard,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userRank: number;
  leaderboard: LeaderboardEntry[];
  userId: string;
}) {
  if (!open || userRank > 10) return null;
  const userIdx = leaderboard.findIndex((u) => u.user_id === userId);
  const mini = leaderboard.slice(userIdx, userIdx + 4); // user + 3 below

  return (
    <div className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-sm transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto`}>
      <div className="relative bg-white shadow-2xl rounded-l-3xl h-full flex flex-col p-8 border-l-4 border-yellow-300 animate-slide-in-leaderboard">
        <button onClick={onClose} className="absolute top-4 right-6 text-2xl text-gray-400 hover:text-pink-500">&times;</button>
        <div className="flex flex-col items-center mb-6">
          <div className="text-4xl mb-2 animate-bounce">🏆</div>
          <div className="text-lg font-bold text-pink-700 mb-1">You moved up!</div>
          <div className="text-2xl font-extrabold text-yellow-600 mb-2">#{userRank} on the Leaderboard</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">🎉</span>
            <span className="text-lg font-semibold text-green-600">Congrats!</span>
            <span className="text-3xl">✨</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-100 to-pink-100 rounded-2xl p-4 shadow-inner">
          <div className="font-bold text-gray-700 mb-2">Mini Leaderboard</div>
          <ol className="space-y-2">
            {mini.map((entry) => (
              <li key={entry.user_id} className={`flex items-center gap-3 p-2 rounded-xl ${entry.user_id === userId ? 'bg-yellow-200 font-bold shadow' : 'bg-white'}`} style={{ boxShadow: entry.user_id === userId ? '0 2px 12px #facc15aa' : undefined }}>
                <span className="text-lg w-8 text-right">#{entry.rank}</span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt={entry.user_name} className="w-8 h-8 rounded-full border-2 border-yellow-400" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">{entry.user_name?.[0] || '?'}</span>
                )}
                <span className="flex-1 truncate">{entry.user_name}</span>
                <span className="text-yellow-700 font-semibold">{entry.points} pts</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-8 flex justify-center">
          <span className="text-2xl animate-pulse">🥳</span>
        </div>
      </div>
      <style>{`
        @keyframes slide-in-leaderboard {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-leaderboard {
          animation: slide-in-leaderboard 0.6s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
} 