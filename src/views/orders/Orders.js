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
import KOT from '../../components/KOT'
import Invoice from '../../components/Invoice'
import KOTModal from '../../components/KOTModal'
import InvoiceModal from '../../components/InvoiceModal'
import { toast } from 'react-toastify'
const Order = () => {
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const [showKOT, setShowKOT] = useState(false)
  const [showBill, setShowBill] = useState(false)
  const [showKOTModal, setShowKOTModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [kotImage, setKOTImage] = useState(null)
  const [invoiceImage, setInvoiceImage] = useState(null)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const isMobile = useMediaQuery('(max-width:600px)')
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)
  const token = localStorage.getItem("authToken")
  
  // Refs for KOT and Invoice components
  const kotRef = useRef(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    if (token) {
      dispatch(fetchOrders({ token }))
    }
  }, [dispatch, token])

  useEffect(() => {
    if (restaurantId) {
      dispatch(getRestaurantProfile({ restaurantId }))
    }
  }, [])
  const handleStatusChange = async (_id, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      console.log('Updating order status:', _id, newStatus);
      console.log('Selected order object:', selectedOrder);
      
      // Use the correct ID field - try both _id and order_id
      const orderId = selectedOrder._id || selectedOrder.order_id || _id;
      console.log('Using order ID:', orderId);
      
      const result = await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
      
      if (result.type === 'orders/updateOrderStatus/fulfilled') {
        console.log('Status updated successfully');
        // Refresh the orders list
        dispatch(fetchOrders({ token }));
        closeSidebar();
      } else {
        console.error('Failed to update status:', result.payload);
        // alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // alert('Error updating order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // const generateKOT = (order) => {
  //   setSelectedOrder(order)
    
  //   const cartItems = order.order_details?.map(item => ({
  //     id: item._id || item.id,
  //     itemName: item.item_name,
  //     price: item.price,
  //     quantity: item.quantity,
  //     notes: item.notes || ''
  //   })) || []

  //   const kotElement = kotRef.current
  //   if (!kotElement) {
  //     toast.error('KOT component not found', { autoClose: 3000 })
  //     return
  //   }

  //   kotElement.style.display = 'block'

  //   html2canvas(kotElement, { scale: 2 })
  //     .then((canvas) => {
  //       const imgData = canvas.toDataURL('image/png')
  //       setKOTImage(imgData)
  //       setShowKOTModal(true)
  //     })
  //     .catch((error) => {
  //       toast.error(`Error generating KOT preview: ${error}`, { autoClose: 3000 })
  //     })
  //     .finally(() => {
  //       kotElement.style.display = 'none'
  //     })
  // }
  

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
    
    const invoiceElement = invoiceRef.current
    if (!invoiceElement) {
      toast.error('Invoice component not found', { autoClose: 3000 })
      return
    }

    invoiceElement.style.display = 'block'

    html2canvas(invoiceElement, { scale: 2, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png')
        setInvoiceImage(imgData)
        setShowInvoiceModal(true)
      })
      .catch((error) => {
        toast.error(`Error generating invoice: ${error}`, { autoClose: 3000 })
      })
      .finally(() => {
        invoiceElement.style.display = 'none'
      })
  }

  const handleKOTPrint = () => {
    const printWindow = window.open()
    if (printWindow) {
      printWindow.document.write(`
     <html>
      <head>
        <title>KOT Print</title>
        <style>
          @page {
            size: 2in auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            text-align: center;
          }
          img {
            width: 2in;
          }
        </style>
      </head>
      <body>
        <img src="${kotImage}" style="width: 2in;" />
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
    </html>
    `)
      printWindow.document.close()
    }
  }

  const handleInvoicePrint = () => {
    const printWindow = window.open()
    if (printWindow) {
      printWindow.document.write(`
     <html>
      <head>
        <title>Invoice Print</title>
        <style>
          @page {
            size: 2in auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            text-align: center;
          }
          img {
            width: 2in;
          }
        </style>
      </head>
      <body>
        <img src="${invoiceImage}" style="width: 2in;" />
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
    </html>
    `)
      printWindow.document.close()
    }
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
    {
      field: 'orderId',
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
        params.row.items?.length
          ? params.row.items.map((item) => `${item.itemName} (x${item.quantity})`).join(', ')
          : 'N/A',
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.customerName || 'N/A',
    },
    {
      field: 'tableNumber',
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
      valueGetter: (params) => format(new Date(params.row.createdAt), 'dd/MM/yyyy HH:mm'),
    },
    {
      field: 'subtotal',
      headerName: 'Total',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => `₹${params.row.
        subtotal || 0}`,
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

      {/* KOT Modal */}
      <KOTModal isVisible={showKOTModal} onClose={() => setShowKOTModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3>KOT Preview</h3>
          {kotImage && (
            <img
              src={kotImage}
              alt="KOT Preview"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          )}
          <button
            onClick={handleKOTPrint}
            style={{
              margin: '0 10px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Print
          </button>
        </div>
      </KOTModal>

      {/* Invoice Modal */}
      <InvoiceModal isVisible={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3>Invoice Preview</h3>
          {invoiceImage && (
            <img
              src={invoiceImage}
              alt="Invoice Preview"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          )}
          <button
            onClick={handleInvoicePrint}
            style={{
              margin: '0 10px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Print
          </button>
        </div>
      </InvoiceModal>

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
              <strong>Order Number:</strong> {selectedOrder.orderId}
            </p>
            <p>
              <strong>Customer Name:</strong> {selectedOrder.customerName|| 'N/A'}
            </p>
            <p>
              <strong>Customer Address:</strong> {selectedOrder.user?.address || 'N/A'}
            </p>
            <p>
              <strong>Table Number:</strong> {selectedOrder.tableNumber}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder.status}
            </p>
            <p>
              <strong>Total:</strong> ₹{selectedOrder.subtotal || 0}
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
              onClick={() => handleStatusChange(selectedOrder._id || selectedOrder.order_id, 'complete')}
              style={{ flex: '0 0 48%' }}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <CSpinner size="sm" /> : 'Mark as Complete'}
            </CButton>
            <CButton
              color="danger"
              onClick={() => handleStatusChange(selectedOrder._id || selectedOrder.order_id, 'reject')}
              style={{ flex: '0 0 48%' }}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <CSpinner size="sm" /> : 'Reject Order'}
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

      {/* Hidden KOT and Invoice components for generation */}
      {selectedOrder && (
        <>
          <div style={{ display: 'none' }}>
            <KOT
              ref={kotRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number}
              cart={selectedOrder.order_details?.map(item => ({
                id: item._id || item.id,
                itemName: item.item_name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || []}
            />
          </div>
          
          <div style={{ display: 'none' }}>
            <Invoice
              ref={invoiceRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number}
              selectedCustomerName={selectedOrder.customerName || selectedOrder.user?.name || 'Walk-in Customer'}
              cart={selectedOrder.order_details?.map(item => ({
                id: item._id || item.id,
                itemName: item.item_name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || []}
              calculateSubtotal={() => selectedOrder.subtotal || 0}
              tax={selectedOrder.taxPercentage || 0}
              calculateTaxAmount={() => selectedOrder.taxAmount || 0}
              discount={selectedOrder.discountPercentage || 0}
              calculateDiscountAmount={() => selectedOrder.discountAmount || 0}
              calculateTotal={() => selectedOrder.totalAmount || selectedOrder.subtotal || 0}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Order
