import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from '../../utils/constants';
export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (couponData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${BASE_URL}/api/coupon/create/coupen`, couponData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.coupon;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get all coupons
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${BASE_URL}/api/coupon/all/coupons`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get single coupon
export const fetchCouponById = createAsyncThunk(
  "coupons/fetchCouponById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${BASE_URL}/api/coupon/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.coupon;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Apply coupon
export const applyCoupon = createAsyncThunk(
  "coupons/applyCoupon",
  async ({ couponId, orderTotal }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${BASE_URL}/api/coupon/apply`,
        { couponId, orderTotal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update coupon
export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(`${BASE_URL}/api/coupon/coupon/update/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.coupon;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete coupon
export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${BASE_URL}/api/coupon/coupon/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      console.log(err, "error"); // Fix applied
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// ----------------- SLICE -----------------

const couponSlice = createSlice({
  name: "coupons",
  initialState: {
    coupons: [],
    coupon: null,
    discount: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCouponState: (state) => {
      state.error = null;
      state.successMessage = null;
      state.discount = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create coupon
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Coupon created successfully!";
        state.coupons = state.coupons || []; // ensure it's an array
        state.coupons.unshift(action.payload); // now safe
      })

      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch coupon by id
      .addCase(fetchCouponById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.coupon = action.payload;
      })
      .addCase(fetchCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.discount = action.payload.discount;
        state.successMessage = action.payload.message;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update coupon
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Coupon updated successfully!";
        state.coupons = state.coupons.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete coupon
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Coupon deleted successfully!";
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponState } = couponSlice.actions;
export default couponSlice.reducer;
