import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

// Fetch banners for the specific restaurant
export const fetchBanners = createAsyncThunk(
  'banner/fetchBanners',
  async ({ token, restaurantId }, thunkAPI) => { // Ensure restaurantId is received here
    try {
      // Pass restaurantId as a query parameter
      const response = await axios.get(`${BASE_URL}/admin/banners?restaurantId=${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch banners')
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Create banner
export const createBanner = createAsyncThunk(
  'banner/createBanner',
  async ({ banner_1, banner_2, banner_3, restaurantId, token }, thunkAPI) => {
    try {
      const formData = new FormData()
      formData.append('restaurantId', restaurantId)

      if (!banner_1) {
        throw new Error('banner_1 is required')
      }
      formData.append('banner_1', banner_1)

      if (banner_2) {
        formData.append('banner_2', banner_2)
      }
      if (banner_3) {
        formData.append('banner_3', banner_3)
      }

      const response = await axios.post(`${BASE_URL}/admin/banners/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Banner created successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to create banner')
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Update banner
export const updateBanner = createAsyncThunk(
  'banner/updateBanner',
  async ({ id, banner_1, banner_2, banner_3, restaurantId, token }, thunkAPI) => {
    try {
      const formData = new FormData()
      formData.append('restaurantId', restaurantId)

      if (banner_1 instanceof File) {
        formData.append('banner_1', banner_1)
      } else if (typeof banner_1 === 'string' && banner_1) {
        formData.append('banner_1_url', banner_1)
      }

      if (banner_2 instanceof File) {
        formData.append('banner_2', banner_2)
      } else if (typeof banner_2 === 'string' && banner_2) {
        formData.append('banner_2_url', banner_2)
      }

      if (banner_3 instanceof File) {
        formData.append('banner_3', banner_3)
      } else if (typeof banner_3 === 'string' && banner_3) {
        formData.append('banner_3_url', banner_3)
      }

      const response = await axios.post(`${BASE_URL}/admin/banners/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Banner updated successfully!')
      return response.data
    } catch (error) {
      toast.error('Failed to update banner')
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Delete banner
export const deleteBanner = createAsyncThunk(
  'banner/deleteBanner',
  async ({ id, token }, thunkAPI) => {
    try {
      await axios.delete(`${BASE_URL}/admin/banners/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success('Banner deleted successfully!')
      return id
    } catch (error) {
      toast.error('Failed to delete banner')
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const bannerSlice = createSlice({
  name: 'banner',
  initialState: {
    banners: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false
        state.banners = action.payload
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createBanner.pending, (state) => {
        state.loading = true
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners.push(action.payload)
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateBanner.pending, (state) => {
        state.loadingUpdate= true
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.loadingUpdate = false
        const index = state.banners.findIndex((b) => b.id === action.payload.id)
        if (index !== -1) {
          state.banners[index] = action.payload
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.loadingUpdate = false
        state.error = action.payload
      })
      .addCase(deleteBanner.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners = state.banners.filter((b) => b.id !== action.payload)
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default bannerSlice.reducer