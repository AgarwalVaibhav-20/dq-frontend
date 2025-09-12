// redux/slices/recipeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch recipes
export const fetchRecipes = createAsyncThunk(
  'recipes/fetchRecipes',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      return data.recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Save recipe
export const saveRecipe = createAsyncThunk(
  'recipes/saveRecipe',
  async ({ menuItemId, ingredients, token }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ menuItemId, ingredients })
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }

      const data = await response.json();
      return data.recipe;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete recipe
export const deleteRecipe = createAsyncThunk(
  'recipes/deleteRecipe',
  async ({ recipeId, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      return recipeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const reduceInventoryStock = createAsyncThunk(
  'inventories/reduceStock',
  async ({ reductions, token }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/inventories/reduce-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reductions })
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to reduce stock');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkStockAvailability = createAsyncThunk(
  'inventories/checkAvailability',
  async ({ items, token }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/inventories/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
const recipeSlice = createSlice({
  name: 'recipes',
  initialState: {
    recipes: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
        state.error = null;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveRecipe.fulfilled, (state, action) => {
        const existingIndex = state.recipes.findIndex(
          recipe => recipe.menuItemId._id === action.payload.menuItemId._id
        );

        if (existingIndex >= 0) {
          state.recipes[existingIndex] = action.payload;
        } else {
          state.recipes.push(action.payload);
        }
      })
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.recipes = state.recipes.filter(recipe => recipe._id !== action.payload);
      });
  }
});

export const { clearError } = recipeSlice.actions;
export default recipeSlice.reducer;