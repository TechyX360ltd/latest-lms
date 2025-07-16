import React, { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Store, 
  Award, 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Bell, 
  CreditCard, 
  FileText, 
  Plus,
  Edit,
  Eye,
  Target,
  UserPlus,
  FolderOpen,
  Calendar,
  TrendingUp,
  Gift,
  Tag,
  Star,
  MessageCircle,
  Briefcase,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const allAdminModules = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
  { id: 'instructors', label: 'Instructor Management', icon: Users, path: '/admin/instructors' },
  { id: 'courses', label: 'Course Management', icon: BookOpen, path: '/admin/courses' },
  { id: 'categories', label: 'Categories', icon: FolderOpen, path: '/admin/categories' },
  { id: 'job-board', label: 'Job Board', icon: Briefcase, path: '/admin/job-board' },
  { id: 'progress-tracking', label: 'Progress Tracking', icon: Target, path: '/admin/progress-tracking' },
  { id: 'payments', label: 'Payment Management', icon: CreditCard, path: '/admin/payments' },
  { id: 'schedule-session', label: 'Schedule Sessions', icon: Calendar, path: '/admin/schedule-session' },
  { id: 'store', label: 'Store Management', icon: Store, path: '/admin/store' },
  { id: 'cashouts', label: 'Cashout Requests', icon: Gift, path: '/admin/cashouts' },
  { id: 'badges', label: 'Badge Management', icon: Award, path: '/admin/badges' },
  { id: 'moderation', label: 'Gamification Moderation', icon: ShieldCheck, path: '/admin/moderation' },
  { id: 'live-support', label: 'Live Support', icon: MessageCircle, path: '/admin/live-support' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  { id: 'coupons', label: 'Coupon Management', icon: Tag, path: '/admin/coupons' },
  { id: 'ratings', label: 'Rating Management', icon: Star, path: '/admin/ratings' },
  { id: 'referrals', label: 'Referral Management', icon: Gift, path: '/admin/referrals' },
  { id: 'role-management', label: 'Role Management', icon: Shield, path: '/admin/role-management', superAdminOnly: true },
];

export function AdminSidebar() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // user.role, user.modules

  // Extend user type to allow for super_admin and modules
  type AdminUser = typeof user & { role?: string; modules?: string[] };
  const adminUser = user as AdminUser;

  if (!adminUser) return null;

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    // Always reset scroll position after a short delay on focus
    const resetScroll = () => {
      setTimeout(() => {
        sidebar.scrollTop = 0; // or your preferred default position
      }, 10);
    };
    sidebar.addEventListener('focusin', resetScroll);
    return () => {
      sidebar.removeEventListener('focusin', resetScroll);
    };
  }, []);

  const visibleModules =
    String(adminUser.role) === 'super_admin'
      ? allAdminModules
      : allAdminModules.filter(mod => adminUser.modules?.includes(mod.id));

  return (
    <aside ref={sidebarRef} className="w-64 h-full bg-white border-r border-gray-200 shadow-sm flex flex-col">
      <div className="px-6 py-6 flex items-center gap-2 text-2xl font-bold text-green-700">
        <LayoutDashboard className="w-7 h-7" /> Admin Panel
      </div>
      <nav className="flex-1 px-2 space-y-2 overflow-y-auto">
        {visibleModules.map(item => {
          if (item.superAdminOnly && String(adminUser.role) !== 'super_admin') return null;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
        {String(adminUser.role) === 'super_admin' && (
          <NavLink
            to="/admin/certificate-template-editor"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Award className="w-5 h-5" />
            Certificate Templates
          </NavLink>
        )}
      </nav>
    </aside>
  );
} 