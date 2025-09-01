      // Import necessary modules
      import React, { useEffect } from 'react'
      import { useDispatch, useSelector } from 'react-redux'
      import { DataGrid } from '@mui/x-data-grid'
      import { fetchCustomerReport } from '../../redux/slices/reportSlice'
      import { CSpinner } from '@coreui/react'
      import CustomToolbar from '../../utils/CustomToolbar'
      
      const CustomerReport = () => {
        const dispatch = useDispatch()
        const { customerReport, loading } = useSelector((state) => state.reports)
        const restaurantId = useSelector((state) => state.auth.restaurantId)
        useEffect(() => {
          if (restaurantId) {
            dispatch(fetchCustomerReport({ restaurantId }))
          }
        }, [dispatch, restaurantId])
      

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
                rows={customerReport?.map((report, index) => ({ id: index + 1, ...report }))}
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
      