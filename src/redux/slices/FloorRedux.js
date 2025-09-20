import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ========================
// Thunks (Async Actions)
// ========================

// ✅ Fetch all floors for a restaurant
export const fetchFloors = createAsyncThunk(
  "floor/fetchFloors",
  async ({ restaurantId, token, includeTables = false, page = 1, limit = 20 }, thunkAPI) => {
    try {
      let url = `${BASE_URL}/restaurants/${restaurantId}/floors?page=${page}&limit=${limit}`;
      if (includeTables) url += `&includeTables=true`;

      const response = await axios.get(url, configureHeaders(token));
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch floors";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Create a floor
export const createFloor = createAsyncThunk(
  "floor/createFloor",
  async ({ restaurantId, floorData, token }, thunkAPI) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/restaurants/${restaurantId}/floors`,
        floorData,
        configureHeaders(token)
      );
      toast.success("Floor created successfully!");
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to create floor";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Update floor
export const updateFloor = createAsyncThunk(
  "floor/updateFloor",
  async ({ restaurantId, floorId, floorData, token }, thunkAPI) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/restaurants/${restaurantId}/floors/${floorId}`,
        floorData,
        configureHeaders(token)
      );
      toast.success("Floor updated successfully!");
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update floor";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Add table to floor
export const addTableToFloor = createAsyncThunk(
  "floor/addTableToFloor",
  async ({ restaurantId, floorId, tableId, token }, thunkAPI) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/restaurants/${restaurantId}/floors/${floorId}/add-table`,
        { tableId },
        configureHeaders(token)
      );
      toast.success("Table added successfully!");
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to add table";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Remove table from floor
export const removeTableFromFloor = createAsyncThunk(
  "floor/removeTableFromFloor",
  async ({ restaurantId, floorId, tableId, token }, thunkAPI) => {
    try {
      await axios.post(
        `${BASE_URL}/restaurants/${restaurantId}/floors/${floorId}/remove-table`,
        { tableId },
        configureHeaders(token)
      );
      toast.success("Table removed from floor successfully!");
      return { floorId, tableId };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to remove table";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Delete floor
export const deleteFloor = createAsyncThunk(
  "floor/deleteFloor",
  async ({ restaurantId, floorId, token, forceDelete = false }, thunkAPI) => {
    try {
      let url = `${BASE_URL}/restaurants/${restaurantId}/floors/${floorId}`;
      if (forceDelete) url += `?forceDelete=true`;

      await axios.delete(url, configureHeaders(token));
      toast.success("Floor deleted successfully!");
      return floorId;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete floor";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ========================
// Enhanced Floor Slice
// ========================
const floorSlice = createSlice({
  name: "floor",
  initialState: {
    floors: [],
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 1,
    total: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch floors
      .addCase(fetchFloors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFloors.fulfilled, (state, action) => {
        state.loading = false;
        state.floors = action.payload.floors || [];
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create floor
      .addCase(createFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFloor.fulfilled, (state, action) => {
        state.loading = false;
        state.floors.push({
          ...action.payload,
          stats: {
            totalTables: 0,
            totalCapacity: 0,
            availableTables: 0,
            occupiedTables: 0
          }
        });
        state.total += 1;
      })
      .addCase(createFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update floor
      .addCase(updateFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFloor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.floors.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.floors[index] = { ...state.floors[index], ...action.payload };
        }
      })
      .addCase(updateFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add table to floor
      .addCase(addTableToFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTableToFloor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.floors.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.floors[index] = action.payload;
        }
      })
      .addCase(addTableToFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove table from floor
      .addCase(removeTableFromFloor.fulfilled, (state, action) => {
        const { floorId } = action.payload;
        const floorIndex = state.floors.findIndex((f) => f._id === floorId);
        if (floorIndex !== -1 && state.floors[floorIndex].tables) {
          // Remove table from floor's tables array if populated
          state.floors[floorIndex].tables = state.floors[floorIndex].tables.filter(
            t => t._id !== action.payload.tableId
          );
        }
      })

      // Delete floor
      .addCase(deleteFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFloor.fulfilled, (state, action) => {
        state.loading = false;
        state.floors = state.floors.filter((f) => f._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentPage } = floorSlice.actions;
export default floorSlice.reducer;
