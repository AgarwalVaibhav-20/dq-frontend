import React, { useState, useEffect, useCallback } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CAlert,
  CCardFooter,
  CButtonGroup,
  CCollapse,
  CSpinner
} from '@coreui/react'

const MergedTableContent = ({ mergedTableId, originalTables = [] }) => {
  const [mergedOrders, setMergedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTable, setExpandedTable] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [ordersByTable, setOrdersByTable] = useState({})
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState(null)

  // Load merged table data
  useEffect(() => {
    const loadMergedTableData = () => {
      setLoading(true)
      try {
        // Get merged cart data
        const mergedCart = localStorage.getItem(`cart_merged_${mergedTableId}`)
        const mergedStartTime = localStorage.getItem(`start_time_merged_${mergedTableId}`)

        if (mergedCart) {
          const orders = JSON.parse(mergedCart)
          setMergedOrders(orders)

          // Calculate total amount
          const total = orders.reduce((acc, item) =>
            acc + (item.price || 0) * (item.quantity || 1), 0
          )
          setTotalAmount(total)

          // Group orders by original table (if available in item data)
          const grouped = {}
          orders.forEach((item, index) => {
            // If item has original table info, use it; otherwise distribute evenly
            const tableNumber = item.originalTable || originalTables[index % originalTables.length]
            if (!grouped[tableNumber]) {
              grouped[tableNumber] = []
            }
            grouped[tableNumber].push(item)
          })
          setOrdersByTable(grouped)
        }

        if (mergedStartTime) {
          setStartTime(new Date(mergedStartTime))
        }
      } catch (error) {
        console.error('Error loading merged table data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (mergedTableId) {
      loadMergedTableData()
    }
  }, [mergedTableId, originalTables])

  // Update elapsed time
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const now = new Date()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [startTime])

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQuantityChange = (itemIndex, newQuantity) => {
    if (newQuantity < 1) return

    const updatedOrders = mergedOrders.map((item, index) => {
      if (index === itemIndex) {
        return { ...item, quantity: newQuantity }
      }
      return item
    })

    setMergedOrders(updatedOrders)
    localStorage.setItem(`cart_merged_${mergedTableId}`, JSON.stringify(updatedOrders))

    // Recalculate total
    const newTotal = updatedOrders.reduce((acc, item) =>
      acc + (item.price || 0) * (item.quantity || 1), 0
    )
    setTotalAmount(newTotal)
  }

  const removeItem = (itemIndex) => {
    const updatedOrders = mergedOrders.filter((_, index) => index !== itemIndex)
    setMergedOrders(updatedOrders)
    localStorage.setItem(`cart_merged_${mergedTableId}`, JSON.stringify(updatedOrders))

    // Recalculate total
    const newTotal = updatedOrders.reduce((acc, item) =>
      acc + (item.price || 0) * (item.quantity || 1), 0
    )
    setTotalAmount(newTotal)
  }

  const clearAllOrders = () => {
    if (window.confirm('Are you sure you want to clear all orders from this merged table?')) {
      setMergedOrders([])
      setTotalAmount(0)
      localStorage.removeItem(`cart_merged_${mergedTableId}`)
      localStorage.removeItem(`start_time_merged_${mergedTableId}`)
    }
  }

  const toggleTableExpansion = (tableNumber) => {
    setExpandedTable(expandedTable === tableNumber ? null : tableNumber)
  }

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <CSpinner color="primary" size="lg" />
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="p-3">
      {/* Header */}
      <CCard className="mb-4">
        <CCardHeader className="bg-primary text-white">
          <CRow className="align-items-center">
            <CCol>
              <h4 className="mb-0">
                Merged Table ({originalTables.map(t => `T${t}`).join(', ')})
              </h4>
              <small>
                {mergedOrders.length} items • Duration: {formatElapsedTime(elapsedTime)}
              </small>
            </CCol>
            <CCol xs="auto">
              <CBadge color="light" className="fs-6">
                Total: ₹{totalAmount.toFixed(2)}
              </CBadge>
            </CCol>
          </CRow>
        </CCardHeader>
      </CCard>

      {mergedOrders.length === 0 ? (
        <CAlert color="info">
          No orders found in this merged table.
        </CAlert>
      ) : (
        <>
          {/* Summary by Original Tables */}
          <CCard className="mb-4">
            <CCardHeader>
              <h5 className="mb-0">Orders by Original Tables</h5>
            </CCardHeader>
            <CCardBody>
              <CRow>
                {originalTables.map(tableNumber => {
                  const tableOrders = ordersByTable[tableNumber] || []
                  const tableTotal = tableOrders.reduce((acc, item) =>
                    acc + (item.price || 0) * (item.quantity || 1), 0
                  )

                  return (
                    <CCol key={tableNumber} md={6} lg={4} className="mb-3">
                      <CCard className="h-100">
                        <CCardHeader
                          className="bg-light cursor-pointer"
                          onClick={() => toggleTableExpansion(tableNumber)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Table {tableNumber}</span>
                            <div>
                              <CBadge color="primary" className="me-2">
                                {tableOrders.length} items
                              </CBadge>
                              <CBadge color="success">
                                ₹{tableTotal.toFixed(2)}
                              </CBadge>
                            </div>
                          </div>
                        </CCardHeader>
                        <CCollapse visible={expandedTable === tableNumber}>
                          <CCardBody>
                            {tableOrders.length === 0 ? (
                              <small className="text-muted">No orders from this table</small>
                            ) : (
                              <div>
                                {tableOrders.map((item, index) => (
                                  <div key={index} className="d-flex justify-content-between mb-1">
                                    <span>{item.itemName} × {item.quantity}</span>
                                    <span>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CCardBody>
                        </CCollapse>
                      </CCard>
                    </CCol>
                  )
                })}
              </CRow>
            </CCardBody>
          </CCard>

          {/* All Orders Table */}
          <CCard>
            <CCardHeader>
              <h5 className="mb-0">All Merged Orders</h5>
            </CCardHeader>
            <CCardBody>
              <CTable responsive bordered hover>
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell>Item</CTableHeaderCell>
                    <CTableHeaderCell>Price</CTableHeaderCell>
                    <CTableHeaderCell width="120px">Quantity</CTableHeaderCell>
                    <CTableHeaderCell>Subtotal</CTableHeaderCell>
                    <CTableHeaderCell width="100px">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {mergedOrders.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>
                        <strong>{item.itemName || 'Unknown Item'}</strong>
                        {item.selectedSubcategoryId && (
                          <div>
                            <small className="text-muted">
                              Subcategory: {item.selectedSubcategoryId}
                            </small>
                          </div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>₹{(item.price || 0).toFixed(2)}</CTableDataCell>
                      <CTableDataCell>
                        <CButtonGroup size="sm">
                          <CButton
                            color="outline-danger"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </CButton>
                          <CButton color="outline-secondary" disabled>
                            {item.quantity || 1}
                          </CButton>
                          <CButton
                            color="outline-success"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          >
                            +
                          </CButton>
                        </CButtonGroup>
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
            <CCardFooter>
              <CRow className="align-items-center">
                <CCol>
                  <h4 className="mb-0">
                    Grand Total: ₹{totalAmount.toFixed(2)}
                  </h4>
                </CCol>
                <CCol xs="auto">
                  <CButtonGroup>
                    <CButton color="danger" variant="outline" onClick={clearAllOrders}>
                      Clear All
                    </CButton>
                    <CButton color="info" variant="outline">
                      Generate KOT
                    </CButton>
                    <CButton color="warning" variant="outline">
                      Generate Bill
                    </CButton>
                    <CButton color="success">
                      Pay Now
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardFooter>
          </CCard>
        </>
      )}
    </CContainer>
  )
}

export default MergedTableContent
