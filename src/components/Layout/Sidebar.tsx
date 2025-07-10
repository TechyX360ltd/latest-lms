import React, { useState } from 'react';
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
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();

  const learnerMenuItems: SidebarMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/dashboard/courses' },
    { id: 'browse', label: 'Browse Courses', icon: FolderOpen, path: '/dashboard/browse' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
    { id: 'certificates', label: 'My Certificates', icon: Award, path: '/dashboard/certificates' },
    { id: 'progress', label: 'Progress', icon: BarChart3, path: '/dashboard/progress' },
    { id: 'calendar', label: 'My Calendar', icon: CalendarIcon, path: '/dashboard/calendar' },
    { id: 'gamification', label: 'Gamification', icon: Trophy, path: '/dashboard/gamification' },
    { id: 'referrals', label: 'My Referrals', icon: LinkIcon, path: '/dashboard/referrals' },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
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
    { id: 'instructor-dashboard', label: 'Instructor Dashboard', icon: Home, path: '/instructor/dashboard' },
    { id: 'instructor-profile', label: 'Instructor Profile', icon: UserCheck, path: '/instructor/profile' },
    { id: 'instructor-events', label: 'My Events', icon: CalendarIcon, path: '/instructor/events' },
  ];

  const menuItems =
    user?.role === 'admin'
      ? adminMenuItems
      : user?.role === 'instructor'
      ? [
          ...learnerMenuItems,
          ...instructorMenuItems,
        ]
      : learnerMenuItems;

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
        <div className="lg:hidden p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src="/BLACK-1-removebg-preview.png" 
              alt="TECHYX 360" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        <nav className="p-4">
          {/* Back to My Courses link for learners */}
          {user?.role !== 'admin' && user?.role !== 'instructor' && (
            <div className="mb-4">
              <button
                onClick={() => handleMenuItemClick('/dashboard/courses')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-all duration-200 mb-2"
              >
                <BookOpen className="w-5 h-5" />
                Back to My Courses
              </button>
            </div>
          )}
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
            <p className="text-xs text-gray-500">© 2024 TECHYX 360</p>
            <p className="text-xs text-gray-400">Learning Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}