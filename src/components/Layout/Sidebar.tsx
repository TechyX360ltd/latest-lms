import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  Settings, 
  CreditCard, 
  BarChart3,
  FolderOpen,
  PlayCircle,
  Award,
  Bell,
  Eye,
  TrendingUp,
  User,
  Building,
  Menu,
  X,
  UserCheck,
  Calendar as CalendarIcon,
  Trophy,
  Link as LinkIcon,
  Gift,
  Briefcase,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUsers } from '../../hooks/useData';
import { useAllCourses } from '../../hooks/useData';
import { useNotifications } from '../../hooks/useData';
import { useGamification } from '../../hooks/useGamification';
import { useToast } from '../../components/Auth/ToastContext';

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchIconRef = useRef<HTMLButtonElement>(null);

  // Global search hooks
  const { users } = useUsers();
  const { courses: allCourses } = useAllCourses();
  const { notifications } = useNotifications();
  const { badges } = useGamification();
  // For gifts, you may need to add a useGifts hook or fetch from supabase if not already available

  const learnerMenuItems: SidebarMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/dashboard/courses' },
    { id: 'browse', label: 'Browse Courses', icon: FolderOpen, path: '/dashboard/browse' },
    { id: 'job-board', label: 'Job Board', icon: Briefcase, path: '/dashboard/job-board' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
    { id: 'certificates', label: 'My Certificates', icon: Award, path: '/dashboard/certificates' },
    { id: 'progress', label: 'Progress', icon: BarChart3, path: '/dashboard/progress' },
    { id: 'calendar', label: 'My Calendar', icon: CalendarIcon, path: '/dashboard/calendar' },
    { id: 'gamification', label: 'Gamification', icon: Trophy, path: '/dashboard/gamification' },
    { id: 'referrals', label: 'My Referrals', icon: LinkIcon, path: '/dashboard/referrals' },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
    { id: 'my-store-items', label: 'My Store Items', icon: Gift, path: '/dashboard/my-store-items' },
  ];

  const adminMenuItems: SidebarMenuItem[] = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/admin/overview' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { id: 'schools', label: 'Schools', icon: Building, path: '/admin/schools' },
    { id: 'progress-tracking', label: 'Progress Tracking', icon: TrendingUp, path: '/admin/progress-tracking' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { id: 'certificates', label: 'Certificate Preview', icon: Eye, path: '/admin/certificates' },
    { id: 'categories', label: 'Categories', icon: FolderOpen, path: '/admin/categories' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'admin-events', label: 'My Events', icon: CalendarIcon, path: '/admin/events' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
    { id: 'profile', label: 'Profile', icon: User, path: '/admin/profile' },
  ];

  // Instructor menu items
  const instructorMenuItems: SidebarMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/instructor/dashboard' },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen, path: '/instructor/courses' },
    { id: 'enrollments', label: 'Enrollments', icon: Users, path: '/instructor/enrollments' },
    { id: 'earnings', label: 'Earnings', icon: CreditCard, path: '/instructor/earnings' },
    { id: 'job-board', label: 'Job Board', icon: Briefcase, path: '/instructor/job-board' },
    { id: 'my-events', label: 'My Events', icon: CalendarIcon, path: '/instructor/events' },
    { id: 'schedule-session', label: 'Schedule Session', icon: CalendarIcon, path: '/instructor/schedule-session' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/instructor/notifications' },
    // Only one gamification link, pointing to the new instructor dashboard
    { id: 'instructor-gamification', label: 'Gamification', icon: Trophy, path: '/instructor/gamification' },
    { id: 'referrals', label: 'Referrals', icon: LinkIcon, path: '/instructor/referrals' },
    { id: 'my-reviews', label: 'My Reviews', icon: Award, path: '/instructor/reviews' },
    { id: 'profile', label: 'My Profile', icon: UserCheck, path: '/instructor/profile' },
  ];

  const menuItems =
    user?.role === 'admin'
      ? adminMenuItems
      : user?.role === 'instructor'
        ? instructorMenuItems
        : learnerMenuItems;

  // Global search results
  const globalResults = [
    ...users.filter(u =>
      (u.fullName || u.name || u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).map(u => ({ type: 'User', label: u.fullName || u.name || u.email, id: u.id, data: u })),
    ...allCourses.filter(c =>
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).map(c => ({ type: 'Course', label: c.title, id: c.id, data: c })),
    ...notifications.filter(n =>
      (n.title || n.message || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).map(n => ({ type: 'Notification', label: n.title, id: n.id, data: n })),
    ...badges.filter(b =>
      (b.name || b.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).map(b => ({ type: 'Badge', label: b.name, id: b.id, data: b })),
    // Add gifts if available
  ];

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const { showToast } = useToast();

  // Close modal on outside click
  useEffect(() => {
    if (!showSearchModal) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        searchIconRef.current &&
        !searchIconRef.current.contains(event.target as Node)
      ) {
        setShowSearchModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchModal]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky inset-y-0 left-0 z-40
        w-64 
        bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        h-screen overflow-y-auto top-0
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-200 relative">
          <div className="flex items-center justify-between gap-3">
            <img 
              src="/Skill Sage Logo.png" 
              alt="SKILL SAGE" 
              className="h-8 w-auto"
            />
            <button
              ref={searchIconRef}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Search"
              onClick={() => setShowSearchModal((v) => !v)}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {/* Search Dropdown for Mobile - floats above menu, only input and results */}
          {showSearchModal && (
            <div
              ref={modalRef}
              className="absolute right-0 left-0 mx-auto mt-2 w-full max-w-full bg-white rounded-xl shadow-lg z-50 border border-gray-200"
              style={{ minWidth: '0', width: '100%' }}
            >
              <div className="relative p-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search users, courses, notifications, badges..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSearchModal(false)}
                  aria-label="Close search dropdown"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-2 max-h-56 overflow-y-auto px-3 pb-3">
                {searchTerm.trim() === '' ? null : globalResults.length === 0 ? (
                  <li className="text-center text-gray-400 py-8">
                    <Search className="mx-auto mb-2 w-8 h-8 text-gray-200" />
                    <span>No results found.</span>
                  </li>
                ) : (
                  globalResults.map(result => (
                    <li key={result.type + '-' + result.id}>
                      <button
                        onClick={() => {
                          // Best-practice navigation for each type
                          if (result.type === 'User') {
                            if (user?.id === result.id) navigate(`/profile/${result.id}`);
                            else navigate(`/users/${result.id}`);
                          } else if (result.type === 'Course') {
                            navigate(`/courses/${result.id}`);
                          } else if (result.type === 'Notification') {
                            if (result.id) navigate(`/notifications/${result.id}`);
                            else navigate(`/notifications`);
                          } else if (result.type === 'Badge') {
                            if (result.id) navigate(`/badges/${result.id}`);
                            else navigate(`/gamification`);
                          } else if (result.type === 'Gift') {
                            navigate(`/dashboard/gifts`);
                          } else {
                            showToast('No detail page available for this item.', 'info');
                          }
                          setShowSearchModal(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-blue-50 transition-all"
                      >
                        <span className="text-xs font-semibold text-gray-400 w-20">{result.type}</span>
                        <span className="font-medium truncate">{result.label}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Footer */}
        <div className="lg:hidden p-4 border-t border-gray-200 mt-auto">
          <div className="text-center">
            <p className="text-xs text-gray-500">© 2024 SKILL SAGE</p>
            <p className="text-xs text-gray-400">Learning Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}