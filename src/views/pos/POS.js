import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getQrs } from '../../redux/slices/qrSlice'
import { getFloors } from '../../redux/slices/floorSlices'
import { fetchCombinedOrders } from '../../redux/slices/orderSlice'
import {
  createTransaction,
  fetchTransactionDetails,
  createCashInTransaction,
  createCashOutTransaction,
  createBankInTransaction,
  // 👇 ADDED: Bank Out Transaction Import
  createBankOutTransaction,
  getDailyCashBalance
} from '../../redux/slices/transactionSlice'
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
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBuilding, cilMoney, cilPlus, cilMinus, cilCash, cilNotes } from '@coreui/icons'

const POS = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dailyCashBalance, transactions, dailyTransactionCount, cashLoading } = useSelector((state) => state.transactions);
  console.log("bhai ka trans ", transactions);
  const { qrList, loading, error } = useSelector((state) => state.qr)
  const { floors: manjil } = useSelector((state) => state.floors)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const resturantIdLocalStorage = localStorage.getItem('restaurantId')
  const userId = useSelector((state) => state.auth.userId)
  const username = useSelector((state) => state.auth.username)
  const theme = useSelector((state) => state.theme.theme)
  const token = localStorage.getItem('authToken')

  const [cart, setCart] = useState({})
  const [showCombinedModal, setShowCombinedModal] = useState(false)
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedTables, setSelectedTables] = useState([])

  // Table merging states
  const [showMergeModal, setShowMergeModal] = useState(false)
  let tableOccupyColor = ''
  const [mergedTables, setMergedTables] = useState(() => {
    const saved = localStorage.getItem('mergedTables')
    return saved ? JSON.parse(saved) : []
  })
  const [mergingLoading, setMergingLoading] = useState(false)
  const [selectedMergeTables, setSelectedMergeTables] = useState([])
  const [tablesWithOrders, setTablesWithOrders] = useState([])

  // Cash Management States
  const [showCashInModal, setShowCashInModal] = useState(false)
  const [showCashOutModal, setShowCashOutModal] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [cashAmountNotes, setCashAmountNotes] = useState('')

  // Bank Balance States (In)
  const [showBankInModal, setShowBankInModal] = useState(false);
  const [bankAmount, setBankAmount] = useState('');
  const [bankAmountNotes, setBankAmountNotes] = useState('');
  
  // 👇 ADDED: Bank Out States
  const [showBankOutModal, setShowBankOutModal] = useState(false);
  const [bankOutAmount, setBankOutAmount] = useState(''); 
  const [bankOutNotes, setBankOutNotes] = useState(''); 

  const [paymentBreakdown, setPaymentBreakdown] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const calculatePaymentBreakdown = (transactions) => {
    if (!transactions || transactions.length === 0) return {};

    const breakdown = transactions.reduce((acc, transaction) => {
        // Updated to handle 'bank_in' and 'bank_out' types
        const type = transaction.type; 
        // Note: For cash_out/bank_out, amount might be stored as positive total/amount in DB.
        const amount = transaction.total || transaction.amount || 0; 
        
        let cleanType;

        if (type === 'cash_in') {
            cleanType = 'Cash In (Net)';
        } else if (type === 'cash_out') {
            cleanType = 'Cash Out (Net)';
        } else if (type === 'bank_in') { 
            cleanType = 'Bank In';
        } else if (type === 'bank_out') { 
            cleanType = 'Bank Out';
        } 
        else {
            cleanType = type; 
        }

        // Use Math.abs() to ensure the value is added correctly in the breakdown object
        if (Math.abs(amount) > 0) { 
             acc[cleanType] = (acc[cleanType] || 0) + Math.abs(amount);
        }
       
        return acc;
    }, {});
    
    return breakdown;
  };

  const handleCashIn = async () => {
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      // Create the cash in transaction
      await dispatch(createCashInTransaction({
        total: parseFloat(cashAmount),
        token,
        userId,
        restaurantId,
        username,
        notes: cashAmountNotes,
        type: 'cash_in' // Ensure type is explicitly set for clarity
      })).unwrap()

      // Reset form
      setCashAmount('')
      setCashAmountNotes('')
      setShowCashInModal(false)

      // IMPORTANT: Refresh the daily cash balance from server
      await dispatch(getDailyCashBalance({
        token,
        restaurantId
      }))

    } catch (error) {
      console.log("error is here...", error)
      console.error('Cash in error:', error)
    }
  }

  const handleCashOut = async () => {
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const amount = parseFloat(cashAmount)

    // Use the current balance from Redux state
    if (amount > (dailyCashBalance || 0)) {
      alert('Cannot cash out more than available daily transaction amount')
      return
    }

    try {
      // Create the cash out transaction
      await dispatch(createCashOutTransaction({
        amount: amount,
        token,
        userId,
        restaurantId,
        username,
        notes: cashAmountNotes,
        type: 'cash_out' // Ensure type is explicitly set for clarity
      })).unwrap()

      // Reset form
      setCashAmount('')
      setCashAmountNotes('')
      setShowCashOutModal(false)

      // IMPORTANT: Refresh the daily cash balance from server
      await dispatch(getDailyCashBalance({
        token,
        restaurantId
      }))

    } catch (error) {
      console.error('Cash out error:', error)
    }
  }

  // Bank In Function
  const handleBankIn = async () => {
    if (!bankAmount || parseFloat(bankAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      // ✅ Using the dedicated Redux action for Bank In
      await dispatch(createBankInTransaction({
        total: parseFloat(bankAmount),
        token,
        userId,
        restaurantId,
        username,
        notes: bankAmountNotes,
        type: 'bank_in' 
      })).unwrap()

      // Reset form
      setBankAmount('');
      setBankAmountNotes('');
      setShowBankInModal(false);

      // IMPORTANT: Refresh the daily cash balance from server
      await dispatch(getDailyCashBalance({
        token,
        restaurantId
      }))

    } catch (error) {
      console.error('Bank In error:', error)
    }
  }
  
  // 👇 ADDED: Bank Out Function
  const handleBankOut = async () => {
    if (!bankOutAmount || parseFloat(bankOutAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      // ✅ Using the dedicated Redux action for Bank Out
      await dispatch(createBankOutTransaction({
        amount: parseFloat(bankOutAmount),
        token,
        userId,
        restaurantId,
        username,
        notes: bankOutNotes,
        type: 'bank_out' 
      })).unwrap()

      // Reset form
      setBankOutAmount('');
      setBankOutNotes('');
      setShowBankOutModal(false);

      // IMPORTANT: Refresh the daily cash balance from server
      await dispatch(getDailyCashBalance({
        token,
        restaurantId
      }))

    } catch (error) {
      console.error('Bank Out error:', error)
      alert(`Bank Out Failed: ${error.message || 'Check console.'}`)
    }
  }
  // 👆 END ADDED
  
  const formatBalance = (balance) => {
    if (balance === null || balance === undefined || isNaN(balance)) {
      return '0.00'
    }
    return Number(balance).toFixed(2)
  }

  // Also update your initial balance fetch useEffect
  useEffect(() => {
    if (restaurantId && token) {
      // Initial load of daily cash balance
      dispatch(getDailyCashBalance({
        token,
        restaurantId
      }))
    }
  }, [dispatch, restaurantId, token])

   useEffect(() => {
    if (transactions) {
        const breakdown = calculatePaymentBreakdown(transactions);
        setPaymentBreakdown(breakdown);
    } else {
        setPaymentBreakdown({});
    }
  }, [transactions]); 

  useEffect(() => {
    dispatch(getFloors(resturantIdLocalStorage))
  }, [showMergeModal, resturantIdLocalStorage, dispatch])

  useEffect(() => {
    dispatch(getFloors(resturantIdLocalStorage))
  }, [resturantIdLocalStorage, dispatch])

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
      dispatch(getQrs({restaurantId:resturantIdLocalStorage}))

    }

    const storedCarts = {}
    qrList.forEach((qr) => {
      const savedCart = localStorage.getItem(`cart_${qr.tableNumber}`)
      if (savedCart) {
        storedCarts[qr.tableNumber] = JSON.parse(savedCart)
      }
    })
    setCart(storedCarts)
  }, [dispatch, resturantIdLocalStorage, qrList.length])

  // Update tables with orders when modal opens - include floor information
  useEffect(() => {
    if (showMergeModal) {
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

      setTablesWithOrders(activeTablesData)
    }
  }, [showMergeModal, qrList])

  // Save merged tables to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mergedTables', JSON.stringify(mergedTables))
  }, [mergedTables])

  const  handleQrClick = (qr) => {
    navigate(`/pos/system/tableNumber/${qr.tableNumber}`)
  }

  // FIXED: Updated merged table click handler to properly pass data
  const handleMergedTableClick = (mergedTable) => {

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
    navigate(`/pos/system/tableNumber/${mergedTableId}`, {
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

  const shouldTableBeRed = (qr) => {
    const savedSystem = localStorage.getItem(`selectedSystem_${qr.tableNumber}`)
    let systemWillOccupy = false // Default to false if no system

    if (savedSystem) {
      const system = JSON.parse(savedSystem)
      tableOccupyColor = system.color
      try {
        systemWillOccupy = system.willOccupy === true && cart[qr.tableNumber]?.length
        // console.log("system, =>",cart[qr.tableNumber])
      } catch (error) {
        console.error('Error parsing saved system for table', qr.tableNumber, ':', error)
        systemWillOccupy = false // Default to false on parsing error
      }
    }

    // Table should be red only if willOccupy is true, regardless of cart items
    return systemWillOccupy
  }

  const isTableMerged = (tableNumber) => {
    // console.log("merged tables =>",mergedTables.some(merged => merged.tables.includes(Number(tableNumber))))
    // console.log("ok isTableMerged =>", tableNumber +" table =>",(mergedTables.some(merged =>
    //   merged.tables.includes(tableNumber)
    // )))
    return mergedTables.some(merged =>
      merged.tables.includes(Number(tableNumber))
    )
  }

  const handleMergeTablesClick = () => {
    setSelectedMergeTables([])
    setShowMergeModal(true)
  }

  // Use unique table identifier for selection
  const handleTableSelect = (tableId) => {
    setSelectedMergeTables(prev =>
      prev.includes(tableId)
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    )
  }

  // FIXED: Enhanced merge confirmation with proper cart management
  const handleMergeConfirm = async () => {

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

      // Generate merge name based on table numbers (e.g., Merge12, Merge23)
      const sortedTableNumbers = tableNumbers.sort((a, b) => a - b)
      const mergeName = `Merge${sortedTableNumbers.join('')}`

      const mergedTable = {
        id: `merged_${Date.now()}`,
        name: mergeName,
        originalTables: tableNumbers.map(t => `T${t}`).join(', '),
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

      alert(`Successfully merged tables ${tableNumbers.join(', ')} into ${mergeName}!`)
    } catch (error) {
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

 const getAvailableTables = (floorId) => {
  const floorTables = getTablesForFloor(floorId) // Now uses the passed floorId
  // console.log("floor id here get available tables ", floorId)
  // console.log("available tabkles =>", floorTables.filter(qr => !isTableMerged(qr.tableNumber)))
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
    <CContainer className="py-2 px-2 px-md-3">
      {/* Mobile Responsive Header */}
      <div className="mb-4">
        {/* Title Section - Mobile Responsive */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
          <div className="mb-2 mb-md-0">
            <h3 className="mb-0 text-center text-md-start">Select Table To Generate Bill</h3>
          </div> 
          
          {/* Mobile Responsive Button Groups */}
          <div className="w-100 d-md-none">
            {/* Mobile: Stack buttons vertically */}
            <div className="d-flex flex-column gap-2">
              {/* Cash Management Row */}
              <div className="d-flex gap-2 justify-content-center">
                <CButton
                  color="success"
                  variant="outline"
                  onClick={() => setShowCashInModal(true)}
                  className="d-flex align-items-center gap-1 flex-fill"
                  disabled={cashLoading}
                  size="sm"
                >
                  <CIcon icon={cilPlus} size="sm" />
                  <span className="d-none d-sm-inline">Cash In</span>
                  <span className="d-sm-none">In</span>
                </CButton>
                <CButton
                  color="danger"
                  variant="outline"
                  onClick={() => setShowCashOutModal(true)}
                  className="d-flex align-items-center gap-1 flex-fill"
                  disabled={cashLoading}
                  size="sm"
                >
                  <CIcon icon={cilMinus} size="sm" />
                  <span className="d-none d-sm-inline">Cash Out</span>
                  <span className="d-sm-none">Out</span>
                </CButton>
              </div>
              
              {/* Action Buttons Row */}
              <div className="d-flex gap-2">
                {/* Bank In Button (Mobile) */}
                <CButton
                  color="warning"
                  variant="outline"
                  onClick={() => setShowBankInModal(true)}
                  className="d-flex align-items-center gap-1 flex-fill"
                  disabled={cashLoading}
                  size="sm"
                >
                  <CIcon icon={cilMoney} size="sm" />
                  <span className="d-none d-sm-inline">Bank In</span>
                  <span className="d-sm-none">Bank</span>
                </CButton>
                
                {/* Bank Out Button (Mobile) */}
                <CButton
                  color="info"
                  variant="outline"
                  onClick={() => setShowBankOutModal(true)}
                  className="d-flex align-items-center gap-1 flex-fill"
                  disabled={cashLoading}
                  size="sm"
                >
                  <CIcon icon={cilMinus} size="sm" />
                  <span className="d-none d-sm-inline">Bank Out</span>
                  <span className="d-sm-none">B. Out</span>
                </CButton>

                <CButton 
                  color="primary" 
                  onClick={fetchActiveOrders}
                  className="flex-fill"
                  size="sm"
                >
                  <span className="d-none d-sm-inline">All Orders</span>
                  <span className="d-sm-none">Orders</span>
                </CButton>
                <CButton
                  color="success"
                  onClick={handleMergeTablesClick}
                  className="flex-fill"
                  size="sm"
                >
                  <span className="d-none d-sm-inline">Merge Tables</span>
                  <span className="d-sm-none">Merge</span>
                </CButton>
              </div>
            </div>
          </div>
          
          {/* Desktop: Original horizontal layout */}
          <div className="d-none d-md-flex flex-column gap-2">
            {/* Cash Management Buttons */}
            <div className='d-flex gap-2'>
              <CButton
                color="success"
                variant="outline"
                onClick={() => setShowCashInModal(true)}
                className="d-flex align-items-center gap-1"
                disabled={cashLoading}
              >
                <CIcon icon={cilPlus} size="sm" />
                Cash In
              </CButton>
            <CDropdown
                  variant="btn-group"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  show={isDropdownOpen} // Mouse over पर show होगा
              >
                  <CDropdownToggle
                      color="info"
                      size="lg"
                      className="d-flex align-items-center gap-1 p-2"
                      caret={false} // Arrow हटा दें
                      style={{ cursor: 'default' }}
                  >
                      <CIcon icon={cilCash} />
                      Daily Balance: ₹{formatBalance(dailyCashBalance)}
                      {cashLoading && <CSpinner size="sm" className="ms-1" />}
                  </CDropdownToggle>

                  <CDropdownMenu className='p-2'>
                      <CDropdownItem header className='fw-bold'>Cash Breakdown</CDropdownItem>
                      <hr className="dropdown-divider" />
                      {cashLoading ? (
                          <CDropdownItem disabled>
                              <CSpinner size="sm" className="me-2" /> Loading...
                          </CDropdownItem>
                      ) : (
                          Object.entries(paymentBreakdown).map(([type, amount]) => (
                              <CDropdownItem key={type} className={`text-${type.includes('In') ? 'success' : 'danger'}`}>
                                  <div className="d-flex justify-content-between w-100">
                                      <strong>{type}</strong>
                                      <span>₹{formatBalance(amount)}</span>
                                  </div>
                              </CDropdownItem>
                          ))
                      )}
                      {Object.keys(paymentBreakdown).length === 0 && (
                          <CDropdownItem disabled>No transactions yet</CDropdownItem>
                      )}
                  </CDropdownMenu>
              </CDropdown>
              <CButton
                color="danger"
                variant="outline"
                onClick={() => setShowCashOutModal(true)}
                className="d-flex align-items-center gap-1"
                disabled={cashLoading}
              >
                <CIcon icon={cilMinus} size="sm" />
                Cash Out
              </CButton>
            </div>
            <div className='d-flex gap-2'>
                {/* Bank In Button (Desktop) */}
                <CButton
                  color="warning"
                  variant="outline"
                  onClick={() => setShowBankInModal(true)}
                  className="d-flex align-items-center gap-1"
                  disabled={cashLoading}
                >
                  <CIcon icon={cilMoney} size="sm" />
                  Bank In
                </CButton>
                
                {/* Bank Out Button (Desktop) */}
                <CButton
                  color="info"
                  variant="outline"
                  onClick={() => setShowBankOutModal(true)}
                  className="d-flex align-items-center gap-1"
                  disabled={cashLoading}
                >
                  <CIcon icon={cilMinus} size="sm" />
                  Bank Out
                </CButton>

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
        </div>
        
        {/* Mobile: Daily Balance Badge */}
        <div className="d-md-none text-center mb-3">
         <CDropdown
              variant="btn-group"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
              show={isDropdownOpen}
          >
              <CDropdownToggle
                  color="info"
                  size="lg"
                  className="d-flex align-items-center gap-1 justify-content-center p-2"
                  caret={false}
                  style={{ cursor: 'default' }}
              >
                  <CIcon icon={cilCash} />
                  Daily Balance: ₹{formatBalance(dailyCashBalance)}
                  {cashLoading && <CSpinner size="sm" className="ms-1" />}
              </CDropdownToggle>

              <CDropdownMenu className='p-2'>
                  <CDropdownItem header className='fw-bold'>Cash Breakdown</CDropdownItem>
                  <hr className="dropdown-divider" />
                  {cashLoading ? (
                      <CDropdownItem disabled>
                          <CSpinner size="sm" className="me-2" /> Loading...
                      </CDropdownItem>
                  ) : (
                      Object.entries(paymentBreakdown).map(([type, amount]) => (
                          <CDropdownItem key={type} className={`text-${type.includes('In') ? 'success' : 'danger'}`}>
                              <div className="d-flex justify-content-between w-100">
                                  <strong>{type}</strong>
                                  <span>₹{formatBalance(amount)}</span>
                              </div>
                          </CDropdownItem>
                      ))
                  )}
                  {Object.keys(paymentBreakdown).length === 0 && (
                      <CDropdownItem disabled>No transactions yet</CDropdownItem>
                  )}
              </CDropdownMenu>
          </CDropdown>
        </div>
      </div>

      {/* Floor Selection Dropdown */}
      {/* ... (Floor Selection code is commented out) ... */}

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : (
        // ADD THIS NEW LOGIC
        <>

          {/* Merged Tables Section - Mobile Responsive */}
          {mergedTables.length > 0 && (
            <div className="mb-5">
              <h4 className="fw-bold mb-3 border-bottom pb-2 text-center text-md-start">Merged Tables ({mergedTables.length})</h4>
              <CRow className="justify-content-center justify-content-md-start">
                {mergedTables.map((mergedTable) => (
                  <CCol
                    key={mergedTable.id}
                    xs="6" sm="4" md="3" lg="2" xl="2"
                    className="mb-3 mb-md-4 d-flex justify-content-center"
                  >
                    <div
                      className={`table-card d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-2 p-md-3 w-100 ${
                        theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'
                      }`}
                      onClick={() => handleMergedTableClick(mergedTable)}
                      style={{ 
                        cursor: 'pointer', 
                        position: 'relative',
                        minHeight: '8rem'
                      }}
                    >
                      <CBadge 
                        color="info" 
                        className="position-absolute top-0 start-0 m-1 badge-mobile"
                      >
                        MERGED
                      </CBadge>
                      <div className="fw-bold text-center table-title">
                        {mergedTable.name}
                      </div>
                      <small className="text-center mt-1 table-subtitle">
                        ({mergedTable.originalTables || mergedTable.tables?.map(t => `T${t}`).join(', ')})
                      </small>
                      {mergedTable.combinedOrders?.length > 0 && (
                        <small className="text-center mt-1 table-subtitle">
                          {mergedTable.combinedOrders.length} items
                        </small>
                      )}
                    </div>
                  </CCol>
                ))}
              </CRow>
            </div>
          )}

          {/* Loop through each floor and create a section for it */}
          {manjil.map((floor) => {
            // Get the tables specifically for this floor in the loop
            const availableFloorTables = getAvailableTables(floor._id);

            // If there are no tables for this floor, don't render the section
            if (availableFloorTables.length === 0) {
              return null;
            }

            return (
              <div key={floor._id} className="mb-5">
                {/* Floor Header - Mobile Responsive */}
                <h4 className="fw-bold mb-3 border-bottom pb-2 text-center text-md-start">Floor: {floor.name}</h4>

                {/* Individual Tables for this Floor - Mobile Responsive */}
                <div>
                  <CRow className="justify-content-center justify-content-md-start">
                    {availableFloorTables.map((qr, index) => {
                      const floorName = getFloorNameFromQr(qr);
                      return (
                        <CCol
                          key={index}
                          xs="6" sm="4" md="3" lg="2" xl="2"
                          className="mb-3 mb-md-4 d-flex justify-content-center"
                        >
                          <div
                            className={`table-card d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-2 p-md-3 w-100 ${
                              shouldTableBeRed(qr)
                                ? ' text-dark'
                                : theme === 'dark'
                                ? 'bg-secondary text-white'
                                : 'bg-white text-dark'
                            }`}
                            onClick={() => handleQrClick(qr)}
                            style={{ 
                              cursor: 'pointer', 
                              width: '100%', 
                              position: 'relative', 
                              backgroundColor: shouldTableBeRed(qr) ? tableOccupyColor : '',
                              minHeight: '8rem'
                            }}
                          >
                            <CBadge 
                              color="secondary" 
                              className="position-absolute top-0 start-0 m-1 badge-mobile"
                            >
                              {floorName}
                            </CBadge>
                            <div className="fw-bold text-center table-title">
                              Table {qr.tableNumber}
                            </div>
                            {isItemInCart(qr) && (
                              <small className="text-center mt-1 table-subtitle">
                                {cart[qr.tableNumber]?.length || 0} items
                              </small>
                            )}
                          </div>
                        </CCol>
                      );
                    })}
                  </CRow>
                </div>
              </div>
            );
          })}

          {/* Takeaway Section - Mobile Responsive */}
          <div className="mb-5">
              <h4 className="fw-bold mb-3 border-bottom pb-2 text-center text-md-start">Other Options</h4>
              <CRow className="justify-content-center justify-content-md-start">
                <CCol xs="6" sm="4" md="3" lg="2" xl="2" className="mb-3 mb-md-4 d-flex justify-content-center">
                    <div
                      className={`table-card d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-2 p-md-3 w-100 ${
                        theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'
                      }`}
                      onClick={() => navigate('/pos/system/tableNumber/0')}
                      style={{ 
                        cursor: 'pointer', 
                        width: '100%',
                        minHeight: '8rem'
                      }}
                    >
                      <div className="fw-bold text-center table-title">
                        Takeaway
                      </div>
                    </div>
                </CCol>
              </CRow>
          </div>
        </>
      )}

      
      <CModal
        visible={showCashInModal}
        onClose={() => {
          setShowCashInModal(false)
          setCashAmount('')
          setCashAmountNotes('')
        }}
        size="md"
        backdrop="static"
        className="modal-mobile-responsive"
      >
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilPlus} />
            Cash In
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="cashInAmount">Amount *</CFormLabel>
              <CFormInput
                type="number"
                id="cashInAmount"
                placeholder="Enter amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                min="0"
                step="0.01"
                disabled={cashLoading}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="cashInAmount">Notes </CFormLabel>
              <CFormInput
                type="string"
                id="cashInAmountNotes"
                placeholder="Enter any note"
                value={cashAmountNotes}
                onChange={(e) => setCashAmountNotes(e.target.value)}
                disabled={cashLoading}
              />
            </div>
            <CAlert color="info">
              Current Daily Transaction: ₹{dailyCashBalance.toFixed(2)}
            </CAlert>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowCashInModal(false)
              setCashAmount('')
              setCashAmountNotes('')
            }}
            disabled={cashLoading}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleCashIn}
            disabled={!cashAmount || parseFloat(cashAmount) <= 0 || cashLoading}
          >
            {cashLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Add Cash In'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
 
      <CModal
        visible={showCashOutModal}
        onClose={() => {
          setShowCashOutModal(false)
          setCashAmount('')
          setCashAmountNotes('')
        }}
        size="md"
        backdrop="static"
        className="modal-mobile-responsive"
      >
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilMinus} />
            Cash Out
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="cashOutAmount">Amount *</CFormLabel>
              <CFormInput
                type="number"
                id="cashOutAmount"
                placeholder="Enter amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                min="0"
                max={dailyCashBalance}
                step="0.01"
                disabled={cashLoading}
              />
              <small className="text-muted">
                Maximum available: ₹{dailyCashBalance.toFixed(2)}
              </small>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="cashOutAmount">Notes</CFormLabel>
              <CFormInput
                type="string"
                id="cashOutAmountNotes"
                placeholder="Enter any note"
                value={cashAmountNotes}
                onChange={(e) => setCashAmountNotes(e.target.value)}
                disabled={cashLoading}
              />
            </div>
            <CAlert color="warning">
              Current Daily Transaction: ₹{dailyCashBalance.toFixed(2)}
            </CAlert>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowCashOutModal(false)
              setCashAmount('')
              setCashAmountNotes('')
            }}
            disabled={cashLoading}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={handleCashOut}
            disabled={!cashAmount || parseFloat(cashAmount) <= 0 || parseFloat(cashAmount) > dailyCashBalance || cashLoading}
          >
            {cashLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Cash Out'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
 
      <CModal
        visible={showBankInModal}
        onClose={() => {
          setShowBankInModal(false)
          setBankAmount('')
          setBankAmountNotes('')
        }}
        size="md"
        backdrop="static"
        className="modal-mobile-responsive"
      >
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilMoney} />
            Add Bank Balance (Bank In)
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="bankInAmount">Amount to Deposit *</CFormLabel>
              <CFormInput
                type="number"
                id="bankInAmount"
                placeholder="Enter bank deposit amount"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                min="0"
                step="0.01"
                disabled={cashLoading}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="bankInAmountNotes">Notes (e.g., Bank Transfer, UPI)</CFormLabel>
              <CFormInput
                type="string"
                id="bankInAmountNotes"
                placeholder="Enter any note"
                value={bankAmountNotes}
                onChange={(e) => setBankAmountNotes(e.target.value)}
                disabled={cashLoading}
              />
            </div>
            <CAlert color="info">
              This amount will be tracked as a Bank deposit.
            </CAlert>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowBankInModal(false)
              setBankAmount('')
              setBankAmountNotes('')
            }}
            disabled={cashLoading}
          >
            Cancel
          </CButton>
          <CButton
            color="warning"
            onClick={handleBankIn}
            disabled={!bankAmount || parseFloat(bankAmount) <= 0 || cashLoading}
          >
            {cashLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Deposit to Bank'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={showBankOutModal}
        onClose={() => {
          setShowBankOutModal(false)
          setBankOutAmount('')
          setBankOutNotes('')
        }}
        size="md"
        backdrop="static"
        className="modal-mobile-responsive"
      >
        <CModalHeader>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilMinus} />
            Bank Withdrawal (Bank Out)
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="bankOutAmount">Amount to Withdraw *</CFormLabel>
              <CFormInput
                type="number"
                id="bankOutAmount"
                placeholder="Enter bank withdrawal amount"
                value={bankOutAmount}
                onChange={(e) => setBankOutAmount(e.target.value)}
                min="0"
                step="0.01"
                disabled={cashLoading}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="bankOutNotes">Notes (e.g., ATM withdrawal, Vendor payment)</CFormLabel>
              <CFormInput
                type="string"
                id="bankOutNotes"
                placeholder="Enter payment reason/note"
                value={bankOutNotes}
                onChange={(e) => setBankOutNotes(e.target.value)}
                disabled={cashLoading}
              />
            </div>
            <CAlert color="warning">
              This amount will be tracked as a Bank withdrawal/expense.
            </CAlert>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowBankOutModal(false)
              setBankOutAmount('')
              setBankOutNotes('')
            }}
            disabled={cashLoading}
          >
            Cancel
          </CButton>
          <CButton
            color="info" // या कोई और रंग
            onClick={handleBankOut}
            disabled={!bankOutAmount || parseFloat(bankOutAmount) <= 0 || cashLoading}
          >
            {cashLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Withdraw from Bank'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
 
      <CModal
        visible={showCombinedModal}
        onClose={() => setShowCombinedModal(false)}
        size="lg"
        className="modal-mobile-responsive"
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
 
      <CModal
        visible={showMergeModal}
        onClose={() => {
          setShowMergeModal(false)
          setSelectedMergeTables([])
        }}
        size="lg"
        backdrop="static"
        className="modal-mobile-responsive"
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
                  {tablesWithOrders.map((table, index) => (
                    <CTableRow
                      key={index}
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
            disabled={mergingLoading}
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