import axios from 'axios';
import { localLogout } from '../redux/slices/authSlice';
import store from '../redux/store';
import { BASE_URL } from './constants';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Request Interceptor: Adds the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    console.log(token)
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
      // Dispatching localLogout will clear the user's session and trigger a redirect to the login page.
      store.dispatch(localLogout());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
