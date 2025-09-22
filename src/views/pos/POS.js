import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getQrs } from '../../redux/slices/qrSlice'
import { getFloors } from '../../redux/slices/floorSlices'
import { fetchCombinedOrders } from '../../redux/slices/orderSlice'
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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBuilding } from '@coreui/icons'

const POS = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { qrList, loading, error } = useSelector((state) => state.qr)
  const { floors: manjil } = useSelector((state) => state.floors)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const theme = useSelector((state) => state.theme.theme)

  console.log("floor manjil =>", manjil)
  const [cart, setCart] = useState({})
  const [showCombinedModal, setShowCombinedModal] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedTables, setSelectedTables] = useState([])

  // Floor management states
  const [selectedFloor, setSelectedFloor] = useState('all')

  // Table merging states
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergedTables, setMergedTables] = useState(() => {
    const saved = localStorage.getItem('mergedTables')
    return saved ? JSON.parse(saved) : []
  })
  const [mergingLoading, setMergingLoading] = useState(false)
  const [selectedMergeTables, setSelectedMergeTables] = useState([])
  const [tablesWithOrders, setTablesWithOrders] = useState([])

  // Helper function to get floor ID consistently from QR object
  const getFloorIdFromQr = (qr) => {
    return qr.floorId?._id || qr.floor
  }

  // Helper function to get floor name from QR object
  const getFloorNameFromQr = (qr) => {
    return qr.floorId?.name || 'N/A'
  }

  // Helper function to derive floor from table number if floor property doesn't exist
  const getFloorFromTable = (tableNumber) => {
    if (tableNumber <= 10) return 1
    if (tableNumber <= 20) return 2
    if (tableNumber <= 30) return 3
    return Math.ceil(tableNumber / 10)
  }

  // Create unique table identifier
  const createTableId = (tableNumber, floorId) => {
    return `${tableNumber}_${floorId}`
  }

  // Parse table identifier to get table number and floor
  const parseTableId = (tableId) => {
    const [tableNumber, floorId] = tableId.split('_')
    return { tableNumber: parseInt(tableNumber), floorId }
  }

  // Debug state changes
  useEffect(() => {
    dispatch(getFloors(restaurantId))
    console.log('showMergeModal changed to:', showMergeModal)
  }, [showMergeModal, restaurantId, dispatch])

  useEffect(() => {
    dispatch(getFloors(restaurantId))
    console.log('showMergeModal changed to:', showMergeModal)
  }, [restaurantId, dispatch])

  // Filter tables based on selected floor ID
  const getTablesForFloor = (floorId) => {
    if (floorId === 'all') return qrList
    return qrList.filter(qr => {
      const tableFloorId = getFloorIdFromQr(qr)
      return tableFloorId === floorId
    })
  }

  // Get merged tables for selected floor ID
  const getMergedTablesForFloor = (floorId) => {
    if (floorId === 'all') return mergedTables
    return mergedTables.filter(merged => {
      return merged.tables.some(tableNum => {
        const tableQr = qrList.find(qr => qr.tableNumber === tableNum)
        if (!tableQr) return false
        const tableFloorId = getFloorIdFromQr(tableQr)
        return tableFloorId === floorId
      })
    })
  }

  // Get table count for each floor by ID
  const getFloorTableCount = (floorId) => {
    const floorTables = getTablesForFloor(floorId)
    console.log('Floor ID:', floorId, 'has', floorTables.length, 'tables')
    const availableTables = floorTables.filter(qr => !isTableMerged(qr.tableNumber))
    const mergedTablesCount = getMergedTablesForFloor(floorId).length
    return {
      total: floorTables.length,
      available: availableTables.length,
      merged: mergedTablesCount,
      occupied: floorTables.filter(qr => isItemInCart(qr) && !isTableMerged(qr.tableNumber)).length
    }
  }

  // Fetch QR codes & restore carts
  useEffect(() => {
    if (qrList.length === 0) {
      dispatch(getQrs(restaurantId))
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

  // Update tables with orders when modal opens - include floor information
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
              floor: getFloorIdFromQr(qr),
              floorName: getFloorNameFromQr(qr),
              tableId: createTableId(qr.tableNumber, getFloorIdFromQr(qr)),
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

  // FIXED: Updated merged table click handler to properly pass data
  const handleMergedTableClick = (mergedTable) => {
    console.log('Navigating to merged table:', mergedTable)
    
    // Create a special identifier for merged tables
    const mergedTableId = `merged_${mergedTable.id}`
    
    // Ensure the cart data is properly stored for the merged table
    const cartData = mergedTable.combinedOrders || []
    localStorage.setItem(`cart_${mergedTableId}`, JSON.stringify(cartData))
    
    // Store the start time if available
    if (mergedTable.startTime) {
      localStorage.setItem(`start_time_${mergedTableId}`, mergedTable.startTime)
    }
    
    // Navigate with proper state and identifier
    navigate(`/pos/tableNumber/${mergedTableId}`, {
      state: {
        isMerged: true,
        mergedTable: mergedTable,
        originalTables: mergedTable.tables,
        mergedTableName: mergedTable.name,
        combinedOrders: mergedTable.combinedOrders || [],
        totalAmount: mergedTable.totalAmount || 0
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

  // Use unique table identifier for selection
  const handleTableSelect = (tableId) => {
    console.log('Table selected:', tableId)
    setSelectedMergeTables(prev =>
      prev.includes(tableId)
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    )
  }

  // FIXED: Enhanced merge confirmation with proper cart management
  const handleMergeConfirm = async () => {
    console.log('Confirming merge for tables:', selectedMergeTables)

    if (selectedMergeTables.length < 2) {
      alert('Please select at least 2 tables to merge.')
      return
    }

    setMergingLoading(true)

    try {
      // Extract table numbers from unique identifiers
      const tableNumbers = selectedMergeTables.map(tableId => {
        const { tableNumber } = parseTableId(tableId)
        return tableNumber
      })

      // Combine all orders from selected tables
      const combinedOrders = []
      let totalAmount = 0
      let earliestStartTime = null

      tableNumbers.forEach(tableNumber => {
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
        name: `Merged (${tableNumbers.map(t => `T${t}`).join(', ')})`,
        tables: tableNumbers,
        combinedOrders,
        totalAmount,
        startTime: earliestStartTime,
        createdAt: new Date().toISOString()
      }

      setMergedTables(prev => [...prev, mergedTable])

      // FIXED: Store merged table cart with proper key format
      const mergedTableId = `merged_${mergedTable.id}`
      localStorage.setItem(`cart_${mergedTableId}`, JSON.stringify(combinedOrders))
      localStorage.setItem(`cart_merged_${mergedTable.id}`, JSON.stringify(combinedOrders))
      
      if (earliestStartTime) {
        localStorage.setItem(`start_time_${mergedTableId}`, earliestStartTime.toISOString())
        localStorage.setItem(`start_time_merged_${mergedTable.id}`, earliestStartTime.toISOString())
      }

      // Clean up individual table carts
      tableNumbers.forEach(tableNumber => {
        localStorage.removeItem(`cart_${tableNumber}`)
        localStorage.removeItem(`start_time_${tableNumber}`)
      })

      const newCart = { ...cart }
      tableNumbers.forEach(tableNumber => {
        delete newCart[tableNumber]
      })
      setCart(newCart)

      setShowMergeModal(false)
      setSelectedMergeTables([])

      alert(`Successfully merged ${tableNumbers.length} tables!`)
    } catch (error) {
      console.error('Error merging tables:', error)
      alert('Failed to merge tables. Please try again.')
    } finally {
      setMergingLoading(false)
    }
  }

  // FIXED: Enhanced unmerge with proper cart restoration
  const handleUnmergeTable = (mergedTable) => {
    if (window.confirm('Are you sure you want to unmerge this table? This will split the orders back to individual tables.')) {
      const ordersPerTable = {}

      // Distribute orders back to original tables
      mergedTable.combinedOrders.forEach((order) => {
        const targetTable = order.originalTable || mergedTable.tables[0]
        if (!ordersPerTable[targetTable]) {
          ordersPerTable[targetTable] = []
        }
        const { originalTable, ...cleanOrder } = order
        ordersPerTable[targetTable].push(cleanOrder)
      })

      // Restore individual table carts
      Object.entries(ordersPerTable).forEach(([tableNumber, orders]) => {
        localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(orders))
        if (mergedTable.startTime) {
          localStorage.setItem(`start_time_${tableNumber}`, mergedTable.startTime)
        }
      })

      const newCart = { ...cart, ...ordersPerTable }
      setCart(newCart)

      setMergedTables(prev => prev.filter(m => m.id !== mergedTable.id))

      // Clean up merged table storage
      const mergedTableId = `merged_${mergedTable.id}`
      localStorage.removeItem(`cart_${mergedTableId}`)
      localStorage.removeItem(`cart_merged_${mergedTable.id}`)
      localStorage.removeItem(`start_time_${mergedTableId}`)
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
    const floorTables = getTablesForFloor(selectedFloor)
    return floorTables.filter(qr => !isTableMerged(qr.tableNumber))
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
        selectedMergeTables = {selectedMergeTables.length},
        selectedFloor = {selectedFloor},
        totalQRs = {qrList.length}
      </div>

      {/* Header with Title + Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Select Table To Generate Bill</h3>
        <div className="d-flex gap-2">
          <CButton color="primary" onClick={fetchActiveOrders}>
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

      {/* Floor Selection Dropdown */}
      <div className="mb-4">
        {console.log(qrList.length, 'total tables loaded')}
        <div className="d-flex align-items-center gap-3">
          <CDropdown>
            <CDropdownToggle variant="outline" size="lg">
              <CIcon icon={cilBuilding} className="me-2" />
              {selectedFloor === 'all'
                ? 'All Floors'
                : manjil.find((f) => f._id === selectedFloor)?.name || 'Select Floor'}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                onClick={() => setSelectedFloor('all')}
                active={selectedFloor === 'all'}
              >
                All Floors
                <CBadge color="secondary" className="ms-2">
                  {qrList.length} tables
                  {console.log('All Floors----->', qrList.length)}
                </CBadge>
              </CDropdownItem>
              <hr className="dropdown-divider" />

              {manjil.map((floor) => {
                const floorStats = getFloorTableCount(floor._id)
                console.log(`Floor ${floor.name} stats:`, floorStats)
                return (
                  <CDropdownItem
                    key={floor._id}
                    onClick={() => setSelectedFloor(floor._id)}
                    active={selectedFloor === floor._id}
                  >
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span>{floor.name}</span>
                      <div className="d-flex gap-1">
                        <CBadge color="secondary">{floorStats.total}</CBadge>
                        {floorStats.occupied > 0 && (
                          <CBadge color="danger">{floorStats.occupied}</CBadge>
                        )}
                        {floorStats.merged > 0 && (
                          <CBadge color="info">{floorStats.merged}M</CBadge>
                        )}
                      </div>
                    </div>
                  </CDropdownItem>
                )
              })}
            </CDropdownMenu>
          </CDropdown>

          {/* Floor Stats */}
          {selectedFloor !== 'all' && (
            <div className="d-flex gap-2 align-items-center">
              <CBadge color="secondary">
                Total: {getFloorTableCount(selectedFloor).total}
              </CBadge>
              <CBadge color="success">
                Available: {getFloorTableCount(selectedFloor).available}
              </CBadge>
              {getFloorTableCount(selectedFloor).occupied > 0 && (
                <CBadge color="danger">
                  Occupied: {getFloorTableCount(selectedFloor).occupied}
                </CBadge>
              )}
              {getFloorTableCount(selectedFloor).merged > 0 && (
                <CBadge color="info">
                  Merged: {getFloorTableCount(selectedFloor).merged}
                </CBadge>
              )}
            </div>
          )}
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
          {getMergedTablesForFloor(selectedFloor).length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">
                Merged Tables {selectedFloor !== 'all' && `- ${manjil.find(f => f._id === selectedFloor)?.name || 'Floor'}`}
              </h5>
              <CRow className="justify-content-start">
                {getMergedTablesForFloor(selectedFloor).map((mergedTable) => (
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
            <h5 className="mb-3">
              Individual Tables {selectedFloor !== 'all' && `- ${manjil.find(f => f._id === selectedFloor)?.name || 'Floor'}`}
            </h5>
            <CRow className="justify-content-start">
              {getAvailableTables().map((qr) => {
                const floorName = getFloorNameFromQr(qr)
                console.log('Rendering table:', qr.tableNumber, 'on floor:', floorName);

                return (
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
                      className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${isItemInCart(qr)
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
                        position: 'relative'
                      }}
                    >
                      {/* Floor badge */}
                      <CBadge
                        color="secondary"
                        className="position-absolute top-0 start-0 m-1"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {floorName}
                      </CBadge>

                      <div className="fw-bold">Table {qr.tableNumber}</div>
                      {isItemInCart(qr) && (
                        <small className="text-center mt-1">
                          {cart[qr.tableNumber]?.length || 0} items
                        </small>
                      )}
                    </CContainer>
                  </CCol>
                )
              })}

              {/* Takeaway - only show on "All Floors" or first floor */}
              {(selectedFloor === 'all' || (manjil.length > 0 && selectedFloor === manjil[0]._id)) && (
                <CCol
                  xs="6"
                  sm="4"
                  md="3"
                  lg="2"
                  xl="2"
                  className="mx-2 mb-4 d-flex justify-content-center"
                >
                  <CContainer
                    className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${theme === 'dark'
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
              )}
            </CRow>
          </div>

          {/* No tables message */}
          {getAvailableTables().length === 0 && getMergedTablesForFloor(selectedFloor).length === 0 && (
            <div className="text-center text-muted py-4">
              <CAlert color="info">
                No tables found for {selectedFloor === 'all' ? 'any floor' : manjil.find(f => f._id === selectedFloor)?.name || 'this floor'}.
              </CAlert>
            </div>
          )}
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
                    <CTableHeaderCell width="10%">Floor</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Items</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Total Amount</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Duration</CTableHeaderCell>
                    <CTableHeaderCell width="15%">Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {tablesWithOrders.map((table) => (
                    <CTableRow
                      key={table.tableId}
                      className={selectedMergeTables.includes(table.tableId) ? 'table-active' : ''}
                    >
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedMergeTables.includes(table.tableId)}
                          onChange={() => handleTableSelect(table.tableId)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>Table {table.tableNumber}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info">
                          {table.floorName || manjil.find(f => f._id === table.floor)?.name || 'Floor ' + table.floor}
                        </CBadge>
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
                  Selected {selectedMergeTables.length} tables: {selectedMergeTables.map(tableId => {
                    const { tableNumber } = parseTableId(tableId)
                    return `Table ${tableNumber}`
                  }).join(', ')}
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