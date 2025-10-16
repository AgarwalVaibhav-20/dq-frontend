import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { updateOrderStatus, fetchDeliveryOrders } from '../../redux/slices/orderSlice';
import { CButton, CSpinner } from '@coreui/react';
import CustomToolbar from '../../utils/CustomToolbar';
import { format } from 'date-fns';
import { useMediaQuery, Drawer, Typography, Divider, Box } from '@mui/material';

const Delivery = () => {
  const dispatch = useDispatch();
  const { deliveryOrders, deliveryOrdersLoading, deliveryPagination } = useSelector((state) => state.orders);
  const restaurantId = useSelector((state) => state.auth.restaurantId);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchDeliveryOrders({ restaurantId, pageNo: page }));
    }
  }, [dispatch, restaurantId, page]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
      closeSidebar();
      dispatch(fetchDeliveryOrders({ restaurantId, pageNo: page }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const closeSidebar = () => setSelectedOrder(null);
  const handlePageChange = (newPage) => setPage(newPage + 1);

  const getStatusStyle = (status) => ({
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    textAlign: 'center',
    backgroundColor:
      status === 'complete'
        ? '#4CAF50'
        : status === 'reject'
        ? '#F44336'
        : '#FFC107',
  });

  const columns = [
    { field: 'order_id', headerName: 'Order #', flex: 1, minWidth: 100 },
    {
      field: 'items',
      headerName: 'Items',
      flex: 2,
      minWidth: 180,
      valueGetter: (params) =>
        params.row.order_details
          ?.map((item) => `${item.item_name} (x${item.quantity})`)
          .join(', ') || 'N/A',
    },
    {
      field: 'userName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => params.row.user?.name || 'N/A',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span style={getStatusStyle(params.value)}>
          {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        </span>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Date',
      flex: 1,
      minWidth: 160,
      valueGetter: (params) =>
        format(new Date(params.row.created_at), 'dd/MM/yyyy HH:mm'),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => `₹${params.row.total || 0}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <CButton
          color="primary"
          size="sm"
          style={{ padding: '6px 14px', fontWeight: 'bold' }}
          onClick={() => setSelectedOrder(params.row)}
        >
          View
        </CButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        🚚 Delivery Orders
      </Typography>

      {deliveryOrdersLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CSpinner color="primary" variant="grow" />
        </Box>
      ) : (
        <DataGrid
          style={{ width: '100%', minHeight: '400px' }}
          autoHeight
          disableRowSelectionOnClick
          rows={deliveryOrders || []}
          getRowId={(row) => row.order_id}
          columns={columns}
          pageSize={deliveryPagination?.per_page || 10}
          rowCount={deliveryPagination?.total || 0}
          paginationMode="server"
          onPageChange={handlePageChange}
          rowsPerPageOptions={[10]}
          slots={{ Toolbar: CustomToolbar }}
          sx={{
            borderRadius: '12px',
            boxShadow: 2,
            backgroundColor: 'white',
            p: 1,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
          }}
        />
      )}

      {/* Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedOrder}
        onClose={closeSidebar}
        PaperProps={{
          sx: {
            width: isMobile ? '80%' : '400px',
            p: 3,
            borderRadius: '12px 0 0 12px',
          },
        }}
      >
        {selectedOrder && (
          <>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Order #{selectedOrder.order_id}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography><strong>Customer:</strong> {selectedOrder.user?.name || 'N/A'}</Typography>
            <Typography><strong>Address:</strong> {selectedOrder.user?.address || 'N/A'}</Typography>
            <Typography><strong>Status:</strong> {selectedOrder.status}</Typography>
            <Typography><strong>Total:</strong> ₹{selectedOrder.total || 0}</Typography>

            <Typography mt={2} fontWeight="bold">Items:</Typography>
            <ul style={{ paddingLeft: '20px' }}>
              {selectedOrder.order_details?.map((item, i) => (
                <li key={i}>
                  {item.item_name} (x{item.quantity}) - ₹{item.price}
                </li>
              ))}
            </ul>

            <Box display="flex" gap={2} mt={3}>
              <CButton
                color="success"
                style={{ flex: 1 }}
                onClick={() => handleStatusChange(selectedOrder.order_id, 'complete')}
              >
                ✅ Complete
              </CButton>
              <CButton
                color="danger"
                style={{ flex: 1 }}
                onClick={() => handleStatusChange(selectedOrder.order_id, 'reject')}
              >
                ❌ Reject
              </CButton>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
};

export default Delivery;// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { DataGrid } from '@mui/x-data-grid';
// import { updateOrderStatus, fetchDeliveryOrders } from '../../redux/slices/orderSlice';
// import { CButton, CSpinner } from '@coreui/react';
// import CustomToolbar from '../../utils/CustomToolbar';
// import { format } from 'date-fns';
// import { useMediaQuery } from '@mui/material';

// const Delivery = () => {
//   const dispatch = useDispatch();
//   const { deliveryOrders, deliveryOrdersLoading, deliveryPagination } = useSelector((state) => state.orders);
//   const restaurantId = useSelector((state) => state.auth.restaurantId);

//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [page, setPage] = useState(1);
//   const isMobile = useMediaQuery('(max-width:600px)');

//   useEffect(() => {
//     if (restaurantId) {
//       dispatch(fetchDeliveryOrders({ restaurantId, pageNo: page }));
//     }
//   }, [dispatch, restaurantId, page]);

//   const handleStatusChange = async (orderId, newStatus) => {
//     try {
//       await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
//       closeSidebar();
//       // Refresh orders after status change
//       dispatch(fetchDeliveryOrders({ restaurantId, pageNo: page }));
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };

//   const closeSidebar = () => setSelectedOrder(null);

//   const handlePageChange = (newPage) => {
//     setPage(newPage + 1); // MUI DataGrid uses 0-based index, our API uses 1-based
//   };

//   // Style based on status
//   const getStatusStyle = (status) => ({
//     padding: '2px 10px',
//     borderRadius: '15px',
//     color: 'white',
//     textAlign: 'center',
//     backgroundColor:
//       status === 'complete'
//         ? '#4CAF50'
//         : status === 'reject'
//         ? '#F44336'
//         : '#FFC107',
//   });

//   const columns = [
//     { field: 'order_id', headerName: 'Order Number', flex: isMobile ? undefined : 1, minWidth: isMobile ? 120 : undefined, headerClassName: 'header-style' },
//     {
//       field: 'items',
//       headerName: 'Items',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 150 : undefined,
//       headerClassName: 'header-style',
//       valueGetter: (params) =>
//         params.row.order_details
//           ?.map((item) => `${item.item_name} (x${item.quantity})`)
//           .join(', ') || 'N/A',
//     },
//     {
//       field: 'userName',
//       headerName: 'Customer Name',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 150 : undefined,
//       headerClassName: 'header-style',
//       valueGetter: (params) => params.row.user?.name || 'N/A',
//     },
//     {
//       field: 'status',
//       headerName: 'Status',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 120 : undefined,
//       headerClassName: 'header-style',
//       renderCell: (params) => (
//         <div style={getStatusStyle(params.value)}>
//           {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
//         </div>
//       ),
//     },
//     {
//       field: 'created_at',
//       headerName: 'Date',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 150 : undefined,
//       headerClassName: 'header-style',
//       valueGetter: (params) =>
//         format(new Date(params.row.created_at), 'dd/MM/yyyy HH:mm'),
//     },
//     {
//       field: 'total',
//       headerName: 'Total',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 100 : undefined,
//       headerClassName: 'header-style',
//       valueGetter: (params) => `₹${params.row.total || 0}`,
//     },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 100 : undefined,
//       headerClassName: 'header-style',
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <CButton
//           color="primary"
//           size={isMobile ? 'sm' : 'sm'}
//           style={isMobile ? { padding: '5px 10px', fontSize: '0.8rem', marginRight:'1rem' } : {}}
//           onClick={() => setSelectedOrder(params.row)}
//         >
//           View Details
//         </CButton>
//       ),
//     },
//   ];

//   return (
//     <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
//       <h2 className="mb-4">Delivery</h2>
//       {deliveryOrdersLoading ? (
//         <div className="d-flex justify-content-center">
//           <CSpinner color="primary" variant="grow" />
//         </div>
//       ) : (
//         <div style={{ overflowX: 'auto' }}>
//           <DataGrid
//             style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
//             rows={deliveryOrders || []}
//             getRowId={(row) => row.order_id}
//             columns={columns}
//             pageSize={deliveryPagination?.per_page || 10}
//             rowCount={deliveryPagination?.total || 0}
//             paginationMode="server"
//             onPageChange={handlePageChange}
//             rowsPerPageOptions={[10]}
//             slots={{ Toolbar: CustomToolbar }}
//             sx={{
//               '& .header-style': {
//                 fontWeight: 'bold',
//                 fontSize: '1.1rem',
//               },
//               '@media (max-width: 600px)': {
//                 '& .MuiDataGrid-columnHeaderTitle': {
//                   fontSize: '0.9rem',
//                 },
//                 '& .MuiDataGrid-cell': {
//                   fontSize: '0.8rem',
//                 },
//               },
//             }}
//           />
//         </div>
//       )}

//       {selectedOrder && (
//         <div
//           style={{
//             position: 'fixed',
//             top: '0',
//             right: '0',
//             height: '100vh',
//             width: '30%',
//             backgroundColor: '#f9f9f9',
//             boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
//             zIndex: 1050,
//             borderLeft: '1px solid #ccc',
//             overflowY: 'auto',
//             padding: '20px',
//             ...(window.innerWidth <= 500 && { width: '70%' }),
//           }}
//         >
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               borderBottom: '1px solid #ddd',
//               paddingBottom: '10px',
//               marginBottom: '20px',
//             }}
//           >
//             <h5 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
//               Order Details: #{selectedOrder.order_id}
//             </h5>
//             <button
//               onClick={closeSidebar}
//               style={{
//                 background: 'none',
//                 border: 'none',
//                 fontSize: '1.5rem',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//               }}
//             >
//               &times;
//             </button>
//           </div>
//           <div>
//             <p>
//               <strong>Order Number:</strong> {selectedOrder.order_id}
//             </p>
//             <p>
//               <strong>Customer Name:</strong> {selectedOrder.user?.name || 'N/A'}
//             </p>
//             <p>
//               <strong>Customer Address:</strong> {selectedOrder.user?.address || 'N/A'}
//             </p>
//             <p>
//               <strong>Status:</strong> {selectedOrder.status}
//             </p>
//             <p>
//               <strong>Total:</strong> ₹{selectedOrder.total || 0}
//             </p>
//             <p>
//               <strong>Items:</strong>
//             </p>
//             <ul style={{ paddingLeft: '20px' }}>
//               {selectedOrder.order_details?.map((item, index) => (
//                 <li key={index}>
//                   {item.item_name} (x{item.quantity}) - ₹{item.price}
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               marginTop: '20px',
//             }}
//           >
//             <CButton
//               color="success"
//               onClick={() => handleStatusChange(selectedOrder.order_id, 'complete')}
//               style={{ flex: '0 0 48%' }}
//             >
//               Mark as Complete
//             </CButton>
//             <CButton
//               color="danger"
//               onClick={() => handleStatusChange(selectedOrder.order_id, 'reject')}
//               style={{ flex: '0 0 48%' }}
//             >
//               Reject Order
//             </CButton>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Delivery;


