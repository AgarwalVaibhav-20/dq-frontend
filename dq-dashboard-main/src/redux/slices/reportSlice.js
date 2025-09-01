// Import necessary modules
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

const configureHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
// Fetch all days' reports
export const fetchAllDaysReports = createAsyncThunk(
  'reports/fetchAllDaysReports',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/reports/${restaurantId}/all-days`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

// Fetch report by type (daily or payment report)
export const fetchReportByType = createAsyncThunk(
  'reports/fetchReportByType',
  async ({ restaurantId, reportType }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/getReportByType/${restaurantId}`, {
        params: { type: reportType },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)
// Fetch Customer Report
export const fetchCustomerReport = createAsyncThunk(
  'reports/fetchCustomerReport',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/customer-report/${restaurantId}`, {})
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)
export const fetchTableReport = createAsyncThunk(
  'reports/fetchTableReport',
  async ({ restaurantId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/report-by-table`, {
        params: {
          restaurantId,
          startDate,
          endDate,
        },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)
export const fetchTransactionCountByDate = createAsyncThunk(
  'reports/fetchTransactionCountByDate',
  async ({ startDate, endDate, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/transactionCountByDate`, {
        params: {
          startDate,
          endDate,
        },
        ...configureHeaders(token), // ⬅️ Spread the headers outside `params`
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)
export const fetchTaxCollectedByDate = createAsyncThunk(
  'reports/fetchTaxCollectedByDate',
  async ({ startDate, endDate, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/taxCollectedByDate`, {
        params: {
          startDate,
          endDate,
        },
        ...configureHeaders(token), // ⬅️ Spread the headers outside `params`
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const fetchTableUsageByDate = createAsyncThunk(
  'reports/fetchTableUsageByDate',
  async ({ startDate, endDate, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/tableUsageByDate`, {
        params: {
          startDate,
          endDate,
        },
        ...configureHeaders(token),
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

export const fetchPaymentTypeReport = createAsyncThunk(
  'reports/fetchPaymentTypeReport',
  async ({ restaurantId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${BASE_URL}/getReportPaymentType`, {
        restaurantId,
        startDate,
        endDate,
      })
      return data?.data
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
)

// Fetch DashboardStatistics  Report
export const fetchDashboardStatisticsReport = createAsyncThunk(
  'reports/fetchDashboardStatisticsReport',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/reports/${restaurantId}`, {})
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)
export const fetchDiscountUsageByDate = createAsyncThunk(
  'reports/fetchDiscountUsageByDate',
  async ({ startDate, endDate, token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/discountUsageByDate`, {
        params: {
          startDate,
          endDate,
        },
        ...configureHeaders(token),
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  },
)

/* NEW THUNK: fetchAverageOrderValueByDate --------------------- */
export const fetchAverageOrderValueByDate = createAsyncThunk(
  'reports/fetchAverageOrderValueByDate',
  async ({ token, startDate, endDate }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/averageOrderValueByDate`, {
        params: {
          startDate,
          endDate,
        },
        ...configureHeaders(token),
      })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch average order value.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

// Thunk to fetch transactions by payment type grouped by date
export const fetchTransactionsByPaymentType = createAsyncThunk(
  'reports/fetchTransactionsByPaymentType',
  async ({ token, startDate, endDate }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/transactionsByPaymentType`, {
        params: { startDate, endDate },
        ...configureHeaders(token),
      })
      return res.data // array of { date, paymentTypes: [ { paymentType, transactionCount, transactions: [] } ] }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch transaction report.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

//  total revenue
export const fetchTotalRevenueByDate = createAsyncThunk(
  'reports/fetchTotalRevenueByDate',
  async ({ token, startDate, endDate }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/totalRevenueByDate`, {
        params: { startDate, endDate },
        ...configureHeaders(token),
      })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch total-revenue report'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

export const fetchMostOrderedDishes = createAsyncThunk(
  'reports/fetchMostOrderedDishes',
  async ({ token, startDate, endDate }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/mostOrderDishes`, {
        params: { startDate, endDate },
        ...configureHeaders(token),
      })
      console.log(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch most ordered dishes'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

//  yerly chart report
export const fetchDashboardChartData = createAsyncThunk(
  'report/fetchDashboardChartData',
  async ({ year, restaurantId }, { rejectWithValue }) => {
    try {

      const res = await axios.get(
        `https://rest.dicui.org/api/dashboard/chart-data?year=${year}&restaurantId=${restaurantId}`,
      )

      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: 'Failed' })
    }
  },
)

export const fetchWeeklyChartData = createAsyncThunk(
  'report/fetchWeeklyChartData',
  async ({ year, restaurantId }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/dashboard/weekly-chart-data`,
        {
          params: { year, restaurantId },
          ...configureHeaders(token),
        },
      );
      return data;             
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || 'Unable to fetch weekly data';
      return rejectWithValue(message);
    }
  },
);


// Report slice
const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    allDaysReports: [],
    reportByType: [],
    customerReport: [],
    tableReport: [],
    paymentTypeReport: [],
    dashboardStats: [],
    transactionCountByDate: [],
    taxCollectedByDate: [],
    tableUsageByDate: [],
    discountUsageByDate: [],
    averageOrderValueByDate: [],
    transactionsByPaymentType: [],
    totalRevenueByDate: [],
    mostOrderedDishes: [],
    yearlyChartData : [],
    weeklyChartData: null,
    avgOrderValueLoading: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all days' reports
      .addCase(fetchAllDaysReports.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllDaysReports.fulfilled, (state, action) => {
        state.loading = false
        state.allDaysReports = action.payload
      })
      .addCase(fetchAllDaysReports.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch all days reports.')
      })
      // Fetch report by type
      .addCase(fetchReportByType.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReportByType.fulfilled, (state, action) => {
        state.loading = false
        state.reportByType = action.payload
      })
      .addCase(fetchReportByType.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch report by type.')
      })
      // Fetch Customer Report
      .addCase(fetchCustomerReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomerReport.fulfilled, (state, action) => {
        state.loading = false
        state.customerReport = action.payload
      })
      .addCase(fetchCustomerReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch customer Report.')
      })
      // Fetch Table Report
      .addCase(fetchTableReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTableReport.fulfilled, (state, action) => {
        state.loading = false
        state.tableReport = action.payload
      })
      .addCase(fetchTableReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch customer Report.')
      })
      // Fetch Transaction Count By Date
      .addCase(fetchTransactionCountByDate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionCountByDate.fulfilled, (state, action) => {
        state.loading = false
        state.transactionCountByDate = action.payload
      })
      .addCase(fetchTransactionCountByDate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch Transaction Report.')
      })
      // Fetch Tax Collection By Date
      .addCase(fetchTaxCollectedByDate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTaxCollectedByDate.fulfilled, (state, action) => {
        state.loading = false
        state.taxCollectedByDate = action.payload
      })
      .addCase(fetchTaxCollectedByDate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch Tax Report.')
      })

      // Fetch Table Usage By Date
      .addCase(fetchTableUsageByDate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTableUsageByDate.fulfilled, (state, action) => {
        state.loading = false
        state.tableUsageByDate = action.payload
      })
      .addCase(fetchTableUsageByDate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch Table Usage Report.')
      })

      /* ----------------------- Payment-type report ------------------------ */
      .addCase(fetchPaymentTypeReport.pending, (s) => {
        s.loading = true
        s.error = null
      })
      .addCase(fetchPaymentTypeReport.fulfilled, (s, a) => {
        s.loading = false
        s.paymentTypeReport = a.payload
      })
      .addCase(fetchPaymentTypeReport.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
        toast.error('Failed to fetch payment-type report.')
      })

      // fetchDashboardStatisticsReport
      .addCase(fetchDashboardStatisticsReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardStatisticsReport.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardStats = action.payload
      })
      .addCase(fetchDashboardStatisticsReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch Dashboard Statistics Report.')
      })

      // Discount Usage Report
      .addCase(fetchDiscountUsageByDate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDiscountUsageByDate.fulfilled, (state, action) => {
        state.loading = false
        state.discountUsageByDate = action.payload
      })
      .addCase(fetchDiscountUsageByDate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      /* ----- averageOrderValueByDate handlers ------------------ */

      .addCase(fetchAverageOrderValueByDate.pending, (state) => {
        state.avgOrderValueLoading = true
      })
      .addCase(fetchAverageOrderValueByDate.fulfilled, (state, { payload }) => {
        state.avgOrderValueLoading = false
        state.averageOrderValueByDate = payload
      })
      .addCase(fetchAverageOrderValueByDate.rejected, (state) => {
        state.avgOrderValueLoading = false
        state.averageOrderValueByDate = []
      })

      .addCase(fetchTransactionsByPaymentType.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTransactionsByPaymentType.fulfilled, (state, { payload }) => {
        state.loading = false
        state.transactionsByPaymentType = payload
      })
      .addCase(fetchTransactionsByPaymentType.rejected, (state) => {
        state.loading = false
        state.transactionsByPaymentType = []
      })

      /* totalRevenueByDate */
      .addCase(fetchTotalRevenueByDate.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTotalRevenueByDate.fulfilled, (state, { payload }) => {
        state.loading = false
        state.totalRevenueByDate = payload
      })
      .addCase(fetchTotalRevenueByDate.rejected, (state) => {
        state.loading = false
        state.totalRevenueByDate = []
      })

      // most rdered dishes
      .addCase(fetchMostOrderedDishes.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMostOrderedDishes.fulfilled, (state, { payload }) => {
        state.loading = false
        state.mostOrderedDishes = payload
      })
      .addCase(fetchMostOrderedDishes.rejected, (state) => {
        state.loading = false
        state.mostOrderedDishes = []
      })


       .addCase(fetchDashboardChartData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardChartData.fulfilled, (state, action) => {
        state.loading = false;
        state.yearlyChartData= action.payload;
      })
      .addCase(fetchDashboardChartData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error fetching chart data';
      })



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
        toast.error(action.payload);     // same UX pattern as your other slices
      });
  },
})

export default reportSlice.reducer
