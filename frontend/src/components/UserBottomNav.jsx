import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, Wallet, User, MessageCircle } from "lucide-react";

/**
 * User Bottom Navigation - Optimized for the consumer experience.
 * Visible on Dashboard, Profile, Wallet, and related user sanctuary routes.
 */
const UserBottomNav = () => {
    const location = useLocation();

    const navItems = [
        { title: "Home", icon: Home, path: "/" },
        { title: "Experts", icon: MessageCircle, path: "/experts" },
        { title: "Mind", icon: LayoutDashboard, path: "/dashboard" },
        { title: "Wallet", icon: Wallet, path: "/wallet" },
        { title: "Me", icon: User, path: "/profile" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-50 flex items-center justify-around px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-purple-400 scale-110' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <item.icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""} />
                        <span className={`text-[8px] font-sans font-semibold tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'} uppercase`}>{item.title}</span>
                    </Link>
                )
            })}
        </nav>
    );
};

export default UserBottomNav;
