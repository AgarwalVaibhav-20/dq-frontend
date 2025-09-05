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

// Fetch all dues
export const fetchDues = createAsyncThunk(
  'dues/fetchDues',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/dues/byRestaurantId/${restaurantId}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dues')
    }
  },
)

// Add a new due
export const addDue = createAsyncThunk(
  'dues/addDue',
  async ({ transaction_id, total, status, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/dues`,
        { transaction_id, total, status, restaurantId },
        { headers: getAuthHeaders() },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add due')
    }
  },
)

// Update a due
export const updateDue = createAsyncThunk(
  'dues/updateDue',
  async ({ id, transaction_id, total, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/dues/${id}`,
        { transaction_id, total, status },
        { headers: getAuthHeaders() },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update due')
    }
  },
)

// Delete a due
export const deleteDue = createAsyncThunk('dues/deleteDue', async ({ id }, { rejectWithValue }) => {
  try {
    await axios.delete(`${BASE_URL}/dues/${id}`, {
      headers: getAuthHeaders(),
    })
    return id // Return only the ID for removal
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete due')
  }
})

// Slice
const dueSlice = createSlice({
  name: 'dues',
  initialState: {
    dues: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch dues
      .addCase(fetchDues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDues.fulfilled, (state, action) => {
        state.loading = false;
        state.dues = action.payload;
      })
      .addCase(fetchDues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      .addCase(addDue.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Optimistically add the due to the state
        state.dues.push(action.meta.arg); // Use the payload passed to the action
      })
      .addCase(addDue.fulfilled, (state, action) => {
        state.loading = false;
        // Replace the temporary due with the server response
        const index = state.dues.findIndex((due) => due.id === action.meta.arg.id); // Use the temporary ID
        if (index !== -1) {
          state.dues[index] = action.payload;
        }
      })
      .addCase(addDue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Remove the optimistically added due if the API call fails
        state.dues = state.dues.filter((due) => due.id !== action.meta.arg.id); // Use the temporary ID
        toast.error(action.payload || 'Failed to add due.');
      })

      // Update due (optimistic update)
      .addCase(updateDue.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Optimistically update the due in the state
        const index = state.dues.findIndex((due) => due.id === action.meta.arg.id);
        if (index !== -1) {
          state.dues[index] = { ...state.dues[index], ...action.meta.arg };
        }
      })
      .addCase(updateDue.fulfilled, (state, action) => {
        state.loading = false;
        // Replace the optimistic update with the server response
        const index = state.dues.findIndex((due) => due.id === action.payload.id);
        if (index !== -1) {
          state.dues[index] = action.payload;
        }
      })
      .addCase(updateDue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Revert the optimistic update if the API call fails
        const index = state.dues.findIndex((due) => due.id === action.meta.arg.id);
        if (index !== -1) {
          state.dues[index] = action.meta.arg.originalDue; // Revert to the original due
        }
        toast.error(action.payload || 'Failed to update due.');
      })

      // Delete due (optimistic update)
      .addCase(deleteDue.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Optimistically remove the due from the state
        state.dues = state.dues.filter((due) => due.due_details.id !== action.meta.arg.id);
      })
      .addCase(deleteDue.fulfilled, (state) => {
        state.loading = false;
        // No further action needed, the due is already removed optimistically
      })
      .addCase(deleteDue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Re-add the due if the API call fails
        state.dues.push(action.meta.arg);
        toast.error(action.payload || 'Failed to delete due.');
      });
  },
});

export default dueSlice.reducer
