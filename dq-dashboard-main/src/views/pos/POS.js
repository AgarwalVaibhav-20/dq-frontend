import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchQrCodes } from '../../redux/slices/qrSlice'
import { CContainer, CCol, CRow, CSpinner } from '@coreui/react'

const POS = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { qrList, loading, error } = useSelector((state) => state.qr)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const theme = useSelector((state) => state.theme.theme)

  // State to track the cart for each table
  const [cart, setCart] = useState({})

  // Fetch QR codes only once on component mount
  useEffect(() => {
    // Make sure the API call is only made once
    if (qrList.length === 0) {
      dispatch(fetchQrCodes(restaurantId))
    }

    // Initialize the cart state from localStorage
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

  return (
    <CContainer className="py-2">
      <h3 className="text-center mb-4">Select Table To Generate Bill</h3>
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
              xl="2" // Adjust for responsiveness
              className="mx-2 mb-4 d-flex justify-content-center"
            >
              <CContainer
                 className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${
                  isItemInCart(qr) ? 'bg-danger text-white' : theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'
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
          <CCol
            xs="6"
            sm="4"
            md="3"
            lg="2"
            xl="2" // Adjust for responsiveness
            className="mx-2 mb-4 d-flex justify-content-center"
          >
            <CContainer
             className={`d-flex flex-column align-items-center justify-content-center shadow-lg border rounded p-3 w-100 ${
              theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'
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
    </CContainer>
  )
}

export default POS
