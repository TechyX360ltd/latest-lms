import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Circle, X, CheckCircle, RotateCcw } from 'lucide-react';

interface Chat {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  user?: { first_name?: string; last_name?: string; email?: string };
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  content: string;
  created_at: string;
  is_read?: boolean;
  read_at?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

const AdminLiveSupport: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const chatSubscriptionRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState<Record<string, { first_name?: string; last_name?: string; email?: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get admin id from supabase auth
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setAdminId(data?.user?.id || null);
    };
    getUser();
  }, []);

  // Fetch all users and build a map by id
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('id, first_name, last_name, email');
      if (!error && data) {
        const map: Record<string, { first_name?: string; last_name?: string; email?: string }> = {};
        data.forEach((u: any) => {
          map[u.id] = { first_name: u.first_name, last_name: u.last_name, email: u.email };
        });
        setUsersMap(map);
      }
    };
    fetchUsers();
  }, []);

  // Fetch open chats with unread counts
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .in('status', ['open', 'closed', 'resolved'])
        .order('created_at', { ascending: false });
      if (!error && data) {
        // For each chat, fetch last message and unread count
        const chatList: Chat[] = await Promise.all(
          (data as any[]).map(async (chat: any) => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            const { data: unreadCount } = await supabase.rpc('get_chat_unread_count', {
              p_chat_id: chat.id
            });
            return {
              ...chat,
              last_message: lastMsg?.content || '',
              last_message_time: lastMsg?.created_at || chat.created_at,
              unread_count: unreadCount || 0,
            };
          })
        );
        setChats(chatList);
      }
      setLoading(false);
    };
    fetchChats();

    // Real-time: subscribe to new chats
    const chatChannel = supabase
      .channel('admin-chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload: any) => {
        // Refetch chats on new chat
        fetchChats();
      })
      .subscribe();

    // Real-time: subscribe to new/updated messages for all chats
    const messageChannel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        // Refetch chats on new/updated message (for last message, unread count)
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(messageChannel);
    };
  }, []);

  // Mark messages as read when selecting a chat
  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    
    // Mark messages as read for this chat
    if (adminId) {
      await supabase.rpc('mark_chat_messages_as_read', {
        p_chat_id: chat.id,
        p_user_id: adminId,
        p_user_role: 'admin'
      });
      
      // Update the chat's unread count in the list
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chat.id ? { ...c, unread_count: 0 } : c
        )
      );
    }
  };

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    setChatLoading(true);
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', selectedChat.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || []);
        setChatLoading(false);
      });
    // Subscribe to new messages
    if (chatSubscriptionRef.current) {
      supabase.removeChannel(chatSubscriptionRef.current);
    }
    const channel = supabase
      .channel('admin-live-support-' + selectedChat.id)
              .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${selectedChat.id}` },
          (payload: any) => {
            const m = payload.new;
            setMessages((msgs) => [...msgs, m]);
            
            // If it's a user message, update unread count
            if (m.sender_role === 'user') {
              setChats(prevChats => 
                prevChats.map(c => 
                  c.id === selectedChat.id 
                    ? { ...c, unread_count: (c.unread_count || 0) + 1 }
                    : c
                )
              );
            }
          }
        )
      .subscribe();
    chatSubscriptionRef.current = channel;
    return () => {
      if (chatSubscriptionRef.current) {
        supabase.removeChannel(chatSubscriptionRef.current);
        chatSubscriptionRef.current = null;
      }
    };
  }, [selectedChat]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  // Send admin message
  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedChat || !adminId) return;
    await supabase.from('messages').insert([
      {
        chat_id: selectedChat.id,
        sender_id: adminId,
        sender_role: 'admin',
        content: input,
        is_read: false, // User messages start as unread
      },
    ]);
    setInput('');
  }

  // Close chat
  async function handleCloseChat() {
    if (!selectedChat || !adminId) return;
    
    await supabase.rpc('close_chat', {
      p_chat_id: selectedChat.id,
      p_admin_id: adminId,
      p_reason: 'Closed by admin'
    });
    
    // Update chat status in the list
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === selectedChat.id 
          ? { ...c, status: 'closed' }
          : c
      )
    );
    
    // Clear selected chat
    setSelectedChat(null);
  }

  // Resolve chat
  async function handleResolveChat() {
    if (!selectedChat || !adminId) return;
    
    await supabase.rpc('resolve_chat', {
      p_chat_id: selectedChat.id,
      p_admin_id: adminId,
      p_resolution: 'Issue resolved'
    });
    
    // Update chat status in the list
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === selectedChat.id 
          ? { ...c, status: 'resolved' }
          : c
      )
    );
    
    // Clear selected chat
    setSelectedChat(null);
  }

  // Reopen chat
  async function handleReopenChat() {
    if (!selectedChat || !adminId) return;
    
    await supabase.rpc('reopen_chat', {
      p_chat_id: selectedChat.id,
      p_admin_id: adminId
    });
    
    // Update chat status in the list
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === selectedChat.id 
          ? { ...c, status: 'open' }
          : c
      )
    );
  }

  // Filter chats based on search term (using user name/email if available)
  const filteredChats = chats.filter(chat => {
    const user = usersMap[chat.user_id];
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.toLowerCase();
    const userEmail = user?.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    if (!searchTerm) return true;
    return userName.includes(searchLower) || userEmail.includes(searchLower) || chat.user_id.includes(searchLower);
  });

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !adminId) return;
    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      alert('File size must not exceed 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const filePath = `${selectedChat.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, file);
    if (uploadError) {
      alert('File upload failed');
      return;
    }
    const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(filePath);
    const file_url = publicUrlData?.publicUrl;
    // Send message with file metadata
    await supabase.from('messages').insert([
      {
        chat_id: selectedChat.id,
        sender_id: adminId,
        sender_role: 'admin',
        content: '',
        file_url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      },
    ]);
    // Optimistically add to UI
    setMessages((msgs) => [
      ...msgs,
      {
        id: '',
        chat_id: selectedChat.id,
        sender_id: adminId,
        sender_role: 'admin',
        content: '',
        created_at: new Date().toISOString(),
        file_url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="flex h-[70vh] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Chat List */}
      <div className="w-1/3 bg-gradient-to-b from-blue-50 to-purple-50 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-blue-700 mb-4">Live Support Chats</h2>
        
        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        {loading ? (
          <div className="text-blue-500">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="text-gray-500">
            {searchTerm ? 'No chats match your search' : 'No chats available'}
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredChats.map((chat) => {
              const user = usersMap[chat.user_id];
              const displayName = user?.first_name || user?.last_name
                ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                : user?.email || chat.user_id;
              return (
                <li
                  key={chat.id}
                  className={`rounded-xl p-3 cursor-pointer transition-all relative ${
                    selectedChat?.id === chat.id 
                      ? 'bg-white shadow border border-blue-300' 
                      : 'hover:bg-blue-100'
                  }`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-blue-900">
                      {displayName}
                    </div>
                  <div className="flex items-center gap-2">
                    {/* Status indicator */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      chat.status === 'open' 
                        ? 'bg-green-100 text-green-700' 
                        : chat.status === 'closed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {chat.status}
                    </span>
                    {/* Unread indicator */}
                    {chat.unread_count && chat.unread_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                          {chat.unread_count > 99 ? '99+' : chat.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 truncate mt-1">{chat.last_message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(chat.last_message_time || chat.created_at).toLocaleString()}
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>
      {/* Chat Conversation */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg text-purple-700">
                {selectedChat ? `${selectedChat.user?.first_name || 'User'} ${selectedChat.user?.last_name || ''}` : 'Select a chat'}
              </div>
              <div className="text-xs text-gray-500">
                {selectedChat ? selectedChat.user?.email : ''}
              </div>
            </div>
            {selectedChat && (
              <div className="flex items-center gap-2">
                {/* Status badge */}
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  selectedChat.status === 'open' 
                    ? 'bg-green-100 text-green-700' 
                    : selectedChat.status === 'closed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedChat.status}
                </span>
                {/* Action buttons */}
                {selectedChat.status === 'open' && (
                  <>
                    <button
                      onClick={handleResolveChat}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                      title="Resolve chat"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Resolve
                    </button>
                    <button
                      onClick={handleCloseChat}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                      title="Close chat"
                    >
                      <X className="w-3 h-3" />
                      Close
                    </button>
                  </>
                )}
                {(selectedChat.status === 'closed' || selectedChat.status === 'resolved') && (
                  <button
                    onClick={handleReopenChat}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    title="Reopen chat"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-white via-blue-50 to-purple-50">
          {chatLoading && <div className="text-center text-purple-500">Loading messages...</div>}
          {selectedChat && messages.length === 0 && !chatLoading && (
            <div className="text-center text-gray-400">No messages yet</div>
          )}
          {selectedChat && messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-5 py-3 rounded-2xl max-w-[75%] shadow-md text-base font-medium transition-all duration-200 relative ${
                  msg.sender_role === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-br-none'
                    : 'bg-white text-purple-900 rounded-bl-none'
                }`}
              >
                {msg.file_url ? (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    {msg.file_name || 'Download file'}
                  </a>
                ) : (
                  msg.content
                )}
                {/* Read indicator for admin messages */}
                {msg.sender_role === 'admin' && (
                  <div className="text-xs opacity-70 mt-1">
                    {msg.is_read ? '✓ Read' : '✓ Sent'}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form
          className="flex items-center gap-3 border-t px-6 py-4 bg-white"
          onSubmit={handleSend}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={!selectedChat}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2h7.79a2 2 0 011.42.59l4.2 4.2a2 2 0 01.59 1.42z" /></svg>
          </button>
          <input
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base bg-gradient-to-r from-purple-50 to-blue-50 placeholder-gray-400 shadow-sm"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedChat}
          />
          <button
            type="submit"
            className="p-3 rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-500 text-white hover:scale-110 transition-transform duration-200 shadow-lg disabled:opacity-50"
            disabled={!input.trim() || !selectedChat}
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLiveSupport; 