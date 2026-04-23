import axios from 'axios';
import { setToken, logout } from '../store/slices/authSlice';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

export const setupInterceptors = (store) => {
    api.interceptors.request.use(
        (config) => {
            const token = store.getState().auth.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
                originalRequest._retry = true;
                try {
                    const { data } = await api.post("/auth/refresh-token");
                    const { token: newAccessToken } = data.data;
                    
                    store.dispatch(setToken(newAccessToken));
                    
                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    store.dispatch(logout());
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

export default api;
