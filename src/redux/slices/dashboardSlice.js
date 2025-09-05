import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';

// Fetch overall report
export const fetchOverallReport = createAsyncThunk(
  'dashboard/fetchOverallReport',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/reports/${restaurantId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch chart data
export const fetchChartData = createAsyncThunk(
  'dashboard/fetchChartData',
  async ({ year, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/chart-data?year=${year}&restaurantId=${restaurantId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch weekly chart data
export const fetchWeeklyChartData = createAsyncThunk(
  'dashboard/fetchWeeklyChartData',
  async ({ year, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/weekly-chart-data?year=${year}&restaurantId=${restaurantId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPaymentTypeStats = createAsyncThunk(
  'dashboard/fetchPaymentTypeStats',
  async ({ startDate, endDate, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/getReportPaymentType`, {
        startDate,
        endDate,
        restaurantId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    overallReport: null,
    chartData: null,
    weeklyChartData: null,
    paymentTypeStats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle overall report
      .addCase(fetchOverallReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverallReport.fulfilled, (state, action) => {
        state.loading = false;
        state.overallReport = action.payload;
      })
      .addCase(fetchOverallReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle chart data
      .addCase(fetchChartData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.loading = false;
        state.chartData = action.payload;
      })
      .addCase(fetchChartData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle weekly chart data
      .addCase(fetchWeeklyChartData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyChartData.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklyChartData = action.payload;
      })
      .addCase(fetchWeeklyChartData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       // Handle payment type statistics
       .addCase(fetchPaymentTypeStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentTypeStats.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentTypeStats = action.payload;
      })
      .addCase(fetchPaymentTypeStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
