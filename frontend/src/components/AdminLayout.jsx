import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    LayoutGrid,
    User, 
    ShieldCheck, 
    IndianRupee, 
    Settings, 
    FileText,
    LogOut,
    Menu,
    X,
    Sparkles,
    MessageCircle,
    Wallet
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { title: "Overview", icon: LayoutDashboard, path: "/admin" },
        { title: "B2B Lounge", icon: Sparkles, path: "/expert-panel/lounge" },
        { title: "Users", icon: User, path: "/admin/users" },
        { title: "Rituals", icon: MessageCircle, path: "/admin/ritual-monitor" },
        { title: "Verifications", icon: ShieldCheck, path: "/admin/verifications" },
        { title: "Finances", icon: IndianRupee, path: "/admin/finances" },
        { title: "Payouts", icon: Wallet, path: "/admin/payouts" },
        { title: "Tracks & Skills", icon: LayoutGrid, path: "/admin/categories" },
        { title: "Content Control", icon: FileText, path: "/admin/content" },
        { title: "Platform Settings", icon: Settings, path: "/admin/settings" },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = "/admin-login";
    };

    return (
        <div className="min-h-screen bg-[#06070f] text-white font-sans antialiased flex overflow-hidden">
            {/* Desktop Sidebar (Internalized for Administrative Control) */}
            <aside className="hidden lg:flex w-72 flex-col bg-white/[0.02] border-r border-white/5 backdrop-blur-3xl shrink-0">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                            <Sparkles size={20} className="text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] tracking-[0.4em] text-white/85 font-semibold uppercase">Admin Panel</span>
                            <span className="text-lg font-light tracking-tight italic">Nova <span className="font-semibold not-italic">Sathi</span></span>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 border group ${
                                        isActive 
                                        ? "bg-purple-600/10 border-purple-500/30 text-white shadow-2xl shadow-purple-500/10" 
                                        : "bg-transparent border-transparent text-white/85 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <item.icon size={18} className={isActive ? "text-purple-400" : "opacity-40 group-hover:opacity-100 transition-opacity"} />
                                    <span className="text-[11px] font-sans font-semibold tracking-widest">{item.title}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1">
                              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=6D28D9&color=FFFFFF`} className="w-full h-full rounded-2xl grayscale" alt="Admin" />
                         </div>
                         <div className="flex flex-col">
                              <span className="text-[10px] font-semibold tracking-widest text-purple-400 uppercase">Controller</span>
                              <span className="text-xs font-light text-white/85 truncate max-w-[120px]">{user?.name || "Verified Admin"}</span>
                         </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/5 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-sans font-semibold text-[10px] tracking-[0.3em] border border-rose-500/10 uppercase"
                    >
                        <LogOut size={16} /> End Session
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 w-full h-20 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-40 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-purple-400" />
                    <span className="text-sm font-semibold tracking-widest italic uppercase">Admin Console</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/85 border border-white/10"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="lg:hidden fixed inset-0 z-50 bg-[#06070f] p-8 pt-24"
                    >
                        <nav className="space-y-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-6 py-6 border-b border-white/5 text-white/85 active:text-purple-400 transition-colors"
                                >
                                    <item.icon size={24} />
                                    <span className="text-sm font-semibold tracking-[0.3em] uppercase">{item.title}</span>
                                </Link>
                            ))}
                            <button 
                                onClick={handleLogout}
                                className="w-full mt-10 flex items-center gap-6 py-6 text-rose-500 font-semibold tracking-[0.3em] uppercase"
                            >
                                <LogOut size={24} /> Logout
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-20 lg:pt-0 pb-24 lg:pb-0">
                <div className="container mx-auto max-w-screen-2xl p-6 lg:p-12">
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full h-20 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-50 flex items-center justify-around px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                {menuItems.slice(0, 5).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-purple-400 scale-110' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <item.icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""} />
                            <span className={`text-[8px] font-sans font-semibold tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.title}</span>
                        </Link>
                    )
                })}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white/60"
                >
                    <Menu size={20} />
                    <span className="text-[8px] font-sans font-semibold tracking-widest opacity-60">More</span>
                </button>
            </nav>
        </div>
    );
};

export default AdminLayout;
