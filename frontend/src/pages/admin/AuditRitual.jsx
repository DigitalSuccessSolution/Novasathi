import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldAlert, 
  MessageCircle, 
  ShieldCheck,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import socket from '../../lib/socket';

/**
 * Premium Admin Audit Portal - Intervention Enabled
 * High-fidelity mirrored stream with administrative override capabilities.
 */
const AuditRitual = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessionData = async () => {
    try {
      const sessRes = await api.get(`/chat/session/${id}`);
      setSession(sessRes.data.data);
      
      const msgRes = await api.get(`/chat/messages/${id}`);
      setMessages(msgRes.data.data.messages || []);
    } catch (err) {
      console.error("🌌 [AUDIT_LOAD_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    fetchSessionData();
    socket.emit('join_chat', { sessionId: id, userId: user.id });

    const handleNewMessage = (msg) => {
        if (msg.sessionId === id) {
            setMessages(prev => [...prev, msg]);
        }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [id, api, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !id || !user?.id) return;
    
    const messageData = {
      sessionId: id,
      content: message,
      messageType: 'TEXT',
      tempId: Date.now()
    };

    socket.emit('send_message', messageData);
    setMessage("");
  };

  const getPartnerInfo = () => {
    if (!session) return { 
        seeker: { name: "Seeker", avatar: null },
        expert: { name: "Guide", avatar: null }
    };
    return {
        seeker: {
            name: session.user?.name || "Seeker",
            avatar: session.user?.avatar
        },
        expert: {
            name: session.expert?.displayName || session.counselor?.displayName || "Guide",
            avatar: session.expert?.profileImage || session.counselor?.profileImage
        }
    };
  };

  const partners = getPartnerInfo();

  return (
    <AdminLayout>
      <div className="h-full flex flex-col space-y-6">
        {/* Header Stream Info */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2 mb-1">
                 <ShieldAlert size={14} className="text-purple-400" />
                 <h2 className="text-[10px] font-sans font-bold tracking-[0.4em] text-white/40 uppercase">Oversight Mode</h2>
              </div>
              <h1 className="text-lg font-bold tracking-tight">Ritual Stream: <span className="text-purple-400 font-mono text-sm opacity-60">#{id.slice(-8)}</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="flex -space-x-3">
               {[session?.user, session?.expert?.user].map((u, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border-2 border-black overflow-hidden bg-white/10 shadow-2xl">
                    <img src={u?.avatar || `https://ui-avatars.com/api/?name=${u?.name || 'Soul'}&background=${i === 0 ? '3B82F6' : 'A855F7'}&color=FFFFFF`} className="w-full h-full grayscale opacity-80" alt="pfp" />
                  </div>
               ))}
            </div>
            <div className="flex flex-col text-left">
               <span className="text-[10px] font-sans font-bold text-white/80 tracking-widest uppercase truncate max-w-[150px]">
                  {partners.seeker.name} ↔ {partners.expert.name}
               </span>
               <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[9px] font-sans font-bold text-emerald-400 tracking-widest uppercase">Live Intercept</span>
               </div>
            </div>
          </div>
        </div>

        {/* Message Matrix */}
        <div className="flex-1 bg-white/2 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.3)] min-h-[500px]">
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#0c0d15] to-transparent z-10 opacity-60" />
          
          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {loading ? (
               <div className="h-full flex items-center justify-center opacity-20">
                  <div className="flex flex-col items-center gap-4">
                     <Zap className="animate-pulse" />
                     <span className="text-[10px] uppercase tracking-[0.5em]">Synchronizing Stream...</span>
                  </div>
               </div>
            ) : messages.length === 0 ? (
               <div className="h-full flex items-center justify-center opacity-20 italic text-sm uppercase tracking-widest">No transmissions detected in this channel</div>
            ) : messages.map((msg, i) => {
              const isMine = msg.senderId === user?.id;
              const isSeeker = msg.senderId === session?.userId;
              
              return (
                <div key={i} className={`flex ${isMine ? 'justify-end' : (isSeeker ? 'justify-start' : 'justify-end')}`}>
                   <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : (isSeeker ? 'items-start' : 'items-end')}`}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                         <span className={`text-[8px] font-sans font-black tracking-widest uppercase ${
                            isMine ? 'text-purple-400' : (isSeeker ? 'text-blue-400' : 'text-purple-400')
                         }`}>
                            {isMine ? 'Moderator Intervention' : (isSeeker ? 'Seeker' : 'Expert')}
                         </span>
                         <span className="text-[8px] font-mono text-white/10">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className={`px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed transition-all shadow-xl ${
                        isMine
                        ? 'bg-purple-600/30 border border-purple-500/50 text-white rounded-tr-none'
                        : isSeeker 
                        ? 'bg-blue-600/10 border border-blue-500/20 text-blue-100 rounded-tl-none' 
                        : 'bg-purple-600/10 border border-purple-500/20 text-purple-100 rounded-tr-none'
                      }`}>
                         {msg.content}
                      </div>
                   </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Admin Command Deck */}
          <div className="p-8 border-t border-white/5 bg-white/[0.01] backdrop-blur-3xl">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative group">
                 <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <MessageCircle size={16} className="text-purple-400" />
                 </div>
                 <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type to intercede in ritual..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-[11px] font-sans font-semibold tracking-widest text-white placeholder:text-white/10 outline-none uppercase italic transition-all focus:border-purple-500/50"
                 />
              </div>
              <button 
                onClick={handleSend}
                className="px-8 py-4 bg-purple-600 shadow-xl shadow-purple-900/20 rounded-2xl text-[10px] font-sans font-black tracking-[0.3em] uppercase text-white hover:bg-purple-500 transition-all active:scale-95"
              >
                Transmit
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditRitual;
