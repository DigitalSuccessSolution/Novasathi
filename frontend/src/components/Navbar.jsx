import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Menu, X, MoreVertical, CircleUser, LayoutDashboard, 
  Wallet, History, Settings, LogOut, ChevronDown, Sparkles,
  CreditCard, ShieldCheck, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  
  const { token, user, logout, setIsLoginModalOpen } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const isAdminOrExpert = user?.role === 'ADMIN' || user?.role === "EXPERT";

  const navLinks = [
    { name: "Home", path: "/#hero" },
    { name: "Future", path: "/#features" },
    { name: "Feelings", path: "/#mood-tracker" },
    { name: "Tarot", path: "/#tarot" },
    { name: "Horoscope", path: "/#zodiac" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (isAdminOrExpert) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAdminOrExpert]);

  if (isAdminOrExpert) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  return (
    <div className="fixed top-0 left-0 w-full z-100 flex justify-center px-1 md:px-4 pt-2 md:pt-4 pointer-events-none">
      <nav className="w-full max-w-6xl bg-white/10 backdrop-blur-3xl border border-white/10 shadow-[0_8px_40px_0_rgba(0,0,0,0.5)] rounded-full px-4 md:px-8 py-3 flex justify-between items-center text-white pointer-events-auto mx-1 relative">
        
        {/* Logo Ritual */}
        <Link to="/" className="cursor-pointer flex flex-col group items-start shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
                <img 
                  src="/logo.jpeg" 
                  alt="Nova Sathi Logo" 
                  className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-sm group-hover:blur-md transition-all"></div>
            </div>
            <span className="hidden lg:block text-lg font-bold tracking-tighter italic bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">NovaSathi</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex space-x-6 lg:space-x-8 text-[11px] lg:text-xs font-bold tracking-[0.2em] text-white/50">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link 
                to={link.path} 
                className="hover:text-indigo-400 cursor-pointer transition-all duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions Sanctuary */}
        <div className="flex items-center gap-3">
          {/* Notification Sanctuary */}
          <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2 rounded-full border transition-all duration-500 group pointer-events-auto ${
                    isNotificationOpen ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
            >
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Bell size={18} className={`${isNotificationOpen ? 'text-white' : 'text-white/60'} group-hover:text-white transition-colors`} />
                </motion.div>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0d0e1a] shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                )}
            </button>

            <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </div>

          {/* User Profile Dropdown Sanctuary */}
          <div className="relative" ref={profileRef}>
            {!user ? (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold tracking-widest uppercase transition duration-300 backdrop-blur-md relative overflow-hidden group pointer-events-auto"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Wallet Preview (Desktop) */}
                <Link to="/wallet" className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <Wallet size={14} className="text-indigo-400" />
                    <span className="text-[11px] font-black tracking-tighter">₹{user?.wallet?.balance || 0}</span>
                </Link>

                {/* Profile Trigger */}
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2 px-1.5 py-1.5 md:pl-2 md:pr-4 rounded-full border transition-all duration-500 ${
                    isProfileOpen ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 p-[1px]">
                    <img 
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border border-black/10"
                    />
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[11px] font-bold tracking-tight">{user?.name?.split(' ')[0]}</span>
                  </div>
                  <ChevronDown size={14} className={`text-white/40 transition-transform duration-500 hidden md:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {/* Profile Dropdown Overlay */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute right-0 mt-4 w-72 bg-[#0d0e1a]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col gap-1 overflow-hidden pointer-events-auto"
                >
                  <div className="flex flex-col gap-0.5">
                    {[
                      { icon: LayoutDashboard, label: user?.role === "ADMIN" ? "Admin Panel" : user?.role === "EXPERT" ? "Expert Panel" : "Dashboard", path: user?.role === "ADMIN" ? "/admin" : user?.role === "EXPERT" ? "/expert-panel/overview" : "/dashboard", color: "text-indigo-400" },
                      { icon: CircleUser, label: "My Profile", path: "/profile", color: "text-blue-400" },
                      { icon: History, label: "Transactions", path: "/transactions", color: "text-emerald-400" },
                    ].map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 rounded-2xl transition-all group"
                      >
                        <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[11px] font-bold tracking-wider text-white/70 group-hover:text-white">
                            {item.label.toLowerCase()}
                        </span>
                      </Link>
                    ))}

                    <div className="h-[1px] bg-white/5 mx-5 my-2"></div>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-red-500/10 rounded-2xl transition-all group text-left w-full"
                    >
                      <LogOut size={18} className="text-red-500/70 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold tracking-wider text-red-500/70 group-hover:text-red-500">logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Icon */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white transition-all bg-white/5 rounded-full border border-white/5"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsOpen(false)}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] pointer-events-auto"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-[300px] z-[100] bg-[#0a0b14]/95 backdrop-blur-3xl border-l border-white/10 p-8 shadow-2xl pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-lg font-black tracking-widest italic text-white/30 lowercase">menu</span>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-bold tracking-tighter text-white hover:text-indigo-400 transition-colors lowercase"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                {!user ? (
                    <button 
                        onClick={() => { setIsLoginModalOpen(true); setIsOpen(false); }}
                        className="w-full py-4 bg-white text-black rounded-2xl flex items-center justify-center font-black tracking-widest uppercase"
                    >
                        Sign In
                    </button>
                ) : (
                    <>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden">
                              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold lowercase">{user?.name}</span>
                                <span className="text-xs text-indigo-400 font-black">₹{user?.wallet?.balance || 0} balance</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                           <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full py-3 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-bold tracking-widest lowercase">dashboard</Link>
                           <Link to="/profile" onClick={() => setIsOpen(false)} className="w-full py-3 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-bold tracking-widest lowercase">my profile</Link>
                           <Link to="/wallet" onClick={() => setIsOpen(false)} className="w-full py-3 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-bold tracking-widest lowercase">wallet / recharge</Link>
                           <button onClick={() => setShowLogoutModal(true)} className="w-full py-3 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center text-[10px] font-bold tracking-widest lowercase">logout</button>
                        </div>
                    </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#0d0e1a]/90 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] max-w-sm w-full text-center overflow-hidden pointer-events-auto"
            >
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 group">
                  <LogOut size={32} className="text-red-500/80 group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight text-white italic lowercase">confirm logout</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-semibold tracking-wider uppercase">are you sure you want to log out of your account?</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => { handleLogout(); setShowLogoutModal(false); }}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-50 hover:to-rose-500 text-white rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase transition-all shadow-2xl shadow-red-900/40"
                  >
                    yes, logout
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase transition-all border border-white/5"
                  >
                    cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
