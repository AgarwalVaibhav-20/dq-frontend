// Import necessary modules
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllDaysReports, fetchReportByType } from '../../redux/slices/reportSlice'
import { CSpinner, CModal, CModalBody, CModalHeader, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFile } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'

const DailyReport = () => {
  const dispatch = useDispatch()
  const { allDaysReports, reportByType, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const isMobile = useMediaQuery('(max-width:600px)')

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllDaysReports({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  const columns = [
    {
      field: 'day',
      headerName: 'Day',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'dailyTotal',
      headerName: 'Daily Total',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'totalTransactions',
      headerName: 'Total Transactions',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Daily Reports</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataGrid
            style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
            rows={allDaysReports?.map((report, index) => ({ id: index + 1, ...report }))}
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
              '@media (max-width: 600px)': {
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8rem',
                },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DailyReport
