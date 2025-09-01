import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { CSpinner, CButton } from '@coreui/react';

const WooOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const username = 'ck_467b4ffd26f38b7b133fa2a122854c99d6e11f5a';
      const password = 'cs_a5e4e843b919e4a70a6f5cc8d2e5141c145ea1ea';
      const token = btoa(`${username}:${password}`);

      try {
        const response = await axios.get('https://horilal.letsdq.com/wp-json/wc/v3/orders', {
          headers: {
            'Authorization': `Basic ${token}`
          }
        });
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const columns = [
    { 
      field: 'id', 
      headerName: 'Order ID', 
      width: 100,
      headerClassName: 'header-style'
    },
    { 
      field: 'date_created', 
      headerName: 'Date', 
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleString()
    },
    { 
      field: 'billing', 
      headerName: 'Customer', 
      width: 200,
      valueGetter: (params) => `${params.row.billing.first_name} ${params.row.billing.last_name}`,
    },
    { 
      field: 'billing.address', 
      headerName: 'Address', 
      width: 250,
      valueGetter: (params) => 
        `${params.row.billing.address_1}, ${params.row.billing.city}, ${params.row.billing.state}, ${params.row.billing.postcode}`
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <span style={{ 
          color: params.value === 'completed' ? 'green' : 
                params.value === 'processing' ? 'blue' : 'orange',
          fontWeight: 'bold'
        }}>
          {params.value}
        </span>
      )
    },
    { 
      field: 'total', 
      headerName: 'Total', 
      width: 100,
      valueGetter: (params) => `₹${params.row.total}`
    },
  ];

  const closeSidebar = () => {
    setSelectedOrder(null);
  };

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">WooCommerce Orders</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataGrid
            style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
            rows={orders || []}
            getRowId={(row) => row.id}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            sx={{
              '& .header-style': {
                fontWeight: 'bold',
                fontSize: '1.1rem',
              },
              '@media (max-width: 600px)': {
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8rem',
                },
              },
            }}
          />
        </div>
      )}

      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            height: '100vh',
            width: '30%',
            backgroundColor: '#f9f9f9',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            borderLeft: '1px solid #ccc',
            overflowY: 'auto',
            padding: '20px',
            ...(window.innerWidth <= 500 && { width: '70%' }),
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #ddd',
              paddingBottom: '10px',
              marginBottom: '20px',
            }}
          >
            <h5 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              Order Details: #{selectedOrder.id}
            </h5>
            <button
              onClick={closeSidebar}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>
          <div>
            <p>
              <strong>Order Number:</strong> {selectedOrder.number}
            </p>
            <p>
              <strong>Customer Name:</strong> {selectedOrder.billing.first_name} {selectedOrder.billing.last_name}
            </p>
            <p>
              <strong>Customer Email:</strong> {selectedOrder.billing.email || 'N/A'}
            </p>
            <p>
              <strong>Customer Phone:</strong> {selectedOrder.billing.phone || 'N/A'}
            </p>
            <p>
              <strong>Customer Address:</strong> {selectedOrder.billing.address_1}, {selectedOrder.billing.city}, {selectedOrder.billing.state}, {selectedOrder.billing.postcode}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder.status}
            </p>
            <p>
              <strong>Total:</strong> ₹{selectedOrder.total || 0}
            </p>
            <p>
              <strong>Payment Method:</strong> {selectedOrder.payment_method_title || selectedOrder.payment_method}
            </p>
            <p>
              <strong>Items:</strong>
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              {selectedOrder.line_items?.map((item, index) => (
                <li key={index}>
                  {item.name} (x{item.quantity}) - ₹{item.price}
                  {item.image?.src && (
                    <div style={{ marginTop: '5px' }}>
                      <img src={item.image.src} alt={item.name} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WooOrders;

