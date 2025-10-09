// Import necessary modules
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner, CCard, CCardBody, CCardHeader, CContainer, CRow, CCol, CFormSelect, CFormLabel, CButton } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery, Box, Typography, useTheme, Chip } from '@mui/material'

const PaymentReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const isMobile = useMediaQuery('(max-width:600px)')
  const isTablet = useMediaQuery('(max-width:900px)')
  const theme = useTheme()
  const [filterPaymentType, setFilterPaymentType] = useState('all') // 'all', 'dine-in', 'takeaway', 'delivery'
  const [filterDateRange, setFilterDateRange] = useState('all') // 'all', 'today', 'week', 'month'
  
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  // Helper function to check if date is in range
  const isDateInRange = (date, range) => {
    const transactionDate = new Date(date)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    switch (range) {
      case 'today':
        return transactionDate >= startOfDay
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return transactionDate >= weekAgo
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return transactionDate >= monthAgo
      default:
        return true
    }
  }

  // Process transactions to group by payment type and day
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  
  // Filter transactions based on payment type and date range
  const filteredTransactions = transactions.filter(transaction => {
    const paymentTypeMatch = filterPaymentType === 'all' || transaction.type === filterPaymentType
    const dateMatch = filterDateRange === 'all' || isDateInRange(transaction.createdAt, filterDateRange)
    return paymentTypeMatch && dateMatch
  })
  
  const paymentData = filteredTransactions.reduce((acc, transaction) => {
    const day = new Date(transaction.createdAt).toLocaleDateString()
    const paymentType = transaction.type || 'Unknown'
    const total = transaction.sub_total || 0
    
    const key = `${day}-${paymentType}`
    if (!acc[key]) {
      acc[key] = {
        day,
        payment_type: paymentType,
        total: 0,
        count: 0
      }
    }
    acc[key].total += total
    acc[key].count += 1
    
    return acc
  }, {})

  const rows = Object.values(paymentData).map((item, index) => ({
    id: index + 1,
    day: item.day,
    total: item.total.toFixed(2),
    payment_type: item.payment_type,
    count: item.count
  }))

  // Mobile responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      { field: 'day', headerName: 'Day', flex: 1, headerClassName: 'header-style', minWidth: 100 },
      { field: 'total', headerName: 'Total', flex: 1, headerClassName: 'header-style', minWidth: 100 },
      { field: 'payment_type', headerName: 'Payment Type', flex: 1, headerClassName: 'header-style', minWidth: 120 },
      { field: 'count', headerName: 'Count', flex: 1, headerClassName: 'header-style', minWidth: 80 },
    ]

    if (isMobile) {
      // Hide less important columns on mobile
      return baseColumns.filter(col => 
        ['day', 'total', 'payment_type'].includes(col.field)
      )
    }
    
    return baseColumns
  }

  const columns = getColumns()

  // Mobile card view component
  const MobileCardView = ({ data }) => (
    <Box sx={{ p: 1 }}>
      {data.map((item, index) => (
        <CCard key={index} className="mb-3 shadow-sm" style={{ borderRadius: '12px' }}>
          <CCardBody className="p-3">
            <CRow className="align-items-center">
              <CCol xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 1 }}>
                  ₹{item.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.day}
                </Typography>
              </CCol>
              <CCol xs={12} sm={6} className="text-end">
                <Chip 
                  label={item.payment_type} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {item.count} transactions
                </Typography>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      ))}
    </Box>
  )

  return (
    <CContainer fluid className="px-3">
      <CCard className="shadow-sm">
        <CCardHeader className="bg-white">
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Payment Report
          </Typography>
        </CCardHeader>
        <CCardBody>
          {/* Filter Section */}
          <Box sx={{ mb: 3 }}>
            <CRow className="g-3">
              <CCol xs={12} sm={6} md={3}>
                <CFormLabel>Payment Type</CFormLabel>
                <CFormSelect
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={6} md={3}>
                <CFormLabel>Date Range</CFormLabel>
                <CFormSelect
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </CFormSelect>
              </CCol>
              <CCol xs={12} sm={12} md={6} className="d-flex align-items-end">
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterPaymentType('all')
                    setFilterDateRange('all')
                  }}
                >
                  Clear Filters
                </CButton>
              </CCol>
            </CRow>
          </Box>

          {loading ? (
            <Box className="d-flex justify-content-center py-5">
              <CSpinner color="primary" variant="grow" />
            </Box>
          ) : (
            <>
              {isMobile ? (
                // Mobile: Only show cards
                <MobileCardView data={rows} />
              ) : (
                // Desktop: Show table
                <CCard className="shadow-sm">
                  <CCardBody className="p-0">
                    <Box sx={{ overflowX: 'auto' }}>
                      <DataGrid
                        style={{ 
                          height: '70vh', 
                          width: '100%', 
                          backgroundColor: 'white',
                          minHeight: '400px'
                        }}
                        rows={rows}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        slots={{ toolbar: CustomToolbar }}
                        sx={{
                          '& .header-style': { 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            backgroundColor: '#f8f9fa'
                          },
                          '& .MuiDataGrid-cell': {
                            fontSize: '0.9rem',
                            padding: '12px'
                          },
                          '& .MuiDataGrid-columnHeader': {
                            padding: '12px'
                          },
                          '& .MuiDataGrid-row': {
                            '&:hover': {
                              backgroundColor: '#f5f5f5'
                            }
                          }
                        }}
                      />
                    </Box>
                  </CCardBody>
                </CCard>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default PaymentReport
