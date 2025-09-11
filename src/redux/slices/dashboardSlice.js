import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../utils/constants';

// Helper function for consistent headers
const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Helper function for consistent error handling
const handleError = (error, defaultMessage = 'Server Error') => {
  const message = error.response?.data?.message || error.message || defaultMessage;
  return message;
};

// Fetch overall report
export const fetchOverallReport = createAsyncThunk(
  'dashboard/fetchOverallReport',
  async ({ token }, { rejectWithValue }) => {
    try {
      // Fixed: Use BASE_
      const restaurantId = localStorage.getItem("restaurantId");
      const response = await axios.get(
        `${BASE_URL}/overall/${restaurantId}`,
        configureHeaders(token)
      );
      return response.data;
    } catch (error) {
      console.log("The error of over All is --->",)
      const errorMessage = handleError(error, 'Failed to fetch overall report');
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch chart data
export const fetchChartData = createAsyncThunk(
  'dashboard/fetchChartData',
  async ({ year, token }, { rejectWithValue }) => {
    try {
      // ✅ Get restaurantId from localStorage
      const restaurantId = localStorage.getItem("restaurantId");

      if (!restaurantId) {
        throw new Error("Restaurant ID not found in localStorage");
      }

      const response = await axios.get(
        `${BASE_URL}/dashboard/chart-data`,
        {
          params: { year, restaurantId },
          ...(token ? configureHeaders(token) : {}),
        }
      );

      return response.data;
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to fetch chart data');
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch weekly chart data
export const fetchWeeklyChartData = createAsyncThunk(
  'dashboard/fetchWeeklyChartData',
  async ({ year, restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/report/yearly/:customerId`,
        {
          params: { year, restaurantId },
          ...configureHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to fetch weekly chart data');
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch payment type statistics
export const fetchPaymentTypeStats = createAsyncThunk(
  'dashboard/fetchPaymentTypeStats',
  async ({ startDate, endDate, restaurantId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/getReportPaymentType`,
        {
          startDate,
          endDate,
          restaurantId,
        },
        token ? configureHeaders(token) : {}
      );
      return response.data;
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to fetch payment type statistics');
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch dashboard statistics (additional useful endpoint)
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async ({ restaurantId, token, period = 'today' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/stats/${restaurantId}`,
        {
          params: { period },
          ...configureHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to fetch dashboard stats');
      return rejectWithValue(errorMessage);
    }
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    // Data states
    overallReport: null,
    chartData: null,
    weeklyChartData: null,
    paymentTypeStats: null,
    dashboardStats: null,

    // Loading states - separate loading states for better UX
    overallReportLoading: false,
    chartDataLoading: false,
    weeklyChartLoading: false,
    paymentStatsLoading: false,
    dashboardStatsLoading: false,

    // General loading state for backwards compatibility
    loading: false,

    // Error states
    error: null,
    overallReportError: null,
    chartDataError: null,
    weeklyChartError: null,
    paymentStatsError: null,

    // UI states
    lastUpdated: null,
    selectedYear: new Date().getFullYear(),
    selectedWeekYear: new Date().getFullYear(),
  },
  reducers: {
    // Clear all errors
    clearDashboardError: (state) => {
      state.error = null;
      state.overallReportError = null;
      state.chartDataError = null;
      state.weeklyChartError = null;
      state.paymentStatsError = null;
    },

    // Clear specific error
    clearSpecificError: (state, action) => {
      const errorType = action.payload;
      state[`${errorType}Error`] = null;
    },

    // Set selected year
    setSelectedYear: (state, action) => {
      state.selectedYear = action.payload;
    },

    // Set selected week year
    setSelectedWeekYear: (state, action) => {
      state.selectedWeekYear = action.payload;
    },

    // Clear all dashboard data
    clearDashboardData: (state) => {
      state.overallReport = null;
      state.chartData = null;
      state.weeklyChartData = null;
      state.paymentTypeStats = null;
      state.dashboardStats = null;
      state.lastUpdated = null;
    },

    // Reset dashboard state
    resetDashboardState: (state) => {
      return {
        ...state,
        overallReport: null,
        chartData: null,
        weeklyChartData: null,
        paymentTypeStats: null,
        dashboardStats: null,
        overallReportLoading: false,
        chartDataLoading: false,
        weeklyChartLoading: false,
        paymentStatsLoading: false,
        dashboardStatsLoading: false,
        loading: false,
        error: null,
        overallReportError: null,
        chartDataError: null,
        weeklyChartError: null,
        paymentStatsError: null,
        lastUpdated: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle overall report
      .addCase(fetchOverallReport.pending, (state) => {
        state.overallReportLoading = true;
        state.loading = true;
        state.overallReportError = null;
        state.error = null;
      })
      .addCase(fetchOverallReport.fulfilled, (state, action) => {
        state.overallReportLoading = false;
        state.loading = false;
        state.overallReport = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchOverallReport.rejected, (state, action) => {
        state.overallReportLoading = false;
        state.loading = false;
        state.overallReportError = action.payload;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Handle chart data
      .addCase(fetchChartData.pending, (state) => {
        state.chartDataLoading = true;
        state.loading = true;
        state.chartDataError = null;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.chartDataLoading = false;
        state.loading = false;
        state.chartData = action.payload;
      })
      .addCase(fetchChartData.rejected, (state, action) => {
        state.chartDataLoading = false;
        state.loading = false;
        state.chartDataError = action.payload;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Handle weekly chart data
      .addCase(fetchWeeklyChartData.pending, (state) => {
        state.weeklyChartLoading = true;
        state.loading = true;
        state.weeklyChartError = null;
      })
      .addCase(fetchWeeklyChartData.fulfilled, (state, action) => {
        state.weeklyChartLoading = false;
        state.loading = false;
        state.weeklyChartData = action.payload;
      })
      .addCase(fetchWeeklyChartData.rejected, (state, action) => {
        state.weeklyChartLoading = false;
        state.loading = false;
        state.weeklyChartError = action.payload;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Handle payment type statistics
      .addCase(fetchPaymentTypeStats.pending, (state) => {
        state.paymentStatsLoading = true;
        state.loading = true;
        state.paymentStatsError = null;
      })
      .addCase(fetchPaymentTypeStats.fulfilled, (state, action) => {
        state.paymentStatsLoading = false;
        state.loading = false;
        state.paymentTypeStats = action.payload;
      })
      .addCase(fetchPaymentTypeStats.rejected, (state, action) => {
        state.paymentStatsLoading = false;
        state.loading = false;
        state.paymentStatsError = action.payload;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Handle dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardStatsLoading = true;
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStatsLoading = false;
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardStatsLoading = false;
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

// Export actions
export const {
  clearDashboardError,
  clearSpecificError,
  setSelectedYear,
  setSelectedWeekYear,
  clearDashboardData,
  resetDashboardState,
} = dashboardSlice.actions;

// Export selectors for easy component usage
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectOverallReport = (state) => state.dashboard.overallReport;
export const selectChartData = (state) => state.dashboard.chartData;
export const selectWeeklyChartData = (state) => state.dashboard.weeklyChartData;
export const selectPaymentTypeStats = (state) => state.dashboard.paymentTypeStats;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectLastUpdated = (state) => state.dashboard.lastUpdated;

// Export specific loading selectors
export const selectOverallReportLoading = (state) => state.dashboard.overallReportLoading;
export const selectChartDataLoading = (state) => state.dashboard.chartDataLoading;
export const selectWeeklyChartLoading = (state) => state.dashboard.weeklyChartLoading;
export const selectPaymentStatsLoading = (state) => state.dashboard.paymentStatsLoading;

export default dashboardSlice.reducer;


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { BASE_URL } from '../../utils/constants';

// // Fetch overall report
// export const fetchOverallReport = createAsyncThunk(
//   'dashboard/fetchOverallReport',
//   async ({ restaurantId, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `/api/dashboard/overall/${restaurantId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Server Error');
//     }
//   }
// );


// // Fetch chart data
// export const fetchChartData = createAsyncThunk(
//   'dashboard/fetchChartData',
//   async ({ year, restaurantId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${BASE_URL}/dashboard/chart-data?year=${year}&restaurantId=${restaurantId}`
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
//   async ({ year, restaurantId, token }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${BASE_URL}/dashboard/weekly-chart-data?year=${year}&restaurantId=${restaurantId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
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
