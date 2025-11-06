import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CChartLine, CChartPie, CChartBar } from '@coreui/react-chartjs';
import { updateRestaurantId } from '../../redux/slices/authSlice';
import {
  CFormSelect,
  CSpinner,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CButton,
  CAlert,
} from '@coreui/react';
import {
  fetchChartData,
  fetchWeeklyChartData,
  fetchOverallReport,
  fetchPaymentTypeStats,
  fetchMonthlyChartData,
} from '../../redux/slices/dashboardSlice';
import { fetchOrderStatistics, fetchRejectedOrderStatistics } from '../../redux/slices/orderSlice';
import { fetchTransactionDetails, getDailyCashBalance } from '../../redux/slices/transactionSlice'
import axios from 'axios'
import { BASE_URL } from '../../utils/constants'
const Dashboard = () => {
  const dispatch = useDispatch();

  const {
    chartData,
    weeklyChartData,
    monthlyChartData,
    overallReport,
    paymentTypeStats,
    loading,
    error,
  } = useSelector((state) => state.dashboard);
  const {
    statistics, // { daily, weekly, monthly }
    statsLoading, // Loading state for statistics
  } = useSelector((state) => state.orders);
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const isSuperAdmin = userRole === 'superadmin';
  const { dailyCashBalance, dailyTransactionCount, cashLoading } = useSelector((state) => state.transactions);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());
  const [selectedWeekYear, setSelectedWeekYear] = useState(new Date().getFullYear());
  const [completedStatsDropdown, setCompletedStatsDropdown] = useState('daily');
  const [rejectedStatsDropdown, setRejectedStatsDropdown] = useState('daily');
  const [dropdownStates, setDropdownStates] = useState({
    collection: 'today',
    invoices: 'today',
    completedOrders: 'today',
    rejectedOrders: 'today',
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatsLoading, setPaymentStatsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);


  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  // Restaurant click handler function - Switch user's restaurant
  const handleRestaurantClick = async (restaurantId, restaurantName) => {
    try {
      console.log('Switching to restaurant:', { restaurantId, restaurantName });

      // Call switch restaurant API
      const response = await axios.post(`${BASE_URL}/api/restaurant/switch-restaurant`, {
        restaurantId: restaurantId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Switch restaurant API response:', response.data);

      if (response.data.success) {
        // Remove old token from localStorage
        localStorage.removeItem('authToken');

        // Update localStorage with new restaurant info and token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('selectedRestaurantId', restaurantId);
        localStorage.setItem('selectedRestaurantName', restaurantName);
        localStorage.setItem('restaurantId', restaurantId);

        // Update Redux store with new restaurant ID and token
        dispatch(updateRestaurantId({
          restaurantId,
          restaurantName,
          token: response.data.token
        }));

        // Reload the page to refresh all data with new restaurant
        window.location.reload();

        console.log('Restaurant switched successfully with new token!');
      } else {
        console.error('Failed to switch restaurant:', response.data.message);
        alert('Failed to switch restaurant: ' + response.data.message);
      }

    } catch (error) {
      console.error('Error switching restaurant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to switch restaurant';
      alert('Error: ' + errorMessage);
    }
  };

  // Clear selected restaurant function (optional - for debugging)
  const clearSelectedRestaurant = () => {
    localStorage.removeItem('selectedRestaurantId');
    localStorage.removeItem('selectedRestaurantName');
    setSelectedRestaurant('');
    console.log('Selected restaurant cleared from localStorage');
  };

  // Fetch restaurants from UserProfile collection
  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/all/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Restaurants API Response:', response.data);

      // Handle different response structures
      let restaurantsData = [];
      if (response.data.success && response.data.data) {
        restaurantsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        restaurantsData = response.data;
      } else if (response.data.users) {
        restaurantsData = response.data.users;
      }

      console.log('Raw restaurants data:', restaurantsData);
      console.log('First few restaurants:', restaurantsData.slice(0, 3));

      // Show only users with restaurantName field (excluding "Not provided" or empty)
      const allRestaurants = restaurantsData.filter(restaurant =>
        restaurant.restaurantName &&
        restaurant.restaurantName !== undefined &&
        restaurant.restaurantName !== null &&
        restaurant.restaurantName !== 'Not provided' &&
        restaurant.restaurantName.trim() !== ''
      );

      console.log('Filtered restaurants:', allRestaurants);
      console.log('Restaurant names:', allRestaurants.map(r => ({ id: r._id, restaurantName: r.restaurantName })));

      setRestaurants(allRestaurants);
      setFilteredRestaurants(allRestaurants);

      // Check if there's a saved restaurant in localStorage
      const savedRestaurantId = localStorage.getItem('selectedRestaurantId');
      const savedRestaurant = allRestaurants.find(r => r._id === savedRestaurantId);

      if (savedRestaurant) {
        // Restore saved restaurant
        console.log('Restoring saved restaurant:', savedRestaurant.restaurantName);
        setSelectedRestaurant(savedRestaurantId);
      } else if (allRestaurants.length > 0 && !selectedRestaurant) {
        // Set first restaurant as default if no saved restaurant
        setSelectedRestaurant(allRestaurants[0]._id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Debug logs - Remove in production
  useEffect(() => {
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Chart Data:', chartData);
    console.log('Weekly Chart Data:', weeklyChartData);
    console.log('Overall Report:', overallReport);
    console.log('Payment Type Stats:', paymentTypeStats);
    console.log('Restaurant ID:', restaurantId);
    console.log('Token exists:', !!token);
    console.log('Loading:', loading);
    console.log('Error:', error);
  }, [chartData, weeklyChartData, fetchMonthlyChartData, overallReport, paymentTypeStats, restaurantId, token, loading, error]);
  useEffect(() => {
    if (restaurantId && token) {
      // Initial load of daily cash balance
      dispatch(fetchOrderStatistics({ token, restaurantId: String(restaurantId) }));
      dispatch(fetchRejectedOrderStatistics({ token, restaurantId: String(restaurantId) }));
      dispatch(getDailyCashBalance({
        token,
        restaurantId: String(restaurantId)
      }))
    }
  }, [dispatch, restaurantId, token])

  // Fetch restaurants on component mount (only for superadmin)
  useEffect(() => {
    if (token && isSuperAdmin) {
      fetchRestaurants();
    }
  }, [token, isSuperAdmin]);

  // Restore selected restaurant from localStorage on component mount
  useEffect(() => {
    const savedRestaurantId = localStorage.getItem('selectedRestaurantId');
    const savedRestaurantName = localStorage.getItem('selectedRestaurantName');

    if (savedRestaurantId && savedRestaurantName) {
      console.log('Restoring selected restaurant from localStorage:', {
        id: savedRestaurantId,
        name: savedRestaurantName
      });
      setSelectedRestaurant(savedRestaurantId);
    }
  }, []);

  // Debug current user's restaurant name
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const currentRestaurantId = localStorage.getItem('restaurantId');
    console.log('Current User ID:', currentUserId);
    console.log('Current Restaurant ID:', currentRestaurantId);

    // Check if current user's restaurant is in the list
    if (restaurants.length > 0) {
      const currentUserRestaurant = restaurants.find(r => r._id === currentRestaurantId);
      console.log('Current user restaurant in list:', currentUserRestaurant);
      if (currentUserRestaurant) {
        console.log('Current user restaurant name:', currentUserRestaurant.restaurantName);
      }
    }
  }, [restaurants]);

  // Filter restaurants based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter((restaurant) => {
        const search = searchTerm.toLowerCase();
        const restaurantName = restaurant.restaurantName || 'No Restaurant Name';
        return restaurantName.toLowerCase().includes(search);
      });
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  useEffect(() => {
    if (restaurantId && token) {
      console.log('Fetching initial data...');
      dispatch(fetchOverallReport({ restaurantId: String(restaurantId), token }));
      dispatch(fetchMonthlyChartData({
        year: selectedMonthYear,
        month: selectedMonth,
        restaurantId: String(restaurantId),
        token
      }));
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId: String(restaurantId), token }));
      dispatch(fetchOrderStatistics({ token, restaurantId: String(restaurantId) }));
      dispatch(fetchRejectedOrderStatistics({ token, restaurantId: String(restaurantId) }));
    }
  }, [dispatch, selectedMonth, selectedMonthYear, selectedWeekYear, restaurantId, token]);


  const handleFetchReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (!restaurantId || !token) {
      alert('Missing restaurant ID or authentication token');
      return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('Start date cannot be after end date');
      return;
    }

    console.log('Fetching payment report with:', {
      startDate,
      endDate,
      restaurantId,
      token: !!token
    });

    setPaymentStatsLoading(true);

    try {
      const result = await dispatch(fetchPaymentTypeStats({
        startDate,
        endDate,
        restaurantId: String(restaurantId),
        token
      })).unwrap();

      console.log('Payment stats fetched successfully:', result);

      if (!result?.data || result.data.length === 0) {
        alert('No payment data found for the selected date range');
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      alert('Failed to fetch payment report: ' + (error.message || 'Unknown error'));
    } finally {
      setPaymentStatsLoading(false);
    }
  };
  // Mock data for payment type report (for testing purposes)
  // const mockPaymentTypeData = {
  //   data: [
  //     {
  //       payment_type: 'Cash',
  //       total_count: 125,
  //       total_amount: '15750.50'
  //     },
  //     {
  //       payment_type: 'Credit Card',
  //       total_count: 89,
  //       total_amount: '22340.75'
  //     },
  //     {
  //       payment_type: 'Debit Card',
  //       total_count: 67,
  //       total_amount: '8920.25'
  //     },
  //     {
  //       payment_type: 'UPI',
  //       total_count: 156,
  //       total_amount: '18650.00'
  //     },
  //     {
  //       payment_type: 'Net Banking',
  //       total_count: 34,
  //       total_amount: '12890.80'
  //     },
  //     {
  //       payment_type: 'Wallet',
  //       total_count: 43,
  //       total_amount: '5670.45'
  //     }
  //   ]
  // };

  // Safe data transformation for payment report
  const getPaymentReportData = () => {
    console.log('Payment Type Stats:', paymentTypeStats);

    if (!paymentTypeStats?.data || !Array.isArray(paymentTypeStats.data)) {
      console.log('No payment stats data available');
      return [];
    }

    if (paymentTypeStats.data.length === 0) {
      console.log('Payment stats data is empty array');
      return [];
    }

    const result = paymentTypeStats.data.map((item) => ({
      label: item.payment_type || 'Unknown',
      count: parseInt(item.total_count) || 0,
      amount: parseFloat(item.total_amount) || 0,
    }));

    console.log('Processed payment report data:', result);
    return result;
  };

  const paymentReportData = getPaymentReportData();

  const handleDropdownChange = (key, value) => {
    console.log('Dropdown changed:', key, value);
    setDropdownStates((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });

  const formatBalance = (balance) => {
    if (balance === null || balance === undefined || isNaN(balance)) {
      return '0.00';
    }
    return (Math.round(parseFloat(balance) * 100) / 100).toFixed(2);
  };
  const getReportData = (key) => {
    const state = dropdownStates[key];

    if (!overallReport) {
      return 0;
    }

    let data = 0;

    if (key === 'collection') {
      // If "today" is selected, use dailyCashBalance
      if (state === 'today' && dailyCashBalance !== undefined && dailyCashBalance !== null) {
        data = formatBalance(dailyCashBalance);
      } else {
        data = overallReport[`${state}Collection`];
      }
    } else if (key === 'invoices') {
      data = overallReport[`totalInvoice${state.charAt(0).toUpperCase() + state.slice(1)}`];
    } else if (key === 'completedOrders') {
      data = overallReport[`totalCompleteOrder${state.charAt(0).toUpperCase() + state.slice(1)}`];
    } else if (key === 'rejectedOrders') {
      data = overallReport[`totalRejectOrder${state.charAt(0).toUpperCase() + state.slice(1)}`];
    }

    return data || 0;
  };


  // const getReportData = (key) => {
  //   const state = dropdownStates[key];
  //   console.log('getReportData - key:', key, 'state:', state, 'overallReport:', overallReport);

  //   if (!overallReport) {
  //     console.log('No overall report data');
  //     return 0;
  //   }

  //   const data = {
  //     collection: overallReport[`${state}Collection`],
  //     invoices: overallReport[`totalInvoice${state.charAt(0).toUpperCase() + state.slice(1)}`],
  //     completedOrders: overallReport[`totalCompleteOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
  //     rejectedOrders: overallReport[`totalRejectOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
  //   }[key];

  //   console.log('getReportData - result:', data);
  //   return data || 0;
  // };
  console.log(dailyCashBalance, "dailyCashBalance")
  // Mock data for yearly chart (for testing purposes)
  // const mockYearlyData = {
  //   labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  //   datasets: [
  //     {
  //       label: 'Revenue (₹)',
  //       data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
  //       borderColor: 'rgb(75, 192, 192)',
  //       backgroundColor: 'rgba(75, 192, 192, 0.2)',
  //       tension: 0.1,
  //     },
  //     {
  //       label: 'Orders',
  //       data: [6005, 8005, 7000, 9005, 8008, 7000, 10005, 12005, 40015, 14000, 90035, 8055],
  //       borderColor: 'rgb(255, 99, 132)',
  //       backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //       tension: 0.1,
  //     },
  //     {
  //       label: 'Customers',
  //       data: [4500, 6200, 5800, 7002, 6900, 8500, 8200, 9005, 9001, 10800, 7030, 9720],
  //       borderColor: 'rgb(54, 162, 235)',
  //       backgroundColor: 'rgba(54, 162, 235, 0.2)',
  //       tension: 0.1,
  //     }
  //   ],
  // };

  // Mock data for weekly chart (for testing purposes)
  // const mockWeeklyData = {
  //   datasets: [
  //     {
  //       label: 'Monday',
  //       data: [2500, 1800, 3200, 2100], // Sample weekly data for different weeks
  //       backgroundColor: '#FF6384',
  //       borderColor: '#FF6384',
  //     },
  //     {
  //       label: 'Tuesday',
  //       data: [2800, 2200, 3500, 2400],
  //       backgroundColor: '#36A2EB',
  //       borderColor: '#36A2EB',
  //     },
  //     {
  //       label: 'Wednesday',
  //       data: [3200, 2600, 3800, 2900],
  //       backgroundColor: '#FFCE56',
  //       borderColor: '#FFCE56',
  //     },
  //     {
  //       label: 'Thursday',
  //       data: [3500, 2900, 4100, 3200],
  //       backgroundColor: '#4BC0C0',
  //       borderColor: '#4BC0C0',
  //     },
  //     {
  //       label: 'Friday',
  //       data: [4200, 3800, 4800, 4100],
  //       backgroundColor: '#9966FF',
  //       borderColor: '#9966FF',
  //     },
  //     {
  //       label: 'Saturday',
  //       data: [5200, 4900, 5800, 5100],
  //       backgroundColor: '#FF9F40',
  //       borderColor: '#FF9F40',
  //     },
  //     {
  //       label: 'Sunday',
  //       data: [4800, 4200, 5200, 4600],
  //       backgroundColor: '#FF6B6B',
  //       borderColor: '#FF6B6B',
  //     }
  //   ],
  // };

  // Safe chart data preparation
  const getLineChartData = () => {
    if (!monthlyChartData || !monthlyChartData.labels || !monthlyChartData.datasets) {
      console.log('No monthly chart data available');
      return { labels: [], datasets: [] };
    }
    return monthlyChartData;
  };

  const getPieChartData = () => {

    if (!weeklyChartData?.datasets || !Array.isArray(weeklyChartData.datasets)) {
      console.log('No weekly chart data available from API.');
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: []
        }]
      };
    }

    try {

      const labels = weeklyChartData.datasets.map((ds) => ds.label || 'Unknown');
      const data = weeklyChartData.datasets.map((ds) => {
        if (!Array.isArray(ds.data)) return 0;

        return ds.data.reduce((acc, val) => acc + parseFloat(val || 0), 0);
      });
      const backgroundColor = weeklyChartData.datasets.map((ds) => ds.backgroundColor || '#ccc');
      const borderColor = weeklyChartData.datasets.map((ds) => ds.borderColor || '#999');

      return {
        labels,
        datasets: [{
          data,
          backgroundColor,
          borderColor,
        }],
      };
    } catch (error) {
      console.error('Error processing pie chart data:', error);

      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }],
      };
    }
  };

  const renderReportCard = (title, key) => (
    <CCol md={3} key={key}>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          {title}
          <CFormSelect
            value={dropdownStates[key]}
            onChange={(e) => handleDropdownChange(key, e.target.value)}
            style={{ width: '120px' }}
          >
            {key === 'collection' ? (
              <option value="today">Today</option>
            ) : (
              <option value="daily">Daily</option>
            )}
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </CFormSelect>
        </CCardHeader>
        <CCardBody>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '20px 0',
            }}
          >
            {loading ? (
              <CSpinner size="sm" />
            ) : (
              getReportData(key)
            )}
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  );

  // Show error message if critical data is missing
  if (!restaurantId || !token) {
    return (
      <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        <CAlert color="danger">
          Missing required data: {!restaurantId ? 'Restaurant ID' : ''} {!token ? 'Authentication Token' : ''}
        </CAlert>
      </div>
    );
  }
  const renderRejectedStatisticsCard = () => {
    const titles = {
      daily: 'Rejected Orders',
      weekly: 'Rejected This Week',
      monthly: 'Rejected This Month'
    };

    return (
      <CCol md={3}>
        <CCard className="text-white bg-danger">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            {titles[rejectedStatsDropdown]}
            <CFormSelect
              value={rejectedStatsDropdown}
              onChange={(e) => setRejectedStatsDropdown(e.target.value)}
              style={{ width: '120px' }}
            > {/* <-- THIS ">" WAS LIKELY MISSING HERE TOO */}
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </CFormSelect>
          </CCardHeader>
          <CCardBody>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '20px 0',
              }}
            >
              {statsLoading ? (
                <CSpinner size="sm" color="white" />
              ) : (
                statistics?.rejected?.[rejectedStatsDropdown] ?? 0
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    );
  };

  const renderStatisticsCard = () => {
    const titles = {
      daily: 'Completed Order',
      weekly: 'Completed This Week',
      monthly: 'Completed This Month'
    };

    return (
      <CCol md={3}>
        <CCard className="text-white bg-info">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            {titles[completedStatsDropdown]}
            <CFormSelect
              value={completedStatsDropdown}
              onChange={(e) => setCompletedStatsDropdown(e.target.value)}
              style={{ width: '120px' }}
            > {/* <-- THIS ">" WAS MISSING */}
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </CFormSelect>
          </CCardHeader>
          <CCardBody>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '20px 0',
              }}
            >
              {statsLoading ? (
                <CSpinner size="sm" color="white" />
              ) : (
                statistics[completedStatsDropdown]
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    );
  };
const renderInvoiceCard = () => {
    const titles = {
      daily: 'Total Invoices',
      weekly: 'Completed This Week',
      monthly: 'Completed This Month'
    };

    return (
      <CCol md={3}>
        <CCard className="text-white bg-info">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            {titles[completedStatsDropdown]}
            <CFormSelect
              value={completedStatsDropdown}
              onChange={(e) => setCompletedStatsDropdown(e.target.value)}
              style={{ width: '120px' }}
            > {/* <-- THIS ">" WAS MISSING */}
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </CFormSelect>
          </CCardHeader>
          <CCardBody>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '20px 0',
              }}
            >
              {statsLoading ? (
                <CSpinner size="sm" color="white" />
              ) : (
                statistics[completedStatsDropdown]
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    );
  };

  return (
    <div
      style={{
        paddingLeft: '20px',
        paddingRight: '20px',
        // The following styles are added to center the inner content
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
      {/* Header with Restaurant Dropdown (only for superadmin) */}
      <div style={{
        width: '100%',
        maxWidth: '1200px', // Set a max-width to keep content readable on very large screens
      }}>
        <div>
          <div className="w-100 d-flex justify-content-center align-items-center mb-3">
            <h2 className="mb-0 text-center fw-bold fs-3">Overview</h2>
          </div>
          {isSuperAdmin && (
            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
              Total Restaurants: <strong>{restaurants.length}</strong> |
              Showing: <strong>{filteredRestaurants.length}</strong>
            </p>
          )}
        </div>
        {isSuperAdmin && (
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex flex-column gap-2">
              <label htmlFor="restaurant-search" className="form-label mb-0 fw-semibold">
                Search Restaurant:
              </label>
              <CFormInput
                id="restaurant-search"
                type="text"
                placeholder="Type restaurant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '200px' }}
              />
            </div>
            <div className="d-flex flex-column gap-2">
              <label htmlFor="restaurant-select" className="form-label mb-0 fw-semibold">
                Select Restaurant:
              </label>
              <CFormSelect
                id="restaurant-select"
                value={selectedRestaurant}
                onChange={(e) => {
                  const restaurantId = e.target.value;
                  setSelectedRestaurant(restaurantId);

                  // Find restaurant name for API call
                  const selectedRestaurantData = filteredRestaurants.find(r => r._id === restaurantId);
                  if (selectedRestaurantData) {
                    handleRestaurantClick(restaurantId, selectedRestaurantData.restaurantName);
                  }
                }}
                disabled={restaurantsLoading}
                style={{ minWidth: '200px' }}
              >
                {restaurantsLoading ? (
                  <option>Loading restaurants...</option>
                ) : filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.restaurantName || 'No Restaurant Name'}
                    </option>
                  ))
                ) : (
                  <option>No restaurants found</option>
                )}
              </CFormSelect>
            </div>
          </div>
        )}
      </div>

      {error && (
        <CAlert color="danger" className="mb-4">
          Error: {typeof error === 'object' ? JSON.stringify(error) : error}
        </CAlert>
      )}

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {/* Overall Report Section */}
          <CRow className="mb-4" style={{ width: '100%' }}>
            {renderReportCard('Collection (₹)', 'collection')}
            {renderInvoiceCard()}
            {/* {renderReportCard('Completed Orders', 'completedOrders')} */}
            {/* {renderReportCard('Rejected Orders', 'rejectedOrders')} */}
            {renderRejectedStatisticsCard()}
            {renderStatisticsCard()}
          </CRow>

          {/* Yearly & Weekly Charts */}
          <CRow className="justify-content-center" style={{ width: '100%' }}>
            <CCol md={6}>
  <CCard className="shadow-sm border-0">
    <CCardHeader 
      className="bg-gradient d-flex justify-content-between align-items-center py-3"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '0.5rem 0.5rem 0 0'
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <i className="fas fa-chart-line fs-5"></i>
        <span className="fw-bold fs-6">Monthly Performance</span>
      </div>
      <div className="d-flex gap-2">
        <CFormSelect
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          style={{ 
            width: '140px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontWeight: '500'
          }}
          className="form-select-sm"
        >
          {monthOptions.map(month => (
            <option key={month.value} value={month.value} style={{ color: '#333' }}>
              {month.label}
            </option>
          ))}
        </CFormSelect>
        <CFormSelect
          value={selectedMonthYear}
          onChange={(e) => setSelectedMonthYear(parseInt(e.target.value))}
          style={{ 
            width: '100px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontWeight: '500'
          }}
          className="form-select-sm"
        >
          {yearOptions}
        </CFormSelect>
      </div>
    </CCardHeader>
    <CCardBody className="p-4">
      {loading ? (
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        </div>
      ) : getLineChartData().labels.length === 0 ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-chart-line text-muted mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <p className="text-muted mb-0 fs-6">
            No data available for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedMonthYear}
          </p>
          <small className="text-muted">Try selecting a different month or year</small>
        </div>
      ) : (
        <>
          <CChartLine
            data={getLineChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'top',
                  labels: {
                    padding: 15,
                    font: {
                      size: 12,
                      weight: '600'
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                  }
                },
                title: {
                  display: true,
                  text: `Daily Performance for ${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedMonthYear}`,
                  font: {
                    size: 16,
                    weight: 'bold'
                  },
                  padding: {
                    bottom: 20
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  titleFont: {
                    size: 14,
                    weight: 'bold'
                  },
                  bodyFont: {
                    size: 13
                  },
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                  displayColors: true,
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        if (context.dataset.label === 'Revenue (₹)') {
                          label += '₹' + context.parsed.y.toLocaleString();
                        } else {
                          label += context.parsed.y;
                        }
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Day of Month',
                    font: {
                      size: 12,
                      weight: '600'
                    }
                  },
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index'
              }
            }}
            style={{ height: '400px' }}
          />
        </>
      )}
    </CCardBody>
  </CCard>
</CCol>


            <CCol md={6}>
              <CCard className="shadow-sm border-0">
                <CCardHeader
                  className="bg-gradient d-flex justify-content-between align-items-center py-3"
                  style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: '0.5rem 0.5rem 0 0'
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-chart-pie fs-5"></i>
                    <span className="fw-bold fs-6">Weekly Performance</span>
                  </div>
                  <CFormSelect
                    value={selectedWeekYear}
                    onChange={(e) => setSelectedWeekYear(parseInt(e.target.value))}
                    style={{
                      width: '120px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      fontWeight: '500'
                    }}
                    className="form-select-sm"
                  >
                    {yearOptions}
                  </CFormSelect>
                </CCardHeader>
                <CCardBody className="p-4">
                  {loading ? (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CSpinner color="danger" style={{ width: '3rem', height: '3rem' }} />
                    </div>
                  ) : getPieChartData().labels.length === 0 ? (
                    <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-chart-pie text-muted mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                      <p className="text-muted mb-0 fs-6">No weekly data available for {selectedWeekYear}</p>
                      <small className="text-muted">Try selecting a different year</small>
                    </div>
                  ) : (
                    <>
                      <CChartPie
                        data={getPieChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                padding: 15,
                                font: {
                                  size: 12,
                                  weight: '600'
                                },
                                usePointStyle: true,
                                pointStyle: 'circle',
                                generateLabels: function (chart) {
                                  const data = chart.data;
                                  if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                      const value = data.datasets[0].data[i];
                                      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                      const percentage = ((value / total) * 100).toFixed(1);
                                      return {
                                        text: `${label}: ${percentage}%`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                      };
                                    });
                                  }
                                  return [];
                                }
                              }
                            },
                            title: {
                              display: true,
                              text: `Weekly Distribution for ${selectedWeekYear}`,
                              font: {
                                size: 16,
                                weight: 'bold'
                              },
                              padding: {
                                bottom: 20
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: {
                                size: 14,
                                weight: 'bold'
                              },
                              bodyFont: {
                                size: 13
                              },
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              borderWidth: 1,
                              callbacks: {
                                label: function (context) {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                        style={{ height: '400px' }}
                      />
                    </>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Payment Report Section */}
          <CRow className="justify-content-center my-4" style={{ width: '100%' }}>
            <CCol md={12}>
              <CCard className="shadow-sm border-0">
                <CCardHeader
                  className="py-3"
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: '0.5rem 0.5rem 0 0'
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-credit-card fs-5"></i>
                    <h3 className="fw-bold mb-0 fs-5">Payment Type Analytics</h3>
                  </div>
                </CCardHeader>
                <CCardBody className="p-4">
                  {/* Date Selection */}
                  <CRow className="align-items-end mb-4">
                    <CCol md={4}>
                      <label htmlFor="start-date" className="form-label fw-semibold text-muted mb-2">
                        <i className="fas fa-calendar-alt me-2"></i>Start Date
                      </label>
                      <CFormInput
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="shadow-sm"
                        style={{ borderRadius: '0.5rem' }}
                      />
                    </CCol>
                    <CCol md={4}>
                      <label htmlFor="end-date" className="form-label fw-semibold text-muted mb-2">
                        <i className="fas fa-calendar-alt me-2"></i>End Date
                      </label>
                      <CFormInput
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="shadow-sm"
                        style={{ borderRadius: '0.5rem' }}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CButton
                        color="primary"
                        onClick={handleFetchReport}
                        disabled={paymentStatsLoading || !startDate || !endDate}
                        className="w-100 fw-semibold shadow-sm"
                        style={{
                          borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          padding: '0.6rem'
                        }}
                      >
                        {paymentStatsLoading ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-search me-2"></i>
                            Fetch Report
                          </>
                        )}
                      </CButton>
                    </CCol>
                  </CRow>

                  {/* Loading State */}
                  {paymentStatsLoading && (
                    <div className="text-center p-5">
                      <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                      <p className="mt-3 text-muted fw-semibold">Analyzing payment data...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {!paymentStatsLoading && error && (
                    <CAlert color="danger" className="d-flex align-items-center shadow-sm">
                      <i className="fas fa-exclamation-circle me-2 fs-5"></i>
                      <div>
                        <strong>Error:</strong> {error}
                      </div>
                    </CAlert>
                  )}

                  {/* Chart Display */}
                  {!paymentStatsLoading && !error && paymentReportData.length > 0 && (
                    <>
                      {/* Bar Chart */}
                      <CRow className="mb-4">
                        <CCol>
                          <div className="p-3 bg-light rounded-3" style={{ borderRadius: '0.75rem' }}>
                            <CChartBar
                              data={{
                                labels: paymentReportData.map((item) => item.label),
                                datasets: [
                                  {
                                    label: 'Transaction Count',
                                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                    borderColor: 'rgb(102, 126, 234)',
                                    borderWidth: 2,
                                    borderRadius: 8,
                                    data: paymentReportData.map((item) => item.count),
                                  },
                                  {
                                    label: 'Total Amount (₹)',
                                    backgroundColor: 'rgba(102, 204, 102, 0.8)',
                                    borderColor: 'rgb(102, 204, 102)',
                                    borderWidth: 2,
                                    borderRadius: 8,
                                    data: paymentReportData.map((item) => item.amount),
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                    labels: {
                                      padding: 20,
                                      font: {
                                        size: 13,
                                        weight: '600'
                                      },
                                      usePointStyle: true,
                                      pointStyle: 'circle'
                                    }
                                  },
                                  title: {
                                    display: true,
                                    text: `Payment Analytics (${startDate} to ${endDate})`,
                                    font: {
                                      size: 18,
                                      weight: 'bold'
                                    },
                                    padding: {
                                      bottom: 30
                                    }
                                  },
                                  tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    padding: 12,
                                    titleFont: {
                                      size: 14,
                                      weight: 'bold'
                                    },
                                    bodyFont: {
                                      size: 13
                                    },
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    borderWidth: 1,
                                    callbacks: {
                                      label: function (context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                          label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                          if (label.includes('Amount')) {
                                            label += '₹' + context.parsed.y.toLocaleString();
                                          } else {
                                            label += context.parsed.y;
                                          }
                                        }
                                        return label;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    grid: {
                                      color: 'rgba(0, 0, 0, 0.05)',
                                      drawBorder: false
                                    },
                                    ticks: {
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                  x: {
                                    grid: {
                                      display: false
                                    },
                                    ticks: {
                                      font: {
                                        size: 12,
                                        weight: '600'
                                      }
                                    }
                                  }
                                },
                              }}
                              style={{ height: '450px' }}
                            />
                          </div>
                        </CCol>
                      </CRow>

                      {/* Summary Table */}
                      <CRow>
                        <CCol>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <i className="fas fa-table fs-5 text-primary"></i>
                            <h5 className="mb-0 fw-bold">Payment Type Summary</h5>
                          </div>
                          <div className="table-responsive shadow-sm rounded-3">
                            <table className="table table-hover mb-0">
                              <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <tr>
                                  <th className="py-3 ps-4">Payment Type</th>
                                  <th className="text-end py-3">Transactions</th>
                                  <th className="text-end py-3">Total Amount</th>
                                  <th className="text-end py-3 pe-4">Avg Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentReportData.map((item, index) => (
                                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td className="py-3 ps-4">
                                      <span className="fw-semibold">{item.label}</span>
                                    </td>
                                    <td className="text-end py-3">
                                      <span className="badge bg-primary rounded-pill px-3 py-2">
                                        {item.count}
                                      </span>
                                    </td>
                                    <td className="text-end py-3 fw-semibold">
                                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-end py-3 pe-4 text-muted">
                                      ₹{(item.amount / item.count).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                                <tr style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
                                  <td className="py-3 ps-4 fw-bold fs-6">GRAND TOTAL</td>
                                  <td className="text-end py-3">
                                    <span className="badge bg-success rounded-pill px-3 py-2 fw-bold">
                                      {paymentReportData.reduce((sum, item) => sum + item.count, 0)}
                                    </span>
                                  </td>
                                  <td className="text-end py-3 fw-bold fs-6">
                                    ₹{paymentReportData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-end py-3 pe-4 fw-bold">
                                    ₹{(
                                      paymentReportData.reduce((sum, item) => sum + item.amount, 0) /
                                      paymentReportData.reduce((sum, item) => sum + item.count, 0)
                                    ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* No Data State */}
                  {!paymentStatsLoading && !error && paymentReportData.length === 0 && startDate && endDate && (
                    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-chart-bar text-muted mb-3" style={{ fontSize: '5rem', opacity: 0.2 }}></i>
                      <p className="text-muted mb-2 fs-5 fw-semibold">No payment data found</p>
                      <small className="text-muted">
                        Try selecting a different date range or check if there are transactions for this period.
                      </small>
                    </div>
                  )}

                  {/* Initial State */}
                  {!paymentStatsLoading && !startDate && !endDate && (
                    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-calendar-check text-primary mb-3" style={{ fontSize: '5rem', opacity: 0.3 }}></i>
                      <p className="text-muted fs-5 fw-semibold">Select a date range to view analytics</p>
                      <small className="text-muted">Choose start and end dates, then click "Fetch Report"</small>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </div>
  );
};


export default Dashboard;