import React, { useEffect, useState } from 'react';
import { DollarSign, Clock, CheckCircle, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGiftCashout } from '../../hooks/useGiftCashout';

export default function Earnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { requestGiftCashout, loading: cashoutLoading, error: cashoutError, result: cashoutResult } = useGiftCashout();
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState({ payout_bank_name: '', payout_account_number: '', payout_account_name: '', payout_bank_code: '' });
  const [gifts, setGifts] = useState<any[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftsError, setGiftsError] = useState<string | null>(null);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  // Paystack bank list and account name resolution
  const [banks, setBanks] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [accountNameLoading, setAccountNameLoading] = useState(false);
  const [accountNameError, setAccountNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('users').select('coins').eq('id', user.id).single(),
      supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('requested_at', { ascending: false }),
      supabase.from('coin_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    ]).then(([userRes, payoutRes, txRes]: any[]) => {
      if (userRes.error) setError(userRes.error.message);
      else setCoinBalance(userRes.data?.coins || 0);
      if (payoutRes.error) setError(payoutRes.error.message);
      else setPayouts(payoutRes.data || []);
      if (txRes.error) setError(txRes.error.message);
      else setTransactions(txRes.data || []);
    }).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  }, [user?.id]);

  // Fetch un-cashed-out gifts
  useEffect(() => {
    if (!user?.id) return;
    setGiftsLoading(true);
    setGiftsError(null);
    supabase
      .from('gifts')
      .select('id, coin_value, cashed_out, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) setGiftsError(error.message);
        else setGifts(data || []);
      })
      .catch((e: any) => setGiftsError(e.message))
      .finally(() => setGiftsLoading(false));
  }, [user?.id, cashoutResult]);

  // Fetch Paystack banks on modal open
  useEffect(() => {
    if (!showCashoutModal) return;
    setBanksLoading(true);
    setBanksError(null);
    fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}` }
    })
      .then(res => res.json())
      .then(data => setBanks(data.data || []))
      .catch(e => setBanksError('Failed to load banks'))
      .finally(() => setBanksLoading(false));
  }, [showCashoutModal]);

  // Auto-resolve account name
  useEffect(() => {
    const { payout_bank_code, payout_account_number } = payoutDetails;
    if (!payout_bank_code || !payout_account_number || payout_account_number.length < 10) return;
    setAccountNameLoading(true);
    setAccountNameError(null);
    // Fix: Use correct function URL for local and production
    const baseUrl = import.meta.env.DEV
      ? 'http://localhost:54321/functions/v1'
      : 'https://<your-project-ref>.functions.supabase.co'; // TODO: Replace <your-project-ref> with your actual Supabase project ref
    fetch(`${baseUrl}/resolve-account-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_code: payout_bank_code,
        account_number: payout_account_number,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.account_name) {
          setPayoutDetails(d => ({ ...d, payout_account_name: data.account_name }));
        } else {
          setAccountNameError(data.error || 'Could not resolve account name');
        }
      })
      .catch(() => setAccountNameError('Could not resolve account name'))
      .finally(() => setAccountNameLoading(false));
  }, [payoutDetails.payout_bank_code, payoutDetails.payout_account_number]);

  // Calculate earnings
  const courseEarnings = transactions.filter(tx => tx.type === 'earn').reduce((sum, tx) => sum + tx.amount, 0);
  const goldCoinEarnings = transactions.filter(tx => tx.type === 'gift_received').reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate stats
  const pendingPayout = payouts.find(p => p.status === 'pending');
  const lastPayout = payouts.find(p => p.status === 'paid' || p.status === 'approved');

  // Calculate un-cashed-out gifts
  const uncashedGifts = gifts.filter(g => !g.cashed_out);
  const totalGiftCoins = uncashedGifts.reduce((sum, g) => sum + (g.coin_value || 0), 0);
  const totalGiftNaira = totalGiftCoins / 100;

  // Handle cashout submit
  async function handleGiftCashout(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestGiftCashout(payoutDetails);
      setCashoutSuccess(true);
      setShowCashoutModal(false);
      setPayoutDetails({ payout_bank_name: '', payout_account_number: '', payout_account_name: '', payout_bank_code: '' });
    } catch {}
  }

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
      {/* Remove <Sidebar /> and <Header /> from this file */}
      <div className="flex-1 flex flex-col min-w-0">
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

        {/* Gift Cashout Card */}
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-yellow-200">
          <div>
            <h2 className="text-lg font-bold text-yellow-700 mb-1 flex items-center gap-2">
              <span role="img" aria-label="gift">🎁</span> Gift Cashout
            </h2>
            <p className="text-gray-700 mb-2">You have <span className="font-bold text-yellow-800">{uncashedGifts.length}</span> un-cashed-out gifts worth <span className="font-bold text-yellow-800">{totalGiftCoins} coins</span> (₦{totalGiftNaira.toLocaleString()})</p>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50"
              disabled={uncashedGifts.length === 0 || cashoutLoading}
              onClick={() => { setShowCashoutModal(true); setCashoutSuccess(false); }}
            >
              Request Cashout
            </button>
            {cashoutSuccess && <div className="text-green-700 mt-2 font-medium">Cashout request submitted!</div>}
            {cashoutError && <div className="text-red-600 mt-2">{cashoutError}</div>}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="text-sm text-gray-600">Recent Gifts</div>
            <div className="flex flex-wrap gap-2">
              {giftsLoading ? <span className="text-blue-600">Loading...</span> :
                gifts.slice(0, 5).map(g => (
                  <span key={g.id} className={`px-3 py-1 rounded-full text-xs font-semibold ${g.cashed_out ? 'bg-green-100 text-green-700' : 'bg-yellow-200 text-yellow-800'}`}>{g.coin_value} coins {g.cashed_out ? '✓' : ''}</span>
                ))}
            </div>
            {giftsError && <div className="text-red-600 text-xs">{giftsError}</div>}
          </div>
        </div>

        {/* Cashout Modal */}
        {showCashoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <form onSubmit={handleGiftCashout} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-4 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Gift Cashout</h3>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Bank Name</span>
                {banksLoading ? (
                  <div className="text-blue-600 text-sm">Loading banks...</div>
                ) : banksError ? (
                  <div className="text-red-600 text-sm">{banksError}</div>
                ) : (
                  <select
                    required
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    value={payoutDetails.payout_bank_code || ''}
                    onChange={e => {
                      const selectedBank = banks.find(b => b.code === e.target.value);
                      setPayoutDetails(d => ({
                        ...d,
                        payout_bank_name: selectedBank ? selectedBank.name : '',
                        payout_bank_code: selectedBank ? selectedBank.code : '',
                      }));
                    }}
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank: any, idx: number) => (
                      <option key={bank.code + '-' + bank.name + '-' + idx} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Account Number</span>
                <input type="text" required maxLength={10} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" value={payoutDetails.payout_account_number} onChange={e => setPayoutDetails(d => ({ ...d, payout_account_number: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Account Name</span>
                <input type="text" readOnly className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-gray-100 text-gray-700" value={payoutDetails.payout_account_name} />
                {accountNameLoading && <div className="text-blue-600 text-xs">Resolving account name...</div>}
                {accountNameError && <div className="text-red-600 text-xs">{accountNameError}</div>}
              </label>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50" disabled={cashoutLoading}>Submit</button>
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow transition" onClick={() => setShowCashoutModal(false)}>Cancel</button>
              </div>
              {cashoutLoading && <div className="text-blue-600 mt-2">Submitting...</div>}
              {cashoutError && <div className="text-red-600 mt-2">{cashoutError}</div>}
            </form>
          </div>
        )}

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
      </div>
    </div>
  );
} 