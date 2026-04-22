import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  IndianRupee, 
  History, 
  TrendingUp, 
  Sparkles, 
  MessageSquare,
  ChevronRight,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentSpaceBanner from "../components/StudentSpaceBanner";
import { AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, api, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get("/users/history");
      setHistory(res.data.data || []);
    } catch (err) {
      console.error("🌌 [DASHBOARD_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: "Balance", 
      value: `₹${user?.wallet?.balance?.toFixed(0) || "0"}`, 
      icon: IndianRupee, 
      color: "text-emerald-400", 
      bg: "bg-emerald-400/10" 
    },
    { 
      title: "Consumption", 
      value: `₹${user?.wallet?.totalSpent?.toFixed(0) || "0"}`, 
      icon: TrendingUp, 
      color: "text-amber-400", 
      bg: "bg-amber-400/10" 
    },
    { 
      title: "Consultations", 
      value: history.length.toString(), 
      icon: MessageSquare, 
      color: "text-purple-400", 
      bg: "bg-purple-400/10" 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
              Hello, {user?.name || "Soul"} <span className="text-xl">👋</span>
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-white/70 mt-1 font-semibold uppercase">Divine Guidance is manifesting for you</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                // From ChatContext
                const { startAndOpenChat } = require('../context/ChatContext').useChat();
                startAndOpenChat(null, true); // true = isRandom
              }}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
            >
              <Sparkles size={14} className="text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>Connect Random</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[8px]">10 MIN FREE</span>
            </button>
            <button 
              onClick={() => navigate("/wallet")}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-[10px] tracking-widest uppercase shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Add Credits
            </button>
          </div>
        </header>

        {/* Mood Selector (SRS §2.1) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-sans font-semibold tracking-[0.5em] text-white/50 uppercase">Emotional Sanctuary</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'broken', label: "Broken", icon: "💔", color: "from-rose-500/20 to-rose-600/10", border: "border-rose-500/20", text: "text-rose-400" },
              { id: 'fear', label: "Fear", icon: "😨", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20", text: "text-amber-400" },
              { id: 'lonely', label: "Lonely", icon: "🕸️", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-400" },
              { id: 'confused', label: "Confused", icon: "🌀", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20", text: "text-purple-400" }
            ].map((mood) => (
              <motion.button
                key={mood.id}
                whileHover={{ scale: 1.02, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await api.patch("/users/profile", { currentMood: mood.id });
                    navigate("/experts", { state: { mood: mood.id } });
                  } catch (err) { navigate("/experts"); }
                }}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] bg-gradient-to-br ${mood.color} border ${mood.border} group transition-all relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl -mr-8 -mt-8 group-hover:bg-white/10 transition-all" />
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{mood.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-[.3em] ${mood.text}`}>{mood.label}</span>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={12} className={mood.text} />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-white/40 font-medium italic">"Aaj kaisa feel ho raha hai? Select a vibe to find your perfect guide."</p>
          </div>
        </section>

        {/* Student Sanctuary Banner (SRS §2B.2) */}
        <StudentSpaceBanner title={user?.settings?.studentZoneTitle || "Student Safe Space"} />

        {/* Low Balance Alert (SRS §9.4) */}
        {user?.wallet?.balance < 20 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-500 tracking-tight">Low Balance Warning</p>
                <p className="text-[10px] text-amber-500/70">Recharge now to continue uninterrupted consultations.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/wallet")}
              className="text-[10px] font-bold text-amber-500 border-b border-amber-500/30 hover:border-amber-500 transition-all"
            >
              Recharge ₹
            </button>
          </motion.div>
        )}

        {/* Join as Expert CTA (SRS §8) */}
        {user?.role === 'USER' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/expert-signup")}
            className="group relative p-8 rounded-[3rem] bg-[#0c0c14] border border-white/5 overflow-hidden cursor-pointer hover:border-purple-500/30 transition-all shadow-2xl"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-purple-600/10 transition-all duration-700" />
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-[2rem] bg-purple-600/10 border border-purple-500/20 flex items-center justify-center group-hover:rotate-6 transition-transform">
                   <Sparkles className="text-purple-400" size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h3 className="text-xl font-bold text-white tracking-tight italic">Share Your <span className="text-purple-400">Cosmic Wisdom</span></h3>
                   <p className="text-xs text-white/50 mt-2 font-medium">Join the Sanctuary as an Expert. Guide seekers through their darkest hours and earn while you heal.</p>
                </div>
                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-3">
                   Apply Now <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
             </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors relative overflow-hidden group"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center border border-white/5`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div>
                  <p className="text-[9px]  tracking-widest text-white/70 font-semibold mb-0.5">{stat.title}</p>
                  <p className="text-xl font-semibold text-white/90">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity Mini List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold  tracking-widest text-white/85">Recent History</h2>
            <button 
              onClick={() => navigate("/transactions")}
              className="text-[10px] font-semibold  tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
            >
              View Full Index
            </button>
          </div>
          
          <div className="space-y-2">
            {loading ? (
                <div className="py-10 text-center opacity-20 italic font-light tracking-widest text-[9px] ">Consulting Memory...</div>
            ) : history.length > 0 ? (
                (() => {
                    // Group by Expert ID to show "User-wise" not "Session-wise"
                    const uniqueExperts = [];
                    const seenExperts = new Set();
                    
                    history.forEach(item => {
                        const expertId = item.expertId;
                        if (!seenExperts.has(expertId)) {
                            seenExperts.add(expertId);
                            uniqueExperts.push(item);
                        }
                    });

                    return uniqueExperts.map((item) => {
                      const isSeeker = user?.id === item.userId;
                      const otherParty = isSeeker ? item.expert?.user : item.user;
                      const displayName = (item.isAnonymous && !isSeeker) ? "Anonymous Soul" : (otherParty?.name || item.expert?.displayName || "Unknown");
                      
                      const isLocked = !item.isUnlocked && item.totalMessages > 0;
                      const hasAdmin = !!item.adminInterventionId;
                      
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => navigate(`/chat/${item.id}`)}
                          className={`bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/8 transition-colors group cursor-pointer transition-all ${isLocked ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/5 shrink-0 bg-purple-500/10 flex items-center justify-center">
                                {otherParty?.avatar || item.expert?.profileImage ? (
                                    <img src={otherParty?.avatar || item.expert?.profileImage} className="w-full h-full object-cover opacity-80" alt="" />
                                ) : (
                                    <MessageSquare size={14} className="text-purple-400" />
                                )}
                                </div>
                                {hasAdmin && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center border border-[#06070f] shadow-lg">
                                        <ShieldAlert size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[11px] font-semibold text-gray-200 tracking-tight">{displayName}</h4>
                                {isLocked ? (
                                    <Lock size={10} className="text-amber-500/60" />
                                ) : item.totalMessages > 0 ? (
                                    <Unlock size={10} className="text-emerald-500/60" />
                                ) : null}
                              </div>
                              <p className="text-[9px] text-gray-600 font-semibold mt-0.5">
                                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {item.status}
                                  {isLocked && <span className="text-amber-500/70 ml-1"> (Locked)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                               <p className="text-[10px] font-semibold text-white/85">₹{item.totalAmount || 0}</p>
                               {item.durationMinutes > 0 && <p className="text-[8px] text-gray-700 font-semibold">{item.durationMinutes}m</p>}
                            </div>
                            <ChevronRight size={12} className="text-white/40 group-hover:text-white transition-all ml-1" />
                          </div>
                        </div>
                      );
                    });
                })()
            ) : (
                <div className="py-10 text-center opacity-30 italic font-light tracking-widest text-[9px] ">No recent sessions found</div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
