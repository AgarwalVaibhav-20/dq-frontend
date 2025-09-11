import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
// Fetch menu items
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchMenuItems",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${BASE_URL}/menu/allmenues`, { headers });

      return response.data; // because backend returns array of menuItems
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch menu items"
      );
    }
  }
);



export const addMenuItem = createAsyncThunk(
  'menu/addMenuItem',
  async ({ itemName, price, categoryId, sub_category, status, stockItems, itemImageFile }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const restaurantId = localStorage.getItem('restaurantId');

      // Validation on frontend
      if (!itemName?.trim()) {
        return rejectWithValue('Item name is required');
      }
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        return rejectWithValue('Valid price is required');
      }
      if (!categoryId) {
        return rejectWithValue('Category is required');
      }
      if (!restaurantId) {
        return rejectWithValue('Restaurant ID not found');
      }

      // Create FormData to handle file upload + JSON
      const formData = new FormData();
      formData.append('itemName', itemName.trim());
      formData.append('price', Number(price));
      formData.append('categoryId', categoryId);
      formData.append('restaurantId', restaurantId);
      formData.append('sub_category', sub_category || '');
      formData.append('status', status || 1);

      if (itemImageFile) {
        formData.append('itemImage', itemImageFile);
      }

      if (stockItems && stockItems.length > 0) {
        formData.append('stockItems', JSON.stringify(stockItems));
      }

      console.log('Sending form data:', {
        itemName: itemName.trim(),
        price: Number(price),
        categoryId,
        restaurantId,
        sub_category: sub_category || '',
        status: status || 1,
        stockItems: stockItems || [],
        hasImage: !!itemImageFile
      });

      const response = await axios.post(`${BASE_URL}/menu/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add menu item error:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to add menu item';
      return rejectWithValue(errorMessage);
    }
  }
);
// Update a menu item
export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, formData, token }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      const response = await axios.put(`${BASE_URL}/menu/${id}`, formData, { headers });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update menu item');
    }
  }
);


// Delete a menu item
export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.delete(`${BASE_URL}/menu/delete/${id}`, { headers });
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete menu item');
    }
  }
);

// Update menu item status
export const updateMenuItemStatus = createAsyncThunk(
  'menu/updateMenuItemStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.put(
        `${BASE_URL}/menus/status`,
        { id, status },
        { headers }
      );
      fetchMenuItems();
      return { id, status: response.data.status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update menu status');
    }
  }
);

// Slice
const menuSlice = createSlice({
  name: 'menuItems',
  initialState: {
    menuItems: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch menu items
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload , "action payload")
        state.menuItems = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to fetch menu items.');
      });

    // Add menu item
    builder
      .addCase(addMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = [...state.menuItems, action.payload.data.menu];
        // state.menuItems = [...state.menuItems, action.payload];
        // toast.success('Menu item added successfully!');
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // toast.error(action.payload || 'Failed to add menu item.');
      });

    // Update menu item
    builder
      .addCase(updateMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        const updatedItem = action.payload;
        const index = state.menuItems.findIndex((item) => item.id === updatedItem.id);
        if (index !== -1) {
          state.menuItems[index] = updatedItem;
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete menu item
    builder
      .addCase(deleteMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = state.menuItems.filter((item) => item.id !== action.payload.id);
        toast.success('Menu item deleted successfully!');
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to delete menu item.');
      });

    // Update menu item status
    builder
      .addCase(updateMenuItemStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMenuItemStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { id, status } = action.payload;
        const menuItem = state.menuItems.find((item) => item.id === id);
        if (menuItem) {
          menuItem.status = status;
        }
        toast.success('Menu item status updated successfully!');
      })
      .addCase(updateMenuItemStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update menu status.');
      });
  },
});

export default menuSlice.reducer;
