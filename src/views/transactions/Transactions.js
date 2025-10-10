import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import {
  fetchTransactionsByRestaurant,
  fetchTransactionDetails,
  deleteTransaction,
  fetchPOSTransactions,
} from '../../redux/slices/transactionSlice'
import { fetchDuesByCustomer } from '../../redux/slices/duesSlice'
import { CSpinner, CModal, CModalBody, CModalHeader, CModalTitle, CModalFooter, CButton, CForm, CFormLabel, CFormInput, CCard, CCardBody, CCardHeader, CCardTitle, CRow, CCol, CBadge, CFormSelect, CInputGroup, CInputGroupText, CFormRange, CAccordion, CAccordionItem, CAccordionHeader, CAccordionBody, CFormCheck } from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilFile, cilTrash, cilUser, cilFilter, cilCalendar, cilMoney, cilX } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'

const Transactions = () => {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state) => state.transactions)
  // console.log("these r =>",transactions)
  const { customerDues, loading: duesLoading } = useSelector((state) => state.dues)

  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const auth = useSelector((state) => state.auth.auth)
  const theme = useSelector((state) => state.theme.theme)

  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deleteTransactionId, setDeleteTransactionId] = useState('')
  const [deletionRemark, setDeletionRemark] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [showCustomerDuesModal, setShowCustomerDuesModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    paymentType: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  })

  const isMobile = useMediaQuery('(max-width:600px)')
  const token = localStorage.getItem('authToken')
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)

  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchTransactionsByRestaurant({ restaurantId, token }))
    }
  }, [dispatch, restaurantId, token])

  useEffect(() => {
    if (restaurantId && token) {
      dispatch(getRestaurantProfile({ restaurantId, token }))
    }
  }, [dispatch, restaurantId, token])

  const formatDate = (dateString) => {
    const date = new Date(dateString)

    const options = {
      year: 'numeric',
      month: 'short', // Mar
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }

    return date.toLocaleString('en-US', options)
  }

  const generateInvoicePDF = (transactionDetails, restaurantProfile = {}) => {
    console.log('🔍 Generating PDF for transaction:', transactionDetails);
    console.log('🏪 Restaurant profile:', restaurantProfile);

    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160], // 80mm thermal receipt size
    })

    const pageWidth = 80
    let y = 8

    // Utility: center text
    const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
      doc.setFont('Courier', fontStyle)
      doc.setFontSize(fontSize)
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    }

    // Utility: line separator
    const line = () => {
      doc.setLineWidth(0.1)
      doc.line(5, y, pageWidth - 5, y)
      y += 4
    }

    // Utility: format numbers with commas
    const formatAmount = (amount) =>
      Number(amount || 0).toLocaleString('en-IN')

    // ---------- HEADER ----------
    centerText(restaurantProfile?.name || restaurantProfile?.restName || 'DQ TEST RESTAURANT', y, 15)
    y += 5
    centerText(restaurantProfile?.address || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile?.pinCode || 'XXXXXX'}`, y, 8)
    y += 4
    centerText(`Ph: ${restaurantProfile?.phone || restaurantProfile?.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    // ---------- INVOICE TITLE ----------
    centerText('INVOICE', y, 10, 'bold')
    y += 6

    // ---------- TRANSACTION INFO ----------
    const transactionDate = transactionDetails.createdAt ?
      new Date(transactionDetails.createdAt).toLocaleString() :
      'Invalid Date';
    centerText(`Date: ${transactionDate}`, y, 8)
    y += 4

    centerText(`Table: ${transactionDetails.tableNumber || 'N/A'}`, y, 8)
    y += 4

    // Try different customer name fields
    const customerName = transactionDetails?.customerId?.name ||
                        transactionDetails?.userId?.name ||
                        transactionDetails?.userId?.username ||
                        transactionDetails?.username ||
                        transactionDetails?.customerName ||
                        'Walk-in';
    centerText(`Customer: ${customerName}`, y, 8)
    y += 5
    line()

    // ---------- ORDER ITEMS ----------
    centerText('Items', y, 9, 'bold')
    y += 5

    if (transactionDetails.items && transactionDetails.items.length > 0) {
      transactionDetails.items.forEach((item) => {
        const lineItem1 = `${item.itemName} x${item.quantity}`
        centerText(lineItem1, y, 8)
        y += 4

        const lineItem2 = `Rs. ${formatAmount(item.price * item.quantity)}`
        centerText(lineItem2, y, 8)
        y += 4
      })
    } else {
      centerText('No items found', y, 8)
      y += 4
    }

    y += 1
    line()

    // ---------- TOTALS ----------
    centerText(`Subtotal: Rs ${formatAmount(transactionDetails.sub_total || 0)}`, y, 8)
    y += 4
    centerText(`Tax: Rs ${formatAmount(transactionDetails.taxAmount || 0)}`, y, 8)
    y += 4
    centerText(`Discount: Rs ${formatAmount(transactionDetails.discountAmount || 0)}`, y, 8)
    y += 4
    centerText(`RoundOff: Rs ${formatAmount(transactionDetails.roundOff || 0)}`, y, 8)
    y += 4
    line()
    y += 4

    centerText(`Total: Rs ${formatAmount(transactionDetails.total || 0)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }


  const handleGenerateInvoice = (transactionId) => {
    console.log('🔍 Generating invoice for transaction ID:', transactionId)
    console.log('🔍 Transaction ID type:', typeof transactionId)
    console.log('🔍 Available transaction data:', transactions.find(t => t.transactionId === transactionId || t._id === transactionId))

    if (!transactionId) {
      console.error('❌ No transaction ID provided')
      return
    }

    dispatch(fetchTransactionDetails({ transactionId })).then((action) => {
      console.log('📥 Transaction details response:', action.payload)
      console.log('📥 Action type:', action.type)

      if (action.type === 'transactions/fetchTransactionDetails/fulfilled') {
        const transactionDetails = action.payload
        console.log('📄 Transaction details object:', transactionDetails)

        if (!transactionDetails) {
          console.error('❌ Transaction details not found')
          return
        }

        // Generate the PDF with restaurant profile
        const doc = generateInvoicePDF(transactionDetails, restaurantProfile)
        setPdfDoc(doc)
        setInvoiceContent(transactionDetails)
        setModalVisible(true)
      } else {
        console.error('❌ Failed to fetch transaction details:', action.payload)
        console.error('❌ Action type:', action.type)
      }
    }).catch((error) => {
      console.error('❌ Error generating invoice:', error)
    })
  }

  const handleDownload = () => {
    if (pdfDoc && invoiceContent) {
      pdfDoc.save(`Invoice_${invoiceContent._id || invoiceContent.id}.pdf`)
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

  // Direct delete without note modal
  const handleDeleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setShowDeletionModal(true)
      setDeleteTransactionId(id)
      // dispatch(deleteTransaction({ id, deletionRemark }))
    }
  }

  // Handle customer dues
  const handleCustomerDues = async (transaction) => {
    console.log('Customer Dues for transaction:', transaction)

    // Set the selected customer
    setSelectedCustomer({
      id: transaction.userId,
      name: transaction.username || 'Unknown Customer'
    })

    // Fetch customer dues
    try {
      await dispatch(fetchDuesByCustomer({
        customerId: transaction.userId,
        token
      })).unwrap()

      // Show the modal
      setShowCustomerDuesModal(true)
    } catch (error) {
      console.error('Error fetching customer dues:', error)
      // Still show modal with empty dues
      setShowCustomerDuesModal(true)
    }
  }


  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      headerClassName: 'header-style',
      hide: isMobile, // Hide ID column on mobile
    },
    {
      field: 'userId',
      headerName: 'User ID',
      width: 120,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.userId?._id || 'N/A',
      hide: isMobile, // Hide User ID column on mobile
    },
    {
      field: 'username',
      headerName: 'Name',
      width: 150,
      headerClassName: 'header-style',
    },
    {
      field: 'sub_total',
      headerName: 'Sub Total',
      width: 120,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'tax',
      headerName: 'Tax',
      width: 100,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      hide: isMobile, // Hide Tax column on mobile
    },
    {
      field: 'systemCharge',
      headerName: 'System Charge',
      width: 140,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      hide: isMobile, // Hide System Charge column on mobile
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 120,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      hide: isMobile, // Hide Discount column on mobile
    },
    {
      field: 'roundOff',
      headerName: 'Round Off',
      width: 120,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`,
      hide: isMobile, // Hide Round Off column on mobile
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 180,
      headerClassName: 'header-style',
      valueGetter: (params) => {
        if (isMobile) {
          // Show shorter date format on mobile
          return new Date(params.row.createdAt).toLocaleDateString() || 'N/A';
        }
        return new Date(params.row.createdAt).toLocaleString() || 'N/A';
      },
    },
    {
      field: 'type',
      headerName: 'Payment Type',
      width: 130,
      headerClassName: 'header-style',
    },
    {
      field: 'notes',
      headerName: 'Note',
      width: 120,
      headerClassName: 'header-style',
      hide: isMobile, // Hide Notes column on mobile
    },
    {
      field: 'invoice',
      headerName: 'Invoice',
      width: 100,
      headerClassName: 'header-style',
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilFile}
          style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', cursor: 'pointer', color: 'blue' }}
          onClick={() => handleGenerateInvoice(params.row.transactionId || params.row._id)}
        />
      ),
    },
    {
      field: 'customerDues',
      headerName: 'Customer Dues',
      width: 140,
      headerClassName: 'header-style',
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilUser}
          style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', cursor: 'pointer', color: 'green' }}
          onClick={() => handleCustomerDues(params.row)}
        />
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      width: 100,
      headerClassName: 'header-style',
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilTrash}
          style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', cursor: 'pointer', color: 'red' }}
          onClick={() => handleDeleteTransaction(params.row.id)}
        />
      ),
    },
  ]

  // Filter functions
  const applyFilters = (transactions) => {
    return transactions.filter(transaction => {
      // Payment type filter
      if (filters.paymentType !== 'all' && transaction.type !== filters.paymentType) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (transactionDate < today) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const dayBeforeYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
            if (transactionDate < dayBeforeYesterday || transactionDate >= yesterday) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (transactionDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (transactionDate < monthAgo) return false;
            break;
          case 'custom':
            if (filters.startDate && transactionDate < new Date(filters.startDate)) return false;
            if (filters.endDate && transactionDate > new Date(filters.endDate)) return false;
            break;
        }
      }

      // Amount range filter
      const total = parseFloat(transaction.total) || 0;
      if (filters.minAmount && total < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && total > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  };

  // Transform data to ensure each row has an id
  const transformedTransactions = React.useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      console.log('No transactions data available:', transactions);
      return [];
    }
    
    const sortedTransactions = transactions
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const transformed = sortedTransactions.map((transaction, index) => ({
      ...transaction,
      id: transaction._id || transaction.id || `temp-${index}`, // Ensure unique ID
    }));
    
    // Apply filters
    const filtered = applyFilters(transformed);
    
    console.log('Transformed transactions:', filtered.length, 'items');
    return filtered;
  }, [transactions, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      paymentType: 'all',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    });
  };

  // Filter Component
  const FilterComponent = () => {
    return (
      <CAccordion activeItemKey={showFilters ? "filters" : ""} className="mb-3">
        <CAccordionItem itemKey="filters">
          <CAccordionHeader 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              backgroundColor: theme === 'dark' ? '#333333' : '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            <div className="d-flex align-items-center w-100">
              <CIcon icon={cilFilter} className="me-2" />
              <span className="fw-bold">Filters</span>
              <div className="ms-auto">
                {Object.values(filters).some(value => value !== 'all' && value !== '') && (
                  <CBadge color="primary" className="ms-2">Active</CBadge>
                )}
              </div>
            </div>
          </CAccordionHeader>
          <CAccordionBody style={{ 
            backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid #e0e0e0'
          }}>
            <CRow className="g-3">
              {/* Payment Type Filter */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-bold">
                  <CIcon icon={cilMoney} className="me-1" />
                  Payment Type
                </CFormLabel>
                <CFormSelect
                  value={filters.paymentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value }))}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="all">All Payment Types</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </CFormSelect>
              </CCol>

              {/* Date Range Filter */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-bold">
                  <CIcon icon={cilCalendar} className="me-1" />
                  Date Range
                </CFormLabel>
                <CFormSelect
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </CFormSelect>
              </CCol>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <>
                  <CCol xs={6}>
                    <CFormLabel>Start Date</CFormLabel>
                    <CFormInput
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </CCol>
                  <CCol xs={6}>
                    <CFormLabel>End Date</CFormLabel>
                    <CFormInput
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </CCol>
                </>
              )}

              {/* Amount Range Filter */}
              <CCol xs={6}>
                <CFormLabel className="fw-bold">Min Amount (₹)</CFormLabel>
                <CFormInput
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  size={isMobile ? 'sm' : 'md'}
                />
              </CCol>
              <CCol xs={6}>
                <CFormLabel className="fw-bold">Max Amount (₹)</CFormLabel>
                <CFormInput
                  type="number"
                  placeholder="No limit"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  size={isMobile ? 'sm' : 'md'}
                />
              </CCol>

              {/* Filter Actions */}
              <CCol xs={12}>
                <div className="d-flex gap-2 justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={clearFilters}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    <CIcon icon={cilX} className="me-1" />
                    Clear All
                  </CButton>
                  <CButton
                    color="primary"
                    onClick={() => setShowFilters(false)}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    Apply Filters
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </CAccordionBody>
        </CAccordionItem>
      </CAccordion>
    );
  };

  // Mobile Card Component
  const MobileTransactionCard = ({ transaction }) => {
    const formatAmount = (amount) => `₹${(amount || 0).toFixed(2)}`;
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <CCard className="mb-3 shadow-sm" style={{ 
        backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff',
        border: theme === 'dark' ? '1px solid #404040' : '1px solid #e0e0e0'
      }}>
        <CCardHeader className="pb-2">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <CCardTitle className="h6 mb-1" style={{ 
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.9rem'
              }}>
                {transaction.username || 'Walk-in Customer'}
              </CCardTitle>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {formatDate(transaction.createdAt)}
              </small>
            </div>
            <CBadge 
              color={transaction.type === 'cash' ? 'success' : transaction.type === 'card' ? 'info' : 'warning'}
              className="text-uppercase"
              style={{ fontSize: '0.7rem' }}
            >
              {transaction.type || 'N/A'}
            </CBadge>
          </div>
        </CCardHeader>
        <CCardBody className="pt-2">
          <CRow className="mb-2">
            <CCol xs={6}>
              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Sub Total</small>
              <span className="fw-bold" style={{ 
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.85rem'
              }}>
                {formatAmount(transaction.sub_total)}
              </span>
            </CCol>
            <CCol xs={6}>
              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total</small>
              <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                {formatAmount(transaction.total)}
              </span>
            </CCol>
          </CRow>
          
          <CRow className="mb-3">
            <CCol xs={6}>
              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Tax</small>
              <span style={{ 
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.8rem'
              }}>
                {formatAmount(transaction.tax)}
              </span>
            </CCol>
            <CCol xs={6}>
              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Discount</small>
              <span style={{ 
                color: theme === 'dark' ? '#ffffff' : '#000000',
                fontSize: '0.8rem'
              }}>
                {formatAmount(transaction.discount)}
              </span>
            </CCol>
          </CRow>

          {/* Action Buttons */}
          <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: '1px solid #e0e0e0' }}>
            <div className="d-flex gap-2">
              <CButton
                size="sm"
                color="primary"
                variant="outline"
                onClick={() => handleGenerateInvoice(transaction.transactionId || transaction._id)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <CIcon icon={cilFile} size="sm" className="me-1" />
                Invoice
              </CButton>
              <CButton
                size="sm"
                color="success"
                variant="outline"
                onClick={() => handleCustomerDues(transaction)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <CIcon icon={cilUser} size="sm" className="me-1" />
                Dues
              </CButton>
            </div>
            <CButton
              size="sm"
              color="danger"
              variant="outline"
              onClick={() => handleDeleteTransaction(transaction.id)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    );
  };

  return (
    <div style={{ 
      paddingLeft: isMobile ? '10px' : '20px', 
      paddingRight: isMobile ? '10px' : '20px',
      paddingTop: isMobile ? '10px' : '0px'
    }}>
      <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-${isMobile ? 'start' : 'center'} mb-4`}>
        <h2 className={isMobile ? 'mb-3' : ''}>Transactions</h2>
        <CButton 
          color="primary" 
          onClick={() => dispatch(fetchTransactionsByRestaurant({ restaurantId, token })) }
          className={isMobile ? 'w-100' : ''}
          size={isMobile ? 'sm' : 'md'}
        >
          {isMobile ? 'Fetch POS' : 'Fetch POS Transactions'}
        </CButton>
      </div>

      {/* Filter Component */}
      <FilterComponent />
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="text-center">
            <CSpinner color="primary" variant="grow" />
            <div className="mt-2">Loading transactions...</div>
          </div>
        </div>
      ) : transformedTransactions.length > 0 ? (
        <>
          {isMobile ? (
            // Mobile View - Cards
            <div className="mobile-transactions-container">
              {transformedTransactions.map((transaction) => (
                <MobileTransactionCard 
                  key={transaction.id} 
                  transaction={transaction} 
                />
              ))}
            </div>
          ) : (
            // Desktop View - DataGrid
            <div style={{ width: '100%', minWidth: '600px' }}>
              <DataGrid
                autoHeight
                rows={transformedTransactions}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                slots={{
                  toolbar: CustomToolbar,
                }}
                getRowId={(row) => row._id || row.id}
                sx={{
                  backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  '& .MuiDataGrid-cell': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    fontSize: '0.875rem',
                    padding: '8px 16px',
                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme === 'dark' ? '#333333' : '#f5f5f5',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    fontSize: '0.875rem',
                    padding: '8px 16px',
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgba(224, 224, 224, 1)',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    fontSize: '0.875rem',
                    borderTop: '1px solid rgba(224, 224, 224, 1)',
                  },
                  '& .MuiTablePagination-root': {
                    fontSize: '0.875rem',
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    flexDirection: 'row',
                    gap: '16px',
                    padding: '16px',
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? '#404040' : '#f5f5f5',
                    },
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: theme === 'dark' ? '#2A2A2A' : '#fafafa',
                  },
                }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <div className="mb-3">
            <CIcon icon={cilFile} size="3xl" className="text-muted" />
          </div>
          <h5 className="text-muted">No transactions found</h5>
          <p className="text-muted">Try refreshing the page or check your connection</p>
          <CButton 
            color="primary" 
            onClick={() => dispatch(fetchTransactionsByRestaurant({ restaurantId, token }))}
            className="mt-3"
          >
            Refresh Data
          </CButton>
        </div>
      )}

      {/* Modal for Invoice Preview */}
      {invoiceContent && (
        <CModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)}
          size={isMobile ? "lg" : "xl"}
          fullscreen={isMobile}
        >
          <CModalHeader>
            <CModalTitle>Invoice Preview</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <iframe
              src={pdfDoc?.output('datauristring')}
              style={{ 
                width: '100%', 
                height: isMobile ? '300px' : '400px', 
                border: 'none',
                minHeight: isMobile ? '250px' : '350px'
              }}
              title="Invoice Preview"
            ></iframe>
            <div className={`mt-3 d-flex ${isMobile ? 'flex-column gap-2' : 'justify-content-between'}`}>
              <CButton 
                color="primary" 
                onClick={handleDownload}
                className={isMobile ? 'w-100' : ''}
                size={isMobile ? 'sm' : 'md'}
              >
                Download
              </CButton>
              <CButton 
                color="secondary" 
                onClick={handlePrint}
                className={isMobile ? 'w-100' : ''}
                size={isMobile ? 'sm' : 'md'}
              >
                Print
              </CButton>
            </div>
          </CModalBody>
        </CModal>
      )}

      {/* Deletion remark modal */}
      <CModal
        visible={showDeletionModal}
        onClose={() => {
          setShowDeletionModal(false)
          setDeleteTransactionId('')
          setDeletionRemark('')
        }}
        size={isMobile ? "sm" : "md"}
        backdrop="static"
        fullscreen={isMobile}
      >
        <CModalHeader>
          <CModalTitle className={`d-flex align-items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <CIcon icon={cilTrash} size={isMobile ? 'sm' : 'md'} />
            {isMobile ? 'Delete Transaction' : 'Add a deletion remark'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="cashInAmount">Remark</CFormLabel>
              <CFormInput
                type="string"
                id="DeletionRemarkNote"
                placeholder="Enter any remark"
                value={deletionRemark}
                onChange={(e) => setDeletionRemark(e.target.value)}
                disabled={loading}
                size={isMobile ? 'sm' : 'md'}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter className={isMobile ? 'd-flex flex-column gap-2' : ''}>
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeletionModal(false)
              setDeletionRemark('')
              setDeleteTransactionId('')
            }}
            disabled={loading}
            className={isMobile ? 'w-100' : ''}
            size={isMobile ? 'sm' : 'md'}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={() => dispatch(deleteTransaction({ id:deleteTransactionId, deletionRemark }))}
            className={isMobile ? 'w-100' : ''}
            size={isMobile ? 'sm' : 'md'}
          >
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Delete transaction'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Customer Dues */}
      <CModal 
        visible={showCustomerDuesModal} 
        onClose={() => setShowCustomerDuesModal(false)} 
        size={isMobile ? "lg" : "lg"}
        fullscreen={isMobile}
      >
        <CModalHeader>
          <CModalTitle className={isMobile ? 'h6' : ''}>
            {selectedCustomer?.name || 'Customer'}'s Due Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {duesLoading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading dues...</p>
            </div>
          ) : customerDues && customerDues.length > 0 ? (
            <div>
              {/* Customer Information */}
              <div className={`mb-4 p-3 bg-light rounded ${isMobile ? 'p-2' : ''}`}>
                <h6 className={`mb-2 text-primary ${isMobile ? 'h6' : ''}`}>Customer Information:</h6>
                <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Customer:</strong> {selectedCustomer?.name || 'N/A'}</p>
                <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Customer ID:</strong> {selectedCustomer?.id || 'N/A'}</p>
                <p className={`mb-0 ${isMobile ? 'small' : ''}`}><strong>Total Dues Found:</strong> {customerDues.length}</p>
              </div>

              {/* Summary */}
              <div className={`mb-4 p-3 bg-light rounded ${isMobile ? 'p-2' : ''}`}>
                <h6 className={`mb-3 text-primary ${isMobile ? 'h6' : ''}`}>Summary:</h6>
                <div className={isMobile ? 'd-flex flex-column gap-2' : 'row'}>
                  <div className={isMobile ? '' : 'col-md-6'}>
                    <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Total Amount Due:</strong>
                      <span className="text-danger ms-2">
                        Rs. {customerDues.reduce((sum, due) => sum + (parseFloat(due.total) || 0), 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className={isMobile ? '' : 'col-md-6'}>
                    <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Paid Dues:</strong>
                      <span className="text-success ms-2">
                        {customerDues.filter(due => due.status === 'paid').length}
                      </span>
                    </p>
                    <p className={`mb-0 ${isMobile ? 'small' : ''}`}><strong>Unpaid Dues:</strong>
                      <span className="text-warning ms-2">
                        {customerDues.filter(due => due.status === 'unpaid').length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Dues List */}
              <div className="mb-3">
                <h6 className={`mb-3 text-primary ${isMobile ? 'h6' : ''}`}>List of Individual Dues:</h6>
                <div style={{ maxHeight: isMobile ? '300px' : '400px', overflowY: 'auto' }}>
                  {customerDues.map((due, index) => (
                    <div key={due._id || index} className={`mb-3 p-3 border rounded ${isMobile ? 'p-2' : ''}`}>
                      <div className={isMobile ? 'd-flex flex-column gap-2' : 'row'}>
                        <div className={isMobile ? '' : 'col-md-6'}>
                          <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Due ID:</strong> {due._id?.slice(-6) || 'N/A'}</p>
                          <p className={`mb-1 ${isMobile ? 'small' : ''}`}><strong>Created:</strong> {new Date(due.createdAt).toLocaleString()}</p>
                          <p className={`mb-0 ${isMobile ? 'small' : ''}`}><strong>Amount:</strong> Rs. {parseFloat(due.total || 0).toFixed(3)}</p>
                        </div>
                        <div className={isMobile ? '' : 'col-md-6'}>
                          <p className={`mb-1 ${isMobile ? 'small' : ''}`}>
                            <strong>Status:</strong>
                            <span className={`badge ms-2 ${due.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                              {due.status?.toUpperCase() || 'UNPAID'}
                            </span>
                          </p>
                          <p className={`mb-0 ${isMobile ? 'small' : ''}`}><strong>Transaction ID:</strong> {due.transaction_id || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mb-3">
                <CIcon icon={cilUser} size={isMobile ? '2xl' : '3xl'} className="text-muted" />
              </div>
              <h5 className={`text-muted ${isMobile ? 'h6' : ''}`}>No dues found for {selectedCustomer?.name || 'this customer'}</h5>
              <p className={`text-muted ${isMobile ? 'small' : ''}`}>This customer has no outstanding dues.</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => setShowCustomerDuesModal(false)}
            className={isMobile ? 'w-100' : ''}
            size={isMobile ? 'sm' : 'md'}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Transactions
