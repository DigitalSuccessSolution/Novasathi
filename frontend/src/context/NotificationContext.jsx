import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socket from '../lib/socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { api, token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count || 0);
    } catch (err) {
      console.error("🔔 [UNREAD_COUNT_ERROR]", err);
    }
  }, [api, token]);

  const fetchNotifications = async (page = 1, limit = 10) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
      const { notifications: list, unreadCount: count } = res.data.data;
      setNotifications(list);
      setUnreadCount(count);
      return res.data.data;
    } catch (err) {
      console.error("🔔 [FETCH_NOTIFICATIONS_ERROR]", err);
      return { notifications: [], unreadCount: 0 };
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("🔔 [MARK_READ_ERROR]", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("🔔 [MARK_ALL_READ_ERROR]", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error("🔔 [DELETE_NOTIFICATION_ERROR]", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      
      // Real-time synchronization
      socket.on('new_notification', fetchUnreadCount);
      
      return () => {
        socket.off('new_notification', fetchUnreadCount);
      };
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [token]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllRead,
      deleteNotification,
      refreshCount: fetchUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};
