import React, { useEffect, useState } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { DollarSign, Clock, CheckCircle, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Earnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('users').select('coins').eq('id', user.id).single(),
      supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('requested_at', { ascending: false }),
      supabase.from('coin_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    ]).then(([userRes, payoutRes, txRes]) => {
      if (userRes.error) setError(userRes.error.message);
      else setCoinBalance(userRes.data?.coins || 0);
      if (payoutRes.error) setError(payoutRes.error.message);
      else setPayouts(payoutRes.data || []);
      if (txRes.error) setError(txRes.error.message);
      else setTransactions(txRes.data || []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Calculate earnings
  const courseEarnings = transactions.filter(tx => tx.type === 'earn').reduce((sum, tx) => sum + tx.amount, 0);
  const goldCoinEarnings = transactions.filter(tx => tx.type === 'gift_received').reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate stats
  const pendingPayout = payouts.find(p => p.status === 'pending');
  const lastPayout = payouts.find(p => p.status === 'paid' || p.status === 'approved');

  const stats = [
    { title: 'Course Earnings', value: `₦${(courseEarnings/100).toLocaleString()}`, icon: DollarSign, color: 'bg-green-600', tooltip: 'Earnings from students enrolling in your courses.' },
    { title: 'Gold Coin Earnings', value: `₦${(goldCoinEarnings/100).toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500', tooltip: 'Gold coins received as gifts from other users.' },
    { title: 'Pending Payouts', value: pendingPayout ? `₦${(pendingPayout.amount_cash).toLocaleString()}` : '₦0', icon: Clock, color: 'bg-blue-500', tooltip: 'Withdrawals you have requested but not yet received.' },
    { title: 'Last Payout', value: lastPayout ? new Date(lastPayout.processed_at || lastPayout.requested_at).toLocaleDateString() : '-', icon: CheckCircle, color: 'bg-blue-500', tooltip: 'Date of your most recent completed payout.' },
  ];

  // Prepare chart data: group by date, sum earnings (type: 'earn')
  const chartData = [] as { date: string, coins: number }[];
  if (transactions.length) {
    const byDate: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'earn') {
        const d = new Date(tx.created_at).toLocaleDateString();
        byDate[d] = (byDate[d] || 0) + tx.amount;
      }
    });
    Object.entries(byDate).forEach(([date, coins]) => chartData.push({ date, coins }));
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Earnings</h1>
              <p className="text-gray-600">Track your earnings and payouts</p>
            </div>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-green-700 transition text-lg">
              Withdraw Earnings
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition" title={stat.tooltip}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8 flex flex-col items-center justify-center min-h-[250px]">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-400" /> Earnings Over Time</h2>
            {loading ? <p className="text-blue-600">Loading chart...</p> : chartData.length === 0 ? <p className="text-gray-500">No earnings data yet</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="coins" stroke="#22c55e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-blue-600">Loading payouts...</td></tr>
                  ) : payouts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No payouts found</td></tr>
                  ) : (
                    payouts.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(p.requested_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">₦{Number(p.amount_cash).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{p.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{p.payment_method || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:underline text-sm" disabled={p.status !== 'pending'}>Download</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {error && <div className="text-red-600 mt-4">{error}</div>}
        </main>
      </div>
    </div>
  );
} 