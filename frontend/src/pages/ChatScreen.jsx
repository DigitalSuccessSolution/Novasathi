import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Send, Phone, Video, MoreVertical, Info, Sparkles,
  ShieldCheck, Menu, X, Check, CheckCheck, Mic, MicOff, VideoOff, PhoneOff, Volume2,
  Lock, EyeOff, ShieldAlert, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from '../components/ChatSidebar';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import socket from '../lib/socket';

// ─── Sub-Components ───

const ChatMessage = React.memo(({ msg, isOwn, onHeart, formatTime }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-4`}
      onDoubleClick={() => onHeart(msg.id)}
    >
      <div className="relative max-w-[85%] md:max-w-[70%]">
        <div className={`rounded-2xl px-5 py-3.5 transition-all duration-300 shadow-xl ${
          isOwn 
            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-br-none shadow-purple-900/10' 
            : 'bg-[#1a1c2e] border border-white/10 text-gray-200 rounded-bl-none shadow-black/20'
        } ${msg.reaction ? 'ring-2 ring-pink-500/30 mb-2' : ''}`}>
          {msg.isFiltered ? (
            <div className="flex items-center gap-2 py-1 italic opacity-50">
              <EyeOff size={14} />
              <span className="text-xs">Message hidden for security</span>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium">{msg.content}</p>
          )}
          
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
            <p className={`text-[10px] font-bold uppercase tracking-wider opacity-40`}>
               {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
            {isOwn && (
              <div className="flex items-center gap-1">
                {msg.isOptimistic ? (
                  <Clock size={10} className="text-white/40 animate-pulse" />
                ) : msg.isRead ? (
                  <CheckCheck size={14} className="text-sky-300" />
                ) : (
                  <Check size={14} className="opacity-30" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {msg.reaction && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'}`}
          >
            <div className="bg-pink-600 rounded-full py-1 px-2 border-2 border-[#1a1c2e] shadow-xl text-[12px] flex items-center justify-center">
              {msg.reaction}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

const IntakeOverlay = ({ show, data }) => (
  <AnimatePresence>
    {show && data && (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-[#0c0d1b]/95 border-b border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl relative z-20"
      >
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Seeker Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Name</p>
                      <p className="text-sm font-medium text-emerald-400">{data.name}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Birth Details</p>
                      <p className="text-sm font-medium text-white">
                          {data.dob} {data.tob && `@ ${data.tob}`}
                      </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Gender</p>
                      <p className="text-sm font-medium text-white">{data.gender}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Place</p>
                      <p className="text-sm font-medium text-white">{data.city}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 col-span-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Primary Concern</p>
                      <p className="text-sm font-medium text-indigo-300 italic">"{data.concern}"</p>
                  </div>
              </div>
            </div>

            {data.partnerName && (
              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                      <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Partner Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Partner Name</p>
                          <p className="text-sm font-medium text-purple-400">{data.partnerName}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Birth Details</p>
                          <p className="text-sm font-medium text-white">
                              {data.partnerDob} {data.partnerTob && `@ ${data.partnerTob}`}
                          </p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Gender</p>
                          <p className="text-sm font-medium text-white">{data.partnerGender}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Place</p>
                          <p className="text-sm font-medium text-white">{data.partnerCity || 'Not specified'}</p>
                      </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ChatScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user, token, updateWalletBalance } = useAuth();
  
  const { 
    sessions, currentMessages: messages, loading: chatLoading,
    setActiveSessionId, fetchMessages, sendMessage, reactToMessage
  } = useChat();

  const { callActive, isCalling, incomingCall, callType, initiateCall, endCall } = useCall();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sendAsExpert, setSendAsExpert] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [initLoading, setInitLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [liveBalance, setLiveBalance] = useState(0);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [resolvedId, setResolvedId] = useState(null);
  const [autoCallStarted, setAutoCallStarted] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const statusRef = useRef(null);
  const sessionRef = useRef(null);
  const isLoading = initLoading || chatLoading;

  // ─── Sync Status for Auto-End Cleanup & Socket Handlers ───
  useEffect(() => {
    statusRef.current = currentSession?.status;
    sessionRef.current = currentSession;
  }, [currentSession]);

  // ─── Leave Room on Unmount (Triggers 45s backend timeout) ───
  useEffect(() => {
    return () => {
      if (resolvedId) {
        socket.emit('leave_chat', { sessionId: resolvedId });
      }
    };
  }, [resolvedId]);

  // ─── Timer for Elapsed Duration ───
  useEffect(() => {
    let timer;
    if (currentSession?.status === 'ACTIVE') {
      timer = setInterval(() => {
        const start = currentSession.startedAt || currentSession.createdAt;
        const diff = Math.floor((new Date() - new Date(start)) / 1000);
        setElapsedTime(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [currentSession?.status, currentSession?.startedAt, currentSession?.createdAt]);

  // ─── Scroll to bottom on new messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Initialize Chat Session ───
  useEffect(() => {
    setTimeLeft(null); 
    setLiveBalance(0);
    setSessionEarnings(0);

    if (!id || !token || !user) {
      setInitLoading(false);
      return;
    }
    
    const initializeChat = async () => {
      let targetId = id === 'active' ? null : id;
      
      if (id === 'active' && sessions?.length > 0) {
        targetId = sessions[0].id;
        window.history.replaceState(null, '', `/chat/${targetId}`);
      }

      if (!targetId) {
        setInitLoading(false);
        return;
      }

      // Avoid re-initialization if same ID
      if (sessionRef.current?.id === targetId && messages.length > 0) {
        setInitLoading(false);
        return;
      }

      setInitLoading(true);
      try {
        setResolvedId(targetId);
        setActiveSessionId(targetId);
        await fetchMessages(targetId);
        
        const sessRes = await api.get(`/chat/session/${targetId}`);
        const sessData = sessRes.data.data;
        setCurrentSession(sessData);
        
        if (user.id === sessData.userId) {
          setLiveBalance(sessData.walletBalance || user.wallet?.balance || 0);
        }

        if (sessData.status === 'ACTIVE') {
          const now = new Date();
          const startedAt = sessData.startedAt || sessData.createdAt;
          const elapsed = Math.floor((now - new Date(startedAt)) / 1000);
          
          if (sessData.isFreeSession) {
            setTimeLeft(Math.max(0, 600 - elapsed));
          } else if (user.role === 'USER' && sessData.pricePerMinute > 0) {
            const bal = sessData.walletBalance || user.wallet?.balance || 0;
            const totalAvailable = Math.floor((bal / sessData.pricePerMinute) * 60);
            setTimeLeft(Math.max(0, totalAvailable - elapsed));
          }
        }

        // Auto-call logic (only once per session mount)
        const params = new URLSearchParams(location.search);
        if (params.get('autoCall') === 'true' && !autoCallStarted && !callActive) {
          setAutoCallStarted(true);
          const rType = params.get('type') === 'video' ? 'video' : 'voice';
          
          // Use the actual partner info computed below if possible, 
          // but since this effect runs earlier, we ensure sessData is fresh.
          const expert = sessData.expert || sessData.counselor;
          const pInfo = {
            name: expert?.displayName || expert?.user?.name || sessData.expert?.displayName || sessData.counselor?.displayName || "Expert",
            avatar: expert?.profileImage || expert?.user?.avatar || null
          };
          setTimeout(() => initiateCall(targetId, rType, pInfo), 2000);
        }
      } catch (err) {
        console.error("❌ [CHAT_INIT_ERROR]", err);
      } finally {
        setInitLoading(false);
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user?.id]);

  // ─── Socket listeners for this page ───
  useEffect(() => {
    if (!resolvedId) return;

    const handleBalance = (data) => {
      if (user?.role === 'USER' && data.newBalance !== undefined) {
        setLiveBalance(data.newBalance);
        updateWalletBalance(data.newBalance);
      }
      
      if (user?.role === 'EXPERT') {
        // Update session-specific earnings
        setSessionEarnings(prev => prev + (sessionRef.current?.pricePerMinute || 0));
        
        // Update global wallet balance if provided
        if (data.expertBalance !== undefined) {
           updateWalletBalance(data.expertBalance);
        }
      }
      
      if (data.timeLeftSeconds !== undefined) setTimeLeft(data.timeLeftSeconds);
    };

    const handleEarnings = (data) => {
      if (user?.role === 'EXPERT') {
        console.log("💰 [EARNINGS_REALTIME] Credit received:", data.amount);
        // data.newTotalBalance is the expert's total wallet balance
        if (data.newTotalBalance !== undefined) {
          updateWalletBalance(data.newTotalBalance);
        }
      }
    };

    const handleStarted = (data) => {
      if (data.timerSeconds !== undefined) setTimeLeft(data.timerSeconds);
      setCurrentSession(prev => prev ? { ...prev, status: 'ACTIVE' } : prev);
    };

    const handleEnded = (data) => {
      setCurrentSession(prev => prev ? { ...prev, status: 'COMPLETED' } : prev);
      alert("This ritual has been completed.");
      navigate(user?.role === 'EXPERT' ? '/expert-panel' : '/dashboard');
    };

    const handleForce = (data) => {
      alert(data.message || "Session disconnected.");
      navigate(user?.role === 'EXPERT' ? '/expert-panel' : '/dashboard');
    };

    const handleTyping = (data) => {
      if (data.sessionId === resolvedId) setIsPartnerTyping(data.isTyping);
    };

    socket.on('balance_update', handleBalance);
    socket.on('earnings_update', handleEarnings);
    socket.on('session_started', handleStarted);
    socket.on('session_ended', handleEnded);
    socket.on('force_disconnect', handleForce);
    socket.on('typing_status', handleTyping);
    socket.on('partner_disconnected', (data) => {
      console.warn("Partner disconnected:", data);
      // Optional: show a toast or status indicator
    });

    return () => {
      socket.off('balance_update', handleBalance);
      socket.off('earnings_update', handleEarnings);
      socket.off('session_started', handleStarted);
      socket.off('session_ended', handleEnded);
      socket.off('force_disconnect', handleForce);
      socket.off('typing_status', handleTyping);
    };
  }, [resolvedId, user?.role, updateWalletBalance, navigate]);

  // ─── Timer countdown ───
  useEffect(() => {
    let timer;
    if (currentSession?.status === 'ACTIVE') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentSession?.status]);

  const partner = useMemo(() => {
    if (!currentSession) return { name: "Loading...", avatar: null };
    
    if (user?.role === 'ADMIN') {
      return {
        name: `${currentSession.user?.name} ↔ ${currentSession.expert?.displayName || currentSession.counselor?.displayName || 'Guide'}`,
        avatar: currentSession.user?.avatar,
      };
    }

    const isSeeker = user?.id === currentSession.userId;
    let otherParty = null;
    let displayName = null;
    let profileImage = null;

    if (isSeeker) {
      // For seeker, the partner is the expert or counselor
      const expert = currentSession.expert || currentSession.counselor;
      otherParty = expert?.user;
      
      // Highly resilient name extraction
      displayName = expert?.displayName || 
                    expert?.user?.name || 
                    otherParty?.name || 
                    currentSession.expert?.displayName || 
                    currentSession.counselor?.displayName ||
                    "Expert";
      
      profileImage = expert?.profileImage || 
                     expert?.user?.avatar || 
                     otherParty?.avatar || 
                     null;
    } else {
      // For expert, the partner is the user
      otherParty = currentSession.user;
      const showAnonymous = currentSession.isAnonymous;
      displayName = showAnonymous ? "Anonymous User" : (otherParty?.name || "User");
      profileImage = showAnonymous ? null : otherParty?.avatar;
    }
    
    let avatarUrl = profileImage;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').split('/api')[0];
      avatarUrl = `${baseUrl}/${avatarUrl}`;
    }

    return {
      name: displayName,
      avatar: avatarUrl
    };
  }, [currentSession, user?.role, user?.id]);

  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ─── Handlers ───
  const handleSend = useCallback(() => {
    if (!message.trim() || !resolvedId) return;
    const overrideSenderId = (user?.role === 'ADMIN' && sendAsExpert) 
      ? (currentSession?.expert?.user?.id || currentSession?.expert?.userId) 
      : null;
    sendMessage(resolvedId, message.trim(), 'TEXT', overrideSenderId);
    setMessage("");
  }, [message, resolvedId, user?.role, sendAsExpert, currentSession, sendMessage]);

  const handleCallInitiate = useCallback(async (type) => {
    if (['COMPLETED', 'CANCELLED', 'TERMINATED'].includes(currentSession?.status)) {
      alert("This session has ended.");
      return;
    }
    try {
      await initiateCall(resolvedId, type, partner);
    } catch (err) { /* handled in context */ }
  }, [currentSession?.status, resolvedId, initiateCall, partner]);

  const handleEndSession = useCallback(async () => {
    if (!window.confirm("Are you sure you want to end this conversation?")) return;
    try {
      // 1. Inform socket room immediately (Reduces latency for other side)
      socket.emit('end_session', { sessionId: resolvedId });
      
      // 2. Finalize in DB
      await api.post(`/chat/session/${resolvedId}/end`);
      
      setCurrentSession(prev => ({ ...prev, status: 'COMPLETED' }));
      navigate(user?.role === 'EXPERT' ? '/expert-panel' : '/dashboard');
    } catch (err) {
      console.error("❌ [END_SESSION_ERROR]", err);
      // Even if API fails, the socket emit likely worked or the session is already ending
      navigate(user?.role === 'EXPERT' ? '/expert-panel' : '/dashboard');
    }
  }, [api, resolvedId, navigate, user?.role]);

  const handleHeart = useCallback((msgId) => reactToMessage(msgId, '❤️'), [reactToMessage]);

  // ─── NO SESSION ID: Show sidebar only ───
  if (!id) {
    return (
      <div className="flex h-screen bg-[#06070f] text-white">
        <ChatSidebar 
          role={user?.role} userId={user?.id} sessions={sessions} activeId={null}
          onSelect={(sessId) => navigate(user?.role === 'ADMIN' ? `/admin/messages/${sessId}` : (user?.role === 'EXPERT' ? `/expert-panel/chat/${sessId}` : `/chat/${sessId}`))}
        />
        <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
          <div className="w-24 h-24 bg-purple-600/5 rounded-full flex items-center justify-center mb-8 border border-purple-500/5">
            <Sparkles size={40} className="text-purple-400 animate-pulse" />
          </div>
          <h3 className="text-xl tracking-[0.6em] uppercase font-light">Select a conversation</h3>
        </div>
      </div>
    );
  }

  // ─── MAIN CHAT VIEW ───
  return (
    <div className="flex h-screen bg-[#06070f] text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-500 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <ChatSidebar 
          activeId={resolvedId} sessions={sessions} role={user?.role} userId={user?.id}
          onSelect={(newId) => { navigate(user?.role === 'ADMIN' ? `/admin/messages/${newId}` : (user?.role === 'EXPERT' ? `/expert-panel/chat/${newId}` : `/chat/${newId}`)); setIsSidebarOpen(false); }} 
        />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors hidden md:block">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-full transition-colors md:hidden text-purple-400">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400 overflow-hidden">
                {partner.avatar ? (
                  <img src={partner.avatar} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                    {partner.name?.charAt(0)}
                  </div>
                )}
              </div>
              {currentSession?.status === 'ACTIVE' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#06070f] rounded-full" />}
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">{partner.name}</h1>
              <div className="flex items-center gap-2">
                {isPartnerTyping ? (
                  <span className="text-[10px] text-purple-400 font-semibold animate-pulse">Typing...</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">
                    {currentSession?.status === 'ACTIVE' 
                      ? `Live • ${formatTime(elapsedTime)}` 
                      : currentSession?.status === 'COMPLETED' ? 'Ended' : 'Waiting...'}
                  </span>
                )}
                {timeLeft !== null && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
                    <div className={`w-1 h-1 rounded-full ${timeLeft < 60 ? 'bg-red-500 animate-ping' : 'bg-purple-500'}`} />
                    <span className={`text-[9px] font-semibold tracking-widest ${timeLeft < 60 ? 'text-red-400' : 'text-purple-400'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                <ShieldCheck size={10} className="text-blue-400" />
              </div>
            </div>
            
            {/* Intake Data Toggle for Experts/Admins */}
            {(user?.role === 'EXPERT' || user?.role === 'ADMIN') && currentSession?.intakeData && (
              <button 
                onClick={() => setShowIntake(!showIntake)}
                className={`ml-4 p-2 rounded-xl transition-all border ${showIntake ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                title="View Intake Form"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        
            <div className="flex items-center gap-4">
                {user?.id === currentSession?.userId && (
                    <div className="flex flex-col items-end px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)] group transition-all hover:bg-emerald-500/20">
                        <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">Balance</span>
                        <span className="text-[14px] font-bold text-emerald-400 font-mono tracking-wider">₹{liveBalance.toFixed(0)}</span>
                    </div>
                )}

                {user?.role === 'EXPERT' && (
                    <div className="flex flex-col items-end px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.1)] group transition-all hover:bg-purple-500/20">
                        <span className="text-[8px] font-bold text-purple-400/60 uppercase tracking-[0.2em]">Earnings</span>
                        <span className="text-[14px] font-bold text-purple-300 font-mono tracking-wider">₹{sessionEarnings.toFixed(0)}</span>
                    </div>
                )}

                {currentSession?.status !== 'COMPLETED' && currentSession?.status !== 'TERMINATED' && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleCallInitiate('voice')} 
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                        >
                            <Phone size={18} />
                        </button>
                        <button 
                            onClick={() => handleCallInitiate('video')} 
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                        >
                            <Video size={18} />
                        </button>
                        <button 
                            onClick={handleEndSession}
                            className="ml-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest flex items-center gap-2"
                        >
                            <X size={12} strokeWidth={3} />
                            {user?.role === 'EXPERT' ? 'End' : 'Leave'}
                        </button>
                    </div>
                )}
            </div>
        </header>

        {/* Intake Data Overlay */}
        <IntakeOverlay show={showIntake} data={currentSession?.intakeData} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#06070f] via-[#0a0c1a] to-[#06070f]">
          <div className="flex justify-center mb-8">
            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 tracking-[0.2em] font-bold uppercase">
              Session Started • {new Date(currentSession?.createdAt).toLocaleString()}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest uppercase">Syncing Universe...</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  msg={msg} 
                  isOwn={msg.senderId === user?.id} 
                  onHeart={handleHeart}
                  formatTime={formatTime}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {currentSession?.status !== 'COMPLETED' && currentSession?.status !== 'TERMINATED' && (
          <footer className="p-4 md:p-6 bg-black/40 backdrop-blur-xl border-t border-white/5">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-4 mb-3 justify-center">
                <button 
                  onClick={() => setSendAsExpert(false)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all border ${!sendAsExpert ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  MODERATOR
                </button>
                <button 
                  onClick={() => setSendAsExpert(true)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all border ${sendAsExpert ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  BEHALF OF EXPERT
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (resolvedId) {
                      socket.emit('typing_status', { sessionId: resolvedId, isTyping: true });
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        socket.emit('typing_status', { sessionId: resolvedId, isTyping: false });
                      }, 2000);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type your message..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="absolute right-2 top-1.5 p-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-xl text-white transition-all transform active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-[9px] text-gray-600 tracking-widest font-semibold">End-to-end encrypted</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
