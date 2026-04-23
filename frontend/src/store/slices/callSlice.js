import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  callActive: false,
  isCalling: false,
  incomingCall: null,
  callType: null,
  activeSessionId: null,
  timeLeft: null,
  isMuted: false,
  isVideoOff: false,
  isMinimized: false,
  partnerInfo: { name: 'Partner', avatar: null },
  partnerMuted: false,
  partnerVideoOff: false,
  pendingInitiation: null,
  connectionState: 'new',
  sessionEarnings: 0,
  elapsedTime: 0,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setCallActive: (state, action) => {
      state.callActive = action.payload;
    },
    setIsCalling: (state, action) => {
      state.isCalling = action.payload;
    },
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
    },
    setCallType: (state, action) => {
      state.callType = action.payload;
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
    setTimeLeft: (state, action) => {
      state.timeLeft = action.payload;
    },
    setIsMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    setIsVideoOff: (state, action) => {
      state.isVideoOff = action.payload;
    },
    setIsMinimized: (state, action) => {
      state.isMinimized = action.payload;
    },
    setPartnerInfo: (state, action) => {
      state.partnerInfo = { ...state.partnerInfo, ...action.payload };
    },
    setConnectionState: (state, action) => {
      state.connectionState = action.payload;
    },
    setPartnerMuted: (state, action) => {
      state.partnerMuted = action.payload;
    },
    setPartnerVideoOff: (state, action) => {
      state.partnerVideoOff = action.payload;
    },
    setPendingInitiation: (state, action) => {
      state.pendingInitiation = action.payload;
    },
    setSessionEarnings: (state, action) => {
      state.sessionEarnings = action.payload;
    },
    setElapsedTime: (state, action) => {
      state.elapsedTime = action.payload;
    },
    resetCallState: () => {
      return { ...initialState };
    }
  },
});

export const {
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
  setPartnerMuted,
  setPartnerVideoOff,
  setPendingInitiation,
  setSessionEarnings,
  setElapsedTime,
  resetCallState
} = callSlice.actions;

export default callSlice.reducer;
