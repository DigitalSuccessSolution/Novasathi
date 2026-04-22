// src/lib/api.js
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && !window.location.pathname.includes('login')) {
       // Optional: Handle token refresh logic here
       localStorage.removeItem('token');
       // window.location.href = '/login'; 
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
