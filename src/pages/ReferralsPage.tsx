import React, { useState, useEffect } from 'react';
import { useGamification } from '../hooks/useGamification';
import { Copy, Share2, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Auth/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ReferralsPage() {
  const { stats } = useGamification();
  const { user } = useAuth();
  const referralCode = user?.referral_code || '';
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : '';
  
  // Debug logging
  console.log('User object:', user);
  console.log('Referral code:', referralCode);
  console.log('Referral link:', referralLink);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('referral_events')
          .select(`
            *,
            referred_user:users!referral_events_referred_user_id_fkey(
              id, 
              first_name,
              last_name,
              email
            )
          `)
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        console.log('Referrals data:', data);
        setReferrals(data || []);
      } catch (err: any) {
        console.error('Error fetching referrals:', err);
        setError('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user?.id]);

  const totalReferrals = referrals.length;
  const totalCoins = referrals.reduce((sum, r) => sum + (r.coins_awarded || 0), 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.showToast('Referral link copied!', 'celebration', 3000, 'Share your link and earn rewards!');
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join me on Tech360 LMS!', url: referralLink });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-gradient-to-r from-yellow-100 to-pink-100 rounded-2xl shadow-lg p-8 mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-extrabold text-pink-700">My Referrals</h1>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-gray-700 font-semibold mb-1">Your Referral Link</div>
            {referralCode ? (
              <div className="font-mono text-lg text-yellow-700 break-all">{referralLink}</div>
            ) : (
              <div className="text-gray-500 italic">Loading referral code...</div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy} 
              disabled={!referralCode}
              className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1 ${
                referralCode 
                  ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button 
              onClick={handleShare} 
              disabled={!referralCode}
              className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1 ${
                referralCode 
                  ? 'bg-pink-200 hover:bg-pink-300 text-pink-800' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
        <div className="mt-6 flex gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{totalReferrals}</div>
            <div className="text-gray-600">Total Referrals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-600">{totalCoins}</div>
            <div className="text-gray-600">Coins Earned</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-500" /> Referral History
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
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Coins</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {referrals.map((r, i) => (
                  <tr key={r.id || i} className={r.status === 'completed' ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {r.referred_user?.first_name && r.referred_user?.last_name 
                        ? `${r.referred_user.first_name} ${r.referred_user.last_name}`
                        : r.referred_user?.first_name || r.referred_user?.last_name || '—'
                      }
                    </td>
                    <td className="px-4 py-2 text-gray-700">{r.referred_user?.email || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className={`px-4 py-2 font-semibold ${r.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>{r.status === 'completed' ? 'Completed' : 'Pending'}</td>
                    <td className="px-4 py-2 text-yellow-700 font-bold">{r.coins_awarded || 0}</td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No referrals yet.</td>
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