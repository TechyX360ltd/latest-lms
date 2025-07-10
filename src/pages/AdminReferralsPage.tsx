import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Gift, Search, Download, TrendingUp, Users, Award, Calendar } from 'lucide-react';

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalCoinsAwarded: 0,
    thisWeekReferrals: 0,
    thisMonthReferrals: 0,
    topReferrers: [] as any[],
    monthlyData: [] as any[]
  });

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('referral_events')
          .select(`*, referrer:users!referral_events_referrer_id_fkey(id, first_name, last_name, email), referred:users!referral_events_referred_user_id_fkey(id, first_name, last_name, email)`)
          .order('created_at', { ascending: false });
        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        const { data, error } = await query;
        if (error) throw error;
        setReferrals(data || []);
        
        // Calculate analytics
        calculateAnalytics(data || []);
      } catch (err: any) {
        setError('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [statusFilter]);

  const calculateAnalytics = (data: any[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalReferrals = data.length;
    const completedReferrals = data.filter(r => r.status === 'completed').length;
    const pendingReferrals = data.filter(r => r.status === 'pending').length;
    const totalCoinsAwarded = data.reduce((sum, r) => sum + (r.coins_awarded || 0), 0);
    const thisWeekReferrals = data.filter(r => new Date(r.created_at) >= weekAgo).length;
    const thisMonthReferrals = data.filter(r => new Date(r.created_at) >= monthAgo).length;

    // Top referrers
    const referrerStats = data.reduce((acc: any, r) => {
      const referrerId = r.referrer_id;
      if (!acc[referrerId]) {
        acc[referrerId] = {
          id: referrerId,
          name: `${r.referrer?.first_name || ''} ${r.referrer?.last_name || ''}`,
          email: r.referrer?.email || '',
          count: 0,
          coins: 0
        };
      }
      acc[referrerId].count++;
      acc[referrerId].coins += r.coins_awarded || 0;
      return acc;
    }, {});

    const topReferrers = Object.values(referrerStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Monthly data for chart
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const monthReferrals = data.filter(r => {
        const date = new Date(r.created_at);
        return date >= month && date <= monthEnd;
      });
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        referrals: monthReferrals.length,
        completed: monthReferrals.filter(r => r.status === 'completed').length
      };
    }).reverse();

    setAnalytics({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalCoinsAwarded,
      thisWeekReferrals,
      thisMonthReferrals,
      topReferrers,
      monthlyData
    });
  };

  const exportToCSV = () => {
    const headers = ['Referrer Name', 'Referrer Email', 'Referred Name', 'Referred Email', 'Date', 'Status', 'Coins Awarded'];
    const csvData = referrals.map(r => [
      `${r.referrer?.first_name || ''} ${r.referrer?.last_name || ''}`,
      r.referrer?.email || '',
      `${r.referred?.first_name || ''} ${r.referred?.last_name || ''}`,
      r.referred?.email || '',
      r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
      r.status === 'completed' ? 'Completed' : 'Pending',
      r.coins_awarded || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filtered = referrals.filter(r => {
    if (!search) return true;
    const referrer = `${r.referrer?.first_name || ''} ${r.referrer?.last_name || ''} ${r.referrer?.email || ''}`.toLowerCase();
    const referred = `${r.referred?.first_name || ''} ${r.referred?.last_name || ''} ${r.referred?.email || ''}`.toLowerCase();
    return referrer.includes(search.toLowerCase()) || referred.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-extrabold text-pink-700">Referral Management</h1>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalReferrals}</p>
            </div>
            <Gift className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{analytics.completedReferrals}</p>
            </div>
            <Award className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Coins</p>
              <p className="text-2xl font-bold text-yellow-600">{analytics.totalCoinsAwarded.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.thisWeekReferrals}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Referrals</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.monthlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t">
                  <div 
                    className="bg-yellow-500 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max((data.referrals / Math.max(...analytics.monthlyData.map(d => d.referrals))) * 200, 4)}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center">{data.month}</span>
                <span className="text-xs font-medium text-gray-900">{data.referrals}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {analytics.topReferrers.map((referrer: any, i) => (
              <div key={referrer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-600">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{referrer.name}</p>
                    <p className="text-sm text-gray-500">{referrer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{referrer.count} referrals</p>
                  <p className="text-sm text-yellow-600">{referrer.coins.toLocaleString()} coins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex items-center bg-white rounded-lg shadow px-3">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white shadow"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-500" /> All Referrals
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Referrer</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Referred</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Coins</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className={r.status === 'completed' ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {r.referrer?.first_name} {r.referrer?.last_name}<br />
                      <span className="text-xs text-gray-500">{r.referrer?.email}</span>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {r.referred?.first_name} {r.referred?.last_name}<br />
                      <span className="text-xs text-gray-500">{r.referred?.email}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className={`px-4 py-2 font-semibold ${r.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>{r.status === 'completed' ? 'Completed' : 'Pending'}</td>
                    <td className="px-4 py-2 text-yellow-700 font-bold">{r.coins_awarded || 0}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No referrals found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { AdminReferralsPage }; 