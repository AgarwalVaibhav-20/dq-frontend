// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { BASE_URL } from '../../utils/constants';
// import { toast } from 'react-toastify';

// // -------------------- Helpers -------------------- //
// const configureHeaders = (token, isFormData = false) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
//   },
// });

// // -------------------- Async Thunks -------------------- //

// // Fetch all restaurants
// export const fetchRestaurants = createAsyncThunk(
//   'restaurants/fetchAll',
//   async ({ token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const config = {
//         ...configureHeaders(token),
//         params: restaurantId ? { restaurantId } : {},
//       };

//       const response = await axios.get(`${BASE_URL}/all/restaurants`, config);

//       console.log('Fetch Restaurants Response:', response.data);

//       // Ensure safe structure
//       if (!response.data || response.data.success === false) {
//         return rejectWithValue(response.data?.message || 'Failed to fetch restaurants');
//       }

//       // Return the restaurants array, ensuring it's always an array
//       const restaurants = response.data.restaurants || response.data.data || [];
      
//       // Validate that it's actually an array
//       if (!Array.isArray(restaurants)) {
//         console.error('Invalid response format - restaurants is not an array:', restaurants);
//         return [];
//       }

//       return restaurants;
//     } catch (error) {
//       console.error('Fetch Restaurants Error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch restaurants';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Create restaurant
// export const createRestaurant = createAsyncThunk(
//   'restaurants/create',
//   async ({ formData, token, restaurantId }, { rejectWithValue }) => {
//     try {
//       if (restaurantId) {
//         formData.append('restaurantId', restaurantId);
//       }

//       const response = await axios.post(
//         `${BASE_URL}/create/restaurants`,
//         formData,
//         configureHeaders(token, true)
//       );

//       console.log('Create Restaurant Response:', response.data);

//       if (!response.data || response.data.success === false) {
//         return rejectWithValue(response.data?.message || 'Failed to create restaurant');
//       }

//       return response.data.restaurant || response.data.data;
//     } catch (error) {
//       console.error('Create Restaurant Error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create restaurant';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Update restaurant
// export const updateRestaurant = createAsyncThunk(
//   'restaurants/update',
//   async ({ id, formData, token, restaurantId }, { rejectWithValue }) => {
//     try {
//       if (restaurantId) {
//         formData.append('restaurantId', restaurantId);
//       }

//       const response = await axios.put(
//         `${BASE_URL}/restaurants/update/${id}`,
//         formData,
//         configureHeaders(token, true)
//       );

//       console.log('Update Restaurant Response:', response.data);

//       if (!response.data || response.data.success === false) {
//         return rejectWithValue(response.data?.message || 'Failed to update restaurant');
//       }

//       return response.data.restaurant || response.data.data;
//     } catch (error) {
//       console.error('Update Restaurant Error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to update restaurant';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Delete restaurant
// export const deleteRestaurant = createAsyncThunk(
//   'restaurants/delete',
//   async ({ id, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.delete(
//         `${BASE_URL}/restaurants/delete/${id}`,
//         configureHeaders(token)
//       );

//       console.log('Delete Restaurant Response:', response.data);

//       return id;
//     } catch (error) {
//       console.error('Delete Restaurant Error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to delete restaurant';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Update restaurant status
// export const updateRestaurantStatus = createAsyncThunk(
//   'restaurants/updateStatus',
//   async ({ id, status, token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.patch(
//         `${BASE_URL}/restaurants/${id}/status`,
//         { status, restaurantId },
//         configureHeaders(token)
//       );

//       console.log('Update Status Response:', response.data);

//       if (!response.data || response.data.success === false) {
//         return rejectWithValue(response.data?.message || 'Failed to update status');
//       }

//       return response.data.restaurant || response.data.data;
//     } catch (error) {
//       console.error('Update Status Error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // -------------------- Slice -------------------- //
// const restaurantSlice = createSlice({
//   name: 'restaurants',
//   initialState: {
//     restaurants: [],
//     selectedRestaurant: null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     clearSelectedRestaurant: (state) => {
//       state.selectedRestaurant = null;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch all
//       .addCase(fetchRestaurants.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchRestaurants.fulfilled, (state, action) => {
//         state.loading = false;
//         // Ensure we always set an array
//         state.restaurants = Array.isArray(action.payload) ? action.payload : [];
//       })
//       .addCase(fetchRestaurants.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.restaurants = []; // Reset to empty array on error
//         toast.error(action.payload || 'Failed to fetch restaurants');
//       })

//       // Create
//       .addCase(createRestaurant.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createRestaurant.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload) {
//           state.restaurants.push(action.payload);
//         }
//         toast.success('Restaurant created successfully!');
//       })
//       .addCase(createRestaurant.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(action.payload || 'Failed to create restaurant');
//       })

//       // Update
//       .addCase(updateRestaurant.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateRestaurant.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload && action.payload._id) {
//           state.restaurants = state.restaurants.map(r =>
//             r._id === action.payload._id ? action.payload : r
//           );
//         }
//         toast.success('Restaurant updated successfully!');
//       })
//       .addCase(updateRestaurant.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(action.payload || 'Failed to update restaurant');
//       })

//       // Delete
//       .addCase(deleteRestaurant.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteRestaurant.fulfilled, (state, action) => {
//         state.loading = false;
//         state.restaurants = state.restaurants.filter(r => r._id !== action.payload);
//         toast.success('Restaurant deleted successfully!');
//       })
//       .addCase(deleteRestaurant.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(action.payload || 'Failed to delete restaurant');
//       })

//       // Update Status
//       .addCase(updateRestaurantStatus.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateRestaurantStatus.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload && action.payload._id) {
//           state.restaurants = state.restaurants.map(r =>
//             r._id === action.payload._id ? action.payload : r
//           );
//         }
//         toast.success('Restaurant status updated successfully!');
//       })
//       .addCase(updateRestaurantStatus.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         toast.error(action.payload || 'Failed to update status');
//       });
//   },
// });

// export const { clearSelectedRestaurant, clearError } = restaurantSlice.actions;
// export default restaurantSlice.reducer;