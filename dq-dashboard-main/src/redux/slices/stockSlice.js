import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    Authorization: `Bearer ${token}`,
  }
}

// Fetch inventories
export const fetchInventories = createAsyncThunk(
  'inventories/fetchInventories',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/inventories?restaurantId=${restaurantId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventories')
    }
  },
)

// Add a new inventory item
export const addInventory = createAsyncThunk(
  'inventories/addInventory',
  async ({ restaurantId, itemName, quantity, unit, supplierId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/inventories`,
        { restaurantId, itemName, quantity, unit, supplierId },
        { headers: getAuthHeaders() },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add inventory item')
    }
  },
)

// Update an inventory item
export const updateInventory = createAsyncThunk(
  'inventories/updateInventory',
  async (
    { id, restaurantId, itemName, quantity, unit, price, supplierId },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/inventories/${id}`,
        { restaurantId, itemName, quantity, unit, price, supplierId },
        { headers: getAuthHeaders() },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update inventory item')
    }
  },
)

// Delete an inventory item
export const deleteInventory = createAsyncThunk(
  'inventories/deleteInventory',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/inventories/${id}`, {
        headers: getAuthHeaders(),
      })
      return { id, message: response.data.message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete inventory item')
    }
  },
)

// Slice
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
        state.loading = true
        state.error = null
      })
      .addCase(fetchInventories.fulfilled, (state, action) => {
        state.loading = false
        state.inventories = action.payload.data
      })
      .addCase(fetchInventories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch inventories.')
      })

    // Add inventory item
    builder
      .addCase(addInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addInventory.fulfilled, (state, action) => {
        state.loading = false
        // state.inventories.push(action.payload.data);
        state.inventories = [...state.inventories, action.payload.data]
        toast.success('Inventory item added successfully!')
      })
      .addCase(addInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to add inventory item.')
      })

    // Update inventory item
    builder
      .addCase(updateInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const updatedItem = action.payload.data;
        const index = state.inventories.findIndex(
          (inventory) => inventory.id === updatedItem.id
        );
        if (index !== -1) {
          state.inventories[index] = updatedItem;
        }
        toast.success('Inventory item updated successfully!');
      })
   
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to update inventory item.')
      })

    // Delete inventory item
    builder
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.loading = false
        state.inventories = state.inventories.filter(
          (inventory) => inventory.id !== action.payload.id,
        )
        toast.success('Inventory item deleted successfully!')
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to delete inventory item.')
      })
  },
})

export default stockSlice.reducer
