import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

const VideoCallOverlay = ({ 
    partner, 
    status, 
    formatTime, 
    isMuted, 
    toggleMute, 
    isVideoOff, 
    toggleVideo, 
    onEnd,
    localVideoRef,
    remoteVideoRef,
    remoteStream,
    connectionState,
    setIsMinimized,
    userRole = 'USER',
    isExpertPage = false,
    partnerMuted = false,
    partnerVideoOff = false
}) => {
  const { timeLeft, elapsedTime, sessionEarnings } = useSelector(state => state.call);
  const { user } = useAuth();
  const liveBalance = user?.wallet?.balance || 0;

  const isExpert = userRole === 'EXPERT' && isExpertPage;
  const containerRef = React.useRef(null);
  const [isZoomed, setIsZoomed] = React.useState(true);

  React.useEffect(() => {
    console.log("🎭 [VIDEO_OVERLAY] Mounted/Updated:", { isExpert, userRole, isExpertPage, partnerName: partner?.name });
  }, [isExpert, userRole, isExpertPage, partner?.name]);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[9999] bg-[#0b0d1a] flex flex-col justify-between overflow-hidden transition-all duration-500"
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
      {/* Remote Video Feed (Full Screen) */}
      <div className="absolute inset-0 z-0 bg-gray-950">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full transition-all duration-500 ${isZoomed ? 'object-cover' : 'object-contain'} ${!remoteStream ? 'opacity-0' : 'opacity-100'}`}
          />
          {/* Partner Status Indicators */}
          {(partnerVideoOff || partnerMuted) && remoteStream && (
              <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                  {partnerVideoOff && (
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <VideoOff size={14} className="text-red-400" />
                          <span className="text-[10px] font-semibold text-white/90">Camera Off</span>
                      </div>
                  )}
                  {partnerMuted && (
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <MicOff size={14} className="text-red-400" />
                          <span className="text-[10px] font-semibold text-white/90">Muted</span>
                      </div>
                  )}
              </div>
          )}

          {/* Fallback if no remote stream or partner video off */}
          {(!remoteStream || partnerVideoOff) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl transition-opacity duration-500">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10 mb-4 shadow-2xl">
                {partner.avatar ? (
                    <img 
                        src={partner.avatar} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-4xl font-semibold text-white">
                        {partner.name?.charAt(0)}
                    </div>
                )}
              </div>
              <h3 className="text-xl font-semibold">{partner.name}</h3>
              <p className="text-[10px] text-purple-400 font-semibold  tracking-[0.2em] animate-pulse mt-2 px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  {!remoteStream ? (
                      connectionState === 'connecting' ? "Aligning Frequencies..." : 
                      connectionState === 'checking' ? "Verifying Cosmic Link..." :
                      connectionState === 'connected' ? "Sanctified Connection" :
                      connectionState === 'failed' ? "Connection Severed" :
                      "Initializing Sanctuary..."
                  ) : "Video Paused"}
              </p>
              </div>
          )}
      </div>

      {/* Local Preview (PIP) */}
      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ touchAction: 'none' }}
        className="absolute bottom-32 right-4 sm:bottom-36 sm:right-6 z-50 w-24 h-36 sm:w-32 sm:h-44 bg-black rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden cursor-grab active:cursor-grabbing"
      >
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover mirror ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <VideoOff size={20} className="text-gray-600" />
              </div>
          )}
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-md border border-white/5">
              <span className="text-[7px] font-semibold text-white  tracking-tighter">You</span>
          </div>
      </motion.div>

      <div className="relative z-10 w-full p-4 pb-6 flex flex-col items-center mb-6">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-between gap-3 sm:gap-6 shadow-[0_30px_100_rgba(0,0,0,0.5)] max-w-lg">
              <div className="flex flex-col items-center pl-4 pr-2 border-r border-white/10">
                  <span className="text-[7px] text-white/70 font-semibold tracking-widest  mb-0.5 whitespace-nowrap">Session Time</span>
                  <span className="text-lg font-mono text-white tracking-widest leading-none">
                    {formatTime(elapsedTime)}
                  </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 ml-1">
                  <button 
                    onClick={toggleMute}
                    className={`p-3.5 rounded-full transition-all duration-300 active:scale-90 ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                      {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button 
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition-all duration-300 active:scale-90 ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                      {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="p-3.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95"
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

export default VideoCallOverlay;
