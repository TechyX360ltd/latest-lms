import React, { useEffect, useState } from 'react';
import { useGiftCashout } from '../../hooks/useGiftCashout';
import { supabase } from '../../lib/supabase';

const CashoutRequests: React.FC = () => {
  const { reviewGiftCashout, loading: actionLoading, error: actionError } = useGiftCashout();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [actionStatus, setActionStatus] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from('cashout_requests')
      .select('*, user:user_id(id, first_name, last_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(async ({ data, error }) => {
        if (error) setError(error.message);
        else {
          // For each request, fetch included gifts
          const withGifts = await Promise.all((data || []).map(async (req: any) => {
            const { data: gifts } = await supabase
              .from('cashout_gifts')
              .select('gift_id, gift:gifts(coin_value)')
              .eq('cashout_id', req.id);
            return { ...req, gifts: gifts || [] };
          }));
          setRequests(withGifts);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshFlag]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionStatus(s => ({ ...s, [id]: 'loading' }));
    try {
      await reviewGiftCashout(id, action);
      setActionStatus(s => ({ ...s, [id]: 'success' }));
      setTimeout(() => setRefreshFlag(f => f + 1), 1000);
    } catch {
      setActionStatus(s => ({ ...s, [id]: 'error' }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Pending Gift Cashout Requests</h1>
      {loading ? (
        <div className="text-blue-600">Loading requests...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500">No pending cashout requests.</div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 text-lg font-semibold text-gray-800">{req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email || 'User' : 'User'}</div>
                <div className="text-sm text-gray-600 mb-1">{req.user?.email}</div>
                <div className="text-sm text-gray-700 mb-1">Total: <span className="font-bold text-yellow-700">{req.total_coins} coins</span> (₦{Number(req.total_naira).toLocaleString()})</div>
                <div className="text-sm text-gray-700 mb-1">Bank: <span className="font-medium">{req.payout_bank_name}</span></div>
                <div className="text-sm text-gray-700 mb-1">Account: <span className="font-medium">{req.payout_account_number} ({req.payout_account_name})</span></div>
                <div className="text-xs text-gray-500 mt-2">Requested: {new Date(req.created_at).toLocaleString()}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {req.gifts.map((g: any) => (
                    <span key={g.gift_id} className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">{g.gift?.coin_value || 0} coins</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[140px]">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50"
                  disabled={actionStatus[req.id] === 'loading'}
                  onClick={() => handleAction(req.id, 'approve')}
                >
                  {actionStatus[req.id] === 'loading' ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50"
                  disabled={actionStatus[req.id] === 'loading'}
                  onClick={() => handleAction(req.id, 'reject')}
                >
                  {actionStatus[req.id] === 'loading' ? 'Rejecting...' : 'Reject'}
                </button>
                {actionStatus[req.id] === 'success' && <div className="text-green-700 text-xs mt-1">Action complete!</div>}
                {actionStatus[req.id] === 'error' && <div className="text-red-600 text-xs mt-1">Action failed</div>}
                {actionError && <div className="text-red-600 text-xs mt-1">{actionError}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CashoutRequests; 