import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '../context/CallContext';
import VoiceCallOverlay from './VoiceCallOverlay';
import VideoCallOverlay from './VideoCallOverlay';
import CallBanner from './CallBanner';

const CallManager = () => {
  const {
    localStream,
    remoteStream,
    callActive,
    isCalling,
    incomingCall,
    callType,
    timeLeft,
    isMuted,
    isVideoOff,
    isMinimized,
    partnerInfo,
    respondToCall,
    endCall,
    toggleMute,
    toggleVideo,
    setIsMinimized,
    connectionState
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Format time (re-implemented here for standalone use)
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (callActive && callType === 'video' && localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    if (callActive && remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [callActive, callType, localStream, remoteStream]);

  return (
    <>
    <CallBanner />
    
    <AnimatePresence>
      {/* Active Overlays */}
      {callActive && !isMinimized && callType === 'voice' && (
        <VoiceCallOverlay 
            partner={partnerInfo}
            status="In Session"
            timeLeft={timeLeft}
            formatTime={formatTime}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onEnd={() => endCall(true)}
            remoteStream={remoteStream}
            setIsMinimized={setIsMinimized}
            connectionState={connectionState}
        />
      )}

      {callActive && !isMinimized && callType === 'video' && (
        <VideoCallOverlay 
            partner={partnerInfo}
            status="In Session"
            timeLeft={timeLeft}
            formatTime={formatTime}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            onEnd={() => endCall(true)}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            remoteStream={remoteStream}
            setIsMinimized={setIsMinimized}
            connectionState={connectionState}
        />
      )}

      {/* Incoming / Outgoing Phase */}
      {(isCalling || (incomingCall && !callActive)) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[9999] bg-[#0b0d1a] flex flex-col items-center justify-center p-6"
        >
          {/* Audio Ringtone Support */}
          <audio 
            autoPlay 
            loop 
            src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3" 
            ref={(el) => {
                if (el) {
                    el.volume = 0.5;
                    if (incomingCall && !callActive) el.play().catch(() => {});
                    else el.pause();
                }
            }}
          />

          <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full animate-pulse" />
          </div>

          <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-44 h-44 mb-10 relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping shadow-[0_0_100px_rgba(168,85,247,0.3)]" />
                  <div className="absolute inset-[-20px] border border-purple-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                  <div className="relative w-full h-full rounded-full border-2 border-white/10 overflow-hidden shadow-2xl bg-black">
                    {partnerInfo.avatar ? (
                        <img 
                            src={partnerInfo.avatar} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = ""; // Force fallback to initials
                                // Trigger a re-render or state update locally if needed, 
                                // but for now, we'll just let the condition handle it if possible.
                                // Actually, better to use a local state for image error.
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-7xl font-semibold text-white ">
                            {partnerInfo.name?.charAt(0)}
                        </div>
                    )}
                  </div>
              </div>
              
              <h2 className="text-4xl font-semibold mb-3 tracking-tight">{partnerInfo.name}</h2>
              <p className="text-purple-400 font-semibold  tracking-[0.5em] text-[12px] animate-pulse">
                  {isCalling ? `Initiating Ritual...` : `Incoming ${callType} Consultation`}
              </p>

              {partnerInfo.intakeData?.concern && !isCalling && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 max-w-lg bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
                >
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-2 text-center">Seeker's Primary Concern</p>
                    <p className="text-xl text-purple-200/90 font-light italic leading-relaxed text-center">
                        "{partnerInfo.intakeData.concern}"
                    </p>
                </motion.div>
              )}

              <div className="mt-20 flex items-center gap-20">
                  {!isCalling && (
                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => respondToCall(true)}
                        className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:bg-emerald-400 transition-colors"
                      >
                        <Phone size={36} fill="white" className="animate-bounce" />
                      </motion.button>
                  )}
                  
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isCalling ? endCall(true) : respondToCall(false)}
                    className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 hover:bg-red-400 transition-colors"
                  >
                     <PhoneOff size={36} fill="white" />
                  </motion.button>
              </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default CallManager;
