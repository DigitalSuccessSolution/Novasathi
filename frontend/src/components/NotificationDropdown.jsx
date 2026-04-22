import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, CreditCard, MessageSquare, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, fetchNotifications, markAllRead, markAsRead, loading } = useNotifications();
  const [localList, setLocalList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, 5).then(data => {
        if (data?.notifications) {
          setLocalList(data.notifications);
        }
      });
    }
  }, [isOpen]);

  // Map backend types to icons
  const getIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('wallet_low')) return { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" };
    if (t?.includes('payment') || t?.includes('recharge') || t?.includes('wallet')) return { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (t?.includes('session') || t?.includes('chat') || t?.includes('call')) return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" };
    if (t?.includes('missed')) return { icon: Bell, color: "text-rose-400", bg: "bg-rose-500/10" };
    return { icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-500/10" };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110] md:hidden" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-14 w-[320px] md:w-[380px] bg-[#0d0e1a]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] z-[120] overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Bell size={16} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-white lowercase">notifications</h3>
              </div>
              <button 
                onClick={() => { markAllRead(); onClose(); }}
                className="p-1 px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
              >
                clear all
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[350px] overflow-y-auto scrollbar-hide py-2">
              {loading ? (
                <div className="py-20 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : localList.length > 0 ? (
                localList.map((note) => {
                  const { icon: Icon, color, bg } = getIcon(note.type);
                  return (
                    <div 
                      key={note.id} 
                      onClick={() => !note.isRead && markAsRead(note.id)}
                      className={`px-6 py-4 hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!note.isRead ? 'bg-indigo-500/[0.02]' : ''}`}
                    >
                      {!note.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 border border-white/5`}>
                          <Icon size={18} className={color} />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold tracking-tight lowercase ${!note.isRead ? 'text-white' : 'text-white/60'}`}>
                              {note.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[9px] text-white/30 font-medium lowercase">
                              <Clock size={10} />
                              <span>{formatDistanceToNow(new Date(note.createdAt))} ago</span>
                            </div>
                          </div>
                          <p className="text-[11px] leading-relaxed text-white/40 font-light lowercase line-clamp-2">
                            {note.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-3 opacity-20">
                    <Bell size={40} className="mx-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">all caught up</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <Link 
                to="/notifications" 
                onClick={onClose}
                className="block w-full py-4 text-center text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all border-t border-white/5 uppercase tracking-[0.3em] bg-white/[0.02] hover:bg-white/5"
            >
              see all notifications
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
