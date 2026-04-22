import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useSelector, useDispatch } from 'react-redux';
import { setUser, setToken, setLoading, logout as reduxLogout, updateWalletBalance as reduxUpdateBalance, updateExpertStats as reduxUpdateExpertStats, updateProfile as reduxUpdateProfile } from '../store/slices/authSlice';
import { toggleLoginModal } from '../store/slices/uiSlice';
import socket from "../lib/socket";
import { requestNotificationPermission } from "../lib/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, loading } = useSelector(state => state.auth);
    const { isLoginModalOpen } = useSelector(state => state.ui);

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL,
            timeout: 10000,
            withCredentials: true,
        });

        instance.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
                    originalRequest._retry = true;
                    try {
                        // We hit the refresh endpoint withCredentials:true, 
                        // so the browser sends the refreshToken cookie automatically.
                        const { data } = await instance.post("/auth/refresh-token");
                        
                        const { token: newAccessToken } = data.data;
                        dispatch(setToken(newAccessToken));
                        
                        // Retry original request
                        return instance(originalRequest);
                    } catch (refreshError) {
                        logout(); 
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [token, dispatch]);

    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                dispatch(setLoading(true));
                try {
                    const response = await api.get("/users/me");
                    const userData = response.data.data;
                    dispatch(setUser(userData));

                    // Establish Cosmic Connection
                    socket.auth = { token };
                    socket.connect();

                    // If expert, join the global portal for unmissable notifications
                    if (userData.role === 'EXPERT' || userData.expert) {
                        const expertId = userData.expert?.id || userData.id;
                        console.log(`📡 [PORTAL] Synchronizing with Realm: ${expertId}`);
                        socket.emit('join_portal', expertId);
                    }
                } catch (error) {
                    console.error("Sanctuary Error: Session Expired", error);
                    logout();
                }
            } else {
                dispatch(setLoading(false));
                socket.disconnect();
            }
        };
        verifyUser();
    }, [token, api, dispatch]);

    const login = async (phone) => {
        return await api.post("/auth/send-otp", { phone }).then(res => res.data);
    };

    const loginWithFirebase = async (idToken) => {
        const response = await api.post("/auth/firebase-login", { idToken });
        const { token: newToken, user: userData } = response.data.data;
        
        dispatch(setToken(newToken));
        dispatch(setUser(userData));
        
        // Request Notification Permission (SRS §15)
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
            await api.post("/notifications/fcm-token", { fcmToken });
        }
        
        return response.data.data;
    };

    const verifyOtp = async (phone, otp) => {
        const response = await api.post("/auth/verify-otp", { phone, otp });
        const { token: newToken, user: userData } = response.data.data;
        
        dispatch(setToken(newToken));
        dispatch(setUser(userData));
        
        // Request Notification Permission & Sync Token (SRS §15)
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
            await api.post("/notifications/fcm-token", { fcmToken });
        }
        
        return response.data.data;
    };

    const adminLogin = async (email, password) => {
        const response = await api.post("/auth/admin/login", { email, password });
        const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data.data;
        
        dispatch(setToken(newToken));
        dispatch(setUser(userData));
        
        return response.data.data;
    };

    const loginWithCredentials = async (email, password) => {
        const response = await api.post("/auth/expert/login", { email, password });
        const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data.data;
        
        dispatch(setToken(newToken));
        dispatch(setUser(userData));
        
        // Request Notification Permission & Sync Token
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
            await api.post("/users/fcm-token", { token: fcmToken });
        }
        
        return response.data.data;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.warn("Logout request failed recorded by system.");
        } finally {
            dispatch(reduxLogout());
            dispatch(setToken(null));
        }
    };

    const updateWalletBalance = useCallback((newBalance) => {
        dispatch(reduxUpdateBalance(newBalance));
    }, [dispatch]);

    const updateExpertStats = useCallback((stats) => {
        dispatch(reduxUpdateExpertStats(stats));
    }, [dispatch]);

    const updateProfile = useCallback((data) => {
        dispatch(reduxUpdateProfile(data));
    }, [dispatch]);

    const setAuthLoading = useCallback((isLoading) => {
        dispatch(setLoading(isLoading));
    }, [dispatch]);

    const setAuthUser = useCallback((userData) => {
        dispatch(setUser(userData));
    }, [dispatch]);

    const setIsLoginModalOpen = useCallback((isOpen) => {
        dispatch(toggleLoginModal(isOpen));
    }, [dispatch]);

    const contextValue = useMemo(() => ({
        user, 
        loading, 
        login, 
        loginWithFirebase,
        verifyOtp, 
        loginWithCredentials,
        adminLogin,
        logout, 
        updateWalletBalance, 
        updateExpertStats,
        updateProfile,
        setAuthLoading,
        api, 
        token, 
        isLoginModalOpen, 
        setIsLoginModalOpen,
        setAuthUser
    }), [user, loading, token, api, isLoginModalOpen]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
