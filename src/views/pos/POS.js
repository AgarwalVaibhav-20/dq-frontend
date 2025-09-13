import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchQrCodes } from '../../redux/slices/qrSlice'
import {fetchCombinedOrders} from '../../redux/slices/orderSlice'
// import { mergeOrders } from '../../redux/slices/orderSlice' // 👈 use thunk here
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

  const handleQrClick = (qr) => {
    navigate(`/pos/tableNumber/${qr.tableNumber}`)
  }

  const isItemInCart = (qr) => {
    return cart[qr.tableNumber] && cart[qr.tableNumber].length > 0
  }

  // Dummy fetch active orders (replace with API)
  const fetchActiveOrders = async () => {
    const orders = []
    Object.keys(cart).forEach((tableNumber) => {
      if (cart[tableNumber].length > 0) {
        orders.push({
          _id: `ORD-${tableNumber}-${Date.now()}`,
          tableNumber,
          items: cart[tableNumber],
          status: 'active',
          totalAmount: cart[tableNumber].reduce(
            (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
            0
          ),
        })
      }
    })

    setActiveOrders(orders)
    setSelectedTables([]) // reset selection
    setShowCombinedModal(true)
  }

  // Toggle table selection
  const toggleSelectTable = (tableNumber) => {
    setSelectedTables((prev) =>
      prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber]
    )
  }

  // Handle combine (merge) orders
  const handleCombineOrders = () => {
    if (selectedTables.length < 2) {
      alert('Please select at least 2 tables to combine.')
      return
    }

    // Dispatch thunk -> API call
    dispatch(fetchCombinedOrders({ restaurantId, tableNumbers: selectedTables }))
    setShowCombinedModal(false)
  }

  return (
    <CContainer className="py-2">
      {/* Header with Title + Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Select Table To Generate Bill</h3>
        <div>
          <CButton color="primary" className="me-2" onClick={fetchActiveOrders}>
            All Order
          </CButton>
          <CButton color="success">Merge Table</CButton>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : error ? (
        <div className="text-danger text-center">{error}</div>
      ) : (
        <CRow className="justify-content-start">
          {qrList.map((qr) => (
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
                  <CTableHeaderCell>Items</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {activeOrders.map((order) => (
                  <CTableRow key={order._id}>
                    <CTableDataCell>{order.tableNumber}</CTableDataCell>
                    <CTableDataCell>
                      {order.items.map((i, idx) => (
                        <div key={idx}>
                          {i.itemName || 'Item'} × {i.quantity || 1}
                        </div>
                      ))}
                    </CTableDataCell>
                    <CTableDataCell>{order.status}</CTableDataCell>
                    <CTableDataCell>₹{order.totalAmount}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>
      </CModal>
    </CContainer>
  )
}

export default POS
