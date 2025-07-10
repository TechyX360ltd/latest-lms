import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Search, X } from 'lucide-react';
import { FaCoins } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useData';

export function Header() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Calculate unread notifications for current user
  const unreadCount = notifications.filter(notification =>
        notification.recipients.some(recipient => 
          recipient.userId === user?.id && !recipient.isRead
        )
  ).length;

  // Get recent notifications for dropdown
  const recentNotifications = notifications
        .filter(notification =>
          notification.recipients.some(recipient => recipient.userId === user?.id)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleNotificationClick = () => {
      setShowNotificationDropdown(!showNotificationDropdown);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'announcement':
        return '📢';
      default:
        return 'ℹ️';
    }
  };

  const isNotificationRead = (notification: any) => {
    const recipient = notification.recipients.find((r: any) => r.userId === user?.id);
    return recipient?.isRead || false;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotificationDropdown]);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Search */}
          <div className="flex items-center gap-4">
            {/* Logo - Hidden on mobile when sidebar is present */}
            <div className="hidden lg:flex items-center gap-3">
              <img 
                src="/BLACK-1-removebg-preview.png" 
                alt="TECHYX 360" 
                className="h-8 w-auto"
              />
            </div>
            
            {/* Search - Responsive */}
            <div className="relative block ml-12 md:ml-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={user?.role === 'admin' ? 'Search users, courses...' : 'Search courses...'}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 lg:w-80"
              />
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {/* Right side - Notifications and User */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Coin Balance for Learners */}
            {user?.role === 'learner' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg border border-yellow-200 mr-2">
                <FaCoins className="text-yellow-500 w-5 h-5" />
                <span className="font-bold text-yellow-700 text-sm">{user.coins ?? 0}</span>
              </div>
            )}
            {/* Enhanced Notification Bell for All Users */}
              <div className="relative notification-dropdown">
                <button 
                  onClick={handleNotificationClick}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>

                {/* Notification Dropdown - Responsive */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {recentNotifications.map((notification) => {
                            const isRead = isNotificationRead(notification);
                            return (
                              <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                  !isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-lg flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium ${!isRead ? 'text-blue-900' : 'text-gray-900'} line-clamp-1`}>
                                      {notification.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-gray-500">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                      </span>
                                      {!isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    
                    {recentNotifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <button 
                          onClick={() => {
                            setShowNotificationDropdown(false);
                            const notificationsPath = user?.role === 'admin' ? '/admin/notifications' : '/dashboard/notifications';
                            window.location.href = notificationsPath;
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All Notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            
            {/* User Profile - Responsive */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {(user?.firstName?.[0] || '').toUpperCase()}{(user?.lastName?.[0] || '').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-gray-900 leading-tight">{user?.firstName}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
              </div>
              
              <button
                onClick={handleLogoutClick}
                className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={user?.role === 'admin' ? 'Search users, courses...' : 'Search courses...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
              <button
                onClick={handleCancelLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Are you sure you want to logout?</p>
                  <p className="text-sm text-gray-600">You will need to sign in again to access your account.</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}