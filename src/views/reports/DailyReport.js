import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner, CCard, CCardBody, CCardHeader, CContainer, CRow, CCol } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery, Box, Typography, useTheme } from '@mui/material'

const DailyReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const isMobile = useMediaQuery('(max-width:600px)')
  const isTablet = useMediaQuery('(max-width:900px)')
  const theme = useTheme()
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'completed', 'pending', 'failed'
  const [filterType, setFilterType] = useState('all') // 'all', 'dine-in', 'takeaway', 'delivery'

  const restaurantId = localStorage.getItem('restaurantId') // or however you store it

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  // Map the transactions array to DataGrid rows
  console.log('allTransactions:', allTransactions)
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  console.log('transactions array:', transactions)
  
  // Filter transactions based on status and type
  const filteredTransactions = transactions.filter(transaction => {
    const statusMatch = filterStatus === 'all' || transaction.status === filterStatus
    const typeMatch = filterType === 'all' || transaction.type === filterType
    return statusMatch && typeMatch
  })
  
  const rows = filteredTransactions?.map((transaction, index) => ({
    id: index + 1,
    date: new Date(transaction.createdAt).toLocaleDateString(),
    username: transaction.customerId?.name || transaction.username || 'N/A',
    sub_total: transaction.sub_total ? transaction.sub_total.toFixed(2) : '0.00',
    status: transaction.status || 'N/A',
    type: transaction.type || 'N/A',
    // Commented out columns - keeping for future use
    // completedOrders: d.completedOrders,
    // rejectedOrders: d.rejectedOrders,
    // totalAmount: d.totalAmount.toFixed(2),
    // invoiceCount: d.invoiceCount,
    // cash: d.paymentTypeBreakdown.cash.toFixed(2),
    // card: d.paymentTypeBreakdown.card.toFixed(2),
    // upi: d.paymentTypeBreakdown.upi.toFixed(2),
    // wallet: d.paymentTypeBreakdown.wallet.toFixed(2),
  }))

  // Mobile responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'header-style', minWidth: 100 },
      { field: 'username', headerName: 'Username', flex: 1, headerClassName: 'header-style', minWidth: 120 },
      { field: 'sub_total', headerName: 'Amount', flex: 1, headerClassName: 'header-style', minWidth: 100 },
      { field: 'status', headerName: 'Status', flex: 1, headerClassName: 'header-style', minWidth: 100 },
      { field: 'type', headerName: 'Type', flex: 1, headerClassName: 'header-style', minWidth: 100 },
    ]

    if (isMobile) {
      // Hide less important columns on mobile
      return baseColumns.filter(col => 
        ['date', 'username', 'sub_total', 'status'].includes(col.field)
      )
    }
    
    return baseColumns
  }

  const columns = getColumns()

  // Mobile card view component
  const MobileCardView = ({ data }) => (
    <CContainer fluid className="px-0">
      <CRow>
        {data.map((row, index) => (
          <CCol xs={12} key={row.id} className="mb-3">
            <CCard className="h-100 shadow-sm">
              <CCardHeader className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <Typography variant="subtitle2" className="text-muted mb-0">
                    Transaction #{row.id}
                  </Typography>
                  <span className={`badge ${
                    row.status === 'completed' ? 'bg-success' : 
                    row.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                  }`}>
                    {row.status}
                  </span>
                </div>
              </CCardHeader>
              <CCardBody className="py-2">
                <div className="row">
                  <div className="col-6 mb-2">
                    <strong>Date:</strong><br/>
                    <small className="text-muted">{row.date}</small>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Amount:</strong><br/>
                    <span className="text-success fw-bold">₹{row.sub_total}</span>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Customer:</strong><br/>
                    <small className="text-muted">{row.username}</small>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Type:</strong><br/>
                    <small className="text-muted">{row.type}</small>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
    </CContainer>
  )

  return (
    <CContainer fluid className="px-3 py-4">
      <Box className="mb-4">
        <Typography variant="h4" className="mb-3">
           <h3 className="mb-4 mx-auto text-center w-100 heading-mobile-center">Daily Reports</h3>
        </Typography>
        
        {/* Mobile Filter Options */}
        {isMobile && (
          <Box className="mb-3">
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small">Filter by Status:</label>
                <select 
                  className="form-select form-select-sm" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small">Filter by Type:</label>
                <select 
                  className="form-select form-select-sm" 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <Typography variant="body2" className="text-muted">
                {rows.length} transactions found
              </Typography>
              <small className="text-muted">
                Showing filtered results
              </small>
            </div>
          </Box>
        )}
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
    </CContainer>
  )
}

export default DailyReport
