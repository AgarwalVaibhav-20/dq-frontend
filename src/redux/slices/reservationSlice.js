import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const fetchReservations = createAsyncThunk(
  'reservations/fetchReservations',
  async ({ restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/reservations/all`, {
        params: { restaurantId },
        ...configureHeaders(token),
      });
      console.log('✅ Reservations fetched:', response.data);
      const reservations = Array.isArray(response.data.reservations)
        ? response.data.reservations || response.data
        : [];
      if (!reservations.length) {
        console.warn('No reservations found in response:', response.data);
      }
      return reservations;
    } catch (error) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (!error.response) {
        return rejectWithValue('Network error: Unable to connect to the server');
      }
      if (error.response?.status === 401) {
        return rejectWithValue('Unauthorized: Please log in again');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reservations');
    }
  }
);

export const addReservation = createAsyncThunk(
  'reservations/addReservation',
  async ({ startTime, endTime, customerId, payment, advance, notes, tableNumber, restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/reservations/add`,
        { restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber },
        configureHeaders(token)
      );
      if (!response.data?.reservation) {
        throw new Error('Invalid response structure');
      }
      return response.data;
    } catch (error) {
      console.error('❌ Add reservation error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add reservation');
    }
  }
);

export const updateReservation = createAsyncThunk(
  'reservations/updateReservation',
  async ({ id, restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/reservations/${id}`,
        { restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber },
        configureHeaders(token)
      );
      if (!response.data?.reservation) {
        throw new Error('Invalid response structure');
      }
      return response.data.reservation;
    } catch (error) {
      console.error('❌ Update reservation error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update reservation');
    }
  }
);

export const deleteReservation = createAsyncThunk(
  'reservations/deleteReservation',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/reservations/${id}`, configureHeaders(token));
      return { id, message: response.data.message };
    } catch (error) {
      console.error('❌ Delete reservation error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reservation');
    }
  }
);

const reservationSlice = createSlice({
  name: 'reservations',
  initialState: {
    reservations: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        console.log('🎯 Redux: Fetch reservations succeeded', {
          count: action.payload?.length,
          data: action.payload,
        });
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('🎯 Redux: Fetch reservations failed', {
          error: action.payload,
        });
      })
      .addCase(addReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = [...state.reservations, action.payload.reservation];
      })
      .addCase(addReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.loading = false;
        const updatedReservation = action.payload;
        const index = state.reservations.findIndex(
          (reservation) => reservation._id === updatedReservation._id
        );
        if (index !== -1) {
          state.reservations[index] = updatedReservation;
        }
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = state.reservations.filter(
          (reservation) => reservation._id !== action.payload.id
        );
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reservationSlice.reducer;