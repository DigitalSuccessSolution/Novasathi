import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Standard Admin Login Page
 * A clean, simple, and professional portal for administrative access.
 */
const AdminLogin = () => {
    const navigate = useNavigate();
    const { user, adminLogin } = useAuth();
    const { toast } = useToast();
    
    React.useEffect(() => {
        if (user && user.role === 'ADMIN') {
            navigate("/admin");
        }
    }, [user, navigate]);
    
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!credentials.email || !credentials.password) {
            return setError("Please enter your admin credentials.");
        }

        try {
            setLoading(true);
            await adminLogin(credentials.email, credentials.password);
            toast("Login successful.", "success");
            navigate("/admin");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Access denied.");
            toast("Login Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06070f] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle Gradient background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Minimal Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 p-2.5 shadow-xl border border-white/10 flex items-center justify-center mb-4">
                        <Shield size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-white/40 mt-1">Sign in to manage NovaSathi</p>
                </div>

                {/* Main Login Card */}
                <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                                    <p className="text-xs font-semibold text-rose-500/90">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                    <input 
                                        type="email"
                                        placeholder="admin@novasathi.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-indigo-500/50 transition-all text-sm"
                                        value={credentials.email}
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white outline-none focus:border-indigo-500/50 transition-all text-sm"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-indigo-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Secure Administrative Access Only</p>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
