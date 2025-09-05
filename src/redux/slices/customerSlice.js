// Import necessary modules
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
// Fetch customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/customer/${restaurantId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Add customer
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async ({ token, name, email, address, phoneNumber }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");
      if (!restaurantId) {
        return rejectWithValue("Restaurant ID not found in localStorage");
      }
      const response = await axios.post(`${BASE_URL}/customer/add`,
        {
          name,
          email,
          address,
          phoneNumber,
          restaurantId,
        },
         configureHeaders(token));
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.log("This is error" , error)
      console.error(error)
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async ({ _id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.delete(`${BASE_URL}/customer/delete/${_id}`, { headers });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Customer slice
const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    customers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to fetch customers.');
      })
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload)
        state.customers.push(action.payload);
        console.log(action.payload)
        toast.success('Customer added successfully.');
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to add customer.');
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const deletedCustomerId = action.meta.arg.id;
        state.customers = state.customers.filter(
          (customer) => customer.id !== deletedCustomerId
        );
        toast.success('Customer deleted successfully.');
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to delete customer.');
      });
  },
});

export default customerSlice.reducer;
