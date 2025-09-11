import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
export const fetchDeliveryTimings = createAsyncThunk(
  'deliveryTiming/fetchDeliveryTimings',
  async ({ token, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/delivery-timings/${restaurantId}`,
        configureHeaders(token)
      );
      return response.data.deliveries; // matches backend response
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch delivery timings';
      return rejectWithValue(message);
    }
  }
);



export const addDeliveryTiming = createAsyncThunk(
  'deliveryTiming/addDeliveryTiming',
  async ({ start_time, end_time, delivery_status, token }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axios.post(
        `${BASE_URL}/assign`,
        { restaurantId, start_time, end_time, delivery_status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add delivery timing';
      return rejectWithValue(message);
    }
  }
);


export const deleteDeliveryTiming = createAsyncThunk(
  'deliveryTiming/deleteDeliveryTiming',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete delivery timing';
      return rejectWithValue(message);
    }
  }
);

export const updateDeliveryTimingStatus = createAsyncThunk(
  'deliveryTiming/updateDeliveryTimingStatus',
  async ({ id, delivery_status, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/delivery-timings/${id}/status`,
        { delivery_status }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.delivery; // backend sends { delivery }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to update delivery timing status';
      return rejectWithValue(message);
    }
  }
);


const deliveryTimingSlice = createSlice({
  name: 'deliveryTimings',
  initialState: {
    deliveryTimings: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryTimings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryTimings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveryTimings = action.payload;
      })
      .addCase(fetchDeliveryTimings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(addDeliveryTiming.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDeliveryTiming.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveryTimings = [...state.deliveryTimings, action.payload];
      })
      .addCase(addDeliveryTiming.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteDeliveryTiming.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDeliveryTiming.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveryTimings = state.deliveryTimings.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteDeliveryTiming.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDeliveryTimingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDeliveryTimingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const { id, status } = action.payload;
        const timing = state.deliveryTimings.find((item) => item.id === id);
        if (timing) {
          timing.delivery_status = status;
        }
      })
      .addCase(updateDeliveryTimingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = deliveryTimingSlice.actions;
export default deliveryTimingSlice.reducer;
