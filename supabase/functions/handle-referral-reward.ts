// @ts-ignore
// @deno-types="https://deno.land/std@0.177.0/server.ts"
import { serve } from 'std/server.ts';
import { createClient } from '@supabase/supabase-js';

// Deno.env.get is available in the Supabase Edge runtime
// @ts-ignore
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req: Request) => {
  try {
    const { referredUserId, courseId } = await req.json();
    if (!referredUserId || !courseId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Get referred user's referred_by code
    const { data: referredUser, error: userError } = await supabase
      .from('users')
      .select('referred_by, id')
      .eq('id', referredUserId)
      .single();
    if (userError) throw userError;
    if (!referredUser?.referred_by) {
      return new Response(JSON.stringify({ message: 'No referrer for this user.' }), { status: 200 });
    }

    // Get referrer user by referral_code
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, coins')
      .eq('referral_code', referredUser.referred_by)
      .single();
    if (referrerError) throw referrerError;
    if (!referrer?.id) {
      return new Response(JSON.stringify({ message: 'Referrer not found.' }), { status: 200 });
    }

    // Check if referral event already exists
    const { data: existing, error: existingError } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .single();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return new Response(JSON.stringify({ message: 'Referral reward already granted.' }), { status: 200 });
    }

    // Award coins to referrer
    const coinsAwarded = 1000;
    const newCoins = (referrer.coins || 0) + coinsAwarded;
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newCoins })
      .eq('id', referrer.id);
    if (updateError) throw updateError;

    // Log referral event
    const { error: eventError } = await supabase
      .from('referral_events')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: referredUserId,
        course_id: courseId,
        coins_awarded: coinsAwarded,
        status: 'completed',
        created_at: new Date().toISOString(),
      });
    if (eventError) throw eventError;

    return new Response(JSON.stringify({ message: 'Referral reward granted!', coins: newCoins }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err.toString() }), { status: 500 });
  }
}); 