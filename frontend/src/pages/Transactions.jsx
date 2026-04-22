import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  CreditCard,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Filter,
  Download
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

const Transactions = () => {
  const { api, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL"); // ALL, RECHARGE, DEDUCTION

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get("/wallet/transactions?limit=100");
      setHistory(res.data.data.transactions || []);
    } catch (err) {
      console.error("🌌 [HISTORY_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (history.length === 0) return;
    
    const headers = ["ID", "Type", "Amount", "Description", "Status", "Date"];
    const rows = history.map(item => [
      item.id,
      item.type,
      item.amount,
      item.description || "Celestial Transaction",
      item.status,
      format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Transactions_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (type) => {
    if (type === "RECHARGE") return CreditCard;
    if (type === "DEDUCTION") return MessageSquare;
    return History;
  };

  const getColor = (type) => {
    if (type === "RECHARGE") return "text-emerald-400";
    if (type === "DEDUCTION") return "text-violet-400";
    return "text-gray-400";
  };

  const filteredHistory = history.filter(item => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Financial Ledger</h1>
            <p className="text-[10px]  tracking-widest text-white/70 mt-1 font-semibold">Trace your cosmic energy flow and exchanges</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-white/5 rounded-lg border border-white/5 p-1">
                {["ALL", "RECHARGE", "DEDUCTION"].map((t) => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-semibold  tracking-widest transition-all ${
                        filterType === t 
                        ? "bg-purple-600/20 text-purple-400" 
                        : "text-gray-600 hover:text-white"
                    }`}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
             </div>
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-semibold  tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
             >
               <Download size={14} /> Export CSV
             </button>
          </div>
        </header>

        <div className="space-y-2">
          {loading ? (
             <div className="py-20 text-center opacity-20 italic font-light tracking-widest text-xs  text-white">Traversing the Ledger...</div>
          ) : (
            filteredHistory.map((item, index) => {
              const Icon = getIcon(item.type);
              const colorClass = getColor(item.type);
              const isDebit = item.type === "DEDUCTION";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-purple-500/20 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 ${isDebit ? 'bg-red-500/10' : 'bg-emerald-500/10'} rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-200  tracking-wider group-hover:text-white transition-colors">
                        {item.description || (isDebit ? "Sacred Ritual Exchange" : "Celestial Refill")}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[8px] text-gray-600 font-semibold  tracking-widest">
                          {format(new Date(item.createdAt || Date.now()), "dd MMM yyyy • hh:mm a")}
                        </p>
                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-semibold  tracking-[0.2em] ${
                            item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                            {item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 px-2">
                    <div className={`text-[15px] font-semibold tracking-tighter flex items-center gap-1 ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isDebit ? "-" : "+"}₹{item.amount?.toFixed(0)}
                    </div>
                    <p className={`text-[8px] font-semibold  tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        isDebit ? 'border-red-500/20 text-red-400/40' : 'border-emerald-500/20 text-emerald-400/40'
                    }`}>
                        {item.type}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          {!loading && filteredHistory.length === 0 && (
              <div className="py-20 text-center opacity-30 italic font-light tracking-widest text-[10px]  text-white">No cosmic footprints found in this alignment</div>
          )}
        </div>

        {/* Empty State / End */}
        <div className="pt-12 text-center pb-10">
          <p className="text-[10px]  tracking-[0.5em] text-white/5 font-semibold italic">
            End of Records • Celestial Ledger Secured
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
