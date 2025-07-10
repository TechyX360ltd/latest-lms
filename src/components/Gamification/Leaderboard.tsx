import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Trophy, 
  Medal, 
  TrendingUp, 
  Flame, 
  Award,
  Star,
  Users,
  Calendar
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { LeaderboardEntry } from '../../types/gamification';

export function Leaderboard() {
  const { loadLeaderboard, leaderboard, loading, error } = useGamification();
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard(20);
  }, [loadLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Leaderboard</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>
          <p className="text-gray-600">Top learners by points earned</p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' }
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setTimeframe(period.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === period.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Top Performers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {leaderboard[1].user_name.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Trophy className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900">{leaderboard[1].user_name}</h4>
                <p className="text-gray-600 text-sm">{leaderboard[1].points.toLocaleString()} points</p>
                <p className="text-gray-500 text-xs">#{leaderboard[1].rank}</p>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="text-center transform scale-110">
                <div className="relative mb-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {leaderboard[0].user_name.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-lg">{leaderboard[0].user_name}</h4>
                <p className="text-yellow-600 font-semibold">{leaderboard[0].points.toLocaleString()} points</p>
                <p className="text-yellow-500 text-sm font-medium">#{leaderboard[0].rank}</p>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {leaderboard[2].user_name.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Medal className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900">{leaderboard[2].user_name}</h4>
                <p className="text-gray-600 text-sm">{leaderboard[2].points.toLocaleString()} points</p>
                <p className="text-gray-500 text-xs">#{leaderboard[2].rank}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Complete Rankings</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr 
                  key={entry.user_id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(entry)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadge(entry.rank)}`}>
                        #{entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {entry.user_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.user_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.user_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {entry.points.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">🪙</span>
                      <span className="text-sm font-medium text-gray-900">
                        {entry.coins.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {entry.current_streak} days
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {entry.badges_count}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {selectedUser.user_name.charAt(0)}
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedUser.user_name}</h4>
                <p className="text-gray-600">{selectedUser.user_email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.points.toLocaleString()}</div>
                  <div className="text-sm text-blue-700">Points</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{selectedUser.coins.toLocaleString()}</div>
                  <div className="text-sm text-yellow-700">Coins</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedUser.current_streak}</div>
                  <div className="text-sm text-red-700">Current Streak</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.badges_count}</div>
                  <div className="text-sm text-purple-700">Badges</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 