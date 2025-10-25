import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchOrders, updateOrderStatus } from '../../redux/slices/orderSlice'
import { CButton, CSpinner, CCard, CCardBody, CCardHeader, CCol, CRow, CFormSelect, CFormInput, CFormLabel } from '@coreui/react'
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
  // const restaurantId = useSelector((state) => state.auth.restaurantId)
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
  const restaurantId = localStorage.getItem('restaurantId');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Refs for KOT and Invoice components
  const kotRef = useRef(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchOrders({ token , restaurantId }))
    }
  }, [dispatch, token , restaurantId])

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

  const generateKOT = (order) => {
    try {
      setSelectedOrder(order)
      
      // Get cart items from either items or order_details
      const cartItems = order.items?.map(item => ({
        id: item._id || item.id || item.itemId,
        itemName: item.itemName || item.item_name,
        price: item.price || item.subtotal,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || order.order_details?.map(item => ({
        id: item._id || item.id,
        itemName: item.item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || []

      console.log('KOT Order:', order)
      console.log('KOT Cart Items:', cartItems)
      console.log('KOT Order Items:', order.items)
      console.log('KOT Order Details:', order.order_details)

      if (cartItems.length === 0) {
        toast.error('No items found in this order', { autoClose: 3000 })
        return
      }

      const kotElement = kotRef.current
      if (!kotElement) {
        toast.error('KOT component not found', { autoClose: 3000 })
        return
      }

      // Make the element visible temporarily for html2canvas
      kotElement.style.position = 'absolute'
      kotElement.style.left = '0'
      kotElement.style.top = '0'
      kotElement.style.visibility = 'visible'
      kotElement.style.zIndex = '9999'

      // Wait a bit for the component to render
      setTimeout(() => {
        html2canvas(kotElement, { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: kotElement.offsetWidth,
          height: kotElement.offsetHeight
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL('image/png')
            setKOTImage(imgData)
            setShowKOTModal(true)
            toast.success('KOT generated successfully!', { autoClose: 2000 })
          })
          .catch((error) => {
            console.error('KOT generation error:', error)
            toast.error(`Error generating KOT preview: ${error.message}`, { autoClose: 3000 })
          })
          .finally(() => {
            // Hide the element again
            kotElement.style.position = 'absolute'
            kotElement.style.left = '-9999px'
            kotElement.style.top = '-9999px'
            kotElement.style.visibility = 'hidden'
          })
      }, 300)
    } catch (error) {
      console.error('KOT generation error:', error)
      toast.error(`Error generating KOT: ${error.message}`, { autoClose: 3000 })
    }
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
    try {
      setSelectedOrder(order)
      
      // Get cart items from either items or order_details
      const cartItems = order.items?.map(item => ({
        id: item._id || item.id || item.itemId,
        itemName: item.itemName || item.item_name,
        price: item.price || item.subtotal,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || order.order_details?.map(item => ({
        id: item._id || item.id,
        itemName: item.item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || []

      console.log('Invoice Order:', order)
      console.log('Invoice Cart Items:', cartItems)
      console.log('Invoice Order Items:', order.items)
      console.log('Invoice Order Details:', order.order_details)

      if (cartItems.length === 0) {
        toast.error('No items found in this order', { autoClose: 3000 })
        return
      }

      const invoiceElement = invoiceRef.current
      if (!invoiceElement) {
        toast.error('Invoice component not found', { autoClose: 3000 })
        return
      }

      // Make the element visible temporarily for html2canvas
      invoiceElement.style.position = 'absolute'
      invoiceElement.style.left = '0'
      invoiceElement.style.top = '0'
      invoiceElement.style.visibility = 'visible'
      invoiceElement.style.zIndex = '9999'

      // Wait a bit for the component to render
      setTimeout(() => {
        html2canvas(invoiceElement, { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: invoiceElement.offsetWidth,
          height: invoiceElement.offsetHeight
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL('image/png')
            console.log('Invoice canvas generated:', canvas)
            console.log('Invoice image data length:', imgData.length)
            console.log('Invoice image data preview:', imgData.substring(0, 100))
            setInvoiceImage(imgData)
            setShowInvoiceModal(true)
            toast.success('Invoice generated successfully!', { autoClose: 2000 })
          })
          .catch((error) => {
            console.error('Invoice generation error:', error)
            toast.error(`Error generating invoice: ${error.message}`, { autoClose: 3000 })
          })
          .finally(() => {
            // Hide the element again
            invoiceElement.style.position = 'absolute'
            invoiceElement.style.left = '-9999px'
            invoiceElement.style.top = '-9999px'
            invoiceElement.style.visibility = 'hidden'
          })
      }, 300)
    } catch (error) {
      console.error('Invoice generation error:', error)
      toast.error(`Error generating invoice: ${error.message}`, { autoClose: 3000 })
    }
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

  // Filter and sort logic
  const filteredAndSortedOrders = orders
    ?.filter((order) => {
      const matchesSearch = 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tableNumber?.toString().includes(searchTerm) ||
        order.items?.some(item => 
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      const matchesDate = (() => {
        if (dateFilter === 'all') return true
        const orderDate = new Date(order.created_at)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const thisWeek = new Date(today)
        thisWeek.setDate(thisWeek.getDate() - 7)

        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString()
          case 'yesterday':
            return orderDate.toDateString() === yesterday.toDateString()
          case 'thisWeek':
            return orderDate >= thisWeek
          case 'thisMonth':
            return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })()

      return matchesSearch && matchesStatus && matchesDate
    })
    ?.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'orderId':
          aValue = a.orderId || ''
          bValue = b.orderId || ''
          break
        case 'customerName':
          aValue = a.customerName || ''
          bValue = b.customerName || ''
          break
        case 'subtotal':
          aValue = parseFloat(a.subtotal) || 0
          bValue = parseFloat(b.subtotal) || 0
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Mobile Card Component
  const OrderCard = ({ order, index }) => (
    <CCard className="mb-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
      <CCardBody className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="fw-bold mb-1 text-primary">#{order.orderId}</h6>
            <small className="text-muted">
              {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
            </small>
          </div>
          <div style={getStatusStyle(order.status)} className="px-2 py-1 rounded-pill">
            <small className="fw-bold">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </small>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Customer:</span>
            <span className="fw-semibold small">{order.customerName || 'N/A'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Table:</span>
            <span className="fw-semibold small">{order.tableNumber || 'N/A'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Total:</span>
            <span className="fw-bold text-success">₹{order.subtotal || 0}</span>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-2">
            <small className="text-muted">Items:</small>
            <div className="mt-1">
              {order.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="small text-truncate">
                  {item.itemName} (x{item.quantity})
                </div>
              ))}
              {order.items.length > 2 && (
                <small className="text-muted">+{order.items.length - 2} more items</small>
              )}
            </div>
          </div>
        )}

        <div className="d-flex gap-2 mt-3">
          <CButton
            color="primary"
            size="sm"
            className="flex-fill"
            onClick={() => setSelectedOrder(order)}
          >
            View Details
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )

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
      width: 150,
      headerClassName: 'header-style',
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 200,
      headerClassName: 'header-style',
      valueGetter: (params) =>
        params.row.items?.length
          ? params.row.items.map((item) => `${item.itemName} (x${item.quantity})`).join(', ')
          : 'N/A',
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 150,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.customerName || 'N/A',
    },
    {
      field: 'tableNumber',
      headerName: 'Table Number',
      width: 120,
      headerClassName: 'header-style',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
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
      width: 180,
      headerClassName: 'header-style',
      valueGetter: (params) => format(new Date(params.row.createdAt), 'dd/MM/yyyy HH:mm'),
    },
    {
      field: 'subtotal',
      headerName: 'Total',
      width: 100,
      headerClassName: 'header-style',
      valueGetter: (params) => `₹${params.row.
        subtotal || 0}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      headerClassName: 'header-style',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <CButton
          color="primary"
          size="sm"
          onClick={() => setSelectedOrder(params.row)}
        >
          View Details
        </CButton>
      ),
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .mobile-orders-container {
            padding: 0;
          }
          
          @media (max-width: 768px) {
            .mobile-orders-container .card {
              margin-bottom: 1rem;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .mobile-orders-container .card-body {
              padding: 1rem;
            }
            
            .filter-section {
              margin-bottom: 1rem;
            }
            
            .filter-section .card-body {
              padding: 1rem;
            }
            
            .filter-section .row {
              margin: 0;
            }
            
            .filter-section .col {
              padding: 0.25rem;
            }
            
            .filter-section .form-label {
              font-size: 0.875rem;
              font-weight: 600;
              margin-bottom: 0.25rem;
            }
            
            .filter-section .form-control,
            .filter-section .form-select {
              font-size: 0.875rem;
              padding: 0.5rem;
            }
            
            .filter-section .btn {
              font-size: 0.875rem;
              padding: 0.5rem 1rem;
            }
          }
          
          @media (max-width: 576px) {
            .mobile-orders-container .card-body {
              padding: 0.75rem;
            }
            
            .mobile-orders-container .fw-bold {
              font-size: 0.9rem;
            }
            
            .mobile-orders-container .small {
              font-size: 0.75rem;
            }
            
            .mobile-orders-container .btn {
              font-size: 0.8rem;
              padding: 0.4rem 0.8rem;
            }
          }
        `}
      </style>
      <h2 className="mb-4">Orders</h2>
      
      {/* Filter Section */}
      <CCard className="mb-4 shadow-sm filter-section">
        <CCardHeader>
          <h5 className="mb-0">Filters & Search</h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} sm={6} md={3}>
              <div className="mb-3">
                <CFormLabel>Search</CFormLabel>
                <CFormInput
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Status</CFormLabel>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                  <option value="reject">Rejected</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Date Range</CFormLabel>
                <CFormSelect
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Sort By</CFormLabel>
                <CFormSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_at">Date</option>
                  <option value="orderId">Order ID</option>
                  <option value="customerName">Customer</option>
                  <option value="subtotal">Total Amount</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Order</CFormLabel>
                <CFormSelect
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} md={1} className="d-flex align-items-end">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter('all')
                  setSortBy('created_at')
                  setSortOrder('desc')
                }}
                className="w-100"
              >
                Clear
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {isMobile ? (
            // Mobile Card View
            <div className="mobile-orders-container">
              {filteredAndSortedOrders?.length === 0 ? (
                <CCard>
                  <CCardBody className="text-center py-5">
                    <div className="text-muted">
                      <i className="cil-shopping-cart" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-3 mb-0">No orders found</p>
                      <small>Try adjusting your filters</small>
                    </div>
                  </CCardBody>
                </CCard>
              ) : (
                filteredAndSortedOrders?.map((order, index) => (
                  <OrderCard key={order.id || order._id || index} order={order} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div style={{ overflowX: 'auto', width: '100%', minWidth: '800px', display: 'flex', flexDirection: 'column' }}>
              <DataGrid
                style={{ height: 'auto', width: '100%', minHeight: '400px', backgroundColor: 'white', flex: 1 }}
                autoHeight
                rows={filteredAndSortedOrders?.map((order, index) => ({
                  ...order,
                  sno: index + 1,
                })) || []}
                getRowId={(row) => row.id || row.data?.id || Math.random()}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                slots={{ Toolbar: CustomToolbar }}
                sx={{
                  '& .header-style': {
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'unset',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'unset',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '8px 16px',
                    minHeight: '56px !important',
                  },
                  '& .MuiDataGrid-cell': {
                    padding: '8px 16px',
                    fontSize: '0.9rem',
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
        </>
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
          {console.log('Invoice Modal - invoiceImage:', invoiceImage)}
          {console.log('Invoice Modal - showInvoiceModal:', showInvoiceModal)}
          {invoiceImage ? (
            <div>
              <img
                src={invoiceImage}
                alt="Invoice Preview"
                style={{ 
                  width: '100%', 
                  marginBottom: '10px', 
                  maxWidth: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                onLoad={() => console.log('Invoice image loaded successfully')}
                onError={(e) => {
                  console.error('Invoice image failed to load:', e)
                  toast.error('Failed to load invoice image', { autoClose: 3000 })
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                Invoice generated successfully
              </p>
            </div>
          ) : (
            <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
              <p>Generating invoice...</p>
              <p style={{ fontSize: '12px' }}>Invoice Image State: {invoiceImage ? 'Available' : 'Not Available'}</p>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '10px auto'
              }}></div>
            </div>
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
          className="bg-theme-aware custom-scrollbar"
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            height: '100vh',
            width: '30%',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            borderLeft: '1px solid var(--cui-border-color)',
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
              borderBottom: '1px solid var(--cui-border-color)',
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
                color: 'var(--cui-body-color)',
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
              <strong>Customer Name:</strong> {selectedOrder.customerName || 'N/A'}
            </p>
            <p>
              <strong>Customer Address:</strong> {selectedOrder.customerAddress || selectedOrder.customerId?.address || 'N/A'}
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
              {selectedOrder.items?.map((item, index) => (
                <li key={index}>
                  {item.itemName} (x{item.quantity}) - ₹{item.subtotal}
                </li>
              )) || selectedOrder.order_details?.map((item, index) => (
                <li key={index}>
                  {item.item_name} (x{item.quantity}) - ₹{item.price * item.quantity}
                </li>
              )) || <li>No items found</li>}
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
          <div style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '-9999px',
            visibility: 'hidden',
            width: '2in',
            maxWidth: '2in'
          }}>
            <KOT
              ref={kotRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number || 'N/A'}
              cart={selectedOrder.items?.map(item => ({
                id: item._id || item.id || item.itemId,
                itemName: item.itemName || item.item_name,
                price: item.price || item.subtotal,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || selectedOrder.order_details?.map(item => ({
                id: item._id || item.id,
                itemName: item.item_name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || []}
            />
          </div>
          
          <div style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '-9999px',
            visibility: 'hidden',
            width: '2in',
            maxWidth: '2in'
          }}>
            <Invoice
              ref={invoiceRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number || 'N/A'}
              selectedCustomerName={selectedOrder.customerName || selectedOrder.user?.name || 'Walk-in Customer'}
              cart={selectedOrder.items?.map(item => ({
                id: item._id || item.id || item.itemId,
                itemName: item.itemName || item.item_name,
                price: item.price || item.subtotal,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || selectedOrder.order_details?.map(item => ({
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
