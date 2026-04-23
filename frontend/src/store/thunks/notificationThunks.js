import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { 
  setLoading, 
  setNotifications, 
  setUnreadCount, 
  markNotificationRead, 
  markAllNotificationsRead, 
  removeNotification 
} from '../slices/notificationSlice';

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data.data.count || 0;
      dispatch(setUnreadCount(count));
      return count;
    } catch (error) {
      console.error("🔔 [UNREAD_COUNT_ERROR]", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const res = await api.get(`/notifications?page=${page}&limit=${limit}`);
      const { notifications: list, unreadCount: count } = res.data.data;
      dispatch(setNotifications(list));
      dispatch(setUnreadCount(count));
      return res.data.data;
    } catch (error) {
      console.error("🔔 [FETCH_NOTIFICATIONS_ERROR]", error);
      return rejectWithValue(error.response?.data || error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markNotificationRead(id));
      return id;
    } catch (error) {
      console.error("🔔 [MARK_READ_ERROR]", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  'notification/markAllRead',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
      dispatch(markAllNotificationsRead());
      return true;
    } catch (error) {
      console.error("🔔 [MARK_ALL_READ_ERROR]", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${id}`);
      dispatch(removeNotification(id));
      dispatch(fetchUnreadCount());
      return id;
    } catch (error) {
      console.error("🔔 [DELETE_NOTIFICATION_ERROR]", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
