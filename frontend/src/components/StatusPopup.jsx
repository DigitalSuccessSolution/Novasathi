import React from 'react';
import { X, Clock, Bell, ArrowRight, WifiOff, MessageCircle, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StatusPopup — A high-fidelity modal for notifying users when an expert 
 * is currently Busy, Offline, or otherwise occupied.
 */
const StatusPopup = ({ isOpen, onClose, expert, type = 'busy' }) => {
  if (!isOpen) return null;

  const isBusy = type === 'busy';
  const isOffline = type === 'offline';

  const config = {
    busy: {
      title: "Expert is Busy",
      description: `Currently in a deep ritual with another seeker. Please wait or set a reminder.`,
      icon: Clock,
      color: "amber",
      actionText: "Notify Me",
      actionIcon: Bell
    },
    offline: {
      title: "Soul Guide is Offline",
      description: "This expert is currently resting their energy. You can wait for their return or find another guide.",
      icon: WifiOff,
      color: "rose",
      actionText: "Check Others",
      actionIcon: ArrowRight
    }
  }[type] || {
    title: "Unavailable",
    description: "Expert is currently not available for rituals.",
    icon: X,
    color: "slate",
    actionText: "Okay",
    actionIcon: X
  };

  const Icon = config.icon;
  const ActionIcon = config.actionIcon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#06070f]/90 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-sm bg-[#161922] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header Branding */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white z-10"
          >
            <X size={16} />
          </button>
          
          <div className="p-8 pt-12 text-center">
             {/* Dynamic Status Icon */}
             <div className="relative inline-block mb-6">
                <div className={`w-20 h-20 rounded-3xl rotate-12 border-2 border-${config.color}-500/20 p-1.5 bg-${config.color}-500/5`}>
                    <img 
                        src={expert?.profileImage || expert?.avatar || `https://ui-avatars.com/api/?name=${expert?.displayName || 'Expert'}&background=6366f1&color=fff`} 
                        alt={expert?.displayName} 
                        className="w-full h-full rounded-2xl object-cover grayscale-[0.5] -rotate-12"
                    />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 bg-${config.color === 'amber' ? 'amber-500' : 'rose-500'} rounded-2xl border-4 border-[#161922] flex items-center justify-center shadow-2xl`}>
                    <Icon size={14} className="text-white" />
                </div>
             </div>

             <div className="space-y-2 mb-8">
                <h2 className="text-xl font-bold text-white tracking-tight italic">
                    {expert?.displayName} <span className={`text-${config.color}-400`}>is {type}</span>
                </h2>
                <p className="text-[11px] text-white/40 leading-relaxed max-w-[240px] mx-auto font-medium">
                    {config.description}
                </p>
             </div>

             {/* Action Buttons */}
             <div className="space-y-3">
                <button 
                    onClick={onClose}
                    className={`w-full py-4 bg-white text-black hover:bg-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2`}
                >
                    <ActionIcon size={14} /> {config.actionText}
                </button>
                
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] text-white/40 transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                    Try Another Ritual
                </button>
             </div>
          </div>

          {/* Expert Meta Card (Subtle) */}
          <div className={`bg-${config.color}-500/5 py-4 border-t border-white/5 px-8 flex items-center justify-between`}>
             <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-[#161922] bg-slate-800 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover grayscale" />
                        </div>
                    ))}
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    {isBusy ? "3 people waiting" : "Online in 2h"}
                </span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full bg-${config.color === 'amber' ? 'amber-500' : 'rose-500'} animate-pulse`} />
                <span className={`text-[9px] font-bold text-${config.color}-500/80 uppercase tracking-widest`}>
                    {isBusy ? "Busy" : "Away"}
                </span>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatusPopup;
