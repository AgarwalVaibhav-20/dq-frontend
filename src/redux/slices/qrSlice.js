import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

import { BASE_URL } from '../../utils/constants'

// ------------------ Thunks ------------------
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

// Add Table with QR
export const addTable = createAsyncThunk(
  "qr/addTable",
  async ({ restaurantId, floorId, tableNumber }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log('Making API call with:', { restaurantId, floorId, tableNumber });

      const res = await axios.post(
        `${BASE_URL}/create/qrcode`,
        { restaurantId, floorId, tableNumber },
        configureHeaders(token)
      );

      console.log('API Response:', res.data);

      if (res.data.success) {
        toast.success("QR Code generated successfully");
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'API returned success: false');
      }
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to generate QR code");
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Get All QR codes (optional filters: restaurantId, floorId)
export const getQrs = createAsyncThunk(
  "qr/getQrs",
  async ({ restaurantId, floorId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const config = {
        ...configureHeaders(token),
        params: {}
      };

      // Only add params if they exist
      if (restaurantId) config.params.restaurantId = restaurantId;
      if (floorId) config.params.floorId = floorId;

      const res = await axios.get(`${BASE_URL}/qrcodes/all`, config);
      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'Failed to fetch QRs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch QRs");
      return rejectWithValue(err.response?.data || { message: "Unknown error" });
    }
  }
);

// Get tables by floor
export const getTablesByFloor = createAsyncThunk(
  "qr/getTablesByFloor",
  async (floorId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${BASE_URL}/qrcodes/floor/${floorId}`, configureHeaders(token));

      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'Failed to fetch tables');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch tables");
      return rejectWithValue(err.response?.data);
    }
  }
);

// Redux Thunk
export const deleteQr = createAsyncThunk(
  "qr/deleteQr",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("❌ No auth token found");
        throw new Error("Authentication token not found");
      }

      console.log("🌐 Making DELETE request to:", `${BASE_URL}/delete/qrcodes/${id}`);
      console.log("🔑 Token present:", !!token);

      const res = await axios.delete(
        `${BASE_URL}/delete/qrcodes/${id}`,
        configureHeaders(token)
      );

      console.log("📡 Delete API response:", res.data);
      console.log("📊 Response status:", res.status);

      if (res.data.success) {
        console.log("✅ Delete successful in API");
        toast.success("QR deleted successfully");
        return id; // return ID so reducer can remove from state
      } else {
        console.error("❌ Delete failed - success: false");
        throw new Error(res.data.message || "Failed to delete QR");
      }
    } catch (err) {
      console.error("❌ Delete API error:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete QR";
      toast.error(errorMessage);
      return rejectWithValue(err.response?.data || { message: errorMessage });
    }
  }
);


// ------------------ Slice ------------------
const qrSlice = createSlice({
  name: "qr",
  initialState: {
    qrList: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Clear QR list
    clearQrList: (state) => {
      state.qrList = [];
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Add Table
      .addCase(addTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTable.fulfilled, (state, action) => {
        state.loading = false;
        state.qrList.push(action.payload);
      })
      .addCase(addTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get QRs - FIXED: Now uses qrList consistently
      .addCase(getQrs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQrs.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Fetched QRs:", action.payload);
        state.qrList = action.payload;
      })
      .addCase(getQrs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch QRs";
      })

      // Get Tables by Floor
      .addCase(getTablesByFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTablesByFloor.fulfilled, (state, action) => {
        state.loading = false;
        state.qrList = action.payload;
      })
      .addCase(getTablesByFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete QR
      .addCase(deleteQr.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQr.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted QR from the list
        state.qrList = state.qrList.filter((qr) => qr._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteQr.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearQrList, clearError } = qrSlice.actions;
export default qrSlice.reducer;

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { BASE_URL } from '../../utils/constants';
// import { toast } from 'react-toastify';

// const configureHeaders = (token) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   },
// })
// // Fetch QR codes by restaurant ID
// export const fetchQrCodes = createAsyncThunk(
//   'qr/fetchQrCodes',
//   async (token, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(`${BASE_URL}/qr/allQr`, configureHeaders(token));
//       return response.data.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch QR codes');
//     }
//   }
// );


// export const createQrCode = createAsyncThunk(
//   "qr/createQrCode",
//   async ({ tableNumber, qrCodeUrl, token }, { rejectWithValue }) => {
//     try {
//       const restaurantId = localStorage.getItem("restaurantId");
//       if (!restaurantId) {
//         return rejectWithValue("Restaurant ID is missing");
//       }

//       const response = await axios.post(
//         `${BASE_URL}/create/qr/generate`, // ✅ match backend route
//         { tableNumber, qrCodeUrl, restaurantId },
//         configureHeaders(token)
//       );

//       // Your backend sends the created QR object directly
//       const data = response.data;

//       if (!data) {
//         return rejectWithValue("Invalid response from server");
//       }

//       return {
//         id: data._id,
//         tableNumber: data.tableNumber,
//         qrCodeUrl: data.qrCodeUrl,
//         qrImage: data.qrImage,
//         restaurantId: data.restaurantId,
//       };
//     } catch (error) {
//       console.error("QR create error:", error);
//       return rejectWithValue(
//         error.response?.data?.message || "QR code creation failed"
//       );
//     }
//   }
// );





// // Delete QR code
// export const deleteQrCode = createAsyncThunk(
//   'qr/deleteQrCode',
//   async (id, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const headers = {
//         Authorization: `Bearer ${token}`,
//       };

//       await axios.delete(`${BASE_URL}/qr/delete/${id}`, { headers });
//       return id; // Return the deleted QR's ID
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to delete QR code');
//     }
//   }
// );

// // QR slice
// const qrSlice = createSlice({
//   name: 'qr',
//   initialState: {
//     qrList: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchQrCodes.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchQrCodes.fulfilled, (state, action) => {
//         state.loading = false;
//         state.qrList = action.payload;
//       })
//       .addCase(fetchQrCodes.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
//       })

//       .addCase(createQrCode.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createQrCode.fulfilled, (state, action) => {
//         state.loading = false;
//         console.log("Action payload" , action.payload)
//         state.qrList.push(action.payload); // Add the newly created QR to the list
//         toast.success('QR code generated successfully!', { autoClose: 3000 });
//       })
//       .addCase(createQrCode.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
//       })

//       .addCase(deleteQrCode.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteQrCode.fulfilled, (state, action) => {
//         state.loading = false;
//         state.qrList = state.qrList.filter((qr) => qr.id !== action.payload);
//         toast.success('QR code deleted successfully!', { autoClose: 3000 });
//       })
//       .addCase(deleteQrCode.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(`Error: ${action.payload}`, { autoClose: 3000 });
//       });
//   },
// });

// export default qrSlice.reducer;
