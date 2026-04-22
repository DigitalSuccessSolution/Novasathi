import React, { useState, useEffect } from "react";
import { History, MessageCircle, Clock, Star, Sparkles, Filter, MoreVertical, BadgeCheck } from "lucide-react";
import ExpertLayout from "../../components/ExpertLayout";
import { useAuth } from "../../context/AuthContext";

/**
 * Expert Session History - Record of all completed consultations.
 */
const ExpertHistory = () => {
    const { api } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get("/experts/history");
            const data = res.data.data;
            // Get COMPLETED sessions
            setHistory(data.expert.chatSessions || []);
        } catch (err) {
            console.error("🌌 [HISTORY_ERROR] Resonance records failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [api]);

    const filteredHistory = history.filter(session => {
        if (filter === "All") return true;
        if (filter === "CHAT") return session.type === "CHAT";
        if (filter === "CALL") return session.type === "CALL";
        if (filter === "VIDEO") return session.type === "VIDEO";
        return true;
    });

    return (
        <ExpertLayout>
            <div className="space-y-8 text-left">
                <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                         <History size={24} />
                    </div>
                    <div className="space-y-1 text-left">
                         <h2 className="text-[10px] font-sans font-semibold text-white/50 lowercase tracking-widest">session records</h2>
                         <h1 className="text-2xl font-semibold tracking-tight italic text-white text-left">Past <span className="font-semibold text-purple-400">Sessions</span> ✨</h1>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-3">
                         {[
                             { name: "All Rituals", val: "All" }, 
                             { name: "Chat", val: "CHAT" }, 
                             { name: "Voice", val: "CALL" }, 
                             { name: "Video", val: "VIDEO" }
                         ].map((cat) => (
                             <button 
                                key={cat.val} 
                                onClick={() => setFilter(cat.val)}
                                className={`px-4 py-2 rounded-full text-[9px] font-sans font-semibold border transition-all ${filter === cat.val ? 'bg-white text-black border-white' : 'bg-white/2 border-white/5 text-white/85 hover:text-white'}`}
                             >
                                 {cat.name}
                             </button>
                         ))}
                    </div>
                     <button className="flex items-center gap-3 text-[10px] font-sans font-semibold text-white/85 hover:text-purple-400 transition-colors">
                          <Filter size={14} /> Filter Sessions
                     </button>
                </div>

                <div className="space-y-4 text-left">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 w-full bg-white/2 rounded-xl animate-pulse"></div>
                        ))
                    ) : filteredHistory.length > 0 ? filteredHistory.map((session) => (
                        <div key={session.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col md:flex-row items-center justify-between group/session hover:border-purple-500/10 hover:bg-white/5 transition-all duration-700 shadow-2xl overflow-hidden relative text-left">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] opacity-0 group-hover/session:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-center gap-6 text-left relative z-10 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 relative">
                                    <img src={session.user.avatar || `https://ui-avatars.com/api/?name=${session.user.name}&background=6D28D9&color=FFFFFF`} className="w-full h-full rounded-xl grayscale group-hover/session:grayscale-0 transition-grayscale duration-700" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 border-2 border-black flex items-center justify-center rounded-full text-white">
                                         <BadgeCheck size={8} />
                                    </div>
                                </div>
                                 <div className="space-y-0.5">
                                     <h3 className="text-lg font-light  tracking-tight group-hover/session:text-white transition-colors">Session with {session.user.name}</h3>
                                     <div className="flex items-center gap-3 text-[9px] font-sans font-semibold text-white/85  tracking-widest italic group-hover/session:text-purple-400 transition-colors">
                                         <Clock size={10} /> {new Date(session.createdAt).toLocaleDateString()} • {session.totalMinutes} Mins
                                     </div>
                                 </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto relative z-10 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                <div className="flex flex-col text-left md:text-right">
                                     <div className="flex items-center justify-end gap-2 text-amber-500">
                                          <Star size={12} fill="#F59E0B" /> <span className="text-lg font-sans font-semibold italic tracking-widest text-[#FFF]">5.0</span>
                                     </div>
                                     <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest mt-0.5">Excellent Resonance</span>
                                </div>
                                <button className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/85 hover:border-purple-500/20 hover:text-purple-400 group/btn transition-all duration-700 bg-black/60 shadow-2xl">
                                     <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center border border-dashed border-white/5 rounded-2xl group hover:border-purple-500/20 transition-all duration-700">
                             <h3 className="text-xl font-light  tracking-widest text-white/30 group-hover:text-purple-400 transition-colors">No History</h3>
                             <p className="text-[10px] font-sans font-semibold  tracking-[0.5em] text-white/20 mt-4 group-hover:text-white/85 transition-colors italic">You haven't completed any sessions yet.</p>
                        </div>
                    )}
                </div>

                <p className="text-center mt-20 text-[10px] font-sans font-semibold  tracking-[0.6em] text-white/85">Past rituals encrypted via sanctuary node-5</p>
            </div>
        </ExpertLayout>
    );
};

export default ExpertHistory;
