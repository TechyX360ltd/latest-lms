import React, { useState } from 'react';
import { 
  Trophy, 
  Coins, 
  Flame, 
  Award, 
  Star, 
  Target,
  Zap,
  Crown,
  Gift,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { GamificationDashboard } from './GamificationDashboard';
import { GamificationWidget } from './GamificationWidget';
import { GamificationNotification, GamificationNotificationManager, useGamificationNotifications } from './GamificationNotification';

export function GamificationDemo() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'widget' | 'notifications'>('dashboard');
  const { notifications, addNotification, removeNotification } = useGamificationNotifications();

  const demoNotifications = [
    {
      id: '1',
      user_id: 'demo',
      event_type: 'badge_earned',
      points_earned: 50,
      coins_earned: 25,
      description: 'Earned the "First Course" badge!',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'demo',
      event_type: 'streak_milestone',
      points_earned: 200,
      coins_earned: 100,
      description: 'Reached 7-day streak milestone!',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      user_id: 'demo',
      event_type: 'course_completed',
      points_earned: 100,
      coins_earned: 50,
      description: 'Completed "React Fundamentals" course!',
      created_at: new Date().toISOString()
    }
  ];

  const triggerDemoNotification = (index: number) => {
    addNotification(demoNotifications[index]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gamification Demo</h1>
              <p className="text-purple-100">Explore the gamification features of our LMS</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => triggerDemoNotification(0)}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Award className="w-4 h-4" />
                Badge Notification
              </button>
              <button
                onClick={() => triggerDemoNotification(1)}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Flame className="w-4 h-4" />
                Streak Notification
              </button>
              <button
                onClick={() => triggerDemoNotification(2)}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Target className="w-4 h-4" />
                Course Notification
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Full Dashboard', icon: Trophy },
              { id: 'widget', label: 'Widget Demo', icon: Gift },
              { id: 'notifications', label: 'Notifications', icon: Star }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Full Gamification Dashboard</h3>
              <p className="text-blue-700 mb-4">
                This is the complete gamification dashboard with all features including stats, leaderboard, badges, store, and activity feed.
              </p>
            </div>
            <GamificationDashboard />
          </div>
        )}

        {activeTab === 'widget' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Gamification Widget</h3>
              <p className="text-green-700 mb-4">
                This compact widget can be embedded in any page to show user stats and quick actions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Compact Widget</h4>
                <GamificationWidget compact={true} />
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Full Widget</h4>
                <GamificationWidget compact={false} />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-md font-semibold text-yellow-900 mb-2">Widget Features</h4>
              <ul className="text-yellow-700 space-y-1">
                <li>• Compact and full-size modes</li>
                <li>• Real-time stats display</li>
                <li>• Quick action buttons</li>
                <li>• Expandable details</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Real-time Notifications</h3>
              <p className="text-purple-700 mb-4">
                Gamification notifications appear in real-time when users earn achievements, points, or coins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Award className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-700">Badge Earned</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">Streak Milestone</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">Course Completed</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">Points Earned</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Features</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Auto-dismiss with progress bar</li>
                  <li>• Different colors per event type</li>
                  <li>• Animated icons and effects</li>
                  <li>• Points and coins display</li>
                  <li>• Stackable notifications</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Demo Controls</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => triggerDemoNotification(0)}
                    className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Award className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Trigger Badge</span>
                  </button>
                  <button
                    onClick={() => triggerDemoNotification(1)}
                    className="w-full flex items-center gap-2 p-2 bg-red-50 hover:bg-red-100 rounded transition-colors"
                  >
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Trigger Streak</span>
                  </button>
                  <button
                    onClick={() => triggerDemoNotification(2)}
                    className="w-full flex items-center gap-2 p-2 bg-green-50 hover:bg-green-100 rounded transition-colors"
                  >
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Trigger Course</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Manager */}
      <GamificationNotificationManager
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  );
} 