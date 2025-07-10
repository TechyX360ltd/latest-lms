import React from 'react';
import { 
  TrendingUp, 
  Coins, 
  Flame, 
  Award, 
  Target, 
  Star,
  Calendar,
  Trophy,
  Zap,
  Crown,
  Gift,
  BarChart3
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

export function UserStats() {
  const { stats, loading, error } = useGamification();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Stats</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Stats Available</h3>
        <p className="text-gray-600">Start learning to see your statistics</p>
      </div>
    );
  }

  const completionPercentage = stats.total_courses > 0 
    ? Math.round((stats.completed_courses / stats.total_courses) * 100) 
    : 0;

  const streakProgress = stats.longest_streak > 0 
    ? Math.round((stats.current_streak / stats.longest_streak) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Points */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Rank</div>
              <div className="text-sm font-medium text-gray-900">#{stats.rank || 'N/A'}</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.points.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Points</div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((stats.points / 10000) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.min((stats.points / 10000) * 100, 100).toFixed(1)}% to next level
          </div>
        </div>

        {/* Coins */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Available</div>
              <div className="text-sm font-medium text-gray-900">Spend</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.coins.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Coins</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Gift className="w-3 h-3" />
            {stats.purchases_count || 0} items purchased
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Best</div>
              <div className="text-sm font-medium text-gray-900">{stats.longest_streak} days</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.current_streak}
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${streakProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {streakProgress}% of best streak
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-sm font-medium text-gray-900">{stats.total_badges || 0}</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.badges?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Badges Earned</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Crown className="w-3 h-3" />
            {stats.rare_badges_count || 0} rare badges
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
              <p className="text-sm text-gray-600">Your learning journey</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed Courses</span>
              <span className="font-medium text-gray-900">{stats.completed_courses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Courses</span>
              <span className="font-medium text-gray-900">{stats.total_courses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-600">
              {completionPercentage}% completion rate
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activity Summary</h3>
              <p className="text-sm text-gray-600">Your recent activity</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lessons Completed</span>
              <span className="font-medium text-gray-900">{stats.lessons_completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Assignments Submitted</span>
              <span className="font-medium text-gray-900">{stats.assignments_submitted || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Days Active</span>
              <span className="font-medium text-gray-900">{stats.days_active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Active</span>
              <span className="font-medium text-gray-900">
                {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {stats.recent_events && stats.recent_events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
              <p className="text-sm text-gray-600">Your latest accomplishments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recent_events.slice(0, 6).map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {event.description || event.event_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.points_earned > 0 && (
                    <span className="text-xs font-medium text-blue-600">
                      +{event.points_earned} pts
                    </span>
                  )}
                  {event.coins_earned > 0 && (
                    <span className="text-xs font-medium text-yellow-600">
                      +{event.coins_earned} coins
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Daily Goal</h3>
          </div>
          <p className="text-blue-100 mb-4">Complete at least one lesson today</p>
          <div className="w-full bg-blue-400 rounded-full h-2 mb-2">
            <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-blue-200">60% complete</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Weekly Challenge</h3>
          </div>
          <p className="text-green-100 mb-4">Complete 5 courses this week</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">3/5</span>
            <span className="text-green-200">courses</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Rewards</h3>
          </div>
          <p className="text-purple-100 mb-4">Unlock new badges and rewards</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{stats.badges?.length || 0}</span>
            <span className="text-purple-200">badges earned</span>
          </div>
        </div>
      </div>
    </div>
  );
} 