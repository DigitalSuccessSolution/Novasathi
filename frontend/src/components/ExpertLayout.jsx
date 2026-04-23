import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    MessageCircle, 
    IndianRupee, 
    Clock, 
    User, 
    Settings, 
    LogOut,
    Menu,
    X,
    Sparkles,
    BookOpen,
    Scale
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useCall } from "../context/CallContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ExpertLayout = ({ children, noPadding = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { pendingRitualRequest, acceptRitual } = useChat();
    const { incomingCall, respondToCall, callType, callActive, isMinimized } = useCall();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isRinging = incomingCall || pendingRitualRequest;


    const isApproved = user?.serverStatus === 'APPROVED';

    const menuItems = [
        { title: "Overview", icon: LayoutDashboard, path: "/expert-panel/overview" },
        { title: "Expert Lounge", icon: Sparkles, path: "/expert-panel/lounge" },
        { title: "Active Rituals", icon: MessageCircle, path: "/expert-panel/sessions" },
        { title: "Earnings", icon: IndianRupee, path: "/expert-panel/earnings" },
        { title: "History", icon: Clock, path: "/expert-panel/history" },
        { title: "Profile", icon: User, path: "/expert-panel/profile" },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = "/";
    };

    // Only hide navigation when INSIDE a specific chat session (e.g. /chat/UUID)
    // Avoid hiding on dashboard routes or the sessions list
    const isFocused = (location.pathname.startsWith("/chat/") || location.pathname.startsWith("/expert-panel/chat/")) && location.pathname !== "/chat/active";
    const hideNavigation = isFocused || (callActive && !isMinimized);

    return (
        <div className="h-screen bg-[#06070f] text-white font-sans antialiased flex flex-col overflow-hidden">
            {/* Persistent Ritual Alert Bar */}
            <AnimatePresence>
                {isRinging && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-6 py-3 flex items-center justify-between shadow-[0_0_30px_rgba(219,39,119,0.3)] relative z-[100]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse border border-white/30">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-xs uppercase tracking-widest">Incoming {callType?.toUpperCase() || 'CHAT'} Ritual</h4>
                                <p className="text-[10px] text-white/80 font-medium">Guidance requested • Respond immediately</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => respondToCall(false)}
                                className="px-4 py-2 bg-black/20 hover:bg-black/40 text-white rounded-xl text-[10px] font-bold transition-all border border-white/10"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={() => respondToCall(true)}
                                className="px-6 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95"
                            >
                                Accept Guidance
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className={`${hideNavigation ? 'hidden' : 'hidden lg:flex'} w-72 flex-col bg-white/[0.02] border-r border-white/5 backdrop-blur-3xl shrink-0 relative z-[50]`}>
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Sparkles size={20} className="text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[10px] tracking-[0.4em] text-white/85 font-semibold uppercase">Expert Management</h1>
                            <span className="text-lg font-light tracking-tight italic">Nova <span className="font-semibold not-italic">Sathi</span></span>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 border group ${
                                        isActive 
                                        ? "bg-emerald-600/10 border-emerald-500/30 text-white shadow-2xl shadow-emerald-500/10" 
                                        : "bg-transparent border-transparent text-white/85 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    <item.icon size={18} className={isActive ? "text-emerald-400" : "opacity-40 group-hover:opacity-100 transition-opacity"} />
                                    <span className="text-[11px] font-sans font-semibold tracking-widest uppercase">{item.title}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1">
                              <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.displayName || 'Expert'}&background=10B981&color=FFFFFF`} className="w-full h-full rounded-2xl object-cover" alt="" />
                         </div>
                         <div className="flex flex-col">
                              <span className={`text-[10px] font-bold tracking-widest uppercase ${user?.serverStatus === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {user?.serverStatus === 'APPROVED' ? 'Verified Expert' : 'Pending Review'}
                              </span>
                              <span className="text-xs font-light text-white/85 truncate max-w-[120px]">{user?.displayName || "Expert"}</span>
                         </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/5 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-sans font-semibold text-[10px] tracking-[0.3em] border border-rose-500/10 uppercase"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            {!hideNavigation && (
                <div className="lg:hidden fixed top-0 left-0 w-full h-20 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-40 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-emerald-400" />
                        <span className="text-sm font-semibold tracking-widest italic">Expert Lounge</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/85"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            )}

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
                                    className="flex items-center gap-6 py-6 border-b border-white/5 text-white/85 active:text-emerald-400 transition-colors"
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
            <main className="flex-1 overflow-y-auto scroll-smooth pt-20 lg:pt-0">
                <div className={noPadding ? "h-full w-full" : "container mx-auto max-w-screen-2xl p-6 lg:p-12 pb-32"}>
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full h-20 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-50 flex items-center justify-around px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                {menuItems.slice(0, 5).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-emerald-400 scale-110' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <item.icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : ""} />
                            <span className={`text-[8px] font-sans font-semibold tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'} uppercase`}>{item.title}</span>
                        </Link>
                    )
                })}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white/60"
                >
                    <Menu size={20} />
                    <span className="text-[8px] font-sans font-semibold tracking-widest opacity-60 uppercase">More</span>
                </button>
            </nav>
        </div>
    </div>
    );
};

export default ExpertLayout;

