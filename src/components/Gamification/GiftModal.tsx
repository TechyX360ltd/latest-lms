import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export function GiftModal({ open, onClose, giftType, itemId }: {
  open: boolean,
  onClose: () => void,
  giftType: 'coins' | 'item',
  itemId?: string
}) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // User search as you type
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRecipientEmail(value)
    setRecipientId(null)
    setSuccess('')
    setError('')
    setShowDropdown(false)
    setSearchResults([])
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .ilike('email', `%${value}%`)
          .limit(5)
        if (!error && data && data.length > 0) {
          setSearchResults(data)
          setShowDropdown(true)
        } else {
          setSearchResults([])
          setShowDropdown(false)
        }
      }, 300)
    }
  }

  const handleSelectUser = (user: any) => {
    setRecipientEmail(user.email)
    setRecipientId(user.id)
    setShowDropdown(false)
    setSearchResults([])
  }

  const handleGift = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    let finalRecipientId = recipientId
    // If user selected from dropdown, use their ID; else, look up by email
    if (!finalRecipientId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', recipientEmail)
        .single()
      if (userError || !user) {
        setError('Recipient not found. Please check the email address.');
        setLoading(false)
        return
      }
      finalRecipientId = user.id
    }
    // 2. Proceed with gifting
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const body: any = {
      recipientId: finalRecipientId,
      giftType,
      message,
    }
    if (giftType === 'coins') body.amount = Number(amount)
    if (giftType === 'item') body.itemId = itemId

    const res = await fetch('/functions/v1/send-gift', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setSuccess('Gift sent successfully!')
      setRecipientEmail('')
      setRecipientId(null)
      setAmount('')
      setMessage('')
    } else {
      setError(data.error || 'Failed to send gift')
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Gift {giftType === 'coins' ? 'Coins' : 'Item'}</h2>
        <label className="block mb-2 font-medium">Recipient Email</label>
        <input
          className="w-full border rounded px-3 py-2 mb-1"
          value={recipientEmail}
          onChange={handleEmailChange}
          placeholder="Recipient email address"
          autoComplete="off"
          onFocus={() => recipientEmail.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
        />
        {/* Autocomplete dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow z-50 max-h-40 overflow-y-auto">
            {searchResults.map(user => (
              <div
                key={user.id}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex flex-col"
                onClick={() => handleSelectUser(user)}
              >
                <span className="font-medium text-gray-900">{user.email}</span>
                <span className="text-xs text-gray-500">{user.first_name} {user.last_name}</span>
              </div>
            ))}
          </div>
        )}
        {giftType === 'coins' && (
          <>
            <label className="block mb-2 font-medium mt-3">Amount</label>
            <input
              className="w-full border rounded px-3 py-2 mb-3"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
            />
          </>
        )}
        <label className="block mb-2 font-medium">Message (optional)</label>
        <textarea
          className="w-full border rounded px-3 py-2 mb-3"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a message"
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button
            onClick={handleGift}
            className="px-4 py-2 rounded bg-blue-600 text-white"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Gift'}
          </button>
        </div>
      </div>
    </div>
  )
} 