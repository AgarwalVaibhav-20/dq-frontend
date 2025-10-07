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
        configureHeaders(token)
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
  async ({ itemName, quantity, unit, supplierId, token, amount, total }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axios.post(
        `${BASE_URL}/create/adding/inventories`,
        {
          itemName,
          unit,
          supplierId,
          restaurantId,
          stock: {
            amount: Number(amount),
            quantity: Number(quantity),
            total: Number(total)
          }
        },
        configureHeaders(localStorage.getItem('authToken'))
      );
      return response.data.inventory;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add inventory item');
    }
  }
);


// Update inventory thunk
export const updateInventory = createAsyncThunk(
  'inventories/updateInventory',
  async ({ id, itemName, quantity, unit, amount, supplierId, token }, { rejectWithValue, getState }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const currentState = getState();
      const currentItem = currentState.inventories.inventories.find(item => item._id === id);

      if (!currentItem) return rejectWithValue('Inventory item not found');

      const response = await axios.put(
        `${BASE_URL}/update/${id}`,
        {
          restaurantId,
          itemName,
          unit,
          supplierId,
          stock: {
            quantity: Number(quantity),
            amount: Number(amount)
          },
        },
        configureHeaders(token)
      );

      return response.data.inventory;
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
// export const reduceStock = createAsyncThunk(
//   'inventories/reduceStock',
//   async ({ itemId, quantitySold }, { rejectWithValue, getState }) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const restaurantId = localStorage.getItem('restaurantId');

//       // Check if item exists in current state
//       const currentState = getState();
//       const currentItem = currentState.inventories.inventories.find(item => item._id === itemId);

//       if (!currentItem) {
//         return rejectWithValue('Item not found in inventory');
//       }

//       if (currentItem.quantity < quantitySold) {
//         return rejectWithValue(`Insufficient stock. Available: ${currentItem.quantity}, Requested: ${quantitySold}`);
//       }

//       const newQuantity = currentItem.quantity - quantitySold;

//       const response = await axios.put(
//         `${BASE_URL}/update/${itemId}`,
//         { 
//           restaurantId,
//           itemName: currentItem.itemName,
//           quantity: newQuantity,
//           unit: currentItem.unit,
//           amount: currentItem.amount,
//           supplierId: currentItem.supplierId
//         },
//         configureHeaders(token)
//       );

//       return { 
//         itemId, 
//         quantitySold, 
//         newQuantity,
//         updatedItem: response.data.data 
//       };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to reduce stock');
//     }
//   }
// );
// Add Quantity Stock thunk
export const addQuantityStock = createAsyncThunk(
  'inventories/addStock',
  async ({ itemId, quantityToAdd }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('authToken');
      const restaurantId = localStorage.getItem('restaurantId');
      const currentState = getState();
      const currentItem = currentState.inventories.inventories.find(item => item._id === itemId);

      if (!currentItem) return rejectWithValue('Item not found in inventory');

      const newQuantity = (currentItem.stock?.quantity || 0) + Number(quantityToAdd);

      const response = await axios.put(
        `${BASE_URL}/update/${itemId}`,
        {
          restaurantId,
          itemName: currentItem.itemName,
          unit: currentItem.unit,
          supplierId: currentItem.supplierId,
          stock: {
            quantity: newQuantity,
            amount: currentItem.stock?.amount || 0
          }
        },
        configureHeaders(token)
      );

      return { itemId, newQuantity, updatedItem: response.data.inventory };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add stock');
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
        console.log("=== REDUX RECEIVED DATA ===");
        console.log("action payload inventory", action.payload);
        console.log("Data type:", typeof action.payload);
        console.log("Is array:", Array.isArray(action.payload));
        console.log("Length:", action.payload?.length);
        if (action.payload && action.payload.length > 0) {
          console.log("First item:", action.payload[0]);
          console.log("First item stock:", action.payload[0]?.stock);
        }
        console.log("=== END REDUX DATA ===");
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
        const newItem = action.payload;
        if (newItem) state.inventories.push(newItem);
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
      .addCase(addQuantityStock.pending, (state) => {
        state.saleProcessing = true;
        state.error = null;
      })
      .addCase(addQuantityStock.fulfilled, (state, action) => {
        state.saleProcessing = false;
        const { itemId, updatedItem, newQuantity } = action.payload;

        // Update the inventory item in state
        const index = state.inventories.findIndex((item) => item._id === itemId);
        if (index !== -1) {
          state.inventories[index] = updatedItem || {
            ...state.inventories[index],
            stock: {
              ...state.inventories[index].stock,
              quantity: newQuantity,
            },
          };
        }

        toast.success(`Stock added successfully! New quantity: ${newQuantity}`);
      })
      .addCase(addQuantityStock.rejected, (state, action) => {
        state.saleProcessing = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to add stock.');
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