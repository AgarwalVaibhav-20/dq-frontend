import axios from 'axios';
import { BASE_URL } from './constants';
import { getValidToken, clearAuthData } from './tokenUtils';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Request Interceptor: Adds the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles 401 Unauthorized errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all authentication data
      clearAuthData();
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
