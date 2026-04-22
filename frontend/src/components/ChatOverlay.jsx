import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Minimize2, Maximize2, Send, ArrowLeft, 
  Phone, Video, MoreVertical, Check, CheckCheck, ChevronDown,
  Sparkles, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCall } from '../context/CallContext';
import socket from '../lib/socket';

const ChatOverlay = () => {
  const { user } = useAuth();
  const { 
    sessions, currentMessages: messages, loading, activeSessionId,
    isChatOpen, minimized, openChat, closeChat, setMinimized,
    setActiveSessionId, fetchMessages, sendMessage, clearUnread
  } = useChat();
  const { initiateCall } = useCall();

  const [message, setMessage] = useState('');
  const [sendAsExpert, setSendAsExpert] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load session when activeSessionId changes
  useEffect(() => {
    if (activeSessionId && isChatOpen) {
      fetchMessages(activeSessionId);
      socket.emit('join_chat', { sessionId: activeSessionId });
      socket.emit('mark_read', { sessionId: activeSessionId });

      const sess = sessions.find(s => s.id === activeSessionId);
      setCurrentSession(sess);
    }
  }, [activeSessionId, isChatOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (!activeSessionId) return;
    const handleTyping = ({ isTyping, name }) => setIsPartnerTyping(isTyping);
    socket.on('typing_status', handleTyping);
    return () => socket.off('typing_status', handleTyping);
  }, [activeSessionId]);

  const handleSend = () => {
    if (!message.trim() || !activeSessionId) return;

    const overrideSenderId = (user.role === 'ADMIN' && sendAsExpert && currentSession?.expertId) 
      ? currentSession.expert?.userId 
      : null;

    sendMessage(activeSessionId, message.trim(), 'TEXT', overrideSenderId);
    setMessage('');
  };

  const handleTyping = () => {
    if (!activeSessionId) return;
    socket.emit('typing_status', { sessionId: activeSessionId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_status', { sessionId: activeSessionId, isTyping: false });
    }, 2000);
  };

  const getPartnerInfo = (session) => {
    if (!session || !user) return { name: 'Unknown', avatar: null };
    if (user.role === 'ADMIN') {
      const seekerName = session.user?.name || 'Seeker';
      const expertName = session.expert?.user?.name || session.expert?.displayName || 'Expert';
      return { name: `${seekerName} ↔ ${expertName}`, avatar: null };
    }
    if (user.id === session.userId) {
      return { 
        name: session.expert?.displayName || session.expert?.user?.name || session.counselor?.displayName || 'Expert',
        avatar: session.expert?.profileImage || session.expert?.user?.avatar
      };
    }
    return {
      name: session.isAnonymous ? 'Anonymous Soul' : (session.user?.name || 'Seeker'),
      avatar: session.isAnonymous ? null : session.user?.avatar
    };
  };

  const totalUnread = sessions.reduce((sum, s) => sum + (s._unreadCount || 0), 0);

  if (!user) return null;

  // ─── MINIMIZED: Floating Chat Bubble (WhatsApp Style persistence) ───
  if (!isChatOpen || minimized) {
    return (
      <motion.button
        initial={{ scale: 0, y: 20, rotate: -20 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        whileHover={{ scale: 1.1, y: -5, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (minimized && activeSessionId) {
            setMinimized(false);
          } else if (sessions.length > 0) {
            openChat(sessions[0]?.id);
          } else {
            setIsChatOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_15px_35px_rgba(139,92,246,0.4)] border border-white/30 backdrop-blur-md group"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative">
          <MessageCircle size={28} className="text-white drop-shadow-lg" />
          {totalUnread > 0 && (
            <motion.span 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="absolute -top-4 -right-4 min-w-[24px] h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 border-2 border-[#06070f] shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </motion.span>
          )}
          {isPartnerTyping && (
            <span className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-[#06070f] shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          )}
        </div>
      </motion.button>
    );
  }

  // ─── EXPANDED: Full Chat Overlay ───
  const partner = currentSession ? getPartnerInfo(currentSession) : null;
  const activeSessions = sessions.filter(s => s.status !== 'COMPLETED' && s.status !== 'TERMINATED');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
        className="fixed bottom-6 right-6 z-[9999] w-[420px] h-[650px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] bg-[#0c0d1b]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
      >
        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/30 border-b border-white/5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {activeSessionId && !showSidebar ? (
              <button onClick={() => { setActiveSessionId(null); setShowSidebar(true); }}>
                <ArrowLeft size={18} className="text-white/60 hover:text-white" />
              </button>
            ) : null}

            {partner?.avatar ? (
              <img src={partner.avatar} className="w-8 h-8 rounded-full object-cover border border-purple-500/30" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                <Sparkles size={14} className="text-purple-400" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{partner?.name || 'NovaSathi Chat'}</p>
              {isPartnerTyping && <p className="text-[10px] text-emerald-400 animate-pulse">typing...</p>}
              {currentSession?.status === 'ACTIVE' && !isPartnerTyping && (
                <p className="text-[10px] text-emerald-400/70">Active</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeSessionId && currentSession?.status === 'ACTIVE' && (
              <>
                <button onClick={() => initiateCall(activeSessionId, 'voice', partner)} className="p-2 hover:bg-white/5 rounded-lg">
                  <Phone size={14} className="text-emerald-400" />
                </button>
                <button onClick={() => initiateCall(activeSessionId, 'video', partner)} className="p-2 hover:bg-white/5 rounded-lg">
                  <Video size={14} className="text-indigo-400" />
                </button>
              </>
            )}
            <button onClick={() => setMinimized(true)} className="p-2 hover:bg-white/5 rounded-lg">
              <Minimize2 size={14} className="text-white/40" />
            </button>
            <button onClick={closeChat} className="p-2 hover:bg-white/5 rounded-lg">
              <X size={14} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* ─── BODY ─── */}
        {!activeSessionId || showSidebar ? (
          /* ─── SESSION LIST ─── */
          <div className="flex-1 overflow-y-auto">
            {activeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 text-center p-6">
                <MessageCircle size={40} className="mb-4" />
                <p className="text-sm">No active conversations</p>
              </div>
            ) : (
              activeSessions.map(sess => {
                const p = getPartnerInfo(sess);
                const lastMsg = sess.messages?.[0] || sess.messages?.[sess.messages.length - 1];
                return (
                  <button
                    key={sess.id}
                    onClick={() => { openChat(sess.id); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 text-left"
                  >
                    {p.avatar ? (
                      <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 text-sm font-bold">
                        {(p.name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sess.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {sess.status === 'ACTIVE' ? 'Live' : sess.status}
                        </span>
                      </div>
                      {lastMsg && <p className="text-xs text-white/40 truncate mt-0.5">{lastMsg.content}</p>}
                    </div>
                    {(sess._unreadCount || 0) > 0 && (
                      <span className="w-5 h-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {sess._unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* ─── MESSAGES ─── */
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full opacity-30">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      isOwn 
                        ? 'bg-purple-600/80 text-white rounded-br-sm' 
                        : 'bg-white/10 text-white/90 rounded-bl-sm'
                    }`}>
                      {msg.adminInterventionId && (
                        <div className="flex items-center gap-1 mb-1">
                          <ShieldCheck size={10} className="text-amber-400" />
                          <span className="text-[9px] text-amber-400">Admin</span>
                        </div>
                      )}
                      <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] opacity-50">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                          msg.isOptimistic ? (
                             <Clock size={10} className="text-white/40 animate-pulse" />
                          ) : msg.isRead ? (
                             <CheckCheck size={12} className="text-sky-400" />
                          ) : (
                             <Check size={12} className="opacity-40" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ─── ADMIN CONTROLS ─── */}
        {user?.role === 'ADMIN' && activeSessionId && !showSidebar && (
          <div className="px-4 py-1.5 border-t border-white/5 bg-amber-500/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendAsExpert} onChange={(e) => setSendAsExpert(e.target.checked)} className="rounded" />
              <ShieldCheck size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-400 font-semibold">Send as Expert</span>
            </label>
          </div>
        )}

        {/* ─── INPUT ─── */}
        {activeSessionId && !showSidebar && currentSession?.status !== 'COMPLETED' && currentSession?.status !== 'TERMINATED' && (
          <div className="px-3 py-2.5 border-t border-white/5 bg-[#0d0e18]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatOverlay;
