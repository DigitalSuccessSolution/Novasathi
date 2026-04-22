import React, { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, ArrowUpRight, ArrowDownLeft, Download, Loader2 } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Transaction History — Financial Ledger
 */
const AdminFinances = () => {
    const { api } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [financeStats, setFinanceStats] = useState([
        { label: "Total Recharged", value: "...", icon: ArrowUpRight, color: "text-emerald-400" },
        { label: "Total Usage", value: "...", icon: ArrowDownLeft, color: "text-rose-400" },
        { label: "Net Movement", value: "...", icon: TrendingUp, color: "text-purple-400" }
    ]);

    useEffect(() => {
        const fetchFinances = async () => {
            try {
                setLoading(true);
                const res = await api.get("/admin/transactions");
                const { transactions: txData, stats } = res.data.data;
                setTransactions(txData);
                setFinanceStats([
                    { label: "Total Transactions", value: stats._count.id.toString(), icon: ArrowUpRight, color: "text-emerald-400" },
                    { label: "Total Volume", value: `₹${stats._sum.amount || 0}`, icon: ArrowDownLeft, color: "text-rose-400" },
                    { label: "Net Movement", value: `₹${stats._sum.amount || 0}`, icon: TrendingUp, color: "text-purple-400" }
                ]);
            } catch (err) {
                console.error("🌌 [FINANCE_ERROR]", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinances();
    }, [api]);

    return (
        <AdminLayout>
            <div className="space-y-6 text-left">
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 group text-left">
                    <div className="flex items-center gap-4 text-white/85 group-hover:text-white transition-colors text-left">
                        <IndianRupee size={20} className="text-emerald-400" />
                        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">Transaction History</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-lg flex items-center gap-3 text-[9px] font-sans font-semibold tracking-widest text-white/85 hover:bg-white/10 hover:text-white transition-all">
                            <Download size={14} /> Export Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {financeStats.map((stat) => (
                        <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col gap-2 group hover:bg-white/5 transition-all text-left">
                            <div className="flex items-center justify-between text-white/85 group-hover:text-white transition-colors text-left">
                                <span className="text-[9px] font-sans font-semibold tracking-widest uppercase">{stat.label}</span>
                                <stat.icon size={14} className={stat.color} />
                            </div>
                            <div className="text-xl font-semibold tracking-tight">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Desktop Data Grid */}
                <div className="hidden md:block w-full overflow-hidden bg-[#121212] border border-white/10 rounded-lg shadow-2xl">
                    <div className="max-h-[60vh] overflow-y-auto overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm text-left font-sans">
                            <thead className="sticky top-0 z-10 bg-[#121212] border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-6 py-4">Transaction ID</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 size={32} className="text-emerald-500 animate-spin" />
                                                <span className="text-[10px] font-sans font-semibold tracking-[0.5em] text-white/40 uppercase italic">
                                                    Loading Ledger...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.5em] text-white/20 uppercase italic">
                                            No recent transactions
                                        </td>
                                    </tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-white/50 font-mono italic">{tx.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white/90">{tx.wallet?.user?.name || "Anonymous User"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                tx.type === 'RECHARGE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                            }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white/70 font-medium">
                                            <span className="font-bold text-sm">₹{tx.amount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs text-white/50 italic">{typeof tx.createdAt === 'string' ? new Date(tx.createdAt).toLocaleDateString() : tx.date}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Transaction Stack */}
                <div className="md:hidden max-h-[70vh] overflow-y-auto scrollbar-hide space-y-4 text-left p-1">
                    {loading ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                            <Loader2 size={28} className="text-emerald-500 animate-spin" />
                            <span className="text-[10px] font-sans font-semibold tracking-[0.4em] text-white/40 uppercase italic">Loading...</span>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-20 text-center text-[10px] font-sans font-semibold tracking-[0.4em] text-white/20 uppercase italic">No transactions</div>
                    ) : transactions.map((tx) => (
                        <div key={tx.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 group active:scale-[0.98] transition-all text-left">
                            <div className="flex items-center justify-between text-left">
                                <span className="text-[7px] font-sans font-semibold text-white/85 tracking-widest italic">{tx.id}</span>
                                <span className="text-[7px] font-sans font-semibold text-white/40 tracking-widest italic">{typeof tx.createdAt === 'string' ? new Date(tx.createdAt).toLocaleDateString() : tx.date}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 text-left">
                                <span className="text-xs font-light text-white tracking-tight">{tx.wallet?.user?.name || "Anonymous"}</span>
                                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-sans font-semibold tracking-widest border ${tx.type === 'RECHARGE' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-purple-500/20 text-purple-400 bg-purple-500/5'} italic`}>
                                    {tx.type}
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-left">
                                <span className="text-[7px] font-sans font-semibold text-white/85 tracking-widest uppercase">Amount</span>
                                <span className={`text-lg font-semibold ${tx.type === 'RECHARGE' ? 'text-emerald-400' : 'text-white'} font-sans`}>₹{tx.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFinances;
