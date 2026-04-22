import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../lib/socket';
import { useAuth } from './AuthContext';
import IntakeForm from '../components/IntakeForm';
import { toast } from 'react-hot-toast';


const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user, token, api, updateWalletBalance } = useAuth();

    // ─── Data State ───
    const [sessions, setSessions] = useState([]);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pendingRitualRequest, setPendingRitualRequest] = useState(null);

    // ─── Global Overlay State (WhatsApp-style) ───
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);

    // ─── Intake State ───
    const [intakeConfig, setIntakeConfig] = useState({
        isOpen: false,
        expertId: null,
        expert: null,
        isRandom: false,
        sessionType: 'CHAT'
    });

    // ─── Session Grouping (latest session per partner) ───
    const groupSessions = useCallback((allSessions) => {
        if (!user?.id) return allSessions;
        const grouped = allSessions.reduce((acc, sess) => {
            const partnerId = user.id === sess.userId ? (sess.expertId || sess.counselorId) : sess.userId;
            if (!partnerId) return acc;
            if (!acc[partnerId] || new Date(sess.updatedAt) > new Date(acc[partnerId].updatedAt)) {
                acc[partnerId] = sess;
            }
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }, [user?.id]);

    // ─── Fetch Sessions ───
    const fetchSessions = useCallback(async () => {
        if (!token || !user?.id) return;
        try {
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
            setSessions(user.role === 'ADMIN' ? sidebarSessions : groupSessions(sidebarSessions));
        } catch (err) {
            console.error("❌ [SESSIONS_FETCH_ERROR]", err);
        }
    }, [token, user?.id, user?.role, api, groupSessions]);

    // ─── Fetch Messages ───
    const fetchMessages = useCallback(async (sessionId) => {
        if (!token || !sessionId) return;
        try {
            setLoading(true);
            const res = await api.get(`/chat/session/${sessionId}/messages`);
            setCurrentMessages(res.data.data.messages || []);
            
            const sessRes = await api.get(`/chat/session/${sessionId}`);
            const sessData = sessRes.data.data;
            
            if (user?.id === sessData.userId) {
                const bal = sessData.walletBalance;
                if (bal !== undefined) updateWalletBalance(bal);
            }
        } catch (err) {
            console.error("❌ [MESSAGES_FETCH_ERROR]", err);
        } finally {
            setLoading(false);
        }
    }, [token, api, user?.id, updateWalletBalance]);

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
                setCurrentMessages(prev => {
                    const exists = prev.find(m => m.content === msg.content && m.senderId === msg.senderId && m.isOptimistic);
                    if (exists) {
                        return prev.map(m => m.id === exists.id ? msg : m);
                    }
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                socket.emit('mark_read', { sessionId: msg.sessionId });
            }

            setSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === msg.sessionId);
                if (existingIndex !== -1) {
                    const updated = [...prev];
                    const session = { ...updated[existingIndex] };
                    session.updatedAt = new Date();
                    session.messages = [msg]; // Only keep last message for sidebar
                    session._unreadCount = (session._unreadCount || 0) + (activeSessionId === msg.sessionId ? 0 : 1);
                    updated[existingIndex] = session;
                    return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                }
                return prev;
            });
        };

        const handleNewRequest = ({ session }) => {
            if (user?.role === 'EXPERT' && (session.type === 'CHAT' || !session.type)) {
                setSessions(prev => groupSessions([session, ...prev]));
                setPendingRitualRequest(session);
                socket.emit('join_chat', { sessionId: session.id });
            }
        };

        const handleEnded = (data) => {
            setSessions(prev => prev.map(s => s.id === data.sessionId ? { ...s, status: 'COMPLETED' } : s));
        };

        const handleRead = ({ sessionId }) => {
            if (activeSessionId === sessionId) {
                setCurrentMessages(prev => prev.map(m => ({ ...m, isRead: true })));
            }
        };

        const handleReaction = ({ messageId, reaction }) => {
            setCurrentMessages(prev => prev.map(m => m.id === messageId ? { ...m, reaction } : m));
        };

        const handleBalance = (data) => {
            if (data.newBalance !== undefined) {
                updateWalletBalance(data.newBalance);
            }
        };

        socket.on('connect', onConnect);
        socket.on('new_message', handleNewMessage);
        socket.on('new_ritual_request', handleNewRequest);
        socket.on('session_ended', handleEnded);
        socket.on('force_disconnect', handleEnded);
        socket.on('messages_read', handleRead);
        socket.on('react_message', handleReaction);
        socket.on('balance_update', handleBalance);

        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('new_message', handleNewMessage);
            socket.off('new_ritual_request', handleNewRequest);
            socket.off('session_ended', handleEnded);
            socket.off('force_disconnect', handleEnded);
            socket.off('messages_read', handleRead);
            socket.off('react_message', handleReaction);
            socket.off('balance_update', handleBalance);
        };
    }, [token, activeSessionId, user]);

    // Initial fetch - Only on cosmic initiation or soul-switch
    useEffect(() => { 
        if (token && user?.id) {
            fetchSessions(); 
        }
    }, [token, user?.id]);

    // ─── Send Message ───
    const sendMessage = useCallback((sessionId, content, type = 'TEXT', overrideSenderId = null) => {
        if (!socket.connected) socket.connect();
        
        const tempId = Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            sessionId,
            senderId: overrideSenderId || user.id,
            content,
            messageType: type,
            createdAt: new Date(),
            isRead: false,
            isOptimistic: true,
            sender: { name: user.name, avatar: user.avatar, role: user.role }
        };

        if (activeSessionId === sessionId) {
            setCurrentMessages(prev => [...prev, optimisticMsg]);
        }

        socket.emit('send_message', {
            sessionId,
            content,
            messageType: type,
            overrideSenderId,
        });
    }, [user, activeSessionId]);

    // ─── React to Message ───
    const reactToMessage = useCallback((messageId, reaction) => {
        if (!socket.connected) return;
        setCurrentMessages(prev => prev.map(m => m.id === messageId ? { ...m, reaction } : m));
        socket.emit('react_message', { messageId, reaction });
    }, []);

    // ─── Clear Unread Count ───
    const clearUnread = useCallback((sessionId) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, _unreadCount: 0 } : s));
    }, []);

    // ─── Global Chat Overlay Controls ───
    const openChat = useCallback((sessionId) => {
        setActiveSessionId(sessionId);
        setIsChatOpen(true);
        setMinimized(false);
        clearUnread(sessionId);
    }, [clearUnread]);

    const closeChat = useCallback(() => {
        setIsChatOpen(false);
        setMinimized(false);
    }, []);

    const startAndOpenChat = useCallback(async (expertId, isRandom = false, expert = null, type = 'CHAT') => {
        try {
            // Check for existing active session first
            const res = await api.get("/chat/my-sessions");
            const allSessions = res.data.data || [];
            const activeSess = allSessions.find(s => 
                (s.expertId === expertId || s.counselorId === expertId) && 
                s.status !== 'COMPLETED' && s.status !== 'TERMINATED'
            );
            
            if (activeSess) {
                openChat(activeSess.id);
            } else {
                // Trigger Intake Form
                setIntakeConfig({
                    isOpen: true,
                    expertId,
                    expert,
                    isRandom,
                    sessionType: type
                });
            }
        } catch (err) {
            console.error("Failed to start chat:", err);
            toast.error("An error occurred. Please try again.");
        }
    }, [api, openChat]);

    const handleIntakeSubmit = async (formData) => {
        try {
            // 1. Submit Intake
            const intakeRes = await api.post("/chat/intake", {
                ...formData,
                expertId: intakeConfig.expertId,
                isRandom: intakeConfig.isRandom
            });
            
            const { sessionId } = intakeRes.data.data;

            // 2. Start Real Session using the intake-created session ID
            const startRes = await api.post("/chat/start", { 
                sessionId,
                isRandom: intakeConfig.isRandom,
                type: intakeConfig.sessionType
            });

            const session = startRes.data.data.session || startRes.data.data;
            
            // If it's a call/video, we navigate to the chat screen which handles the auto-call logic
            const { useNavigate } = require('react-router-dom');
            // Wait, we can't use hooks like this. I'll pass a redirect or just open the chat screen.
            // Since ChatScreen handles autoCall from URL params, we can just navigate.
            
            const path = `/chat/${session.id}?autoCall=true&type=${intakeConfig.sessionType.toLowerCase()}`;
            window.location.href = path; // Simplest way since we are outside a component context in callbacks
            
            setIntakeConfig(prev => ({ ...prev, isOpen: false }));
            toast.success("Connecting with your spiritual guide...");
        } catch (err) {
            console.error("Intake submission failed:", err);
            toast.error(err.response?.data?.message || "Failed to start session. Please try again.");
            throw err;
        }
    };

    const rejectRitual = useCallback(async (sessionId) => {
        try {
            await api.post(`/chat/session/${sessionId}/end`);
            setPendingRitualRequest(null);
        } catch (err) {
            console.error("❌ [REJECT_RITUAL_ERROR]", err);
            setPendingRitualRequest(null);
        }
    }, [api]);

    const acceptRitual = useCallback((sessionId) => {
        setPendingRitualRequest(null);
        window.location.href = `/expert/chat/${sessionId}`;
    }, []);

    return (
        <ChatContext.Provider value={{
            sessions,
            currentMessages,
            activeSessionId,
            loading,
            isChatOpen,
            minimized,
            pendingRitualRequest,
            setActiveSessionId,
            setIsChatOpen,
            setMinimized,
            openChat,
            closeChat,
            startAndOpenChat,
            clearUnread,
            fetchMessages,
            fetchSessions,
            sendMessage,
            reactToMessage,
            acceptRitual,
            rejectRitual
        }}>
            {children}
            
            <IntakeForm 
                isOpen={intakeConfig.isOpen}
                onClose={() => setIntakeConfig(prev => ({ ...prev, isOpen: false }))}
                onSubmit={handleIntakeSubmit}
                expert={intakeConfig.expert}
                isRandom={intakeConfig.isRandom}
            />
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
