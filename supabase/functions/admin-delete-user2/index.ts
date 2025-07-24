import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Helper to add CORS headers to all responses
function corsResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*", // In production, set this to your domain for better security
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json"
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight immediately
  if (req.method === "OPTIONS") {
    return corsResponse("", 204);
  }

  try {
    const { user_id, admin_password } = await req.json();

    if (!user_id || !admin_password) {
      return corsResponse(JSON.stringify({ error: 'Missing user_id or admin_password' }), 400);
    }

    // Securely check admin password (set this in your Supabase project secrets)
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');
    if (!ADMIN_PASSWORD || admin_password !== ADMIN_PASSWORD) {
      return corsResponse(JSON.stringify({ error: 'Invalid admin password' }), 401);
    }

    // Get service role key and project URL from env
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
      return corsResponse(JSON.stringify({ error: 'Missing Supabase config' }), 500);
    }

    // 1. Delete from Supabase Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!authRes.ok) {
      const err = await authRes.json();
      return corsResponse(JSON.stringify({ error: 'Failed to delete user from Auth', details: err }), 500);
    }

    // 2. Delete from users table
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    if (!dbRes.ok) {
      const err = await dbRes.json();
      return corsResponse(JSON.stringify({ error: 'Failed to delete user from DB', details: err }), 500);
    }

    return corsResponse(JSON.stringify({ success: true }), 200);
  } catch (e) {
    return corsResponse(JSON.stringify({ error: e.message || e.toString() }), 500);
  }
});