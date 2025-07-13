import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, DollarSign, BookOpen, TrendingUp, Star, UserCheck, Gift, Coins, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const COLORS = ['#34d399', '#6366f1', '#f59e42', '#f43f5e', '#a78bfa', '#fbbf24', '#38bdf8', '#f87171', '#10b981'];

export default function AdminDashboard() {
  // KPI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState([
    { label: 'Total Users', value: '-', icon: <Users className="w-6 h-6 text-blue-500" /> },
    { label: 'Revenue', value: '-', icon: <DollarSign className="w-6 h-6 text-green-500" /> },
    { label: 'Withdrawals', value: '-', icon: <ArrowDownCircle className="w-6 h-6 text-red-500" /> },
    { label: 'Courses', value: '-', icon: <BookOpen className="w-6 h-6 text-purple-500" /> },
    { label: 'Enrollments', value: '-', icon: <TrendingUp className="w-6 h-6 text-orange-500" /> },
    { label: 'Coins Earned', value: '-', icon: <Coins className="w-6 h-6 text-yellow-500" /> },
    { label: 'Instructors', value: '-', icon: <UserCheck className="w-6 h-6 text-pink-500" /> },
    { label: 'Referrals', value: '-', icon: <Gift className="w-6 h-6 text-teal-500" /> },
    { label: 'Avg. Rating', value: '-', icon: <Star className="w-6 h-6 text-yellow-400" /> },
  ]);
  // Chart States
  const [userGrowth, setUserGrowth] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [coins, setCoins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError('');
      try {
        // 1. Total Users
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        console.log('Total Users:', userCount);
        // 2. Revenue
        const { data: payments } = await supabase.from('payments').select('amount');
        console.log('Payments:', payments);
        const revenue = payments ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
        // 3. Withdrawals
        const { data: withdrawals } = await supabase.from('cashout_requests').select('total_naira, status');
        console.log('Withdrawals:', withdrawals);
        const withdrawalSum = withdrawals ? withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + (Number(w.total_naira) || 0), 0) : 0;
        // 4. Courses
        const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        console.log('Courses:', courseCount);
        // 5. Enrollments
        const { count: enrollmentCount } = await supabase.from('user_courses').select('*', { count: 'exact', head: true });
        console.log('Enrollments:', enrollmentCount);
        // 6. Coins Earned
        const { data: users } = await supabase.from('users').select('coins');
        console.log('Users (for coins):', users);
        const coinsSum = users ? users.reduce((sum, u) => sum + (u.coins || 0), 0) : 0;
        // 7. Instructors
        const { count: instructorCount } = await supabase.from('users').eq('role', 'instructor').select('*', { count: 'exact', head: true });
        console.log('Instructors:', instructorCount);
        // 8. Referrals
        const { count: referralCount } = await supabase.from('users').not('referred_by', 'is', null).select('*', { count: 'exact', head: true });
        console.log('Referrals:', referralCount);
        // 9. Avg. Rating
        const { data: ratingsData } = await supabase.from('course_ratings').select('rating');
        console.log('Ratings Data:', ratingsData);
        const avgRating = ratingsData && ratingsData.length > 0 ? (ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsData.length).toFixed(1) : '-';

        // Update KPIs
        setKpis([
          { label: 'Total Users', value: userCount ?? '-', icon: <Users className="w-6 h-6 text-blue-500" /> },
          { label: 'Revenue', value: `₦${revenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-green-500" /> },
          { label: 'Withdrawals', value: `₦${withdrawalSum.toLocaleString()}`, icon: <ArrowDownCircle className="w-6 h-6 text-red-500" /> },
          { label: 'Courses', value: courseCount ?? '-', icon: <BookOpen className="w-6 h-6 text-purple-500" /> },
          { label: 'Enrollments', value: enrollmentCount ?? '-', icon: <TrendingUp className="w-6 h-6 text-orange-500" /> },
          { label: 'Coins Earned', value: coinsSum ?? '-', icon: <Coins className="w-6 h-6 text-yellow-500" /> },
          { label: 'Instructors', value: instructorCount ?? '-', icon: <UserCheck className="w-6 h-6 text-pink-500" /> },
          { label: 'Referrals', value: referralCount ?? '-', icon: <Gift className="w-6 h-6 text-teal-500" /> },
          { label: 'Avg. Rating', value: avgRating, icon: <Star className="w-6 h-6 text-yellow-400" /> },
        ]);

        // User Growth by Month
        const { data: userGrowthData } = await supabase.rpc('user_growth_by_month');
        console.log('User Growth Data:', userGrowthData);
        setUserGrowth(userGrowthData || []);
        // Revenue & Withdrawals by Month
        const { data: revData } = await supabase.rpc('revenue_withdrawals_by_month');
        console.log('Revenue/Withdrawals Data:', revData);
        setRevenueData(revData || []);
        // Enrollments by Month
        const { data: enrollData } = await supabase.rpc('enrollments_by_month');
        console.log('Enrollments Data:', enrollData);
        setEnrollments(enrollData || []);
        // Coins by Month
        const { data: coinsData } = await supabase.rpc('coins_by_month');
        console.log('Coins Data:', coinsData);
        setCoins(coinsData || []);
        // Roles Pie
        const { data: rolesData } = await supabase.rpc('user_roles_pie');
        console.log('Roles Data:', rolesData);
        setRoles(rolesData || []);
        // Ratings Pie
        const { data: ratingsPie } = await supabase.rpc('ratings_pie');
        console.log('Ratings Pie Data:', ratingsPie);
        setRatings(ratingsPie || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 md:px-6 lg:px-12 w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      {loading ? (
        <div className="text-center py-20 text-lg text-gray-500">Loading dashboard...</div>
      ) : error ? (
        <div className="text-center py-20 text-lg text-red-500">{error}</div>
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all border-t-4" style={{ borderColor: COLORS[i % COLORS.length] }}>
            <div>{kpi.icon}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">User Growth</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={userGrowth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#6366f1" fill="#a5b4fc" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">Revenue & Withdrawals</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#34d399" name="Revenue" />
              <Bar dataKey="withdrawals" fill="#f87171" name="Withdrawals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">Enrollments</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={enrollments}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">Coins Earned</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={coins}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="coins" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">User Roles</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roles} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {roles.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold mb-2">Ratings</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ratings} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {ratings.map((entry, i) => (
                  <Cell key={`cell-rating-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}
    </div>
  );
} 