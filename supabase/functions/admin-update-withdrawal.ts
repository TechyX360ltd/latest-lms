import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { withdrawalId, action } = await req.json() // action: 'approve' | 'reject'
  // TODO: Add admin authentication/authorization here!

  // 1. Get withdrawal request
  const { data: withdrawal, error } = await supabase
    .from('withdrawal_requests')
    .select('id, user_id, amount_coins, status')
    .eq('id', withdrawalId)
    .single()
  if (error || !withdrawal) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  if (withdrawal.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Already processed' }), { status: 400 })
  }

  if (action === 'approve') {
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId)
    return new Response(JSON.stringify({ success: true }))
  }

  if (action === 'reject') {
    // Refund coins
    await supabase.rpc('refund_coins', {
      user_id: withdrawal.user_id,
      amount: withdrawal.amount_coins
    })
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId)
    return new Response(JSON.stringify({ success: true }))
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
}) 