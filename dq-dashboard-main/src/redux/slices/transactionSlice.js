import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

const token = localStorage.getItem('authToken')
const headers = {
  Authorization: `Bearer ${token}`,
}

// POST API: Create a transaction
export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      
      const response = await axios.post(`${BASE_URL}/transactions`, transactionData, { headers })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong')
    }
  },
)

// GET API: Fetch transactions by restaurantId
export const fetchTransactionsByRestaurant = createAsyncThunk(
  'transactions/fetchTransactionsByRestaurant',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
     
      const response = await axios.get(`${BASE_URL}/transactions/${restaurantId}`, { headers })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  },
)

// GET API: Fetch transaction details by transactionId
export const fetchTransactionDetails = createAsyncThunk(
  'transactions/fetchTransactionDetails',
  async ({ transactionId }, { rejectWithValue }) => {
    try {
      
      const response = await axios.get(`${BASE_URL}/transactionById/${transactionId}`, { headers })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  },
)
// DELETE API: Delete transaction by transactionId
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      

      await axios.delete(`${BASE_URL}/deleteTransaction/${id}`, { headers }, { note })
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong')
    }
  },
)

// GET API: Fetch POS transactions (no restaurant ID needed)
export const fetchPOSTransactions = createAsyncThunk(
  'transactions/fetchPOSTransactions',
  async (_, { rejectWithValue }) => {
    try {
     
      const response = await axios.get(`${BASE_URL}/POStransactions`, { headers })
      // console.log("pos transactions",response.data);
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong')
    }
  }
)

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    // posTransactions: [],
    transactionDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
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
      })
      .addCase(fetchPOSTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch POS transactions.')
      })
  },
})

export default transactionSlice.reducer
