import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { 
    setSessions, 
    setCurrentMessages, 
    setChatLoading,
    updateSessionInList
} from '../slices/chatSlice';
import { updateWalletBalance } from '../slices/authSlice';

// Helper to group sessions
const groupSessions = (allSessions, userId) => {
    if (!userId) return allSessions;
    const grouped = allSessions.reduce((acc, sess) => {
        const partnerId = userId === sess.userId ? (sess.expertId || sess.counselorId) : sess.userId;
        if (!partnerId) return acc;
        if (!acc[partnerId] || new Date(sess.updatedAt) > new Date(acc[partnerId].updatedAt)) {
            acc[partnerId] = sess;
        }
        return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const fetchSessions = createAsyncThunk(
    'chat/fetchSessions',
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const { auth: { user, token } } = getState();
            if (!token || !user?.id) return [];

            let sidebarSessions = [];
            if (user.role === 'ADMIN') {
                const res = await api.get("/admin/sessions");
                const data = res.data.data;
                sidebarSessions = data.sessions || data || [];
            } else if (user.role === 'EXPERT') {
                const res = await api.get("/experts/overview");
                sidebarSessions = res.data.data.expert.chatSessions || [];
            } else {
                const res = await api.get("/chat/my-sessions");
                sidebarSessions = res.data.data || [];
            }

            const processedSessions = user.role === 'ADMIN' ? sidebarSessions : groupSessions(sidebarSessions, user.id);
            dispatch(setSessions(processedSessions));
            return processedSessions;
        } catch (error) {
            console.error("❌ [SESSIONS_FETCH_ERROR]", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (sessionId, { dispatch, getState, rejectWithValue }) => {
        try {
            const { auth: { user, token } } = getState();
            if (!token || !sessionId) return [];

            dispatch(setChatLoading(true));
            const res = await api.get(`/chat/session/${sessionId}/messages`);
            const messages = res.data.data.messages || [];
            dispatch(setCurrentMessages(messages));
            
            const sessRes = await api.get(`/chat/session/${sessionId}`);
            const sessData = sessRes.data.data;
            
            if (user?.id === sessData.userId && sessData.walletBalance !== undefined) {
                dispatch(updateWalletBalance(sessData.walletBalance));
            }

            return messages;
        } catch (error) {
            console.error("❌ [MESSAGES_FETCH_ERROR]", error);
            return rejectWithValue(error.response?.data || error.message);
        } finally {
            dispatch(setChatLoading(false));
        }
    }
);

export const endSession = createAsyncThunk(
    'chat/endSession',
    async (sessionId, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post(`/chat/session/${sessionId}/end`);
            const updatedSession = res.data.data.session || res.data.data;
            dispatch(updateSessionInList(updatedSession));
            return updatedSession;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const acceptSession = createAsyncThunk(
    'chat/acceptSession',
    async (sessionId, { rejectWithValue }) => {
        try {
            const res = await api.post(`/chat/session/${sessionId}/accept`);
            return res.data.data.session || res.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
