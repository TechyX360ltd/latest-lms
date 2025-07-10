import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // 1. Auth
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { user } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  // 2. Parse body
  const { recipientId, giftType, amount, itemId, message } = await req.json()

  if (!recipientId || !giftType || (giftType === 'coins' && !amount) || (giftType === 'item' && !itemId)) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 })
  }

  // 3. Gifting coins
  if (giftType === 'coins') {
    // a. Check sender balance
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', user.id)
      .single()
    if (senderError || !sender) return new Response(JSON.stringify({ error: 'Sender not found' }), { status: 400 })
    if (sender.coins < amount) return new Response(JSON.stringify({ error: 'Insufficient coins' }), { status: 400 })

    // b. Deduct coins from sender, add to recipient (transactional)
    const { error: updateError } = await supabase.rpc('transfer_coins', {
      sender_id: user.id,
      recipient_id: recipientId,
      amount: amount
    })
    if (updateError) return new Response(JSON.stringify({ error: 'Transfer failed' }), { status: 500 })

    // c. Create gift record
    const { data: gift } = await supabase.from('gifts').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      gift_type: 'coins',
      amount,
      message
    }).select().single()

    // d. Log transactions
    await supabase.from('coin_transactions').insert([
      {
        user_id: user.id,
        type: 'gift_sent',
        amount: -amount,
        related_id: gift.id,
        description: `Gifted ${amount} coins to user ${recipientId}`
      },
      {
        user_id: recipientId,
        type: 'gift_received',
        amount: amount,
        related_id: gift.id,
        description: `Received ${amount} coins from user ${user.id}`
      }
    ])

    return new Response(JSON.stringify({ success: true }))
  }

  // 4. Gifting items
  if (giftType === 'item') {
    // a. Check sender owns the item
    const { data: purchase, error: purchaseError } = await supabase
      .from('user_purchases')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single()
    if (purchaseError || !purchase || purchase.quantity < 1) {
      return new Response(JSON.stringify({ error: 'You do not own this item' }), { status: 400 })
    }

    // b. Deduct item from sender
    await supabase.from('user_purchases')
      .update({ quantity: purchase.quantity - 1 })
      .eq('id', purchase.id)

    // c. Add item to recipient (or increment if already owned)
    const { data: recipientPurchase } = await supabase
      .from('user_purchases')
      .select('id, quantity')
      .eq('user_id', recipientId)
      .eq('item_id', itemId)
      .single()
    if (recipientPurchase) {
      await supabase.from('user_purchases')
        .update({ quantity: recipientPurchase.quantity + 1 })
        .eq('id', recipientPurchase.id)
    } else {
      await supabase.from('user_purchases')
        .insert({ user_id: recipientId, item_id: itemId, quantity: 1, gifted_by: user.id })
    }

    // d. Create gift record
    const { data: gift } = await supabase.from('gifts').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      gift_type: 'item',
      item_id: itemId,
      message
    }).select().single()

    // e. Log transaction (optional, for items)
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      type: 'gift_sent',
      amount: 0,
      related_id: gift.id,
      description: `Gifted item ${itemId} to user ${recipientId}`
    })

    return new Response(JSON.stringify({ success: true }))
  }

  return new Response(JSON.stringify({ error: 'Invalid gift type' }), { status: 400 })
}) 