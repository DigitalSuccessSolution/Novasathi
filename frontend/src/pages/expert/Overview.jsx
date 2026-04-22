import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, MessageCircle, IndianRupee, Star, Clock, Bell, Settings, Power, ShieldCheck, Users, TrendingUp, Radio, Phone, Video, Briefcase, BookOpen, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import ExpertLayout from "../../components/ExpertLayout";
import { useToast } from "../../context/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import socket from "../../lib/socket";

/**
 * Expert Dashboard - Professional workspace for managing sessions and earnings.
 */
const ExpertOverview = () => {
    const { api, token, user, updateExpertStats } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { initiateCall } = useCall();
    const [isOnline, setIsOnline] = useState(false);
    const [stats, setStats] = useState([
        { label: "Total Income", value: "₹0", sub: "Lifetime", icon: IndianRupee, color: "text-emerald-400" },
        { label: "Active Minutes", value: "0", sub: "Lifetime", icon: Clock, color: "text-blue-400" },
        { label: "Total Seekers", value: "0", sub: "Lifetime", icon: Users, color: "text-purple-400" },
        { label: "Expert Rating", value: "0.0", sub: "Avg Score", icon: Star, color: "text-amber-400" }
    ]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [serverStatus, setServerStatus] = useState(user?.status || 'PENDING');
    const [activeTab, setActiveTab] = useState("active"); // "active" or "history"
    const isMounted = useRef(false);

    const fetchDashboardData = useCallback(async (isInitial = false) => {
        if (!token) return;
        try {
            if (isInitial) setLoading(true);
            const res = await api.get("/experts/overview");
            const data = res.data.data;
            
            setServerStatus(data.expert.status);
            
            // Sync to Redux for global consistency
            updateExpertStats({
                todayEarnings: data.today.earnings,
                todayMinutes: data.today.minutes,
                totalSessions: data.expert.totalSessions,
                avgRating: data.expert.avgRating
            });

            const commissionFactor = 1 - (data.commissionRate / 100);
            const totalNetIncome = (data.expert.totalEarnings || 0) * commissionFactor;

            setStats([
                { label: "Total Income", value: `₹${totalNetIncome.toFixed(0)}`, sub: "Lifetime", icon: IndianRupee, color: "text-emerald-400" },
                { label: "Active Minutes", value: (data.expert.totalMinutes || 0).toString(), sub: "Lifetime", icon: Clock, color: "text-blue-400" },
                { label: "Total Seekers", value: (data.expert.totalSessions || 0).toString(), sub: "Lifetime", icon: Users, color: "text-purple-400" },
                { label: "Expert Rating", value: (data.expert.avgRating || 0).toFixed(1), sub: "Avg Score", icon: Star, color: "text-amber-400" }
            ]);

            setIsOnline(data.expert.isOnline);
            setSessions(data.expert.chatSessions || []);
            
            // SRS §8.4 — Detect if profile is just a draft (needs onboarding)
            if (!data.expert || !data.expert.bio) {
                setNeedsOnboarding(true);
            }
        } catch (err) {
            console.error("🌌 [DASHBOARD_ERROR] Sync failed:", err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [api, token, updateExpertStats]);

    const handleRefresh = useCallback(() => {
        console.log("🌌 [SOCKET] Ritual data sync triggered...");
        fetchDashboardData(false);
    }, [fetchDashboardData]);

    // Effect 1: Initial Sync & Polling
    useEffect(() => {
        if (!token) return;
        fetchDashboardData(true);
        const interval = setInterval(() => fetchDashboardData(false), 30000); 
        return () => clearInterval(interval);
    }, [token]);

    // Effect 2: Realm Resonance (Socket listeners)
    useEffect(() => {
        if (!token) return;

        const handleEarningsUpdate = (data) => {
             console.log("💰 [EARNINGS] New energy credit received:", data.amount);
             setStats(prev => {
                  const newStats = [...prev];
                  const incomeStr = newStats[0].value.replace('₹', '');
                  const currentIncome = parseFloat(incomeStr) || 0;
                  const newTotalIncome = currentIncome + data.amount;
                  newStats[0].value = `₹${newTotalIncome.toFixed(0)}`;
                  
                  const currentMins = parseInt(newStats[1].value) || 0;
                  const newMins = currentMins + 1;
                  newStats[1].value = newMins.toString();
                  return newStats;
              });
             toast(`✨ You earned ₹${data.amount} credit.`, "success");
        };

        const onNewRitual = () => {
             handleRefresh();
             toast("✨ New Soul Seeking Guidance!", "success");
        };

        const onSessionWaiting = (data) => {
             handleRefresh();
             toast(`🔮 ${data.user || "A Seeker"} is waiting in the sanctuary!`, "success");
        };

        const onIncomingCall = (data) => {
            handleRefresh();
            toast(`📞 Incoming ${data.type} call from ${data.callerName}! Open chat rituals immediately.`);
        };

        socket.on("earnings_update", handleEarningsUpdate);
        socket.on("new_ritual_request", onNewRitual);
        socket.on("session_waiting", onSessionWaiting);
        socket.on("incoming_call", onIncomingCall);
        
        return () => {
            socket.off("earnings_update", handleEarningsUpdate);
            socket.off("new_ritual_request", onNewRitual);
            socket.off("session_waiting", onSessionWaiting);
            socket.off("incoming_call", onIncomingCall);
        };
    }, [token, handleRefresh, toast]);

    const [toggling, setToggling] = useState(false);
    const toggleOnlineStatus = async () => {
        try {
            setToggling(true);
            const res = await api.patch("/experts/toggle-online");
            setIsOnline(res.data.data.isOnline);
            fetchDashboardData(); 
            toast(`Status: You are now ${res.data.data.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        } catch (err) {
            toast("Update failed: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setToggling(false);
        }
    };

    if (loading) return (
        <ExpertLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[10px] text-white/40 font-bold tracking-[0.5em] uppercase animate-pulse">Synchronizing Sanctuary Status...</p>
            </div>
        </ExpertLayout>
    );

    if (needsOnboarding) return (
        <ExpertLayout>
            <div className="p-16 md:p-24 text-center border border-dashed border-purple-500/20 rounded-[4rem] bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 blur-[100px] group-hover:bg-purple-500/10 transition-all duration-1000" />
                
                <div className="relative z-10 space-y-10">
                    <div className="w-24 h-24 bg-purple-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-purple-500/20 text-purple-400 shadow-2xl shadow-purple-500/20 group-hover:scale-110 transition-transform">
                         <ShieldCheck size={40} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold tracking-tight italic text-white">Begin Your <span className="text-purple-400">Vocation.</span></h2>
                        <p className="text-[11px] font-sans font-semibold text-white/40 tracking-[0.4em] uppercase max-w-lg mx-auto leading-loose italic">Your sanctuary is currently unmanifested. Authenticate your profile to begin guiding seekers through the digital void.</p>
                    </div>
                    <button 
                        onClick={() => navigate("/expert-panel/profile")}
                        className="px-20 py-7 bg-purple-600 shadow-2xl shadow-purple-900/40 text-white rounded-full font-bold text-[11px] tracking-[0.5em] uppercase hover:bg-purple-500 hover:scale-110 active:scale-95 transition-all"
                    >
                        Initialize My Profile
                    </button>
                </div>
            </div>
        </ExpertLayout>
    );

    // Logic for Application States
    if (serverStatus === 'PENDING') {
        return (
            <ExpertLayout>
                <div className="p-16 md:p-24 text-center border border-dashed border-emerald-500/20 rounded-[4rem] bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-1000" />
                    
                    <div className="relative z-10 space-y-10">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-400 shadow-2xl shadow-emerald-500/20"
                        >
                            <Clock size={40} className="animate-pulse" />
                        </motion.div>
                        
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold tracking-tight italic text-white">Application <span className="text-emerald-400">Under Review.</span></h2>
                            <p className="text-[11px] font-sans font-semibold text-white/40 tracking-[0.4em] uppercase max-w-lg mx-auto leading-loose italic">Your sanctuary is being validated by our high-council. We will notify you once your cosmic presence is approved.</p>
                        </div>

                        <div className="pt-8 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Status: Finalizing Initiation</span>
                            </div>
                            <button 
                                onClick={() => navigate("/expert-panel/profile")}
                                className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase hover:text-white transition-all underline underline-offset-8"
                            >
                                Review My Profile Details
                            </button>
                        </div>
                    </div>
                </div>
            </ExpertLayout>
        );
    }

    if (serverStatus === 'REJECTED') {
        return (
            <ExpertLayout>
                <div className="p-16 md:p-24 text-center border border-dashed border-red-500/20 rounded-[4rem] bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/5 blur-[100px] group-hover:bg-red-500/10 transition-all duration-1000" />
                    
                    <div className="relative z-10 space-y-10">
                        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20 text-red-400 shadow-2xl shadow-red-500/20">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold tracking-tight italic text-white">Application <span className="text-red-400">Rejected.</span></h2>
                            <p className="text-[11px] font-sans font-semibold text-white/40 tracking-[0.4em] uppercase max-w-lg mx-auto leading-loose italic">The cosmic council has decided not to proceed with your initiation at this time. You may review your details or contact support for clarification.</p>
                        </div>
                        <button 
                            onClick={() => navigate("/expert-panel/profile")}
                            className="px-20 py-7 bg-red-600 shadow-2xl shadow-red-900/40 text-white rounded-full font-bold text-[11px] tracking-[0.5em] uppercase hover:bg-red-500 transition-all"
                        >
                            Modify Profile
                        </button>
                    </div>
                </div>
            </ExpertLayout>
        );
    }

    return (
        <ExpertLayout>
            <div className="space-y-10 text-left">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <LayoutDashboard size={24} />
                         </div>
                         <div className="space-y-1 text-left">
                              <h2 className="text-[10px] font-sans font-semibold  tracking-[0.5em] text-white/85 text-left">Work Overview</h2>
                              <h1 className="text-2xl font-semibold tracking-tight italic text-white">My <span className="text-emerald-400">Dashboard</span> ✨</h1>
                         </div>
                    </div>

                    <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center gap-8">
                         <div className="flex flex-col text-left">
                              <span className="text-[8px] font-sans font-semibold  tracking-widest text-white/85">Availability</span>
                              <span className={`text-xs font-semibold  tracking-widest ${isOnline ? 'text-emerald-400' : 'text-rose-500'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                         </div>
                         <button 
                            onClick={toggleOnlineStatus}
                            disabled={toggling}
                            className={`w-14 h-7 rounded-full p-1 relative flex items-center transition-all ${isOnline ? 'bg-emerald-600' : 'bg-white/10'} ${toggling ? 'opacity-50 cursor-wait' : ''}`}
                         >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-2xl transition-transform ${isOnline ? 'translate-x-7' : 'translate-x-0'}`}>
                                {toggling && <div className="w-full h-full rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>}
                            </div>
                         </button>
                    </div>
                </div>

                {/* Simplified Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="p-6 bg-white/2 border border-white/5 rounded-2xl group hover:bg-white/5 transition-all active:scale-95 relative overflow-hidden text-left">
                            <div className="space-y-4 relative z-10 text-left">
                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} border border-white/5`}>
                                    <stat.icon size={18} />
                                </div>
                                 <div className="space-y-1">
                                    <div className="text-xl font-semibold font-sans tracking-tighter text-white">
                                        {loading ? <div className="w-16 h-8 bg-white/5 animate-pulse rounded-lg"></div> : stat.value}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest block">{stat.label}</span>
                                        <span className={`text-[7px] font-sans font-semibold px-1.5 py-0.5 rounded-md bg-white/5 ${stat.color}  tracking-tighter`}>{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    
                    {/* Recent Applications/Sessions */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                                <TrendingUp size={18} className="text-emerald-400" />
                                <h2 className="text-[11px] font-sans font-semibold  tracking-[0.5em] text-white/85 text-left">Seeker Management</h2>
                            </div>
                            
                            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                <button 
                                    onClick={() => setActiveTab("active")}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-semibold  tracking-widest transition-all ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/85 hover:text-white/85'}`}
                                >
                                    Active Rituals
                                </button>
                                <button 
                                    onClick={() => setActiveTab("history")}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-semibold  tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/85 hover:text-white/85'}`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(() => {
                                // Group by User ID to show "User-wise" not "Session-wise"
                                const uniqueUsers = [];
                                const seenUsers = new Set();
                                
                                const filteredSessions = activeTab === 'active' 
                                    ? sessions.filter(s => s.status === 'ACTIVE' || s.status === 'WAITING') 
                                    : sessions.filter(s => s.status === 'COMPLETED' || s.status === 'TERMINATED');

                                filteredSessions.forEach(s => {
                                    if (!seenUsers.has(s.userId)) {
                                        seenUsers.add(s.userId);
                                        uniqueUsers.push(s);
                                    }
                                });

                                return uniqueUsers.length > 0 ? uniqueUsers.map((s) => (
                                    <div key={s.id} className="group p-4 bg-white/2 border border-white/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between hover:bg-white/5 transition-all duration-500 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                                        
                                        <div className="flex items-center gap-6 mb-4 md:mb-0 relative z-10">
                                            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 p-1 group-hover:border-emerald-500/30 transition-all duration-700">
                                                <img src={s.user?.avatar || `https://ui-avatars.com/api/?name=${s.user?.name}&background=10B981&color=FFFFFF`} className="w-full h-full rounded-[1.2rem] grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-xl font-light italic tracking-tight group-hover:text-white transition-colors">{s.user?.name || "Nameless Soul"}</h3>
                                                <span className="text-[10px] font-sans font-semibold text-white/85  tracking-widest mt-0.5 italic group-hover:text-emerald-400 transition-colors uppercaseTracking-[0.5em]">{s.status} Session</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(s.status === 'WAITING' || s.status === 'ACTIVE') && (
                                                <>
                                                    <button 
                                                        onClick={() => initiateCall(s.id, 'voice', { name: s.user.name, avatar: s.user.avatar })}
                                                        className="p-2.5 rounded-full bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"
                                                        title="Start Audio Call"
                                                    >
                                                        <Phone size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => initiateCall(s.id, 'video', { name: s.user.name, avatar: s.user.avatar })}
                                                        className="p-2.5 rounded-full bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all"
                                                        title="Start Video Call"
                                                    >
                                                        <Video size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => navigate(`/chat/${s.id}`)}
                                                className={`px-6 py-2.5 rounded-full text-[9px] font-sans font-semibold  tracking-[0.3em] transition-all ${
                                                    s.status === 'WAITING' || s.status === 'ACTIVE' 
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]' 
                                                    : 'bg-white/5 border border-white/10 text-white/85 hover:bg-white hover:text-black'
                                                }`}
                                            >
                                                {s.status === 'WAITING' || s.status === 'ACTIVE' ? 'Enter Sanctuary' : 'Details'}
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center border border-dashed border-emerald-500/10 rounded-[3rem] opacity-20 italic font-light tracking-widest bg-white/1 text-[10px] ">
                                        No active rituals in this realm.
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Side Sidebar - Actions */}
                    <div className="lg:col-span-4 space-y-8">
                         <div className="flex items-center gap-4 text-white/85 mb-4 px-2">
                              <Settings size={20} className="text-amber-400" />
                              <h2 className="text-[11px] font-sans font-semibold  tracking-[0.5em] text-left">Quick Actions</h2>
                         </div>

                         <div className="p-6 bg-black/60 border border-white/5 rounded-2xl space-y-4">
                            {[
                                { label: "View My Earnings", icon: IndianRupee, color: "text-emerald-400", path: "/expert-panel/earnings" },
                                { label: "Expert B2B Lounge", icon: Briefcase, color: "text-purple-400", path: "/expert-panel/lounge" },
                                { label: "Manage My Profile", icon: ShieldCheck, color: "text-blue-400", path: "/expert-panel/profile" },
                                { label: "Expert Handbook", icon: BookOpen, color: "text-amber-400", path: "/expert-panel/handbook" },
                                { label: "Expert Terms", icon: FileText, color: "text-rose-400", path: "/expert-panel/terms" },
                                { label: "Session History", icon: Clock, color: "text-purple-400", path: "/expert-panel/history" }
                            ].map((action, i) => (
                                <Link 
                                    key={i} 
                                    to={action.path}
                                    className="w-full flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-xl hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <action.icon size={18} className={`${action.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                        <span className="text-[10px] font-sans font-semibold  tracking-widest text-white/85 group-hover:text-white transition-colors">{action.label}</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white transition-all"></div>
                                </Link>
                            ))}
                         </div>
                    </div>
                </div>

                <p className="text-center mt-20 text-[10px] font-sans font-semibold  tracking-[0.8em] text-white/5  italic">Secure Expert Workspace • NovaSathi</p>
            </div>
        </ExpertLayout>
    );
};

export default ExpertOverview;
