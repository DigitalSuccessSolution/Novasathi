import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import socket from '../lib/socket';
import store from '../store';
import { useAuth } from './AuthContext';
import { updateWalletBalance } from '../store/slices/authSlice';
import {
  setCallActive,
  setIsCalling,
  setIncomingCall,
  setCallType,
  setActiveSessionId,
  setTimeLeft,
  setIsMuted,
  setIsVideoOff,
  setIsMinimized,
  setPartnerInfo,
  setConnectionState,
  setPartnerVideoOff,
  setPendingInitiation,
  setSessionEarnings,
  setElapsedTime,
  resetCallState
} from '../store/slices/callSlice';

const CallContext = createContext();

// Production ICE servers (STUN + free TURN fallback)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject"
  }
];

const VIDEO_CONSTRAINTS = {
  width: { ideal: 640, max: 1280 },
  height: { ideal: 480, max: 720 },
  frameRate: { ideal: 24, max: 30 },
  facingMode: "user"
};

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000
};

export const CallProvider = ({ children }) => {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Non-serializable state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Serializable state
  const callState = useSelector(state => state.call);
  const chatState = useSelector(state => state.chat || {});

  // Mutable refs for WebRTC & Timers
  const peerConnection = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const timerInterval = useRef(null);
  const ringingTimeoutRef = useRef(null);
  const activeSessionRef = useRef(null);
  const ringtoneRef = useRef(null);
  const signalQueue = useRef(Promise.resolve()); // Sequential signal processing queue

  // Initialize ringtone
  useEffect(() => {
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    ringtoneRef.current.loop = true;
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  // Keep ref in sync for closures
  useEffect(() => { activeSessionRef.current = callState.activeSessionId; }, [callState.activeSessionId]);

  const cleanup = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = null;
    dispatch(setTimeLeft(null));
    dispatch(setIsMinimized(false));
    dispatch(setSessionEarnings(0));
    dispatch(setElapsedTime(0));

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    
    dispatch(resetCallState());
    
    iceCandidatesQueue.current = [];
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    ringingTimeoutRef.current = null;
  }, [localStream, dispatch]);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      sdpSemantics: 'unified-plan'
    });

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
      if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') cleanup();
        }, 15000);
      }
    };

    pc.onconnectionstatechange = () => {
      dispatch(setConnectionState(pc.connectionState));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && activeSessionRef.current) {
        socket.emit('webrtc_signal', { sessionId: activeSessionRef.current, signal: event.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        if (!activeSessionRef.current) return;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { sessionId: activeSessionRef.current, signal: offer });
      } catch (err) {
        console.error("❌ [NEGOTIATION_ERROR]", err);
      }
    };

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peerConnection.current = pc;
    return pc;
  }, [localStream, cleanup, dispatch]);

  useEffect(() => {
    if (peerConnection.current && localStream) {
      const senders = peerConnection.current.getSenders();
      localStream.getTracks().forEach(track => {
        if (!senders.find(s => s.track === track)) {
          peerConnection.current.addTrack(track, localStream);
        }
      });
    }
  }, [localStream]);

  // ─── Watch for Pending Initiations (Decoupled Start) ───
  useEffect(() => {
    if (callState.pendingInitiation && !callState.callActive && !callState.isCalling) {
        const { sessionId, type, partner } = callState.pendingInitiation;
        initiateCall(sessionId, type, partner);
        dispatch(setPendingInitiation(null)); // Clear it
    }
  }, [callState.pendingInitiation, callState.callActive, callState.isCalling, dispatch]);
  
  // ─── Automatic Ringtone Control ───
  const isRinging = !!(callState.incomingCall || chatState.pendingRitualRequest);

  useEffect(() => {
    if (!isRinging && ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [isRinging]);

  // ─── Socket Event Handlers ───
  useEffect(() => {
    if (!token) return;

    const handleIncoming = (data) => {
      // Guard: Prevent double call UI if already in a call or ringing
      const currentState = store.getState().call; // Using store directly to ensure latest state
      if (currentState.incomingCall || currentState.callActive) {
        console.warn("⚠️ [SOCKET] Ignoring second incoming call while busy.");
        return;
      }

      console.log("🔔 [INCOMING_CALL]", data);
      const normalizedType = data.type === 'call' ? 'voice' : data.type;
      dispatch(setIncomingCall({ ...data, type: normalizedType }));
      dispatch(setCallType(normalizedType));
      dispatch(setActiveSessionId(data.sessionId));
      
      // Start Ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current.play().catch(e => console.warn("Audio play blocked by browser:", e));
      }
      
      let avatarUrl = data.callerAvatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || '';
        avatarUrl = `${baseUrl}/${avatarUrl}`;
      }
      dispatch(setPartnerInfo({ 
        name: data.callerName || 'Unknown', 
        avatar: avatarUrl,
        intakeData: data.intakeData 
      }));

      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = setTimeout(() => respondToCall(false), 45000);
    };

    const handleSignal = ({ signal }) => {
      // Process signals sequentially to avoid WebRTC state machine race conditions
      signalQueue.current = signalQueue.current.then(async () => {
        const pc = createPeerConnection();
        try {
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            while (iceCandidatesQueue.current.length > 0) {
              await pc.addIceCandidate(iceCandidatesQueue.current.shift());
            }
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc_signal', { sessionId: activeSessionRef.current, signal: answer });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            while (iceCandidatesQueue.current.length > 0) {
              await pc.addIceCandidate(iceCandidatesQueue.current.shift());
            }
          } else if (signal.candidate) {
            const candidate = new RTCIceCandidate(signal);
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
            } else {
              iceCandidatesQueue.current.push(candidate);
            }
          }
        } catch (err) {
          console.error("❌ [SIGNAL_ERROR]", err);
        }
      }).catch(err => {
        console.error("❌ [SIGNAL_QUEUE_ERROR]", err);
      });
    };

    const handleAnswered = async (data) => {
      const currentState = store.getState().call;
      if (data.accepted) {
        if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
        if (ringtoneRef.current) ringtoneRef.current.pause();
        dispatch(setCallActive(true));
        dispatch(setIsCalling(false));

        // Navigate to chat room ONLY for chat sessions
        if (currentState.callType === 'chat') {
          const path = user?.role === 'EXPERT' ? `/expert-panel/chat/${data.sessionId}` : `/chat/${data.sessionId}`;
          navigate(path);
        }

        if (currentState.callType !== 'chat') {
          // Initiate WebRTC handshake as the caller
          const pc = createPeerConnection();
          if (data.signal && data.signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          }
        }
        
        startCountdown();
      } else {
        dispatch(setIsCalling(false));
        cleanup();
      }
    };

    const startCountdown = () => {
      if (timerInterval.current) return; // Already running
      console.log("⏱️ [TIMER] Starting per-second countdown/elapsed loop...");
      timerInterval.current = setInterval(() => {
        const { timeLeft, elapsedTime, callActive } = store.getState().call;
        if (!callActive) {
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
          }
          return;
        }

        // Always increment elapsed time
        dispatch(setElapsedTime(elapsedTime + 1));

        // Decrement time left if active
        if (timeLeft !== null) {
          dispatch(setTimeLeft(timeLeft > 0 ? timeLeft - 1 : 0));
        }
      }, 1000);
    };

    const handleSessionStarted = (data) => {
      console.log("⏱️ [TIMER] Session started event received:", data);
      if (data.timerSeconds !== undefined) {
        dispatch(setTimeLeft(data.timerSeconds));
        startCountdown();
      }
    };

    const handleBalanceUpdate = (data) => {
      console.log("💰 [BALANCE_UPDATE] Syncing time left:", data.timeLeftSeconds);
      if (data.newBalance !== undefined && user?.role === 'USER') {
        dispatch(updateWalletBalance(data.newBalance));
      }

      if (data.timeLeftSeconds !== undefined) {
        dispatch(setTimeLeft(data.timeLeftSeconds));
        startCountdown();
      }
    };

    const handleEarningsUpdate = (data) => {
      console.log("💎 [EARNINGS_UPDATE]", data);
      if (user?.role === 'EXPERT' && data.amount) {
        dispatch((dispatch, getState) => {
           const { sessionEarnings } = getState().call;
           dispatch(setSessionEarnings(sessionEarnings + data.amount));
        });
      }
    };

    socket.on('incoming_call', handleIncoming);
    socket.on('webrtc_signal', handleSignal);
    socket.on('call_answered', handleAnswered);
    socket.on('call_terminated', cleanup);
    socket.on('session_started', handleSessionStarted);
    socket.on('session_ended', cleanup);
    socket.on('force_disconnect', cleanup);
    socket.on('partner_disconnected', cleanup);
    socket.on('balance_update', handleBalanceUpdate);
    socket.on('earnings_update', handleEarningsUpdate);

    socket.on('call_state_update', (data) => {
      if (data.muted !== undefined) dispatch(setPartnerMuted(data.muted));
      if (data.videoOff !== undefined) dispatch(setPartnerVideoOff(data.videoOff));
    });

    return () => {
      socket.off('incoming_call', handleIncoming);
      socket.off('webrtc_signal', handleSignal);
      socket.off('call_answered', handleAnswered);
      socket.off('call_terminated', cleanup);
      socket.off('session_started', handleSessionStarted);
      socket.off('session_ended', cleanup);
      socket.off('force_disconnect', cleanup);
      socket.off('partner_disconnected', cleanup);
      socket.off('balance_update', handleBalanceUpdate);
      socket.off('earnings_update', handleEarningsUpdate);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [token, callState.callType, createPeerConnection, cleanup, dispatch, user]);

  const respondingRef = useRef(false);
  const respondToCall = async (accepted) => {
    if (respondingRef.current) return;
    respondingRef.current = true;

    // Get the latest incoming call data from state
    console.log("☎️ [CALL_RESPONSE] Response triggered:", accepted);
    let currentIncomingCall = store.getState().call.incomingCall;
    
    // Fallback for pending ritual requests if direct incomingCall is null
    if (!currentIncomingCall) {
      const pendingRitual = store.getState().chat.pendingRitualRequest;
      if (pendingRitual) {
        console.log("🕯️ [CALL_RESPONSE] No direct call found, using pending ritual request:", pendingRitual);
        currentIncomingCall = {
          sessionId: pendingRitual.sessionId || pendingRitual.id,
          type: pendingRitual.type || 'voice', // Default to voice for rituals
          callerName: pendingRitual.seekerName || 'Seeker',
          callerAvatar: pendingRitual.seekerAvatar || null
        };
      }
    }

    try {
      if (ringtoneRef.current) ringtoneRef.current.pause();
      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;

      if (accepted && currentIncomingCall) {
        const { sessionId, type } = currentIncomingCall;
        console.log(`✅ [CALL_ACCEPT] Processing acceptance: Session=${sessionId}, Type=${type}`);
        
        if (!sessionId || !type) {
          console.error("❌ [CALL_ACCEPT] Missing session data in incomingCall object");
          return;
        }

        socket.emit('join_chat', { sessionId });
        socket.emit('call_response', { sessionId, accepted: true });
        
        // Update local state immediately
        console.log("🔄 [CALL_ACCEPT] Updating Redux state: callActive=true, callType=", type);
        dispatch(setCallType(type));
        dispatch(setActiveSessionId(sessionId));
        dispatch(setCallActive(true));
        dispatch(setIncomingCall(null));

        // Navigation logic
        if (type === 'chat') {
          const path = user?.role === 'EXPERT' ? `/expert-panel/chat/${sessionId}` : `/chat/${sessionId}`;
          console.log("🚶 [CALL_ACCEPT] Navigating to chat:", path);
          navigate(path);
        } else {
          // For Audio/Video, stay on current page and start media
          console.log("🎤 [CALL_ACCEPT] Audio/Video call detected. Initializing media pipeline...");
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: type === 'video' ? VIDEO_CONSTRAINTS : false,
              audio: AUDIO_CONSTRAINTS
            });
            setLocalStream(stream);
            console.log("✅ [MEDIA] Local stream acquired successfully.");
          } catch (err) {
            console.error("❌ [MEDIA_ERROR] Failed to get user media:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
               alert("Camera/Microphone access denied. Please enable permissions and try again.");
            }
          }
        }
      } else if (!accepted && currentIncomingCall) {
        const { sessionId } = currentIncomingCall;
        console.log("🚫 [CALL_REJECT] Rejecting session:", sessionId);
        socket.emit('call_response', { sessionId, accepted: false });
        dispatch(setIncomingCall(null));
        cleanup();
      } else {
        const sessionId = activeSessionRef.current;
        if (sessionId) {
          console.log("🚫 [CALL_END] Terminating active session:", sessionId);
          socket.emit('call_response', { sessionId, accepted: false });
        }
        dispatch(setIncomingCall(null));
        cleanup();
      }
  } catch (err) {
    console.error("❌ [RESPOND_TO_CALL_ERROR]", err);
    cleanup();
  } finally {
    respondingRef.current = false;
  }
};

  const initiatingRef = useRef(false);
  const initiateCall = async (sessionId, type, partner) => {
    if (initiatingRef.current || callState.callActive || callState.isCalling) return;
    initiatingRef.current = true;

    dispatch(setActiveSessionId(sessionId));
    dispatch(setCallType(type));
    dispatch(setIsCalling(true));

    let normalizedPartner = partner || { name: 'Partner', avatar: null };
    if (normalizedPartner.avatar && !normalizedPartner.avatar.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || '';
      normalizedPartner = {
        ...normalizedPartner,
        avatar: `${baseUrl}/${normalizedPartner.avatar}`
      };
    }
    dispatch(setPartnerInfo(normalizedPartner));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? VIDEO_CONSTRAINTS : false,
        audio: AUDIO_CONSTRAINTS
      });
      setLocalStream(stream);
      socket.emit('join_chat', { sessionId });
      socket.emit('call_initiate', { sessionId, type });

      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = setTimeout(() => endCall(true), 45000);
    } catch (err) {
      dispatch(setIsCalling(false));
      throw err;
    } finally {
      initiatingRef.current = false;
    }
  };

  const endCall = (manual = false) => {
    if (manual && activeSessionRef.current) {
      socket.emit('call_end', { sessionId: activeSessionRef.current });
    }
    cleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        const newState = !track.enabled;
        track.enabled = newState;
        dispatch(setIsMuted(!newState));
        socket.emit('call_state_update', { 
            sessionId: activeSessionRef.current, 
            muted: !newState 
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        const newState = !track.enabled;
        track.enabled = newState;
        dispatch(setIsVideoOff(!newState));
        socket.emit('call_state_update', { 
            sessionId: activeSessionRef.current, 
            videoOff: !newState 
        });
      }
    }
  };

  const handleSetIsMinimized = (val) => dispatch(setIsMinimized(val));

  const providerValue = {
    localStream,
    remoteStream,
    initiateCall,
    respondToCall,
    endCall,
    toggleMute,
    toggleVideo,
    setIsMinimized: handleSetIsMinimized
  };

  return (
    <CallContext.Provider value={providerValue}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  const callState = useSelector(state => state.call);
  
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }

  return useMemo(() => ({
    ...context,
    ...callState
  }), [context, callState]);
};
