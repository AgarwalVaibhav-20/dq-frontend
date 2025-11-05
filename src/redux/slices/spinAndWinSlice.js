import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from 'react-toastify';
import { BASE_URL } from "../../utils/constants";

// ➤ Create a new Wheel
export const createWheel = createAsyncThunk(
  "spinAndWin/createWheel",
  async (wheelData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const restaurantId = localStorage.getItem("restaurantId");
      
      if (!restaurantId) {
        toast.error("Restaurant ID not found");
        return rejectWithValue("Restaurant ID not found");
      }
      
      const response = await axios.post(
        `${BASE_URL}/api/wheel/create`, 
        { ...wheelData, restaurantId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Wheel created:", response.data);
      return response.data.wheel;
    } catch (err) {
      console.error("Error creating wheel:", err);
      const errorMsg = err.response?.data?.message || "Failed to create wheel";
      return rejectWithValue(errorMsg);
    }
  }
);

// ➤ Fetch all Wheels (for current restaurant)
export const fetchAllWheels = createAsyncThunk(
  "spinAndWin/fetchAllWheels",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const restaurantId = localStorage.getItem("restaurantId");

      if (!restaurantId) {
        return rejectWithValue("Restaurant ID not found");
      }

      // Use public endpoint if no token (for customer-facing spin page)
      // Use authenticated endpoint if token exists (for admin panel)
      const endpoint = token ? `${BASE_URL}/api/wheel/all` : `${BASE_URL}/api/wheel/public`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(endpoint, {
        params: { restaurantId, isActive: true },
        headers: headers,
      });

      console.log("Fetched wheels:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching wheels:", err);
      const errorMsg = err.response?.data?.message || "Failed to fetch wheels";
      return rejectWithValue(errorMsg);
    }
  }
);

// ➤ Fetch single Wheel
export const fetchWheelById = createAsyncThunk(
  "spinAndWin/fetchWheelById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${BASE_URL}/single/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched wheel:", response.data);
      return response.data.wheel;
    } catch (err) {
      console.error("Error fetching wheel:", err);
      const errorMsg = err.response?.data?.message || "Failed to fetch wheel";
      return rejectWithValue(errorMsg);
    }
  }
);

// ➤ Update Wheel
export const updateWheel = createAsyncThunk(
  "spinAndWin/updateWheel",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${BASE_URL}/api/wheel/update/${id}`, 
        updates, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Wheel updated:", response.data);
      return response.data.wheel;
    } catch (err) {
      console.error("Error updating wheel:", err);
      const errorMsg = err.response?.data?.message || "Failed to update wheel";
      return rejectWithValue(errorMsg);
    }
  }
);

// ➤ Delete Wheel
export const deleteWheel = createAsyncThunk(
  "spinAndWin/deleteWheel",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${BASE_URL}/api/wheel/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Wheel deleted:", id);
      return id;
    } catch (err) {
      console.error("Error deleting wheel:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete wheel";
      return rejectWithValue(errorMsg);
    }
  }
);

// ----------------- SLICE -----------------
const spinAndWinSlice = createSlice({
  name: "spinAndWin",
  initialState: {
    wheels: [],
    wheel: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearSpinState: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Wheel
      .addCase(createWheel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWheel.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Wheel created successfully!";
        state.wheels.unshift(action.payload);
      })
      .addCase(createWheel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all Wheels
      .addCase(fetchAllWheels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWheels.fulfilled, (state, action) => {
        state.loading = false;
        state.wheels = action.payload.wheels || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAllWheels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.wheels = [];
      })

      // Fetch single Wheel
      .addCase(fetchWheelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWheelById.fulfilled, (state, action) => {
        state.loading = false;
        state.wheel = action.payload;
      })
      .addCase(fetchWheelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Wheel
      .addCase(updateWheel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWheel.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Wheel updated successfully!";
        state.wheels = state.wheels.map((w) =>
          w._id === action.payload._id ? action.payload : w
        );
        if (state.wheel && state.wheel._id === action.payload._id) {
          state.wheel = action.payload;
        }
      })
      .addCase(updateWheel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Wheel
      .addCase(deleteWheel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWheel.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Wheel deleted successfully!";
        state.wheels = state.wheels.filter((w) => w._id !== action.payload);
      })
      .addCase(deleteWheel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSpinState } = spinAndWinSlice.actions;
export default spinAndWinSlice.reducer;