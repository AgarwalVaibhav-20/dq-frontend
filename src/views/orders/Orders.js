import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchOrders, updateOrderStatus } from '../../redux/slices/orderSlice'
import { CButton, CSpinner } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { format } from 'date-fns'
import { useMediaQuery } from '@mui/material'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'
import { CModal, CModalHeader, CModalBody } from '@coreui/react'
const Order = () => {
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const [showKOT, setShowKOT] = useState(false)
  const [showBill, setShowBill] = useState(false)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const isMobile = useMediaQuery('(max-width:600px)')
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)


  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchOrders({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  useEffect(() => {
    if (restaurantId) {
      dispatch(getRestaurantProfile({ restaurantId }))
    }
  }, [])
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus }))
      closeSidebar()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const generateKOT = (order) => {
    setSelectedOrder(order)
    setShowKOT(true)
  }

  const generateInvoicePDF = (transactionDetails) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160],
    })

    const pageWidth = 80
    let y = 8
    const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
      // doc.setFont('helvetica', fontStyle)
      doc.setFont('Courier', fontStyle)
      doc.setFontSize(fontSize)
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    }

    const line = () => {
      doc.setLineWidth(0.1)
      doc.line(5, y, pageWidth - 5, y)
      y += 4
    }

    centerText(restaurantProfile?.restName || 'Restaurant Name', y, 15)
    y += 5
    centerText(restaurantProfile.address || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile.pinCode || 'XXXXXX'} `, y, 8)
    y += 4
    centerText(`Ph: ${restaurantProfile.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    centerText('INVOICE', y, 10, 'bold')
    y += 6

    centerText(`Date: ${new Date(transactionDetails.created_at).toLocaleString()}`, y, 8)
    y += 4
    centerText(`Table: ${transactionDetails?.table_number || 'N/A'}`, y, 8)
    y += 4
    centerText(`Customer: ${transactionDetails?.user.name || 'Walk-in'}`, y, 8)
    y += 5
    line()

    centerText('Items', y, 9, 'bold')
    y += 5

    transactionDetails.order_details?.forEach((item) => {
      const lineItem1 = `${item.item_name} x${item.quantity}`
      centerText(lineItem1, y, 8)
      y += 4
      const lineItem2 = ` Rs. ${(item.price * item.quantity).toFixed(2)}`
      centerText(lineItem2, y, 8)
      y += 4
    })

    y += 1
    line()

    centerText(`Total: Rs ${transactionDetails.total.toFixed(2)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(`Invoice.pdf`)
    }
  }

  const handlePrint = () => {
    if (pdfDoc) {
      const printWindow = window.open('', '_blank')
      const pdfString = pdfDoc.output('datauristring')
      printWindow.document.write(`<iframe width='100%' height='100%' src='${pdfString}'></iframe>`)
      printWindow.document.close()
    }
  }

  const generateBill = (order) => {
    setSelectedOrder(order)
    // console.log('selectedOrder', selectedOrder)
    const doc = generateInvoicePDF(selectedOrder)
    setPdfDoc(doc)
    setInvoiceContent(selectedOrder)
    setShowBill(true)
  }

  const handleKOTPrint = async () => {
    const input = document.getElementById('kot-section')
    if (!input) return

    const canvas = await html2canvas(input)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.autoPrint()
    window.open(pdf.output('bloburl'), '_blank')
  }
  // const handleInvoicePrint = async () => {
  //   const input = document.getElementById('invoice-section')
  //   if (!input) return

  //   const canvas = await html2canvas(input)
  //   const imgData = canvas.toDataURL('image/png')
  //   const pdf = new jsPDF('p', 'mm', 'a4')
  //   const imgProps = pdf.getImageProperties(imgData)
  //   const pdfWidth = pdf.internal.pageSize.getWidth()
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

  //   pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  //   pdf.autoPrint()
  //   window.open(pdf.output('bloburl'), '_blank')
  // }

  const closeSidebar = () => setSelectedOrder(null)

  // Style based on status
  const getStatusStyle = (status) => ({
    padding: '2px 10px',
    borderRadius: '15px',
    color: 'white',
    textAlign: 'center',
    backgroundColor:
      status === 'complete' ? '#4CAF50' : status === 'reject' ? '#F44336' : '#FFC107',
  })

  const columns = [
    // { field: 'sno', headerName: 'S.No.', flex: isMobile ? undefined : 0.5, minWidth: isMobile ? 80 : undefined, headerClassName: 'header-style' },
    {
      field: 'order_id',
      headerName: 'Order Number',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'items',
      headerName: 'Items',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) =>
        params.row.order_details
          ?.map((item) => `${item.item_name} (x${item.quantity})`)
          .join(', ') || 'N/A',
    },
    {
      field: 'userName',
      headerName: 'Customer Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.user?.name || 'N/A',
    },
    {
      field: 'table_number',
      headerName: 'Table Number',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : undefined,
      headerClassName: 'header-style',
      renderCell: (params) => (
        <div style={getStatusStyle(params.value)}>
          {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        </div>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Date',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => format(new Date(params.row.created_at), 'dd/MM/yyyy HH:mm'),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => `₹${params.row.total || 0}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <CButton
          color="primary"
          size={isMobile ? 'sm' : 'md'} // Adjust button size for mobile
          style={isMobile ? { padding: '5px 10px', fontSize: '0.8rem', marginRight: '1rem' } : {}}
          onClick={() => setSelectedOrder(params.row)}
        >
          View Details
        </CButton>
      ),
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Orders</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataGrid
            style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
            rows={orders
              ?.slice()
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((order, index) => ({
                ...order,
                sno: index + 1,
              }))}
            getRowId={(row) => row.id || row.data?.id || Math.random()}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{ Toolbar: CustomToolbar }}
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

      {showKOT && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={() => setShowKOT(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '300px',
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
            }}
          >
            <div id="kot-section">
              <h5 style={{ textAlign: 'center' }}>Kitchen Order Ticket</h5>
              <p>
                <strong>Order ID:</strong> {selectedOrder.order_id}
              </p>
              <p>
                <strong>Table:</strong> {selectedOrder.table_number}
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.user?.name || 'N/A'}
              </p>
              <hr />
              <ul>
                {selectedOrder.order_details?.map((item, index) => (
                  <li key={index}>
                    {item.item_name} x {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                textAlign: 'center',
                marginTop: '20px',
                marginLeft: '20px',
              }}
            >
              <CButton color="primary" onClick={handleKOTPrint}>
                Print KOT
              </CButton>
              <CButton color="secondary" className="ml-2" onClick={() => setShowKOT(false)}>
                Close
              </CButton>
            </div>
          </div>
        </div>
      )}

      {invoiceContent && (
        <CModal visible={showBill} onClose={() => setShowBill(false)}>
          <CModalHeader>Invoice Preview</CModalHeader>
          <CModalBody>
            <iframe
              src={pdfDoc?.output('datauristring')}
              style={{ width: '100%', height: '400px', border: 'none' }}
              title="Invoice Preview"
            ></iframe>
            <div className="mt-3 d-flex justify-content-between">
              <CButton color="primary" onClick={handleDownload}>
                Download
              </CButton>
              <CButton color="secondary" onClick={handlePrint}>
                Print
              </CButton>
            </div>
          </CModalBody>
        </CModal>
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
          {/* Sidebar content */}
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
              Order Details: #{selectedOrder.order_id}
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
              <strong>Order Number:</strong> {selectedOrder.order_id}
            </p>
            <p>
              <strong>Customer Name:</strong> {selectedOrder.user?.name || 'N/A'}
            </p>
            <p>
              <strong>Customer Address:</strong> {selectedOrder.user?.address || 'N/A'}
            </p>
            <p>
              <strong>Table Number:</strong> {selectedOrder.table_number}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder.status}
            </p>
            <p>
              <strong>Total:</strong> ₹{selectedOrder.total || 0}
            </p>
            <p>
              <strong>Items:</strong>
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              {selectedOrder.order_details?.map((item, index) => (
                <li key={index}>
                  {item.item_name} (x{item.quantity})
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '20px',
            }}
          >
            <CButton
              color="success"
              onClick={() => handleStatusChange(selectedOrder.order_id, 'complete')}
              style={{ flex: '0 0 48%' }}
            >
              Mark as Complete
            </CButton>
            <CButton
              color="danger"
              onClick={() => handleStatusChange(selectedOrder.order_id, 'reject')}
              style={{ flex: '0 0 48%' }}
            >
              Reject Order
            </CButton>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '20px',
            }}
          >
            <CButton
              color="primary"
              onClick={() => generateKOT(selectedOrder)}
              style={{ flex: '0 0 48%' }}
            >
              Generate KOT
            </CButton>
            <CButton
              color="secondary"
              onClick={() => generateBill(selectedOrder)}
              style={{ flex: '0 0 48%' }}
            >
              Generate Bill
            </CButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order



// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { DataGrid } from '@mui/x-data-grid';
// import { fetchOrders, updateOrderStatus } from '../../redux/slices/orderSlice';
// import { CButton, CSpinner } from '@coreui/react';
// import CustomToolbar from '../../utils/CustomToolbar';
// import { format } from 'date-fns';
// import { useMediaQuery } from '@mui/material';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice';
// import { CModal, CModalHeader, CModalBody } from '@coreui/react';
// import notificationSound from '../../assets/notification.mp3';


// const Order = () => {
//   const [invoiceContent, setInvoiceContent] = useState(null);
//   const [pdfDoc, setPdfDoc] = useState(null);
//   const dispatch = useDispatch();
//   const { orders, loading } = useSelector((state) => state.orders);
//   const restaurantId = useSelector((state) => state.auth.restaurantId);
//   const [showKOT, setShowKOT] = useState(false);
//   const [showBill, setShowBill] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const isMobile = useMediaQuery('(max-width:600px)');
//   const { restaurantProfile } = useSelector((state) => state.restaurantProfile);
//   const audioRef = useRef(null);
//   const [previousOrderCount, setPreviousOrderCount] = useState(0);
//   // New state to track if it's the initial load
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // Memoize the audio element to prevent re-renders
//   const audioPlayer = useMemo(() => {
//     return <audio ref={audioRef} src={notificationSound} preload="auto" />;
//   }, []);

//   // const playNotificationSound = () => {
//   //   if (audioRef.current) {
//   //     audioRef.current.play().catch((e) => {
//   //       console.log('Play prevented:', e);
//   //     });
//   //   }
//   // };

//   // useEffect(() => {
//   //   if (restaurantId) {
//   //     // Initial fetch
//   //     dispatch(fetchOrders({ restaurantId }));

//   //     // Set up interval for fetching orders every 10 seconds
//   //     const intervalId = setInterval(() => {
//   //       dispatch(fetchOrders({ restaurantId }));
//   //     }, 10000); // 10 seconds

//   //     // Clean up interval on component unmount
//   //     return () => clearInterval(intervalId);
//   //   }
//   // }, [dispatch, restaurantId]);

//   // Effect to play sound when a new order arrives, preventing on initial load
//   // useEffect(() => {
//   //   if (!loading && orders.length > 0) { // Ensure orders are loaded and not empty
//   //     if (isInitialLoad) {
//   //       // If it's the initial load, just update previousOrderCount and set flag to false
//   //       setPreviousOrderCount(orders.length);
//   //       setIsInitialLoad(false);
//   //     } else if (orders.length > previousOrderCount) {
//   //       // Play sound only if new orders have arrived AFTER the initial load
//   //       playNotificationSound();
//   //       setPreviousOrderCount(orders.length); // Update for subsequent checks
//   //     } else if (orders.length < previousOrderCount) {
//   //       // This handles cases where orders might be removed (e.g., marked complete)
//   //       // We still need to update previousOrderCount to reflect the current state
//   //       setPreviousOrderCount(orders.length);
//   //     }
//   //   }
//   // }, [orders, loading, previousOrderCount, isInitialLoad]);


//   useEffect(() => {
//     if (restaurantId) {
//       dispatch(getRestaurantProfile({ restaurantId }));
//     }
//   }, [dispatch, restaurantId]);

//   const handleStatusChange = async (orderId, newStatus) => {
//     try {
//       await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
//       closeSidebar();
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };


//   const generateKOT = (order) => {
//     setSelectedOrder(order);
//     setShowKOT(true);
//   };

//   const generateInvoicePDF = (transactionDetails) => {
//     const doc = new jsPDF({
//       unit: 'mm',
//       format: [80, 160],
//     });

//     const pageWidth = 80;
//     let y = 8;
//     const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
//       doc.setFont('Courier', fontStyle);
//       doc.setFontSize(fontSize);
//       doc.text(text, pageWidth / 2, yPos, { align: 'center' });
//     };

//     const line = () => {
//       doc.setLineWidth(0.1);
//       doc.line(5, y, pageWidth - 5, y);
//       y += 4;
//     };

//     centerText(restaurantProfile?.restName || 'Restaurant Name', y, 15);
//     y += 5;
//     centerText(restaurantProfile.address || 'Address Line', y, 8);
//     y += 4;
//     centerText(`PinCode: ${restaurantProfile.pinCode || 'XXXXXX'} `, y, 8);
//     y += 4;
//     centerText(`Ph: ${restaurantProfile.phoneNumber || 'N/A'}`, y, 8);
//     y += 5;
//     line();

//     centerText('INVOICE', y, 10, 'bold');
//     y += 6;

//     centerText(`Date: ${new Date(transactionDetails.created_at).toLocaleString()}`, y, 8);
//     y += 4;
//     centerText(`Table: ${transactionDetails?.table_number || 'N/A'}`, y, 8);
//     y += 4;
//     centerText(`Customer: ${transactionDetails?.user.name || 'Walk-in'}`, y, 8);
//     y += 5;
//     line();

//     centerText('Items', y, 9, 'bold');
//     y += 5;

//     transactionDetails.order_details?.forEach((item) => {
//       const lineItem1 = `${item.item_name} x${item.quantity}`;
//       centerText(lineItem1, y, 8);
//       y += 4;
//       const lineItem2 = ` Rs. ${(item.price * item.quantity).toFixed(2)}`;
//       centerText(lineItem2, y, 8);
//       y += 4;
//     });

//     y += 1;
//     line();

//     centerText(`Total: Rs ${transactionDetails.total.toFixed(2)}`, y, 10, 'bold');
//     y += 6;

//     line();
//     y += 10;
//     centerText('--- Thank you for your visit ---', y, 10);

//     return doc;
//   };

//   const handleDownload = () => {
//     if (pdfDoc) {
//       pdfDoc.save(`Invoice.pdf`);
//     }
//   };

//   const handlePrint = () => {
//     if (pdfDoc) {
//       const printWindow = window.open('', '_blank');
//       const pdfString = pdfDoc.output('datauristring');
//       printWindow.document.write(`<iframe width='100%' height='100%' src='${pdfString}'></iframe>`);
//       printWindow.document.close();
//     }
//   };

//   const generateBill = (order) => {
//     setSelectedOrder(order);
//     const doc = generateInvoicePDF(order);
//     setPdfDoc(doc);
//     setInvoiceContent(order);
//     setShowBill(true);
//   };

//   const handleKOTPrint = async () => {
//     const input = document.getElementById('kot-section');
//     if (!input) return;

//     const canvas = await html2canvas(input);
//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('p', 'mm', 'a4');
//     const imgProps = pdf.getImageProperties(imgData);
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

//     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
//     pdf.autoPrint();
//     window.open(pdf.output('bloburl'), '_blank');
//   };

//   const closeSidebar = () => setSelectedOrder(null);

//   // Style based on status
//   const getStatusStyle = (status) => ({
//     padding: '2px 10px',
//     borderRadius: '15px',
//     color: 'white',
//     textAlign: 'center',
//     backgroundColor:
//       status === 'complete' ? '#4CAF50' : status === 'reject' ? '#F44336' : '#FFC107',
//   });

//   const columns = [
//     {
//       field: 'order_id',
//       headerName: 'Order Number',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 120 : undefined,
//       headerClassName: 'header-style',
//     },
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
//       field: 'table_number',
//       headerName: 'Table Number',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 120 : undefined,
//       headerClassName: 'header-style',
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
//       valueGetter: (params) => format(new Date(params.row.created_at), 'dd/MM/yyyy HH:mm'),
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
//           size={isMobile ? 'sm' : 'md'}
//           style={isMobile ? { padding: '5px 10px', fontSize: '0.8rem', marginRight: '1rem' } : {}}
//           onClick={() => setSelectedOrder(params.row)}
//         >
//           View Details
//         </CButton>
//       ),
//     },
//   ];

//   return (
//     <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
//       {/* {audioPlayer} */}

//       <h2 className="mb-4">Orders</h2>
//       {loading ? (
//         <div className="d-flex justify-content-center">
//           <CSpinner color="primary" variant="grow" />
//         </div>
//       ) : (
//         <div style={{ overflowX: 'auto' }}>
//           <DataGrid
//             style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
//             rows={orders
//               ?.slice()
//               .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//               .map((order, index) => ({
//                 ...order,
//                 sno: index + 1,
//               }))}
//             getRowId={(row) => row.id || row.data?.id || Math.random()}
//             columns={columns}
//             pageSize={10}
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

//       {showKOT && selectedOrder && (
//         <div
//           style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%',
//             backgroundColor: 'rgba(0,0,0,0.5)',
//             zIndex: 2000,
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//           onClick={() => setShowKOT(false)}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: '300px',
//               background: 'white',
//               padding: '20px',
//               borderRadius: '10px',
//             }}
//           >
//             <div id="kot-section">
//               <h5 style={{ textAlign: 'center' }}>Kitchen Order Ticket</h5>
//               <p>
//                 <strong>Order ID:</strong> {selectedOrder.order_id}
//               </p>
//               <p>
//                 <strong>Table:</strong> {selectedOrder.table_number}
//               </p>
//               <p>
//                 <strong>Date:</strong>{' '}
//                 {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}
//               </p>
//               <p>
//                 <strong>Customer:</strong> {selectedOrder.user?.name || 'N/A'}
//               </p>
//               <hr />
//               <ul>
//                 {selectedOrder.order_details?.map((item, index) => (
//                   <li key={index}>
//                     {item.item_name} x {item.quantity}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//             <div
//               style={{
//                 display: 'flex',
//                 gap: '10px',
//                 textAlign: 'center',
//                 marginTop: '20px',
//                 marginLeft: '20px',
//               }}
//             >
//               <CButton color="primary" onClick={handleKOTPrint}>
//                 Print KOT
//               </CButton>
//               <CButton color="secondary" className="ml-2" onClick={() => setShowKOT(false)}>
//                 Close
//               </CButton>
//             </div>
//           </div>
//         </div>
//       )}

//       {invoiceContent && (
//         <CModal visible={showBill} onClose={() => setShowBill(false)}>
//           <CModalHeader>Invoice Preview</CModalHeader>
//           <CModalBody>
//             <iframe
//               src={pdfDoc?.output('datauristring')}
//               style={{ width: '100%', height: '400px', border: 'none' }}
//               title="Invoice Preview"
//             ></iframe>
//             <div className="mt-3 d-flex justify-content-between">
//               <CButton color="primary" onClick={handleDownload}>
//                 Download
//               </CButton>
//               <CButton color="secondary" onClick={handlePrint}>
//                 Print
//               </CButton>
//             </div>
//           </CModalBody>
//         </CModal>
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
//               <strong>Table Number:</strong> {selectedOrder.table_number}
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
//                   {item.item_name} (x{item.quantity})
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
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               marginTop: '20px',
//             }}
//           >
//             <CButton
//               color="primary"
//               onClick={() => generateKOT(selectedOrder)}
//               style={{ flex: '0 0 48%' }}
//             >
//               Generate KOT
//             </CButton>
//             <CButton
//               color="secondary"
//               onClick={() => generateBill(selectedOrder)}
//               style={{ flex: '0 0 48%' }}
//             >
//               Generate Bill
//             </CButton>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Order;