// Import necessary modules
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'

const PaymentReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  // Process transactions to group by payment type and day
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  const paymentData = transactions.reduce((acc, transaction) => {
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

  const columns = [
    {
      field: 'day',
      headerName: 'Day',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'payment_type',
      headerName: 'Payment Type',
      flex: 1,
      headerClassName: 'header-style',
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Payment Report</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
        <DataGrid
          style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
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
    </div>
  )
}

export default PaymentReport
