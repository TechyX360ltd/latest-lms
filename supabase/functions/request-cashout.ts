import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

// Set your conversion rate here
const COIN_TO_CASH_RATE = 1000 // 1000 coins = $1

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { user } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { amount_coins, payment_method, payment_details } = await req.json()
  if (!amount_coins || !payment_method || !payment_details) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 })
  }
  if (amount_coins < COIN_TO_CASH_RATE) {
    return new Response(JSON.stringify({ error: `Minimum cashout is ${COIN_TO_CASH_RATE} coins` }), { status: 400 })
  }

  // 1. Check user balance
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user.id)
    .single()
  if (userError || !userData) return new Response(JSON.stringify({ error: 'User not found' }), { status: 400 })
  if (userData.coins < amount_coins) {
    return new Response(JSON.stringify({ error: 'Insufficient coins' }), { status: 400 })
  }

  // 2. Deduct coins
  const { error: updateError } = await supabase
    .from('users')
    .update({ coins: userData.coins - amount_coins })
    .eq('id', user.id)
  if (updateError) return new Response(JSON.stringify({ error: 'Failed to deduct coins' }), { status: 500 })

  // 3. Calculate cash value
  const amount_cash = (amount_coins / COIN_TO_CASH_RATE).toFixed(2)

  // 4. Create withdrawal request
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: user.id,
      amount_coins,
      amount_cash,
      payment_method,
      payment_details,
      status: 'pending',
    })
    .select()
    .single()
  if (withdrawalError) return new Response(JSON.stringify({ error: 'Failed to create withdrawal request' }), { status: 500 })

  // 5. Log transaction
  await supabase.from('coin_transactions').insert({
    user_id: user.id,
    type: 'cashout',
    amount: -amount_coins,
    related_id: withdrawal.id,
    description: `Requested cashout of ${amount_coins} coins ($${amount_cash})`
  })

  return new Response(JSON.stringify({ success: true, withdrawal }))
}) 