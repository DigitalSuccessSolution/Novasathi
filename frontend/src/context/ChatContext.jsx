import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socket from '../lib/socket';
import { useAuth } from './AuthContext';
import IntakeForm from '../components/IntakeForm';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

import { 
    setSessions, 
    setCurrentMessages, 
    addMessage, 
    updateMessageStatus, 
    setActiveSessionId, 
    setPendingRitualRequest, 
    setIsChatOpen, 
    setMinimized, 
    setIntakeConfig, 
    updateSessionInList 
} from '../store/slices/chatSlice';
import { setPendingInitiation } from '../store/slices/callSlice';

import { fetchSessions, fetchMessages, endSession, acceptSession } from '../store/thunks/chatThunks';
import { updateWalletBalance } from '../store/slices/authSlice';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token } = useAuth();
    const { activeSessionId, intakeConfig } = useSelector(state => state.chat);
    const navigate = useNavigate();
    const notificationRef = React.useRef(null);

    // Initialize notification sound
    useEffect(() => {
        notificationRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        return () => { if (notificationRef.current) notificationRef.current = null; };
    }, []);

    // ─── Socket Event Handlers ───
    useEffect(() => {
        if (!token) {
            if (socket.connected) socket.disconnect();
            return;
        }

        const onConnect = () => {
            if (user?.role === 'EXPERT') {
                const expertId = user.expert?.id || user.id;
                socket.emit('join_portal', expertId);
            }
            if (activeSessionId) {
                socket.emit('join_chat', { sessionId: activeSessionId });
                socket.emit('mark_read', { sessionId: activeSessionId });
            }
        };

        const handleNewMessage = (msg) => {
            if (activeSessionId === msg.sessionId) {
                dispatch(addMessage(msg));
                socket.emit('mark_read', { sessionId: msg.sessionId });
            }

            // Update sidebar session unread count
            dispatch((dispatch, getState) => {
                const { sessions } = getState().chat;
                const existingIndex = sessions.findIndex(s => s.id === msg.sessionId);
                if (existingIndex !== -1) {
                    const session = { ...sessions[existingIndex] };
                    session.updatedAt = new Date().toISOString();
                    session.messages = [msg];
                    session._unreadCount = (session._unreadCount || 0) + (activeSessionId === msg.sessionId ? 0 : 1);
                    dispatch(updateSessionInList(session));
                    // Re-sort after updating
                    const updatedSessions = [...getState().chat.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    dispatch(setSessions(updatedSessions));
                }
            });
        };

        // ─── Legacy ritual request listener removed, now handled by CallContext unified incoming_call ───

        const handleEnded = (data) => {
            dispatch((dispatch, getState) => {
                const { sessions } = getState().chat;
                const session = sessions.find(s => s.id === data.sessionId);
                if (session) {
                    dispatch(updateSessionInList({ ...session, status: 'COMPLETED' }));
                }
            });
        };

        const handleRead = ({ sessionId }) => {
            if (activeSessionId === sessionId) {
                dispatch((dispatch, getState) => {
                    const { currentMessages } = getState().chat;
                    dispatch(setCurrentMessages(currentMessages.map(m => ({ ...m, isRead: true }))));
                });
            }
        };

        const handleReaction = ({ messageId, reaction }) => {
            dispatch((dispatch, getState) => {
                const { currentMessages } = getState().chat;
                dispatch(setCurrentMessages(currentMessages.map(m => m.id === messageId ? { ...m, reaction } : m)));
            });
        };

        const handleBalance = (data) => {
            if (data.newBalance !== undefined) {
                dispatch(updateWalletBalance(data.newBalance));
            }
        };

        socket.on('connect', onConnect);
        socket.on('new_message', handleNewMessage);
        socket.on('session_ended', handleEnded);
        socket.on('force_disconnect', handleEnded);
        socket.on('messages_read', handleRead);
        socket.on('react_message', handleReaction);
        socket.on('balance_update', handleBalance);

        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('new_message', handleNewMessage);
            socket.off('session_ended', handleEnded);
            socket.off('force_disconnect', handleEnded);
            socket.off('messages_read', handleRead);
            socket.off('react_message', handleReaction);
            socket.off('balance_update', handleBalance);
        };
    }, [token, activeSessionId, user, dispatch]);

    // Initial fetch
    useEffect(() => { 
        if (token && user?.id) {
            dispatch(fetchSessions()); 
        }
    }, [token, user?.id, dispatch]);

    const handleIntakeSubmit = async (formData) => {
        try {
            const startRes = await api.post('/chat/start', {
                expertId: intakeConfig.expertId,
                intakeData: formData,
                isRandom: intakeConfig.isRandom,
                type: intakeConfig.sessionType
            });
            const session = startRes.data.data.session || startRes.data.data;
            
            // Only navigate for text-based chat sessions
            if (intakeConfig.sessionType.toLowerCase() === 'chat') {
                const path = `/chat/${session.id}?autoCall=true&type=chat`;
                navigate(path);
            } else {
                // For Audio/Video, stay on current page and trigger call initiation
                dispatch(setPendingInitiation({
                    sessionId: session.id,
                    type: intakeConfig.sessionType.toLowerCase() === 'video' ? 'video' : 'voice',
                    partner: {
                        name: intakeConfig.expert?.displayName || "Expert",
                        avatar: intakeConfig.expert?.profileImage || null
                    }
                }));
                toast.success("Requesting spiritual connection...");
            }
            
            dispatch(setIntakeConfig({ isOpen: false }));
        } catch (err) {
            console.error("Intake submission failed:", err);
            toast.error(err.response?.data?.message || "Failed to start session. Please try again.");
            throw err;
        }
    };

    return (
        <ChatContext.Provider value={{}}>
            {children}
            <IntakeForm 
                isOpen={intakeConfig.isOpen}
                onClose={() => dispatch(setIntakeConfig({ isOpen: false }))}
                onSubmit={handleIntakeSubmit}
                expert={intakeConfig.expert}
                isRandom={intakeConfig.isRandom}
            />
        </ChatContext.Provider>
    );
};

// ─── Custom Hook Replacement for useChat ───
export const useChat = () => {
    const dispatch = useDispatch();
    const chatState = useSelector(state => state.chat);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchSessionsWrapped = useCallback(() => dispatch(fetchSessions()), [dispatch]);
    const fetchMessagesWrapped = useCallback((sessionId) => dispatch(fetchMessages(sessionId)), [dispatch]);

    const sendMessage = useCallback((sessionId, content, type = 'TEXT', overrideSenderId = null) => {
        if (!socket.connected) socket.connect();
        
        const tempId = Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            sessionId,
            senderId: overrideSenderId || user.id,
            content,
            messageType: type,
            createdAt: new Date().toISOString(),
            isRead: false,
            isOptimistic: true,
            sender: { name: user.name, avatar: user.avatar, role: user.role }
        };

        if (chatState.activeSessionId === sessionId) {
            dispatch(addMessage(optimisticMsg));
        }

        socket.emit('send_message', {
            sessionId,
            content,
            messageType: type,
            tempId,
            overrideSenderId,
        });
    }, [user, chatState.activeSessionId, dispatch]);

    const reactToMessage = useCallback((messageId, reaction) => {
        if (!socket.connected) return;
        dispatch((dispatch, getState) => {
            const { currentMessages } = getState().chat;
            dispatch(setCurrentMessages(currentMessages.map(m => m.id === messageId ? { ...m, reaction } : m)));
        });
        socket.emit('react_message', { messageId, reaction });
    }, [dispatch]);

    const clearUnread = useCallback((sessionId) => {
        dispatch((dispatch, getState) => {
            const { sessions } = getState().chat;
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                dispatch(updateSessionInList({ ...session, _unreadCount: 0 }));
            }
        });
    }, [dispatch]);

    const openChat = useCallback((sessionId) => {
        dispatch(setActiveSessionId(sessionId));
        dispatch(setIsChatOpen(true));
        dispatch(setMinimized(false));
        clearUnread(sessionId);
    }, [dispatch, clearUnread]);

    const closeChat = useCallback(() => {
        dispatch(setIsChatOpen(false));
        dispatch(setMinimized(false));
    }, [dispatch]);

    const startAndOpenChat = useCallback((expertId, expertData, isRandom = false, sessionType = 'CHAT') => {
        dispatch(setIntakeConfig({
            isOpen: true,
            expertId,
            expert: expertData,
            isRandom,
            sessionType
        }));
    }, [dispatch]);

    // Legacy accept/reject functions removed as it is now handled by CallManager respondToCall

    // Expose setters
    const setSessionId = useCallback((id) => dispatch(setActiveSessionId(id)), [dispatch]);
    const setChatOpen = useCallback((isOpen) => dispatch(setIsChatOpen(isOpen)), [dispatch]);
    const setChatMinimized = useCallback((isMin) => dispatch(setMinimized(isMin)), [dispatch]);

    return useMemo(() => ({
        ...chatState,
        setActiveSessionId: setSessionId,
        setIsChatOpen: setChatOpen,
        setMinimized: setChatMinimized,
        openChat,
        closeChat,
        startAndOpenChat,
        clearUnread,
        fetchMessages: fetchMessagesWrapped,
        fetchSessions: fetchSessionsWrapped,
        sendMessage,
        reactToMessage
    }), [
        chatState, setSessionId, setChatOpen, setChatMinimized,
        openChat, closeChat, startAndOpenChat, clearUnread,
        fetchMessagesWrapped, fetchSessionsWrapped, sendMessage, reactToMessage
    ]);
};
