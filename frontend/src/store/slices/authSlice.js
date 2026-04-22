import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  loading: !!localStorage.getItem('token'),
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    },
    updateWalletBalance: (state, action) => {
      if (state.user && state.user.wallet) {
        state.user.wallet.balance = action.payload;
      }
    },
    updateExpertStats: (state, action) => {
      if (state.user && state.user.expert) {
        state.user.expert = { ...state.user.expert, ...action.payload };
      }
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setLoading, 
  setUser, 
  setToken, 
  updateWalletBalance, 
  updateExpertStats,
  updateProfile,
  logout, 
  setError 
} = authSlice.actions;
export default authSlice.reducer;
