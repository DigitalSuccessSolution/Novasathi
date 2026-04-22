import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Loader2, User, Mail, Lock, BadgeCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/**
 * Self-contained Expert Signup Component
 * Refined: Full state synchronization with AuthContext
 */

// Shared Visual Elements
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
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-400/90 ml-2">{label}</label>
            <div className="relative group">
                {Icon && <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" />}
                <input 
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 ${Icon ? 'pl-12' : 'px-6'} ${isPassword ? 'pr-12' : 'pr-6'} text-white text-sm outline-none focus:border-emerald-500/40 focus:bg-white/[0.07] transition-all placeholder:text-white/20`}
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

const ExpertSignup = () => {
    const navigate = useNavigate();
    const { api, setAuthUser } = useAuth(); // Using context to sync user state
    const { toast } = useToast();

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.email || !form.password) {
            return toast("Please fill in all fields.", "error");
        }
        if (form.password !== form.confirmPassword) {
            return toast("Passwords do not match.", "error");
        }

        try {
            setLoading(true);
            const response = await api.post("/auth/expert/signup", {
                name: form.name,
                phone: form.phone,
                email: form.email,
                password: form.password
            });
            
            const data = response.data.data;
            toast("Account created successfully. Redirecting...", "success");
            
            if (data?.token) {
                 // Sync state if auto-login token is provided
                 localStorage.setItem('token', data.token);
                 if (data.user) setAuthUser(data.user);
                 navigate("/expert-panel/profile");
            } else {
                 navigate("/expert-login");
            }
        } catch (err) {
            toast(err.response?.data?.message || "Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020205] flex items-center justify-center p-4 relative overflow-hidden">
            <CosmicBackground opacity={0.4} />
            
            <div className="w-full max-w-xl relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    
                    <header className="mb-8 text-center space-y-3">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                <BadgeCheck size={22} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Expert Registration</h2>
                            <p className="text-xs text-white/40 font-medium">Join our expert community</p>
                        </div>
                    </header>

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SimpleInput label="Full Name" name="name" icon={User} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Master Shanti" />
                            <SimpleInput label="Phone Number" name="phone" icon={Phone} value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 00000 00000" type="tel" />
                        </div>

                        <SimpleInput label="Email Address" name="email" icon={Mail} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="master.shanti@novasathi.com" type="email" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SimpleInput label="Create Password" name="password" icon={Lock} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="••••••••" type="password" />
                            <SimpleInput label="Confirm Password" name="confirmPassword" icon={Lock} value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" type="password" />
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
                            Register Account
                        </motion.button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-white/40">
                            Already have an account? <Link to="/expert-login" className="text-emerald-400 font-bold hover:underline ml-1">Login here</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ExpertSignup;
