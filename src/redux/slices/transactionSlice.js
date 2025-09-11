import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (payload, { rejectWithValue }) => {
    try {
      const {
        username,
        token,
        userId,
        tableNumber,
        items,
        sub_total,
        tax,
        discount,
        total,
        type,
        restaurantId,
        customerId,
        transactionId,
      } = payload;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fix: Get restaurantId and userId from localStorage correctly
      const finalRestaurantId = restaurantId || localStorage.getItem('restaurantId');
      const finalUserId = userId || localStorage.getItem('userId');

      const requestData = {
        username,
        restaurantId: finalRestaurantId,
        userId: finalUserId,
        tableNumber,
        items,
        sub_total,
        tax,
        discount,
        total,
        type,
        customerId,
        transactionId
      };

      console.log('Transaction payload:', requestData); // Debug log

      const response = await axios.post(`${BASE_URL}/create/transaction`, requestData, { headers });
      return response.data;
    } catch (error) {
      console.error('Transaction creation error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Something went wrong' });
    }
  },
)

// GET API: Fetch transactions by restaurantId
export const fetchTransactionsByRestaurant = createAsyncThunk(
  'transactions/fetchTransactionsByRestaurant',
  async ({ token }, { rejectWithValue }) => {
    try {
      console.log("Fetching transactions with token:", token);
      const response = await axios.get(`${BASE_URL}/get-all/transaction`, configureHeaders(token))
      console.log("Response data:", response.data)
      
      // Return the actual data array, not the wrapper object
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error fetching transactions:", error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transactions' });
    }
  },
)

// GET API: Fetch transaction details by transactionId
export const fetchTransactionDetails = createAsyncThunk(
  'transactions/fetchTransactionDetails',
  async ({ transactionId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${BASE_URL}/transactionById/${transactionId}`, { headers })
      console.log("Transaction details response:", response.data)
      
      // Return data in array format for consistency with component expectations
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transaction details' });
    }
  },
)

// DELETE API: Delete transaction by transactionId
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fix: Send note in request body, not as separate object
      await axios.delete(`${BASE_URL}/deleteTransaction/${id}`, {
        headers,
        data: { note }
      });
      
      return id;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to delete transaction' });
    }
  },
)

// GET API: Fetch POS transactions (no restaurant ID needed)
export const fetchPOSTransactions = createAsyncThunk(
  'transactions/fetchPOSTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${BASE_URL}/POStransactions`, { headers })
      console.log("POS transactions:", response.data);
      
      // Return the actual data array
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching POS transactions:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch POS transactions' });
    }
  }
)

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    transactionDetails: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false
        // Add new transaction to the beginning of the array
        state.transactions = [action.payload.transaction, ...state.transactions];
        state.error = null
        toast.success('Transaction created successfully.')
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to create transaction.')
      })

      // Fetch Transactions by Restaurant
      .addCase(fetchTransactionsByRestaurant.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionsByRestaurant.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
        state.error = null
      })
      .addCase(fetchTransactionsByRestaurant.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch transactions.')
      })

      // Fetch Transaction Details
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.loading = false
        state.transactionDetails = action.payload
        state.error = null
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch transaction details.')
      })

      // Delete Transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.transactions = state.transactions.filter(
            (transaction) => transaction.id !== action.payload,
          )
          toast.success('Transaction deleted successfully.')
        }
        state.error = null
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to delete transaction.')
      })

      // Fetch POS Transactions
      .addCase(fetchPOSTransactions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPOSTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
        state.error = null
      })
      .addCase(fetchPOSTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch POS transactions.')
      })
  },
})

export const { clearError, clearTransactions } = transactionSlice.actions;
export default transactionSlice.reducer