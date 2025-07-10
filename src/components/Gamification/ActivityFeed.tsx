import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Star, 
  TrendingUp, 
  Flame, 
  Award, 
  Coins, 
  Target,
  Zap,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { GamificationEvent } from '../../types/gamification';

export function ActivityFeed() {
  const { stats, loadUserEvents, userEvents, loading, error } = useGamification();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<GamificationEvent | null>(null);

  useEffect(() => {
    loadUserEvents();
  }, [loadUserEvents]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'course_completed': return <Target className="w-5 h-5 text-green-500" />;
      case 'lesson_completed': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'assignment_submitted': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'badge_earned': return <Award className="w-5 h-5 text-indigo-500" />;
      case 'streak_milestone': return <Flame className="w-5 h-5 text-red-500" />;
      case 'points_earned': return <Coins className="w-5 h-5 text-yellow-500" />;
      default: return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'login': return 'bg-blue-50 border-blue-200';
      case 'course_completed': return 'bg-green-50 border-green-200';
      case 'lesson_completed': return 'bg-yellow-50 border-yellow-200';
      case 'assignment_submitted': return 'bg-purple-50 border-purple-200';
      case 'badge_earned': return 'bg-indigo-50 border-indigo-200';
      case 'streak_milestone': return 'bg-red-50 border-red-200';
      case 'points_earned': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'login': return 'Daily Login';
      case 'course_completed': return 'Course Completed';
      case 'lesson_completed': return 'Lesson Completed';
      case 'assignment_submitted': return 'Assignment Submitted';
      case 'badge_earned': return 'Badge Earned';
      case 'streak_milestone': return 'Streak Milestone';
      case 'points_earned': return 'Points Earned';
      default: return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - eventDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return eventDate.toLocaleDateString();
  };

  const filteredEvents = userEvents.filter(event => {
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesSearch = event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getEventTitle(event.event_type).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const eventTypes = [
    { id: 'all', label: 'All Activities' },
    { id: 'login', label: 'Logins' },
    { id: 'course_completed', label: 'Course Completions' },
    { id: 'lesson_completed', label: 'Lesson Completions' },
    { id: 'assignment_submitted', label: 'Assignments' },
    { id: 'badge_earned', label: 'Badges' },
    { id: 'streak_milestone', label: 'Streaks' },
    { id: 'points_earned', label: 'Points' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Activity</h3>
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
            <Calendar className="w-6 h-6 text-blue-500" />
            Activity Feed
          </h2>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>
        
        {/* Stats Summary */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{userEvents.length}</div>
          <div className="text-sm text-gray-600">Total Activities</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {eventTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${getEventColor(event.event_type)}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-4">
                  {/* Event Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      {getEventIcon(event.event_type)}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {getEventTitle(event.event_type)}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(event.created_at)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {event.description || `Completed ${event.event_type.replace('_', ' ')}`}
                    </p>

                    {/* Rewards */}
                    <div className="flex items-center gap-4">
                      {event.points_earned > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-600 font-medium">+{event.points_earned} points</span>
                        </div>
                      )}
                      {event.coins_earned > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="text-yellow-600 font-medium">+{event.coins_earned} coins</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Start learning to see your activity feed</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Points</h3>
              <p className="text-sm text-gray-600">All time earned</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.points || 0}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Coins</h3>
              <p className="text-sm text-gray-600">All time earned</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.coins || 0}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Current Streak</h3>
              <p className="text-sm text-gray-600">Days in a row</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.current_streak || 0}</div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Event Icon */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  {getEventIcon(selectedEvent.event_type)}
                </div>
                <h4 className="text-xl font-bold text-gray-900">{getEventTitle(selectedEvent.event_type)}</h4>
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{selectedEvent.description || `Completed ${selectedEvent.event_type.replace('_', ' ')}`}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">{selectedEvent.points_earned || 0}</div>
                    <div className="text-blue-700">Points Earned</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-900">{selectedEvent.coins_earned || 0}</div>
                    <div className="text-yellow-700">Coins Earned</div>
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 