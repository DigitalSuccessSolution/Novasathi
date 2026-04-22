import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

/**
 * DashboardLayout - Adaptive container for internal pages.
 * Leverages the global Top Navbar for primary navigation.
 * Keeps the Sidebar ONLY for Admins.
 */
const DashboardLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-black text-white relative flex overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 text-white">
        <img 
          src="/dashboard_bg.png" 
          alt="Cosmic Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/20 to-black" />
      </div>

      {/* Internal Admin Sidebar */}
      {isAdmin && (
        <aside className="hidden md:block w-72 lg:w-80 h-screen sticky top-0 z-50 shrink-0 border-r border-white/5">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar Toggle (Only for Admin when regular Navbar is not enough) */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-150 md:hidden">
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      )}

      {/* Mobile Drawer (Only for Admin) */}
      <AnimatePresence>
        {isAdmin && isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-200 w-72 h-screen"
          >
            <Sidebar closeMenu={() => setIsMobileMenuOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area - Significant top padding to clear Global Navbar */}
      <main className={`flex-1 h-screen overflow-y-auto no-scrollbar relative z-10 flex flex-col pt-24 pb-20`}>
        <div className="max-w-6xl mx-auto w-full px-6 md:px-12 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
