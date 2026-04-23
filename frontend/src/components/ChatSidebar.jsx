import React from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, ShieldCheck, Clock, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Premium Chat Sidebar - The Nexus of Cosmic Connections
 * Handles conversation switching for Experts and Seekers.
 */
const ChatSidebar = ({ activeId, onSelect, sessions = [], userId, role }) => {
    const navigate = useNavigate();
    const handleBack = () => {
        if (role === 'ADMIN') {
            navigate('/admin');
        } else if (role === 'EXPERT') {
            navigate('/expert-panel');
        } else {
            navigate('/dashboard');
        }
    };

    const handleSelect = (id) => {
        if (onSelect) {
            onSelect(id);
        } else {
            const prefix = role === 'ADMIN' ? '/admin/messages' : (role === 'EXPERT' ? '/expert-panel/chat' : '/chat');
            navigate(`${prefix}/${id}`);
        }
    };

    // Dynamic Avatar Logic
    const getAvatar = (sess) => {
        const isSelfSeeker = userId === sess.userId;
        const otherParty = isSelfSeeker ? sess.expert?.user : sess.user;
        let avatarUrl = otherParty?.avatar;
        if (isSelfSeeker && !avatarUrl) {
            avatarUrl = sess.expert?.profileImage;
        }

        if (avatarUrl && !avatarUrl.startsWith('http')) {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').split('/api')[0];
            avatarUrl = `${baseUrl}/${avatarUrl}`;
        }

        const displayName = (sess.isAnonymous && !isSelfSeeker) ? "Anonymous Soul" : (otherParty?.name || sess.expert?.displayName || "Unknown");
        return avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=6D28D9&color=FFFFFF`;
    };

    const getName = (sess) => {
        const isSelfSeeker = userId === sess.userId;
        const otherParty = isSelfSeeker ? sess.expert?.user : sess.user;
        const displayName = (sess.isAnonymous && !isSelfSeeker) ? "Anonymous Soul" : (otherParty?.name || sess.expert?.displayName || "Unknown");
        return displayName;
    };

    const getLastMsg = (sess) => {
        if (sess.messages && sess.messages.length > 0) {
            const last = sess.messages[sess.messages.length - 1];
            return last.messageType === 'IMAGE' ? "📷 Photo" : last.content;
        }
        return "New Ritual Request ✨";
    };

    const getTime = (sess) => {
        const date = sess.updatedAt ? new Date(sess.updatedAt) : new Date(sess.createdAt);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="w-full md:w-80 h-full border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleBack}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/85 hover:text-white transition-all group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <h2 className="text-[10px] font-sans font-semibold  tracking-[0.4em] text-white/85 uppercase">Conversations</h2>
                    </div>
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/85 group-hover:text-purple-400 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search chats..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px]  tracking-widest text-white outline-hidden focus:border-purple-500/50 focus:bg-white/10 transition-all font-sans font-semibold placeholder:text-white/40"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {sessions.map((session) => (
                    <motion.button
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleSelect(session.id)}
                        className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all duration-500 group relative overflow-hidden ${
                            activeId === session.id 
                            ? 'bg-purple-600/20 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {/* Divine Indicator */}
                        {activeId === session.id && (
                            <motion.div 
                                layoutId="sidebar-active"
                                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-purple-500 rounded-r-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                            />
                        )}

                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 p-0.5 overflow-hidden shadow-2xl relative">
                                <img 
                                    src={getAvatar(session)} 
                                    className={`w-full h-full rounded-xl object-cover transition-all duration-700 ${session.status === 'ACTIVE' ? 'grayscale-0' : 'grayscale-50 opacity-60'}`} 
                                    alt={getName(session)}
                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${getName(session)}&background=6D28D9&color=FFFFFF`; }}
                                />
                            </div>
                            {session.status === 'ACTIVE' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0b14] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                            )}
                        </div>

                        <div className="flex-1 text-left min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-xs font-semibold truncate tracking-tight transition-colors ${activeId === session.id ? 'text-white' : 'text-white/85 group-hover:text-white'}`}>
                                    {getName(session)}
                                </h3>
                                <span className="text-[8px] font-sans font-semibold text-white/40 tracking-widest">{getTime(session)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-[10px] truncate flex-1 font-light ${session._unreadCount > 0 ? 'text-white font-medium' : 'text-white/50 italic'}`}>
                                    {getLastMsg(session)}
                                </p>
                                {session._unreadCount > 0 && activeId !== session.id && (
                                    <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center bg-purple-600 text-white text-[9px] font-bold rounded-full px-1 shadow-lg shadow-purple-900/40">
                                        {session._unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.button>
                ))}
                {sessions.length === 0 && (
                    <div className="p-10 text-center opacity-20 italic text-[10px]  tracking-widest">No Active Whispers</div>
                )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="px-3 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <ShieldCheck size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[8px] font-semibold text-purple-400  tracking-widest">Ritual Status</p>
                        <p className="text-[9px] text-white/85  tracking-tighter italic">End-to-End Encrypted</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
