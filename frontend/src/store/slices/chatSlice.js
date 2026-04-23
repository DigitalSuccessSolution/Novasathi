import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sessions: [],
    currentMessages: [],
    activeSessionId: null,
    loading: false,
    pendingRitualRequest: null,
    isChatOpen: false,
    minimized: false,
    intakeConfig: {
        isOpen: false,
        expertId: null,
        expert: null,
        isRandom: false,
        sessionType: 'CHAT'
    }
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setSessions: (state, action) => {
            state.sessions = action.payload;
        },
        setCurrentMessages: (state, action) => {
            state.currentMessages = action.payload;
        },
        addMessage: (state, action) => {
            const newMsg = action.payload;
            
            // Handle optimistic message replacement via tempId
            if (newMsg.tempId) {
                const index = state.currentMessages.findIndex(m => m.id === newMsg.tempId || m.id === newMsg.id);
                if (index !== -1) {
                    state.currentMessages[index] = newMsg;
                    return;
                }
            }
            
            // Prevent general duplicates based on real DB ID
            const existingIndex = state.currentMessages.findIndex(m => m.id === newMsg.id);
            if (existingIndex !== -1) {
                state.currentMessages[existingIndex] = newMsg;
                return;
            }
            
            state.currentMessages.push(newMsg);
        },
        updateMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            const message = state.currentMessages.find(m => m.id === messageId);
            if (message) {
                message.status = status;
            }
        },
        setActiveSessionId: (state, action) => {
            state.activeSessionId = action.payload;
        },
        setChatLoading: (state, action) => {
            state.loading = action.payload;
        },
        setPendingRitualRequest: (state, action) => {
            state.pendingRitualRequest = action.payload;
        },
        setIsChatOpen: (state, action) => {
            state.isChatOpen = action.payload;
            if (!action.payload) {
                state.minimized = false;
            }
        },
        setMinimized: (state, action) => {
            state.minimized = action.payload;
        },
        setIntakeConfig: (state, action) => {
            state.intakeConfig = { ...state.intakeConfig, ...action.payload };
        },
        updateSessionInList: (state, action) => {
            const updatedSession = action.payload;
            const index = state.sessions.findIndex(s => s.id === updatedSession.id);
            if (index !== -1) {
                state.sessions[index] = { ...state.sessions[index], ...updatedSession };
            } else {
                state.sessions.unshift(updatedSession);
            }
        }
    }
});

export const {
    setSessions,
    setCurrentMessages,
    addMessage,
    updateMessageStatus,
    setActiveSessionId,
    setChatLoading,
    setPendingRitualRequest,
    setIsChatOpen,
    setMinimized,
    setIntakeConfig,
    updateSessionInList
} = chatSlice.actions;

export default chatSlice.reducer;
