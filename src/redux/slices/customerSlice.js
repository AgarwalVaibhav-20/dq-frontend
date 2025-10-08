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
      // Always fetch all customers regardless of restaurantId
      const url = `${BASE_URL}/customer/all`;

      console.log("🚀 Fetching all customers from:", url);

      const response = await axios.get(url);
      console.log("✅ Customers fetched:", response.data?.length || 0);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Add customer
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async ({ token, name, email, address, phoneNumber, birthday, anniversary, membershipId, membershipName, corporate }, { rejectWithValue, dispatch }) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");
      if (!restaurantId) {
        return rejectWithValue("Restaurant ID not found in localStorage");
      }

      console.log('Adding customer with data:', { name, email, address, phoneNumber, birthday, anniversary, restaurantId });

      const response = await axios.post(`${BASE_URL}/customer/add`,
        {
          name,
          email,
          address,
          phoneNumber,
          restaurantId,
          anniversary,
          corporate,
          birthday,
          membershipId,
          membershipName
        },
        configureHeaders(token));

      console.log('Customer add response:', response.data);

      // Optionally refresh the customers list after adding
      if (response.data && response.data.customer) {
        // Dispatch fetchCustomers to ensure data consistency
        dispatch(fetchCustomers({ restaurantId }));
      }

      return response.data;
    } catch (error) {
      console.log("Add customer error:", error);
      console.error(error);
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
// Update customer
export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async (
    {
      _id,
      token,
      name,
      email,
      address,
      phoneNumber,
      birthday,
      anniversary,
      membershipId,
      membershipName,
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const restaurantId = localStorage.getItem("restaurantId");
      if (!restaurantId) {
        return rejectWithValue("Restaurant ID not found in localStorage");
      }

      console.log("Updating customer with data:", {
        _id,
        name,
        email,
        address,
        phoneNumber,
        birthday,
        anniversary,
        membershipId,
        membershipName,
      });

      const response = await axios.put(
        `${BASE_URL}/customer/update/${_id}`,
        {
          name,
          email,
          address,
          phoneNumber,
          birthday,
          anniversary,
          membershipId,   // ✅ correct key
          membershipName, // ✅ correct key
          restaurantId,
        },
        configureHeaders(token)
      );

      console.log("Customer update response:", response.data);

      if (response.data && response.data.customer) {
        dispatch(fetchCustomers({ restaurantId }));
      }

      return response.data;
    } catch (error) {
      console.error("Update customer error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch customers by type
export const fetchCustomersByType = createAsyncThunk(
  'customers/fetchCustomersByType',
  async ({ restaurantId, customerType }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/customer/type/${restaurantId}/${customerType}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update customer frequency
export const updateCustomerFrequency = createAsyncThunk(
  'customers/updateCustomerFrequency',
  async ({ id, frequency, totalSpent }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${BASE_URL}/customer/frequency/${id}`,
        { frequency, totalSpent },
        configureHeaders(token)
      );
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
    selectedCustomerType: 'All',
  },
  reducers: {
    setSelectedCustomerType: (state, action) => {
      state.selectedCustomerType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Fetched customers:', action.payload);
        state.customers = action.payload || [];
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
        console.log('Add customer response:', action.payload);

        // Backend sends: { message: "...", customer: newCustomer }
        const newCustomer = action.payload.customer;

        if (newCustomer && (newCustomer._id || newCustomer.id)) {
          // Check if customer already exists to avoid duplicates
          const existingIndex = state.customers.findIndex(
            customer => customer._id === newCustomer._id || customer.id === newCustomer.id
          );

          if (existingIndex === -1) {
            // Add the new customer to the beginning of the array for immediate visibility
            state.customers.unshift(newCustomer);
            console.log('Customer added to state:', newCustomer);
          } else {
            // Update existing customer if found
            state.customers[existingIndex] = newCustomer;
            console.log('Customer updated in state:', newCustomer);
          }

          toast.success('Customer added successfully.');
        } else {
          console.error('Invalid customer data received:', action.payload);
          toast.error('Customer added but data format is invalid.');
        }
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to add customer.');
      })
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Update customer response:', action.payload);

        const updatedCustomer = action.payload.customer;

        if (updatedCustomer && (updatedCustomer._id || updatedCustomer.id)) {
          const index = state.customers.findIndex(
            customer => customer._id === updatedCustomer._id || customer.id === updatedCustomer.id
          );

          if (index !== -1) {
            state.customers[index] = updatedCustomer;
            console.log('Customer updated in state:', updatedCustomer);
          }

          toast.success('Customer updated successfully.');
        } else {
          console.error('Invalid customer data received:', action.payload);
          toast.error('Customer updated but data format is invalid.');
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to update customer.');
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
      })
      .addCase(fetchCustomersByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomersByType.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomersByType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error('Failed to fetch customers by type.');
      })
      .addCase(updateCustomerFrequency.fulfilled, (state, action) => {
        const updatedCustomer = action.payload.customer;
        const index = state.customers.findIndex(customer => customer._id === updatedCustomer._id);
        if (index !== -1) {
          state.customers[index] = updatedCustomer;
        }
        toast.success('Customer frequency updated successfully.');
      })
      .addCase(updateCustomerFrequency.rejected, (state, action) => {
        state.error = action.payload;
        toast.error('Failed to update customer frequency.');
      });
  },
});

export const { setSelectedCustomerType } = customerSlice.actions;
export default customerSlice.reducer;
