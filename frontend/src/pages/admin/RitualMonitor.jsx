import React, { useState, useEffect } from "react";
import { 
    MessageCircle, 
    Clock, 
    ArrowRight, 
    Search,
    Shield,
    Loader2,
    Users,
    Zap,
    ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AdminLayout from "../../components/AdminLayout";
import socket from "../../lib/socket";

/**
 * Admin Ritual Monitor - Real-time Oversight
 */
const RitualMonitor = () => {
    const { api, token } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("ALL");

    const fetchAllSessions = async () => {
        try {
            const res = await api.get("/admin/sessions/live");
            const sessionData = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.sessions || []);
            setSessions(sessionData);
        } catch (err) {
            console.error("[MONITOR_SYNC_ERROR]", err);
            toast("Failed to sync live streams", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchAllSessions();

        const refreshData = () => fetchAllSessions();
        socket.on("session_started", refreshData);
        socket.on("session_ended", refreshData);
        socket.on("new_ritual_request", refreshData);

        const interval = setInterval(fetchAllSessions, 15000);
        return () => {
            socket.off("session_started", refreshData);
            socket.off("session_ended", refreshData);
            socket.off("new_ritual_request", refreshData);
            clearInterval(interval);
        };
    }, [api, token]);

    const filteredSessions = Array.isArray(sessions) ? sessions.filter(s => {
        const nameMatch = 
            (s.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
            (s.expert?.displayName || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const statusMatch = filter === "ALL" || s.status === filter;
        return nameMatch && statusMatch;
    }) : [];

    const stats = [
        { label: "Live Sessions", value: sessions.filter(s => s.status === 'ACTIVE').length, icon: Zap, color: "text-emerald-400" },
        { label: "Waiting Users", value: sessions.filter(s => s.status === 'WAITING').length, icon: Clock, color: "text-amber-400" },
        { label: "Total Monitored", value: sessions.length, icon: Shield, color: "text-purple-400" }
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 text-left">
                {/* Header & Stats Bundle */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                             <MessageCircle size={20} />
                        </div>
                        <div className="text-left">
                             <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/50 uppercase">Security Matrix</h2>
                             <h1 className="text-xl font-bold text-white">Ritual <span className="text-purple-400">Monitor</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {stats.map((s, i) => (
                            <div key={i} className="px-4 py-2 bg-[#121212] border border-white/5 rounded-lg flex items-center gap-3">
                                <s.icon size={14} className={s.color} />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{s.label}</span>
                                    <span className="text-sm font-bold text-white">{s.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#121212] border border-white/10 rounded-lg">
                    <div className="flex bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 items-center gap-3 w-full sm:w-80 group focus-within:border-purple-500/50 transition-all">
                        <Search size={16} className="text-white/20 group-focus-within:text-purple-400" />
                        <input 
                            type="text" 
                            placeholder="Search by User or Expert..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-white/10 w-full" 
                        />
                    </div>

                    <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg">
                        {["ALL", "ACTIVE", "WAITING"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-[9px] font-bold tracking-widest transition-all ${
                                    filter === f 
                                    ? "bg-purple-600 text-white shadow-lg" 
                                    : "text-white/30 hover:text-white/60"
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Table Content - Now Scrollable */}
                <div className="bg-[#121212] border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-320px)]">
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-black/40 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-white/40 sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Expert / Stage</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-purple-500 animate-spin" />
                                            <span className="text-[10px] font-bold tracking-[0.4em] text-white/20 uppercase italic">Syncing Streams...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <span className="text-[10px] font-bold tracking-[0.4em] text-white/20 uppercase italic">No active rituals found</span>
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((ritual) => (
                                    <tr key={ritual.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 p-1 shrink-0">
                                                    <img src={ritual.user?.avatar || `https://ui-avatars.com/api/?name=${ritual.user?.name}&background=3B82F6&color=FFFFFF`} className="w-full h-full rounded shadow-sm" alt="" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white/90">{ritual.user?.name}</span>
                                                    <span className="text-[10px] text-white/30">{ritual.user?.phone || 'Private'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ritual.status === 'WAITING' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Queue Stage</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 p-1 shrink-0">
                                                        <img src={ritual.expert?.user?.avatar || `https://ui-avatars.com/api/?name=${ritual.expert?.displayName}&background=A855F7&color=FFFFFF`} className="w-full h-full rounded shadow-sm" alt="" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-white/70">{ritual.expert?.displayName || 'Expert'}</span>
                                                        <span className="text-[9px] text-white/30 uppercase tracking-tighter">Connected</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] text-white/40">
                                                    <Clock size={10} />
                                                    <span>{new Date(ritual.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-emerald-400/80">
                                                    ₹{ritual.totalAmount || 0} <span className="text-[9px] text-white/20 ml-1">Current Billing</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                                ritual.status === 'ACTIVE' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {ritual.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/admin/messages/${ritual.id}`)}
                                                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-600/10 text-white/40 hover:text-purple-400 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-end gap-2 ml-auto"
                                            >
                                                Audit <ExternalLink size={10} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-[9px] font-sans font-semibold tracking-[0.5em] text-white/5 italic">
                    Universal Surveillance Layer • Real-time Monitoring Active
                </p>
            </div>
        </AdminLayout>
    );
};

export default RitualMonitor;
