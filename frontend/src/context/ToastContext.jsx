import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2, X } from "lucide-react";

const ToastContext = createContext();

/**
 * Premium Sanctuary Alerts - Spiritual Notification Matrix
 * Replaces standard browser alerts with elegant, animated toasts.
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success") => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        // Auto-dissolve after 5 cosmic seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* The Toast Sanctuary - Rendering Layer */}
            <div className="fixed top-10 right-10 z-[1000] flex flex-col gap-2.5 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto min-w-[300px] max-w-md py-3.5 px-5 rounded-2xl border bg-black/80 backdrop-blur-3xl shadow-2xl flex items-center justify-between gap-4 group overflow-hidden relative ${
                                t.type === "success" ? "border-emerald-500/20 shadow-emerald-500/10" : "border-rose-500/20 shadow-rose-500/10"
                            }`}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl ${
                                    t.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                     {t.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>
                                <div className="space-y-0.5">
                                     <p className="text-[13px] font-sans font-semibold text-white tracking-wide leading-snug">{t.message}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => removeToast(t.id)}
                                className="p-2 text-white/40 hover:text-white transition-colors relative z-10"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};
