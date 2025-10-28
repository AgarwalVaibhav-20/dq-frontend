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
  async ({ token, restaurantId }, { rejectWithValue }) => {
    try {
      if (!token || !restaurantId) {
        console.error('Missing token or restaurantId:', { token, restaurantId });
        return rejectWithValue('Missing token or restaurantId');
      }
      const url = `${BASE_URL}/customer/all`;
      const config = {
        // params: { restaurantId }, // Params are often not needed if handled by middleware
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      console.log('🚀 Fetching customers from:', url, 'for restaurantId:', restaurantId);
      const response = await axios.get(url, config); // restaurantId is likely derived from token on backend
      console.log('✅ Customers fetched:', response.data?.data?.length || 0);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching customers:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

// Add customer
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (
    { token, name, email, address, phoneNumber, birthday, anniversary, membershipId, membershipName, corporate, rewardCustomerPoints, rewardByAdminPoints },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      if (!restaurantId) {
        console.error('Restaurant ID not found in localStorage');
        return rejectWithValue('Restaurant ID not found in localStorage');
      }
      console.log('Adding customer with data:', {
        name,
        email,
        address,
        phoneNumber,
        birthday,
        anniversary,
        restaurantId,
        corporate,
        membershipId,
        membershipName,
        rewardCustomerPoints,
        rewardByAdminPoints,
      });

      // Use public API if no token (for customer menu orders)
      let url = `${BASE_URL}/customer/add`;
      let headers = {};
      
      if (!token && restaurantId) {
        console.log('🌐 Using public API for customer creation');
        url = `${BASE_URL}/customer/public/add`;
      } else if (token) {
        headers = configureHeaders(token);
      } else {
        return rejectWithValue('Token or restaurantId is required');
      }

      const response = await axios.post(
        url,
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
          membershipName,
          rewardCustomerPoints,
          rewardByAdminPoints,
        },
        headers
      );
      console.log('Customer add response:', response.data);
      const newCustomer = response.data.customer;

      // We no longer need to manually dispatch fetchCustomers,
      // The reducer will add the new customer to the state directly.

      return newCustomer; // Return just the customer object
    } catch (error) {
      console.error('Add customer error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to add customer');
    }
  }
);

// Add reward points (earned from orders)
export const addRewardPoints = createAsyncThunk(
  'customers/addRewardPoints',
  async ({ customerId, pointsToAdd }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${BASE_URL}/customer/reward-points/add/${customerId}`,
        { pointsToAdd },
        configureHeaders(token)
      );
      return response.data.data; // Return the 'data' object from controller
    } catch (error) {
      console.error('Error adding reward points:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add reward points');
    }
  }
);

// Add admin reward points (manually given by admin)
export const addAdminRewardPoints = createAsyncThunk(
  'customers/addAdminRewardPoints',
  async ({ id, pointsToAdd }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${BASE_URL}/customer/admin-reward-points/add/${id}`,
        { pointsToAdd },
        configureHeaders(token)
      );
      return response.data.data; // Return the 'data' object from controller
    } catch (error) {
      console.error('Error adding admin reward points:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add admin reward points');
    }
  }
);

// Deduct reward points
export const deductRewardPoints = createAsyncThunk(
  'customers/deductRewardPoints',
  async ({ customerId, pointsToDeduct }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${BASE_URL}/customer/reward-points/deduct/${customerId}`,
        { pointsToDeduct },
        configureHeaders(token)
      );
      return response.data.data; // Return the 'data' object from controller
    } catch (error) {
      console.error('Error deducting reward points:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to deduct reward points');
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
      await axios.delete(`${BASE_URL}/customer/delete/${_id}`, { headers });
      return _id; // Return the ID of the deleted customer
    } catch (error) {
      console.error('Delete customer error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (
    { _id, token, name, email, address, phoneNumber, birthday, anniversary, membershipId, membershipName },
    { rejectWithValue }
  ) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      if (!restaurantId) {
        console.error('Restaurant ID not found in localStorage');
        return rejectWithValue('Restaurant ID not found in localStorage');
      }
      console.log('Updating customer with data:', {
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
          membershipId,
          membershipName,
          restaurantId,
        },
        configureHeaders(token)
      );
      console.log('Customer update response:', response.data);
      return response.data.customer; // Return the updated customer object
    } catch (error) {
      console.error('Update customer error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
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
      console.error('Error fetching customers by type:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers by type');
    }
  }
);

// Update customer frequency
export const updateCustomerFrequency = createAsyncThunk(
  'customers/updateCustomerFrequency',
  async ({ id, frequency, totalSpent }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${BASE_URL}/customer/frequency/${id}`,
        { frequency, totalSpent },
        configureHeaders(token)
      );
      return response.data.customer; // Return the updated customer object
    } catch (error) {
      console.error('Error updating customer frequency:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer frequency');
    }
  }
);

// Helper function to update customer state
const updateCustomerInState = (state, customerData) => {
  const index = state.customers.findIndex((c) => c._id === customerData.customerId);
  if (index !== -1) {
    if (customerData.totalPoints !== undefined) {
      state.customers[index].rewardCustomerPoints = customerData.totalPoints;
    }
    if (customerData.totalAdminPoints !== undefined) {
      state.customers[index].rewardByAdminPoints = customerData.totalAdminPoints;
    }
    if (customerData.remainingRewardPoints !== undefined) {
      state.customers[index].rewardCustomerPoints = customerData.remainingRewardPoints;
    }
    if (customerData.remainingAdminPoints !== undefined) {
      state.customers[index].rewardByAdminPoints = customerData.remainingAdminPoints;
    }
    if (customerData.totalReward !== undefined) {
      state.customers[index].totalReward = customerData.totalReward;
    }
  }
};

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
        state.customers = action.payload || [];
        console.log('Fetched customers:', action.payload);
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Fetch customers error:', action.payload);
        toast.error(`Failed to fetch customers: ${action.payload}`);
      })
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const newCustomer = action.payload; // Payload is just the customer
        if (newCustomer && newCustomer._id) {
          state.customers.unshift(newCustomer); // Add to beginning of list
          toast.success('Customer added successfully.');
        } else {
          console.error('Invalid customer data received:', action.payload);
          toast.error('Customer added but data format is invalid.');
        }
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add customer: ${action.payload}`);
      })
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCustomer = action.payload; // Payload is the updated customer
        if (updatedCustomer && updatedCustomer._id) {
          const index = state.customers.findIndex(
            (customer) => customer._id === updatedCustomer._id
          );
          if (index !== -1) {
            state.customers[index] = updatedCustomer; // Replace old object
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
        toast.error(`Failed to update customer: ${action.payload}`);
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const deletedCustomerId = action.payload; // Payload is just the ID
        state.customers = state.customers.filter(
          (customer) => customer._id !== deletedCustomerId
        );
        toast.success('Customer deleted successfully.');
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to delete customer: ${action.payload}`);
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
        toast.error(`Failed to fetch customers by type: ${action.payload}`);
      })
      .addCase(updateCustomerFrequency.pending, (state) => {
        state.loading = true; // You might not need a loading state for this
        state.error = null;
      })
      .addCase(updateCustomerFrequency.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCustomer = action.payload; // Payload is the updated customer
        const index = state.customers.findIndex((customer) => customer._id === updatedCustomer._id);
        if (index !== -1) {
          state.customers[index] = updatedCustomer; // Replace object
        }
        // No toast needed, this happens in the background
      })
      .addCase(updateCustomerFrequency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // No toast needed
      })

      // Reward Point Reducers
      .addCase(addRewardPoints.pending, (state) => {
        state.loading = true;
      })
      .addCase(addRewardPoints.fulfilled, (state, action) => {
        state.loading = false;
        updateCustomerInState(state, action.payload);
        toast.success(`Added ${action.payload.pointsAdded} reward points!`);
      })
      .addCase(addRewardPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add reward points: ${action.payload}`);
      })

      .addCase(addAdminRewardPoints.pending, (state) => {
        state.loading = true;
      })
      .addCase(addAdminRewardPoints.fulfilled, (state, action) => {
        state.loading = false;
        updateCustomerInState(state, action.payload);
        toast.success(`Added ${action.payload.pointsAdded} admin reward points!`);
      })
      .addCase(addAdminRewardPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add admin reward points: ${action.payload}`);
      })

      .addCase(deductRewardPoints.pending, (state) => {
        state.loading = true;
      })
      .addCase(deductRewardPoints.fulfilled, (state, action) => {
        state.loading = false;
        updateCustomerInState(state, action.payload);
        toast.success(`Deducted ${action.payload.pointsDeducted} reward points!`);
      })
      .addCase(deductRewardPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to deduct reward points: ${action.payload}`);
      });
  },
});

export const { setSelectedCustomerType } = customerSlice.actions;
export default customerSlice.reducer;
