import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LoginSidebar = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, verifyOtp } = useAuth();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return toast("Enter a valid 10-digit number", "error");
    
    try {
      setLoading(true);
      await login(cleanPhone);
      setStep("otp");
      setTimer(30);
      toast("OTP sent! Check your terminal console.", "success");
    } catch (err) {
      toast("Error sending OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast("Enter 6-digit OTP", "error");

    try {
      setLoading(true);
      await verifyOtp(phone.replace(/\D/g, ''), otp);
      toast("Logged In Successfully", "success");
      setIsLoginModalOpen(false);
      resetFlow();
    } catch (err) {
      toast("Invalid OTP code", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("phone"); setPhone(""); setOtp("");
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsLoginModalOpen(false)}
            className="fixed inset-0 bg-black/60 z-[1000] backdrop-blur-sm"
          />

          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-[#0f1115] z-[1001] shadow-2xl flex flex-col p-8 text-white border-l border-white/5"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold tracking-tight">Login or Signup</h2>
              <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1">
              <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="space-y-6">
                {step === 'phone' ? (
                  <div className="space-y-5">
                    <p className="text-white/40 text-sm">Enter your phone number to continue</p>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold ml-1">Mobile Number</label>
                        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                          <span className="flex items-center px-4 bg-white/5 text-slate-400 font-bold border-r border-white/10 text-sm">+91</span>
                          <input 
                            autoFocus type="tel" value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="00000 00000"
                            className="flex-1 py-3 px-4 bg-transparent outline-none text-white text-lg tracking-wider"
                          />
                        </div>
                    </div>

                    <button 
                      type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center shadow-lg uppercase text-xs tracking-widest font-black"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : "Send OTP"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button type="button" onClick={() => setStep('phone')} className="flex items-center text-indigo-400 text-xs font-bold hover:text-indigo-300">
                      <ArrowLeft size={16} className="mr-2" /> Back
                    </button>
                    
                    <div className="space-y-5 text-center">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white/90">Verification</h3>
                            <p className="text-white/40 text-xs">Code sent to +91 {phone}</p>
                        </div>
                        
                        <input 
                          autoFocus type="text" value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="0 0 0 0 0 0"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 text-center text-3xl font-bold tracking-[0.2em] outline-none focus:border-indigo-500 transition-all"
                        />

                        <button type="submit" disabled={loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl transition-all flex justify-center items-center uppercase text-xs tracking-widest font-black"
                        >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify OTP"}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                       {timer > 0 ? (
                         <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Retry in {timer}s</span>
                       ) : (
                         <button type="button" onClick={handleSendOtp} className="text-indigo-400 text-xs font-bold underline">Resend Code</button>
                       )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="mt-auto py-6 text-center border-t border-white/5">
               <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold font-black italic">NovaSathi Security Hub</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginSidebar;
