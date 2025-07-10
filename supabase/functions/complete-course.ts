import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from '../_shared/supabaseClient'

serve(async (req) => {
  // Parse the request body
  const { user_id, course_id } = await req.json()

  // Validate input
  if (!user_id || !course_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id or course_id' }), { status: 400 })
  }

  // Create Supabase client with service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Insert or ignore if already completed
  const { data, error } = await supabase
    .from('course_completions')
    .upsert([{ user_id, course_id }], { onConflict: ['user_id', 'course_id'] })
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 })
}) 