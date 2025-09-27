import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Fetch menu items
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchMenuItems",
  async ({ restaurantId, token }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const url = restaurantId
        ? `${BASE_URL}/menu/allmenues?restaurantId=${restaurantId}`
        : `${BASE_URL}/menu/allmenues`;

      const response = await axios.get(url, { headers });
      return response.data; // Array of menu items
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch menu items"
      );
    }
  }
);
export const addMenuItem = createAsyncThunk(
  "menu/addMenuItem",
  async (
    {
      menuId,
      itemName,
      price,
      categoryId,
      categoryName,   // ✅ Add this
      sub_category,
      status,
      stockItems,
      itemImage,
      sizes,
      token,
      unit,
    },
    { rejectWithValue }
  ) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");

      const formData = new FormData();
      formData.append("menuId", menuId);
      formData.append("itemName", itemName.trim());
      if (price) formData.append("price", Number(price));
      formData.append("categoryId", categoryId);
      formData.append("categoryName", categoryName); // ✅ Send categoryName too
      formData.append("restaurantId", restaurantId);
      formData.append("sub_category", sub_category || "");
      formData.append("status", status || 1);
      formData.append("unit", unit || "");

      if (sizes && Array.isArray(sizes)) {
        formData.append("sizes", JSON.stringify(sizes));
      }

      if (itemImage instanceof File) {
        formData.append("itemImage", itemImage);
      }

      if (stockItems && stockItems.length > 0) {
        const validStockItems = stockItems.filter(
          (item) => item.stockId && item.quantity !== undefined
        );
        if (validStockItems.length > 0) {
          formData.append("stockItems", JSON.stringify(validStockItems));
        }
      }

      const response = await axios.post(`${BASE_URL}/menu/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Add menu item error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to add menu item";
      return rejectWithValue(errorMessage);
    }
  }
);

// export const addMenuItem = createAsyncThunk(
//   "menu/addMenuItem",
//   async (
//     {
//       menuId,
//       itemName,
//       price,
//       categoryId,
//       sub_category,
//       status,
//       stockItems,
//       itemImage,
//       sizes,
//       token,
//       unit,
//     },
//     { rejectWithValue }
//   ) => {
//     try {
//       const restaurantId = localStorage.getItem("restaurantId");

//       console.log("=== FRONTEND DEBUG ===");
//       console.log("Received sizes array:", JSON.stringify(sizes, null, 2));

//       // Create FormData
//       const formData = new FormData();
//       formData.append("menuId", menuId);
//       formData.append("itemName", itemName.trim());
//       if (price) formData.append("price", Number(price));
//       formData.append("categoryId", categoryId);
//       formData.append("restaurantId", restaurantId);
//       formData.append("sub_category", sub_category || "");
//       formData.append("status", status || 1);
//       formData.append("unit", unit || "");


//       // ✅ Handle sizes dynamically
//       if (sizes && Array.isArray(sizes)) {
//         // Send entire sizes array as JSON
//         formData.append("sizes", JSON.stringify(sizes));
//       }

//       // Handle image
//       if (itemImage instanceof File) {
//         formData.append("itemImage", itemImage);
//       }

//       // Handle stockItems
//       if (stockItems && stockItems.length > 0) {
//         const validStockItems = stockItems.filter(
//           (item) => item.stockId && item.quantity !== undefined
//         );
//         if (validStockItems.length > 0) {
//           formData.append("stockItems", JSON.stringify(validStockItems));
//         }
//       }

//       // Debug FormData contents
//       console.log("=== FORMDATA CONTENTS ===");
//       for (let pair of formData.entries()) {
//         console.log(`${pair[0]}: ${pair[1]}`);
//       }

//       const response = await axios.post(`${BASE_URL}/menu/add`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       return response.data;
//     } catch (error) {
//       console.error("Add menu item error:", error);
//       const errorMessage =
//         error.response?.data?.message ||
//         error.response?.data?.error ||
//         error.message ||
//         "Failed to add menu item";
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// Update menu item
export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, formData, token }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      // const response = await axios.put(`${BASE_URL}/menu/${id}`, formData, { headers });
      const response = await axios.put(`${BASE_URL}/menu/update/${id}`, formData, { headers });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Failed to update menu item'
      );
    }
  }
);

// Delete menu item
export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.delete(`${BASE_URL}/menu/delete/${id}`, { headers });
      return {
        _id: id,
        message: response.data.message
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Failed to delete menu item'
      );
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

      // Convert status from string to number for backend
      const numericStatus = status === 'available' ? 1 : 0;

      const response = await axios.put(
        `${BASE_URL}/menu/status`, // Fixed endpoint path
        `${BASE_URL}/menus/status`,
        { id, status: numericStatus },
        { headers }
      );

      return {
        _id: id,
        status: numericStatus,
        data: response.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Failed to update menu status'
      );
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
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch menu items
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to fetch menu items.');
      });

    // Add menu item
    builder
      .addCase(addMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        // Add new item to the beginning of the array
        if (action.payload.data) {
          state.menuItems = [action.payload.data, ...state.menuItems];
        }
        // Don't show toast here - handle in component
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Don't show toast here - handle in component
      });

    // Update menu item
    builder
      .addCase(updateMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const updatedItem = action.payload.data;
          const index = state.menuItems.findIndex((item) => item._id === updatedItem._id);
          if (index !== -1) {
            state.menuItems[index] = updatedItem;
          }
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
        // For soft delete, update the item's status instead of removing it
        const itemId = action.payload._id;
        const index = state.menuItems.findIndex((item) => item._id === itemId);
        if (index !== -1) {
          state.menuItems[index].status = 0; // Mark as deleted
        }
        // Optionally, you can remove it from the array entirely
        // state.menuItems = state.menuItems.filter((item) => item._id !== itemId);
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
        const { _id, status } = action.payload;
        const menuItem = state.menuItems.find((item) => item._id === _id);
        if (menuItem) {
          menuItem.status = status;
        }
      })
      .addCase(updateMenuItemStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update menu status.');
      });
  },
});

export const { clearError, setLoading } = menuSlice.actions;
export default menuSlice.reducer;
