import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  ShieldCheck,
  Maximize2 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

const VoiceCallOverlay = ({ 
    partner, 
    status, 
    formatTime, 
    isMuted, 
    toggleMute, 
    onEnd,
    remoteStream,
    connectionState,
    setIsMinimized,
    userRole = 'USER',
    isExpertPage = false,
    partnerMuted = false
}) => {
  const isExpert = userRole === 'EXPERT' && isExpertPage;

  React.useEffect(() => {
    console.log("🎭 [VOICE_OVERLAY] Mounted/Updated:", { isExpert, userRole, isExpertPage, partnerName: partner?.name });
  }, [isExpert, userRole, isExpertPage, partner?.name]);

    const { timeLeft, elapsedTime, callActive, callType, sessionEarnings } = useSelector(state => state.call);
    const { user } = useAuth();
    const liveBalance = user?.wallet?.balance || 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-[#0b0d1a] flex flex-col items-center justify-between pt-24 pb-8 px-6 transition-all duration-500"
        >
            {/* Top Bar for Balance/Earnings */}
            <div className="absolute top-8 right-8 z-20">
                {user?.role === 'USER' ? (
                    <div className="flex flex-col items-end px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md shadow-lg group transition-all hover:bg-emerald-500/20">
                        <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mb-0.5">Wallet Balance</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono tracking-wider">₹{liveBalance.toFixed(0)}</span>
                    </div>
                ) : user?.role === 'EXPERT' ? (
                    <div className="flex flex-col items-end px-5 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md shadow-lg group transition-all hover:bg-purple-500/20">
                        <span className="text-[9px] font-bold text-purple-400/60 uppercase tracking-[0.2em] mb-0.5">Session Earnings</span>
                        <span className="text-xl font-bold text-purple-300 font-mono tracking-wider">₹{sessionEarnings.toFixed(0)}</span>
                    </div>
                ) : null}
            </div>

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 text-center">
                <div className="mb-8" />
                <h2 className="text-4xl font-semibold tracking-tight mb-2">{partner.name}</h2>
                <p className="text-purple-400 font-semibold  tracking-[0.2em] text-[10px] animate-pulse px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    {connectionState === 'connecting' ? "Aligning Frequencies..." : 
                     connectionState === 'checking' ? "Verifying Cosmic Link..." :
                     connectionState === 'connected' ? "Sanctified Connection" :
                     connectionState === 'failed' ? "Connection Severed" :
                     "Initializing Sanctuary..."}
                </p>
            </div>

            <div className="relative z-10">
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping shadow-[0_0_50px_rgba(168,85,247,0.2)]" />
                    <div className="relative w-full h-full rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-purple-900/40 to-black/40 p-1 backdrop-blur-3xl shadow-2xl">
                        {partner.avatar ? (
                            <img 
                                src={partner.avatar} 
                                className={`w-full h-full rounded-full object-cover transition-all duration-1000 ${!remoteStream || partnerMuted ? 'opacity-50 grayscale' : 'opacity-100'}`} 
                                onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-6xl font-semibold text-white">
                                {partner.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    
                    {/* Partner Mute Indicator */}
                    {partnerMuted && (
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 bg-red-500 text-white p-2 rounded-full border-4 border-[#0b0d1a] shadow-xl"
                        >
                            <MicOff size={16} />
                        </motion.div>
                    )}
                </div>
            </div>
            
            <div className="relative z-10 w-full p-4 pb-4 flex flex-col items-center mb-4">
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl">
                    <div className="flex flex-col items-center pl-4 pr-2">
                        <span className="text-[8px] text-white/70 font-semibold tracking-widest  mb-1">Ritual Time</span>
                        <span className="text-lg font-mono text-white tracking-widest leading-none">
                            {formatTime(elapsedTime)}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-1" />

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleMute}
                            className={`p-3.5 rounded-full transition-all duration-300 ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="p-3.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95"
                    title="Minimize Call"
                  >
                      <Maximize2 size={18} className="rotate-180" />
                  </button>

                  <button 
                    onClick={onEnd}
                    className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-2xl shadow-red-500/50 hover:scale-110 active:scale-90 transition-all group overflow-hidden relative ml-1"
                  >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <PhoneOff size={22} className="relative z-10" />
                  </button>
              </div>
          </div>
      </div>
    </motion.div>
  );
};

export default VoiceCallOverlay;
