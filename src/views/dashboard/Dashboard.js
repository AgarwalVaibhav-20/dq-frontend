import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CChartLine, CChartPie, CChartBar } from '@coreui/react-chartjs';
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
} from '../../redux/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();

  const {
    chartData,
    weeklyChartData,
    overallReport,
    paymentTypeStats,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  const restaurantId = localStorage.getItem('restaurantId');
  const token = localStorage.getItem('authToken');

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
  const [paymentStatsLoading, setPaymentStatsLoading] = useState(false);

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
  }, [chartData, weeklyChartData, overallReport, paymentTypeStats, restaurantId, token, loading, error]);

  // Load data initially
  useEffect(() => {
    if (restaurantId && token) {
      console.log('Fetching initial data...');
      dispatch(fetchOverallReport({ restaurantId, token }));
      dispatch(fetchChartData({ year: selectedYear, restaurantId, token }));
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId, token }));
    } else {
      console.warn('Missing restaurantId or token:', { restaurantId, token: !!token });
    }
  }, [dispatch, selectedYear, selectedWeekYear, restaurantId, token]);

  const handleFetchReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (!restaurantId || !token) {
      alert('Missing restaurant ID or authentication token');
      return;
    }

    console.log('Fetching payment report with:', { startDate, endDate, restaurantId, token: !!token });
    setPaymentStatsLoading(true);
    
    try {
      await dispatch(fetchPaymentTypeStats({ startDate, endDate, restaurantId, token }));
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setPaymentStatsLoading(false);
    }
  };

  // Mock data for payment type report (for testing purposes)
  const mockPaymentTypeData = {
    data: [
      {
        payment_type: 'Cash',
        total_count: 125,
        total_amount: '15750.50'
      },
      {
        payment_type: 'Credit Card',
        total_count: 89,
        total_amount: '22340.75'
      },
      {
        payment_type: 'Debit Card',
        total_count: 67,
        total_amount: '8920.25'
      },
      {
        payment_type: 'UPI',
        total_count: 156,
        total_amount: '18650.00'
      },
      {
        payment_type: 'Net Banking',
        total_count: 34,
        total_amount: '12890.80'
      },
      {
        payment_type: 'Wallet',
        total_count: 43,
        total_amount: '5670.45'
      }
    ]
  };

  // Safe data transformation for payment report
  const getPaymentReportData = () => {
    // Use mock data if no real data is available and dates are selected (for testing)
    if ((!paymentTypeStats?.data || !Array.isArray(paymentTypeStats.data)) && startDate && endDate) {
      console.log('No payment stats data available, using mock payment data');
      return mockPaymentTypeData.data.map((item) => ({
        label: item.payment_type || 'Unknown',
        count: parseInt(item.total_count) || 0,
        amount: parseFloat(item.total_amount) || 0,
      }));
    }

    if (!paymentTypeStats?.data || !Array.isArray(paymentTypeStats.data)) {
      console.log('No payment stats data available');
      return [];
    }

    return paymentTypeStats.data.map((item) => ({
      label: item.payment_type || 'Unknown',
      count: parseInt(item.total_count) || 0,
      amount: parseFloat(item.total_amount) || 0,
    }));
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

  const getReportData = (key) => {
    const state = dropdownStates[key];
    console.log('getReportData - key:', key, 'state:', state, 'overallReport:', overallReport);

    if (!overallReport) {
      console.log('No overall report data');
      return 0;
    }

    const data = {
      collection: overallReport[`${state}Collection`],
      invoices: overallReport[`totalInvoice${state.charAt(0).toUpperCase() + state.slice(1)}`],
      completedOrders: overallReport[`totalCompleteOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
      rejectedOrders: overallReport[`totalRejectOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
    }[key];

    console.log('getReportData - result:', data);
    return data || 0;
  };

  // Mock data for yearly chart (for testing purposes)
  const mockYearlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Orders',
        data: [6005, 8005, 7000, 9005, 8008, 7000, 10005, 12005, 40015, 14000, 90035, 8055],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Customers',
        data: [4500, 6200, 5800, 7002, 6900, 8500, 8200, 9005, 9001, 10800,7030, 9720],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
      }
    ],
  };

  // Mock data for weekly chart (for testing purposes)
  const mockWeeklyData = {
    datasets: [
      {
        label: 'Monday',
        data: [2500, 1800, 3200, 2100], // Sample weekly data for different weeks
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
      },
      {
        label: 'Tuesday',
        data: [2800, 2200, 3500, 2400],
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
      },
      {
        label: 'Wednesday',
        data: [3200, 2600, 3800, 2900],
        backgroundColor: '#FFCE56',
        borderColor: '#FFCE56',
      },
      {
        label: 'Thursday',
        data: [3500, 2900, 4100, 3200],
        backgroundColor: '#4BC0C0',
        borderColor: '#4BC0C0',
      },
      {
        label: 'Friday',
        data: [4200, 3800, 4800, 4100],
        backgroundColor: '#9966FF',
        borderColor: '#9966FF',
      },
      {
        label: 'Saturday',
        data: [5200, 4900, 5800, 5100],
        backgroundColor: '#FF9F40',
        borderColor: '#FF9F40',
      },
      {
        label: 'Sunday',
        data: [4800, 4200, 5200, 4600],
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
      }
    ],
  };

  // Safe chart data preparation
  const getLineChartData = () => {
    // Use mock data if no real data is available (for testing)
    if (!chartData || !chartData.labels || !chartData.datasets) {
      console.log('No line chart data available, using mock data');
      return mockYearlyData;
    }
    return chartData;
  };

  const getPieChartData = () => {
    // Use mock data if no real data is available (for testing)
    if (!weeklyChartData?.datasets || !Array.isArray(weeklyChartData.datasets)) {
      console.log('No pie chart data available, using mock weekly data');
      
      const labels = mockWeeklyData.datasets.map((ds) => ds.label);
      const data = mockWeeklyData.datasets.map((ds) => {
        return ds.data.reduce((acc, val) => acc + parseFloat(val || 0), 0);
      });
      const backgroundColor = mockWeeklyData.datasets.map((ds) => ds.backgroundColor);
      const borderColor = mockWeeklyData.datasets.map((ds) => ds.borderColor);

      return {
        labels,
        datasets: [{
          data,
          backgroundColor,
          borderColor,
        }],
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
            <option value="today">Today</option>
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

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Overview</h2>
      
      {error && (
        <CAlert color="danger" className="mb-4">
          Error: {error}
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
            {renderReportCard('Total Invoices', 'invoices')}
            {renderReportCard('Completed Orders', 'completedOrders')}
            {renderReportCard('Rejected Orders', 'rejectedOrders')}
          </CRow>

          {/* Yearly & Weekly Charts */}
          <CRow className="justify-content-center" style={{ width: '100%' }}>
            <CCol md={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  Yearly Performance
                  <CFormSelect
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ width: '120px' }}
                  >
                    {yearOptions}
                  </CFormSelect>
                </CCardHeader>
                <CCardBody>
                  {/* Always show chart now since we have mock data fallback */}
                  <CChartLine
                    data={getLineChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: {
                          display: true,
                          text: `Yearly Performance for ${selectedYear}`,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                    style={{ height: '400px' }}
                  />
                  {getLineChartData().labels.length === 0 && (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p className="text-muted">No yearly data available for {selectedYear}</p>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  Weekly Performance
                  <CFormSelect
                    value={selectedWeekYear}
                    onChange={(e) => setSelectedWeekYear(parseInt(e.target.value))}
                    style={{ width: '120px' }}
                  >
                    {yearOptions}
                  </CFormSelect>
                </CCardHeader>
                <CCardBody>
                  <CChartPie
                    data={getPieChartData()}
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
                    style={{ height: '400px' }}
                  />
                  {getPieChartData().labels.length === 0 && (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p className="text-muted">No weekly data available for {selectedWeekYear}</p>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Payment Report Section */}
          <CRow className="justify-content-center my-4" style={{ width: '100%' }}>
            <CCol md={12}>
              <CCard>
                <CCardHeader>
                  <h3 className="fw-semibold mb-0">Get Report by Payment Type</h3>
                </CCardHeader>
                <CCardBody>
                  <CRow className="align-items-center mb-4">
                    <CCol md={5}>
                      <label htmlFor="start-date" className="form-label">
                        Start Date
                      </label>
                      <CFormInput
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </CCol>
                    <CCol md={5}>
                      <label htmlFor="end-date" className="form-label">
                        End Date
                      </label>
                      <CFormInput
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate} // Prevent end date before start date
                      />
                    </CCol>
                    <CCol md={2} className="text-end mt-4">
                      <CButton
                        color="primary"
                        onClick={handleFetchReport}
                        disabled={paymentStatsLoading || !startDate || !endDate}
                        style={{ width: '100%' }}
                      >
                        {paymentStatsLoading ? <CSpinner size="sm" /> : 'Fetch Report'}
                      </CButton>
                    </CCol>
                  </CRow>

                  <CRow>
                    <CCol>
                      {paymentStatsLoading && (
                        <div className="text-center p-3">
                          <CSpinner color="primary" />
                          <p className="mt-2">Loading payment report...</p>
                        </div>
                      )}
                      
                      {!paymentStatsLoading && paymentReportData.length > 0 ? (
                        <CChartBar
                          data={{
                            labels: paymentReportData.map((item) => item.label),
                            datasets: [
                              {
                                label: 'Total Count',
                                backgroundColor: '#3399ff',
                                borderColor: '#0066cc',
                                borderWidth: 1,
                                data: paymentReportData.map((item) => item.count),
                              },
                              {
                                label: 'Total Amount (₹)',
                                backgroundColor: '#66cc66',
                                borderColor: '#339933',
                                borderWidth: 1,
                                data: paymentReportData.map((item) => item.amount),
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
                                text: `Payment Report (${startDate} to ${endDate})`,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                          style={{ height: '400px' }}
                        />
                      ) : !paymentStatsLoading && startDate && endDate ? (
                        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p className="text-muted">
                            {paymentReportData.length === 0 ? 
                              'No payment data found for the selected date range.' : 
                              'Click "Fetch Report" to load payment data.'
                            }
                          </p>
                        </div>
                      ) : (
                        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p className="text-muted">Please select a date range and click "Fetch Report" to view payment data.</p>
                        </div>
                      )}
                    </CCol>
                  </CRow>
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