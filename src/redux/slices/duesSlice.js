import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

export const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})

// Fetch all dues
export const fetchDues = createAsyncThunk(
  'dues/fetchDues',
  async ({ token }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axios.get(`${BASE_URL}/alldue/due`, {
        params: { restaurantId },
        ...configureHeaders(token)
      })
      console.log(response.data, 'due data ')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dues')
    }
  },
)

export const fetchDuesByCustomer = createAsyncThunk(
  'dues/fetchDuesByCustomer',
  async ({ customer_id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/dues/customer/${customer_id}`,
        configureHeaders(token)
      );

      const data = response?.data?.data || [];
      console.log('Received dues:', data); // DEBUG
      return data;
    } catch (error) {
      console.error('Fetch dues error:', error.response?.data || error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer dues');
    }
  }
);



// Add a new due
export const addDue = createAsyncThunk(
  'dues/addDue',
  async ({ customer_id, total, paidAmount = 0, status, restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/due/add`,
        { customer_id, total, paidAmount, status, restaurantId },
        configureHeaders(token),
      );
      return response.data.dueTransaction;
    } catch (error) {
      console.log(error, 'adding due error');
      return rejectWithValue(error.response?.data?.message || 'Failed to add due');
    }
  },
);

// Update a due with payment
export const updateDue = createAsyncThunk(
  'dues/updateDue',
  async ({ id, customer_id, addPayment, total, status, restaurantId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')

      if (!token) {
        return rejectWithValue('No authentication token found')
      }

      console.log('Updating due with payload:', { id, customer_id, addPayment, total, status, restaurantId })

      const payload = {};
      if (customer_id) payload.customer_id = customer_id;
      if (addPayment !== undefined) payload.addPayment = parseFloat(addPayment);
      if (total !== undefined) payload.total = parseFloat(total);
      if (status) payload.status = status;
      if (restaurantId) payload.restaurantId = restaurantId;

      const response = await axios.put(
        `${BASE_URL}/dues/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      console.log('Update response:', response.data)
      return response.data.data
    } catch (error) {
      console.error('Update due error:', error.response?.data || error.message)
      return rejectWithValue(error.response?.data?.message || 'Failed to update due')
    }
  },
)

export const deleteDue = createAsyncThunk('dues/deleteDue', async ({ id }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('authToken')

    if (!token) {
      return rejectWithValue('No authentication token found')
    }

    console.log('Deleting due with ID:', id)

    await axios.delete(`${BASE_URL}/dues/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Delete successful for ID:', id)
    return id
  } catch (error) {
    console.error('Delete due error:', error.response?.data || error.message)
    return rejectWithValue(error.response?.data?.message || 'Failed to delete due')
  }
})

// Slice
const dueSlice = createSlice({
  name: 'dues',
  initialState: {
    dues: [],
    customerDues: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch dues
      .addCase(fetchDues.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDues.fulfilled, (state, action) => {
        state.loading = false
        console.log('action payload', action.payload)
        state.dues = action.payload
      })
      .addCase(fetchDues.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

      // Fetch dues by customer
      .addCase(fetchDuesByCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDuesByCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.customerDues = action.payload
      })
      .addCase(fetchDuesByCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

      .addCase(addDue.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Optimistically add the due
        const tempDue = {
          _id: `temp-${Date.now()}`,
          ...action.meta.arg,
          remainingAmount: action.meta.arg.total - (action.meta.arg.paidAmount || 0)
        };
        state.dues.push(tempDue);
      })
      .addCase(addDue.fulfilled, (state, action) => {
        state.loading = false;
        // Remove temp and add confirmed
        state.dues = state.dues.filter(due => !due._id.startsWith('temp-'));
        state.dues.push(action.payload);
      })
      .addCase(addDue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.dues = state.dues.filter(due => !due._id.startsWith('temp-'));
        toast.error(action.payload || 'Failed to add due.');
      })

      // Update due
      .addCase(updateDue.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateDue.fulfilled, (state, action) => {
        state.loading = false
        const index = state.dues.findIndex(
          (due) => (due.id || due._id) === (action.payload.id || action.payload._id),
        )
        if (index !== -1) {
          state.dues[index] = action.payload
        }
      })
      .addCase(updateDue.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete due
      .addCase(deleteDue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDue.fulfilled, (state, action) => {
        state.loading = false;
        state.dues = state.dues.filter(due =>
          (due.id || due._id) !== action.payload
        );
      })
      .addCase(deleteDue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
})

export default dueSlice.reducer

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { toast } from 'react-toastify'
// import { BASE_URL } from '../../utils/constants'

// export const configureHeaders = (token) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   },
// })
// // Fetch all dues
// export const fetchDues = createAsyncThunk(
//   'dues/fetchDues',
//   async ({ token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(`${BASE_URL}/alldue/due`, configureHeaders(token))
//       console.log(response.data, 'due data ')
//       return response.data
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch dues')
//     }
//   },
// )

// // Fetch dues by customer
// export const fetchDuesByCustomer = createAsyncThunk(
//   'dues/fetchDuesByCustomer',
//   async ({ customerId, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(`${BASE_URL}/dues/customer/${customerId}`, configureHeaders(token))
//       return response.data.data
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer dues')
//     }
//   },
// )


// // Add a new due
// export const addDue = createAsyncThunk(
//   'dues/addDue',
//   // Destructure the payload sent from the component
//   async ({ customer_id, total, status, restaurantId, token }, { rejectWithValue }) => {
//     try {
//       // The backend only needs customer_id, total, status, and restaurantId to create the due.
//       // It looks up the customerName itself.
//       const response = await axios.post(
//         `${BASE_URL}/due/add`,
//         { customer_id, total, status, restaurantId },
//         configureHeaders(token),
//       );
//       // The backend returns the full dueTransaction object, including the customerName.
//       return response.data.dueTransaction;
//     } catch (error) {
//       console.log(error, 'adding due error');
//       return rejectWithValue(error.response?.data?.message || 'Failed to add due');
//     }
//   },
// );

// // Update a due
// export const updateDue = createAsyncThunk(
//   'dues/updateDue',
//   async ({ id, transaction_id, total, status, restaurantId }, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken') // Get token here

//       if (!token) {
//         return rejectWithValue('No authentication token found')
//       }

//       console.log('Updating due with payload:', { id, transaction_id, total, status, restaurantId })

//       const response = await axios.put(
//         `${BASE_URL}/dues/${id}`,
//         {
//           transaction_id,
//           total: parseFloat(total),
//           status,
//           restaurantId,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         },
//       )

//       console.log('Update response:', response.data)
//       return response.data.data // Return the updated due data
//     } catch (error) {
//       console.error('Update due error:', error.response?.data || error.message)
//       return rejectWithValue(error.response?.data?.message || 'Failed to update due')
//     }
//   },
// )

// export const deleteDue = createAsyncThunk('dues/deleteDue', async ({ id }, { rejectWithValue }) => {
//   try {
//     const token = localStorage.getItem('authToken') // Get token here

//     if (!token) {
//       return rejectWithValue('No authentication token found')
//     }

//     console.log('Deleting due with ID:', id)

//     await axios.delete(`${BASE_URL}/dues/${id}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     })

//     console.log('Delete successful for ID:', id)
//     return id // Return only the ID for removal from state
//   } catch (error) {
//     console.error('Delete due error:', error.response?.data || error.message)
//     return rejectWithValue(error.response?.data?.message || 'Failed to delete due')
//   }
// })

// // Slice
// const dueSlice = createSlice({
//   name: 'dues',
//   initialState: {
//     dues: [],
//     customerDues: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // Fetch dues
//       .addCase(fetchDues.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(fetchDues.fulfilled, (state, action) => {
//         state.loading = false
//         console.log('action payload', action.payload)
//         state.dues = action.payload
//       })
//       .addCase(fetchDues.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       // Fetch dues by customer
//       .addCase(fetchDuesByCustomer.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(fetchDuesByCustomer.fulfilled, (state, action) => {
//         state.loading = false
//         state.customerDues = action.payload
//       })
//       .addCase(fetchDuesByCustomer.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })


//       .addCase(addDue.pending, (state, action) => {
//         state.loading = true;
//         state.error = null;
//         // Optimistically add the due with info from the form.
//         // action.meta.arg contains the payload sent to the thunk.
//         state.dues.push({
//           _id: `temp-${Date.now()}`, // Give it a temporary ID
//           ...action.meta.arg
//         });
//       })
//       .addCase(addDue.fulfilled, (state, action) => {
//         state.loading = false;
//         // Find and remove the temporary due
//         state.dues = state.dues.filter(due => !due._id.startsWith('temp-'));
//         // Add the final, confirmed due from the server
//         state.dues.push(action.payload);
//       })
//       .addCase(addDue.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         // Remove the optimistically added due if the API call fails
//         state.dues = state.dues.filter(due => !due._id.startsWith('temp-'));
//         toast.error(action.payload || 'Failed to add due.');
//       })

//       // Update due (optimistic update)
//       .addCase(updateDue.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(updateDue.fulfilled, (state, action) => {
//         state.loading = false
//         // Find and update the due in the array
//         const index = state.dues.findIndex(
//           (due) => (due.id || due._id) === (action.payload.id || action.payload._id),
//         )
//         if (index !== -1) {
//           state.dues[index] = action.payload
//         }
//       })
//       .addCase(updateDue.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//       })

//       // Delete due (optimistic update)
//       .addCase(deleteDue.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteDue.fulfilled, (state, action) => {
//         state.loading = false;
//         // Remove the due from the array
//         state.dues = state.dues.filter(due =>
//           (due.id || due._id) !== action.payload
//         );
//       })
//       .addCase(deleteDue.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// })

// export default dueSlice.reducer
