// @ts-ignore
// @deno-types="https://deno.land/std@0.177.0/server.ts"
import { serve } from 'std/server.ts';
import { createClient } from '@supabase/supabase-js';

// Deno.env.get is available in the Supabase Edge runtime
// @ts-ignore
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req: Request) => {
  try {
    const { userId, courseId, courseTitle } = await req.json();
    if (!userId || !courseId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if user is an instructor
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, coins')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    if (user.role !== 'instructor') {
      return new Response(JSON.stringify({ error: 'Only instructors can publish courses' }), { status: 403 });
    }

    // Check if already rewarded for this course
    const { data: recent, error: recentError } = await supabase
      .from('gamification_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'instructor_course_published')
      .eq('metadata->courseId', courseId)
      .limit(1);
    
    if (recentError) throw recentError;
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ message: 'Already rewarded for publishing this course.' }), { status: 200 });
    }

    // Award 100,000 coins
    const coinsAwarded = 100000;
    const newCoins = (user.coins || 0) + coinsAwarded;
    
    // Update user coins
    const { error: updateError } = await supabase
      .from('users')
      .update({ coins: newCoins })
      .eq('id', userId);
    
    if (updateError) throw updateError;

    // Log gamification event
    const { error: eventError } = await supabase
      .from('gamification_events')
      .insert({
        user_id: userId,
        event_type: 'instructor_course_published',
        coins: coinsAwarded,
        points: 0,
        description: `Published course: ${courseTitle || courseId}`,
        metadata: { courseId, courseTitle },
        created_at: new Date().toISOString(),
        status: 'completed',
      });
    
    if (eventError) throw eventError;

    return new Response(JSON.stringify({ 
      coins: newCoins, 
      coinsAwarded,
      message: 'Course published successfully! You earned 100,000 coins!' 
    }), { status: 200 });
    
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err.toString() }), { status: 500 });
  }
}); 