// components/DashboardStats.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CCard, CCardBody, CCardTitle, CSpinner } from '@coreui/react';

// 1. Import from BOTH slices
import {
  fetchOrderStatistics,
  fetchRejectedOrderStatistics,
} from '../../redux/slices/orderSlice';
import { fetchAllTransactions } from '../../redux/slices/reportSlice';

const DashboardStatisticsReport = () => {
  const dispatch = useDispatch();

  // 2. Get data from reportSlice (for Collection)
  const { allTransactions, loading: reportLoading } = useSelector((state) => state.reports);

  // 3. Get data from auth slice
  const { restaurantId, token } = useSelector((state) => state.auth);

  // 4. Get data from orderSlice (for Counts)
  const { statistics, statsLoading, error: orderError } = useSelector((state) => state.orders);

  // 5. Update useEffect to dispatch all three actions
  useEffect(() => {
    if (restaurantId) {
      // Dispatch actions for order counts
      if (token) {
        dispatch(fetchOrderStatistics({ token }));
        dispatch(fetchRejectedOrderStatistics({ token }));
      }
      // Dispatch action for collection data
      dispatch(fetchAllTransactions({ restaurantId }));
    }
  }, [restaurantId, token, dispatch]);

  // --- Client-side calculation for 'Collection' (from reportSlice) ---
  const transactions = Array.isArray(allTransactions) ? allTransactions : [];
  
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startOfToday && date < endOfToday;
  });
  
  const weeklyTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startOfWeek;
  });
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startOfMonth;
  });
  
  // We only need the 'collection' part from this function
  const calculateCollection = (transactionList) => {
    const totalAmount = transactionList.reduce((sum, t) => sum + (t.sub_total || 0), 0);
    return totalAmount.toFixed(2);
  };
  
  const todayCollection = calculateCollection(todayTransactions);
  const weeklyCollection = calculateCollection(weeklyTransactions);
  const monthlyCollection = calculateCollection(monthlyTransactions);
  // --- End of client-side calculation ---


  // 6. Handle combined loading states from BOTH slices
  if (statsLoading || reportLoading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  // 7. Handle potential errors
  if (orderError) {
    return (
       <div className="p-3">
         <CCard>
          <CCardBody>
            <CCardTitle>Error</CCardTitle>
            <p className="text-danger">Failed to load statistics: {orderError}</p>
          </CCardBody>
         </CCard>
       </div>
    );
  }

  // 8. Calculate "Completed" stats from orderSlice (backend data)
  const todayCompleted = (statistics.daily || 0) - (statistics.rejected.daily || 0);
  const weeklyCompleted = (statistics.weekly || 0) - (statistics.rejected.weekly || 0);
  const monthlyCompleted = (statistics.monthly || 0) - (statistics.rejected.monthly || 0);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3">
      {/* 9. Render the hybrid data */}
      <CCard>
        <CCardBody>
          <CCardTitle>Today's Stats</CCardTitle>
          {/* Data from reportSlice */}
          <p>Collection: ₹{todayCollection || '0.00'}</p>
          {/* Data from orderSlice */}
          <p>Invoices: {statistics.daily || 0}</p>
          <p>Completed: {todayCompleted < 0 ? 0 : todayCompleted}</p>
          <p>Rejected: {statistics.rejected.daily || 0}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Weekly Stats</CCardTitle>
          {/* Data from reportSlice */}
          <p>Collection: ₹{weeklyCollection || '0.00'}</p>
          {/* Data from orderSlice */}
          <p>Invoices: {statistics.weekly || 0}</p>
          <p>Completed: {weeklyCompleted < 0 ? 0 : weeklyCompleted}</p>
          <p>Rejected: {statistics.rejected.weekly || 0}</p>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardBody>
          <CCardTitle>Monthly Stats</CCardTitle>
          {/* Data from reportSlice */}
          <p>Collection: ₹{monthlyCollection || '0.00'}</p>
          {/* Data from orderSlice */}
          <p>Invoices: {statistics.monthly || 0}</p>
          <p>Completed: {monthlyCompleted < 0 ? 0 : monthlyCompleted}</p>
          <p>Rejected: {statistics.rejected.monthly || 0}</p>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default DashboardStatisticsReport;
// // components/DashboardStats.jsx

// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { CCard, CCardBody, CCardTitle, CSpinner } from '@coreui/react';
// import { fetchAllTransactions } from '../../redux/slices/reportSlice';



// const  DashboardStatisticsReport = () => {
//   const dispatch = useDispatch();
//   const { allTransactions, loading } = useSelector((state) => state.reports);
//   const {restaurantId} = useSelector((state) => state.auth)
 

//   useEffect(() => {
//     if (restaurantId) {
//       dispatch(fetchAllTransactions({restaurantId}));
//     }
//   }, [restaurantId, dispatch]);

//   // Process transactions to calculate statistics
//   const transactions = Array.isArray(allTransactions) ? allTransactions : []
  
//   const today = new Date()
//   const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
//   const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  
//   const startOfWeek = new Date(today)
//   startOfWeek.setDate(today.getDate() - today.getDay())
//   startOfWeek.setHours(0, 0, 0, 0)
  
//   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
//   const todayTransactions = transactions.filter(t => {
//     const date = new Date(t.createdAt)
//     return date >= startOfToday && date < endOfToday
//   })
  
//   const weeklyTransactions = transactions.filter(t => {
//     const date = new Date(t.createdAt)
//     return date >= startOfWeek
//   })
  
//   const monthlyTransactions = transactions.filter(t => {
//     const date = new Date(t.createdAt)
//     return date >= startOfMonth
//   })
  
//   const calculateStats = (transactionList) => {
//     const totalAmount = transactionList.reduce((sum, t) => sum + (t.sub_total || 0), 0)
//     const completedOrders = transactionList.filter(t => t.status === 'completed').length
//     const rejectedOrders = transactionList.filter(t => t.status === 'rejected').length
//     const totalInvoices = transactionList.length
    
//     return {
//       collection: totalAmount.toFixed(2),
//       invoices: totalInvoices,
//       completed: completedOrders,
//       rejected: rejectedOrders 
//     }
//   }
  
//   const todayStats = calculateStats(todayTransactions)
//   const weeklyStats = calculateStats(weeklyTransactions)
//   const monthlyStats = calculateStats(monthlyTransactions)

//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center">
//         <CSpinner color="primary" variant="grow" />
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3">
//       <CCard>
//         <CCardBody>
//           <CCardTitle>Today's Stats</CCardTitle>
//           <p>Collection: ₹{todayStats.collection}</p>
//           <p>Invoices: {todayStats.invoices}</p>
//           <p>Completed: {todayStats.completed}</p>
//           <p>Rejected: {todayStats.rejected}</p>
//         </CCardBody>
//       </CCard>

//       <CCard>
//         <CCardBody>
//           <CCardTitle>Weekly Stats</CCardTitle>
//           <p>Collection: ₹{weeklyStats.collection}</p>
//           <p>Invoices: {weeklyStats.invoices}</p>
//           <p>Completed: {weeklyStats.completed}</p>
//           <p>Rejected: {weeklyStats.rejected}</p>
//         </CCardBody>
//       </CCard>

//       <CCard>
//         <CCardBody>
//           <CCardTitle>Monthly Stats</CCardTitle>
//           <p>Collection: ₹{monthlyStats.collection}</p>
//           <p>Invoices: {monthlyStats.invoices}</p>
//           <p>Completed: {monthlyStats.completed}</p>
//           <p>Rejected: {monthlyStats.rejected}</p>
//         </CCardBody>
//       </CCard>
//     </div>
//   );
// };

// export default DashboardStatisticsReport;

