import React, { createContext, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { 
    setUser, setToken, setLoading, 
    updateWalletBalance as reduxUpdateBalance, 
    updateExpertStats as reduxUpdateExpertStats, 
    updateProfile as reduxUpdateProfile 
} from '../store/slices/authSlice';
import { toggleLoginModal } from '../store/slices/uiSlice';
import { 
    sendOtp, verifyOtp as thunkVerifyOtp, 
    loginWithFirebase as thunkLoginWithFirebase, 
    adminLogin as thunkAdminLogin, 
    loginWithCredentials as thunkLoginWithCredentials, 
    logoutUser, fetchCurrentUser 
} from '../store/thunks/authThunks';
import socket from "../lib/socket";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, loading } = useSelector(state => state.auth);

    // Initial Verification and Socket Connection
    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                dispatch(setLoading(true));
                try {
                    const action = await dispatch(fetchCurrentUser()).unwrap();
                    
                    // Establish Cosmic Connection with token
                    socket.auth = { token };
                    socket.connect();

                    // If expert, join the global portal
                    if (action.role === 'EXPERT' || action.expert) {
                        const expertId = action.expert?.id || action.id;
                        console.log(`📡 [PORTAL] Synchronizing with Realm: ${expertId}`);
                        socket.emit('join_portal', expertId);
                    }
                } catch (error) {
                    console.error("Sanctuary Error: Session Expired", error);
                    // On error, revert to guest socket
                    socket.auth = {};
                    socket.connect();
                }
            } else {
                dispatch(setLoading(false));
                // Guest socket connection for marketplace updates
                socket.auth = {};
                socket.connect();
            }
        };
        verifyUser();
    }, [token, dispatch]);

    return (
        <AuthContext.Provider value={{}}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Custom Hook Replacement for useAuth ───
export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, token, loading } = useSelector(state => state.auth);
    const { isLoginModalOpen } = useSelector(state => state.ui);

    // Thunk Wrappers
    const login = useCallback(async (phone) => dispatch(sendOtp({ phone })).unwrap(), [dispatch]);
    const loginWithFirebase = useCallback(async (idToken) => dispatch(thunkLoginWithFirebase({ idToken })).unwrap(), [dispatch]);
    const verifyOtp = useCallback(async (phone, otp) => dispatch(thunkVerifyOtp({ phone, otp })).unwrap(), [dispatch]);
    const adminLogin = useCallback(async (email, password) => dispatch(thunkAdminLogin({ email, password })).unwrap(), [dispatch]);
    const loginWithCredentials = useCallback(async (email, password) => dispatch(thunkLoginWithCredentials({ email, password })).unwrap(), [dispatch]);
    const logout = useCallback(async () => dispatch(logoutUser()).unwrap(), [dispatch]);

    // Slice Action Wrappers
    const updateWalletBalance = useCallback((newBalance) => dispatch(reduxUpdateBalance(newBalance)), [dispatch]);
    const updateExpertStats = useCallback((stats) => dispatch(reduxUpdateExpertStats(stats)), [dispatch]);
    const updateProfile = useCallback((data) => dispatch(reduxUpdateProfile(data)), [dispatch]);
    const setAuthLoading = useCallback((isLoading) => dispatch(setLoading(isLoading)), [dispatch]);
    const setAuthUser = useCallback((userData) => dispatch(setUser(userData)), [dispatch]);
    const setIsLoginModalOpen = useCallback((isOpen) => dispatch(toggleLoginModal(isOpen)), [dispatch]);

    return useMemo(() => ({
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
    }), [
        user, loading, token, isLoginModalOpen,
        login, loginWithFirebase, verifyOtp, loginWithCredentials, adminLogin, logout,
        updateWalletBalance, updateExpertStats, updateProfile, setAuthLoading, setIsLoginModalOpen, setAuthUser
    ]);
};
