import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  IndianRupee, 
  History, 
  LogOut,
  MessageCircle,
  ShieldCheck,
  Settings,
  FileText,
  Sparkles
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Sidebar = ({ closeMenu }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isAdminPath = location.pathname.startsWith('/admin');

  const adminMenuItems = [
    { title: "Overview", icon: LayoutDashboard, path: "/admin" },
    { title: "B2B Lounge", icon: Sparkles, path: "/expert-panel/lounge" },
    { title: "Users", icon: User, path: "/admin/users" },
    { title: "Rituals", icon: MessageCircle, path: "/admin/ritual-monitor" },
    { title: "Verifications", icon: ShieldCheck, path: "/admin/verifications" },
    { title: "Finances", icon: IndianRupee, path: "/admin/finances" },
    { title: "Content", icon: FileText, path: "/admin/content" },
    { title: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const menuItems = isAdminPath ? adminMenuItems : [];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="h-full flex flex-col bg-white/[0.02] border-r border-white/5 backdrop-blur-3xl overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Branding Section */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isAdminPath ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              <Sparkles size={20} className={isAdminPath ? 'text-purple-400' : 'text-blue-400'} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.4em] text-white/85 font-semibold uppercase">{isAdminPath ? "Admin Panel" : "User Portal"}</span>
              <span className="text-lg font-light tracking-tight italic">Nova <span className="font-semibold not-italic">Sathi</span></span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-8 space-y-2 overflow-y-auto scrollbar-hide pb-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const themeColor = isAdminPath ? "purple" : "blue";
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 border group ${
                  isActive 
                  ? `bg-${themeColor}-600/10 border-${themeColor}-500/30 text-white shadow-2xl shadow-${themeColor}-500/10` 
                  : "bg-transparent border-transparent text-white/85 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={18} className={isActive ? `text-${themeColor}-400` : "opacity-40 group-hover:opacity-100 transition-opacity"} />
                <span className="text-[11px] font-sans font-semibold tracking-widest">{item.title}</span>
                {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-${themeColor}-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]`} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile/Footer Section */}
      <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.01]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/5 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-sans font-semibold text-[10px] tracking-[0.3em] border border-rose-500/10 uppercase"
        >
          <LogOut size={16} /> {isAdminPath ? "End Session" : "Sign Out"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
