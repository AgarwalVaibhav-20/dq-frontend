import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';
import { toast } from 'react-toastify';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
// Fetch QR codes by restaurant ID
export const fetchQrCodes = createAsyncThunk(
  'qr/fetchQrCodes',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/qr/allQr`, configureHeaders(token));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch QR codes');
    }
  }
);


export const createQrCode = createAsyncThunk(
  "qr/createQrCode",
  async ({ tableNumber, qrCodeUrl, token }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");
      if (!restaurantId) {
        return rejectWithValue("Restaurant ID is missing");
      }

      const response = await axios.post(
        `${BASE_URL}/qr/generate`, // ✅ match backend route
        { tableNumber, qrCodeUrl, restaurantId },
        configureHeaders(token)
      );

      // Your backend sends the created QR object directly
      const data = response.data;

      if (!data) {
        return rejectWithValue("Invalid response from server");
      }

      return {
        id: data._id,
        tableNumber: data.tableNumber,
        qrCodeUrl: data.qrCodeUrl,
        qrImage: data.qrImage,
        restaurantId: data.restaurantId,
      };
    } catch (error) {
      console.error("QR create error:", error);
      return rejectWithValue(
        error.response?.data?.message || "QR code creation failed"
      );
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
        console.log("Action payload" , action.payload)
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
