


// components/DashboardStats.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CCard, CCardBody, CCardTitle, CSpinner } from '@coreui/react';
import { fetchAllTransactions } from '../../redux/slices/reportSlice';



const  DashboardStatisticsReport = () => {
  const dispatch = useDispatch();
  const { allTransactions, loading } = useSelector((state) => state.reports);
  const {restaurantId} = useSelector((state) => state.auth)
 

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({restaurantId}));
    }
  }, [restaurantId, dispatch]);

  // Process transactions to calculate statistics
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const todayTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt)
    return date >= startOfToday && date < endOfToday
  })
  
  const weeklyTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt)
    return date >= startOfWeek
  })
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt)
    return date >= startOfMonth
  })
  
  const calculateStats = (transactionList) => {
    const totalAmount = transactionList.reduce((sum, t) => sum + (t.sub_total || 0), 0)
    const completedOrders = transactionList.filter(t => t.status === 'completed').length
    const rejectedOrders = transactionList.filter(t => t.status === 'rejected').length
    const totalInvoices = transactionList.length
    
    return {
      collection: totalAmount.toFixed(2),
      invoices: totalInvoices,
      completed: completedOrders,
      rejected: rejectedOrders
    }
  }
  
  const todayStats = calculateStats(todayTransactions)
  const weeklyStats = calculateStats(weeklyTransactions)
  const monthlyStats = calculateStats(monthlyTransactions)

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CCard>
        <CCardBody>
          <CCardTitle>Today's Stats</CCardTitle>
          <p>Collection: ₹{todayStats.collection}</p>
          <p>Invoices: {todayStats.invoices}</p>
          <p>Completed: {todayStats.completed}</p>
          <p>Rejected: {todayStats.rejected}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Weekly Stats</CCardTitle>
          <p>Collection: ₹{weeklyStats.collection}</p>
          <p>Invoices: {weeklyStats.invoices}</p>
          <p>Completed: {weeklyStats.completed}</p>
          <p>Rejected: {weeklyStats.rejected}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Monthly Stats</CCardTitle>
          <p>Collection: ₹{monthlyStats.collection}</p>
          <p>Invoices: {monthlyStats.invoices}</p>
          <p>Completed: {monthlyStats.completed}</p>
          <p>Rejected: {monthlyStats.rejected}</p>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default DashboardStatisticsReport;

