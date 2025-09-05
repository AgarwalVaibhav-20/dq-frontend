import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CChartLine, CChartPie, CChartBar } from '@coreui/react-chartjs';
import { CFormSelect, CSpinner, CRow, CCol, CCard, CCardBody, CCardHeader, CFormInput, CButton } from '@coreui/react';
import { fetchChartData, fetchWeeklyChartData, fetchOverallReport, fetchPaymentTypeStats } from '../../redux/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    chartData,
    weeklyChartData,
    overallReport,
    paymentTypeStats,
    loading,
    error
  } = useSelector((state) => state.dashboard);
  const restaurantId = useSelector((state) => state.auth.restaurantId);

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

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchOverallReport({ restaurantId }));
      dispatch(fetchChartData({ year: selectedYear, restaurantId }));
      dispatch(fetchWeeklyChartData({ year: selectedWeekYear, restaurantId }));
    }
  }, [dispatch, selectedYear, selectedWeekYear, restaurantId]);

  const handleFetchReport = () => {
    if (startDate && endDate) {
      dispatch(
        fetchPaymentTypeStats({
          startDate,
          endDate,
          restaurantId: restaurantId,
        })
      );
    } else {
      alert('Please select both start and end dates');
    }
  };

  const paymentReportData = paymentTypeStats?.data?.map((item) => ({
    label: item.payment_type,
    count: item.total_count,
    amount: parseFloat(item.total_amount),
  })) || [];

  const handleDropdownChange = (key, value) => {
    setDropdownStates((prevState) => ({
      ...prevState,
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
    return {
      collection: overallReport?.[`${state}Collection`],
      invoices: overallReport?.[`totalInvoice${state.charAt(0).toUpperCase() + state.slice(1)}`],
      completedOrders: overallReport?.[`totalCompleteOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
      rejectedOrders: overallReport?.[`totalRejectOrder${state.charAt(0).toUpperCase() + state.slice(1)}`],
    }[key];
  };

  const renderReportCard = (title, key) => (
    <CCol md={3}>
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
            {getReportData(key) || 0}
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  );

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Overview</h2>
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

          {/* Chart Section */}
          <CRow className="justify-content-center" style={{ width: '100%' }}>
            <CCol md={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  Yearly Performance
                  <CFormSelect
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    {yearOptions}
                  </CFormSelect>
                </CCardHeader>
                <CCardBody>
                  <CChartLine
                    data={{
                      labels: chartData?.labels || [],
                      datasets: chartData?.datasets || [],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: `Yearly Performance for ${selectedYear}`,
                        },
                      },
                    }}
                    style={{ height: '400px' }}
                  />
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  Weekly Performance
                  <CFormSelect
                    value={selectedWeekYear}
                    onChange={(e) => setSelectedWeekYear(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    {yearOptions}
                  </CFormSelect>
                </CCardHeader>
                <CCardBody>
                  <CChartPie
                    data={{
                      labels: weeklyChartData?.datasets?.map((ds) => ds.label) || [],
                      datasets: [
                        {
                          data: weeklyChartData?.datasets?.map((ds) =>
                            ds.data.reduce((acc, val) => acc + parseFloat(val || 0), 0)
                          ) || [],
                          backgroundColor:
                            weeklyChartData?.datasets?.map((ds) => ds.backgroundColor) || [],
                          borderColor:
                            weeklyChartData?.datasets?.map((ds) => ds.borderColor) || [],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: `Weekly Performance for ${selectedWeekYear}`,
                        },
                      },
                    }}
                    style={{ height: '400px' }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Payment Report Section */}
          <CRow className="justify-content-center my-4" style={{ width: '100%' }}>
            <CCol md={12}>
              <CCard>
                <h3 className="d-flex p-4 fw-semibold justify-content-between align-items-center">
                Get Report by Payment Type
                </h3>
                <h6 className='text-danger px-4 fw-medium cil-italic'>Select start date and end to get Report</h6>
                <CCardBody>
                  <CRow className="align-items-center mb-4">
                    <CCol md={5}>
                      <label htmlFor="start-date" className="form-label">Start Date</label>
                      <CFormInput
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                      />
                    </CCol>
                    <CCol md={5}>
                      <label htmlFor="end-date" className="form-label">End Date</label>
                      <CFormInput
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date"
                      />
                    </CCol>
                    <CCol md={2} className="text-end mt-4">
                      <CButton color="primary" onClick={handleFetchReport} style={{ width: '100%' }}>
                        Fetch Report
                      </CButton>
                    </CCol>
                  </CRow>
                  <CRow>
                    <CCol>
                      {loading && <p>Loading...</p>}
                      {error && <p className="text-danger">Error: {error}</p>}
                      {(!loading && paymentTypeStats?.status === 'success' && paymentReportData.length > 0) ? (
                        <CChartBar
                          data={{
                            labels: paymentReportData?.map((item) => item.label),
                            datasets: [
                              {
                                label: 'Total Count',
                                backgroundColor: '#3399ff',
                                data: paymentReportData?.map((item) => item.count),
                              },
                              {
                                label: 'Total Amount',
                                backgroundColor: '#66cc66',
                                data: paymentReportData?.map((item) => item.amount),
                              },
                            ],
                          }}
                          options={{
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                          style={{ height: '400px' }}
                        />
                      ) : (
                        <CChartBar
                          data={{
                            labels: ['Default'],
                            datasets: [
                              {
                                label: 'No Data',
                                backgroundColor: '#d3d3d3',
                                data: [0],
                              },
                            ],
                          }}
                          options={{
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                          style={{ height: '400px' }}
                        />
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
