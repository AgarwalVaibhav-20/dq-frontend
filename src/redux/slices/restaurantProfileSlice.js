import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

// Helper: Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ------------------ GET: Fetch restaurant profile ------------------
export const getRestaurantProfile = createAsyncThunk(
  'restaurantProfile/getRestaurantProfile',
  async ({ userId }, { rejectWithValue }) => {
    try {
      console.log(`${BASE_URL}/account/${userId}`);
      const response = await axios.get(
        `${BASE_URL}/account/${userId}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.user?._id) {
        localStorage.setItem("userId", response.data.user._id);
      }
      console.log(response)
      console.log("Restaurant profile fetched:", response.data);
      return response.data;
    } catch (error) {
      console.log("Error fetching restaurant profile:", error);
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);

// ------------------ GET: Check restaurant permission ------------------
export const checkRestaurantPermission = createAsyncThunk(
  'restaurantProfile/checkRestaurantPermission',
  async (_, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem("userId"); // ✅ auto get
      if (!userId) throw new Error("No userId found");

      const response = await axios.get(
        `${BASE_URL}/account/user-profile/check-permission/${userId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);


// ------------------ PUT: Update restaurant profile ------------------
export const updateRestaurantProfile = createAsyncThunk(
  'restaurantProfile/updateRestaurantProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');

      // ✅ Get userId from localStorage (or Redux)
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('No userId found');

      const response = await axios.put(
        `${BASE_URL}/account/user/update/${userId}`,
        profileData,
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );

      console.log("Profile updated:", response.data);
      return response.data;
    } catch (error) {
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
    restaurantProfile: null,
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
        state.restaurantProfile = action.payload;
      })
      .addCase(getRestaurantProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to fetch restaurant profile.');
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
        state.restaurantProfile = action.payload;
        toast.success('Profile updated successfully.');
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

export const { resetFCMStatus } = restaurantProfileSlice.actions;
export default restaurantProfileSlice.reducer;
