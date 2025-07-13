import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const COIN_TO_NAIRA_RATE = 100; // 100 coins = 1 naira

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { user } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { payout_bank_name, payout_account_number, payout_account_name } = await req.json();
  if (!payout_bank_name || !payout_account_number || !payout_account_name) {
    return new Response(JSON.stringify({ error: 'Missing payout details' }), { status: 400 });
  }

  // 1. Find all un-cashed-out gifts for this user
  const { data: gifts, error: giftsError } = await supabase
    .from('gifts')
    .select('id, coin_value')
    .eq('recipient_id', user.id)
    .eq('cashed_out', false);
  if (giftsError) return new Response(JSON.stringify({ error: 'Failed to fetch gifts' }), { status: 500 });
  if (!gifts || gifts.length === 0) {
    return new Response(JSON.stringify({ error: 'No gifts available for cashout' }), { status: 400 });
  }

  // 2. Sum coin value
  const total_coins = gifts.reduce((sum, g) => sum + (g.coin_value || 0), 0);
  const total_naira = total_coins / COIN_TO_NAIRA_RATE;

  // 3. Create cashout_requests row
  const { data: cashout, error: cashoutError } = await supabase
    .from('cashout_requests')
    .insert({
      user_id: user.id,
      total_coins,
      total_naira,
      payout_bank_name,
      payout_account_number,
      payout_account_name,
      status: 'pending',
    })
    .select()
    .single();
  if (cashoutError) return new Response(JSON.stringify({ error: 'Failed to create cashout request' }), { status: 500 });

  // 4. Create cashout_gifts rows
  const cashoutGiftRows = gifts.map(g => ({ cashout_id: cashout.id, gift_id: g.id }));
  const { error: linkError } = await supabase
    .from('cashout_gifts')
    .insert(cashoutGiftRows);
  if (linkError) return new Response(JSON.stringify({ error: 'Failed to link gifts to cashout' }), { status: 500 });

  return new Response(JSON.stringify({ success: true, cashout, gifts: gifts.map(g => g.id) }), { status: 200 });
}); 