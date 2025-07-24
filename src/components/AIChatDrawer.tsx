import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Message type for chat
// ... (reuse Message type from AIChatWidget)
type Message = {
  sender: 'user' | 'assistant';
  text: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
};

const AIChatDrawer: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // ... (admin chat state from AIChatWidget)
  const [chatMode, setChatMode] = useState<'ai' | 'admin'>('ai');
  const [adminChatId, setAdminChatId] = useState<string | null>(null);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const adminSubscriptionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (all AIChatWidget logic, effects, handlers, etc.)
  // (Omitted here for brevity, but will be copied in full)

  // Drag logic for floating button
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent | TouchEvent) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setDragX(clientX - (dragStartX || 0));
    }
    function onUp(e: MouseEvent | TouchEvent) {
      setDragging(false);
      setDragStartX(null);
      setDragX(0);
      // Snap to nearest side
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
      if (window.innerWidth && clientX < window.innerWidth / 2) {
        setSide('left');
      } else {
        setSide('right');
      }
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, dragStartX]);

  // Floating button position
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    left: side === 'left' ? 24 + dragX : 'auto',
    right: side === 'right' ? 24 - dragX : 'auto',
    zIndex: 1000,
    transition: dragging ? 'none' : 'left 0.3s, right 0.3s',
    cursor: dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <>
      {/* Floating Button (draggable) */}
      {!open && (
        <button
          ref={buttonRef}
          style={buttonStyle}
          className="bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 border-4 border-white"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          onMouseDown={e => { setDragging(true); setDragStartX(e.clientX); }}
          onTouchStart={e => { setDragging(true); setDragStartX(e.touches[0].clientX); }}
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
      {/* Drawer */}
      {open && (
        <div
          className={`fixed bottom-6 ${side === 'right' ? 'right-6' : 'left-6'} z-50 w-96 max-w-full bg-white rounded-3xl shadow-2xl flex flex-col border border-gray-200 animate-fade-in`}
          style={{ transition: 'left 0.3s, right 0.3s' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 rounded-t-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 cursor-move"
            onMouseDown={e => { setDragging(true); setDragStartX(e.clientX); }}
            onTouchStart={e => { setDragging(true); setDragStartX(e.touches[0].clientX); }}
          >
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
          {/* ...rest of chat UI from AIChatWidget... */}
        </div>
      )}
    </>
  );
};

export default AIChatDrawer; 