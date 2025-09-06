
import React from 'react';
import { CCard, CCardHeader, CCardBody, CButton, CRow, CCol } from '@coreui/react';
import { cilPlus, cilTrash, cilMinus, cilPeople } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

const Cart = ({
  selectedCustomerName,
  setShowCustomerModal,
  startTime,
  elapsedTime,
  cart,
  handleDeleteClick,
  tax,
  calculateTaxAmount,
  discount,
  calculateDiscountAmount,
  roundOffer,
  setShowTaxModal,
  setShowDiscountModal,
  setShowRoundOffModal,
  calculateTotal,
  handleQuantityChange,
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <CCard className="shadow-lg h-100" style={{ borderRadius: '15px' }}>
      <CCardHeader className="bg-white d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px', borderBottom: '1px solid #dee2e6' }}>
        <div className="d-flex align-items-center">
          <CIcon icon={cilPeople} className="me-2 text-primary" />
          <span className="fw-bold fs-5">{selectedCustomerName || 'Walk-in Customer'}</span>
        </div>
        <CButton color="primary" shape="circle" size="sm" onClick={() => setShowCustomerModal(true)}>
          <CIcon icon={cilPlus} />
        </CButton>
      </CCardHeader>

      {startTime && (
        <div className="bg-light text-center py-2 fw-bold text-dark">
          Time: {formatTime(elapsedTime)}
        </div>
      )}

      <CCardBody className="d-flex flex-column p-3">
        <div style={{ maxHeight: '45vh', overflowY: 'auto', flexGrow: 1 }} className="custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
              <p className="m-0">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="d-flex justify-content-between align-items-center mb-3 p-2 border-bottom"
              >
                <div style={{ flex: '1 1 0%' }}>
                  <h6 className="mb-0 fw-bold">{item.itemName}</h6>
                  {/* Ensure item.price is treated as a number */}
                  <small className="text-muted">₹{Number(item.price).toFixed(2)} per item</small>
                </div>
                <div className="d-flex align-items-center mx-3">
                  <CButton variant="outline" color="dark" size="sm" shape="circle" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                    <CIcon icon={cilMinus} />
                  </CButton>
                  <span className="mx-3 fw-bold fs-5">{item.quantity}</span>
                  <CButton variant="outline" color="dark" size="sm" shape="circle" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                    <CIcon icon={cilPlus} />
                  </CButton>
                </div>
                {/* Ensure calculation is done on numbers */}
                <span className="fw-bold me-3" style={{ minWidth: '60px', textAlign: 'right' }}>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDeleteClick(item)}>
                  <CIcon icon={cilTrash} />
                </CButton>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Subtotal</span>
            <span>₹{cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0).toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Tax ({tax}%)</span>
            <span>₹{calculateTaxAmount().toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Discount ({discount}%)</span>
            <span className="text-danger">- ₹{calculateDiscountAmount().toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Round Off</span>
            <span className="text-danger">- ₹{Number(roundOffer).toFixed(2)}</span>
          </div>
          <hr />
          <CRow className="g-2 my-2">
            <CCol><CButton color="light" className="w-100 shadow-sm" onClick={() => setShowTaxModal(true)}>Tax</CButton></CCol>
            <CCol><CButton color="light" className="w-100 shadow-sm" onClick={() => setShowDiscountModal(true)}>Discount</CButton></CCol>
            <CCol><CButton color="light" className="w-100 shadow-sm" onClick={() => setShowRoundOffModal(true)}>Round Off</CButton></CCol>
          </CRow>
          <div className="d-flex justify-content-between align-items-center bg-primary text-white p-3 mt-2" style={{ borderRadius: '10px' }}>
            <h5 className="fw-bold mb-0">Total</h5>
            <h5 className="fw-bold mb-0">₹{calculateTotal().toFixed(2)}</h5>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default Cart;
