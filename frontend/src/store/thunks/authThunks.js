import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { setToken, setUser, logout as authLogout } from '../slices/authSlice';
import { requestNotificationPermission } from '../../lib/firebase';

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.get('/users/me');
            const userData = response.data.data;
            dispatch(setUser(userData));
            return userData;
        } catch (error) {
            dispatch(authLogout());
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const sendOtp = createAsyncThunk(
    'auth/sendOtp',
    async ({ phone }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/send-otp', { phone });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ phone, otp }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post('/auth/verify-otp', { phone, otp });
            const { token, user } = response.data.data;
            
            dispatch(setToken(token));
            dispatch(setUser(user));
            
            const fcmToken = await requestNotificationPermission();
            if (fcmToken) {
                await api.post('/notifications/fcm-token', { fcmToken });
            }
            
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const loginWithFirebase = createAsyncThunk(
    'auth/loginWithFirebase',
    async ({ idToken }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post('/auth/firebase-login', { idToken });
            const { token, user } = response.data.data;
            
            dispatch(setToken(token));
            dispatch(setUser(user));
            
            const fcmToken = await requestNotificationPermission();
            if (fcmToken) {
                await api.post('/notifications/fcm-token', { fcmToken });
            }
            
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const adminLogin = createAsyncThunk(
    'auth/adminLogin',
    async ({ email, password }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post('/auth/admin/login', { email, password });
            const { token, user } = response.data.data;
            
            dispatch(setToken(token));
            dispatch(setUser(user));
            
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const loginWithCredentials = createAsyncThunk(
    'auth/loginWithCredentials',
    async ({ email, password }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post('/auth/expert/login', { email, password });
            const { token, user } = response.data.data;
            
            dispatch(setToken(token));
            dispatch(setUser(user));
            
            const fcmToken = await requestNotificationPermission();
            if (fcmToken) {
                await api.post('/notifications/fcm-token', { fcmToken });
            }
            
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { dispatch }) => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout request failed recorded by system.', error);
        } finally {
            dispatch(authLogout());
        }
    }
);
