import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  ArrowLeft, 
  MoreVertical, 
  Trash2, 
  CheckCircle, 
  CreditCard, 
  MessageSquare, 
  Clock, 
  Search, 
  Check,
  Layout
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const navigate = useNavigate();
  const { fetchNotifications, markAllRead, markAsRead, deleteNotification, loading } = useNotifications();
  
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = async (reset = false) => {
    const p = reset ? 1 : page;
    const data = await fetchNotifications(p, 20);
    if (data?.notifications) {
      setNotifications(prev => reset ? data.notifications : [...prev, ...data.notifications]);
      setHasMore(data.notifications.length === 20);
      if (!reset) setPage(p + 1);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const tabs = [
    { id: "all", label: "all alerts" },
    { id: "unread", label: "unread" },
    { id: "payments", label: "payments" }
  ];

  const getIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('wallet_low')) return { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" };
    if (t?.includes('payment') || t?.includes('recharge') || t?.includes('wallet')) return { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (t?.includes('session') || t?.includes('chat') || t?.includes('call')) return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" };
    if (t?.includes('missed')) return { icon: Bell, color: "text-rose-400", bg: "bg-rose-500/10" };
    return { icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-500/10" };
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === "all" || (activeTab === "unread" && !n.isRead) || (activeTab === "payments" && n.type === "recharge");
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-[#e2e8f0] pb-24">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6">
        <header className="pt-24 md:pt-32 pb-12">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-medium lowercase tracking-wide">back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white lowercase">notifications</h1>
              <p className="text-slate-400 text-lg font-light lowercase leading-relaxed">
                Stay updated with your account activity and session alerts.
              </p>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161922] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <div className="flex gap-2 p-1 bg-[#161922] rounded-xl border border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all lowercase ${
                            activeTab === tab.id
                                ? "bg-white text-black shadow-lg"
                                : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <button 
                onClick={handleMarkAll}
                className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest px-4 py-2 hover:bg-indigo-500/5 rounded-lg"
            >
                <Check size={14} />
                <span>mark all read</span>
            </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((note) => {
                const { icon: Icon, color, bg } = getIcon(note.type);
                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => !note.isRead && markAsRead(note.id)}
                    className={`group relative bg-[#161922] border border-white/5 rounded-2xl p-5 md:p-6 transition-all hover:bg-[#1c212e] hover:border-indigo-500/20 shadow-xl flex gap-6 cursor-pointer ${!note.isRead ? 'border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-500`}>
                      <Icon size={22} className={color} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-base font-medium tracking-tight lowercase ${!note.isRead ? 'text-white' : 'text-slate-400'}`}>
                          {note.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium lowercase">
                              <Clock size={12} />
                              <span>{formatDistanceToNow(new Date(note.createdAt))} ago</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                            className="p-1.5 text-slate-700 hover:text-rose-500 transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 font-light leading-relaxed lowercase max-w-2xl">
                        {note.message}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : !loading && (
                <div className="py-32 text-center space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 text-slate-700">
                        <Bell size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-medium text-white/40 lowercase">all caught up</h3>
                        <p className="text-xs text-slate-600 font-medium tracking-[0.1em] uppercase">you have no recent notifications</p>
                    </div>
                </div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {hasMore && !loading && (
            <button 
                onClick={() => loadData()}
                className="w-full py-4 border border-white/5 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest mt-8"
            >
                load older notifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
