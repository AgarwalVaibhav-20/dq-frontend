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
        `${BASE_URL}/update/${id}`,
        { restaurantId, itemName, quantity, unit, price, supplierId },
        configureHeaders(localStorage.getItem("authToken"))
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
      const response = await axios.delete(`${BASE_URL}/delete/${id}`, configureHeaders(localStorage.getItem("authToken")));
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete inventory item');
    }
  }
);

// NEW: Reduce stock when item is sold
export const reduceStock = createAsyncThunk(
  'inventories/reduceStock',
  async ({ itemId, quantitySold }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('authToken');
      const restaurantId = localStorage.getItem('restaurantId');
      
      // Check if item exists in current state
      const currentState = getState();
      const currentItem = currentState.inventories.inventories.find(item => item._id === itemId);
      
      if (!currentItem) {
        return rejectWithValue('Item not found in inventory');
      }
      
      if (currentItem.quantity < quantitySold) {
        return rejectWithValue(`Insufficient stock. Available: ${currentItem.quantity}, Requested: ${quantitySold}`);
      }

      const newQuantity = currentItem.quantity - quantitySold;
      
      const response = await axios.put(
        `${BASE_URL}/update/${itemId}`,
        { 
          restaurantId,
          itemName: currentItem.itemName,
          quantity: newQuantity,
          unit: currentItem.unit,
          price: currentItem.price,
          supplierId: currentItem.supplierId
        },
        configureHeaders(token)
      );
      
      return { 
        itemId, 
        quantitySold, 
        newQuantity,
        updatedItem: response.data.data 
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reduce stock');
    }
  }
);

// NEW: Process multiple item sale (for orders with multiple items)
export const processItemsSale = createAsyncThunk(
  'inventories/processItemsSale',
  async ({ saleItems }, { rejectWithValue, dispatch, getState }) => {
    try {
      // saleItems format: [{ itemId, quantitySold, itemName }, ...]
      const results = [];
      const errors = [];
      
      for (const saleItem of saleItems) {
        try {
          const result = await dispatch(reduceStock({
            itemId: saleItem.itemId,
            quantitySold: saleItem.quantitySold
          })).unwrap();
          
          results.push({
            ...result,
            itemName: saleItem.itemName
          });
        } catch (error) {
          errors.push({
            itemName: saleItem.itemName,
            error: error
          });
        }
      }
      
      if (errors.length > 0) {
        return rejectWithValue({
          message: 'Some items could not be processed',
          errors,
          successfulItems: results
        });
      }
      
      return {
        message: 'All items processed successfully',
        processedItems: results
      };
    } catch (error) {
      return rejectWithValue('Failed to process sale items');
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
    saleProcessing: false, // New state for tracking sale processing
  },
  reducers: {
    // Utility reducer to clear errors
    clearError: (state) => {
      state.error = null;
    },
    // Local stock reduction (for optimistic updates)
    reduceStockLocally: (state, action) => {
      const { itemId, quantitySold } = action.payload;
      const item = state.inventories.find(item => item._id === itemId);
      if (item && item.quantity >= quantitySold) {
        item.quantity -= quantitySold;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch inventories
    builder
      .addCase(fetchInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventories.fulfilled, (state, action) => {
        state.loading = false;
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
        const newItem = action.payload?.data || action.payload;
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

    // NEW: Reduce stock cases
    builder
      .addCase(reduceStock.pending, (state) => {
        state.saleProcessing = true;
        state.error = null;
      })
      .addCase(reduceStock.fulfilled, (state, action) => {
        state.saleProcessing = false;
        const { itemId, updatedItem } = action.payload;
        
        // Update the inventory item with new quantity
        const index = state.inventories.findIndex((item) => item._id === itemId);
        if (index !== -1) {
          state.inventories[index] = updatedItem || {
            ...state.inventories[index],
            quantity: action.payload.newQuantity
          };
        }
        
        toast.success(`Stock reduced successfully! New quantity: ${action.payload.newQuantity}`);
      })
      .addCase(reduceStock.rejected, (state, action) => {
        state.saleProcessing = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to reduce stock.');
      });

    // NEW: Process multiple items sale cases
    builder
      .addCase(processItemsSale.pending, (state) => {
        state.saleProcessing = true;
        state.error = null;
      })
      .addCase(processItemsSale.fulfilled, (state, action) => {
        state.saleProcessing = false;
        toast.success(action.payload.message);
      })
      .addCase(processItemsSale.rejected, (state, action) => {
        state.saleProcessing = false;
        state.error = action.payload;
        
        if (action.payload.errors) {
          action.payload.errors.forEach(error => {
            toast.error(`${error.itemName}: ${error.error}`);
          });
        } else {
          toast.error(action.payload.message || 'Failed to process sale items.');
        }
      });
  },
});

export const { clearError, reduceStockLocally } = stockSlice.actions;
export default stockSlice.reducer;