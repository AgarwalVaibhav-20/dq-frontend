import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const configureFormDataHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
});

// Fetch banners for the specific restaurant
export const fetchBanners = createAsyncThunk(
  'banner/fetchBanners',
  async ({ token }, thunkAPI) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      // Remove restaurantId from query since it's handled by backend authentication
      const response = await axios.get(`${BASE_URL}/all/banner`, {
        params: { restaurantId },
        ...configureHeaders(token)
      })
      return response.data.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch banners';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage)
    }
  }
)

// Create banner
export const createBanner = createAsyncThunk(
  'banner/createBanner',
  async ({ banner_1, banner_2, banner_3, restaurantId, token }, thunkAPI) => {
    try {
      // const formData = new FormData();

      // if (!banner_1) {
      //   throw new Error('banner_1 is required');
      // }
      // formData.append('banner_1', banner_1);

      // if (banner_2) {
      //   formData.append('banner_2', banner_2);
      // }
      // if (banner_3) {
      //   formData.append('banner_3', banner_3);
      // }

      // Add restaurantId
      // if (!restaurantId) {
      //   throw new Error('restaurantId is required');
      // }
      // formData.append('restaurantId', restaurantId);

      const response = await axios.post(
        `${BASE_URL}/create/banner-images`,
        { banner_1, banner_2, banner_3, restaurantId },
        configureFormDataHeaders(token)
      );

      toast.success('Banner created successfully!');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create banner';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);


// Update banner
export const updateBanner = createAsyncThunk(
  'banner/updateBanner',
  async ({ id, banner_1, banner_2, banner_3, token, restaurantId }, thunkAPI) => {
    try {
      const formData = new FormData();

      // Append restaurantId if it's available
      if (restaurantId) {
        formData.append('restaurantId', restaurantId);
      }

      // Handle banner_1: Append the file if it's new, or the URL if it's an existing image.
      if (banner_1 instanceof File) {
        formData.append('banner_1', banner_1);
      } else if (typeof banner_1 === 'string' && banner_1) {
        formData.append('banner_1_url', banner_1);
      }

      // Handle banner_2
      if (banner_2 instanceof File) {
        formData.append('banner_2', banner_2);
      } else if (typeof banner_2 === 'string' && banner_2) {
        formData.append('banner_2_url', banner_2);
      }

      // Handle banner_3
      if (banner_3 instanceof File) {
        formData.append('banner_3', banner_3);
      } else if (typeof banner_3 === 'string' && banner_3) {
        formData.append('banner_3_url', banner_3);
      }

      const response = await axios.put(
        `${BASE_URL}/admin/banners/update/${id}`,
        formData,
        configureFormDataHeaders(token)
      );

      toast.success('Banner updated successfully!');
      return response.data.data;
    } catch (error) {
      console.log(error, "Updating banner error");
      const errorMessage = error.response?.data?.message || 'Failed to update banner';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);
// Delete banner
export const deleteBanner = createAsyncThunk(
  'banner/deleteBanner',
  async ({ id, token }, thunkAPI) => {
    try {
      await axios.delete(`${BASE_URL}/admin/banners/${id}`, configureHeaders(token))
      toast.success('Banner deleted successfully!')
      return id
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete banner';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage)
    }
  }
)

const bannerSlice = createSlice({
  name: 'banner',
  initialState: {
    banners: [],
    loading: false,
    loadingUpdate: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch banners
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false
        state.banners = action.payload || []
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create banner
      .addCase(createBanner.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners.push(action.payload)
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update banner
      .addCase(updateBanner.pending, (state) => {
        state.loadingUpdate = true
        state.error = null
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.loadingUpdate = false
        const index = state.banners.findIndex((b) => b._id === action.payload._id)
        if (index !== -1) {
          state.banners[index] = action.payload
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.loadingUpdate = false
        state.error = action.payload
      })

      // Delete banner
      .addCase(deleteBanner.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners = state.banners.filter((b) => b._id !== action.payload)
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = bannerSlice.actions
export default bannerSlice.reducer
