import React, { useState, useEffect, useCallback } from "react";
import { IndianRupee, TrendingUp, Sparkles, AlertCircle, ArrowUpRight, Clock, X, CheckCircle2, History, CreditCard, Landmark, ShieldCheck, Settings, Plus } from "lucide-react";
import ExpertLayout from "../../components/ExpertLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Expert Earnings - Session income and transaction history.
 */
const ExpertEarnings = () => {
    const { api, token } = useAuth();
    const { toast } = useToast();
    const [earningsData, setEarningsData] = useState({ 
        today: 0, 
        lifetime: 0, 
        transactions: [], 
        payouts: [],
        commissionRate: 0,
        available: 0,
        bankDetails: {
            bankName: "",
            accountNumber: "",
            upiId: ""
        }
    });
    const [loading, setLoading] = useState(true);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState("sessions"); // "sessions" or "payouts"
    const [editBankData, setEditBankData] = useState({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: ""
    });

    const fetchEarnings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/experts/earnings");
            const data = res.data.data;
            const commissionFactor = 1 - (data.commissionRate / 100);
            
            const netEarnings = (data.expert.totalEarnings || 0) * commissionFactor;
            const totalRequested = (data.expert.payouts || []).reduce((acc, p) => 
                (p.status === 'COMPLETED' || p.status === 'PENDING') ? acc + p.amount : acc, 0
            );
            
            const available = Math.max(0, netEarnings - totalRequested);

            setEarningsData({
                today: (data.today.earnings || 0),
                lifetime: netEarnings,
                transactions: data.expert.chatSessions || [],
                payouts: data.expert.payouts || [],
                commissionRate: data.commissionRate,
                available: available,
                bankDetails: {
                    bankName: data.expert.bankName || "",
                    accountNumber: data.expert.accountNumber || "",
                    ifscCode: data.expert.ifscCode || "",
                    upiId: data.expert.upiId || ""
                }
            });
            setEditBankData({
                bankName: data.expert.bankName || "",
                accountNumber: data.expert.accountNumber || "",
                ifscCode: data.expert.ifscCode || "",
                upiId: data.expert.upiId || ""
            });
        } catch (err) {
            console.error("🌌 [EARNINGS_ERROR] Ritual finance sync failed:", err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        
        if (!amount || amount <= 0) return toast("Please enter a valid amount", "error");
        if (amount > earningsData.available) return toast("Insufficient available balance", "error");
        if (amount < 500) return toast("Minimum withdrawal is ₹500", "error");
        if (!earningsData.bankDetails.accountNumber && !earningsData.bankDetails.upiId) {
            return toast("Please set up your Bank/UPI details in Profile first", "error");
        }

        try {
            setIsSubmitting(true);
            await api.post("/experts/payout", { amount });
            toast("Withdrawal request submitted successfully!", "success");
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
            fetchEarnings(); 
        } catch (err) {
            toast(err.response?.data?.message || "Withdrawal failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBankDetails = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await api.patch("/experts/profile", editBankData);
            toast("Payment details updated successfully", "success");
            setIsEditBankModalOpen(false);
            fetchEarnings();
        } catch (err) {
            toast(err.response?.data?.message || "Update failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ExpertLayout>
            <div className="space-y-8 text-left">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                             <IndianRupee size={24} />
                        </div>
                        <div className="space-y-1 text-left">
                             <div className="flex items-center gap-3">
                                 <h2 className="text-[10px] font-sans font-semibold  tracking-[0.5em] text-white/85">Financial Summary</h2>
                                 <button 
                                    onClick={() => setIsEditBankModalOpen(true)}
                                    className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-emerald-400 hover:border-emerald-500/20 transition-all text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                 >
                                    <Settings size={10} /> Edit Payout Method
                                 </button>
                             </div>
                             <h1 className="text-2xl font-semibold tracking-tight italic text-white text-left">My <span className="text-emerald-400">Earnings</span> ✨</h1>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-8 py-3 bg-emerald-600 shadow-2xl shadow-emerald-600/30 text-white rounded-full font-sans font-semibold text-[10px]  tracking-[0.3em] hover:bg-emerald-500 hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <ArrowUpRight size={14} /> Withdraw
                    </button>
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/20 hover:bg-white/5 transition-all duration-700 relative overflow-hidden active:scale-95 h-[180px]">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100"></div>
                         <div className="space-y-2 relative z-10 text-left">
                                <span className="text-[10px] font-sans font-semibold  tracking-[0.4em] text-white/85">Available Balance</span>
                                <div className="text-4xl font-sans font-semibold tracking-tighter text-white">₹{earningsData.available.toFixed(1)}</div>
                         </div>
                         <div className="flex items-center justify-between relative z-10">
                                <span className="text-[9px] font-sans font-semibold  tracking-widest text-emerald-400 opacity-60">Verified Pot</span>
                                <div className="p-2 bg-emerald-600/10 rounded-lg text-emerald-400 font-sans font-semibold text-[9px]  tracking-widest">Commission: {earningsData.commissionRate}%</div>
                         </div>
                    </div>

                    <div className="p-6 bg-linear-to-br from-purple-600 to-indigo-700 rounded-2xl flex flex-col justify-between group hover:shadow-[0_40px_100px_rgba(147,51,234,0.3)] transition-all duration-700 relative overflow-hidden active:scale-95 h-[180px]">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[60px]"></div>
                        <div className="space-y-2 relative z-10 text-left">
                                <span className="text-[10px] font-sans font-semibold  tracking-[0.4em] text-white/85">Lifetime Net</span>
                                <div className="text-4xl font-sans font-semibold tracking-tighter text-white">₹{earningsData.lifetime.toFixed(0)}</div>
                         </div>
                         <div className="flex items-center gap-2 relative z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                              <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest">Growth Path Active</span>
                         </div>
                    </div>

                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/20 hover:bg-white/5 transition-all duration-700 relative overflow-hidden active:scale-95 h-[180px]">
                         <div className="space-y-2 relative z-10 text-left">
                                <span className="text-[10px] font-sans font-semibold  tracking-[0.4em] text-white/85">Settlement Account</span>
                                {earningsData.bankDetails.accountNumber ? (
                                    <div className="flex flex-col gap-1 pt-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold tracking-tight text-white line-clamp-1">{earningsData.bankDetails.bankName}</span>
                                            <button 
                                                onClick={() => setIsEditBankModalOpen(true)}
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                                                title="Edit Payout Details"
                                            >
                                                <Settings size={12} />
                                            </button>
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-400/60 font-bold tracking-widest uppercase">
                                            ****{earningsData.bankDetails.accountNumber.slice(-4)}
                                        </span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditBankModalOpen(true)}
                                        className="mt-2 w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all border-dashed"
                                    >
                                        <Plus size={14} /> Add Bank Details
                                    </button>
                                )}
                         </div>
                         <div className="flex items-center justify-between relative z-10">
                                <span className={`text-[9px] font-sans font-semibold  tracking-widest uppercase italic ${earningsData.bankDetails.accountNumber ? 'text-white/20' : 'text-rose-500/60 animate-pulse'}`}>
                                    {earningsData.bankDetails.accountNumber ? 'Destination Active' : 'Action Required'}
                                </span>
                                <Landmark size={14} className={earningsData.bankDetails.accountNumber ? "text-emerald-400/40" : "text-rose-500/40"} />
                         </div>
                    </div>
                </div>

                {/* History Section with Tabs */}
                <div className="space-y-6 text-left">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-4 text-white/85 group">
                               <TrendingUp size={20} className="text-emerald-400" />
                               <h2 className="text-[11px] font-sans font-semibold  tracking-[0.5em] text-left text-white/85">Financial Records</h2>
                          </div>

                          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 self-start">
                                <button 
                                    onClick={() => setActiveHistoryTab("sessions")}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-semibold  tracking-widest transition-all ${activeHistoryTab === 'sessions' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/85 hover:text-white/85'}`}
                                >
                                    Consultations
                                </button>
                                <button 
                                    onClick={() => setActiveHistoryTab("payouts")}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-semibold  tracking-widest transition-all ${activeHistoryTab === 'payouts' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/85 hover:text-white/85'}`}
                                >
                                    Payout History
                                </button>
                          </div>
                     </div>

                     <div className="space-y-4">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-16 w-full bg-white/2 rounded-xl animate-pulse"></div>
                            ))
                        ) : (
                            activeHistoryTab === 'sessions' ? (
                                earningsData.transactions.length > 0 ? earningsData.transactions.map((tx) => {
                                    const netEarned = (tx.totalAmount || 0) * (1 - (earningsData.commissionRate / 100));
                                    return (
                                        <div key={tx.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between group/tx hover:bg-white/5 transition-all relative overflow-hidden">
                                            <div className="flex items-center gap-4 text-left relative z-10">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/85 group-hover/tx:text-emerald-400 transition-all duration-700">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-light  tracking-tight group-hover/tx:text-white transition-colors">Consultation with {tx.user?.name || "Nameless Soul"}</span>
                                                    <span className="text-[10px] font-sans font-semibold text-white/85 group-hover/tx:text-emerald-400 transition-colors  tracking-[0.2em] mt-0.5 italic">{new Date(tx.createdAt).toLocaleString()} • {tx.totalMinutes} mins</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="flex flex-col text-right">
                                                    <span className="text-lg font-semibold italic tracking-tighter text-white/85 group-hover/tx:text-emerald-400 transition-colors">₹{netEarned.toFixed(1)}</span>
                                                    <span className="text-[9px] font-sans font-semibold text-white/5  tracking-widest mt-0.5">Net Credit</span>
                                                </div>
                                                <div className={`w-1 h-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)] ${tx.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-20 italic font-light tracking-widest italic font-sans  text-[10px]">No consultations found in the cosmic records.</div>
                                )
                            ) : (
                                earningsData.payouts.length > 0 ? earningsData.payouts.map((p) => (
                                    <div key={p.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between group/tx hover:bg-white/5 transition-all relative overflow-hidden">
                                        <div className="flex items-center gap-4 text-left relative z-10">
                                            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-700 ${p.status === 'COMPLETED' ? 'text-emerald-400' : p.status === 'FAILED' ? 'text-rose-500' : 'text-amber-400'}`}>
                                                <IndianRupee size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-light  tracking-tight group-hover/tx:text-white transition-colors">Payout Request</span>
                                                <span className="text-[10px] font-sans font-semibold text-white/85 group-hover/tx:text-white/85 transition-colors  tracking-[0.2em] mt-0.5 italic">{new Date(p.createdAt).toLocaleString()} • ID: {p.id.slice(0,8)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="flex flex-col text-right">
                                                <span className={`text-lg font-semibold italic tracking-tighter ${p.status === 'COMPLETED' ? 'text-emerald-400' : p.status === 'FAILED' ? 'text-rose-500' : 'text-amber-400'}`}>₹{p.amount.toFixed(0)}</span>
                                                <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest mt-0.5">{p.status}</span>
                                            </div>
                                            <div className={`w-1 h-1 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : p.status === 'FAILED' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]' : 'bg-amber-500 animate-pulse'}`}></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-20 italic font-light tracking-widest italic font-sans  text-[10px]">No energy transfers requested yet.</div>
                                )
                            )
                        )}
                     </div>
                </div>

                <div className="p-6 bg-white/2 border border-white/5 rounded-2xl text-center space-y-4 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                    <AlertCircle className="w-6 h-6 text-white/85 mx-auto group-hover:text-emerald-400 transition-colors duration-700" />
                    <p className="text-[10px] font-sans font-medium text-white/85 leading-relaxed  tracking-[0.2em] max-w-lg mx-auto italic text-center">
                        Payouts take 24-48 working hours to reflect in your bank account. Completed energy transfers are non-reversible.
                    </p>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isSubmitting && setIsWithdrawModalOpen(false)}></div>
                    <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-3xl text-left overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] -mr-20 -mt-20"></div>
                        
                        <div className="flex items-center justify-between mb-8">
                             <div className="space-y-1">
                                <h1 className="text-2xl font-semibold italic tracking-tighter text-white ">Withdraw <span className="text-emerald-400">Funds</span></h1>
                                <p className="text-[10px] font-sans font-semibold text-white/85  tracking-[0.2em] italic">Energy Liquidation Request</p>
                             </div>
                             <button 
                                type="button" 
                                onClick={() => setIsWithdrawModalOpen(false)} 
                                className="p-2 text-white/85 hover:text-white transition-colors cursor-pointer relative z-20"
                             >
                                <X size={20} />
                             </button>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-6">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-2 mb-2">
                                     <span className="text-[10px] font-sans font-semibold text-white/85  tracking-widest">Available Credit</span>
                                     <span className="text-emerald-400 font-semibold text-lg">₹{earningsData.available.toFixed(2)}</span>
                                </div>

                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/85 group-focus-within/input:text-emerald-500 transition-colors">
                                         <IndianRupee size={20} />
                                    </div>
                                    <input 
                                        type="number" 
                                        placeholder="Min ₹500"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 pl-14 pr-6 py-4 rounded-2xl text-white font-sans text-xl placeholder:text-white/85 focus:outline-hidden focus:border-emerald-500/50 transition-all font-semibold"
                                        required
                                        min="500"
                                        max={earningsData.available}
                                    />
                                </div>
                            </div>

                            {/* Masked Settlement Info */}
                            <div className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-3">
                                <div className="flex items-center gap-3">
                                     <Landmark size={14} className="text-white/85" />
                                     <span className="text-[9px] font-sans font-semibold text-white/85  tracking-widest">Settlement Destination</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                         <span className="text-[10px] font-sans font-semibold text-white/85 ">{earningsData.bankDetails.bankName}</span>
                                         <span className="text-[10px] font-sans font-medium text-white/85 tracking-wider">
                                            {earningsData.bankDetails.accountNumber ? `****${earningsData.bankDetails.accountNumber.slice(-4)}` : "No Account Set"}
                                         </span>
                                    </div>
                                    {earningsData.bankDetails.upiId !== "Not Set" && (
                                        <div className="flex items-center justify-between">
                                             <span className="text-[10px] font-sans font-semibold text-white/85  tracking-tighter">UPI VPA</span>
                                             <span className="text-[10px] font-sans font-medium text-emerald-400/40">{earningsData.bankDetails.upiId}</span>
                                        </div>
                                    )}
                                </div>
                                {!earningsData.bankDetails.accountNumber && (
                                    <div className="pt-2 border-t border-white/5">
                                         <p className="text-[8px] text-rose-500 font-semibold  tracking-widest italic animate-pulse">⚠️ Please update bank details in profile first</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-[20px]"></div>
                                 <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                 <p className="text-[9px] font-sans font-medium text-emerald-400/80 leading-relaxed  tracking-wider italic relative z-10">
                                    Authorized Energy Liquidation Profile Active. Funds will reflect in 48 working hours.
                                 </p>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting || !earningsData.bankDetails.accountNumber}
                                className={`w-full py-6 bg-emerald-600 shadow-3xl shadow-emerald-600/30 text-white rounded-full font-sans font-semibold text-[11px]  tracking-[0.4em] hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all ${isSubmitting || !earningsData.bankDetails.accountNumber ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                {isSubmitting ? 'Channeling Energy...' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Update Bank Modal */}
            {isEditBankModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isSubmitting && setIsEditBankModalOpen(false)}></div>
                    <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-3xl text-left overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                             <div className="space-y-1">
                                <h1 className="text-2xl font-semibold italic tracking-tighter text-white ">Payout <span className="text-emerald-400">Settings</span></h1>
                                <p className="text-[10px] font-sans font-semibold text-white/85  tracking-[0.2em] italic uppercase">Settlement Destination</p>
                             </div>
                             <button onClick={() => setIsEditBankModalOpen(false)} className="p-2 text-white/85 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUpdateBankDetails} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 ml-1">Bank Name</label>
                                <input 
                                    value={editBankData.bankName}
                                    onChange={(e) => setEditBankData({...editBankData, bankName: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50"
                                    placeholder="e.g. HDFC Bank"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 ml-1">Account Number</label>
                                    <input 
                                        value={editBankData.accountNumber}
                                        onChange={(e) => setEditBankData({...editBankData, accountNumber: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 font-mono"
                                        placeholder="Acc No"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 ml-1">IFSC Code</label>
                                    <input 
                                        value={editBankData.ifscCode}
                                        onChange={(e) => setEditBankData({...editBankData, ifscCode: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 font-mono"
                                        placeholder="IFSC"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 ml-1">UPI ID (Optional)</label>
                                <input 
                                    value={editBankData.upiId}
                                    onChange={(e) => setEditBankData({...editBankData, upiId: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 px-5 py-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50"
                                    placeholder="expert@upi"
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-[10px]  tracking-[0.4em] uppercase hover:bg-emerald-500 transition-all mt-4 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Updating...' : 'Save Payment Details'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </ExpertLayout>
    );
};

export default ExpertEarnings;
