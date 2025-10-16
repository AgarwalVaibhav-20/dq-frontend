import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";

// 🔐 Helper: configure headers
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ============================
// ✅ Fetch suppliers
// ============================
export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async ({ token }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");

      const response = await axios.get(`${BASE_URL}/getall/suppliers`, {
        params: { restaurantId },
        ...configureHeaders(token),
      });
      console.log("Supplier data fetched successfully" , response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(error);
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch suppliers"
      );
    }
  }
);

// ============================
// ✅ Add supplier
// ============================
export const addSupplier = createAsyncThunk(
  "suppliers/addSupplier",
  async (
    { supplierName, email, phoneNumber, rawItems, token, inventoryId },
    { rejectWithValue }
  ) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");

      const response = await axios.post(
        `${BASE_URL}/create/suppliers`,
        { supplierName, email, phoneNumber, rawItems, restaurantId, inventoryId },
        configureHeaders(token)
      );

      return response.data.data; // ✅ Return supplier directly
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add supplier"
      );
    }
  }
);

// ============================
// ✅ Update supplier
// ============================
export const updateSupplier = createAsyncThunk(
  "suppliers/updateSupplier",
  async (
    { id, supplierName, email, phoneNumber, rawItem, token },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/suppliers/${id}`,
        { supplierName, email, phoneNumber, rawItem },
        configureHeaders(token)
      );
      return response.data.data; // ✅ Return updated supplier
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update supplier"
      );
    }
  }
);

// ============================
// ✅ Delete supplier
// ============================
export const deleteSupplier = createAsyncThunk(
  "suppliers/deleteSupplier",
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/suppliers/${id}`,
        configureHeaders(token)
      );

      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete supplier"
      );
    }
  }
);

// ============================
// ✅ Supplier Slice
// ============================
const supplierSlice = createSlice({
  name: "suppliers",
  initialState: {
    suppliers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // 🔄 Fetch suppliers
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ➕ Add supplier
    builder
      .addCase(addSupplier.pending, (state) => {
        state.loading = true;
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers.push(action.payload);
        toast.success("Supplier added successfully!");
      })
      .addCase(addSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to add supplier.");
      });

    // ✏️ Update supplier
    builder
      .addCase(updateSupplier.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSupplier = action.payload;
        const index = state.suppliers.findIndex(
          (supplier) => supplier._id === updatedSupplier._id
        );
        if (index !== -1) {
          state.suppliers[index] = updatedSupplier;
        }
        toast.success("Supplier updated successfully!");
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to update supplier.");
      });

    // 🗑️ Delete supplier
    builder
      .addCase(deleteSupplier.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter(
          (supplier) => supplier._id !== action.payload.id
        );
        toast.success("Supplier deleted successfully!");
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to delete supplier.");
      });
  },
});

export default supplierSlice.reducer;



// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { BASE_URL } from '../../utils/constants'
// import { toast } from 'react-toastify'

// const configureHeaders = (token) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//   },
// })

// export const createSubCategory = createAsyncThunk(
//   "subCategory/create",
//   async ({ sub_category_name, categoryId, token, categoryName }, { rejectWithValue }) => {
//     try {
//       const restaurantId = localStorage.getItem("restaurantId");
//       if (!restaurantId) {
//         return rejectWithValue("Restaurant ID not found in localStorage");
//       }

//       const response = await axios.post(
//         `${BASE_URL}/create/subCategory`,
//         {
//           sub_category_name,
//           categoryName,
//           categoryId,
//           restaurantId,
//         },
//         configureHeaders(token)
//       );

//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to create subcategory"
//       );
//     }
//   }
// );

// // ✅ Fetch all subcategories - matches: GET /data/subCategory
// export const fetchSubCategories = createAsyncThunk(
//   'subCategory/fetchAll',
//   async ({ token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${BASE_URL}/data/subCategory?restaurantId=${restaurantId}`,
//         configureHeaders(token),
//       )
//       // Map 'id' to '_id' for consistency with MongoDB
//       return response.data.map(sub => ({
//         ...sub,
//         _id: sub.id || sub._id
//       }))
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch subcategories')
//     }
//   },
// )

// // ✅ Update subcategory - matches: PUT /subCategory/:id
// export const updateSubCategory = createAsyncThunk(
//   'subCategory/update',
//   async ({ id, sub_category_name, categoryId, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.put(
//         `${BASE_URL}/subCategory/${id}`,
//         { sub_category_name, categoryId },
//         configureHeaders(token),
//       )
//       return {
//         ...response.data,
//         _id: response.data.id || response.data._id
//       }
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to update subcategory')
//     }
//   },
// )

// // ✅ Delete subcategory - matches: DELETE /subCategory/:id
// export const deleteSubCategory = createAsyncThunk(
//   'subCategory/delete',
//   async ({ id, token }, { rejectWithValue }) => {
//     try {
//       await axios.delete(
//         `${BASE_URL}/subCategory/${id}`,
//         configureHeaders(token)
//       )
//       return { _id: id, id }
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to delete subcategory')
//     }
//   },
// )

// const subCategorySlice = createSlice({
//   name: 'subCategory',
//   initialState: {
//     subCategories: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // CREATE
//       .addCase(createSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(createSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories.push(action.payload)
//         toast.success('Subcategory created successfully')
//       })
//       .addCase(createSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       // FETCH
//       .addCase(fetchSubCategories.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(fetchSubCategories.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories = action.payload
//       })
//       .addCase(fetchSubCategories.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       // UPDATE
//       .addCase(updateSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(updateSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         const index = state.subCategories.findIndex(
//           (s) => s._id === action.payload._id || s._id === action.payload.id
//         )
//         if (index !== -1) {
//           state.subCategories[index] = action.payload
//         }
//         toast.success('Subcategory updated successfully')
//       })
//       .addCase(updateSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       // DELETE
//       .addCase(deleteSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(deleteSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories = state.subCategories.filter(
//           (sub) => sub._id !== action.payload._id && sub._id !== action.payload.id
//         )
//         toast.success('Subcategory deleted successfully')
//       })
//       .addCase(deleteSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })
//   },
// })

// export default subCategorySlice.reducer