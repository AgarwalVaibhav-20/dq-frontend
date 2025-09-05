// WeeklyChartReport.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CCard, CCardHeader, CCardBody, CFormSelect, CSpinner } from '@coreui/react';
import { CChartLine } from '@coreui/react-chartjs';
import { fetchWeeklyChartData } from '../../redux/slices/dashboardSlice';   // ← adjust path if needed

const WeeklyChartReport = () => {
  const dispatch       = useDispatch();
  const restaurantId   = useSelector((state) => state.auth.restaurantId);
  const { weeklyChartData, loading } = useSelector((state) => state.dashboard);

  const currentYear    = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* ---------- Drop-down with the last 10 years ---------- */
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });

  /* ---------- Fetch whenever year or restaurant changes ---------- */
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchWeeklyChartData({ year: selectedYear, restaurantId }));
    }
  }, [selectedYear, restaurantId, dispatch]);

  /* ---------- Massage the datasets (string ➜ number, add styling) ---------- */
  const formattedDatasets =
    weeklyChartData?.datasets?.map((ds) => ({
      ...ds,
      data: ds.data.map((val) => parseFloat(val)),   // convert "435.00" ➜ 435
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    })) || [];

  return (
    <CCard className="my-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Weekly Performance Report</h5>
        <CFormSelect
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ width: '120px' }}
        >
          {yearOptions}
        </CFormSelect>
      </CCardHeader>

      <CCardBody>
        {loading ? (
          <div className="d-flex justify-content-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <CChartLine
            data={{
              labels: weeklyChartData?.labels || [],
              datasets: formattedDatasets,
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title : {
                  display: true,
                  text   : `Weekly Performance for ${selectedYear}`,
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      `${ctx.dataset.label}: ` +
                      (ctx.dataset.label.includes('Collection') ? `₹${ctx.parsed.y}` : ctx.parsed.y),
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => (formattedDatasets[0]?.label === 'Total Collection' ? `₹${value}` : value),
                  },
                },
                x: {
                  ticks: { autoSkip: true, maxTicksLimit: 13 }, // show roughly one tick / 4 weeks
                },
              },
            }}
            style={{ height: '450px' }}
          />
        )}
      </CCardBody>
    </CCard>
  );
};

export default WeeklyChartReport;
