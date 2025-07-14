import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from '../_shared/supabaseClient'

serve(async (req) => {
  const { user_id, course_id } = await req.json()

  if (!user_id || !course_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id or course_id' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // First, check if certificate already exists
  const { data: existing, error: fetchError } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 400 })
  }

  if (existing) {
    return new Response(JSON.stringify({ success: true, data: existing }), { status: 200 })
  }

  // Insert new certificate if not exists
  const { data, error } = await supabase
    .from('certificates')
    .insert([{ user_id, course_id }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 })
})