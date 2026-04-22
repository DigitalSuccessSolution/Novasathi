import React from 'react';
import { X, Clock, Bell, UserPlus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BusyPopup = ({ isOpen, onClose, expert, onNotifyMe }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#06070f]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#161922] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white z-10"
          >
            <X size={16} />
          </button>

          {/* Body */}
          <div className="p-6 text-center">
             {/* Expert Avatar / Icon */}
             <div className="relative inline-block mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 p-1">
                    <img 
                        src={expert?.avatar || `https://ui-avatars.com/api/?name=${expert?.name || 'Expert'}&background=f59e0b&color=fff`} 
                        alt={expert?.name} 
                        className="w-full h-full rounded-full object-cover grayscale-[0.3]"
                    />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-[#161922] flex items-center justify-center">
                    <Clock size={10} className="text-white" />
                </div>
             </div>

             <h2 className="text-lg font-bold text-white mb-1.5">{expert?.name || 'Expert'} is Busy</h2>
             <p className="text-[12px] text-white/30 leading-relaxed mb-6 px-2">
                Currently in another session. Get notified when they are free or try someone else.
             </p>

             {/* Action Buttons */}
             <div className="space-y-2">
                <button 
                    onClick={() => {
                        onNotifyMe && onNotifyMe();
                        onClose();
                    }}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Bell size={14} /> Notify Me
                </button>
                
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white/40 transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                    Try Another Expert <ArrowRight size={14} />
                </button>
             </div>
          </div>

          {/* Footer Status */}
          <div className="bg-amber-500/5 py-2.5 border-t border-white/5 text-center">
             <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest flex items-center justify-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                 Avg. Wait: 5-8 mins
             </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BusyPopup;
