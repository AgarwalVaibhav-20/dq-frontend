import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchDailyTransactionsReport } from '../../redux/slices/reportSlice'
import { CSpinner, CCard, CCardBody, CCardHeader, CContainer, CRow, CCol } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery, Box, Typography } from '@mui/material'

const DailyReport = () => {
  const dispatch = useDispatch()
  const {
    dailyTransactionsReport,
    dailyTransactionCount,
    dailyTotalSales,
    loading,
  } = useSelector((state) => state.reports)

  const isMobile = useMediaQuery('(max-width:600px)')
  const theme = useMediaQuery('(max-width:900px)')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const restaurantId = localStorage.getItem('restaurantId')
  const token = localStorage.getItem('authToken')

  // ✅ Fetch Daily Transactions on Mount
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchDailyTransactionsReport({ restaurantId, token }))
    }
  }, [dispatch, restaurantId, token])

  const transactions = Array.isArray(dailyTransactionsReport)
    ? dailyTransactionsReport
    : []

  console.log('Daily Transactions:', transactions)

  // ✅ Apply filters
  const filteredTransactions = transactions.filter((transaction) => {
    const statusMatch = filterStatus === 'all' || transaction.status === filterStatus
    const typeMatch = filterType === 'all' || transaction.type === filterType
    return statusMatch && typeMatch
  })

  const rows = filteredTransactions.map((transaction, index) => ({
    id: index + 1,
    date: new Date(transaction.createdAt).toLocaleDateString(),
    username: transaction.customerId?.name || transaction.username || 'N/A',
    sub_total: transaction.sub_total ? transaction.sub_total.toFixed(2) : '0.00',
    status: transaction.status || 'N/A',
    type: transaction.type || 'N/A',
  }))

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 100 },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 120 },
    { field: 'sub_total', headerName: 'Amount', flex: 1, minWidth: 100 },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 100 },
  ]

  // ✅ Mobile Card View
  const MobileCardView = ({ data }) => (
    <CContainer fluid className="px-0">
      <CRow>
        {data.map((row) => (
          <CCol xs={12} key={row.id} className="mb-3">
            <CCard className="h-100 shadow-sm">
              <CCardHeader className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <Typography variant="subtitle2" className="text-muted mb-0">
                    Transaction #{row.id}
                  </Typography>
                </div>
              </CCardHeader>
              <CCardBody className="py-2">
                <div className="row">
                  <div className="col-6 mb-2">
                    <strong>Date:</strong><br />
                    <small className="text-muted">{row.date}</small>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Amount:</strong><br />
                    <span className="text-success fw-bold">₹{row.sub_total}</span>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Customer:</strong><br />
                    <small className="text-muted">{row.username}</small>
                  </div>
                  <div className="col-6 mb-2">
                    <strong>Type:</strong><br />
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

  if (!restaurantId) {
    return (
      <CContainer className="text-center py-5">
        <Typography variant="h6" color="textSecondary">
          Please select or log into a restaurant to view transactions.
        </Typography>
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="px-3 py-4">
      <Box className="mb-4 text-center">
        <Typography variant="h4" className="fw-bold mb-3">
          Daily Transactions Report
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Total Orders: {dailyTransactionCount} | Total Sales: ₹{dailyTotalSales}
        </Typography>
      </Box>

      {loading ? (
        <Box className="d-flex justify-content-center py-5">
          <CSpinner color="primary" variant="grow" />
        </Box>
      ) : (
        <>
          {isMobile ? (
            <MobileCardView data={rows} />
          ) : (
            <CCard className="shadow-sm">
              <CCardBody className="p-0">
                <Box sx={{ overflowX: 'auto' }}>
                  <DataGrid
                    style={{
                      height: '70vh',
                      width: '100%',
                      backgroundColor: 'white',
                      minHeight: '400px',
                    }}
                    rows={rows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    slots={{ toolbar: CustomToolbar }}
                    sx={{
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold',
                        fontSize: '1rem',
                      },
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
