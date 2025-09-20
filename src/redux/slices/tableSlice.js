import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ========================
// Thunks (Async Actions)
// ========================

// Fetch all tables for a restaurant
export const fetchTables = createAsyncThunk(
  'tables/fetchTables',
  async ({ restaurantId, page = 1, limit = 50, floorId, status, token }, thunkAPI) => {
    try {
      let url = `${BASE_URL}/restaurants/${restaurantId}/tables?page=${page}&limit=${limit}`;
      if (floorId) url += `&floorId=${floorId}`;
      if (status) url += `&status=${status}`;

      const response = await axios.get(url, configureHeaders(token));
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch tables';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Create a single table
export const createTable = createAsyncThunk(
  'tables/createTable',
  async ({ restaurantId, tableData, token }, thunkAPI) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/restaurants/${restaurantId}/tables`,
        tableData,
        configureHeaders(token)
      );
      toast.success('Table created successfully!');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create table';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Create multiple tables
export const createMultipleTables = createAsyncThunk(
  'tables/createMultipleTables',
  async ({ restaurantId, tablesData, token }, thunkAPI) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/restaurants/${restaurantId}/tables/bulk`,
        tablesData,
        configureHeaders(token)
      );
      toast.success(`Created ${response.data.data.tables.length} tables successfully!`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create tables';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Update table
export const updateTable = createAsyncThunk(
  'tables/updateTable',
  async ({ restaurantId, tableId, tableData, token }, thunkAPI) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/restaurants/${restaurantId}/tables/${tableId}`,
        tableData,
        configureHeaders(token)
      );
      toast.success('Table updated successfully!');
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update table';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Delete table
export const deleteTable = createAsyncThunk(
  'tables/deleteTable',
  async ({ restaurantId, tableId, token }, thunkAPI) => {
    try {
      await axios.delete(
        `${BASE_URL}/restaurants/${restaurantId}/tables/${tableId}`,
        configureHeaders(token)
      );
      toast.success('Table deleted successfully!');
      return tableId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete table';
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ========================
// Slice
// ========================
const tableSlice = createSlice({
  name: 'tables',
  initialState: {
    tables: [],
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
    updateTableStatus: (state, action) => {
      const { tableId, status } = action.payload;
      const table = state.tables.find(t => t._id === tableId);
      if (table) {
        table.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tables
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload.tables || [];
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create table
      .addCase(createTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.loading = false;
        state.tables.push(action.payload);
        state.total += 1;
      })
      .addCase(createTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create multiple tables
      .addCase(createMultipleTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMultipleTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables.push(...action.payload.tables);
        state.total += action.payload.tables.length;
      })
      .addCase(createMultipleTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update table
      .addCase(updateTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tables.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete table
      .addCase(deleteTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = state.tables.filter(t => t._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateTableStatus } = tableSlice.actions;
export default tableSlice.reducer;