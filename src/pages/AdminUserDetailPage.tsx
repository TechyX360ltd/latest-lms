import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsers } from '../hooks/useData';
import { Edit } from 'lucide-react';
import { AddUser } from '../components/Admin/AddUser';
import { GamificationService } from '../lib/gamification';
import { supabase } from '../lib/supabase';
import { Mail, User, Phone, Briefcase, GraduationCap, MapPin, Award, Star, TrendingUp, Coins, Flame, ShoppingBag, CreditCard, CheckCircle, XCircle, Loader2, X, Download } from 'lucide-react';

const TABS = {
  learner: [
    { id: 'profile', label: 'Profile' },
    { id: 'courses', label: 'Course Data' },
    { id: 'activity', label: 'Activity' },
    { id: 'payments', label: 'Payments' },
    { id: 'gamification', label: 'Gamification' },
  ],
  instructor: [
    { id: 'profile', label: 'Profile' },
    { id: 'courses', label: 'Course Data' },
    { id: 'activity', label: 'Activity' },
    { id: 'payments', label: 'Payments' },
    { id: 'instructor', label: 'Instructor Data' },
    { id: 'gamification', label: 'Gamification' },
  ],
  admin: [
    { id: 'profile', label: 'Profile' },
    { id: 'activity', label: 'Activity' },
  ],
};

// Add a helper for number formatting
const formatNumber = (num: number | undefined) => num?.toLocaleString() ?? '0';

// Demo earnings data
type Earnings = {
  id: number;
  course: string;
  dateListed: string;
  courseFee: number;
  enrollments: number;
  status: 'Active' | 'Inactive';
  totalEarnings: number;
};
const demoEarnings: Earnings[] = [
  { id: 1, course: 'React for Beginners', dateListed: '2024-07-01', courseFee: 30, enrollments: 40, status: 'Active', totalEarnings: 1200 },
  { id: 2, course: 'Advanced TypeScript', dateListed: '2024-06-15', courseFee: 40, enrollments: 20, status: 'Active', totalEarnings: 800 },
  { id: 3, course: 'UI/UX Design', dateListed: '2024-06-10', courseFee: 50, enrollments: 30, status: 'Inactive', totalEarnings: 1500 },
  { id: 4, course: 'Node.js Mastery', dateListed: '2024-05-20', courseFee: 50, enrollments: 40, status: 'Active', totalEarnings: 2000 },
  { id: 5, course: 'Database Essentials', dateListed: '2024-05-01', courseFee: 30, enrollments: 30, status: 'Inactive', totalEarnings: 900 },
  { id: 6, course: 'Python Bootcamp', dateListed: '2024-04-20', courseFee: 55, enrollments: 20, status: 'Active', totalEarnings: 1100 },
  { id: 7, course: 'Cloud Fundamentals', dateListed: '2024-04-01', courseFee: 25, enrollments: 30, status: 'Active', totalEarnings: 750 },
];

const earningFilters = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

function filterEarnings(data: Earnings[], filter: string): Earnings[] {
  const now = new Date();
  if (filter === 'today') {
    return data.filter((e: Earnings) => new Date(e.dateListed).toDateString() === now.toDateString());
  }
  if (filter === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return data.filter((e: Earnings) => new Date(e.dateListed) >= weekAgo);
  }
  if (filter === 'month') {
    return data.filter((e: Earnings) => new Date(e.dateListed).getMonth() === now.getMonth() && new Date(e.dateListed).getFullYear() === now.getFullYear());
  }
  if (filter === 'year') {
    return data.filter((e: Earnings) => new Date(e.dateListed).getFullYear() === now.getFullYear());
  }
  return data;
}

export default function AdminUserDetailPage() {
  const { userSlug } = useParams();
  const { users, loading } = useUsers();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [itemsOwned, setItemsOwned] = useState<any[]>([]);

  // Activity pagination state
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 5;
  const paginatedActivities = stats?.recent_events?.slice((activityPage - 1) * activitiesPerPage, activityPage * activitiesPerPage) || [];
  const totalActivityPages = stats?.recent_events ? Math.ceil(stats.recent_events.length / activitiesPerPage) : 1;

  // Modal state for viewing course details
  const [viewCourse, setViewCourse] = useState<any | null>(null);

  // Earnings filter state
  const [earningsFilter, setEarningsFilter] = useState('all');
  const filteredEarnings = filterEarnings(demoEarnings, earningsFilter);

  // Checkbox selection state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const allSelected = filteredEarnings.length > 0 && filteredEarnings.every(e => selectedRows.includes(e.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedRows([]);
    else setSelectedRows(filteredEarnings.map(e => e.id));
  };
  const toggleSelectRow = (id: number) => {
    setSelectedRows(rows => rows.includes(id) ? rows.filter(r => r !== id) : [...rows, id]);
  };

  useEffect(() => {
    if (!loading && users) {
      // Find user by id
      const found = users.find((u: any) => u.id === userSlug);
      setUser(found || null);
    }
  }, [loading, users, userSlug]);

  useEffect(() => {
    if (!loading && user?.id) {
      setLoadingStats(true);
      GamificationService.getUserStats(user.id).then((data) => {
        setStats(data);
        setLoadingStats(false);
      });
      // Fetch items owned (store purchases)
      supabase.from('user_purchases').select('*, item:store_items(*)').eq('user_id', user.id).then(({ data }: { data: any[] | null }) => {
        setItemsOwned(data || []);
      });
    }
  }, [loading, user]);

  if (loading) return <div className="p-8 text-center">Loading user...</div>;
  if (!user) return <div className="p-8 text-center text-red-600">User not found.</div>;

  const roleKey = (user.role in TABS ? user.role : 'learner') as keyof typeof TABS;
  const roleTabs = TABS[roleKey];

  if (editMode) {
    return <AddUser onSave={() => setEditMode(false)} onCancel={() => setEditMode(false)} initialUser={user} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-stretch justify-start p-0">
      <div className="w-full bg-white rounded-2xl shadow-xl p-0 md:p-6 relative mt-0">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6 bg-white rounded-xl p-6 shadow-sm border">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center text-5xl font-extrabold text-blue-700 overflow-hidden">
            {user.avatar
              ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              : `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
            }
          </div>
          <div className="flex-1 flex flex-col gap-2 items-center md:items-start w-full">
            <div className="flex flex-col w-full gap-2">
              <div className="flex w-full items-center justify-between">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight whitespace-nowrap">{user.firstName} {user.lastName}</h2>
                <button
                  className="flex items-center gap-2 bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 ml-2 hover:bg-blue-700 transition shadow"
                  onClick={() => setEditMode(true)}
                  title="Edit User"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-lg">
              <Mail className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2 ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'instructor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {roleTabs.map((tab: { id: string; label: string }) => (
            <button
              key={tab.id}
              className={`py-3 px-6 font-semibold text-base rounded-t-xl transition-all duration-200 ${activeTab === tab.id ? 'bg-white border-x border-t border-b-0 border-blue-500 text-blue-700 shadow' : 'bg-gray-100 text-gray-500 hover:text-blue-600'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ minWidth: 120 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="p-0 md:p-2">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg"><User className="w-5 h-5 text-blue-500" /><span className="font-semibold">{user.firstName} {user.lastName}</span></div>
                <div className="flex items-center gap-3 text-lg"><Mail className="w-5 h-5 text-blue-500" /><span>{user.email}</span></div>
                <div className="flex items-center gap-3 text-lg"><Phone className="w-5 h-5 text-blue-500" /><span>{user.phone || '-'}</span></div>
                <div className="flex items-center gap-3 text-lg"><MapPin className="w-5 h-5 text-blue-500" /><span>{user.location || '-'}</span></div>
                <div className="flex items-center gap-3 text-lg"><Briefcase className="w-5 h-5 text-blue-500" /><span>{user.occupation || '-'}</span></div>
                <div className="flex items-center gap-3 text-lg"><GraduationCap className="w-5 h-5 text-blue-500" /><span>{user.education || '-'}</span></div>
                <div className="flex items-center gap-3 text-lg"><Star className="w-5 h-5 text-yellow-500" /><span>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg"><Award className="w-5 h-5 text-purple-500" /><span>Bio:</span></div>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 min-h-[60px]">{user.bio || '-'}</div>
                {user.payoutEmail && <div className="flex items-center gap-3 text-lg"><Mail className="w-5 h-5 text-green-500" /><span>Payout Email: {user.payoutEmail}</span></div>}
                {user.expertise && <div className="flex items-center gap-3 text-lg"><TrendingUp className="w-5 h-5 text-green-500" /><span>Expertise: {user.expertise}</span></div>}
                {user.isApproved !== undefined && <div className="flex items-center gap-3 text-lg"><CheckCircle className={`w-5 h-5 ${user.isApproved ? 'text-green-500' : 'text-gray-400'}`} /><span>Approved: {user.isApproved ? 'Yes' : 'No'}</span></div>}
              </div>
            </div>
          )}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-blue-500" />Courses</h3>
              {user.courses?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.courses.map((course: any) => (
                    <div key={course.id} className="bg-white border border-gray-100 rounded-2xl shadow-md p-4 flex gap-4 hover:shadow-lg transition">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-3xl font-bold">📚</span>
                        )}
                      </div>
                      {/* Info and Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-lg text-gray-900 truncate" title={course.title}>{course.title}</div>
                            <span className="text-xs text-gray-500">{course.published_at ? new Date(course.published_at).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700 font-medium">{course.enrolled_count ?? 0} enrolled</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition text-sm border border-blue-100"
                            title="View Course"
                            onClick={() => setViewCourse(course)}
                          >
                            View
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-400 font-semibold cursor-not-allowed text-sm border border-gray-100"
                            title="Edit Course (coming soon)"
                            disabled
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-gray-500 text-center">No courses found.</div>
              )}
              {/* Course Details Modal */}
              {viewCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                      onClick={() => setViewCourse(null)}
                      title="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                        {viewCourse.thumbnail ? (
                          <img src={viewCourse.thumbnail} alt={viewCourse.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-5xl font-bold">📚</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 text-center">{viewCourse.title}</div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        <span>Published: {viewCourse.published_at ? new Date(viewCourse.published_at).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-5 h-5 text-blue-500" />
                        <span>{viewCourse.enrolled_count ?? 0} enrolled</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Flame className="w-6 h-6 text-red-500" />Recent Activity</h3>
              {loadingStats ? <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" /> : (
                <>
                  <ul className="space-y-4">
                    {paginatedActivities.length ? paginatedActivities.map((event: any) => (
                      <li key={event.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 shadow">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{event.description || event.event_type}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(event.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.points_earned > 0 && <span className="text-blue-600 font-bold">+{formatNumber(event.points_earned)} pts</span>}
                          {event.coins_earned > 0 && <span className="text-yellow-600 font-bold">+{formatNumber(event.coins_earned)} coins</span>}
                        </div>
                      </li>
                    )) : <li className="text-gray-500 text-center">No recent activity.</li>}
                  </ul>
                  {/* Pagination Controls */}
                  {totalActivityPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-blue-100 disabled:opacity-50"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        Prev
                      </button>
                      <span className="font-semibold text-gray-700">Page {activityPage} of {totalActivityPages}</span>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-blue-100 disabled:opacity-50"
                        onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                        disabled={activityPage === totalActivityPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="w-6 h-6 text-green-500" />Payments</h3>
              {/* TODO: Fetch and display real payment data for this user */}
              <div className="bg-gray-50 rounded-xl p-6 text-gray-500 text-center">Payments data goes here.</div>
            </div>
          )}
          {activeTab === 'gamification' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500" />Gamification</h3>
              {loadingStats ? <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 shadow">
                      <Coins className="w-6 h-6 text-yellow-500" />
                      <span className="font-semibold text-lg">Gold Coins:</span>
                      <span className="text-2xl font-extrabold text-yellow-700">{formatNumber(stats?.coins)}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 shadow">
                      <Star className="w-6 h-6 text-green-500" />
                      <span className="font-semibold text-lg">Points:</span>
                      <span className="text-2xl font-extrabold text-green-700">{formatNumber(stats?.points)}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4 shadow">
                      <Flame className="w-6 h-6 text-red-500" />
                      <span className="font-semibold text-lg">Current Streak:</span>
                      <span className="text-2xl font-extrabold text-red-700">{stats?.current_streak ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4 shadow">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                      <span className="font-semibold text-lg">Longest Streak:</span>
                      <span className="text-2xl font-extrabold text-purple-700">{stats?.longest_streak ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4 shadow">
                      <ShoppingBag className="w-6 h-6 text-indigo-500" />
                      <span className="font-semibold text-lg">Items Owned:</span>
                      <span className="text-2xl font-extrabold text-indigo-700">{itemsOwned.length}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="font-semibold text-lg mb-2 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" />Badges</div>
                    <ul className="flex flex-wrap gap-3">
                      {stats?.badges?.length ? stats.badges.map((badge: any) => (
                        <li key={badge.id} className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-yellow-100 text-yellow-800 shadow mr-2" style={{ aspectRatio: '1/1' }}>
                          <span className="font-bold text-xs mb-1">{badge.badge?.name || badge.name}</span>
                        </li>
                      )) : <li className="text-gray-500">No badges earned.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'instructor' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Coins className="w-6 h-6 text-yellow-500" />Earnings</h3>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div className="flex gap-2 flex-wrap">
                  {earningFilters.map(f => (
                    <button
                      key={f.id}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm border transition ${earningsFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
                      onClick={() => setEarningsFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end w-full md:w-auto mt-2 md:mt-0">
                  <button
                    className="flex items-center gap-2 bg-green-50 text-green-700 font-semibold rounded-lg px-5 py-2 hover:bg-green-100 transition border border-green-200 shadow-none"
                    onClick={() => {
                      // Export earnings as CSV
                      const headers = ['Course', 'Date Listed', 'Course Fee', 'Enrollments', 'Status', 'Total Earnings'];
                      const rows = filteredEarnings.map(e => [
                        e.course,
                        new Date(e.dateListed).toLocaleDateString(),
                        `$${e.courseFee.toLocaleString()}`,
                        e.enrollments,
                        e.status,
                        `$${e.totalEarnings.toLocaleString()}`
                      ]);
                      const csvContent = [headers, ...rows]
                        .map(row => row.map(val => `"${val}"`).join(','))
                        .join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'earnings.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-5 h-5" />
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl shadow">
                <table className="min-w-full bg-white rounded-xl">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 text-left">
                      <th className="py-3 px-4 font-semibold">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                      </th>
                      <th className="py-3 px-4 font-semibold">Course</th>
                      <th className="py-3 px-4 font-semibold">Date Listed</th>
                      <th className="py-3 px-4 font-semibold">Course Fee</th>
                      <th className="py-3 px-4 font-semibold">Enrollments</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEarnings.length ? filteredEarnings.map((e: Earnings) => (
                      <tr key={e.id} className={`border-b last:border-b-0 hover:bg-blue-50 transition ${selectedRows.includes(e.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="py-3 px-4">
                          <input type="checkbox" checked={selectedRows.includes(e.id)} onChange={() => toggleSelectRow(e.id)} />
                        </td>
                        <td className="py-3 px-4">{e.course}</td>
                        <td className="py-3 px-4">{new Date(e.dateListed).toLocaleDateString()}</td>
                        <td className="py-3 px-4">${e.courseFee.toLocaleString()}</td>
                        <td className="py-3 px-4">{e.enrollments}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{e.status}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-700">${e.totalEarnings.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-6 px-4 text-center text-gray-400">No earnings found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 