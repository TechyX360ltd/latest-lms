import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { StoreItem } from '../../types/gamification';
import { Search, User, Mail } from 'lucide-react';

export function GiftModal({ open, onClose, giftType, itemId, storeItems = [] }: {
  open: boolean,
  onClose: () => void,
  giftType: 'coins' | 'item',
  itemId?: string,
  storeItems?: StoreItem[]
}) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enhanced user search - search by name and email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRecipientEmail(value)
    setRecipientId(null)
    setSuccess('')
    setError('')
    setShowDropdown(false)
    setSearchResults([])
    setSelectedIndex(-1)
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    
    if (value.length >= 2) {
      setSearchLoading(true)
      searchTimeout.current = setTimeout(async () => {
        try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
            .or(`email.ilike.%${value}%,first_name.ilike.%${value}%,last_name.ilike.%${value}%`)
            .limit(8)
          
        if (!error && data && data.length > 0) {
          setSearchResults(data)
          setShowDropdown(true)
        } else {
          setSearchResults([])
          setShowDropdown(false)
          }
        } catch (err) {
          console.error('Search error:', err)
          setSearchResults([])
          setShowDropdown(false)
        } finally {
          setSearchLoading(false)
        }
      }, 300)
    } else {
      setSearchLoading(false)
    }
  }

  const handleSelectUser = (user: any) => {
    setRecipientEmail(user.email)
    setRecipientId(user.id)
    setShowDropdown(false)
    setSearchResults([])
    setSelectedIndex(-1)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectUser(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setRecipientEmail('')
      setRecipientId(null)
      setSearchResults([])
      setShowDropdown(false)
      setSelectedIndex(-1)
      setAmount('')
      setMessage('')
      setSuccess('')
      setError('')
    }
  }, [open])

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
      sender_id: session.data.session?.user.id, // sender's user id
      recipient_id: finalRecipientId, // recipient's user id
      amount: Number(amount),
      message,
      gift_type: giftType,
    };
    if (giftType === 'item') body.item_id = itemId;

    const res = await fetch('http://localhost:4000/api/send-gift', {
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
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md mx-auto flex flex-col animate-fade-in overflow-hidden">
          {/* Custom Item Gifting Design */}
          {giftType === 'item' && itemId && (
            <div className="flex flex-col items-center bg-gradient-to-b from-pink-100 to-yellow-50 p-6 pb-2">
              {/* Item Image */}
              <img
                src={(() => {
                  const item = storeItems.find((i: any) => i.id === itemId);
                  return item?.icon_url || '/3dicons-gift-box-dynamic-color.png';
                })()}
                alt="Gift Item"
                className="w-24 h-24 object-contain rounded-full shadow-lg border-4 border-yellow-200 mb-2"
              />
              {/* Item Name */}
              <h3 className="text-2xl font-extrabold text-pink-700 text-center w-full truncate drop-shadow mb-1">
                {(() => {
                  const item = storeItems.find((i: any) => i.id === itemId);
                  return item?.name || 'Gift Item';
                })()}
              </h3>
              {/* Item Description */}
              <p className="text-center text-gray-600 font-medium mb-2 w-full min-h-[40px]">
                {(() => {
                  const item = storeItems.find((i: any) => i.id === itemId);
                  return item?.description || '';
                })()}
              </p>
            </div>
          )}
          {/* Form Section */}
          <form
            className="flex flex-col gap-4 p-8 pt-4"
            onSubmit={e => {
              e.preventDefault();
              handleGift();
            }}
          >
            <div className="flex flex-col gap-1 max-w-lg w-full">
              <span className="text-sm font-medium text-gray-700">Recipient</span>
              <div className="relative w-full">
                <input
                  type="text"
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                  value={recipientEmail}
                  onChange={handleEmailChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowDropdown(true)}
                  ref={inputRef}
                  placeholder="Search by name or email..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {searchLoading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Search className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 mt-1 left-0 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto border border-gray-200"
                  >
                    {searchResults.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                          {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && !searchLoading && (
                      <div className="p-4 text-gray-500 text-center text-sm">
                        No users found. Try searching by name or email.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 max-w-lg w-full">
              <span className="text-sm font-medium text-gray-700">Message (optional)</span>
              <textarea
                className="border border-gray-300 rounded-lg px-3 py-2 w-full min-h-[60px] focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a message"
              />
            </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button
                type="submit"
                className="px-6 py-2 rounded bg-pink-600 text-white text-lg font-bold shadow-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Gift'}
          </button>
            </div>
          </form>
      </div>
    </div>
  )
  );
} 