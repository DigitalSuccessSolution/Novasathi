import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../lib/socket';

export const useWebRTCCall = (sessionId, user) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnection = useRef(null);
  const iceCandidatesQueue = useRef([]);

  const cleanup = useCallback(() => {
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
    iceCandidatesQueue.current = [];
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_signal', { sessionId, signal: event.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { sessionId, signal: offer });
      } catch (err) {
        console.error("🌌 [NEGOTIATION_ERROR]", err);
      }
    };

    pc.ontrack = (event) => {
      console.log("🌌 [REMOTE_TRACK_RECEIVED]", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peerConnection.current = pc;
    return pc;
  }, [sessionId, localStream]);

  // Effect to handle tracks adding if pc is created before localStream is ready
  useEffect(() => {
    if (peerConnection.current && localStream) {
      localStream.getTracks().forEach(track => {
        const senders = peerConnection.current.getSenders();
        const alreadyAdded = senders.find(s => s.track === track);
        if (!alreadyAdded) {
          peerConnection.current.addTrack(track, localStream);
        }
      });
    }
  }, [localStream]);

  const initiateCall = async (type) => {
    setCallType(type);
    setIsCalling(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      socket.emit('call_initiate', { sessionId, type });
    } catch (err) {
      console.error("⚠️ [MEDIA_ERROR]", err);
      setIsCalling(false);
      throw err;
    }
  };

  const respondToCall = async (accepted) => {
    if (accepted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        });
        setLocalStream(stream);
      } catch (err) {
        console.error("⚠️ [MEDIA_ERROR]", err);
        socket.emit('call_response', { sessionId, accepted: false });
        return;
      }
    }
    
    socket.emit('call_response', { sessionId, accepted });
    
    if (accepted) {
      setCallActive(true);
      setIncomingCall(null);
      if (callType === 'video') createPeerConnection();
    } else {
      setIncomingCall(null);
    }
  };

  const endCall = (manual = false) => {
    if (manual) {
      socket.emit('call_end', { sessionId });
      socket.emit('end_session', { sessionId });
    }
    cleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    const handleSignal = async ({ signal }) => {
      const pc = createPeerConnection();
      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            await pc.addIceCandidate(cand);
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', { sessionId, signal: answer });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            await pc.addIceCandidate(cand);
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
        console.error("🌌 [SIGNAL_ERROR]", err);
      }
    };

    const handleAnswered = async (data) => {
      if (data.accepted) {
        setCallActive(true);
        setIsCalling(false);
        if (callType === 'video') {
          const pc = createPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', { sessionId, signal: offer });
        }
      } else {
        setIsCalling(false);
        cleanup();
      }
    };

    socket.on('webrtc_signal', handleSignal);
    socket.on('call_answered', handleAnswered);
    socket.on('incoming_call', (data) => {
      if (data.sessionId === sessionId) {
        setIncomingCall(data);
        setCallType(data.type);
      }
    });
    socket.on('call_terminated', () => cleanup());

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('call_answered', handleAnswered);
      socket.off('incoming_call');
      socket.off('call_terminated');
    };
  }, [sessionId, callType, createPeerConnection, cleanup]);

  return {
    localStream,
    remoteStream,
    callActive,
    isCalling,
    incomingCall,
    callType,
    isMuted,
    isVideoOff,
    initiateCall,
    respondToCall,
    endCall,
    toggleMute,
    toggleVideo,
    cleanup
  };
};
