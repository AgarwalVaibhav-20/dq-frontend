


// components/DashboardStats.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CCard, CCardBody, CCardTitle, CSpinner } from '@coreui/react';
import { fetchDashboardStatisticsReport } from '../../redux/slices/reportSlice';



const  DashboardStatisticsReport = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading } = useSelector((state) => state.reports);
  const {restaurantId} = useSelector((state) => state.auth)
 

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchDashboardStatisticsReport({restaurantId}));
    }
  }, [restaurantId, dispatch]);

  // if (loading || !dashboardStats) {
  //   return <CSpinner />;
  // }

  const {
    todayCollection,
    totalInvoiceToday,
    totalCompleteOrderToday,
    totalRejectOrderToday,
    weeklyCollection,
    totalInvoiceWeekly,
    totalCompleteOrderWeekly,
    totalRejectOrderWeekly,
    monthlyCollection,
    totalInvoiceMonthly,
    totalCompleteOrderMonthly,
    totalRejectOrderMonthly,
  } = dashboardStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CCard>
        <CCardBody>
          <CCardTitle>Today's Stats</CCardTitle>
          <p>Collection: ₹{todayCollection}</p>
          <p>Invoices: {totalInvoiceToday}</p>
          <p>Completed: {totalCompleteOrderToday}</p>
          <p>Rejected: {totalRejectOrderToday}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Weekly Stats</CCardTitle>
          <p>Collection: ₹{weeklyCollection}</p>
          <p>Invoices: {totalInvoiceWeekly}</p>
          <p>Completed: {totalCompleteOrderWeekly}</p>
          <p>Rejected: {totalRejectOrderWeekly}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Monthly Stats</CCardTitle>
          <p>Collection: ₹{monthlyCollection}</p>
          <p>Invoices: {totalInvoiceMonthly}</p>
          <p>Completed: {totalCompleteOrderMonthly}</p>
          <p>Rejected: {totalRejectOrderMonthly}</p>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default DashboardStatisticsReport;

