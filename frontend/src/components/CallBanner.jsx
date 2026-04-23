import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Maximize2 } from 'lucide-react';
import { useCall } from '../context/CallContext';
import { formatTime } from '../utils/formatTime';

const CallBanner = () => {
  const { 
    callActive, 
    isMinimized, 
    partnerInfo, 
    timeLeft, 
    isMuted, 
    toggleMute, 
    endCall, 
    setIsMinimized,
    callType
  } = useCall();



  if (!callActive || !isMinimized) return null;

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className="fixed top-0 left-0 right-0 z-[50] px-4 py-3"
    >
      <div className="max-w-xl mx-auto bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden shadow-lg">
            {partnerInfo.avatar ? (
              <img src={partnerInfo.avatar} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-semibold text-white ">
                {partnerInfo.name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-white leading-tight">{partnerInfo.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${callType === 'video' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <span className="text-[10px] text-gray-400  tracking-widest font-semibold">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMute}
            className={`p-2.5 rounded-xl transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all"
          >
            <Maximize2 size={18} />
          </button>

          <button 
            onClick={() => endCall(true)}
            className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-400 transition-colors"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CallBanner;
