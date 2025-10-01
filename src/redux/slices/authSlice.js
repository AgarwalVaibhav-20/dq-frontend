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
      // console.log("Login response:", response.data);

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
        if (categoryId) localStorage.setItem('categoryId', categoryId);

        // Role management
        const role = user?.role || 'admin'; // Default to 'admin' if no role provided
        localStorage.setItem('userRole', role);
        
        // Permissions management
        const permissions = user?.permissions || [];
        localStorage.setItem('userPermissions', JSON.stringify(permissions));

        // Optional: Save username or email for quick access
        if (user?.username) localStorage.setItem('username', user.username);
        if (user?.email) localStorage.setItem('userEmail', user.email);
        if (user?.name) localStorage.setItem('userName', user.name);
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
      // console.log("OTP Verify response:", response.data);
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

// ------------------ FETCH USER PROFILE ------------------
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/user-profile/${userId}`,
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
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

// ------------------ UPDATE USER ROLE ------------------
export const updateUserRole = createAsyncThunk(
  'user/updateUserRole',
  async ({ userId, role, permissions, token }, { rejectWithValue }) => {
    try {
      // Use the userId parameter passed from the component
      const id = userId || localStorage.getItem("userId");

      if (!id) {
        return rejectWithValue("User ID not found");
      }

      // console.log("🔄 Updating role for user:", id, "to role:", role);

      const response = await axiosInstance.put(
        `${BASE_URL}/users/role/${id}`,
        { role, permissions },
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      console.error("❌ Role update error:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);




// ------------------ FETCH ALL USERS (Admin only) ------------------
export const fetchAllUsers = createAsyncThunk(
  'auth/fetchAllUsers',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/getall/user`,
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

// ------------------ REFRESH USER ROLE ------------------
export const refreshUserRole = createAsyncThunk(
  'auth/refreshUserRole',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('authToken');
      const userId = state.auth.userId || localStorage.getItem('userId');
      
      if (!token || !userId) {
        return rejectWithValue('No token or user ID available');
      }

      const response = await axiosInstance.get(`${BASE_URL}/user-profile/${userId}`, 
        configureHeaders(token)
      );
      
      const user = response.data.user || response.data;
      const role = user.role || 'admin';
      
      // Update localStorage
      localStorage.setItem('userRole', role);
      
      return { role, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 
        'Failed to refresh user role');
    }
  }
);

// ------------------ INITIAL STATE ------------------
const initialState = {
  userId: localStorage.getItem('userId') || null,
  token: localStorage.getItem('authToken') || null,
  restaurantId: localStorage.getItem('restaurantId') || null,
  categoryId: localStorage.getItem('categoryId') || null,
  role: localStorage.getItem('userRole') || 'admin',
  sessionStarted: localStorage.getItem('sessionStarted') === 'true',
  user: {
    id: localStorage.getItem('userId') || null,
    name: localStorage.getItem('userName') || null,
    email: localStorage.getItem('userEmail') || null,
    username: localStorage.getItem('username') || null,
    role: localStorage.getItem('userRole') || 'admin',
    permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]'),
  },
  users: [],
  loading: false,
  error: null,
};

// ------------------ SLICE ------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSessionStarted: (state, action) => {
      state.sessionStarted = action.payload;
      localStorage.setItem('sessionStarted', action.payload.toString());
    },
    localLogout: (state) => {
      state.userId = null;
      state.token = null;
      state.restaurantId = null;
      state.categoryId = null;
      state.role = 'admin';
      state.sessionStarted = false;
      state.user = {
        id: null,
        name: null,
        email: null,
        username: null,
        role: 'admin',
      };
      state.users = [];

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('restaurantId');
      localStorage.removeItem('userId');
      localStorage.removeItem('categoryId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userName');
      localStorage.removeItem('sessionStarted');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('username');

      toast.info('Logged out locally.', { autoClose: 3000 });
    },

    // Update current user role locally (useful for real-time updates)
    updateCurrentUserRole: (state, action) => {
      state.role = action.payload;
      state.user.role = action.payload;
      localStorage.setItem('userRole', action.payload);
    },

    // Clear error state
    clearError: (state) => {
      state.error = null;
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

        const { token, userId, restaurantId, user_id, restaurant_id, message, categoryId, category_id, user } = action.payload;

        state.token = token || null;
        state.userId = userId || user_id || null;
        state.restaurantId = restaurantId || restaurant_id || null;
        state.categoryId = categoryId || category_id || null;
        state.role = user?.role || 'admin';

        // Update user object
        if (user) {
          state.user = {
            id: user.userId || user.id || user._id || null,
            name: user.name || null,
            email: user.email || null,
            username: user.username || null,
            role: user.role || 'admin',
            permissions: user.permissions || [],
          };
          
          // Store permissions in localStorage
          if (user.permissions) {
            localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
          }
        }

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

        const { token, user_id, restaurant_id, userId, restaurantId, user } = action.payload;

        state.token = token || null;
        state.userId = userId || user_id || null;
        state.restaurantId = restaurantId || restaurant_id || null;
        state.role = user?.role || 'admin';

        // Update user object
        if (user) {
          state.user = {
            id: user.userId || user.id || user._id || null,
            name: user.name || null,
            email: user.email || null,
            username: user.username || null,
            role: user.role || 'admin',
            permissions: user.permissions || [],
          };
          
          // Store permissions in localStorage
          if (user.permissions) {
            localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
          }
        }

        if (token) localStorage.setItem('authToken', token);
        if (userId || user_id) localStorage.setItem('userId', userId || user_id);
        if (restaurantId || restaurant_id) localStorage.setItem('restaurantId', restaurantId || restaurant_id);
        if (user?.role) localStorage.setItem('userRole', user.role);

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
        state.role = 'admin';
        state.user = {
          id: null,
          name: null,
          email: null,
          username: null,
          role: 'admin',
        };
        state.users = [];

        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('restaurantId');
        localStorage.removeItem('userId');
        localStorage.removeItem('categoryId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('username');

        toast.info('You have been logged out.', { autoClose: 3000 });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Logout failed: ${action.payload}`, { autoClose: 3000 });
      })

      // --- FETCH USER PROFILE ---
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const userData = action.payload.user || action.payload;

        state.user = {
          ...state.user,
          ...userData,
          id: userData.userId || userData.id || userData._id || state.user.id,
          permissions: userData.permissions || state.user.permissions || [],
        };

        if (userData.role) {
          state.role = userData.role;
          localStorage.setItem('userRole', userData.role);
        }
        if (userData.permissions) {
          localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // --- RESTAURANT DETAILS ---
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurant = action.payload;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // --- FETCH ALL USERS ---
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.users = action.payload.users || action.payload || [];
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // --- UPDATE USER ROLE ---
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const { userId, role } = action.payload;

        // Update the user in the users array
        state.users = state.users.map(user =>
          user._id === userId || user.id === userId
            ? { ...user, role }
            : user
        );

        // If it's the current user's role being updated
        if (userId === state.userId || userId === localStorage.getItem('userId')) {
          state.role = role;
          state.user.role = role;
          localStorage.setItem('userRole', role);
          console.log('🔄 Updated current user role in Redux state:', role);
        }

        toast.success('User role updated successfully!', { autoClose: 3000 });
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to update role: ${action.payload}`, { autoClose: 3000 });
      })

      // --- REFRESH USER ROLE ---
      .addCase(refreshUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const { role, user } = action.payload;
        state.role = role;
        state.user.role = role;
        
        // Update user object if provided
        if (user) {
          state.user = {
            ...state.user,
            id: user.userId || user.id || user._id || state.user.id,
            name: user.name || state.user.name,
            email: user.email || state.user.email,
            username: user.username || state.user.username,
            role: role,
            permissions: user.permissions || state.user.permissions || [],
          };
        }

        console.log('🔄 Refreshed user role:', role);
      })
      .addCase(refreshUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to refresh user role:', action.payload);
      });
  }
});

// Export actions
export const { localLogout, updateCurrentUserRole, clearError, syncLocalStorage, setSessionStarted } = authSlice.actions;

// Selectors
export const selectAuth = (state) => ({
  token: state.auth.token,
  userId: state.auth.userId,
  restaurantId: state.auth.restaurantId,
  role: state.auth.role,
  user: state.auth.user,
});

export const selectCurrentUser = (state) => state.auth.user;
export const selectUserRole = (state) => state.auth.role;
export const selectAllUsers = (state) => state.auth.users;
export const selectIsAdmin = (state) => state.auth.role === 'admin';
export const selectIsWaiter = (state) => state.auth.role === 'waiter';

export default authSlice.reducer;
