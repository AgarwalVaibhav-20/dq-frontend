
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CCard, CCardHeader, CCardBody, CFormSelect, CSpinner } from '@coreui/react';
import { CChartLine } from '@coreui/react-chartjs';
import { fetchChartData } from '../../redux/slices/dashboardSlice';

const YearlyChartReport = () => {
  const dispatch = useDispatch();
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const { chartData, loading } = useSelector((state) => state.dashboard);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchChartData({ year: selectedYear, restaurantId }));
    }
  }, [selectedYear, restaurantId, dispatch]);

  const formattedDatasets =
    chartData?.datasets?.map((ds) => ({
      ...ds,
      data: ds.data.map((val) => parseFloat(val)),
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    })) || [];

  return (
    <CCard className="my-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Yearly Performance Report</h5>
        <CFormSelect
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ width: '120px' }}
        >
          {yearOptions}
        </CFormSelect>
      </CCardHeader>
      <CCardBody >
        {loading ? (
          <div className="d-flex justify-content-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <CChartLine
            data={{
              labels: chartData?.labels || [],
              datasets: formattedDatasets,
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
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `₹${value}`,
                  },
                },
              },
            }}
            style={{ height: '400px' }}
          />
        )}
      </CCardBody>
    </CCard>
  );
};

export default YearlyChartReport;
