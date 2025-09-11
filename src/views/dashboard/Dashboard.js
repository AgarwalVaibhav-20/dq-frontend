import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
  CFormInput,
  CButton,
  CSpinner,
  CAlert,
  CTooltip,
} from '@coreui/react';
import { CChartLine, CChartBar, CChartPie } from '@coreui/react-chartjs';
import {
  fetchChartData,
  fetchWeeklyChartData,
  fetchOverallReport,
  fetchPaymentTypeStats,
  // clearDashboardError,
} from '../../redux/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const token = localStorage.getItem('authToken');

  const {
    chartData,
    weeklyChartData,
    overallReport,
    paymentTypeStats,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  // State management
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeekYear, setSelectedWeekYear] = useState(new Date().getFullYear());
  const [dropdownStates, setDropdownStates] = useState({
    collection: 'today',
    invoices: 'today',
    completedOrders: 'today',
    rejectedOrders: 'today',
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Initial data fetch
  useEffect(() => {
    if (restaurantId && token) {
      // Clear any previous errors
      // dispatch(clearDashboardError?.() || { type: 'dashboard/clearError' });

      // Fetch initial data
      dispatch(fetchOverallReport({ token }));
      dispatch(fetchChartData({ year: selectedYear, restaurantId, token }));
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId, token }));
    }
  }, [dispatch, restaurantId, token]);

  // Handle year changes
  useEffect(() => {
    if (restaurantId && token && selectedYear) {
      dispatch(fetchChartData({ year: selectedYear, restaurantId, token }));
    }
  }, [dispatch, selectedYear, restaurantId, token]);

  useEffect(() => {
    if (restaurantId && token && selectedWeekYear) {
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId, token }));
    }
  }, [dispatch, selectedWeekYear, restaurantId, token]);

  // Memoized year options
  const yearOptions = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return (
        <option key={year} value={year}>
          {year}
        </option>
      );
    }), []
  );

  // Handle payment type report fetch
  const handleFetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be greater than end date');
      return;
    }

    if (!token) {
      alert('Authentication token not found. Please log in again.');
      return;
    }

    setPaymentLoading(true);
    try {
      await dispatch(fetchPaymentTypeStats({
        startDate,
        endDate,
        restaurantId,
        token,
      })).unwrap();
    } catch (error) {
      console.error('Failed to fetch payment type stats:', error);
    } finally {
      setPaymentLoading(false);
    }
  }, [dispatch, startDate, endDate, restaurantId, token]);

  // Handle dropdown changes
  const handleDropdownChange = useCallback((key, value) => {
    setDropdownStates((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Get report data based on dropdown selection
  const getReportData = useCallback((key) => {
    const state = dropdownStates[key];
    const capitalizedState = state.charAt(0).toUpperCase() + state.slice(1);

    const dataMap = {
      collection: overallReport?.[`${state}Collection`],
      invoices: overallReport?.[`totalInvoice${capitalizedState}`],
      completedOrders: overallReport?.[`totalCompleteOrder${capitalizedState}`],
      rejectedOrders: overallReport?.[`totalRejectOrder${capitalizedState}`],
    };

    return dataMap[key];
  }, [dropdownStates, overallReport]);

  // Format number for display
  const formatNumber = useCallback((value) => {
    if (typeof value !== 'number') return '0';
    return value.toLocaleString('en-IN');
  }, []);

  // Format currency
  const formatCurrency = useCallback((value) => {
    if (typeof value !== 'number') return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  }, []);

  // Process payment report data
  const paymentReportData = useMemo(() =>
    paymentTypeStats?.data?.map((item) => ({
      label: item.payment_type,
      count: item.total_count,
      amount: parseFloat(item.total_amount),
    })) || [], [paymentTypeStats]);

  // Render report card
  const renderReportCard = useCallback((title, key) => {
    const value = getReportData(key);
    const isCollection = key === 'collection';

    return (
      <CCol md={3} className="mb-3" key={key}>
        <CCard className="h-100">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <span>{title}</span>
            <CFormSelect
              value={dropdownStates[key]}
              onChange={(e) => handleDropdownChange(key, e.target.value)}
              style={{ width: '120px' }}
              size="sm"
            >
              <option value="today">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </CFormSelect>
          </CCardHeader>
          <CCardBody className="text-center">
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '20px 0',
                color: value > 0 ? '#28a745' : '#6c757d',
              }}
            >
              {isCollection ? formatCurrency(value || 0) : formatNumber(value || 0)}
            </div>
            {loading && (
              <CSpinner size="sm" color="primary" />
            )}
          </CCardBody>
        </CCard>
      </CCol>
    );
  }, [dropdownStates, getReportData, handleDropdownChange, loading, formatCurrency, formatNumber]);

  // Error component
  const ErrorAlert = ({ message, onRetry }) => (
    <CAlert color="danger" className="mb-4">
      <div className="d-flex justify-content-between align-items-center">
        <span><strong>Error:</strong> {message}</span>
        <CButton color="danger" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </CButton>
      </div>
    </CAlert>
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    if (restaurantId && token) {
      // dispatch(clearDashboardError?.() || { type: 'dashboard/clearError' });
      dispatch(fetchOverallReport({ restaurantId, token }));
      dispatch(fetchChartData({ year: selectedYear, restaurantId, token }));
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId, token }));
    }
  }, [dispatch, restaurantId, token, selectedYear, selectedWeekYear]);

  // Loading component
  if (loading && !overallReport) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <CSpinner color="primary" variant="grow" size="lg" />
          <span className="ms-3">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard Overview</h2>
        <div className="text-muted small">
          Restaurant ID: {restaurantId || 'Not Found'}
        </div>
      </div>

      {error && (
        <ErrorAlert
          message={error}
          onRetry={handleRetry}
        />
      )}

      {/* Overall Report Cards */}
      <CRow>
        {renderReportCard('Collection', 'collection')}
        {renderReportCard('Total Invoices', 'invoices')}
        {renderReportCard('Completed Orders', 'completedOrders')}
        {renderReportCard('Rejected Orders', 'rejectedOrders')}
      </CRow>

      {/* Charts Row */}
      <CRow className="mt-4">
        {/* Yearly Chart */}
        <CCol md={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>Yearly Performance</span>
              <CFormSelect
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: '120px' }}
                size="sm"
              >
                {yearOptions}
              </CFormSelect>
            </CCardHeader>
            <CCardBody>
              {chartData?.labels?.length > 0 ? (
                <CChartLine
                  data={{
                    labels: chartData.labels,
                    datasets: chartData.datasets || [],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: {
                        display: true,
                        text: `Performance for ${selectedYear}`,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                  style={{ height: '300px' }}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <span className="text-muted">No yearly data available</span>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Weekly Pie Chart */}
        <CCol md={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>Weekly Performance</span>
              <CFormSelect
                value={selectedWeekYear}
                onChange={(e) => setSelectedWeekYear(parseInt(e.target.value))}
                style={{ width: '120px' }}
                size="sm"
              >
                {yearOptions}
              </CFormSelect>
            </CCardHeader>
            <CCardBody>
              {weeklyChartData?.datasets?.length > 0 ? (
                <CChartPie
                  data={{
                    labels: weeklyChartData.datasets.map((ds) => ds.label) || [],
                    datasets: [
                      {
                        data: weeklyChartData.datasets.map((ds) =>
                          ds.data.reduce((acc, val) => acc + parseFloat(val || 0), 0)
                        ),
                        backgroundColor: weeklyChartData.datasets.map((ds) => ds.backgroundColor),
                        borderColor: weeklyChartData.datasets.map((ds) => ds.borderColor),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: {
                        display: true,
                        text: `Weekly Performance for ${selectedWeekYear}`,
                      },
                    },
                  }}
                  style={{ height: '300px' }}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <span className="text-muted">No weekly data available</span>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Payment Type Report */}
      <CRow className="mt-4">
        <CCol md={12}>
          <CCard>
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <span>Payment Type Report</span>
                {paymentLoading && <CSpinner size="sm" />}
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={4}>
                  <label className="form-label">Start Date</label>
                  <CFormInput
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </CCol>
                <CCol md={4}>
                  <label className="form-label">End Date</label>
                  <CFormInput
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    min={startDate}
                  />
                </CCol>
                <CCol md={4} className="d-flex align-items-end">
                  <CTooltip content="Fetch payment report for selected date range">
                    <CButton
                      color="primary"
                      onClick={handleFetchReport}
                      style={{ width: '100%' }}
                      disabled={paymentLoading || !startDate || !endDate}
                    >
                      {paymentLoading ? <CSpinner size="sm" /> : 'Fetch Report'}
                    </CButton>
                  </CTooltip>
                </CCol>
              </CRow>

              <div style={{ height: '400px' }}>
                <CChartBar
                  data={{
                    labels: paymentReportData.length > 0
                      ? paymentReportData.map((item) => item.label)
                      : ['No Data'],
                    datasets: paymentReportData.length > 0
                      ? [
                          {
                            label: 'Transaction Count',
                            backgroundColor: '#36a2eb',
                            borderColor: '#36a2eb',
                            data: paymentReportData.map((item) => item.count),
                            yAxisID: 'y',
                          },
                          {
                            label: 'Total Amount (₹)',
                            backgroundColor: '#4bc0c0',
                            borderColor: '#4bc0c0',
                            data: paymentReportData.map((item) => item.amount),
                            yAxisID: 'y1',
                          },
                        ]
                      : [
                          {
                            label: 'No Data',
                            backgroundColor: '#d3d3d3',
                            data: [0],
                          },
                        ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: { position: 'top' },
                      title: {
                        display: paymentReportData.length > 0,
                        text: `Payment Report: ${startDate} to ${endDate}`,
                      },
                    },
                    scales: paymentReportData.length > 0 ? {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Transaction Count',
                        },
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Amount (₹)',
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    } : {},
                  }}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default Dashboard;
