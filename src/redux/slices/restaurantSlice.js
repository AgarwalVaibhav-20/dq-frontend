import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';
import { toast } from 'react-toastify';

// -------------------- Helpers -------------------- //
const configureHeaders = (token, isFormData = false) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
  },
});

// -------------------- Async Thunks -------------------- //

// Fetch all restaurants
//they are working
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchAll',
  async ({ token }, { rejectWithValue }) => {
    try {
        const token=localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL}/all/restaurants`, configureHeaders(token));
      return response.data.restaurants;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch restaurants');
    }
  }
);

// Create restaurant
export const createRestaurant = createAsyncThunk(
  'restaurants/create',
  async ({ formData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/create/restaurants`, formData, configureHeaders(token, true));
      return response.data.restaurant;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create restaurant');
    }
  }
);

// Update restaurant
export const updateRestaurant = createAsyncThunk(
  'restaurants/update',
  async ({ id, formData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/restaurants/update/${id}`, formData, configureHeaders(token, true));
      return response.data.restaurant;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update restaurant');
    }
  }
);

// Delete restaurant
export const deleteRestaurant = createAsyncThunk(
  'restaurants/delete',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/restaurants/delete/${id}`, configureHeaders(token));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete restaurant');
    }
  }
);

// Update restaurant status
export const updateRestaurantStatus = createAsyncThunk(
  'restaurants/updateStatus',
  async ({ id, status, token }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/restaurants/${id}/status`,
        { status },
        configureHeaders(token)
      );
      return response.data.restaurant;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

// -------------------- Slice -------------------- //
const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    restaurants: [],
    selectedRestaurant: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedRestaurant: (state) => {
      state.selectedRestaurant = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchRestaurants.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRestaurants.fulfilled, (state, action) => { state.loading = false; state.restaurants = action.payload; })
      .addCase(fetchRestaurants.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload); })

      // Create
      .addCase(createRestaurant.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants.push(action.payload);
        toast.success('Restaurant created successfully!');
      })
      .addCase(createRestaurant.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload); })

      // Update
      .addCase(updateRestaurant.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = state.restaurants.map(r => r._id === action.payload._id ? action.payload : r);
        toast.success('Restaurant updated successfully!');
      })
      .addCase(updateRestaurant.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload); })

      // Delete
      .addCase(deleteRestaurant.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = state.restaurants.filter(r => r._id !== action.payload);
        toast.success('Restaurant deleted successfully!');
      })
      .addCase(deleteRestaurant.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload); })

      // Update Status
      .addCase(updateRestaurantStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateRestaurantStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = state.restaurants.map(r => r._id === action.payload._id ? action.payload : r);
        toast.success(`Restaurant status updated successfully!`);
      })
      .addCase(updateRestaurantStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload); });
  },
});

export const { clearSelectedRestaurant, clearError } = restaurantSlice.actions;
export default restaurantSlice.reducer;
