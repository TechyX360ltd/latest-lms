import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  TrendingUp, 
  Coins, 
  Award, 
  Flame, 
  Target,
  Zap,
  CheckCircle,
  Gift,
  Crown
} from 'lucide-react';
import { GamificationEvent } from '../../types/gamification';

interface GamificationNotificationProps {
  event: GamificationEvent;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function GamificationNotification({ 
  event, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: GamificationNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close with progress bar
    if (autoClose) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            handleClose();
            return 0;
          }
          return prev - (100 / (duration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }

    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'course_completed': return <Target className="w-5 h-5 text-green-500" />;
      case 'lesson_completed': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'assignment_submitted': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'badge_earned': return <Award className="w-5 h-5 text-indigo-500" />;
      case 'streak_milestone': return <Flame className="w-5 h-5 text-red-500" />;
      case 'points_earned': return <Coins className="w-5 h-5 text-yellow-500" />;
      default: return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'login': return 'border-blue-200 bg-blue-50';
      case 'course_completed': return 'border-green-200 bg-green-50';
      case 'lesson_completed': return 'border-yellow-200 bg-yellow-50';
      case 'assignment_submitted': return 'border-purple-200 bg-purple-50';
      case 'badge_earned': return 'border-indigo-200 bg-indigo-50';
      case 'streak_milestone': return 'border-red-200 bg-red-50';
      case 'points_earned': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'login': return 'Daily Login Bonus!';
      case 'course_completed': return 'Course Completed!';
      case 'lesson_completed': return 'Lesson Completed!';
      case 'assignment_submitted': return 'Assignment Submitted!';
      case 'badge_earned': return 'Badge Earned!';
      case 'streak_milestone': return 'Streak Milestone!';
      case 'points_earned': return 'Points Earned!';
      default: return 'Achievement Unlocked!';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`relative max-w-sm w-full border-2 rounded-lg shadow-lg ${getEventColor(event.event_type)}`}>
        {/* Progress Bar */}
        {autoClose && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                {getEventIcon(event.event_type)}
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {getEventTitle(event.event_type)}
                </h4>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {event.description || `Completed ${event.event_type.replace('_', ' ')}`}
              </p>

              {/* Rewards */}
              <div className="flex items-center gap-3">
                {event.points_earned > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="w-3 h-3 text-blue-500" />
                    <span className="font-medium text-blue-600">+{event.points_earned} points</span>
                  </div>
                )}
                {event.coins_earned > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Coins className="w-3 h-3 text-yellow-500" />
                    <span className="font-medium text-yellow-600">+{event.coins_earned} coins</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Special Badge Animation */}
        {event.event_type === 'badge_earned' && (
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-pulse">
              <Crown className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {/* Streak Animation */}
        {event.event_type === 'streak_milestone' && (
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center animate-pulse">
              <Flame className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Notification Manager Component
interface NotificationManagerProps {
  notifications: GamificationEvent[];
  onRemoveNotification: (eventId: string) => void;
}

export function GamificationNotificationManager({ 
  notifications, 
  onRemoveNotification 
}: NotificationManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((event) => (
        <GamificationNotification
          key={event.id}
          event={event}
          onClose={() => onRemoveNotification(event.id)}
          autoClose={true}
          duration={5000}
        />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useGamificationNotifications() {
  const [notifications, setNotifications] = useState<GamificationEvent[]>([]);

  const addNotification = (event: GamificationEvent) => {
    setNotifications(prev => [...prev, event]);
  };

  const removeNotification = (eventId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== eventId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
} 