import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Star, MessageCircle, PhoneCall, Video, BadgeCheck, Sparkles, Languages, Clock } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { motion } from "framer-motion";
import StatusPopup from "../components/StatusPopup";
import socket from "../lib/socket";

/**
 * Experts Sanctuary - Browsing all soul guides and ritual experts.
 */
const ExpertsPortal = () => {
    const { api, user } = useAuth();
    const { startAndOpenChat } = useChat();
    const navigate = useNavigate();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusModal, setStatusModal] = useState({ open: false, expert: null, type: 'busy' });

    const fetchExperts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/experts");
            // Backend returns { experts: [], total: 0, ... }
            setExperts(res.data.data.experts || []);
        } catch (err) {
            console.error("🌌 [EXPERTS_ERROR] Soul alignment failed:", err);
            setExperts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperts();

        // Listen for real-time status updates
        const handleStatusUpdate = ({ expertId, status }) => {
            setExperts(prev => prev.map(expert => 
                expert.id === expertId ? { 
                    ...expert, 
                    onlineStatus: status,
                    isOnline: status !== 'offline'
                } : expert
            ));
        };

        socket.on('expert_status_update', handleStatusUpdate);

        return () => {
            socket.off('expert_status_update', handleStatusUpdate);
        };
    }, [api]);

    const categories = ["All", "Astrology", "Tarot", "Numerology", "Love", "Career"];

    const filteredExperts = (experts || []).filter(expert => {
        const matchesCategory = filter === "All" || (expert.specializations && expert.specializations.includes(filter));
        const matchesSearch = (expert.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (expert.shortBio || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#06070f] text-white font-sans selection:bg-purple-500/30">
            {/* Header / Search Sanctuary */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative pt-32 pb-16 px-6 overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto space-y-12 relative z-10 text-center">
                    <div className="space-y-4">
                         <div className="flex items-center justify-center gap-3 text-purple-400">
                              <Sparkles size={20} />
                              <span className="text-[10px] font-semibold  tracking-[0.6em] uppercase">The Inner Circle</span>
                         </div>
                         <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter italic">Find Your <span className="text-purple-400">Soul Guide</span> ✨</h1>
                         <p className="text-white/60 max-w-2xl mx-auto text-[11px] leading-relaxed tracking-widest font-semibold italic">Connect with India's most resonant astrologers, tarot readers, and spiritual consultants.</p>
                    </div>

                    {/* Search Bars */}
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4">
                        <div className="w-full relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-[13px] font-sans font-semibold focus:outline-none focus:border-purple-500/50 transition-all shadow-2xl placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                         {categories.map(cat => (
                             <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-semibold tracking-widest border transition-all duration-500 ${
                                    filter === cat 
                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30"
                                }`}
                             >
                                 {cat}
                             </button>
                         ))}
                    </div>
                </div>
            </motion.div>

            {/* Experts Matrix */}
            <div className="max-w-7xl mx-auto px-6 pb-40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-[420px] bg-white/2 rounded-3xl animate-pulse border border-white/5"></div>
                        ))
                    ) : filteredExperts.length > 0 ? filteredExperts.map((expert, index) => (
                         <motion.div 
                            key={expert.id} 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-5 transition-all duration-700 hover:border-purple-500/30 hover:bg-white/[0.06] overflow-hidden shadow-2xl flex flex-col"
                         >
                            {/* Inner Glow Effect */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none transition-opacity duration-700 opacity-0 group-hover:opacity-100"></div>
                            
                            {/* Card Top: Avatar & Status */}
                            <div className="relative z-10 flex items-start justify-between mb-6">
                                <div className="relative">
                                     <div className="w-24 h-24 rounded-2xl bg-purple-500/10 p-1 border border-white/5 group-hover:border-purple-500/30 transition-all duration-700 overflow-hidden shadow-2xl">
                                          <img 
                                               src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.displayName}&background=6D28D9&color=FFFFFF`} 
                                               className="w-full h-full rounded-xl object-cover grayscale-0 transition-transform duration-700 group-hover:scale-110" 
                                               alt={expert.displayName}
                                          />
                                     </div>
                                     <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-xl border-2 border-[#06070f] flex items-center justify-center p-0.5 shadow-xl ${expert.onlineStatus === 'busy' ? 'bg-amber-500' : expert.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                          <div className={`w-full h-full rounded-lg ${expert.onlineStatus === 'busy' ? 'bg-amber-200' : expert.isOnline ? 'bg-emerald-200 animate-pulse' : 'bg-gray-400'}`}></div>
                                     </div>
                                </div>

                                <div className="text-right space-y-2">
                                     <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-3xl shadow-lg">
                                          <Star size={12} className="text-amber-500 fill-amber-500" />
                                          <span className="text-[11px] font-sans font-bold text-white tracking-tighter italic">{expert.avgRating?.toFixed(1) || "5.0"}</span>
                                     </div>
                                </div>
                            </div>

                            {/* Content Block */}
                            <div className="space-y-4 relative z-10 flex-1">
                                 <div>
                                      <h3 className="text-lg font-semibold tracking-tight text-white group-hover:text-purple-300 transition-colors uppercase leading-tight line-clamp-1">{expert.displayName}</h3>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                           {(expert.specializations || []).slice(0, 2).map(skill => (
                                               <span key={skill} className="text-[10px] font-semibold tracking-[0.05em] text-purple-400 italic">#{skill}</span>
                                           ))}
                                      </div>
                                 </div>

                                 <p className="text-[11px] leading-relaxed text-white/50 italic line-clamp-2 font-light tracking-wide min-h-[32px]">
                                      {expert.shortBio || "Ancient wisdom specialist guiding lost souls through the cosmic void using traditional rituals."}
                                 </p>

                                 {/* Minimal Meta Line */}
                                 <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                                      <div className="flex items-center gap-2">
                                           <Clock size={14} className="text-purple-400/60" />
                                           <span className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">{expert.experience || 5} Years</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] font-bold tracking-tighter text-white italic bg-white/5 px-3 py-1 rounded-xl">
                                           <span className="text-purple-400">₹{expert.pricePerMinute}</span>
                                           <span className="text-[8px] font-semibold tracking-widest text-white/30 uppercase not-italic">/min</span>
                                      </div>
                                 </div>
                            </div>

                            {/* Action Matrix */}
                            <div className="relative z-10 mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
                                <button 
                                    onClick={() => {
                                        if (expert.onlineStatus === 'busy') {
                                            setStatusModal({ open: true, expert, type: 'busy' });
                                            return;
                                        }
                                        if (!expert.isOnline) {
                                            setStatusModal({ open: true, expert, type: 'offline' });
                                            return;
                                        }
                                        if (!user) return navigate('/login');
                                        startAndOpenChat(expert.id, false, expert, 'CHAT');
                                    }}
                                    className="flex items-center justify-center py-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-300 group/btn"
                                    title="Chat"
                                >
                                    <MessageCircle size={20} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (expert.onlineStatus === 'busy') {
                                            setStatusModal({ open: true, expert, type: 'busy' });
                                            return;
                                        }
                                        if (!expert.isOnline) {
                                            setStatusModal({ open: true, expert, type: 'offline' });
                                            return;
                                        }
                                        if (!user) return navigate('/login');
                                        startAndOpenChat(expert.id, false, expert, 'CALL');
                                    }}
                                    className="flex items-center justify-center py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 group/btn"
                                    title="Voice Call"
                                >
                                    <PhoneCall size={20} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (expert.onlineStatus === 'busy') {
                                            setStatusModal({ open: true, expert, type: 'busy' });
                                            return;
                                        }
                                        if (!expert.isOnline) {
                                            setStatusModal({ open: true, expert, type: 'offline' });
                                            return;
                                        }
                                        if (!user) return navigate('/login');
                                        startAndOpenChat(expert.id, false, expert, 'VIDEO');
                                    }}
                                    className="flex items-center justify-center py-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-300 group/btn"
                                    title="Video Ritual"
                                >
                                    <Video size={20} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                            </div>
                         </motion.div>
                    )) : (
                        <div className="col-span-full py-40 text-center space-y-4 opacity-40">
                             <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center"><Search size={32} /></div>
                             <h3 className="text-xl font-light italic tracking-widest">No Soul Guides Found</h3>
                             <p className="text-[10px] font-semibold tracking-widest uppercase italic">Try adjusting your filters or search ritual</p>
                        </div>
                    )}
                </div>
            </div>

            <StatusPopup 
                isOpen={statusModal.open}
                onClose={() => setStatusModal({ ...statusModal, open: false })}
                expert={statusModal.expert}
                type={statusModal.type}
            />
        </div>
    );
};

export default ExpertsPortal;
