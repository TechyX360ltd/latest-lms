import React, { useState } from 'react';
import { 
  Trophy, 
  Coins, 
  Flame, 
  Award, 
  TrendingUp, 
  Store, 
  Target,
  Star,
  Calendar,
  Zap,
  Crown,
  Gift
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { UserStats } from './UserStats';
import { Leaderboard } from './Leaderboard';
import { BadgeCollection } from './BadgeCollection';
import { StoreFront } from './StoreFront';
import { ActivityFeed } from './ActivityFeed';

type TabType = 'overview' | 'badges' | 'store' | 'leaderboard' | 'activity';

export function GamificationDashboard() {
  const { stats, loading, error } = useGamification();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
    { id: 'activity', label: 'Activity', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Gamification</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gamification Center</h1>
              <p className="text-purple-100">Track your progress, earn rewards, and compete with others</p>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {/* Quick Stats */}
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-yellow-300" />
                  <span className="text-2xl font-bold">{stats?.coins || 0}</span>
                </div>
                <span className="text-sm text-purple-200">Coins</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-green-300" />
                  <span className="text-2xl font-bold">{stats?.points || 0}</span>
                </div>
                <span className="text-sm text-purple-200">Points</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-red-300" />
                  <span className="text-2xl font-bold">{stats?.current_streak || 0}</span>
                </div>
                <span className="text-sm text-purple-200">Streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8" />
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
                  <span className="text-2xl font-bold">{stats?.badges?.length || 0}</span>
                  <span className="text-purple-200">badges earned</span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <UserStats />

            {/* Recent Achievements */}
            {stats?.recent_events && stats.recent_events.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Recent Achievements
                </h3>
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
                          <span className="text-sm font-medium text-blue-600">
                            +{event.points_earned} pts
                          </span>
                        )}
                        {event.coins_earned > 0 && (
                          <span className="text-sm font-medium text-yellow-600">
                            +{event.coins_earned} coins
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

        {activeTab === 'badges' && <BadgeCollection />}
        {activeTab === 'store' && <StoreFront />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'activity' && <ActivityFeed />}
      </div>
    </div>
  );
} 