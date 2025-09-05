import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig.js'; // Keep the instance for authenticated calls
import { BASE_URL } from '../../utils/constants';
import { toast } from 'react-toastify';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ------------------ REGISTER ------------------
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/signup`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// ------------------ LOGIN ------------------
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/signin`, credentials);
      console.log("Login response:", response.data);

      const { success, token, user } = response.data;

      if (success && token) {
        // Save token
        localStorage.setItem('authToken', token);

        // Normalize keys (user._id or userId or id)
        const userId = user?.userId || user?.id || user?._id;
        if (userId) localStorage.setItem('userId', userId);

        // Restaurant ID (if provided in response)
        const restaurantId = user?.restaurantId || user?.restaurant_id;
        if (restaurantId) localStorage.setItem('restaurantId', restaurantId);
        const categoryId = user?.categoryId || user?.category_id;
        if (categoryId) localStorage.setItem('categoryId', categoryId)
        // Optional: Save username or email for quick access
        if (user?.username) localStorage.setItem('username', user.username);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);


// ------------------ VERIFY OTP ------------------
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/verify-otp`, otpData);
      console.log("OTP Verify response:", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed.');
    }
  }
);

// ------------------ LOGOUT ------------------
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      await axiosInstance.post(`${BASE_URL}/logout`, {}, configureHeaders(token));
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed.');
    }
  }
);

// ------------------ FETCH RESTAURANT DETAILS ------------------
export const fetchRestaurantDetails = createAsyncThunk(
  'auth/fetchRestaurantDetails',
  async ({ restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/rest-profile/${restaurantId}`,
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch restaurant details');
    }
  }
);

// ------------------ INITIAL STATE ------------------
const initialState = {
  userId: localStorage.getItem('userId') || null,
  token: localStorage.getItem('authToken') || null,
  restaurantId: localStorage.getItem('restaurantId') || null,
  categoryId: localStorage.getItem('categoryId') || null,
  loading: false,
  error: null,
};

// ------------------ SLICE ------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    localLogout: (state) => {
      state.userId = null;
      state.token = null;
      state.restaurantId = null;

      localStorage.removeItem('authToken');
      localStorage.removeItem('restaurantId');
      localStorage.removeItem('userId');

      toast.info('Logged out locally.', { autoClose: 3000 });
    },
  },
  extraReducers: (builder) => {
    builder

      // --- LOGIN ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const { token, userId, restaurantId, user_id, restaurant_id, message, categoryId, category_id } = action.payload;

        state.token = token || null;
        state.userId = userId || user_id || null;
        state.restaurantId = restaurantId || restaurant_id || null;
        state.categoryId = categoryId || category_id || null
        if (message === 'OTP sent to your email') {
          toast.success('OTP sent to email', { autoClose: 3000 });
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Login failed: ${action.payload}`, { autoClose: 3000 });
      })

      // --- REGISTER ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.message === 'OTP sent to your email') {
          toast.success('OTP sent to email. Please verify!', { autoClose: 3000 });
        } else {
          toast.success('Registered successfully!', { autoClose: 3000 });
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Registration failed: ${action.payload}`, { autoClose: 3000 });
      })

      // --- OTP VERIFY ---
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const { token, user_id, restaurant_id, userId, restaurantId } = action.payload;

        state.token = token || null;
        state.userId = userId || user_id || null;
        state.restaurantId = restaurantId || restaurant_id || null;

        if (token) localStorage.setItem('authToken', token);
        if (userId || user_id) localStorage.setItem('userId', userId || user_id);
        if (restaurantId || restaurant_id) localStorage.setItem('restaurantId', restaurantId || restaurant_id);

        toast.success('OTP verified successfully!', { autoClose: 3000 });
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`OTP verification failed: ${action.payload}`, { autoClose: 3000 });
      })

      // --- LOGOUT ---
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.userId = null;
        state.token = null;
        state.restaurantId = null;
        state.categoryId = null;
        state.username = null
        localStorage.removeItem('authToken');
        localStorage.removeItem('restaurantId');
        localStorage.removeItem('userId');

        toast.info('You have been logged out.', { autoClose: 3000 });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Logout failed: ${action.payload}`, { autoClose: 3000 });
      })

      // --- RESTAURANT DETAILS ---
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.auth = action.payload;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  }
});

// Export localLogout action
export const { localLogout } = authSlice.actions;

// Selector
export const selectAuth = (state) => ({
  token: state.auth.token,
  userId: state.auth.userId,
  restaurantId: state.auth.restaurantId,
});

export default authSlice.reducer;
