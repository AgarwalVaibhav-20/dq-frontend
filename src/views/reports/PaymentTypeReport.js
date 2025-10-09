import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchAllTransactions } from '../../redux/slices/reportSlice'
import { CSpinner, CButton, CFormInput, CRow, CCol, CCard, CCardBody, CCardHeader, CFormSelect } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'

const formatDate = (date) => date.toISOString().split('T')[0]

const PaymentTypeReport = () => {
  const dispatch = useDispatch()
  const { allTransactions, loading } = useSelector((state) => state.reports)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const [startDate, setStartDate] = useState(formatDate(oneYearAgo))
  const [endDate, setEndDate] = useState(formatDate(today))
  const [filterType, setFilterType] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchAllTransactions({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

    // Re-fetch transactions for the date range
    dispatch(fetchAllTransactions({ restaurantId }))
  }

  // Process transactions to group by payment type
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return transactionDate >= start && transactionDate <= end
  })

  const paymentTypeData = filteredTransactions.reduce((acc, transaction) => {
    const paymentType = transaction.type || 'Unknown'
    const total = transaction.sub_total || 0
    
    if (!acc[paymentType]) {
      acc[paymentType] = {
        payment_type: paymentType,
        total_count: 0,
        total_amount: 0
      }
    }
    acc[paymentType].total_count += 1
    acc[paymentType].total_amount += total
    
    return acc
  }, {})

  // Apply filter
  const filteredPaymentData = Object.values(paymentTypeData).filter(item => {
    if (filterType === 'all') return true
    return item.payment_type.toLowerCase().includes(filterType.toLowerCase())
  })

  const rows = filteredPaymentData.map((item, index) => ({
    id: index + 1,
    payment_type: item.payment_type,
    total_count: item.total_count,
    total_amount: item.total_amount.toFixed(2)
  }))

  const columns = [
    { field: 'id', headerName: 'Id', flex: 1, headerClassName: 'header-style' },
    {
        field: 'payment_type',
      headerName: 'Payment Type',
      flex: 1,
      headerClassName: 'header-style',
    },
    { field: 'total_count', headerName: 'Total Count', flex: 1, headerClassName: 'header-style' },
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
      <CCardHeader className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-primary">#{index + 1}</h6>
          <span className="badge bg-primary">{item.payment_type}</span>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="row g-2">
          <div className="col-6">
            <small className="text-muted">Total Count</small>
            <div className="fw-bold text-success">{item.total_count}</div>
          </div>
          <div className="col-6">
            <small className="text-muted">Total Amount</small>
            <div className="fw-bold text-primary">₹{item.total_amount}</div>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )

  return (
    <div style={{ padding: isMobile ? '10px' : '20px' }}>
      <style jsx>{`
        .mobile-cards-container {
          max-height: 70vh;
          overflow-y: auto;
        }
        
        @media (max-width: 768px) {
          .mobile-cards-container {
            padding: 0 5px;
          }
          
          .card {
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .card-header {
            padding: 0.75rem;
            border-bottom: 1px solid #e9ecef;
          }
          
          .card-body {
            padding: 1rem;
          }
          
          .badge {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
          }
          
          .fw-bold {
            font-size: 0.9rem;
          }
          
          .text-muted {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 576px) {
          .form-label {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }
          
          .btn {
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
      <h2 className="mb-4">Payment Type Report</h2>

      {/* Date range input row */}
      <CRow
        className={`align-items-end mb-3 ${isMobile ? 'g-2' : ''}`}
        style={{ gap: isMobile ? '0.5rem' : '1rem', flexWrap: isMobile ? 'wrap' : 'nowrap', overflowX: 'auto' }}
      >
        <CCol xs={isMobile ? "12" : "auto"} sm="auto">
          <label htmlFor="startDate" className="form-label fw-bold">
            Start Date
          </label>
          <CFormInput
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            size={isMobile ? "sm" : "default"}
          />
        </CCol>
        <CCol xs={isMobile ? "12" : "auto"} sm="auto">
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
            size={isMobile ? "sm" : "default"}
          />
        </CCol>
        <CCol xs={isMobile ? "12" : "auto"} sm="auto">
          <label htmlFor="filterType" className="form-label fw-bold">
            Filter Type
          </label>
          <CFormSelect
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size={isMobile ? "sm" : "default"}
          >
            <option value="all">All Payment Types</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="online">Online</option>
            <option value="wallet">Wallet</option>
          </CFormSelect>
        </CCol>
        <CCol xs={isMobile ? "12" : "auto"} sm="auto" className={isMobile ? "pt-2" : "pt-2"}>
          <CButton 
            color="primary" 
            onClick={handleGenerateReport}
            size={isMobile ? "sm" : "default"}
            className={isMobile ? "w-100" : ""}
          >
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {/* Data display */}
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {isMobile ? (
            // Mobile Cards View
            <div className="mobile-cards-container">
              {rows.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-muted">No payment data found for the selected date range</div>
                </div>
              ) : (
                rows.map((item, index) => (
                  <MobileCard key={item.id} item={item} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop DataGrid View
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
        </>
      )}
    </div>
  )
}

export default PaymentTypeReport
