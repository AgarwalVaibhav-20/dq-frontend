import React, { useState, useRef, useEffect } from 'react';
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
import { FocusTrap } from 'focus-trap-react';
import { useHotkeys } from 'react-hotkeys-hook';

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
  isDiscountDisabled,
  membershipName,
  selectedSystem,
  onSystemChange,
  appliedDiscounts,
  setAppliedDiscounts,
}) => {
  const [tempDiscount, setTempDiscount] = useState(0);
  const [tempRoundOff, setTempRoundOff] = useState(roundOff || 0);
  const [localDiscountModal, setLocalDiscountModal] = useState(false);
  const [localRoundOffModal, setLocalRoundOffModal] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const cartItemRefs = useRef([]);

  // Format time function
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get the correct price for an item
  const getItemPrice = (item) => {
    const val = item?.adjustedPrice ?? item?.price ?? 0;
    return Number(val) || 0;
  };


  const cartContainerRef = useRef(null);


  const getCartDiscountPercentage = () => {
    if (!cart.length) return 0;

    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;

    const totalDiscountAmount = getDiscountAmount ? getDiscountAmount() : 0;

    if (totalDiscountAmount > 0) {
      const percentage = (totalDiscountAmount / subtotal) * 100;
      return isNaN(percentage) ? 0 : Math.abs(percentage).toFixed(2);
    }

    const totalDiscount = cart.reduce((acc, item) => {
      const itemPrice = getItemPrice(item);
      if (item.discountPercentage) {
        acc += (itemPrice * item.quantity * item.discountPercentage) / 100;
      } else if (item.fixedDiscountAmount) {
        acc += item.fixedDiscountAmount * item.quantity;
      }
      return acc;
    }, 0);

    if (totalDiscount === 0 || isNaN(totalDiscount)) return 0;

    const percentage = (totalDiscount / subtotal) * 100;
    return isNaN(percentage) ? 0 : Math.abs(percentage).toFixed(2);
  };

  const getSubtotal = () => {
    if (calculateSubtotal) return calculateSubtotal();
    return cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  };

  const getTotalTaxAmount = () => {
    if (calculateTotalTaxAmount) return calculateTotalTaxAmount();
    return cart.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0);
  };

  const getTaxDisplayName = () => {
    const taxNames = cart
      .filter(item => item.taxName && item.taxAmount > 0)
      .map(item => item.taxName);

    if (taxNames.length > 0) {
      const uniqueTaxNames = [...new Set(taxNames)];
      if (uniqueTaxNames.length === 1) {
        return uniqueTaxNames[0];
      } else {
        return "Total Tax";
      }
    }
    return "Total Tax";
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
      if (item.id === itemId) {
        const updatedItem = { ...item, quantity: newQty };
        const itemPrice = getItemPrice(item);

        if (item.taxPercentage) {
          updatedItem.taxAmount = (itemPrice * newQty * item.taxPercentage) / 100;
        }
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
    const updatedCart = cart.filter((item) => item.id !== itemId);
    setCart(updatedCart);
    setFocusedItemIndex(-1);
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

  // FIXED: Consolidated keyboard navigation
  // Handle arrow up/down for cart navigation (when NOT in modal)
  // Up/Down for navigation
  useHotkeys(
    'up, down',
    (e, handler) => {
      e.preventDefault();
      if (cart.length === 0) return;
      if (handler.keys?.includes('down')) {
        setFocusedItemIndex((prev) => {
          const newIndex = prev < cart.length - 1 ? prev + 1 : 0;
          cartItemRefs.current[newIndex]?.focus();
          return newIndex;
        });
      } else if (handler.keys?.includes('up')) {
        setFocusedItemIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : cart.length - 1;
          cartItemRefs.current[newIndex]?.focus();
          return newIndex;
        });
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enable: () => cartContainerRef.current?.contains(document.activeElement)  // Only in cart
    },
    [cart.length]
  );

  // Left/Right for quantity
  useHotkeys(
    'left, right',
    (e, handler) => {
      e.preventDefault();
      if (focusedItemIndex >= 0 && focusedItemIndex < cart.length) {
        const item = cart[focusedItemIndex];
        if (handler.keys?.includes('right')) {
          handleQuantityChange(item.id, item.quantity + 1);
        } else if (handler.keys?.includes('left') && item.quantity > 1) {
          handleQuantityChange(item.id, item.quantity - 1);
        }
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enable: () => cartContainerRef.current?.contains(document.activeElement)
    },
    [cart, focusedItemIndex]
  );

  // Delete/Backspace for remove
  useHotkeys(
    'delete, backspace',
    (e) => {
      e.preventDefault();
      if (focusedItemIndex >= 0 && focusedItemIndex < cart.length) {
        const item = cart[focusedItemIndex];
        if (window.confirm(`Remove ${item.itemName} from cart?`)) {
          handleDeleteClick(item.id);
        }
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enable: () => cartContainerRef.current?.contains(document.activeElement)
    },
    [cart, focusedItemIndex]
  );

  // Enter for +1 quantity
  useHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      if (focusedItemIndex >= 0 && focusedItemIndex < cart.length) {
        const item = cart[focusedItemIndex];
        handleQuantityChange(item.id, item.quantity + 1);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enable: () => cartContainerRef.current?.contains(document.activeElement)
    },
    [cart, focusedItemIndex]
  );

  // Single keys (T/D/R/C) - already somewhat scoped, but add enable for safety
  useHotkeys('t', () => setShowTaxModal?.(true), {
    enable: () => cartContainerRef.current?.contains(document.activeElement)
  });
  useHotkeys('d', () => !isDiscountDisabled && setShowDiscountModal?.(true), {
    enable: () => cartContainerRef.current?.contains(document.activeElement)
  });
  useHotkeys('r', () => (setShowRoundOffModal?.(true) || setLocalRoundOffModal(true)), {
    enable: () => cartContainerRef.current?.contains(document.activeElement)
  });
  useHotkeys('c', () => setShowCustomerModal?.(true), {
    enable: () => cartContainerRef.current?.contains(document.activeElement)
  });
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
            <CButton
              color="primary"
              shape="circle"
              size="sm"
              onClick={() => setShowCustomerModal(true)}
              title="Press 'C' to select customer"
            >
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
            ref={cartContainerRef}
            style={{ maxHeight: '220px', overflowY: 'auto', flexGrow: 1 }}
            className="custom-scrollbar p-2 border"
          >
            {cart.length === 0 ? (
              <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                <p className="m-0">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => {
                const itemPrice = getItemPrice(item);
                const itemSubtotal = itemPrice * item.quantity;
                const itemTaxAmount = Number(item.taxAmount) || 0;
                const itemDiscountAmount = Number(item.discountAmount) || 0;
                const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;

                return (
                  <div
                    key={item.id}
                    ref={(el) => (cartItemRefs.current[index] = el)}
                    tabIndex={0}
                    className={`cart-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom ${focusedItemIndex === index ? 'bg-light border-primary' : ''
                      }`}
                    style={{
                      cursor: 'pointer',
                      outline: focusedItemIndex === index ? '2px solid #0d6efd' : 'none',
                      borderRadius: '5px'
                    }}
                    onFocus={() => setFocusedItemIndex(index)}
                    onClick={() => {
                      setFocusedItemIndex(index);
                      cartItemRefs.current[index]?.focus();
                    }}
                  >
                    <div style={{ flex: '1 1 0%' }}>
                      <div className="d-flex align-items-center mb-1">
                        <h6 className="mb-0 fw-bold text-dark me-2">{item.itemName}</h6>
                        {item.selectedSize && (
                          <span className="badge bg-primary">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>

                      <div className="text-muted small">
                        ₹{itemPrice.toFixed(2)} x {item.quantity}

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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.quantity - 1);
                        }}
                      >
                        <CIcon icon={cilMinus} />
                      </CButton>
                      <span className="mx-2 fw-bold fs-5">{item.quantity}</span>
                      <CButton
                        variant="outline"
                        color="dark"
                        size="sm"
                        shape="circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(item.id, item.quantity + 1);
                        }}
                      >
                        <CIcon icon={cilPlus} />
                      </CButton>
                    </div>

                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(item.id);
                      }}
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
              <span>{getTaxDisplayName()}</span>
              <span>₹{getTotalTaxAmount().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Discount ({getCartDiscountPercentage() || 0}%)
                {membershipName && ` (${membershipName})`}
              </span>
              <span className="text-danger">- ₹{getDiscountAmount().toFixed(2)}</span>
            </div>

            {appliedDiscounts?.rewardPoints && (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-success">
                  🎁 Reward Points ({appliedDiscounts.rewardPoints.pointsUsed} pts)
                </span>
                <span className="text-success">- ₹{appliedDiscounts.rewardPoints.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {selectedSystem && selectedSystem._id && selectedSystem.systemName && selectedSystem.chargeOfSystem > 0 && (
              <div className="d-flex justify-content-between mb-2 align-items-center">
                <span>System Charge ({selectedSystem.systemName})</span>
                <div className="d-flex align-items-center">
                  <span className="text-info me-2">₹{Number(selectedSystem.chargeOfSystem || 0).toFixed(2)}</span>
                  {onSystemChange && (
                    <CButton
                      color="outline-primary"
                      size="sm"
                      onClick={onSystemChange}
                      className="cart-button p-1"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Change
                    </CButton>
                  )}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between">
              <span>Round Off</span>
              <span className="text-danger">- ₹{Number(roundOff || 0).toFixed(2)}</span>
            </div>

            <hr />

            <div className="alert alert-info py-2 mb-2 small">
              <strong>Keyboard Shortcuts:</strong> ↑/↓ Navigate • ←/→ Qty • Enter +1 • Del Remove • T Tax • D Discount • R Round • C Customer
            </div>

            <CRow className="g-2 my-2">
              <CCol>
                <CButton
                  color="light"
                  className="cart-button w-100 shadow-sm"
                  onClick={() => setShowTaxModal && setShowTaxModal(true)}
                  disabled={cart.length === 0}
                  title="Press 'T' for Tax"
                >
                  Tax (T)
                </CButton>
              </CCol>
              <CCol>
                <CButton
                  color="light"
                  className="cart-button w-100 shadow-sm"
                  onClick={() =>
                    setShowDiscountModal
                      ? setShowDiscountModal(true)
                      : setLocalDiscountModal(true)
                  }
                  disabled={isDiscountDisabled}
                  title={
                    isDiscountDisabled
                      ? "Membership discount already applied"
                      : "Press 'D' for Discount"
                  }
                >
                  Discount (D)
                </CButton>
              </CCol>
              <CCol>
                <CButton
                  color="light"
                  className="cart-button w-100 shadow-sm"
                  onClick={() => {
                    if (setShowRoundOffModal) {
                      setShowRoundOffModal(true);
                    } else {
                      setTempRoundOff(roundOff || 0);
                      setLocalRoundOffModal(true);
                    }
                  }}
                  title="Press 'R' for Round Off"
                >
                  Round Off (R)
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

      {/* Local Discount Modal */}
      {!setShowDiscountModal && (
        <FocusTrap active={localDiscountModal}>
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
        </FocusTrap>
      )}

      {/* Local Round Off Modal */}
      {!setShowRoundOffModal && (
        <FocusTrap active={localRoundOffModal}>
          <CModal visible={localRoundOffModal} onClose={() => setLocalRoundOffModal(false)}>
            <CModalHeader>
              <CModalTitle>Enter Round Off Number</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="mb-2 text-primary">Cart Summary:</h6>
                <div className="d-flex justify-content-between mb-1">
                  <span>Subtotal:</span>
                  <span>₹{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>{getTaxDisplayName()}:</span>
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
                </CCol>
              </CRow>
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
        </FocusTrap>
      )}
    </>
  );
};

export default Cart;