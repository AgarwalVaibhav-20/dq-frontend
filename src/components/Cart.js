import React, { useState } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CRow,
  CCol,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CFormInput,
} from '@coreui/react';
import { cilPlus, cilTrash, cilMinus, cilPeople } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

const Cart = ({
  selectedCustomerName,
  setShowCustomerModal,
  startTime,
  elapsedTime,
  cart,
  setCart,
}) => {
  // Modal states
  const [taxModal, setTaxModal] = useState(false);
  const [discountModal, setDiscountModal] = useState(false);
  const [roundOffModal, setRoundOffModal] = useState(false);

  // Tax, discount, and round off states
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [tempTax, setTempTax] = useState(0);
  const [tempDiscount, setTempDiscount] = useState(0);
  const [tempRoundOff, setTempRoundOff] = useState(0);
  const [taxType, setTaxType] = useState('percentage'); // 'percentage' or 'fixed'

  // Format time function
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // FIXED: Quantity change handler - use proper ID matching
  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;
    
    const updatedCart = cart.map((item) => {
      // Use both id and _id for matching to handle different ID formats
      const currentItemId = item._id || item.id;
      if (currentItemId === itemId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updatedCart);
  };

  // FIXED: Delete item handler - use proper ID matching
  const handleDeleteClick = (itemId) => {
    const updatedCart = cart.filter((item) => {
      const currentItemId = item._id || item.id;
      return currentItemId !== itemId;
    });
    setCart(updatedCart);
  };

  // Tax calculation per item
  const calculateItemTax = (item) => {
    if (taxType === 'percentage') return (Number(item.price) * tax) / 100;
    return Number(tax); // fixed amount per item
  };

  const calculateItemTotal = (item) => Number(item.price) + calculateItemTax(item);

  // Calculation functions
  const calculateSubtotal = () =>
    cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const calculateTaxAmount = () =>
    cart.reduce((acc, item) => acc + calculateItemTax(item) * item.quantity, 0);

  const calculateDiscountAmount = () => (calculateSubtotal() * discount) / 100;

  const calculateTotal = () =>
    calculateSubtotal() + calculateTaxAmount() - calculateDiscountAmount() - roundOff;

  // Modal apply functions
  const applyTax = () => {
    setTax(Number(tempTax));
    setTaxModal(false);
  };

  const applyDiscount = () => {
    setDiscount(Number(tempDiscount));
    setDiscountModal(false);
  };

  const applyRoundOff = () => {
    setRoundOff(Number(tempRoundOff));
    setRoundOffModal(false);
  };

  // Modal open functions
  const openTaxModal = () => {
    setTempTax(tax);
    setTaxModal(true);
  };

  const openDiscountModal = () => {
    setTempDiscount(discount);
    setDiscountModal(true);
  };

  const openRoundOffModal = () => {
    setTempRoundOff(roundOff);
    setRoundOffModal(true);
  };

  return (
    <>
      <CCard className="shadow-lg h-100" style={{ borderRadius: '15px' }}>
        <CCardHeader
          className="bg-white d-flex justify-content-between align-items-center"
          style={{
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            borderBottom: '1px solid #dee2e6'
          }}
        >
          <div className="d-flex align-items-center">
            <CIcon icon={cilPeople} className="me-2 text-primary" />
            <span className="fw-bold fs-5">{selectedCustomerName || 'Walk-in Customer'}</span>
          </div>
          {setShowCustomerModal && (
            <CButton color="primary" shape="circle" size="sm" onClick={() => setShowCustomerModal(true)}>
              <CIcon icon={cilPlus} />
            </CButton>
          )}
        </CCardHeader>

        {startTime && (
          <div className="bg-light text-center py-2 fw-bold text-dark">
            Time: {formatTime(elapsedTime)}
          </div>
        )}

        <CCardBody className="d-flex flex-column p-3">
          <div
            style={{ maxHeight: '270px', overflowY: 'auto', flexGrow: 1 }}
            className="custom-scrollbar p-2 border"
          >
            {cart.length === 0 ? (
              <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                <p className="m-0">Your cart is empty</p>
              </div>
            ) : (
              // FIXED: Display items normally without expanding by quantity
              cart.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <div
                    key={itemId}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                  >
                    <div style={{ flex: '1 1 0%' }}>
                      <h6 className="mb-1 fw-bold text-dark">{item.itemName}</h6>
                      <div className="text-muted small">
                        ₹{Number(item.price).toFixed(2)} x {item.quantity}
                        {tax > 0 && (
                          <span className="ms-2">
                            (Tax: {taxType === 'percentage' ? `${tax}%` : `₹${tax.toFixed(2)}`})
                          </span>
                        )}
                        {item.discount > 0 && (
                          <span className="ms-2">(Discount: ₹{item.discount.toFixed(2)})</span>
                        )}
                      </div>
                      <div className="fw-bold text-primary">
                        Total: ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* FIXED: Quantity Controls with proper ID handling */}
                    <div className="d-flex align-items-center">
                      <CButton
                        variant="outline"
                        color="dark"
                        size="sm"
                        shape="circle"
                        onClick={() => handleQuantityChange(itemId, item.quantity - 1)}
                      >
                        <CIcon icon={cilMinus} />
                      </CButton>
                      <span className="mx-2 fw-bold fs-5">{item.quantity}</span>
                      <CButton
                        variant="outline"
                        color="dark"
                        size="sm"
                        shape="circle"
                        onClick={() => handleQuantityChange(itemId, item.quantity + 1)}
                      >
                        <CIcon icon={cilPlus} />
                      </CButton>
                    </div>

                    {/* FIXED: Remove Item with proper ID handling */}
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(itemId)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto pt-3">
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Tax {taxType === 'percentage' ? `(${tax}%)` : `(₹${tax})`}</span>
              <span>₹{calculateTaxAmount().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Discount ({discount}%)</span>
              <span className="text-danger">- ₹{calculateDiscountAmount().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Round Off</span>
              <span className="text-danger">- ₹{Number(roundOff).toFixed(2)}</span>
            </div>
            <hr />
            <CRow className="g-2 my-2">
              <CCol>
                <CButton color="light" className="w-100 shadow-sm" onClick={openTaxModal}>
                  Tax
                </CButton>
              </CCol>
              <CCol>
                <CButton color="light" className="w-100 shadow-sm" onClick={openDiscountModal}>
                  Discount
                </CButton>
              </CCol>
              <CCol>
                <CButton color="light" className="w-100 shadow-sm" onClick={openRoundOffModal}>
                  Round Off
                </CButton>
              </CCol>
            </CRow>
            <div
              className="d-flex justify-content-between align-items-center bg-primary text-white p-3 mt-2"
              style={{ borderRadius: '10px' }}
            >
              <h5 className="fw-bold mb-0">Total</h5>
              <h5 className="fw-bold mb-0">₹{calculateTotal().toFixed(2)}</h5>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Tax Modal */}
      <CModal visible={taxModal} onClose={() => setTaxModal(false)}>
        <CModalHeader>Set Tax</CModalHeader>
        <CModalBody>
          <CFormInput
            type="number"
            value={tempTax}
            onChange={(e) => setTempTax(e.target.value)}
            placeholder={taxType === 'percentage' ? 'Enter tax %' : 'Enter tax amount'}
            step="0.01"
          />
          <div className="d-flex justify-content-between mt-3">
            <CButton
              color={taxType === 'percentage' ? 'primary' : 'secondary'}
              onClick={() => setTaxType('percentage')}
              className="w-50 me-1"
            >
              Percentage
            </CButton>
            <CButton
              color={taxType === 'fixed' ? 'primary' : 'secondary'}
              onClick={() => setTaxType('fixed')}
              className="w-50 ms-1"
            >
              Fixed Amount
            </CButton>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setTaxModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={applyTax}>
            Apply
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Discount Modal */}
      <CModal visible={discountModal} onClose={() => setDiscountModal(false)}>
        <CModalHeader>Set Discount %</CModalHeader>
        <CModalBody>
          <CFormInput
            type="number"
            value={tempDiscount}
            onChange={(e) => setTempDiscount(e.target.value)}
            placeholder="Enter discount percentage"
            step="0.01"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDiscountModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={applyDiscount}>
            Apply
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Round Off Modal */}
      <CModal visible={roundOffModal} onClose={() => setRoundOffModal(false)}>
        <CModalHeader>Set Round Off</CModalHeader>
        <CModalBody>
          <CFormInput
            type="number"
            value={tempRoundOff}
            onChange={(e) => setTempRoundOff(e.target.value)}
            placeholder="Enter round off amount"
            step="0.01"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setRoundOffModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={applyRoundOff}>
            Apply
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Cart;