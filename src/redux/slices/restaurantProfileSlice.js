import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

// Helper: Get auth headers
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
// ------------------ GET: Fetch restaurant profile ------------------
export const getRestaurantProfile = createAsyncThunk(
  'restaurantProfile/getRestaurantProfile',
  async ({ _, token }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Fetching profile for userId:', userId);
      console.log('Using token:', token ? 'Present' : 'Missing');
      console.log('API URL:', `${BASE_URL}/account/${userId}`);

      const response = await axios.get(`${BASE_URL}/account/${userId}`, configureHeaders(token));
      console.log("Restaurant profile API response:", response.data);
      console.log("Response status:", response.status);

      // Handle different response structures
      let profileData;
      if (response.data.data) {
        profileData = response.data.data;
      } else if (response.data.user) {
        profileData = response.data.user;
      } else if (response.data.success && response.data.data) {
        profileData = response.data.data;
      } else {
        profileData = response.data;
      }

      console.log("Extracted profile data:", profileData);
      return profileData;
    } catch (error) {
      console.error("Error fetching restaurant profile:", error);
      console.error("Error response:", error.response?.data);

      // If API fails, try to load from localStorage as fallback
      try {
        const savedProfile = localStorage.getItem('restaurantProfile');
        if (savedProfile) {
          console.log("Loading profile from localStorage as fallback");
          return JSON.parse(savedProfile);
        }
      } catch (localStorageError) {
        console.error("Error loading from localStorage:", localStorageError);
      }

      let message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong while fetching restaurant profile';

      return rejectWithValue(message);
    }
  }
)


// ------------------ GET: Check restaurant permission ------------------
export const checkRestaurantPermission = createAsyncThunk(
  'restaurantProfile/checkRestaurantPermission',
  async ({ userIdOfUser, token }, { rejectWithValue }) => {
    try {
      // Use the passed userIdOfUser or fall back to localStorage
      const userId = userIdOfUser || localStorage.getItem("userId");
      const authToken = token || localStorage.getItem("authToken");

      if (!userId) {
        throw new Error("No user ID found");
      }

      if (!authToken) {
        throw new Error("No authentication token found");
      }

      // console.log("Permission check - userId:", userId);
      // console.log("Permission check - token exists:", !!authToken);

      const response = await axios.get(
        `${BASE_URL}/check-permission/${userId}`,
        configureHeaders(authToken)
      );

      // console.log("Permission response:", response.data);
      return response.data;
    } catch (error) {
      // console.log("Permission check error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// ------------------ PUT: Update restaurant profile ------------------
export const updateRestaurantProfile = createAsyncThunk(
  'restaurantProfile/updateRestaurantProfile',
  async (profileData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');

      // ✅ Get userId from localStorage (or Redux)
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('No userId found');

      console.log('Updating profile with data:', profileData);
      console.log('User ID:', userId);
      console.log('Profile data keys:', Object.keys(profileData));
      console.log('Profile data values:', Object.values(profileData));

      // Extract the actual profile data from the nested structure
      const actualProfileData = profileData.profileData || profileData;
      console.log('Sending actual profile data to backend:', actualProfileData);

      const response = await axios.put(
        `${BASE_URL}/user/update/${userId}`,
        actualProfileData,
        configureHeaders(token)
      );

      console.log("Profile update response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      // Don't refresh immediately, let the state update handle it
      // The profile will be updated in the fulfilled case below
      
      return response.data;
    } catch (error) {
      console.log("Profile update error:", error);
      return rejectWithValue(error.response?.data || error.message || 'Something went wrong');
    }
  }
);

// ------------------ PUT: Update restaurant FCM token ------------------
export const updateRestaurantFCM = createAsyncThunk(
  'restaurantProfile/updateFCM',
  async ({ id, fcm }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/account/restaurant/updateFcm/${id}`,
        fcm,
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);

// ------------------ POST: Upload restaurant image ------------------
export const uploadRestaurantImage = createAsyncThunk(
  'restaurantProfile/uploadRestaurantImage',
  async ({ id, imageFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await axios.post(
        `${BASE_URL}/account/profile/${id}/image`,
        formData,
        { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Image upload failed');
    }
  }
);

// ------------------ SLICE ------------------
const restaurantProfileSlice = createSlice({
  name: 'restaurantProfile',
  initialState: {
    restaurantProfile: (() => {
      try {
        const savedProfile = localStorage.getItem('restaurantProfile');
        return savedProfile ? JSON.parse(savedProfile) : null;
      } catch (error) {
        console.error('Error loading profile from localStorage:', error);
        return null;
      }
    })(),
    loading: false,
    error: null,
    restaurantPermission: null,
    fcmToken: null,
    fcmUpdateStatus: 'idle',
  },
  reducers: {
    resetFCMStatus: (state) => {
      state.fcmUpdateStatus = 'idle';
      state.error = null;
    },
    updateProfileLocally: (state, action) => {
      const updatedProfile = {
        ...state.restaurantProfile,
        ...action.payload,
        updatedAt: new Date().toISOString(),
        lastModified: Date.now()
      };
      state.restaurantProfile = updatedProfile;
      
      try {
        localStorage.setItem('restaurantProfile', JSON.stringify(updatedProfile));
        console.log('Profile updated locally and saved to localStorage:', updatedProfile);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    clearProfile: (state) => {
      state.restaurantProfile = null;
      localStorage.removeItem('restaurantProfile');
    },
    debugProfile: (state) => {
      console.log('=== PROFILE DEBUG INFO ===');
      console.log('Current profile state:', state.restaurantProfile);
      console.log('localStorage profile:', localStorage.getItem('restaurantProfile'));
      console.log('Profile state keys:', state.restaurantProfile ? Object.keys(state.restaurantProfile) : 'No profile');
      console.log('localStorage keys:', localStorage.getItem('restaurantProfile') ? Object.keys(JSON.parse(localStorage.getItem('restaurantProfile'))) : 'No localStorage data');
      console.log('========================');
    },
    forceLoadProfile: (state) => {
      try {
        const savedProfile = localStorage.getItem('restaurantProfile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          state.restaurantProfile = profileData;
          console.log('Profile loaded from localStorage:', profileData);
        } else {
          console.log('No profile found in localStorage');
        }
      } catch (error) {
        console.error('Error loading profile from localStorage:', error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get restaurant profile
      .addCase(getRestaurantProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRestaurantProfile.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Restaurant profile fetched:", action.payload);
        
        // The payload is already processed in the thunk
        const profileData = action.payload;
        
        if (profileData && typeof profileData === 'object') {
          state.restaurantProfile = profileData;
          
          // Save to localStorage for persistence
          localStorage.setItem('restaurantProfile', JSON.stringify(profileData));
          console.log("Profile saved to localStorage:", profileData);
          console.log("Profile keys:", Object.keys(profileData));
        } else {
          console.warn("Invalid profile data received:", profileData);
          console.warn("Profile data type:", typeof profileData);
          // Keep existing profile if new data is invalid
        }
        
        console.log("Profile stored in state:", state.restaurantProfile);
      })

      .addCase(getRestaurantProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        
        // Try to load from localStorage as fallback
        try {
          const savedProfile = localStorage.getItem('restaurantProfile');
          if (savedProfile) {
            const profileData = JSON.parse(savedProfile);
            state.restaurantProfile = profileData;
            console.log("Loaded profile from localStorage as fallback:", profileData);
            toast.warning('Using cached profile data. Please check your connection.');
          } else {
            console.error("No cached profile found");
            toast.error('Failed to fetch restaurant profile.');
          }
        } catch (localStorageError) {
          console.error("Error loading from localStorage:", localStorageError);
          toast.error('Failed to fetch restaurant profile.');
        }
      })

      // Check restaurant permission
      .addCase(checkRestaurantPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkRestaurantPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurantPermission = action.payload;
      })
      .addCase(checkRestaurantPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to check restaurant permission.');
      })

      // Update restaurant profile
      .addCase(updateRestaurantProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRestaurantProfile.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Profile update response:', action.payload);
        
        // Handle different response structures
        let updatedProfile;
        console.log("Processing update response:", action.payload);
        
        if (action.payload.data) {
          // If response has data property
          updatedProfile = action.payload.data;
          console.log("Using data property:", updatedProfile);
        } else if (action.payload.user) {
          // If response has user property
          updatedProfile = action.payload.user;
          console.log("Using user property:", updatedProfile);
        } else if (action.payload.success && action.payload.data) {
          // If response has success and data
          updatedProfile = action.payload.data;
          console.log("Using success.data property:", updatedProfile);
        } else {
          // If response is the profile object directly
          updatedProfile = action.payload;
          console.log("Using direct payload:", updatedProfile);
        }
        
        // Update the profile in state
        if (updatedProfile && typeof updatedProfile === 'object') {
          console.log("Current state profile:", state.restaurantProfile);
          console.log("Updated profile data:", updatedProfile);
          
          // Merge the updated profile with existing profile data
          const mergedProfile = {
            ...state.restaurantProfile,
            ...updatedProfile,
            // Ensure critical fields are preserved
            userId: state.restaurantProfile?.userId || updatedProfile.userId,
            _id: state.restaurantProfile?._id || updatedProfile._id,
            // Ensure timestamps are updated
            updatedAt: new Date().toISOString(),
            lastModified: Date.now()
          };
          
          console.log("Merged profile:", mergedProfile);
          state.restaurantProfile = mergedProfile;
          
          // Also save to localStorage for persistence
          try {
            localStorage.setItem('restaurantProfile', JSON.stringify(mergedProfile));
            console.log('Profile saved to localStorage successfully');
          } catch (localStorageError) {
            console.error('Error saving to localStorage:', localStorageError);
          }
          
          console.log('Profile updated in state:', mergedProfile);
          toast.success('Profile updated successfully.');
        } else {
          console.error('Invalid profile data received:', action.payload);
          console.error('Updated profile:', updatedProfile);
          console.error('Full action payload:', action);
          toast.error('Profile updated but data format is invalid.');
        }
      })
      .addCase(updateRestaurantProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to update profile.');
      })

      // Upload restaurant image
      .addCase(uploadRestaurantImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadRestaurantImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.restaurantProfile) {
          state.restaurantProfile.image = action.payload.image;
        }
        toast.success('Image uploaded successfully.');
      })
      .addCase(uploadRestaurantImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to upload image.');
      })

      // Update restaurant FCM token
      .addCase(updateRestaurantFCM.pending, (state) => {
        state.fcmUpdateStatus = 'loading';
        state.error = null;
      })
      .addCase(updateRestaurantFCM.fulfilled, (state, action) => {
        state.fcmUpdateStatus = 'succeeded';
        state.fcmToken = action.payload.fcmToken;

        if (state.restaurantProfile) {
          state.restaurantProfile.fcmToken = action.payload.fcmToken;
        }

        toast.success('FCM token updated successfully.');
      })
      .addCase(updateRestaurantFCM.rejected, (state, action) => {
        state.fcmUpdateStatus = 'failed';
        state.error = action.payload;
        toast.error('Failed to update FCM token.');
      });
  },
});

export const { resetFCMStatus, updateProfileLocally, clearProfile, debugProfile, forceLoadProfile } = restaurantProfileSlice.actions;
export default restaurantProfileSlice.reducer;
