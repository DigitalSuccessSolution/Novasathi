import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet as WalletIcon, 
  CreditCard, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Wallet = () => {
  const { api, token, user, updateWalletBalance } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const fetchWallet = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get("/wallet");
      setWallet(res.data.data);
      if (res.data.data?.balance !== undefined) {
        updateWalletBalance(res.data.data.balance);
      }
    } catch (err) {
      console.error("🌌 [WALLET_FETCH_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!selectedPack || isProcessing) return;
    const pack = rechargePacks.find(p => p.id === selectedPack);
    
    try {
      setIsProcessing(true);
      
      // For development, we can offer a "Test Recharge" or actual Razorpay
      // If we are in dev, let's just use the test recharge API to save the user from setup
      if (import.meta.env.MODE === 'development') {
        const res = await api.post("/wallet/recharge-test");
        toast(res.data.message, "success");
        fetchWallet();
        return;
      }

      // Real Recharge Flow
      const orderRes = await api.post("/wallet/recharge", { amount: pack.amount });
      const { orderId, amount, currency, key } = orderRes.data.data;

      const options = {
        key: key || "rzp_test_placeholder", 
        amount: amount * 100,
        currency,
        name: "NovaSathi Sanctuary",
        description: `Wallet recharge: ₹${pack.amount}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/wallet/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            toast("Balance infused successfully!", "success");
            fetchWallet();
          } catch (err) {
            toast("Payment verification failed", "error");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: { color: "#EAB308" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast(err.response?.data?.message || "Checkout alignment failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const rechargePacks = [
    { id: 1, amount: 200, bonus: 20, popular: false },
    { id: 2, amount: 500, bonus: 75, popular: true },
    { id: 3, amount: 1000, bonus: 200, popular: false },
    { id: 4, amount: 2000, bonus: 500, popular: false },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Cosmic Wallet</h1>
            <p className="text-[10px]  tracking-widest text-white/70 mt-1 font-semibold">Manage your celestial credits and balance</p>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold text-white/85  tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <ShieldCheck size={12} className="text-green-500/50" /> Secure Encryption
          </div>
        </header>

        {/* Compact Balance Card */}
        <div className="relative group overflow-hidden bg-[#0d0e14] border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-yellow-400/40  tracking-[0.3em] font-semibold text-[9px]">
                <WalletIcon size={12} /> Balance Available
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
                ₹{wallet?.balance?.toFixed(0) || "0"}<span className="text-2xl text-white/85">.{(wallet?.balance % 1).toFixed(2).substring(2)}</span>
              </h2>
              <p className="text-gray-600 font-semibold text-[10px]  tracking-widest">Account ID: {user?.id?.substring(0, 8)}</p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-center justify-center py-5 px-8 bg-white/3 border border-white/5 rounded-2xl backdrop-blur-xl">
              <div className="text-[9px]  tracking-[0.2em] text-white/70 mb-1 font-semibold">Total Spent</div>
              <div className="text-xl font-semibold text-white/85">₹{wallet?.totalSpent?.toFixed(2) || "0.00"}</div>
            </div>
          </div>
        </div>

        {/* Compact Recharge Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500/70" />
            <h3 className="text-sm font-semibold  tracking-widest text-white/85">Top-up Options</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rechargePacks.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedPack(pack.id)}
                className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group ${
                  selectedPack === pack.id 
                  ? "bg-yellow-500/5 border-yellow-500/50 shadow-lg" 
                  : "bg-white/3 border-white/5 hover:border-white/20"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500/80 rounded-md text-black text-[8px] font-semibold  tracking-widest">
                    Best Value
                  </div>
                )}
                <div className="text-2xl font-semibold text-white mb-1">₹{pack.amount}</div>
                <div className="text-[8px] text-green-400 font-semibold  tracking-widest">+₹{pack.bonus} Credit</div>
                
                <div className={`mt-4 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  selectedPack === pack.id 
                  ? "bg-yellow-500 text-black" 
                  : "bg-white/80 text-black"
                }`}>
                  <Plus size={12} />
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedPack && (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="mt-8"
              >
                <button 
                  onClick={handleRecharge}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-linear-to-r from-yellow-500 to-orange-600 text-white font-semibold text-[10px] tracking-widest  shadow-lg shadow-orange-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {isProcessing ? "Processing..." : `Infuse ₹${rechargePacks.find(p => p.id === selectedPack).amount} Credits`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Developer Test Utility */}
          {import.meta.env.MODE === 'development' && (
            <div className="mt-20 pt-10 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                <h4 className="text-[10px] font-semibold  tracking-[0.3em] text-rose-500/80">Celestial Nexus Debug Tools</h4>
              </div>
              <button 
                onClick={async () => {
                   try {
                     setIsProcessing(true);
                     const res = await api.post("/wallet/recharge-test");
                     toast("Cosmic energy infused: " + res.data.message, "success");
                     fetchWallet();
                   } catch (err) {
                     toast("Nexus connection failed", "error");
                   } finally {
                     setIsProcessing(false);
                   }
                }}
                disabled={isProcessing}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[#0d0e14] border border-rose-500/10 hover:border-rose-500/30 transition-all w-full md:w-auto"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Plus size={16} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-semibold text-white/85 ">Add ₹500 Test Credit</div>
                  <p className="text-[8px] text-gray-600 font-semibold  tracking-widest mt-0.5">Bypass payment gateway for local testing</p>
                </div>
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;
