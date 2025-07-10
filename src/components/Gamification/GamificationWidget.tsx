import React, { useState } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Flame, 
  Award, 
  Star,
  Trophy,
  Zap,
  Crown,
  Gift,
  ChevronRight,
  Target
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

interface GamificationWidgetProps {
  compact?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

export function GamificationWidget({ 
  compact = false, 
  showQuickActions = true,
  className = '' 
}: GamificationWidgetProps) {
  const { stats, loading, error } = useGamification();
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show widget if there's an error or no stats
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Your Progress
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span className="text-lg font-bold text-gray-900">{stats.points}</span>
            </div>
            <span className="text-xs text-gray-600">Points</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-lg font-bold text-gray-900">{stats.coins}</span>
            </div>
            <span className="text-xs text-gray-600">Coins</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3 h-3 text-red-500" />
              <span className="text-lg font-bold text-gray-900">{stats.current_streak}</span>
            </div>
            <span className="text-xs text-gray-600">Streak</span>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Badges</span>
                <span className="font-medium text-gray-900">{stats.badges?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Best Streak</span>
                <span className="font-medium text-gray-900">{stats.longest_streak} days</span>
              </div>
              {stats.rank && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rank</span>
                  <span className="font-medium text-gray-900">#{stats.rank}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Gamification Stats
          </h3>
          <p className="text-sm text-gray-600">Track your learning progress</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronRight className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xl font-bold text-gray-900">{stats.points.toLocaleString()}</span>
          </div>
          <span className="text-sm text-gray-600">Points</span>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xl font-bold text-gray-900">{stats.coins.toLocaleString()}</span>
          </div>
          <span className="text-sm text-gray-600">Coins</span>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-xl font-bold text-gray-900">{stats.current_streak}</span>
          </div>
          <span className="text-sm text-gray-600">Streak</span>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-xl font-bold text-gray-900">{stats.badges?.length || 0}</span>
          </div>
          <span className="text-sm text-gray-600">Badges</span>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">View Badges</span>
          </button>
          <button className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Crown className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Leaderboard</span>
          </button>
          <button className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Store</span>
          </button>
        </div>
      )}

      {/* Detailed Stats */}
      {showDetails && (
        <div className="pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Achievements</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Best Streak</span>
                  <span className="font-medium text-gray-900">{stats.longest_streak} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Badges</span>
                  <span className="font-medium text-gray-900">{stats.total_badges || 0}</span>
                </div>
                {stats.rank && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Leaderboard Rank</span>
                    <span className="font-medium text-gray-900">#{stats.rank}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Days Active</span>
                  <span className="font-medium text-gray-900">{stats.days_active || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Active</span>
                  <span className="font-medium text-gray-900">
                    {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items Purchased</span>
                  <span className="font-medium text-gray-900">{stats.purchases_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {stats.recent_events && stats.recent_events.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {stats.recent_events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-700 truncate">
                      {event.description || event.event_type}
                    </span>
                    <div className="flex items-center gap-2">
                      {event.points_earned > 0 && (
                        <span className="text-xs font-medium text-blue-600">
                          +{event.points_earned}
                        </span>
                      )}
                      {event.coins_earned > 0 && (
                        <span className="text-xs font-medium text-yellow-600">
                          +{event.coins_earned}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 