import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Clock, ArrowRight, Sparkles, Star, User, Phone, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import ExpertLayout from "../../components/ExpertLayout";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import socket from "../../lib/socket";

/**
 * Expert Active Sessions - Real-time Ritual Queue
 */
const ExpertSessions = () => {
    const { api, token } = useAuth();
    const navigate = useNavigate();
    const { initiateCall } = useCall();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveSessions = useCallback(async () => {
        try {
            const res = await api.get("/experts/overview");
            const allSessions = res.data.data.expert.chatSessions || [];
            setSessions(allSessions.filter(s => s.status === 'ACTIVE' || s.status === 'WAITING'));
        } catch (err) {
            console.error("🌌 [SESSION_ERROR] Queue sync failed:", err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (!token) return;
        
        fetchActiveSessions();
        
        // Cosmic Socket Integration for Instant Ritual Alerts
        const handleNewRequest = () => {
             console.log("🌌 [SOCKET] New ritual request received!");
             fetchActiveSessions();
        };

        socket.on("new_ritual_request", handleNewRequest);

        const interval = setInterval(fetchActiveSessions, 30000); 
        return () => {
            socket.off("new_ritual_request", handleNewRequest);
            clearInterval(interval);
        };
    }, [token, fetchActiveSessions]);

    return (
        <ExpertLayout>
            <div className="space-y-8 text-left">
                <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                         <MessageCircle size={24} />
                    </div>
                    <div className="space-y-1 text-left">
                         <h2 className="text-[10px] font-sans font-semibold  tracking-[0.5em] text-white/50">Ritual Queue</h2>
                         <h1 className="text-2xl font-light  tracking-tight italic">Active <span className="font-semibold not-italic text-emerald-400">Rituals</span> ✨</h1>
                    </div>
                </div>

                {loading && sessions.length === 0 ? (
                    <div className="p-20 text-center opacity-20 italic font-light tracking-widest text-[10px] ">Scanning Resonance...</div>
                ) : sessions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 text-left">
                        {(() => {
                            // Group by User ID to show "User-wise" not "Session-wise"
                            const uniqueUsers = [];
                            const seenUsers = new Set();
                            
                            sessions.forEach(s => {
                                if (!seenUsers.has(s.userId)) {
                                    seenUsers.add(s.userId);
                                    uniqueUsers.push(s);
                                }
                            });

                            return uniqueUsers.map((session) => (
                                <div key={session.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col md:flex-row items-center justify-between group hover:bg-white/5 transition-all text-left">
                                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                                        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 p-1 relative">
                                            <img src={session.user.avatar || `https://ui-avatars.com/api/?name=${session.user.name}&background=10B981&color=FFFFFF`} className="w-full h-full rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                            <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-emerald-500 text-black text-[7px] font-semibold rounded-full  tracking-tighter shadow-2xl">{session.status}</div>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-light  tracking-tight group-hover:text-white transition-colors">{session.user.name}</h3>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest italic flex items-center gap-2">
                                                    <Star size={10} className="text-purple-400" /> Rated Seeker
                                                </span>
                                                <span className="text-white/85">•</span>
                                                <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest italic flex items-center gap-2">
                                                    <Clock size={10} className="text-blue-400" /> {new Date(session.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => initiateCall(session.id, 'voice', { name: session.user.name, avatar: session.user.avatar })}
                                            className="p-3 bg-emerald-600/10 text-emerald-400 rounded-full border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-xl"
                                            title="Audio Call"
                                        >
                                            <Phone size={16} />
                                        </button>
                                        <button 
                                            onClick={() => initiateCall(session.id, 'video', { name: session.user.name, avatar: session.user.avatar })}
                                            className="p-3 bg-purple-600/10 text-purple-400 rounded-full border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all shadow-xl"
                                            title="Video Call"
                                        >
                                            <Video size={16} />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/chat/${session.id}`)}
                                            className="px-8 py-3 bg-emerald-600 shadow-2xl shadow-emerald-600/20 text-white rounded-full font-sans font-semibold text-[10px]  tracking-[0.3em] hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                                        >
                                            Enter Ritual <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                ) : (
                    <div className="p-20 text-center bg-white/2 border border-dashed border-white/5 rounded-2xl">
                         <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                              <Sparkles size={28} />
                         </div>
                         <h3 className="text-lg font-light  tracking-widest text-white/85 italic">No souls currently seeking guidance.</h3>
                         <p className="text-[9px] font-sans font-semibold text-white/85  tracking-[0.4em] mt-4">The sanctuary is peaceful.</p>
                    </div>
                )}
            </div>
        </ExpertLayout>
    );
};

export default ExpertSessions;
