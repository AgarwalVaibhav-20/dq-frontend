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
        params: { restaurantId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      console.log('🚀 Fetching customers from:', url, 'with restaurantId:', restaurantId);
      const response = await axios.get(url, config);
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
    { token, name, email, address, phoneNumber, birthday, anniversary, membershipId, membershipName, corporate, rewardCustomerPoints },
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
      });
      const response = await axios.post(
        `${BASE_URL}/customer/add`,
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
        },
        configureHeaders(token)
      );
      console.log('Customer add response:', response.data);
      // Optimistically add to state
      const newCustomer = response.data.customer;
      if (newCustomer && newCustomer._id) {
        // Optional delay to ensure DB sync
        setTimeout(() => {
          dispatch(fetchCustomers({ token, restaurantId })).unwrap().catch((err) => {
            console.error('Failed to fetch customers after adding:', err);
            toast.warn('Customer added, but failed to refresh customer list: ' + (err.message || 'Unknown error'));
          });
        }, 500);
      }
      return response.data;
    } catch (error) {
      console.error('Add customer error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to add customer');
    }
  }
);

// Add reward points
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
      return response.data;
    } catch (error) {
      console.error('Error adding reward points:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add reward points');
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
      return response.data;
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
      const response = await axios.delete(`${BASE_URL}/customer/delete/${_id}`, { headers });
      return response.data;
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
    { rejectWithValue, dispatch }
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
      dispatch(fetchCustomers({ token, restaurantId })).unwrap().catch((err) => {
        console.error('Failed to fetch customers after updating:', err);
        toast.warn('Customer updated, but failed to refresh customer list: ' + (err.message || 'Unknown error'));
      });
      return response.data;
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
      return response.data;
    } catch (error) {
      console.error('Error updating customer frequency:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer frequency');
    }
  }
);

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
        const newCustomer = action.payload.customer;
        if (newCustomer && newCustomer._id) {
          const existingIndex = state.customers.findIndex(
            (customer) => customer._id === newCustomer._id
          );
          if (existingIndex === -1) {
            state.customers.unshift(newCustomer);
            console.log('Customer added to state:', newCustomer);
          } else {
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
        toast.error(`Failed to add customer: ${action.payload}`);
      })
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCustomer = action.payload.customer;
        if (updatedCustomer && updatedCustomer._id) {
          const index = state.customers.findIndex(
            (customer) => customer._id === updatedCustomer._id
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
        toast.error(`Failed to update customer: ${action.payload}`);
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const deletedCustomerId = action.meta.arg._id;
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
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerFrequency.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCustomer = action.payload.customer;
        const index = state.customers.findIndex((customer) => customer._id === updatedCustomer._id);
        if (index !== -1) {
          state.customers[index] = updatedCustomer;
        }
        toast.success('Customer frequency updated successfully.');
      })
      .addCase(updateCustomerFrequency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to update customer frequency: ${action.payload}`);
      })
      .addCase(addRewardPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRewardPoints.fulfilled, (state, action) => {
        state.loading = false;
        const customerIndex = state.customers.findIndex(
          (c) => c._id === action.payload.data.customerId
        );
        if (customerIndex !== -1) {
          state.customers[customerIndex].rewardCustomerPoints =
            action.payload.data.totalPoints;
        }
        toast.success(`Added ${action.payload.data.pointsAdded} reward points!`);
      })
      .addCase(addRewardPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Failed to add reward points: ${action.payload}`);
      })
      .addCase(deductRewardPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deductRewardPoints.fulfilled, (state, action) => {
        state.loading = false;
        const customerIndex = state.customers.findIndex(
          (c) => c._id === action.payload.data.customerId
        );
        if (customerIndex !== -1) {
          state.customers[customerIndex].rewardCustomerPoints =
            action.payload.data.remainingPoints;
        }
        toast.success(`Deducted ${action.payload.data.pointsDeducted} reward points!`);
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