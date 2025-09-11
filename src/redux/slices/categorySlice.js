import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';
import { toast } from 'react-toastify';

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Async thunk to create a new category
export const createCategory = createAsyncThunk(
  'category/createCategory',
  async ({ categoryName, categoryImage, token, basePrice, size, description }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('categoryName', categoryName);
      formData.append('categoryImage', categoryImage);
      if (basePrice !== undefined && basePrice !== null) {
        formData.append("basePrice", basePrice);
      }

      formData.append('size', size);
      formData.append('description', description)
      const response = await axios.post(
        `${BASE_URL}/category`,
        formData,
        configureHeaders(token)
      );
      console.log(response.data)
      console.log(token + "this is token")
      console.log(response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Category creation failed');
    }
  }
);

// Async thunk to fetch all categories
export const fetchCategories = createAsyncThunk(
  'category/fetchCategories',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/categories`,
        configureHeaders(token)
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  'category/fetchCategoryById',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/category/${id}`, configureHeaders(token));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch category');
    }
  }
);

// Async thunk to update a category
export const updateCategory = createAsyncThunk(
  'category/updateCategory',
  async ({ id, categoryName, categoryImage, restaurantId, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (categoryName) formData.append('categoryName', categoryName);
      if (categoryImage) formData.append('categoryImage', categoryImage);
      if (restaurantId) formData.append('restaurantId', restaurantId);


      const response = await axios.post(
        `${BASE_URL}category/update/${id}`,
        formData,
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Category update failed');
    }
  }
);


// Async thunk to delete a category
export const deleteCategory = createAsyncThunk(
  'category/deleteCategory',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/delete/category/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return { id, ...response.data }; // return id so reducer can update state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Category deletion failed'
      );
    }
  }
);


// Category Slice
const categorySlice = createSlice({
  name: 'category',
  initialState: {
    categories: [],
    category: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
        toast.success('Category created successfully!');
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Fetch all categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.category = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex((cat) => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (cat) => cat._id !== action.payload.id
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;
