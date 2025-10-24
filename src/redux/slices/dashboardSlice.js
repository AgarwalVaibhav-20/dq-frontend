import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';

export const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Fetch overall report
export const fetchOverallReport = createAsyncThunk(
  'dashboard/fetchOverallReport',
  async ({ restaurantId, token }, { rejectWithValue }) => {
    try {
      const currentToken = token || localStorage.getItem('authToken');
      const response = await axios.get(
        `${BASE_URL}/reports/${restaurantId}`, 
        configureHeaders(currentToken)
      );
      return response.data.data; // Extract the data property
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch chart data
export const fetchChartData = createAsyncThunk(
  'dashboard/fetchChartData',
  async ({ year, restaurantId, token }, { rejectWithValue }) => {
    try {
      const currentToken = token || localStorage.getItem('authToken');
      const response = await axios.get(
        `${BASE_URL}/dashboard/chart-data?year=${year}&restaurantId=${restaurantId}`, 
        configureHeaders(currentToken)
      );
      return response.data; // This should contain labels and datasets directly
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch weekly chart data
export const fetchWeeklyChartData = createAsyncThunk(
  'dashboard/fetchWeeklyChartData',
  async ({ year, restaurantId, token }, { rejectWithValue }) => {
    try {
      const currentToken = token || localStorage.getItem('authToken');
      const response = await axios.get(
        `${BASE_URL}/dashboard/weekly-chart-data?year=${year}&restaurantId=${restaurantId}`, 
        configureHeaders(currentToken)
      );
      return response.data; // This should contain datasets directly
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch payment type statistics - NOW WITH AUTHENTICATION
export const fetchPaymentTypeStats = createAsyncThunk(
  'dashboard/fetchPaymentTypeStats',
  async ({ startDate, endDate, restaurantId, token }, { rejectWithValue }) => {
    try {
      const currentToken = token || localStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL}/getReportPaymentType`, 
        {
          startDate,
          endDate,
          restaurantId,
        },
        configureHeaders(currentToken) // Added authentication
      );
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
  reducers: {
    // Add a reset action to clear errors
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.overallReport = null;
      state.chartData = null;
      state.weeklyChartData = null;
      state.paymentTypeStats = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle overall report
      .addCase(fetchOverallReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverallReport.fulfilled, (state, action) => {
        state.loading = false;
        console.log('fetchOverallReport.fulfilled - payload:', action.payload);
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

export const { clearError, clearData } = dashboardSlice.actions;
export default dashboardSlice.reducer;


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { BASE_URL } from '../../utils/constants';
// export const configureHeaders = (token) => ({
//   headers: {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   },
// })
// // Fetch overall report
// export const fetchOverallReport = createAsyncThunk(
//   'dashboard/fetchOverallReport',
//   async ({ restaurantId }, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken')
//       const response = await axios.get(`${BASE_URL}/reports/${restaurantId}`, configureHeaders(token));
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Fetch chart data
// export const fetchChartData = createAsyncThunk(
//   'dashboard/fetchChartData',
//   async ({ year, restaurantId }, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken')
//       const response = await axios.get(
//         `${BASE_URL}/dashboard/chart-data?year=${year}&restaurantId=${restaurantId}`, configureHeaders(token)
//       );
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Fetch weekly chart data
// export const fetchWeeklyChartData = createAsyncThunk(
//   'dashboard/fetchWeeklyChartData',
//   async ({ year, restaurantId }, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken')
//       const response = await axios.get(
//         `${BASE_URL}/dashboard/weekly-chart-data?year=${year}&restaurantId=${restaurantId}`, configureHeaders(token)
//       );
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// export const fetchPaymentTypeStats = createAsyncThunk(
//   'dashboard/fetchPaymentTypeStats',
//   async ({ startDate, endDate, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post(`${BASE_URL}/getReportPaymentType`, {
//         startDate,
//         endDate,
//         restaurantId,
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Dashboard slice
// const dashboardSlice = createSlice({
//   name: 'dashboard',
//   initialState: {
//     overallReport: null,
//     chartData: null,
//     weeklyChartData: null,
//     paymentTypeStats: null,
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // Handle overall report
//       .addCase(fetchOverallReport.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchOverallReport.fulfilled, (state, action) => {
//         state.loading = false;
//         state.overallReport = action.payload;
//       })
//       .addCase(fetchOverallReport.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Handle chart data
//       .addCase(fetchChartData.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchChartData.fulfilled, (state, action) => {
//         state.loading = false;
//         state.chartData = action.payload;
//       })
//       .addCase(fetchChartData.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Handle weekly chart data
//       .addCase(fetchWeeklyChartData.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchWeeklyChartData.fulfilled, (state, action) => {
//         state.loading = false;
//         state.weeklyChartData = action.payload;
//       })
//       .addCase(fetchWeeklyChartData.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Handle payment type statistics
//       .addCase(fetchPaymentTypeStats.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchPaymentTypeStats.fulfilled, (state, action) => {
//         state.loading = false;
//         state.paymentTypeStats = action.payload;
//       })
//       .addCase(fetchPaymentTypeStats.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default dashboardSlice.reducer;