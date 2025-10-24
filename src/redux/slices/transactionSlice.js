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
        roundOff,
        systemCharge,
        notes,
      } = payload;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fix: Get restaurantId and userId from localStorage correctly
      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
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
        customerId: customerId || null,
        transactionId,
        systemCharge,
        roundOff,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
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

// NEW: Cash In transaction
export const createCashInTransaction = createAsyncThunk(
  'transactions/createCashInTransaction',
  async ({ total, token, userId, restaurantId, username, notes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
      const finalUserId = userId || localStorage.getItem('userId');
      const finalUsername = username || localStorage.getItem('username');

      const requestData = {
        username: finalUsername,
        restaurantId: finalRestaurantId,
        userId: finalUserId,
        total,
        type: 'CashIn',
        notes
      };

      console.log('Cash In payload:', requestData);

      const response = await axios.post(`${BASE_URL}/cashin`, requestData, configureHeaders(token));

      // Fix: Return the correct data structure
      return {
        ...response.data,
        amount: total, // Use total instead of undefined amount
        transaction: response.data.transaction
      };
    } catch (error) {
      console.log("Error of cashin", error)
      console.error('Cash In transaction error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to create cash in transaction' });
    }
  }
)

export const createCashOutTransaction = createAsyncThunk(
  'transactions/createCashOutTransaction',
  async ({ amount, token, userId, restaurantId, username, notes }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
      const finalUserId = userId || localStorage.getItem('userId');
      const finalUsername = username || localStorage.getItem('username');

      const requestData = {
        username: finalUsername,
        restaurantId: finalRestaurantId,
        userId: finalUserId,
        total: amount, // Use 'total' to match backend expectation
        type: 'CashOut',
        notes,
      };

      console.log('Cash Out payload:', requestData);

      const response = await axios.post(`${BASE_URL}/cashout`, requestData, { headers });
      return {
        ...response.data,
        amount,
        notes,
        transaction: response.data.transaction
      };
    } catch (error) {
      console.error('Cash Out transaction error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to create cash out transaction' });
    }
  }
)

export const createBankInTransaction = createAsyncThunk(
  'transactions/createBankInTransaction',
  async ({ total, token, userId, restaurantId, username, notes, type }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
      const finalUserId = userId || localStorage.getItem('userId');
      const finalUsername = username || localStorage.getItem('username');

      const requestData = {
        username: finalUsername,
        restaurantId: finalRestaurantId,
        userId: finalUserId,
        total: total,
        type: type || 'bank_in',
        notes,
      };

      console.log('Bank In payload:', requestData);
      const response = await axios.post(`${BASE_URL}/bankin`, requestData, { headers });

      return {
        ...response.data,
        amount: total,
        notes,
        transaction: { ...response.data.transaction, type: 'bank_in' }
      };

    } catch (error) {
      console.error('Bank In transaction error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to create bank in transaction' });
    }
  }
);

export const createBankOutTransaction = createAsyncThunk(
  'transactions/createBankOutTransaction',
  async ({ amount, token, userId, restaurantId, username, notes }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
      const finalUserId = userId || localStorage.getItem('userId');
      const finalUsername = username || localStorage.getItem('username');

      const requestData = {
        username: finalUsername,
        restaurantId: finalRestaurantId,
        userId: finalUserId,
        total: amount, // Use 'total' to match backend expectation
        type: 'BankOut',
        notes,
      };

      console.log('Bank Out payload:', requestData);

      const response = await axios.post(`${BASE_URL}/bankout`, requestData, { headers });
      return {
        ...response.data,
        amount,
        notes,
        transaction: response.data.transaction
      };
    } catch (error) {
      console.error('Bank Out transaction error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to create bank out transaction' });
    }
  }
)

// NEW: Get daily cash balance
export const getDailyCashBalance = createAsyncThunk(
  'transactions/getDailyCashBalance',
  async ({ token, restaurantId }, { rejectWithValue }) => {
    try {
      const headers = {
        Authorization: `Bearer ${token || localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      };
      const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${BASE_URL}/get-daily-cash-balance/${finalRestaurantId}/${today}`, { headers });
      console.log("Daily cash balance response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily cash balance:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch daily cash balance' });
    }
  }
)
// export const getDailyCashBalance = createAsyncThunk(
//   'transactions/getDailyCashBalance',
//   async ({ token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const headers = {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       };

//       const finalRestaurantId = String(restaurantId || localStorage.getItem('restaurantId'));

//       // Get today's date in YYYY-MM-DD format
//       const today = new Date().toISOString().split('T')[0];

//       const response = await axios.get(`${BASE_URL}/get-daily-cash-balance/${finalRestaurantId}/${today}`, { headers });
//       console.log("Daily cash balance response:", response.data);
//       return response.data.balance || 0;
//     } catch (error) {
//       console.error('Error fetching daily cash balance:', error);
//       return rejectWithValue(error.response?.data || { message: 'Failed to fetch daily cash balance' });
//     }
//   }
// )

// GET API: Fetch transactions by restaurantId
export const fetchTransactionsByRestaurant = createAsyncThunk(
  'transactions/fetchTransactionsByRestaurant',
  async ({ restaurantId, token }, { rejectWithValue }) => {
    try {
      console.log("Fetching transactions with token:", token);
      const response = await axios.get(`${BASE_URL}/get-by-restaurant/transaction/${String(restaurantId)}`, configureHeaders(token))
      console.log("Response data tran:", response.data)

      // Return the actual data array, not the wrapper object
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error fetching transactions:", error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transactions' });
    }
  },
)

export const fetchTransactionsByRestaurantyear = createAsyncThunk(
  "transactions/fetchTransactionsByRestaurantyear",
  async ({ restaurantId, year, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/get-by-year-restaurant/transaction/${restaurantId}?year=${year}`,
        configureHeaders(token)
      );
      console.log("yearkadata", response.data);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch transactions"
      );
    }
  }
);

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

      // Handle the response format - backend returns { success: true, data: transaction }
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transaction details' });
    }
  },
)

// DELETE API: Delete transaction by transactionId
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async ({ id, deletionRemark }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fix: Send note in request body, not as separate object
      await axios.delete(`${BASE_URL}/deleteTransaction/${id}`, {
        headers,
        data: { deletionRemark }
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
    dailyCashBalance: 0,
    cashLoading: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
    // Local cash balance update for UI responsiveness
    updateLocalCashBalance: (state, action) => {
      state.dailyCashBalance = action.payload;
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
        const newTransaction = action.payload.transaction;

        if (!newTransaction) {
          toast.error('Received an invalid transaction response from the server.');
          return;
        }

        state.transactions = [newTransaction, ...state.transactions];
        toast.success('Transaction created successfully.')

        // FIXED: Only update balance for regular Cash payments, not CashIn/CashOut
        if (newTransaction.type === 'Cash' &&
          newTransaction.transactionType !== 'CashIn' &&
          newTransaction.transactionType !== 'CashOut') {
          const currentBalance = Number(state.dailyCashBalance) || 0;
          const transactionTotal = Number(newTransaction.total) || 0;
          state.dailyCashBalance = currentBalance + transactionTotal;
        }
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to create transaction.')
      })

      // Cash In Transaction
      .addCase(createCashInTransaction.pending, (state) => {
        state.cashLoading = true
        state.error = null
      })
      .addCase(createCashInTransaction.fulfilled, (state, action) => {
        state.cashLoading = false

        // Add to transactions list
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }

        // FIXED: Don't update balance locally - let the server handle it
        // The balance will be updated when getDailyCashBalance is called
        state.error = null
        const amount = action.payload.transaction?.total || 0;
        toast.success(`Cash In: ₹${amount.toFixed(2)} added successfully!`)
      })
      .addCase(createCashInTransaction.rejected, (state, action) => {
        state.cashLoading = false
        state.error = action.payload
        const errorMessage = action.payload?.message || 'Failed to process cash in transaction.';
        toast.error(errorMessage)
      })

      // Cash Out Transaction
      .addCase(createCashOutTransaction.pending, (state) => {
        state.cashLoading = true
        state.error = null
      })
      .addCase(createCashOutTransaction.fulfilled, (state, action) => {
        state.cashLoading = false

        // Add to transactions list
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }

        // FIXED: Don't update balance locally - let the server handle it
        // The balance will be updated when getDailyCashBalance is called
        state.error = null
        const amount = action.payload.transaction?.total || 0;
        toast.success(`Cash Out: ₹${amount.toFixed(2)} removed successfully!`)
      })
      .addCase(createCashOutTransaction.rejected, (state, action) => {
        state.cashLoading = false
        state.error = action.payload
        const errorMessage = action.payload?.message || 'Failed to process cash out transaction.';
        toast.error(errorMessage)
      })

      // .addCase(createTransaction.pending, (state) => {
      //   state.loading = true
      //   state.error = null
      // })
      // .addCase(createTransaction.fulfilled, (state, action) => {
      //   state.loading = false
      //   // Add new transaction to the beginning of the array
      //   state.transactions = [action.payload.transaction, ...state.transactions];
      //   state.error = null
      //   toast.success('Transaction created successfully.')
      // })
      // .addCase(createTransaction.rejected, (state, action) => {
      //   state.loading = false
      //   state.error = action.payload
      //   toast.error('Failed to create transaction.')
      // })

      // Cash In Transaction
      // .addCase(createCashInTransaction.pending, (state) => {
      //   state.cashLoading = true
      //   state.error = null
      // })
      // .addCase(createCashInTransaction.fulfilled, (state, action) => {
      //   state.cashLoading = false
      //   // Add to transactions list using the consistent 'transaction' key
      //   if (action.payload.transaction) {
      //     state.transactions = [action.payload.transaction, ...state.transactions];
      //   }
      //   // Update daily cash balance from the saved transaction's total
      //   const amount = action.payload.transaction?.total || 0;
      //   state.dailyCashBalance += amount;
      //   state.error = null
      //   toast.success(`Cash In: ₹${amount.toFixed(2)} added successfully!`)
      // })
      // .addCase(createCashInTransaction.rejected, (state, action) => {
      //   state.cashLoading = false
      //   state.error = action.payload
      //   const errorMessage = action.payload?.message || 'Failed to process cash in transaction.';
      //   toast.error(errorMessage)
      // })

      // Cash Out Transaction
      // .addCase(createCashOutTransaction.pending, (state) => {
      //   state.cashLoading = true
      //   state.error = null
      // })
      // .addCase(createCashOutTransaction.fulfilled, (state, action) => {
      //   state.cashLoading = false
      //   // Add to transactions list using the consistent 'transaction' key
      //   if (action.payload.transaction) {
      //     state.transactions = [action.payload.transaction, ...state.transactions];
      //   }
      //   // Update daily cash balance from the saved transaction's total
      //   const amount = action.payload.transaction?.total || 0;
      //   state.dailyCashBalance -= amount;
      //   state.error = null
      //   toast.success(`Cash Out: ₹${amount.toFixed(2)} removed successfully!`)
      // })
      // .addCase(createCashOutTransaction.rejected, (state, action) => {
      //   state.cashLoading = false
      //   state.error = action.payload
      //   const errorMessage = action.payload?.message || 'Failed to process cash out transaction.';
      //   toast.error(errorMessage)
      // })


      // Get Daily Cash Balance
      // addCase(getDailyCashBalance.pending, (state) => {
      //   state.cashLoading = true
      // })
      .addCase(getDailyCashBalance.pending, (state) => {
        state.cashLoading = true
      })
      .addCase(getDailyCashBalance.fulfilled, (state, action) => {
        state.cashLoading = false

        // FIXED: Handle the exact response format from your API
        console.log('API Response:', action.payload);

        // Your API returns { balance, cashIn, cashOut, transactionCount }
        state.dailyCashBalance = Number(action.payload.balance) || 0;
        state.dailyTransactionCount = Number(action.payload.transactionCount) || 0;

        // Optional: Store additional data if needed
        state.dailyCashIn = Number(action.payload.cashIn) || 0;
        state.dailyCashOut = Number(action.payload.cashOut) || 0;

        state.error = null

        console.log('Updated dailyCashBalance to:', state.dailyCashBalance);
      })
      .addCase(getDailyCashBalance.rejected, (state, action) => {
        state.cashLoading = false
        state.error = action.payload
        console.error('Failed to fetch daily cash balance:', action.payload)
      })
      // .addCase(getDailyCashBalance.pending, (state) => {
      //   state.cashLoading = true
      // })
      // .addCase(getDailyCashBalance.fulfilled, (state, action) => {
      //   state.cashLoading = false
      //   // Handle different response formats from backend
      //   if (typeof action.payload === 'number') {
      //     state.dailyCashBalance = action.payload
      //   } else if (action.payload?.balance !== undefined) {
      //     state.dailyCashBalance = action.payload.balance
      //   } else if (Array.isArray(action.payload)) {
      //     // Handle array response format [{ type: "CashIn", total: 100 }, { type: "CashOut", total: 50 }]
      //     const cashIn = action.payload.find(item => item.type === "CashIn")?.total || 0;
      //     const cashOut = action.payload.find(item => item.type === "CashOut")?.total || 0;
      //     state.dailyCashBalance = cashIn - cashOut;
      //   } else {
      //     state.dailyCashBalance = 0
      //   }
      //   state.error = null
      // })
      // .addCase(getDailyCashBalance.rejected, (state, action) => {
      //   state.cashLoading = false
      //   state.error = action.payload
      //   // Don't show error toast for balance fetch failures to avoid spam
      //   console.error('Failed to fetch daily cash balance:', action.payload)
      // })

      // Fetch Transactions by Restaurant

      .addCase(createBankInTransaction.pending, (state) => {
        state.cashLoading = true
        state.error = null
      })
      .addCase(createBankInTransaction.fulfilled, (state, action) => {
        state.cashLoading = false

        // Add to transactions list
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }

        // FIXED: Don't update balance locally - let the server handle it
        state.error = null
        const amount = action.payload.transaction?.total || 0;
        toast.success(`Bank In: ₹${amount.toFixed(2)} added successfully!`)
      })
      .addCase(createBankInTransaction.rejected, (state, action) => {
        state.cashLoading = false
        state.error = action.payload
        const errorMessage = action.payload?.message || 'Failed to process bank in transaction.';
        toast.error(errorMessage)
      })
      .addCase(createBankOutTransaction.fulfilled, (state, action) => {
        state.cashLoading = false

        // Add to transactions list
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }

        // FIXED: Don't update balance locally - let the server handle it
        // The balance will be updated when getDailyCashBalance is called
        state.error = null
        const amount = action.payload.transaction?.total || 0;
        // Fixed: Changed message to reflect Bank Out
        toast.success(`Bank Out: ₹${amount.toFixed(2)} removed successfully!`)
      })
      .addCase(createBankOutTransaction.rejected, (state, action) => {
        state.cashLoading = false
        state.error = action.payload
        const errorMessage = action.payload?.message || 'Failed to process bank out transaction.';
        toast.error(errorMessage)
      })

      .addCase(fetchTransactionsByRestaurant.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionsByRestaurant.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
        console.log("tran data", action.payload);
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
            (transaction) => transaction._id !== action.payload, // Fixed: use _id instead of id
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
  // extraReducers: (builder) => {
  //   builder
  //     // Create Transaction
  //     .addCase(createTransaction.pending, (state) => {
  //       state.loading = true
  //       state.error = null
  //     })
  //     .addCase(createTransaction.fulfilled, (state, action) => {
  //       state.loading = false
  //       // Add new transaction to the beginning of the array
  //       state.transactions = [action.payload.transaction, ...state.transactions];
  //       state.error = null
  //       toast.success('Transaction created successfully.')
  //     })
  //     .addCase(createTransaction.rejected, (state, action) => {
  //       state.loading = false
  //       state.error = action.payload
  //       toast.error('Failed to create transaction.')
  //     })

  //     // Cash In Transaction
  //     .addCase(createCashInTransaction.pending, (state) => {
  //       state.cashLoading = true
  //       state.error = null
  //     })
  //     .addCase(createCashInTransaction.fulfilled, (state, action) => {
  //       state.cashLoading = false
  //       // Add to transactions list
  //       if (action.payload.transaction) {
  //         state.transactions = [action.payload.transaction, ...state.transactions];
  //       }
  //       // Update daily cash balance
  //       state.dailyCashBalance += action.payload.amount
  //       state.error = null
  //       toast.success(`Cash In: ₹${action.payload.amount.toFixed(2)} added successfully!`)
  //     })
  //     .addCase(createCashInTransaction.rejected, (state, action) => {
  //       state.cashLoading = false
  //       state.error = action.payload
  //       toast.error('Failed to process cash in transaction.')
  //     })

  //     // Cash Out Transaction
  //     .addCase(createCashOutTransaction.pending, (state) => {
  //       state.cashLoading = true
  //       state.error = null
  //     })
  //     .addCase(createCashOutTransaction.fulfilled, (state, action) => {
  //       state.cashLoading = false
  //       // Add to transactions list
  //       if (action.payload.transaction) {
  //         state.transactions = [action.payload.transaction, ...state.transactions];
  //       }
  //       // Update daily cash balance
  //       state.dailyCashBalance -= action.payload.amount
  //       state.error = null
  //       toast.success(`Cash Out: ₹${action.payload.amount.toFixed(2)} removed successfully!`)
  //     })
  //     .addCase(createCashOutTransaction.rejected, (state, action) => {
  //       state.cashLoading = false
  //       state.error = action.payload
  //       toast.error('Failed to process cash out transaction.')
  //     })

  //     // Get Daily Cash Balance
  //     .addCase(getDailyCashBalance.pending, (state) => {
  //       state.cashLoading = true
  //     })
  //     .addCase(getDailyCashBalance.fulfilled, (state, action) => {
  //       state.cashLoading = false
  //       state.dailyCashBalance = action.payload
  //       state.error = null
  //     })
  //     .addCase(getDailyCashBalance.rejected, (state, action) => {
  //       state.cashLoading = false
  //       state.error = action.payload
  //     })

  //     // Fetch Transactions by Restaurant
  //     .addCase(fetchTransactionsByRestaurant.pending, (state) => {
  //       state.loading = true
  //       state.error = null
  //     })
  //     .addCase(fetchTransactionsByRestaurant.fulfilled, (state, action) => {
  //       state.loading = false
  //       state.transactions = action.payload
  //       state.error = null
  //     })
  //     .addCase(fetchTransactionsByRestaurant.rejected, (state, action) => {
  //       state.loading = false
  //       state.error = action.payload
  //       toast.error('Failed to fetch transactions.')
  //     })

  //     // Fetch Transaction Details
  //     .addCase(fetchTransactionDetails.pending, (state) => {
  //       state.loading = true
  //       state.error = null
  //     })
  //     .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
  //       state.loading = false
  //       state.transactionDetails = action.payload
  //       state.error = null
  //     })
  //     .addCase(fetchTransactionDetails.rejected, (state, action) => {
  //       state.loading = false
  //       state.error = action.payload
  //       toast.error('Failed to fetch transaction details.')
  //     })

  //     // Delete Transaction
  //     .addCase(deleteTransaction.pending, (state) => {
  //       state.loading = true
  //       state.error = null
  //     })
  //     .addCase(deleteTransaction.fulfilled, (state, action) => {
  //       state.loading = false
  //       if (action.payload) {
  //         state.transactions = state.transactions.filter(
  //           (transaction) => transaction.id !== action.payload,
  //         )
  //         toast.success('Transaction deleted successfully.')
  //       }
  //       state.error = null
  //     })
  //     .addCase(deleteTransaction.rejected, (state, action) => {
  //       state.loading = false
  //       state.error = action.payload
  //       toast.error('Failed to delete transaction.')
  //     })

  //     // Fetch POS Transactions
  //     .addCase(fetchPOSTransactions.pending, (state) => {
  //       state.loading = true
  //       state.error = null
  //     })
  //     .addCase(fetchPOSTransactions.fulfilled, (state, action) => {
  //       state.loading = false
  //       state.transactions = action.payload
  //       state.error = null
  //     })
  //     .addCase(fetchPOSTransactions.rejected, (state, action) => {
  //       state.loading = false
  //       state.error = action.payload
  //       toast.error('Failed to fetch POS transactions.')
  //     })
  // },
})

export const { clearError, clearTransactions, updateLocalCashBalance } = transactionSlice.actions;
export default transactionSlice.reducer;