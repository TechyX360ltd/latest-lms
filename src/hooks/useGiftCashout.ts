import { useState } from 'react';

export function useGiftCashout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // For instructors: request cashout
  async function requestGiftCashout({ payout_bank_name, payout_account_number, payout_account_name }: {
    payout_bank_name: string;
    payout_account_number: string;
    payout_account_name: string;
  }) {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/functions/v1/request-gift-cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_bank_name, payout_account_number, payout_account_name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // For admins: review (approve/reject) cashout
  async function reviewGiftCashout(cashoutId: string, action: 'approve' | 'reject') {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/functions/v1/admin-review-gift-cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashoutId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { requestGiftCashout, reviewGiftCashout, loading, error, result };
} 