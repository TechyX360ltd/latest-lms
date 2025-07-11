import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Message type for chat
type Message = {
  sender: 'user' | 'assistant';
  text: string;
};

const AIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<'ai' | 'admin'>('ai');
  const [adminChatId, setAdminChatId] = useState<string | null>(null);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const adminSubscriptionRef = useRef<any>(null);

  // Show welcome message on open
  useEffect(() => {
    if (open && messages.length === 0) {
      const firstName = user?.first_name || 'there';
      const welcome: Message = {
        sender: 'assistant',
        text: `Hi ${firstName}, I'm your AI assistant. Ask me a question, and I will be happy to assist. How can I help today?`,
      };
      setMessages([welcome]);
    }
  }, [open]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Helper: get or create chat session
  async function getOrCreateChatSession(userId: string) {
    // 1. Try to find an open chat for this user
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'open')
      .limit(1);
    if (error) return null;
    if (chats && chats.length > 0) return chats[0].id;
    // 2. Create a new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([{ user_id: userId }])
      .select('id')
      .single();
    if (createError) return null;
    return newChat.id;
  }

  // Effect: When switching to admin mode, get/create chat and subscribe to messages
  useEffect(() => {
    if (chatMode !== 'admin' || !user?.id) return;
    let isMounted = true;
    setAdminLoading(true);
    getOrCreateChatSession(user.id).then((chatId) => {
      if (!isMounted) return;
      setAdminChatId(chatId);
      if (!chatId) {
        setAdminMessages([
          { sender: 'assistant', text: 'Could not start chat session. Please try again later.' },
        ]);
        setAdminLoading(false);
        return;
      }
      // Fetch existing messages
      supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (!isMounted) return;
          setAdminMessages(
            (data || []).map((m: any) => ({
              sender: m.sender_role === 'user' ? 'user' : 'assistant',
              text: m.content,
            }))
          );
          setAdminLoading(false);
        });
      // Subscribe to new messages
      if (adminSubscriptionRef.current) {
        supabase.removeChannel(adminSubscriptionRef.current);
      }
      const channel = supabase
        .channel('admin-chat-' + chatId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          (payload) => {
            const m = payload.new;
            setAdminMessages((msgs) => [
              ...msgs,
              { sender: m.sender_role === 'user' ? 'user' : 'assistant', text: m.content },
            ]);
          }
        )
        .subscribe();
      adminSubscriptionRef.current = channel;
    });
    return () => {
      isMounted = false;
      if (adminSubscriptionRef.current) {
        supabase.removeChannel(adminSubscriptionRef.current);
        adminSubscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [chatMode, user?.id]);

  // Send message in admin chat
  async function handleAdminSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!adminInput.trim() || !adminChatId || !user?.id) return;
    setAdminLoading(true);

    // Optimistically add the message to the UI
    setAdminMessages((msgs) => [
      ...msgs,
      { sender: 'user', text: adminInput },
    ]);

    await supabase.from('messages').insert([
      {
        chat_id: adminChatId,
        sender_id: user.id,
        sender_role: 'user',
        content: adminInput,
      },
    ]);
    setAdminInput('');
    setAdminLoading(false);
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    setLoading(true);

    // TODO: Replace with your backend endpoint
    try {
      const response = await fetch('https://rpexcrwcgdmlfxihdmny.functions.supabase.co/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const aiMessage: Message = { sender: 'assistant', text: data.reply || 'Sorry, I could not answer that.' };
      setMessages((msgs) => [
        ...msgs,
        aiMessage,
      ]);
    } catch (e) {
      const errorMessage: Message = { sender: 'assistant', text: 'Sorry, there was an error connecting to the assistant.' };
      setMessages((msgs) => [
        ...msgs,
        errorMessage,
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-white"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
        >
          {/* AI Bot Avatar */}
          <span className="block w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#fff" />
              <ellipse cx="16" cy="20" rx="8" ry="5" fill="#e0e7ef" />
              <circle cx="16" cy="14" r="8" fill="#6366f1" />
              <ellipse cx="13" cy="13.5" rx="1.5" ry="2" fill="#fff" />
              <ellipse cx="19" cy="13.5" rx="1.5" ry="2" fill="#fff" />
              <rect x="13" y="17" width="6" height="2" rx="1" fill="#fff" />
            </svg>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full bg-white rounded-3xl shadow-2xl flex flex-col border border-gray-200 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 rounded-t-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500">
            <div className="flex items-center gap-3">
              <span className="block w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <circle cx="16" cy="16" r="16" fill="#fff" />
                  <ellipse cx="16" cy="20" rx="8" ry="5" fill="#e0e7ef" />
                  <circle cx="16" cy="14" r="8" fill="#6366f1" />
                  <ellipse cx="13" cy="13.5" rx="1.5" ry="2" fill="#fff" />
                  <ellipse cx="19" cy="13.5" rx="1.5" ry="2" fill="#fff" />
                  <rect x="13" y="17" width="6" height="2" rx="1" fill="#fff" />
                </svg>
              </span>
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700">Ask Me Anything</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-6 h-6 text-white hover:text-gray-200" />
            </button>
          </div>
          {/* Chat Mode Switcher */}
          <div className="flex items-center justify-center gap-2 px-6 pt-4">
            <button
              className={`px-3 py-1 rounded-lg font-medium transition-colors duration-150 ${chatMode === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setChatMode('ai')}
            >
              Ask AI
            </button>
            <button
              className={`px-3 py-1 rounded-lg font-medium transition-colors duration-150 ${chatMode === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setChatMode('admin')}
            >
              Talk to Admin
            </button>
          </div>
          {/* Chat Content */}
          {chatMode === 'ai' ? (
            <>
              {/* AI Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-white via-blue-50 to-purple-50 rounded-b-3xl" style={{ maxHeight: 400 }}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-5 py-3 rounded-2xl max-w-[75%] shadow-md text-base font-medium transition-all duration-200 ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-br-none'
                          : idx === 0
                            ? 'bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 text-blue-900 rounded-bl-none animate-fade-in-slow'
                            : 'bg-white text-gray-900 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-400 animate-pulse shadow-md">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* AI Input */}
              <form
                className="flex items-center gap-3 border-t px-6 py-4 bg-white rounded-b-3xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-gradient-to-r from-blue-50 to-purple-50 placeholder-gray-400 shadow-sm"
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-3 rounded-full bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500 text-white hover:scale-110 transition-transform duration-200 shadow-lg disabled:opacity-50"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Admin Chat Real-Time */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-white via-purple-50 to-blue-50 rounded-b-3xl" style={{ maxHeight: 400 }}>
                {adminLoading && <div className="text-center text-purple-500">Loading chat...</div>}
                {adminMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-5 py-3 rounded-2xl max-w-[75%] shadow-md text-base font-medium transition-all duration-200 ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-br-none'
                          : 'bg-white text-purple-900 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Admin Chat Input */}
              <form
                className="flex items-center gap-3 border-t px-6 py-4 bg-white rounded-b-3xl"
                onSubmit={handleAdminSend}
              >
                <input
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base bg-gradient-to-r from-purple-50 to-blue-50 placeholder-gray-400 shadow-sm"
                  type="text"
                  placeholder="Type your message to admin..."
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  disabled={adminLoading || !adminChatId}
                />
                <button
                  type="submit"
                  className="p-3 rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-500 text-white hover:scale-110 transition-transform duration-200 shadow-lg disabled:opacity-50"
                  disabled={adminLoading || !adminInput.trim() || !adminChatId}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatWidget;

// Tailwind custom animation
// Add this to your global CSS if not present:
// .animate-fade-in-slow { animation: fadeIn 1.2s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none;} } 