import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { 
  CSpinner, 
  CButton, 
  CFormInput, 
  CRow, 
  CCol, 
  CCard, 
  CCardBody, 
  CCardHeader, 
  CContainer
} from '@coreui/react'
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
  const [filterTableNumber, setFilterTableNumber] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

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

  // Apply additional filters
  let filteredTableData = Object.values(tableData)
  
  if (filterTableNumber) {
    filteredTableData = filteredTableData.filter(item => 
      item.tableNumber.toString().toLowerCase().includes(filterTableNumber.toLowerCase())
    )
  }

  const rows = filteredTableData.map((item, index) => ({
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

  // Mobile Card Component
  const MobileCard = ({ item, index }) => (
    <CCard className="mb-3 shadow-sm">
      <CCardHeader className="bg-primary text-white">
        <h6 className="mb-0">Table #{item.tableNumber}</h6>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol xs={6}>
            <strong>Transactions:</strong>
            <p className="mb-0">{item.transaction_count}</p>
          </CCol>
          <CCol xs={6}>
            <strong>Total Amount:</strong>
            <p className="mb-0 text-success">₹{item.total_amount}</p>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )

  return (
    <CContainer fluid className="p-3">
      <h2 className="mb-4">Table Report</h2>

      {/* Date range and filters */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Filters</h5>
        </CCardHeader>
        <CCardBody>
          {/* Date Range */}
          <CRow className="mb-3">
            <CCol xs={12} md={3}>
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
            <CCol xs={12} md={3}>
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
            <CCol xs={12} md={3} className="d-flex align-items-end">
              <CButton color="primary" onClick={handleGenerateReport} className="w-100">
                Generate Report
              </CButton>
            </CCol>
          </CRow>

          {/* Additional Filters */}
          <CRow>
            <CCol xs={12} md={4}>
              <label htmlFor="filterTableNumber" className="form-label fw-bold">
                Table Number
              </label>
              <CFormInput
                id="filterTableNumber"
                type="text"
                placeholder="Search table number..."
                value={filterTableNumber}
                onChange={(e) => setFilterTableNumber(e.target.value)}
              />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Data Display */}
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <CCard className="mb-3">
            <CCardBody>
              <CRow>
                <CCol xs={12} md={4}>
                  <div className="text-center">
                    <h4 className="text-primary mb-1">{rows.length}</h4>
                    <p className="mb-0 text-muted">Total Tables</p>
                  </div>
                </CCol>
                <CCol xs={12} md={4}>
                  <div className="text-center">
                    <h4 className="text-success mb-1">
                      {rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0)}
                    </h4>
                    <p className="mb-0 text-muted">Total Transactions</p>
                  </div>
                </CCol>
                <CCol xs={12} md={4}>
                  <div className="text-center">
                    <h4 className="text-info mb-1">
                      ₹{rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0).toFixed(2)}
                    </h4>
                    <p className="mb-0 text-muted">Total Amount</p>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Mobile View - Cards */}
          {isMobileView ? (
            <div>
              {rows.length === 0 ? (
                <CCard>
                  <CCardBody className="text-center">
                    <p className="mb-0 text-muted">No data found for the selected criteria.</p>
                  </CCardBody>
                </CCard>
              ) : (
                rows.map((item, index) => (
                  <MobileCard key={item.id} item={item} index={index} />
                ))
              )}
            </div>
          ) : (
            /* Desktop View - DataGrid */
            <div style={{ overflowX: 'auto', width: '100%', minWidth: '600px' }}>
              <DataGrid
                style={{ height: 'auto', width: '100%', backgroundColor: 'white', minWidth: '600px' }}
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
        </>
      )}
    </CContainer>
  )
}

export default TableReport
