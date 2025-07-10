// @ts-ignore
// @deno-types="https://deno.land/std@0.177.0/server.ts"
import { serve } from 'std/server.ts';
import { createClient } from '@supabase/supabase-js';

// Deno.env.get is available in the Supabase Edge runtime
// @ts-ignore
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req: Request) => {
  try {
    const { userId, courseId, actionType } = await req.json();
    if (!userId || !courseId || !actionType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if already rewarded for this action today
    const { data: recent, error: recentError } = await supabase
      .from('gamification_events')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('event_type', actionType)
      .gte('created_at', new Date().toISOString().slice(0, 10)) // today
      .limit(1);
    if (recentError) throw recentError;
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ message: 'Already rewarded for this action today.' }), { status: 200 });
    }

    // Award coins (define per action)
    let coins = 0;
    if (actionType === 'start' || actionType === 'continue' || actionType === 'open_active_course') {
      coins = 10; // Example: 10 coins per valid action
    }
    if (coins === 0) {
      return new Response(JSON.stringify({ error: 'Invalid action type' }), { status: 400 });
    }

    // Update user coins
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();
    if (userError) throw userError;
    const newCoins = (user?.coins || 0) + coins;
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newCoins })
      .eq('id', userId);
    if (updateError) throw updateError;

    // Log event
    const { error: eventError } = await supabase
      .from('gamification_events')
      .insert({
        user_id: userId,
        event_type: actionType,
        coins,
        points: 0,
        description: `Awarded for ${actionType} on course ${courseId}`,
        metadata: { courseId },
        created_at: new Date().toISOString(),
        status: 'completed',
      });
    if (eventError) throw eventError;

    return new Response(JSON.stringify({ coins: newCoins, message: 'Coins awarded!' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err.toString() }), { status: 500 });
  }
}); 