import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { user } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  // TODO: Add admin role check here

  const { cashoutId, action } = await req.json(); // action: 'approve' | 'reject'
  if (!cashoutId || !['approve', 'reject'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid parameters' }), { status: 400 });
  }

  // 1. Get cashout request
  const { data: cashout, error: cashoutError } = await supabase
    .from('cashout_requests')
    .select('id, status')
    .eq('id', cashoutId)
    .single();
  if (cashoutError || !cashout) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (cashout.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Already processed' }), { status: 400 });
  }

  if (action === 'approve') {
    // 2. Update cashout_requests
    await supabase
      .from('cashout_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString(), admin_id: user.id })
      .eq('id', cashoutId);
    // 3. Get all gifts in this cashout
    const { data: cashoutGifts, error: giftsError } = await supabase
      .from('cashout_gifts')
      .select('gift_id')
      .eq('cashout_id', cashoutId);
    if (giftsError) return new Response(JSON.stringify({ error: 'Failed to fetch gifts' }), { status: 500 });
    const giftIds = (cashoutGifts || []).map(g => g.gift_id);
    if (giftIds.length > 0) {
      await supabase
        .from('gifts')
        .update({ cashed_out: true })
        .in('id', giftIds);
    }
    // 4. Paystack transfer logic
    // Fetch cashout request details
    const { data: cashoutDetails, error: detailsError } = await supabase
      .from('cashout_requests')
      .select('*')
      .eq('id', cashoutId)
      .single();
    if (detailsError || !cashoutDetails) return new Response(JSON.stringify({ error: 'Could not fetch cashout details' }), { status: 500 });
    try {
      // a. Create transfer recipient
      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: cashoutDetails.payout_account_name,
          account_number: cashoutDetails.payout_account_number,
          bank_code: cashoutDetails.payout_bank_code || cashoutDetails.payout_bank_name, // you may need to store bank_code
          currency: 'NGN',
        }),
      });
      const recipientData = await recipientRes.json();
      if (!recipientData.status) throw new Error('Failed to create transfer recipient: ' + recipientData.message);
      const recipientCode = recipientData.data.recipient_code;
      // b. Initiate transfer
      const transferRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(Number(cashoutDetails.total_naira) * 100), // Paystack expects kobo
          recipient: recipientCode,
          reason: 'Gift cashout',
        }),
      });
      const transferData = await transferRes.json();
      if (!transferData.status) throw new Error('Failed to initiate transfer: ' + transferData.message);
      // c. Update cashout status to paid
      await supabase
        .from('cashout_requests')
        .update({ status: 'paid' })
        .eq('id', cashoutId);
    } catch (err) {
      console.error('Paystack transfer error:', err);
      // Optionally update status to failed
      await supabase
        .from('cashout_requests')
        .update({ status: 'failed' })
        .eq('id', cashoutId);
      return new Response(JSON.stringify({ error: 'Paystack transfer failed', details: err.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }));
  }

  if (action === 'reject') {
    await supabase
      .from('cashout_requests')
      .update({ status: 'rejected', approved_at: new Date().toISOString(), admin_id: user.id })
      .eq('id', cashoutId);
    // Gifts remain available
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}); 