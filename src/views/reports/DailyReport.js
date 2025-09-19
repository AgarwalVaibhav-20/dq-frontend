import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'

const DailyReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const isMobile = useMediaQuery('(max-width:600px)')

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
  const rows = transactions?.map((transaction, index) => ({
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

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'header-style' },
    { field: 'username', headerName: 'Username', flex: 1, headerClassName: 'header-style' },
    { field: 'sub_total', headerName: 'Sub Total', flex: 1, headerClassName: 'header-style' },
    { field: 'status', headerName: 'Status', flex: 1, headerClassName: 'header-style' },
    { field: 'type', headerName: 'Type', flex: 1, headerClassName: 'header-style' },
    // Commented out columns - keeping for future use
    // { field: 'completedOrders', headerName: 'Completed Orders', flex: 1, headerClassName: 'header-style' },
    // { field: 'rejectedOrders', headerName: 'Rejected Orders', flex: 1, headerClassName: 'header-style' },
    // { field: 'totalAmount', headerName: 'Total Amount', flex: 1, headerClassName: 'header-style' },
    // { field: 'invoiceCount', headerName: 'Invoices', flex: 1, headerClassName: 'header-style' },
    // { field: 'cash', headerName: 'Cash', flex: 1, headerClassName: 'header-style' },
    // { field: 'card', headerName: 'Card', flex: 1, headerClassName: 'header-style' },
    // { field: 'upi', headerName: 'UPI', flex: 1, headerClassName: 'header-style' },
    // { field: 'wallet', headerName: 'Wallet', flex: 1, headerClassName: 'header-style' },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <h2 className="mb-4">Daily Reports</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataGrid
            style={{ height: '70vh', width: '100%', backgroundColor: 'white' }}
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{ toolbar: CustomToolbar }}
            sx={{
              '& .header-style': { fontWeight: 'bold', fontSize: '1.1rem' },
              '@media (max-width: 600px)': {
                '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.9rem' },
                '& .MuiDataGrid-cell': { fontSize: '0.8rem' },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DailyReport
