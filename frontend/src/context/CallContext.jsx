import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../lib/socket';
import { useAuth } from './AuthContext';

const CallContext = createContext();

// Production ICE servers (STUN + free TURN fallback)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Add your own TURN servers here for NAT traversal:
  // { urls: 'turn:your-turn.example.com:3478', username: 'user', credential: 'pass' }
];

export const CallProvider = ({ children }) => {
  const { user, token, updateWalletBalance } = useAuth();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState({ name: 'Partner', avatar: null });
  const [connectionState, setConnectionState] = useState('new');

  const peerConnection = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const timerInterval = useRef(null);
  const ringingTimeoutRef = useRef(null);
  const activeSessionRef = useRef(null);

  // Keep ref in sync for closures
  useEffect(() => { activeSessionRef.current = activeSessionId; }, [activeSessionId]);

  const cleanup = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = null;
    setTimeLeft(null);
    setIsMinimized(false);

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionState('new');
    iceCandidatesQueue.current = [];
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    ringingTimeoutRef.current = null;
    setActiveSessionId(null);
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
      if (pc.iceConnectionState === 'disconnected') {
        // Give 5 seconds to reconnect before cleanup
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') cleanup();
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
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
  }, [localStream, cleanup]);

  // Add tracks when stream becomes available
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

  // ─── Socket Event Handlers ───
  useEffect(() => {
    if (!token) return;

    const handleIncoming = (data) => {
      setIncomingCall(data);
      setCallType(data.type);
      setActiveSessionId(data.sessionId);
      
      let avatarUrl = data.callerAvatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || '';
        avatarUrl = `${baseUrl}/${avatarUrl}`;
      }
      setPartnerInfo({ 
        name: data.callerName || 'Unknown', 
        avatar: avatarUrl,
        intakeData: data.intakeData 
      });

      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = setTimeout(() => respondToCall(false), 45000);
    };

    const handleSignal = async ({ signal }) => {
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
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            iceCandidatesQueue.current.push(candidate);
          }
        }
      } catch (err) {
        console.error("❌ [SIGNAL_ERROR]", err);
      }
    };

    const handleAnswered = async (data) => {
      if (data.accepted) {
        if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
        setCallActive(true);
        setIsCalling(false);
        
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
          setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
      } else {
        setIsCalling(false);
        cleanup();
      }
    };

    const handleSessionStarted = (data) => {
      if (data.timerSeconds !== undefined) setTimeLeft(data.timerSeconds);
    };

    const handleBalanceUpdate = (data) => {
      if (data.newBalance !== undefined && user?.role === 'USER') {
        updateWalletBalance(data.newBalance);
      }
      if (data.timeLeftSeconds !== undefined) setTimeLeft(data.timeLeftSeconds);
    };

    socket.on('incoming_call', handleIncoming);
    socket.on('webrtc_signal', handleSignal);
    socket.on('call_answered', handleAnswered);
    socket.on('call_terminated', cleanup);
    socket.on('session_started', handleSessionStarted);
    socket.on('balance_update', handleBalanceUpdate);

    return () => {
      socket.off('incoming_call', handleIncoming);
      socket.off('webrtc_signal', handleSignal);
      socket.off('call_answered', handleAnswered);
      socket.off('call_terminated', cleanup);
      socket.off('session_started', handleSessionStarted);
      socket.off('balance_update', handleBalanceUpdate);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [token, callType, createPeerConnection, cleanup]);

  const initiateCall = async (sessionId, type, partner) => {
    setActiveSessionId(sessionId);
    setCallType(type);
    setIsCalling(true);
    setPartnerInfo(partner || { name: 'Partner', avatar: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      socket.emit('call_initiate', { sessionId, type });

      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = setTimeout(() => endCall(true), 45000);
    } catch (err) {
      setIsCalling(false);
      throw err;
    }
  };

  const respondToCall = async (accepted) => {
    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    ringingTimeoutRef.current = null;

    if (accepted && incomingCall) {
      // 1. Common Acceptance Socket Notification
      socket.emit('call_response', { sessionId: activeSessionRef.current, accepted: true });
      setCallActive(true);
      setIncomingCall(null);

      // 2. Type-Specific Handling
      if (callType === 'chat') {
        // For Chat, just navigate to the session room
        navigate(`/chat/${activeSessionRef.current}`);
      } else {
        // For Media calls (Audio/Video), initialize WebRTC
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true
          });
          setLocalStream(stream);
        } catch (err) {
          console.error("❌ [MEDIA_ERROR]", err);
          // Fallback if media fails - at least join the text session? Or end call.
          socket.emit('call_response', { sessionId: activeSessionRef.current, accepted: false });
          cleanup();
        }
      }
    } else {
      socket.emit('call_response', { sessionId: activeSessionRef.current, accepted: false });
      setIncomingCall(null);
      cleanup();
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
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    }
  };

  return (
    <CallContext.Provider value={{
      localStream,
      remoteStream,
      callActive,
      isCalling,
      incomingCall,
      callType,
      activeSessionId,
      timeLeft,
      isMuted,
      isVideoOff,
      isMinimized,
      partnerInfo,
      connectionState,
      initiateCall,
      respondToCall,
      endCall,
      toggleMute,
      toggleVideo,
      setIsMinimized
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
