import axios from 'axios';
import { BASE_URL } from './constants';
import { getValidToken, clearAuthData } from './tokenUtils';
// import store from '../redux/store';
// import { logoutUser } from '../redux/slices/authSlice';

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
  async (error) => {
    if (error.response?.status === 401) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          await axios.post(`${BASE_URL}/force-logout`, { userId });
        } catch (e) {/* ignore errors */}
      }
      localStorage.setItem('session-expired', 'true');
      clearAuthData();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
