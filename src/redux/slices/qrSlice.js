import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';
import { toast } from 'react-toastify';

// Fetch QR codes by restaurant ID
export const fetchQrCodes = createAsyncThunk(
  'qr/fetchQrCodes',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
       console.log("🔑 Token being sent:", token);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${BASE_URL}/qr/${restaurantId}`, { headers });
      return response.data; // Returns the array of QR objects
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch QR codes');
    }
  }
);

// Create QR code
export const createQrCode = createAsyncThunk(
  'qr/createQrCode',
  async ({ restaurantId, tableNo }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${BASE_URL}/qr/create`,
        { restaurantId, tableNo },
        { headers }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'QR code creation failed');
    }
  }
);

// Delete QR code
export const deleteQrCode = createAsyncThunk(
  'qr/deleteQrCode',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.delete(`${BASE_URL}/qr/delete/${id}`, { headers });
      return id; // Return the deleted QR's ID
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete QR code');
    }
  }
);

// QR slice
const qrSlice = createSlice({
  name: 'qr',
  initialState: {
    qrList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQrCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQrCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.qrList = action.payload;
      })
      .addCase(fetchQrCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
      })

      .addCase(createQrCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQrCode.fulfilled, (state, action) => {
        state.loading = false;
        state.qrList.push(action.payload); // Add the newly created QR to the list
        toast.success('QR code generated successfully!', { autoClose: 3000 });
      })
      .addCase(createQrCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
      })

      .addCase(deleteQrCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQrCode.fulfilled, (state, action) => {
        state.loading = false;
        state.qrList = state.qrList.filter((qr) => qr.id !== action.payload);
        toast.success('QR code deleted successfully!', { autoClose: 3000 });
      })
      .addCase(deleteQrCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
      });
  },
});

export default qrSlice.reducer;
