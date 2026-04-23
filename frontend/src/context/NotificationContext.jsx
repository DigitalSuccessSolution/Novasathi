import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from './AuthContext';
import socket from '../lib/socket';
import { 
  fetchUnreadCount, 
  fetchNotifications as thunkFetchNotifications, 
  markAsRead as thunkMarkAsRead, 
  markAllRead as thunkMarkAllRead, 
  deleteNotification as thunkDeleteNotification 
} from '../store/thunks/notificationThunks';
import { setUnreadCount, setNotifications } from '../store/slices/notificationSlice';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      dispatch(fetchUnreadCount());
      
      const handleNewNotification = () => {
        dispatch(fetchUnreadCount());
      };

      // Real-time synchronization
      socket.on('new_notification', handleNewNotification);
      
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    } else {
      dispatch(setUnreadCount(0));
      dispatch(setNotifications([]));
    }
  }, [token, dispatch]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector(state => state.notification);

  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    return dispatch(thunkFetchNotifications({ page, limit })).unwrap();
  }, [dispatch]);

  const markAsRead = useCallback(async (id) => {
    return dispatch(thunkMarkAsRead(id)).unwrap();
  }, [dispatch]);

  const markAllRead = useCallback(async () => {
    return dispatch(thunkMarkAllRead()).unwrap();
  }, [dispatch]);

  const deleteNotification = useCallback(async (id) => {
    return dispatch(thunkDeleteNotification(id)).unwrap();
  }, [dispatch]);

  const refreshCount = useCallback(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  return useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
    refreshCount
  }), [
    notifications, unreadCount, loading,
    fetchNotifications, markAsRead, markAllRead, deleteNotification, refreshCount
  ]);
};
