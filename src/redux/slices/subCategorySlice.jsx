// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { BASE_URL } from '../../utils/constants'
// import { toast } from 'react-toastify'

// const configureHeaders = (token) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//   },
// })

// // Create subcategory
// export const createSubCategory = createAsyncThunk(
//   'subCategory/create',
//   async ({ sub_category_name, category_id, token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post(
//         `${BASE_URL}/admin/subcategories`,
//         { sub_category_name, category_id, restaurantId },
//         configureHeaders(token),
//       )
//       return response.data
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to create subcategory')
//     }
//   },
// )

// // Fetch all subcategories
// export const fetchSubCategories = createAsyncThunk(
//   'subCategory/fetchAll',
//   async ({ token, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${BASE_URL}/admin/subcategories?restaurantId=${restaurantId}`,
//         configureHeaders(token),
//       )
//       return response.data
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch subcategories')
//     }
//   },
// )

// // Update subcategory
// export const updateSubCategory = createAsyncThunk(
//   'subCategory/update',
//   async ({ id, sub_category_name, category_id, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.put(
//         `${BASE_URL}/admin/subcategories/${id}`,
//         { sub_category_name, category_id },
//         configureHeaders(token),
//       )
//       return response.data
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to update subcategory')
//     }
//   },
// )

// // Delete subcategory
// export const deleteSubCategory = createAsyncThunk(
//   'subCategory/delete',
//   async ({ id, token }, { rejectWithValue }) => {
//     try {
//       await axios.delete(`${BASE_URL}/admin/subcategories/${id}`, configureHeaders(token))
//       return { id }
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to delete subcategory')
//     }
//   },
// )

// const subCategorySlice = createSlice({
//   name: 'subCategory',
//   initialState: {
//     subCategories: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(createSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(createSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories.push(action.payload)
//         toast.success('Subcategory created successfully')
//       })
//       .addCase(createSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       .addCase(fetchSubCategories.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(fetchSubCategories.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories = action.payload
//       })
//       .addCase(fetchSubCategories.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       .addCase(updateSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(updateSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         const index = state.subCategories.findIndex((s) => s.id === action.payload.id)
//         if (index !== -1) {
//           state.subCategories[index] = action.payload
//         }
//         toast.success('Subcategory updated successfully')
//       })
//       .addCase(updateSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })

//       .addCase(deleteSubCategory.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(deleteSubCategory.fulfilled, (state, action) => {
//         state.loading = false
//         state.subCategories = state.subCategories.filter(
//           (sub) => sub.id !== action.payload.id,
//         )
//         toast.success('Subcategory deleted successfully')
//       })
//       .addCase(deleteSubCategory.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload
//         toast.error(action.payload)
//       })
//   },
// })

// export default subCategorySlice.reducer