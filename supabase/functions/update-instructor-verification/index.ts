import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

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
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}); 