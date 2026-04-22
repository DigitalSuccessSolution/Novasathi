import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Loader2, Star, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/**
 * Self-contained Expert Login Component
 * Powered by AuthContext for global state sync
 */

const CosmicBackground = ({ opacity = 0.3, starCount = 50 }) => {
    const stars = useMemo(() => Array.from({ length: starCount }).map(() => ({
        id: Math.random(),
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        size: Math.random() * 2 + 1 + "px",
        animationDuration: Math.random() * 5 + 3,
    })), [starCount]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ opacity }}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] -mr-48 -mt-48 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] -ml-48 -mb-48 animate-pulse" />
            {stars.map(s => (
                <motion.div 
                    key={s.id} 
                    initial={{ opacity: 0.1 }}
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: s.animationDuration, repeat: Infinity }}
                    className="absolute bg-white rounded-full" 
                    style={{ top: s.top, left: s.left, width: s.size, height: s.size }} 
                />
            ))}
        </div>
    );
};

const SimpleInput = ({ label, icon: Icon, value, onChange, placeholder, type = "text", maxLength }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-emerald-400/90 ml-2">{label}</label>
            <div className="relative group">
                {Icon && <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" />}
                <input 
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3.5 ${Icon ? 'pl-12' : 'px-6'} ${isPassword ? 'pr-12' : 'pr-6'} text-white text-sm outline-none focus:border-emerald-500/40 focus:bg-white/[0.07] transition-all placeholder:text-white/20`}
                />
                {isPassword && (
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-emerald-400 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const ExpertLogin = () => {
    const navigate = useNavigate();
    const { loginWithCredentials } = useAuth(); // Using global auth handler
    const { toast } = useToast();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast("Please enter your email and password.", "error");
        try {
            setLoading(true);
            const data = await loginWithCredentials(form.email, form.password);
            toast(`Welcome back, ${data.user.name}.`, "success");
            
            // Redirect based on role (Safety check)
            if (data.user.role === 'EXPERT') {
                navigate("/expert-panel");
            } else if (data.user.role === 'ADMIN') {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            toast(err.response?.data?.message || "Invalid credentials. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020205] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <CosmicBackground opacity={0.4} />

            <div className="w-full max-w-md relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    
                    <header className="mb-10 text-center space-y-3">
                        <div className="inline-flex items-center justify-center">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                                <Star size={24} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Expert Login</h2>
                            <p className="text-xs text-white/40 font-medium">Access your expert account</p>
                        </div>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-5">
                            <SimpleInput label="Email Address" icon={Mail} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="expert@novasathi.com" type="email" />
                            <SimpleInput label="Password" icon={Lock} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="••••••••" type="password" />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit" 
                            disabled={loading} 
                            className="w-full py-4 bg-emerald-600 rounded-xl text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 mt-4 overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Login to Portal
                        </motion.button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                        <p className="text-xs text-white/30">
                            New to the sanctuary? <Link to="/expert-signup" className="text-emerald-400 font-bold hover:underline ml-1">Create an account</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ExpertLogin;
