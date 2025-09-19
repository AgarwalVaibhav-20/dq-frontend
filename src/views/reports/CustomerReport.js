// Import necessary modules
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'

const CustomerReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

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

  const rows = Object.values(customerData).map((item, index) => ({
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
        ]
      
        return (
          <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
            <h2 className="mb-4">Customer Report</h2>
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
      
      export default CustomerReport
      