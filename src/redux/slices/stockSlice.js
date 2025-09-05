import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

// Configure axios headers with token
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})

// ------------------ THUNKS ------------------

// Fetch inventories
export const fetchInventories = createAsyncThunk(
  'inventories/fetchInventories',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/stock/inventories`,
        configureHeaders(localStorage.getItem("authToken"))
      )
      console.log(response.data)
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)


// Add inventory
export const addInventory = createAsyncThunk(
  'inventories/addInventory',
  async ({ itemName, quantity, unit, supplierId, token, supplierName }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axios.post(
        `${BASE_URL}/create/inventories`,
        { itemName, quantity, unit, supplierId, restaurantId, supplierName },
        configureHeaders(localStorage.getItem('authToken'))
      );
      return response.data.data;
    } catch (error) {
      console.log("error => ", error)
      return rejectWithValue(error.response?.data?.message || 'Failed to add inventory item');
    }
  }
);

// Update inventory
export const updateInventory = createAsyncThunk(
  'inventories/updateInventory',
  async ({ id, itemName, quantity, unit, price, supplierId, token }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axios.put(
        `${BASE_URL}/inventories/${id}`,
        { restaurantId, itemName, quantity, unit, price, supplierId },
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update inventory item');
    }
  }
);

// Delete inventory
export const deleteInventory = createAsyncThunk(
  'inventories/deleteInventory',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/inventories/${id}`, configureHeaders(token));
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete inventory item');
    }
  }
);

// ------------------ SLICE ------------------
const stockSlice = createSlice({
  name: 'inventories',
  initialState: {
    inventories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch inventories
    builder
      .addCase(fetchInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventories.fulfilled, (state, action) => {
        state.loading = false;
        // console.log("this is action payload",action.payload.data)
        state.inventories = action.payload;
      })
      .addCase(fetchInventories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to fetch inventories.');
      });

    // Add inventory
    builder
      .addCase(addInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInventory.fulfilled, (state, action) => {
        state.loading = false;
        const newItem = action.payload?.data || action.payload; // handle both cases
        if (newItem) {
          state.inventories.push(newItem);
        }
        toast.success('Inventory item added successfully!');
      })

      .addCase(addInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to add inventory item.');
      });

    // Update inventory
    builder
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const updatedItem = action.payload.data;
        const index = state.inventories.findIndex((item) => item._id === updatedItem._id);
        if (index !== -1) state.inventories[index] = updatedItem;
        toast.success('Inventory item updated successfully!');
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update inventory item.');
      });

    // Delete inventory
    builder
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventories = state.inventories.filter((item) => item._id !== action.payload.id);
        toast.success('Inventory item deleted successfully!');
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to delete inventory item.');
      });
  },
});

export default stockSlice.reducer;
