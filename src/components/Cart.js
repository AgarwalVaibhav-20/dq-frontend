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
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CInputGroup,
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
  calculateSubtotal,
  calculateTotalTaxAmount,
  calculateDiscountAmount,
  calculateTotal,
  discount,
  tax,
  roundOff,
  setRoundOff, 
  setShowTaxModal,       
  setShowDiscountModal,   
  setShowRoundOffModal,  
}) => {
  const [tempDiscount, setTempDiscount] = useState(0);
  const [tempRoundOff, setTempRoundOff] = useState(roundOff || 0);
  const [localDiscountModal, setLocalDiscountModal] = useState(false);
  const [localRoundOffModal, setLocalRoundOffModal] = useState(false);

  // Format time function
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get the correct price for an item
  const getItemPrice = (item) => {
    // Use adjustedPrice if available (from size selection), otherwise use original price
    return Number(item.adjustedPrice || item.price);
  };

  const getSubtotal = () => {
    if (calculateSubtotal) return calculateSubtotal();
    return cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  };

  const getTotalTaxAmount = () => {
    if (calculateTotalTaxAmount) return calculateTotalTaxAmount();
    return cart.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0);
  };

  const getDiscountAmount = () => {
    if (calculateDiscountAmount) return calculateDiscountAmount();
    return (getSubtotal() * (discount || 0)) / 100;
  };

  const getTotal = () => {
    if (calculateTotal) return calculateTotal();
    return getSubtotal() + getTotalTaxAmount() - getDiscountAmount() - (roundOff || 0);
  };

  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;
    const updatedCart = cart.map((item) => {
      const currentItemId = item._id || item.id;
      if (currentItemId === itemId) {
        const updatedItem = { ...item, quantity: newQty };
        const itemPrice = getItemPrice(item);
        
        if (item.taxPercentage) {
          updatedItem.taxAmount = (itemPrice * newQty * item.taxPercentage) / 100;
        }
        // Discount calculation example (add your logic as needed)
        if (item.discountPercentage) {
          updatedItem.discountAmount = (itemPrice * newQty * item.discountPercentage) / 100;
        } else if (item.fixedDiscountAmount) {
          updatedItem.discountAmount = Number(item.fixedDiscountAmount) * newQty;
        }
        return updatedItem;
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleDeleteClick = (itemId) => {
    const updatedCart = cart.filter((item) => {
      const currentItemId = item._id || item.id;
      return currentItemId !== itemId;
    });
    setCart(updatedCart);
  };

  // Round Off Modal Functions
  const handleRoundOffIncrement = () => {
    const currentValue = parseFloat(tempRoundOff) || 0;
    setTempRoundOff((currentValue + 1).toString());
  };

  const handleRoundOffDecrement = () => {
    const currentValue = parseFloat(tempRoundOff) || 0;
    if (currentValue > 0) {
      setTempRoundOff((currentValue - 1).toString());
    }
  };

  const handleRoundOffInputChange = (e) => {
    const value = e.target.value;
    // Allow only positive numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTempRoundOff(value);
    }
  };

  const getRoundedValue = () => {
    const value = parseFloat(tempRoundOff);
    if (isNaN(value) || value === 0) return 0;
    return Math.round(value);
  };

  const handleRoundOffApply = () => {
    const finalRoundOff = getRoundedValue();
    if (setRoundOff) {
      setRoundOff(finalRoundOff);
    }
    console.log('Round Off Applied:', finalRoundOff);
    setLocalRoundOffModal(false);
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
            style={{ maxHeight: '220px', overflowY: 'auto', flexGrow: 1 }}
            className="custom-scrollbar p-2 border"
          >
            {cart.length === 0 ? (
              <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                <p className="m-0">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemId = item._id || item.id;
                const itemPrice = getItemPrice(item);
                const itemSubtotal = itemPrice * item.quantity;
                const itemTaxAmount = Number(item.taxAmount) || 0;
                const itemDiscountAmount = Number(item.discountAmount) || 0;
                const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;

                return (
                  <div
                    key={itemId}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                  >
                    <div style={{ flex: '1 1 0%' }}>
                      <div className="d-flex align-items-center mb-1">
                        <h6 className="mb-0 fw-bold text-dark me-2">{item.itemName}</h6>
                        {/* Show size if available */}
                        {item.selectedSize && (
                          <span className="badge bg-primary">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-muted small">
                        ₹{itemPrice.toFixed(2)} x {item.quantity}
                        
                        {/* Show original price if different from adjusted price */}
                        {item.adjustedPrice && item.adjustedPrice !== item.price && (
                          <span className="text-muted ms-1">
                            (was ₹{Number(item.originalPrice || item.price).toFixed(2)})
                          </span>
                        )}

                        {/* Tax Info */}
                        {((item.taxPercentage > 0) || (item.fixedTaxAmount > 0) || (item.taxAmount > 0)) && (
                          <div className="mt-1">
                            <span className="badge bg-info text-dark me-1">
                              Tax: {
                                item.taxType === 'percentage'
                                  ? `${item.taxPercentage}% (₹${itemTaxAmount.toFixed(2)})`
                                  : item.taxType === 'fixed'
                                    ? `₹${item.fixedTaxAmount} fixed`
                                    : `₹${itemTaxAmount.toFixed(2)}`
                              }
                            </span>
                          </div>
                        )}

                        {/* Discount Info */}
                        {((item.discountPercentage > 0) || (item.fixedDiscountAmount > 0) || (item.discountAmount > 0)) && (
                          <div className="mt-1">
                            <span className="badge bg-warning text-dark me-1">
                              Discount: {
                                item.discountType === 'percentage'
                                  ? `${item.discountPercentage}% (₹${itemDiscountAmount.toFixed(2)})`
                                  : item.discountType === 'fixed'
                                    ? `₹${item.fixedDiscountAmount} fixed`
                                    : `₹${itemDiscountAmount.toFixed(2)}`
                              }
                            </span>
                          </div>
                        )}

                        {/* Subcategory Info */}
                        {item.selectedSubcategoryName && (
                          <div className="mt-1">
                            <span className="badge bg-secondary">
                              {item.selectedSubcategoryName}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="fw-bold text-primary">
                        Total: ₹{itemTotal.toFixed(2)}
                        {itemTaxAmount > 0 && (
                          <span className="text-muted small"> (incl. tax)</span>
                        )}
                        {itemDiscountAmount > 0 && (
                          <span className="text-muted small"> (after discount)</span>
                        )}
                      </div>
                    </div>
                    
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
              <span>₹{getSubtotal().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Tax</span>
              <span>₹{getTotalTaxAmount().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Discount ({discount || 0}%)</span>
              <span className="text-danger">- ₹{getDiscountAmount().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Round Off</span>
              <span className="text-danger">- ₹{Number(roundOff || 0).toFixed(2)}</span>
            </div>
            <hr />
            <CRow className="g-2 my-2">
              <CCol>
                <CButton
                  color="light"
                  className="w-100 shadow-sm"
                  onClick={() => setShowTaxModal && setShowTaxModal(true)}
                  disabled={cart.length === 0}
                >
                  Tax
                </CButton>
              </CCol>
              <CCol>
                <CButton
                  color="light"
                  className="w-100 shadow-sm"
                  onClick={() => setShowDiscountModal ? setShowDiscountModal(true) : setLocalDiscountModal(true)}
                >
                  Discount
                </CButton>
              </CCol>
              <CCol>
                <CButton
                  color="light"
                  className="w-100 shadow-sm"
                  onClick={() => {
                    if (setShowRoundOffModal) {
                      setShowRoundOffModal(true);
                    } else {
                      setTempRoundOff(roundOff || 0);
                      setLocalRoundOffModal(true);
                    }
                  }}
                >
                  Round Off
                </CButton>
              </CCol>
            </CRow>
            <div
              className="d-flex justify-content-between align-items-center bg-primary text-white p-3 mt-2"
              style={{ borderRadius: '10px' }}
            >
              <h5 className="fw-bold mb-0">Total</h5>
              <h5 className="fw-bold mb-0">₹{getTotal().toFixed(2)}</h5>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Local Discount Modal (fallback if parent doesn't provide one) */}
      {!setShowDiscountModal && (
        <CModal visible={localDiscountModal} onClose={() => setLocalDiscountModal(false)}>
          <CModalHeader>
            <CModalTitle>Set Discount %</CModalTitle>
          </CModalHeader>
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
            <CButton color="secondary" onClick={() => setLocalDiscountModal(false)}>
              Cancel
            </CButton>
            <CButton color="primary" onClick={() => {
              console.log('Discount:', tempDiscount);
              setLocalDiscountModal(false);
            }}>
              Apply
            </CButton>
          </CModalFooter>
        </CModal>
      )}

      {/* Enhanced Local Round Off Modal (fallback if parent doesn't provide one) */}
      {!setShowRoundOffModal && (
        <CModal visible={localRoundOffModal} onClose={() => setLocalRoundOffModal(false)}>
          <CModalHeader>
            <CModalTitle>Enter Round Off Number</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {/* Individual Items Display */}
            <div className="mb-3">
              <h6 className="mb-3 text-primary">Cart Items:</h6>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded p-2">
                {cart.map((item) => {
                  const itemId = item._id || item.id;
                  const itemPrice = getItemPrice(item);
                  const itemSubtotal = itemPrice * item.quantity;
                  const itemTaxAmount = Number(item.taxAmount) || 0;
                  const itemDiscountAmount = Number(item.discountAmount) || 0;
                  const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;

                  return (
                    <div key={itemId} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark">{item.itemName}</div>
                        <div className="text-muted small">
                          ₹{itemPrice.toFixed(2)} × {item.quantity}
                          {item.selectedSize && (
                            <span className="badge bg-primary ms-1">{item.selectedSize}</span>
                          )}
                        </div>
                        {(itemTaxAmount > 0 || itemDiscountAmount > 0) && (
                          <div className="text-muted small">
                            {itemTaxAmount > 0 && <span className="me-2">Tax: ₹{itemTaxAmount.toFixed(2)}</span>}
                            {itemDiscountAmount > 0 && <span className="text-warning">Discount: -₹{itemDiscountAmount.toFixed(2)}</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">₹{itemTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Cart Summary */}
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-2 text-primary">Cart Summary:</h6>
              <div className="d-flex justify-content-between mb-1">
                <span>Subtotal:</span>
                <span>₹{getSubtotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Total Tax:</span>
                <span>₹{getTotalTaxAmount().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Discount:</span>
                <span className="text-danger">-₹{getDiscountAmount().toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fw-bold">
                <span>Current Total:</span>
                <span>₹{(getSubtotal() + getTotalTaxAmount() - getDiscountAmount()).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-success">
                <span>After Round Off:</span>
                <span>₹{(getSubtotal() + getTotalTaxAmount() - getDiscountAmount() - getRoundedValue()).toFixed(2)}</span>
              </div>
            </div>

            <CRow className="mb-3">
              <CCol>
                <label className="form-label">Current Total to Round Off:</label>
                <div className="mb-2 p-2 bg-primary text-white text-center rounded fs-5 fw-bold">
                  ₹{(getSubtotal() + getTotalTaxAmount() - getDiscountAmount()).toFixed(2)}
                </div>
                <label className="form-label">Adjust Round Off Value:</label>
                <CInputGroup>
                  <CButton 
                    type="button" 
                    color="outline-secondary" 
                    onClick={handleRoundOffDecrement}
                    disabled={parseFloat(tempRoundOff) <= 0}
                  >
                    -
                  </CButton>
                  <div className="form-control text-center fw-bold bg-white fs-5 text-primary">
                    ₹{getRoundedValue().toFixed(2)}
                  </div>
                  <CButton 
                    type="button" 
                    color="outline-secondary" 
                    onClick={handleRoundOffIncrement}
                  >
                    +
                  </CButton>
                </CInputGroup>
                <small className="text-muted">Use +/- buttons to set round off amount based on total above</small>
              </CCol>
            </CRow>
            
            {tempRoundOff && parseFloat(tempRoundOff) > 0 && (
              <CRow>
                <CCol>
                  <div className="alert alert-success">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Round Off Applied: ₹{getRoundedValue().toFixed(2)}</strong>
                        <br />
                        <small className="text-muted">
                          Original Total: ₹{(getSubtotal() + getTotalTaxAmount() - getDiscountAmount()).toFixed(2)}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-success fs-5">
                          Final: ₹{(getSubtotal() + getTotalTaxAmount() - getDiscountAmount() - getRoundedValue()).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton 
              color="secondary" 
              onClick={() => setLocalRoundOffModal(false)}
            >
              Cancel
            </CButton>
            <CButton 
              color="primary" 
              onClick={handleRoundOffApply}
              disabled={!tempRoundOff || parseFloat(tempRoundOff) <= 0}
            >
              Apply
            </CButton>
          </CModalFooter>
        </CModal>
      )}
    </>
  );
};

export default Cart;