import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CSpinner, CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import { fetchCustomerReport } from '../../redux/slices/customerSlice'

const CustomerReport = () => {
  const dispatch = useDispatch()
  const { reportData, reportLoading, reportError } = useSelector((state) => state.customers)
  const restaurantIdFromRedux = useSelector((state) => state.auth.restaurantId)
  const restaurantId = restaurantIdFromRedux || localStorage.getItem('restaurantId')
  const token = localStorage.getItem('authToken')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    console.log('restaurantId from Redux:', restaurantIdFromRedux)
    console.log('restaurantId (final):', restaurantId)
    console.log('reportData from Redux:', reportData)

    if (!restaurantId) {
      console.warn('No restaurantId found in Redux or localStorage - cannot fetch report')
    }

    if (restaurantId && token) {
      dispatch(fetchCustomerReport({ restaurantId }))
    } else {
      console.warn('Missing restaurantId or token - skipping fetch')
    }
  }, [dispatch, restaurantId, token])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (reportLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  if (reportError) {
    return (
      <div className="alert alert-danger text-center mt-4">
        Failed to load customer report: {reportError}
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center text-muted py-5">
        <i className="cil-user-x" style={{ fontSize: '3rem' }}></i>
        <p className="mt-3 mb-0">No report data available</p>
      </div>
    )
  }

  // ✅ Use safe defaults to avoid toFixed() on undefined
  const totalCustomers = reportData?.totalCustomers
  const totalSpending = reportData?.totalSpending
  const totalRewards = reportData?.totalRewards
  const averageSpendingPerCustomer = reportData?.averageSpendingPerCustomer
  const breakdownByType = reportData?.breakdownByType ?? []
  const highSpendersCount = reportData?.highSpendersCount
  const regularCustomersCount = reportData?.regularCustomersCount
  const newCustomersCount = reportData?.newCustomersCount
  const lostCustomersCount = reportData?.lostCustomersCount
  const corporateCustomersCount = reportData?.corporateCustomersCount
  const activeCustomersCount = reportData?.activeCustomersCount

  console.log('Rendering CustomerReport with data:', {
    totalCustomers,
    totalSpending,
    totalRewards,
    averageSpendingPerCustomer,
    breakdownByType,
    highSpendersCount,
    regularCustomersCount,
  })

  return (
    <div className="container-fluid px-3 customer-report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">Customer Report</h2>
        <div className="text-muted">Updated Overview</div>
      </div>

      {/* Main Summary Cards */}
      <CRow className="g-3 mb-4">
        <CCol xs={6} md={3}>
          <CCard className="shadow-sm border-start border-primary border-4">
            <CCardBody className="text-center">
              <h6 className="text-muted mb-2">Total Customers</h6>
              <h4 className="fw-bold text-primary">{totalCustomers}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={6} md={3}>
          <CCard className="shadow-sm border-start border-success border-4">
            <CCardBody className="text-center">
              <h6 className="text-muted mb-2">Total Spending</h6>
              <h4 className="fw-bold text-success">₹{totalSpending.toFixed(2)}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={6} md={3}>
          <CCard className="shadow-sm border-start border-info border-4">
            <CCardBody className="text-center">
              <h6 className="text-muted mb-2">Total Rewards</h6>
              <h4 className="fw-bold text-info">{totalRewards.toFixed(2)}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={6} md={3}>
          <CCard className="shadow-sm border-start border-warning border-4">
            <CCardBody className="text-center">
              <h6 className="text-muted mb-2">Avg. Spend / Customer</h6>
              <h4 className="fw-bold text-warning">₹{averageSpendingPerCustomer.toFixed(2)}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Customer Segmentation Cards */}
      <div className="mb-4">
        <h5 className="fw-bold mb-3">Customer Segmentation</h5>
        <CRow className="g-3">
          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-star" style={{ fontSize: '1.5rem', color: '#ffc107' }}></i>
                </div>
                <h6 className="text-muted mb-2">High Spenders</h6>
                <h4 className="fw-bold text-warning">{highSpendersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-loop" style={{ fontSize: '1.5rem', color: '#17a2b8' }}></i>
                </div>
                <h6 className="text-muted mb-2">Regular Customers</h6>
                <h4 className="fw-bold text-info">{regularCustomersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-user-follow" style={{ fontSize: '1.5rem', color: '#28a745' }}></i>
                </div>
                <h6 className="text-muted mb-2">New Customers</h6>
                <h4 className="fw-bold text-success">{newCustomersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-user-unfollow" style={{ fontSize: '1.5rem', color: '#dc3545' }}></i>
                </div>
                <h6 className="text-muted mb-2">Lost Customers</h6>
                <h4 className="fw-bold text-danger">{lostCustomersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-briefcase" style={{ fontSize: '1.5rem', color: '#6f42c1' }}></i>
                </div>
                <h6 className="text-muted mb-2">Corporate</h6>
                <h4 className="fw-bold" style={{ color: '#6f42c1' }}>{corporateCustomersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={6} md={4} lg={2}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="mb-2">
                  <i className="cil-checkmark" style={{ fontSize: '1.5rem', color: '#20c997' }}></i>
                </div>
                <h6 className="text-muted mb-2">Active Customers</h6>
                <h4 className="fw-bold" style={{ color: '#20c997' }}>{activeCustomersCount}</h4>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>

      {/* Breakdown by Customer Type */}
      <CCard className="shadow-sm">
        <CCardHeader className="fw-bold bg-light">Breakdown by Customer Type</CCardHeader>
        <CCardBody>
          {breakdownByType.length === 0 ? (
            <p className="text-muted text-center mb-0">No customer type data available</p>
          ) : (
            <CRow className="g-3">
              {breakdownByType.map((item, index) => (
                <CCol xs={6} md={3} key={index}>
                  <CCard className="border-0 shadow-sm h-100 text-center">
                    <CCardBody>
                      <h6 className="text-muted mb-2">{item.type}</h6>
                      <h4 className="fw-bold">{item.count}</h4>
                      <small className="text-muted">
                        {totalCustomers > 0 ? ((item.count / totalCustomers) * 100).toFixed(1) : 0}%
                      </small>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          )}
        </CCardBody>
      </CCard>

      {/* Summary Stats */}
      <CRow className="g-3 mt-4">
        <CCol md={6}>
          <CCard className="shadow-sm">
            <CCardHeader className="fw-bold bg-light">Customer Engagement</CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Customers</span>
                  <strong>{activeCustomersCount} ({totalCustomers > 0 ? ((activeCustomersCount / totalCustomers) * 100).toFixed(1) : 0}%)</strong>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: totalCustomers > 0 ? ((activeCustomersCount / totalCustomers) * 100) : 0 + '%'
                    }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Regular Customers</span>
                  <strong>{regularCustomersCount} ({totalCustomers > 0 ? ((regularCustomersCount / totalCustomers) * 100).toFixed(1) : 0}%)</strong>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-info"
                    style={{
                      width: totalCustomers > 0 ? ((regularCustomersCount / totalCustomers) * 100) : 0 + '%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Lost Customers</span>
                  <strong>{lostCustomersCount} ({totalCustomers > 0 ? ((lostCustomersCount / totalCustomers) * 100).toFixed(1) : 0}%)</strong>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-danger"
                    style={{
                      width: totalCustomers > 0 ? ((lostCustomersCount / totalCustomers) * 100) : 0 + '%'
                    }}
                  ></div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="shadow-sm">
            <CCardHeader className="fw-bold bg-light">Revenue Insights</CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Total Spending</span>
                  <strong className="text-success">₹{totalSpending.toFixed(2)}</strong>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Average Per Customer</span>
                  <strong className="text-primary">₹{averageSpendingPerCustomer.toFixed(2)}</strong>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">High Spenders Count</span>
                  <strong className="text-warning">{highSpendersCount}</strong>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Total Rewards Issued</span>
                  <strong className="text-info">{totalRewards.toFixed(2)}</strong>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default CustomerReport