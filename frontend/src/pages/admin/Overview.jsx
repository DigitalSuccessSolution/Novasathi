import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ShieldCheck, HeartPulse, IndianRupee, Loader2, Wallet } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Overview Dashboard
 */
const AdminOverview = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: "Active Users", value: "...", icon: Users, color: "text-blue-400", border: "border-blue-500/10", key: "totalUsers" },
        { label: "Active Experts", value: "...", icon: ShieldCheck, color: "text-purple-400", border: "border-purple-500/10", key: "activeExperts" },
        { label: "Total Revenue", value: "...", icon: IndianRupee, color: "text-emerald-400", border: "border-emerald-500/10", key: "revenue" },
        { label: "Live Sessions", value: "...", icon: HeartPulse, color: "text-rose-400", border: "border-rose-500/10", key: "liveChats" }
    ]);
    const [pendingExperts, setPendingExperts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [overviewRes, pendingRes] = await Promise.all([
                api.get("/admin/overview"),
                api.get("/admin/experts/pending")
            ]);

            const data = overviewRes.data.data;
            const pending = pendingRes.data.data;

            setStats(prev => prev.map(s => ({
                ...s,
                value: s.key === 'revenue' ? `₹${data[s.key] || 0}` : (data[s.key] || 0).toString()
            })));

            setPendingExperts(pending.slice(0, 5)); 
        } catch (err) {
            console.error("[ADMIN_OVERVIEW_ERROR]", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 15000);
        return () => clearInterval(interval);
    }, [api]);

    const quickLinks = [
        { label: "User Directory", path: "/admin/users", icon: Users, color: "text-blue-400" },
        { label: "Verifications", path: "/admin/verifications", icon: ShieldCheck, color: "text-purple-400" },
        { label: "Finances", path: "/admin/finances", icon: IndianRupee, color: "text-emerald-400" },
        { label: "Payouts", path: "/admin/payouts", icon: Wallet, color: "text-amber-400" },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 text-left">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    {stats.map((stat, idx) => (
                        <motion.div 
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-5 bg-[#121212] border border-white/10 rounded-lg flex flex-col gap-3 group hover:border-white/20 transition-all text-left`}
                        >
                            <div className="flex items-center justify-between">
                                <div className={`w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={16} />
                                </div>
                            </div>
                            <div className="space-y-1 text-left">
                                <span className="text-[9px] font-sans font-semibold tracking-widest text-white/50 uppercase">{stat.label}</span>
                                <div className="text-2xl font-bold tracking-tight text-white">
                                    {loading ? <div className="w-16 h-7 bg-white/5 animate-pulse rounded"></div> : stat.value}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Grid: Pending Experts + Quick Links */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Pending Expert Verifications */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white/85">
                                <ShieldCheck size={18} className="text-purple-400" />
                                <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">Pending Verifications</h2>
                            </div>
                            <button 
                                onClick={() => navigate('/admin/verifications')}
                                className="text-[10px] font-bold text-purple-400 hover:text-white tracking-wider uppercase transition-colors"
                            >
                                View All →
                            </button>
                        </div>

                        <div className="bg-[#121212] border border-white/10 rounded-lg overflow-hidden">
                            {loading ? (
                                <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                                    <Loader2 size={28} className="text-purple-500 animate-spin" />
                                    <span className="text-[10px] font-sans font-semibold tracking-[0.4em] text-white/40 uppercase italic">Loading...</span>
                                </div>
                            ) : pendingExperts.length === 0 ? (
                                <div className="p-16 text-center text-[10px] font-sans font-semibold tracking-[0.4em] text-white/20 uppercase italic">
                                    No pending verifications
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {pendingExperts.map((expert) => (
                                        <div key={expert.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 overflow-hidden shrink-0">
                                                    <img 
                                                        src={expert.user?.avatar || `https://ui-avatars.com/api/?name=${expert.user?.name || 'E'}&background=6D28D9&color=FFFFFF`} 
                                                        className="w-full h-full object-cover" 
                                                        alt="" 
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white/90">{expert.user?.name || expert.displayName || "Expert"}</span>
                                                    <span className="text-[10px] text-white/40">{expert.user?.phone || "No phone"}</span>
                                                    <span className="text-[10px] text-white/30">{expert.specialization || "Specialist"} • {expert.documents?.length || 0} docs</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="hidden md:block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    Pending
                                                </span>
                                                <button 
                                                    onClick={() => navigate('/admin/verifications')}
                                                    className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3 text-white/85">
                            <HeartPulse size={18} className="text-emerald-400" />
                            <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">Quick Access</h2>
                        </div>

                        <div className="bg-[#121212] border border-white/10 rounded-lg divide-y divide-white/5">
                            {quickLinks.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors text-left group"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center ${link.color} group-hover:scale-110 transition-transform`}>
                                        <link.icon size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors tracking-wider uppercase">{link.label}</span>
                                    <span className="ml-auto text-white/20 group-hover:text-white/50 transition-colors text-sm">→</span>
                                </button>
                            ))}
                        </div>

                        {/* Platform Status */}
                        <div className="bg-[#121212] border border-white/10 rounded-lg p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Platform Status</span>
                            </div>
                            <p className="text-[10px] text-white/30 leading-relaxed">
                                All systems operational. Sessions are end-to-end encrypted.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOverview;
