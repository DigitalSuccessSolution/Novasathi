import React, { useState, useEffect } from "react";
import { Wallet, Loader2, CheckCircle, Clock, Ban } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Admin Payout Approvals — Expert Withdrawal Management
 */
const AdminPayouts = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payout: null });
    const [submitting, setSubmitting] = useState(false);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/payouts");
            setPayouts(res.data.data);
        } catch (err) {
            console.error("[PAYOUT_FETCH_ERROR]", err);
            toast("Failed to fetch payouts", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [api]);

    const executeApprovePayout = async () => {
        if (!confirmModal.payout) return;
        try {
            setSubmitting(true);
            await api.patch(`/admin/payouts/${confirmModal.payout.id}/approve`);
            toast("Payout approved successfully", "success");
            setConfirmModal({ isOpen: false, payout: null });
            fetchPayouts();
        } catch (err) {
            console.error("[PAYOUT_APPROVE_ERROR]", err);
            toast(err.response?.data?.message || "Failed to approve payout", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPayouts = filter === "ALL" 
        ? payouts 
        : payouts.filter(p => p.status === filter);

    const pendingCount = payouts.filter(p => p.status === 'PENDING').length;
    const completedCount = payouts.filter(p => p.status === 'COMPLETED').length;
    const totalPending = payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const totalCompleted = payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);

    const filters = ["ALL", "PENDING", "COMPLETED"];

    return (
        <AdminLayout>
            <div className="space-y-6 text-left relative">
                
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 group text-left">
                    <div className="flex items-center gap-4 text-white/85 group-hover:text-white transition-colors text-left">
                        <Wallet size={20} className="text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">Payout Approvals</h2>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col gap-2 group hover:bg-white/5 transition-all text-left">
                        <span className="text-[9px] font-sans font-semibold tracking-widest text-white/50 uppercase">Total Requests</span>
                        <div className="text-xl font-semibold tracking-tight">{payouts.length}</div>
                    </div>
                    <div className="p-4 bg-amber-500/[0.02] border border-amber-500/10 rounded-lg flex flex-col gap-2 group hover:bg-amber-500/5 transition-all text-left">
                        <span className="text-[9px] font-sans font-semibold tracking-widest text-amber-400/60 uppercase">Pending</span>
                        <div className="text-xl font-semibold tracking-tight text-amber-400">{pendingCount}</div>
                    </div>
                    <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-lg flex flex-col gap-2 group hover:bg-emerald-500/5 transition-all text-left">
                        <span className="text-[9px] font-sans font-semibold tracking-widest text-emerald-400/60 uppercase">Approved</span>
                        <div className="text-xl font-semibold tracking-tight text-emerald-400">{completedCount}</div>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col gap-2 group hover:bg-white/5 transition-all text-left">
                        <span className="text-[9px] font-sans font-semibold tracking-widest text-white/50 uppercase">Pending Volume</span>
                        <div className="text-xl font-semibold tracking-tight text-amber-400">₹{totalPending}</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                filter === f
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-transparent text-white/40 border-white/5 hover:text-white/70 hover:border-white/10'
                            }`}
                        >
                            {f}
                            {f === 'PENDING' && pendingCount > 0 && (
                                <span className="ml-2 w-4 h-4 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px]">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block w-full overflow-hidden bg-[#121212] border border-white/10 rounded-lg shadow-2xl">
                    <div className="max-h-[60vh] overflow-y-auto overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm text-left font-sans">
                            <thead className="sticky top-0 z-10 bg-[#121212] border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-6 py-4">Expert</th>
                                    <th className="px-6 py-4">Bank Details</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Requested</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 size={32} className="text-amber-500 animate-spin" />
                                                <span className="text-[10px] font-sans font-semibold tracking-[0.5em] text-white/40 uppercase italic">
                                                    Loading Payouts...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPayouts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.5em] text-white/20 uppercase italic">
                                            No payout requests found
                                        </td>
                                    </tr>
                                ) : filteredPayouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-white/90">{p.expert?.user?.name || p.expert?.displayName || "Expert"}</div>
                                                <div className="text-[11px] text-white/40">{p.expert?.user?.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                {p.expert?.upiId && (
                                                    <div className="text-[11px] text-white/70"><span className="text-white/30">UPI:</span> {p.expert.upiId}</div>
                                                )}
                                                {p.expert?.bankName && (
                                                    <div className="text-[11px] text-white/70"><span className="text-white/30">Bank:</span> {p.expert.bankName}</div>
                                                )}
                                                {p.expert?.accountNumber && (
                                                    <div className="text-[11px] text-white/70"><span className="text-white/30">A/C:</span> {p.expert.accountNumber}</div>
                                                )}
                                                {p.expert?.ifscCode && (
                                                    <div className="text-[11px] text-white/70"><span className="text-white/30">IFSC:</span> {p.expert.ifscCode}</div>
                                                )}
                                                {!p.expert?.upiId && !p.expert?.bankName && (
                                                    <span className="text-[10px] text-white/20 italic">Not provided</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-lg text-emerald-400">₹{p.amount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                p.status === 'COMPLETED' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : p.status === 'FAILED'
                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-white/50 italic">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.status === 'PENDING' ? (
                                                <button 
                                                    onClick={() => setConfirmModal({ isOpen: true, payout: p })}
                                                    className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase px-4 py-2 opacity-50">
                                                    <CheckCircle size={14} /> Done
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card Stack */}
                <div className="md:hidden max-h-[70vh] overflow-y-auto scrollbar-hide space-y-4 text-left p-1 pb-10">
                    {loading ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                            <Loader2 size={28} className="text-amber-500 animate-spin" />
                            <span className="text-[10px] font-sans font-semibold tracking-[0.4em] text-white/40 uppercase italic">Loading...</span>
                        </div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.4em] text-white/20 uppercase italic">No payout requests</div>
                    ) : filteredPayouts.map((p) => (
                        <div key={p.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 group active:scale-[0.98] transition-all text-left backdrop-blur-3xl shadow-xl">
                            <div className="flex items-center justify-between text-left">
                                <div className="flex flex-col text-left">
                                    <span className="text-sm font-bold text-white/90">{p.expert?.user?.name || "Expert"}</span>
                                    <span className="text-[10px] font-sans font-semibold text-white/40 tracking-widest italic">{p.expert?.user?.phone}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-sans font-bold tracking-widest border shadow-lg ${
                                    p.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                                    p.status === 'FAILED' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' :
                                    'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                }`}>
                                    {p.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="text-[8px] font-sans font-semibold text-white/30 tracking-[0.2em] uppercase">Amount</span>
                                    <span className="text-lg font-bold text-emerald-400">₹{p.amount}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-[8px] font-sans font-semibold text-white/30 tracking-[0.2em] uppercase">Date</span>
                                    <span className="text-[10px] font-sans font-semibold text-white/60 italic">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="pt-4 border-t border-white/5 space-y-1">
                                <span className="text-[8px] font-sans font-semibold text-white/30 tracking-[0.2em] uppercase">Bank Details</span>
                                <div className="space-y-0.5">
                                    {p.expert?.upiId && <div className="text-[11px] text-white/70"><span className="text-white/30">UPI:</span> {p.expert.upiId}</div>}
                                    {p.expert?.bankName && <div className="text-[11px] text-white/70"><span className="text-white/30">Bank:</span> {p.expert.bankName}</div>}
                                    {p.expert?.accountNumber && <div className="text-[11px] text-white/70"><span className="text-white/30">A/C:</span> {p.expert.accountNumber}</div>}
                                    {p.expert?.ifscCode && <div className="text-[11px] text-white/70"><span className="text-white/30">IFSC:</span> {p.expert.ifscCode}</div>}
                                    {!p.expert?.upiId && !p.expert?.bankName && <span className="text-[10px] text-white/20 italic">Not provided</span>}
                                </div>
                            </div>

                            {p.status === 'PENDING' && (
                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, payout: p })}
                                        className="flex-1 py-3 bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 transition-all"
                                    >
                                        <CheckCircle size={18} />
                                        <span className="ml-2 text-xs font-semibold">Approve</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {confirmModal.isOpen && confirmModal.payout && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
                            >
                                <div className="p-6 text-center space-y-6">
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <Wallet size={32} />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Approve Payout?</h3>
                                        <p className="text-sm text-white/50">
                                            Approve <strong className="text-white">₹{confirmModal.payout.amount}</strong> payout to{" "}
                                            <strong className="text-white">{confirmModal.payout.expert?.user?.name || "Expert"}</strong>?
                                            This action marks the payout as completed.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button 
                                            onClick={() => setConfirmModal({ isOpen: false, payout: null })}
                                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeApprovePayout}
                                            disabled={submitting}
                                            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : "Yes, Approve"}
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

export default AdminPayouts;
