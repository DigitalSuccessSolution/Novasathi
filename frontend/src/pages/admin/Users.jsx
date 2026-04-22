import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users as UsersIcon, Search, MoreVertical, MessageCircle, Wallet, Ban, Shield, UserPlus, X, Check, Loader2 } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Admin User Management - Standard Directory
 */
const AdminUsers = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("ALL");
    
    // Add Expert Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [sessionHistory, setSessionHistory] = useState({ user: null, sessions: [] });
    const [restrictModal, setRestrictModal] = useState({ isOpen: false, user: null });
    const [submitting, setSubmitting] = useState(false);
    const [newExpert, setNewExpert] = useState({
        phone: "",
        name: "",
        displayName: "",
        bio: "",
        experience: "1",
        pricePerMinute: "10"
    });

    const fetchUsers = async (query = "") => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/users?role=${selectedRole}&search=${query}`);
            setUsers(res.data.data);
        } catch (err) {
            console.error("[USER_DIRECTORY_ERROR]", err);
            toast("Failed to fetch users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [api, selectedRole, searchTerm]);

    const executeRestrictUser = async () => {
        if (!restrictModal.user) return;
        try {
            setSubmitting(true);
            const res = await api.patch(`/admin/users/${restrictModal.user.id}/restrict`);
            toast(res.data?.message || "User status updated", "success");
            setRestrictModal({ isOpen: false, user: null });
            fetchUsers(searchTerm);
        } catch (err) {
            console.error("[RESTRICT_ERROR]", err);
            toast("Failed to update user status", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddExpert = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post("/admin/experts", newExpert);
            toast("Expert account created successfully!", "success");
            setShowAddModal(false);
            setNewExpert({ phone: "", name: "", displayName: "", bio: "", experience: "1", pricePerMinute: "10" });
            fetchUsers(searchTerm);
        } catch (err) {
            toast(err.response?.data?.message || "Failed to create expert", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Backend now handles all filtering (role & search term query-wise)
    const filteredUsers = users;

    const roles = ["ALL", "USER", "EXPERT", "ADMIN"];

    return (
        <AdminLayout>
            <div className="space-y-6 text-left relative">
                
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 group text-left">
                    <div className="flex items-center gap-4 text-white/85 group-hover:text-white transition-colors text-left">
                        <UsersIcon size={20} className="text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">User Directory</h2>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        {/* Dynamic Add Action */}
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600/10 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-sans font-semibold tracking-widest text-purple-400 hover:bg-purple-600/20 transition-all uppercase shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                        >
                            <UserPlus size={16} /> Add Expert
                        </button>

                        {/* Role Tabs */}
                        <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                            {roles.map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-4 py-1.5 rounded-xl text-[8px] font-sans font-semibold tracking-widest transition-all duration-300 ${
                                        selectedRole === role 
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                                        : "text-white/40 hover:text-white/60 border border-transparent"
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-white/5 border border-white/5 rounded-2xl px-4 py-2 items-center gap-3 w-full sm:w-72 group focus-within:border-blue-500/40 transition-all">
                            <Search className="w-4 h-4 text-white/45 group-focus-within:text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="Search identity..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-[9px] font-sans font-semibold  tracking-widest w-full placeholder:text-white/20 italic" 
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop Data Grid */}
                <div className="hidden md:block w-full overflow-hidden bg-[#121212] border border-white/10 rounded-lg shadow-2xl mt-4">
                    <div className="max-h-[65vh] overflow-y-auto overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm text-left font-sans">
                            <thead className="sticky top-0 z-10 bg-[#121212] border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-6 py-4">Full Name</th>
                                    <th className="px-6 py-4">User Role</th>
                                    <th className="px-6 py-4">Wallet Bal</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 size={32} className="text-blue-500 animate-spin" />
                                                <span className="text-[10px] font-sans font-semibold tracking-[0.5em] text-white/40 uppercase italic">
                                                    Loading Directory...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.5em] text-white/20 uppercase italic">
                                            No users found
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-left">
                                                <div className="font-bold text-white/90">{u.name || "Anonymous User"}</div>
                                                <div className="text-[11px] text-white/40">{u.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                                                u.role === 'EXPERT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white/70 font-medium">
                                            ₹{u.wallet?.balance || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {u.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setRestrictModal({ isOpen: true, user: u })}
                                                    title={u.isActive ? "Restrict User" : "Unrestrict User"}
                                                    className={`p-2 rounded-lg transition-all ${u.isActive ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300' : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'}`}
                                                >
                                                    {u.isActive ? <Ban size={16} /> : <Check size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Identity Stack */}
                <div className="md:hidden max-h-[70vh] overflow-y-auto scrollbar-hide space-y-4 text-left p-1 pb-10">
                    {loading ? (
                         <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                             <Loader2 size={28} className="text-blue-500 animate-spin" />
                             <span className="text-[10px] font-sans font-semibold tracking-[0.4em] text-white/40 uppercase italic">Loading...</span>
                         </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.4em] text-white/20 uppercase italic">No users found</div>
                    ) : filteredUsers.map((u) => (
                        <div key={u.id} className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-4 group active:scale-[0.98] transition-all text-left backdrop-blur-3xl shadow-xl">
                            <div className="flex items-center justify-between text-left">
                                <div className="flex items-center gap-3 text-left">
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-white/90">{u.name || "Anonymous"}</span>
                                        <span className="text-[10px] font-sans font-semibold text-white/40 tracking-widest italic">{u.phone}</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-sans font-bold tracking-widest border shadow-lg ${u.role === 'ADMIN' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' : u.role === 'EXPERT' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>
                                    {u.role}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="text-[8px] font-sans font-semibold text-white/30 tracking-[0.2em] uppercase">Balance</span>
                                    <span className="text-sm font-bold text-emerald-400">₹{u.wallet?.balance || 0}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-[8px] font-sans font-semibold text-white/30 tracking-[0.2em] uppercase">Status</span>
                                    <div className="flex items-center justify-end gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500/30'}`}></div>
                                        <span className="text-[10px] font-sans font-semibold text-white/60 italic capitalize">{u.isActive ? "Active" : "Inactive"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => setRestrictModal({ isOpen: true, user: u })}
                                    className={`flex-1 py-3 border rounded-xl flex items-center justify-center transition-all ${
                                        u.isActive
                                        ? 'bg-rose-600/5 hover:bg-rose-600/10 border-rose-500/10 text-rose-500' 
                                        : 'bg-emerald-600/5 hover:bg-emerald-600/10 border-emerald-500/10 text-emerald-500'
                                    }`}
                                >
                                    {u.isActive ? <Ban size={18} /> : <Check size={18} />}
                                    <span className="ml-2 text-xs font-semibold">{u.isActive ? "Restrict" : "Unrestrict"}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Expert Modal Overlay */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#0c0d15] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]"
                            >
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-semibold tracking-widest text-purple-400 uppercase">Add Expert</h3>
                                        <p className="text-[10px] text-white/40 italic">Create a new professional account</p>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="text-white/20 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddExpert} className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-sans font-semibold tracking-widest text-white/40 uppercase ml-2">Phone Number</label>
                                            <input 
                                                required
                                                type="tel" 
                                                placeholder="+91..."
                                                value={newExpert.phone}
                                                onChange={(e) => setNewExpert({...newExpert, phone: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-sans font-semibold tracking-widest text-white/40 uppercase ml-2">Full Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Legal Name"
                                                value={newExpert.name}
                                                onChange={(e) => setNewExpert({...newExpert, name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-sans font-semibold tracking-widest text-white/40 uppercase ml-2">Expert Display Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="e.g. Astro Guru"
                                            value={newExpert.displayName}
                                            onChange={(e) => setNewExpert({...newExpert, displayName: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-sans font-semibold tracking-widest text-white/40 uppercase ml-2">Experience (Yrs)</label>
                                            <input 
                                                type="number" 
                                                value={newExpert.experience}
                                                onChange={(e) => setNewExpert({...newExpert, experience: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-sans font-semibold tracking-widest text-white/40 uppercase ml-2">Price Per Min (₹)</label>
                                            <input 
                                                type="number" 
                                                value={newExpert.pricePerMinute}
                                                onChange={(e) => setNewExpert({...newExpert, pricePerMinute: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-sans font-bold tracking-[0.1em] text-white/40 uppercase ml-2">Short Bio</label>
                                        <textarea 
                                            rows="3"
                                            placeholder="Expert biography and experience..."
                                            value={newExpert.bio}
                                            onChange={(e) => setNewExpert({...newExpert, bio: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <button 
                                        disabled={submitting}
                                        type="submit"
                                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-xs tracking-[0.2em] uppercase hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {submitting ? "Processing..." : <><Check size={18} /> Create Expert</>}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Ritual History Modal */}
                <AnimatePresence>
                    {showHistoryModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#0c0d15] border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]"
                            >
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                                    <div className="flex flex-col text-left">
                                        <h3 className="text-sm font-bold tracking-[0.1em] text-blue-400 uppercase">Session History</h3>
                                        <p className="text-[10px] text-white/40 mt-1">Timeline for {sessionHistory.user?.name}</p>
                                    </div>
                                    <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                                    {sessionHistory.sessions.length === 0 ? (
                                        <p className="text-center py-20 text-[10px] uppercase tracking-widest text-white/20 italic">No session history found</p>
                                    ) : (
                                        sessionHistory.sessions.map((sess) => (
                                            <div key={sess.id} className="p-6 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all text-left">
                                                <div className="flex items-center gap-6">
                                                   <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                                        <MessageCircle size={20} />
                                                   </div>
                                                   <div className="flex flex-col gap-1 text-left">
                                                       <div className="flex items-center gap-3">
                                                           <span className="text-xs font-bold text-white uppercase tracking-tight">With {sess.expert?.displayName || "Expert"}</span>
                                                           <span className={`px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest uppercase border ${
                                                               sess.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                                                           }`}>{sess.status}</span>
                                                       </div>
                                                       <div className="flex items-center gap-4 text-[9px] font-sans font-semibold text-white/40 tracking-wider">
                                                           <span>{new Date(sess.createdAt).toLocaleDateString()} • {new Date(sess.createdAt).toLocaleTimeString()}</span>
                                                           <span>{sess.totalMinutes || 0} mins</span>
                                                           <span className="text-emerald-400">₹{sess.totalAmount || 0}</span>
                                                       </div>
                                                   </div>
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/admin/messages/${sess.id}`)}
                                                    className="px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                                >
                                                    View Chat
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-6 text-center border-t border-white/5 bg-white/2">
                                     <p className="text-[8px] font-sans font-bold tracking-[0.5em] text-white/5 uppercase">Archive Record v2.0</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <p className="text-center text-[10px] font-sans font-semibold tracking-[1em] text-white/5 italic pt-8">User Management Protocol Active • Section v2.4</p>
                {/* Restrict Confirmation Modal */}
                <AnimatePresence>
                    {restrictModal.isOpen && restrictModal.user && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
                            >
                                <div className="p-6 text-center space-y-6">
                                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${restrictModal.user.isActive ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {restrictModal.user.isActive ? <Ban size={32} /> : <Check size={32} />}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {restrictModal.user.isActive ? "Deactivate Account?" : "Reactivate Account?"}
                                        </h3>
                                        <p className="text-sm text-white/50">
                                            Are you sure you want to {restrictModal.user.isActive ? "restrict" : "unrestrict"} <strong className="text-white">{restrictModal.user.name || "this user"}</strong>? 
                                            {restrictModal.user.isActive ? " They will immediately lose access to the platform." : " They will regain full access to their account."}
                                        </p>
                                        {restrictModal.user.role === 'ADMIN' && (
                                            <p className="text-xs text-rose-400 font-bold mt-2 bg-rose-500/10 py-2 px-3 rounded-lg">
                                                WARNING: You are modifying an ADMIN account. If you deactivate your own account, you will be locked out immediately.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button 
                                            onClick={() => setRestrictModal({ isOpen: false, user: null })}
                                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeRestrictUser}
                                            disabled={submitting}
                                            className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                restrictModal.user.isActive 
                                                ? 'bg-rose-600 hover:bg-rose-500' 
                                                : 'bg-emerald-600 hover:bg-emerald-500'
                                            }`}
                                        >
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : restrictModal.user.isActive ? "Yes, Restrict" : "Yes, Unrestrict"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
