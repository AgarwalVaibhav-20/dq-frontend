import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchQrCodes } from '../../redux/slices/qrSlice'
import {fetchCombinedOrders} from '../../redux/slices/orderSlice'
import {
  CContainer,
  CCol,
  CRow,
  CSpinner,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CBadge,
  CAlert,
} from '@coreui/react'

const POS = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { qrList, loading, error } = useSelector((state) => state.qr)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const theme = useSelector((state) => state.theme.theme)

  const [cart, setCart] = useState({})
  const [showCombinedModal, setShowCombinedModal] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedTables, setSelectedTables] = useState([])

  // Table merging states
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergedTables, setMergedTables] = useState(() => {
    const saved = localStorage.getItem('mergedTables')
    return saved ? JSON.parse(saved) : []
  })
  const [mergingLoading, setMergingLoading] = useState(false)
  const [selectedMergeTables, setSelectedMergeTables] = useState([])
  const [tablesWithOrders, setTablesWithOrders] = useState([])

  // Debug state changes
  useEffect(() => {
    console.log('showMergeModal changed to:', showMergeModal)
  }, [showMergeModal])

  // Fetch QR codes & restore carts
  useEffect(() => {
    if (qrList.length === 0) {
      dispatch(fetchQrCodes(restaurantId))
    }

    const storedCarts = {}
    qrList.forEach((qr) => {
      const savedCart = localStorage.getItem(`cart_${qr.tableNumber}`)
      if (savedCart) {
        storedCarts[qr.tableNumber] = JSON.parse(savedCart)
      }
    })
    setCart(storedCarts)
  }, [dispatch, restaurantId, qrList.length])

  // Update tables with orders when modal opens
  useEffect(() => {
    if (showMergeModal) {
      console.log('Modal opened, loading tables with orders...')
      const activeTablesData = []

      qrList.forEach((qr) => {
        const savedCart = localStorage.getItem(`cart_${qr.tableNumber}`)
        if (savedCart) {
          const cart = JSON.parse(savedCart)
          if (cart && cart.length > 0) {
            const totalAmount = cart.reduce((acc, item) =>
              acc + (item.price || 0) * (item.quantity || 1), 0
            )
            const totalItems = cart.reduce((acc, item) =>
              acc + (item.quantity || 1), 0
            )

            activeTablesData.push({
              tableNumber: qr.tableNumber,
              orders: cart,
              totalAmount,
              totalItems,
              startTime: localStorage.getItem(`start_time_${qr.tableNumber}`)
            })
          }
        }
      })

      console.log('Tables with orders:', activeTablesData)
      setTablesWithOrders(activeTablesData)
    }
  }, [showMergeModal, qrList])

  // Save merged tables to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mergedTables', JSON.stringify(mergedTables))
  }, [mergedTables])

  const handleQrClick = (qr) => {
    navigate(`/pos/tableNumber/${qr.tableNumber}`)
  }

  const handleMergedTableClick = (mergedTable) => {
    navigate(`/pos/merged/${mergedTable.id}`, {
      state: {
        mergedTable,
        originalTables: mergedTable.tables
      }
    })
  }

  const isItemInCart = (qr) => {
    return cart[qr.tableNumber] && cart[qr.tableNumber].length > 0
  }

  const isTableMerged = (tableNumber) => {
    return mergedTables.some(merged =>
      merged.tables.includes(tableNumber)
    )
  }

  const handleMergeTablesClick = () => {
    console.log('Merge Tables button clicked - opening modal')
    setSelectedMergeTables([])
    setShowMergeModal(true)
  }

  const handleTableSelect = (tableNumber) => {
    console.log('Table selected:', tableNumber)
    setSelectedMergeTables(prev =>
      prev.includes(tableNumber)
        ? prev.filter(t => t !== tableNumber)
        : [...prev, tableNumber]
    )
  }

  const handleMergeConfirm = async () => {
    console.log('Confirming merge for tables:', selectedMergeTables)

    if (selectedMergeTables.length < 2) {
      alert('Please select at least 2 tables to merge.')
      return
    }

    setMergingLoading(true)

    try {
      // Combine all orders from selected tables
      const combinedOrders = []
      let totalAmount = 0
      let earliestStartTime = null

      selectedMergeTables.forEach(tableNumber => {
        const tableCart = cart[tableNumber] || []
        const startTime = localStorage.getItem(`start_time_${tableNumber}`)

        if (tableCart.length > 0) {
          const itemsWithTable = tableCart.map(item => ({
            ...item,
            originalTable: tableNumber
          }))
          combinedOrders.push(...itemsWithTable)
          totalAmount += tableCart.reduce((acc, item) =>
            acc + (item.price || 0) * (item.quantity || 1), 0
          )
        }

        if (startTime) {
          const timeDate = new Date(startTime)
          if (!earliestStartTime || timeDate < earliestStartTime) {
            earliestStartTime = timeDate
          }
        }
      })

      const mergedTable = {
        id: `merged_${Date.now()}`,
        name: `Merged (${selectedMergeTables.map(t => `T${t}`).join(', ')})`,
        tables: selectedMergeTables,
        combinedOrders,
        totalAmount,
        startTime: earliestStartTime,
        createdAt: new Date().toISOString()
      }

      setMergedTables(prev => [...prev, mergedTable])

      localStorage.setItem(`cart_merged_${mergedTable.id}`, JSON.stringify(combinedOrders))
      if (earliestStartTime) {
        localStorage.setItem(`start_time_merged_${mergedTable.id}`, earliestStartTime.toISOString())
      }

      selectedMergeTables.forEach(tableNumber => {
        localStorage.removeItem(`cart_${tableNumber}`)
        localStorage.removeItem(`start_time_${tableNumber}`)
      })

      const newCart = { ...cart }
      selectedMergeTables.forEach(tableNumber => {
        delete newCart[tableNumber]
      })
      setCart(newCart)

      setShowMergeModal(false)
      setSelectedMergeTables([])

      alert(`Successfully merged ${selectedMergeTables.length} tables!`)
    } catch (error) {
      console.error('Error merging tables:', error)
      alert('Failed to merge tables. Please try again.')
    } finally {
      setMergingLoading(false)
    }
  }

  const handleUnmergeTable = (mergedTable) => {
    if (window.confirm('Are you sure you want to unmerge this table? This will split the orders back to individual tables.')) {
      const ordersPerTable = {}

      mergedTable.combinedOrders.forEach((order) => {
        const targetTable = order.originalTable || mergedTable.tables[0]
        if (!ordersPerTable[targetTable]) {
          ordersPerTable[targetTable] = []
        }
        const { originalTable, ...cleanOrder } = order
        ordersPerTable[targetTable].push(cleanOrder)
      })

      Object.entries(ordersPerTable).forEach(([tableNumber, orders]) => {
        localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(orders))
        if (mergedTable.startTime) {
          localStorage.setItem(`start_time_${tableNumber}`, mergedTable.startTime)
        }
      })

      const newCart = { ...cart, ...ordersPerTable }
      setCart(newCart)

      setMergedTables(prev => prev.filter(m => m.id !== mergedTable.id))

      localStorage.removeItem(`cart_merged_${mergedTable.id}`)
      localStorage.removeItem(`start_time_merged_${mergedTable.id}`)

      alert('Table unmerged successfully!')
    }
  }

  const fetchActiveOrders = async () => {
    const orders = []

    Object.keys(cart).forEach((tableNumber) => {
      if (cart[tableNumber].length > 0) {
        orders.push({
          _id: `ORD-${tableNumber}-${Date.now()}`,
          tableNumber,
          items: cart[tableNumber],
          status: 'active',
          type: 'individual',
          totalAmount: cart[tableNumber].reduce(
            (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
            0
          ),
        })
      }
    })

    mergedTables.forEach(mergedTable => {
      if (mergedTable.combinedOrders && mergedTable.combinedOrders.length > 0) {
        orders.push({
          _id: `ORD-${mergedTable.id}-${Date.now()}`,
          tableNumber: mergedTable.name,
          items: mergedTable.combinedOrders,
          status: 'active',
          type: 'merged',
          originalTables: mergedTable.tables,
          totalAmount: mergedTable.totalAmount,
        })
      }
    })

    setActiveOrders(orders)
    setSelectedTables([])
    setShowCombinedModal(true)
  }

  const toggleSelectTable = (tableNumber) => {
    setSelectedTables((prev) =>
      prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber]
    )
  }

  const handleCombineOrders = () => {
    if (selectedTables.length < 2) {
      alert('Please select at least 2 tables to combine.')
      return
    }

    dispatch(fetchCombinedOrders({ restaurantId, tableNumbers: selectedTables }))
    setShowCombinedModal(false)
  }

  const getAvailableTables = () => {
    return qrList.filter(qr => !isTableMerged(qr.tableNumber))
  }

  const formatTime = (startTimeStr) => {
    if (!startTimeStr) return 'N/A'
    const startTime = new Date(startTimeStr)
    const now = new Date()
    const diffSeconds = Math.floor((now - startTime) / 1000)
    const hours = Math.floor(diffSeconds / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    const seconds = diffSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (startTimeStr) => {
    if (!startTimeStr) return 'N/A'
    const startTime = new Date(startTimeStr)
    const now = new Date()
    const diffSeconds = Math.floor((now - startTime) / 1000)
    const hours = Math.floor(diffSeconds / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <CContainer className="py-2">
      {/* Debug info */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Debug: showMergeModal = {showMergeModal.toString()},
        tablesWithOrders = {tablesWithOrders.length},
        selectedMergeTables = {selectedMergeTables.length}
      </div>

      {/* Header with Title + Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Select Table To Generate Bill</h3>
        <div>
          <CButton color="primary" className="me-2" onClick={fetchActiveOrders}>
            All Orders
          </CButton>
          <CButton
            color="success"
            onClick={handleMergeTablesClick}
          >
            Merge Tables
          </CButton>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : (
        <>
          {/* Merged Tables Section */}
          {mergedTables.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Merged Tables</h5>
              <CRow className="justify-content-start">
                {mergedTables.map((mergedTable) => (
                  <CCol
                    key={mergedTable.id}
                    xs="6"
                    sm="4"
                    md="3"
                    lg="2"
                    xl="2"
                    className="mx-2 mb-4 d-flex justify-content-center"
                  >
                    <CContainer
                      className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 bg-info text-white`}
                      onClick={() => handleMergedTableClick(mergedTable)}
                      style={{
                        height: '12rem',
                        cursor: 'pointer',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      <CBadge
                        color="light"
                        className="position-absolute top-0 end-0 m-1"
                        style={{ fontSize: '0.7rem' }}
                      >
                        MERGED
                      </CBadge>
                      <div className="fw-bold text-center mb-1">
                        {mergedTable.name}
                      </div>
                      <small className="text-center">
                        {mergedTable.combinedOrders?.length || 0} items
                      </small>
                      <small className="text-center">
                        ₹{(mergedTable.totalAmount || 0).toFixed(2)}
                      </small>
                      <small className="text-center">
                        {formatDuration(mergedTable.startTime)}
                      </small>
                      <CButton
                        size="sm"
                        color="light"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnmergeTable(mergedTable)
                        }}
                      >
                        Unmerge
                      </CButton>
                    </CContainer>
                  </CCol>
                ))}
              </CRow>
            </div>
          )}

          {/* Individual Tables Section */}
          <div className="mb-4">
            <h5 className="mb-3">Individual Tables</h5>
            <CRow className="justify-content-start">
              {getAvailableTables().map((qr) => (
                <CCol
                  key={qr.id}
                  xs="6"
                  sm="4"
                  md="3"
                  lg="2"
                  xl="2"
                  className="mx-2 mb-4 d-flex justify-content-center"
                >
                  <CContainer
                    className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${
                      isItemInCart(qr)
                        ? 'bg-danger text-white'
                        : theme === 'dark'
                        ? 'bg-secondary text-white'
                        : 'bg-white text-dark'
                    }`}
                    onClick={() => handleQrClick(qr)}
                    style={{
                      height: '10rem',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div className="fw-bold">Table {qr.tableNumber}</div>
                    {/* {isItemInCart(qr) && (
                      <small className="text-center mt-1">
                        {cart[qr.tableNumber]?.length || 0} items
                      </small>
                    )} */}
                  </CContainer>
                </CCol>
              ))}

              {/* Takeaway */}
              <CCol
                xs="6"
                sm="4"
                md="3"
                lg="2"
                xl="2"
                className="mx-2 mb-4 d-flex justify-content-center"
              >
                <CContainer
                  className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${
                    theme === 'dark'
                      ? 'bg-secondary text-white'
                      : 'bg-white text-dark'
                  }`}
                  onClick={() => navigate('/pos/tableNumber/0')}
                  style={{
                    height: '10rem',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <div className="fw-bold">Takeaway</div>
                </CContainer>
              </CCol>
            </CRow>
          </div>
        </>
      )}

      {/* Combined Order Modal */}
      <CModal
        visible={showCombinedModal}
        onClose={() => setShowCombinedModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Active Orders</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {activeOrders.length === 0 ? (
            <div className="text-center text-muted">No active orders found.</div>
          ) : (
            <CTable bordered hover responsive>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>Table</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Items</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {activeOrders.map((order) => (
                  <CTableRow key={order._id}>
                    <CTableDataCell>
                      {order.tableNumber}
                      {order.type === 'merged' && (
                        <div>
                          <small className="text-muted">
                            ({order.originalTables?.map(t => `T${t}`).join(', ')})
                          </small>
                        </div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={order.type === 'merged' ? 'info' : 'secondary'}>
                        {order.type === 'merged' ? 'Merged' : 'Individual'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {order.items.slice(0, 3).map((i, idx) => (
                        <div key={idx}>
                          {i.itemName || 'Item'} × {i.quantity || 1}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <small className="text-muted">
                          +{order.items.length - 3} more items
                        </small>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{order.status}</CTableDataCell>
                    <CTableDataCell>₹{order.totalAmount.toFixed(2)}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>
      </CModal>

      {/* Merge Tables Modal */}
      <CModal
        visible={showMergeModal}
        onClose={() => {
          console.log('Closing merge modal')
          setShowMergeModal(false)
          setSelectedMergeTables([])
        }}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Merge Tables</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {tablesWithOrders.length === 0 ? (
            <CAlert color="info">
              No tables with active orders found. Tables must have items in cart to be merged.
            </CAlert>
          ) : (
            <>
              <CAlert color="primary">
                Select 2 or more tables to merge their orders. The merged table will combine all selected orders.
              </CAlert>

              <CTable bordered hover responsive>
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell width="10%">Select</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Table</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Items</CTableHeaderCell>
                    <CTableHeaderCell width="20%">Total Amount</CTableHeaderCell>
                    <CTableHeaderCell width="20%">Duration</CTableHeaderCell>
                    <CTableHeaderCell width="20%">Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {tablesWithOrders.map((table) => (
                    <CTableRow
                      key={table.tableNumber}
                      className={selectedMergeTables.includes(table.tableNumber) ? 'table-active' : ''}
                    >
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedMergeTables.includes(table.tableNumber)}
                          onChange={() => handleTableSelect(table.tableNumber)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>Table {table.tableNumber}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info">{table.totalItems} items</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>₹{table.totalAmount.toFixed(2)}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatTime(table.startTime)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="warning">Active</CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {selectedMergeTables.length > 0 && (
                <CAlert color="success">
                  Selected {selectedMergeTables.length} tables: {selectedMergeTables.map(t => `Table ${t}`).join(', ')}
                </CAlert>
              )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowMergeModal(false)
              setSelectedMergeTables([])
            }}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleMergeConfirm}
            disabled={selectedMergeTables.length < 2 || mergingLoading}
          >
            {mergingLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Merging...
              </>
            ) : (
              `Merge ${selectedMergeTables.length} Tables`
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}

export default POS
