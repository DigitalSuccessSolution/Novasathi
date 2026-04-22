import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentSpaceBanner = ({ title = "Student Safe Space" }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900/40 via-purple-900/20 to-blue-900/40 border border-white/10 group cursor-pointer"
      onClick={() => navigate("/stars-and-future")} // Legacy tarot section now repurposed via title
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-950/40 shrink-0 transform group-hover:rotate-3 transition-transform duration-500">
          <GraduationCap size={32} className="text-white" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold tracking-widest uppercase flex items-center gap-1">
              <ShieldCheck size={10} /> Verified Safe
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[8px] font-bold tracking-widest uppercase flex items-center gap-1">
              <Sparkles size={10} /> Free SOS
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-xl">
            A private sanctuary where expert counselors help you navigate academic stress, 
            heartbreak, and personal growth. Your identity is always protected.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">Go to Zone</span>
                <span className="text-xs text-purple-400 font-bold">Start Healing</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-500/50 transition-all duration-500">
                <ChevronRight size={20} className="text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
      </div>

      {/* Interactive Micro-animation indicator */}
      <div className="absolute bottom-0 left-0 h-1 bg-linear-to-r from-purple-600 to-indigo-600 transition-all duration-700 w-0 group-hover:w-full" />
    </motion.div>
  );
};

export default StudentSpaceBanner;
