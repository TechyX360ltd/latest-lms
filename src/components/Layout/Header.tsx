import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Search, X, GraduationCap, CheckCircle, BookOpen, FileText, CreditCard, Star, Tag, MessageSquare, Award } from 'lucide-react';
import { FaCoins } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, useUsers, useCourses, useCategories, usePayments } from '../../hooks/useData';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../hooks/useGamification';
import { supabase } from '../../lib/supabase';

// Enhanced search result types
interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'category' | 'module' | 'lesson' | 'assignment' | 'notification' | 'payment' | 'coupon' | 'rating';
  title: string;
  subtitle?: string;
  description?: string;
  icon: React.ReactNode;
  url: string;
  relevance: number;
}

export function Header() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const { stats } = useGamification();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Enhanced global search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { users } = useUsers();
  const { courses } = useCourses();
  const { categories } = useCategories();
  const { payments } = usePayments();
  const navigate = useNavigate();

  // Enhanced search function
  const performGlobalSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const results: SearchResult[] = [];
    const searchLower = term.toLowerCase();

    try {
      // 1. Search Users
      const filteredUsers = users.filter((u: any) =>
        (u.fullName || '').toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower) ||
        (u.first_name || '').toLowerCase().includes(searchLower) ||
        (u.last_name || '').toLowerCase().includes(searchLower)
      );
      
      filteredUsers.forEach((u: any) => {
        results.push({
          id: u.id,
          type: 'user',
          title: u.fullName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          subtitle: u.email,
          description: `${u.role} • ${u.verification_status || 'Not verified'}`,
          icon: <User className="w-4 h-4 text-blue-500" />,
          url: `/admin/users/${u.id}`,
          relevance: 10
        });
      });

      // 2. Search Courses
      const filteredCourses = courses.filter((c: any) =>
        (c.title || '').toLowerCase().includes(searchLower) ||
        (c.description || '').toLowerCase().includes(searchLower) ||
        (c.slug || '').toLowerCase().includes(searchLower)
      );
      
      filteredCourses.forEach((c: any) => {
        results.push({
          id: c.id,
          type: 'course',
          title: c.title,
          subtitle: c.instructor_name || 'Unknown Instructor',
          description: c.description?.substring(0, 100) + (c.description?.length > 100 ? '...' : ''),
          icon: <GraduationCap className="w-4 h-4 text-green-500" />,
          url: `/courses/${c.id}`,
          relevance: 9
        });
      });

      // 3. Search Categories
      const filteredCategories = categories.filter((c: any) =>
        (c.name || '').toLowerCase().includes(searchLower) ||
        (c.description || '').toLowerCase().includes(searchLower)
      );
      
      filteredCategories.forEach((c: any) => {
        results.push({
          id: c.id,
          type: 'category',
          title: c.name,
          subtitle: `${c.courseCount || 0} courses`,
          description: c.description,
          icon: <BookOpen className="w-4 h-4 text-purple-500" />,
          url: `/categories/${c.id}`,
          relevance: 8
        });
      });

      // 4. Search Modules and Lessons
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`);

      if (modulesData) {
        modulesData.forEach((mod: any) => {
          results.push({
            id: mod.id,
            type: 'module',
            title: mod.title,
            subtitle: `${mod.lessons?.length || 0} lessons`,
            description: mod.description,
            icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
            url: `/courses/${mod.course_id}/modules/${mod.id}`,
            relevance: 7
          });
        });
      }

      // 5. Search Assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, modules(title, course_id)')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%,instructions.ilike.%${term}%`);

      if (assignmentsData) {
        assignmentsData.forEach((assignment: any) => {
          results.push({
            id: assignment.id,
            type: 'assignment',
            title: assignment.title,
            subtitle: `${assignment.max_points || 0} points`,
            description: assignment.description,
            icon: <FileText className="w-4 h-4 text-orange-500" />,
            url: `/courses/${assignment.modules?.course_id}/assignments/${assignment.id}`,
            relevance: 6
          });
        });
      }

      // 6. Search Notifications
      const filteredNotifications = notifications.filter((n: any) =>
        (n.title || '').toLowerCase().includes(searchLower) ||
        (n.message || '').toLowerCase().includes(searchLower)
      );
      
      filteredNotifications.forEach((n: any) => {
        results.push({
          id: n.id,
          type: 'notification',
          title: n.title,
          subtitle: n.senderName,
          description: n.message?.substring(0, 100) + (n.message?.length > 100 ? '...' : ''),
          icon: <MessageSquare className="w-4 h-4 text-yellow-500" />,
          url: `/notifications/${n.id}`,
          relevance: 5
        });
      });

      // 7. Search Payments
      const filteredPayments = payments.filter((p: any) =>
        (p.id || '').toLowerCase().includes(searchLower) ||
        (p.status || '').toLowerCase().includes(searchLower)
      );
      
      filteredPayments.forEach((p: any) => {
        results.push({
          id: p.id,
          type: 'payment',
          title: `Payment ${p.id.substring(0, 8)}`,
          subtitle: `$${p.amount} • ${p.status}`,
          description: `Created ${new Date(p.createdAt).toLocaleDateString()}`,
          icon: <CreditCard className="w-4 h-4 text-green-600" />,
          url: `/admin/payments/${p.id}`,
          relevance: 4
        });
      });

      // 8. Search Coupons
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('*')
        .or(`code.ilike.%${term}%,description.ilike.%${term}%`);

      if (couponsData) {
        couponsData.forEach((coupon: any) => {
          results.push({
            id: coupon.id,
            type: 'coupon',
            title: coupon.code,
            subtitle: `${coupon.discount_percentage || coupon.discount_amount}% off`,
            description: coupon.description,
            icon: <Tag className="w-4 h-4 text-red-500" />,
            url: `/admin/coupons/${coupon.id}`,
            relevance: 3
          });
        });
      }

      // 9. Search Ratings/Reviews
      const { data: ratingsData } = await supabase
        .from('course_ratings')
        .select('*, users(first_name, last_name, email)')
        .or(`comment.ilike.%${term}%`);

      if (ratingsData) {
        ratingsData.forEach((rating: any) => {
          const userName = rating.users ? 
            `${rating.users.first_name || ''} ${rating.users.last_name || ''}`.trim() || rating.users.email : 
            'Anonymous';
          
          results.push({
            id: rating.id,
            type: 'rating',
            title: `${rating.rating}/5 stars`,
            subtitle: userName,
            description: rating.comment?.substring(0, 100) + (rating.comment?.length > 100 ? '...' : ''),
            icon: <Star className="w-4 h-4 text-yellow-400" />,
            url: `/courses/${rating.course_id}/reviews`,
            relevance: 2
          });
        });
      }

      // Sort by relevance and limit results
      const sortedResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);

      setSearchResults(sortedResults);

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performGlobalSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, users, courses, categories, notifications, payments]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!searchActive) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.global-search-dropdown') && !target.closest('.global-search-input')) {
        setSearchActive(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchActive(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [searchActive]);

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

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchActive(false);
    setSearchTerm('');
    navigate(result.url);
  };

  const getSearchPlaceholder = () => {
    if (user?.role === 'admin') {
      return 'Search users, courses, modules, assignments, payments...';
    } else if (user?.role === 'instructor') {
      return 'Search courses, modules, lessons, assignments...';
    } else {
      return 'Search courses, lessons, assignments...';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Search */}
          <div className="flex items-center gap-4">
            {/* Logo - Hidden on mobile when sidebar is present */}
            <div className="hidden lg:flex items-center gap-3">
              <img 
                src="/Skill Sage Logo.png" 
                alt="SKILL SAGE" 
                className="h-10 w-auto"
              />
            </div>
            
            {/* Enhanced Search - Responsive */}
            <div className="relative block ml-12 md:ml-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 lg:w-80 global-search-input"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setSearchActive(true);
                }}
                onFocus={() => setSearchActive(true)}
                autoComplete="off"
              />
              
              {/* Enhanced Autocomplete Dropdown */}
              {searchActive && (searchTerm.length > 0) && (
                <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto global-search-dropdown">
                  {searchLoading ? (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSearchResultClick(result)}
                        >
                          <div className="flex-shrink-0">
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-sm text-gray-600 truncate">{result.subtitle}</div>
                            )}
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No results found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
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
            {/* Coin Balance for Learners and Instructors */}
            {(user?.role === 'learner' || user?.role === 'instructor') && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg border border-yellow-200 mr-2">
                <FaCoins className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-700 text-sm">{stats?.coins ?? 0}</span>
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
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden relative">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {(user?.first_name?.[0] || '').toUpperCase()}{(user?.last_name?.[0] || '').toUpperCase()}
                    </span>
                  )}
                  {/* Facebook-style verification badge overlay (on top of the avatar) */}
                  {user?.role === 'instructor' && user?.verification_status === 'verified' && (
                    <span className="absolute -top-2 -right-2 z-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg" style={{ width: '18px', height: '18px' }}>
                      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="8" fill="#2563eb" />
                        <path d="M5.5 8.5l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <div className="text-left">
                  {user && (
                    <div className="font-bold text-gray-900 leading-tight text-sm">
                      {([user.first_name, user.last_name].filter(Boolean).join(' ') || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User')}
                    </div>
                  )}
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
                placeholder={getSearchPlaceholder()}
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