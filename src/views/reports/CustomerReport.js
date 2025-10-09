// Import necessary modules
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner, CCard, CCardBody, CCardHeader, CCol, CRow, CFormSelect, CInputGroup, CInputGroupText, CFormInput } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'

const CustomerReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  
  // State for filters and mobile view
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('total_spent')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Process transactions to group by customer
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  const customerData = transactions.reduce((acc, transaction) => {
    const customerName = transaction.customerId?.name || transaction.username || 'Unknown Customer'
    const totalSpent = transaction.sub_total || 0
    
    if (!acc[customerName]) {
      acc[customerName] = {
        customer_name: customerName,
        total_spent: 0,
        transaction_count: 0
      }
    }
    acc[customerName].total_spent += totalSpent
    acc[customerName].transaction_count += 1
    
    return acc
  }, {})

  // Filter and sort data
  const filteredAndSortedData = Object.values(customerData)
    .filter(item => 
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'total_spent') {
        aValue = parseFloat(aValue)
        bValue = parseFloat(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const rows = filteredAndSortedData.map((item, index) => ({
    id: index + 1,
    customer_name: item.customer_name,
    total_spent: item.total_spent.toFixed(2),
    transaction_count: item.transaction_count
  }))
      

  const columns = [
    {
      field: 'id',
      headerName: 'S.No.',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'customer_name',
      headerName: 'Name',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'total_spent',
      headerName: 'Total Spent',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'transaction_count',
      headerName: 'Transactions',
      flex: 1,
      headerClassName: 'header-style',
    },
  ]

  // Mobile Card Component
  const MobileCard = ({ customer, index }) => (
    <CCard className="mb-3 shadow-sm">
      <CCardHeader className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">{customer.customer_name}</h6>
          <span className="badge bg-primary">#{index + 1}</span>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol xs={6}>
            <div className="text-muted small">Total Spent</div>
            <div className="fw-bold text-success">₹{customer.total_spent}</div>
          </CCol>
          <CCol xs={6}>
            <div className="text-muted small">Transactions</div>
            <div className="fw-bold">{customer.transaction_count}</div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
      
  return (
    <div className="container-fluid px-3 customer-report-mobile-container">
      <div className="d-flex justify-content-between align-items-center mb-4 customer-report-mobile-header">
        <h2 className="mb-0 customer-report-mobile-title">Customer Report</h2>
        <div className="text-muted customer-report-mobile-subtitle">
          Total Customers: {rows.length}
        </div>
      </div>

      {/* Filter Section */}
      <CCard className="mb-4 customer-report-mobile-filters">
        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} md={4}>
              <CInputGroup>
                <CInputGroupText>
                  <i className="cil-magnifying-glass"></i>
                </CInputGroupText>
                <CFormInput
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol xs={6} md={3}>
              <CFormSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="total_spent">Sort by Total Spent</option>
                <option value="customer_name">Sort by Name</option>
                <option value="transaction_count">Sort by Transactions</option>
              </CFormSelect>
            </CCol>
            <CCol xs={6} md={3}>
              <CFormSelect
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12} md={2}>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('')
                    setSortBy('total_spent')
                    setSortOrder('desc')
                  }}
                >
                  Reset
                </button>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? (
        <div className="d-flex justify-content-center py-5 customer-report-mobile-loading">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {isMobile ? (
            // Mobile Card View
            <div className="mobile-cards-container">
              {rows.length === 0 ? (
                <CCard>
                  <CCardBody className="text-center py-5 customer-report-mobile-empty">
                    <div className="text-muted">
                      <i className="cil-user-x" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-3 mb-0">No customers found</p>
                    </div>
                  </CCardBody>
                </CCard>
              ) : (
                rows.map((customer, index) => (
                  <MobileCard key={customer.id} customer={customer} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div style={{ overflowX: 'auto' }}>
              <DataGrid
                style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                slots={{
                  toolbar: CustomToolbar,
                }}
                sx={{
                  '& .header-style': {
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CustomerReport
      