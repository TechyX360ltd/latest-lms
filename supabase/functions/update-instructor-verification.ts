import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { user_id, verification_status, verification_id_url, verification_rejection_reason } = await req.json();

  // TODO: Add authentication/authorization logic here
  // For now, allow any call (in production, restrict to user or admin)

  const { error } = await supabase
    .from('users')
    .update({
      verification_status,
      verification_id_url,
      verification_rejection_reason
    })
    .eq('id', user_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}); 