import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllDaysReports } from '../../redux/slices/reportSlice'
import { CSpinner } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'

const DailyReport = () => {
  const dispatch = useDispatch()
  const { allDaysReports, loading } = useSelector((state) => state.reports)
  const isMobile = useMediaQuery('(max-width:600px)')

  const customerId = localStorage.getItem('restaurantId') // or however you store it

  useEffect(() => {
    if (customerId) {
      dispatch(fetchAllDaysReports({ customerId }))
    }
  }, [dispatch, customerId])

  // Map the daily array to DataGrid rows
  const rows = allDaysReports?.map((d, index) => ({
    id: index + 1,
    date: new Date(d.date).toLocaleDateString(),
    completedOrders: d.completedOrders,
    rejectedOrders: d.rejectedOrders,
    totalAmount: d.totalAmount.toFixed(2),
    invoiceCount: d.invoiceCount,
    cash: d.paymentTypeBreakdown.cash.toFixed(2),
    card: d.paymentTypeBreakdown.card.toFixed(2),
    upi: d.paymentTypeBreakdown.upi.toFixed(2),
    wallet: d.paymentTypeBreakdown.wallet.toFixed(2),
  }))

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'header-style' },
    { field: 'completedOrders', headerName: 'Completed Orders', flex: 1, headerClassName: 'header-style' },
    { field: 'rejectedOrders', headerName: 'Rejected Orders', flex: 1, headerClassName: 'header-style' },
    { field: 'totalAmount', headerName: 'Total Amount', flex: 1, headerClassName: 'header-style' },
    { field: 'invoiceCount', headerName: 'Invoices', flex: 1, headerClassName: 'header-style' },
    { field: 'cash', headerName: 'Cash', flex: 1, headerClassName: 'header-style' },
    { field: 'card', headerName: 'Card', flex: 1, headerClassName: 'header-style' },
    { field: 'upi', headerName: 'UPI', flex: 1, headerClassName: 'header-style' },
    { field: 'wallet', headerName: 'Wallet', flex: 1, headerClassName: 'header-style' },
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
