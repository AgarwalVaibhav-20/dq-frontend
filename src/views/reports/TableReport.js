import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner, CButton, CFormInput, CRow, CCol } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'

const formatDate = (date) => date.toISOString().split('T')[0]

const TableReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const [startDate, setStartDate] = useState(formatDate(oneYearAgo))
  const [endDate, setEndDate] = useState(formatDate(today))

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be greater than or equal to start date.')
      return
    }

    // Data is already fetched, just filter it
    dispatch(fetchAllTransactions({ restaurantId }))
  }

  // Process transactions to group by table number
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt)
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Include the entire end date
    
    return transactionDate >= start && transactionDate <= end
  })

  const tableData = filteredTransactions.reduce((acc, transaction) => {
    const tableNumber = transaction.tableNumber || 'Unknown'
    const totalAmount = transaction.sub_total || 0
    
    if (!acc[tableNumber]) {
      acc[tableNumber] = {
        tableNumber,
        transaction_count: 0,
        total_amount: 0
      }
    }
    acc[tableNumber].transaction_count += 1
    acc[tableNumber].total_amount += totalAmount
    
    return acc
  }, {})

  const rows = Object.values(tableData).map((item, index) => ({
    id: index + 1,
    tableNumber: item.tableNumber,
    transaction_count: item.transaction_count,
    total_amount: item.total_amount.toFixed(2)
  }))

  const columns = [
    { field: 'id', headerName: 'Id', flex: 1, headerClassName: 'header-style' },
    { field: 'tableNumber', headerName: 'Table No.', flex: 1, headerClassName: 'header-style' },
    {
      field: 'transaction_count',
      headerName: 'Total Transactions',
      flex: 1,
      headerClassName: 'header-style',
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      flex: 1,
      headerClassName: 'header-style',
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <h2 className="mb-4">Table Report</h2>

      {/* Date range input row */}
      <CRow
        className="align-items-end mb-3"
        style={{ gap: '1rem', flexWrap: 'nowrap', overflowX: 'auto' }}
      >
        <CCol xs="auto">
          <label htmlFor="startDate" className="form-label fw-bold">
            Start Date
          </label>
          <CFormInput
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
          />
        </CCol>
        <CCol xs="auto">
          <label htmlFor="endDate" className="form-label fw-bold">
            End Date
          </label>
          <CFormInput
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={formatDate(today)}
          />
        </CCol>
        <CCol xs="auto" className="pt-2">
          <CButton color="primary" onClick={handleGenerateReport}>
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {/* Data grid */}
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
            slots={{ toolbar: CustomToolbar }}
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

export default TableReport
