import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormCheck,
} from '@coreui/react';

const DiscountModal = ({
  showDiscountModal,
  setShowDiscountModal,
  cart = [],
  handleDiscountSubmit,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'

  // Debug logging
  useEffect(() => {
    console.log('DiscountModal - Cart received:', cart);
    console.log('DiscountModal - Cart length:', cart?.length || 0);
  }, [cart]);

  // Reset state when modal opens
  useEffect(() => {
    if (showDiscountModal) {
      setSelectedItemIds([]);
      setDiscountValue('');
      setDiscountType('percentage');
      console.log('DiscountModal opened with cart:', cart);
    }
  }, [showDiscountModal, cart]);

  const toggleSelection = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    if (selectedItemIds.length === cart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map(item => item.id || item._id));
    }
  };

  const onSubmit = () => {
    if (selectedItemIds.length === 0 || !discountValue || Number(discountValue) <= 0) {
      console.warn('Invalid submission:', { selectedItemIds, discountValue });
      return;
    }
    
    console.log('Submitting discount:', { selectedItemIds, discountValue, discountType });
    handleDiscountSubmit(selectedItemIds, Number(discountValue), discountType);
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setShowDiscountModal(false);
  };

  const handleClose = () => {
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setShowDiscountModal(false);
  };

  const calculatePreview = () => {
    if (!discountValue || selectedItemIds.length === 0 || Number(discountValue) <= 0) return 0;
    return selectedItemIds.reduce((total, itemId) => {
      const item = cart.find(cartItem => (cartItem.id || cartItem._id) === itemId);
      if (!item) return total;
      const itemSubtotal = item.price * item.quantity;
      let itemDiscount = 0;
      if (discountType === 'percentage') {
        itemDiscount = (itemSubtotal * Number(discountValue)) / 100;
      } else if (discountType === 'fixed') {
        itemDiscount = Number(discountValue);
      }
      return total + itemDiscount;
    }, 0);
  };

  // Ensure cart is an array and has items
  const validCart = Array.isArray(cart) ? cart : [];
  const hasItems = validCart.length > 0;

  return (
    <CModal visible={showDiscountModal} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Discount to Items</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Debug Info (remove in production) */}
        {/* <div className="alert alert-info mb-3">
          <small>
            <strong>Debug Info:</strong> Cart items: {validCart.length}
            {validCart.length > 0 && (
              <div>First item: {validCart[0]?.itemName || 'Unknown'}</div>
            )}
          </small>
        </div> */}

        {/* Discount Type Selection */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Select Discount Type:</label>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDiscountType('percentage')}
            >
              Percentage Discount (%)
            </button>
            <button
              type="button"
              className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDiscountType('fixed')}
            >
              Fixed Amount Discount (₹)
            </button>
          </div>
          <small className="text-muted mt-2 d-block">
            <strong>Selected:</strong> {discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Amount Discount'}
          </small>
        </div>

        {/* Discount Value Input */}
        <div className="mb-4">
          <label className="form-label fw-bold">
            {discountType === 'percentage' ? 'Enter Discount Percentage (%)' : 'Enter Fixed Discount Amount (₹)'}
          </label>
          <CFormInput
            type="number"
            placeholder={
              discountType === 'percentage'
                ? 'e.g., 10 (for 10% off)'
                : 'e.g., 100 (for ₹100 discount per item)'
            }
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            step={discountType === 'percentage' ? '0.01' : '1'}
            min="0"
            className="form-control-lg"
          />
          <small className="text-muted mt-1">
            {discountType === 'percentage'
              ? "Discount percentage will be applied to each item's subtotal (price × quantity)"
              : 'Fixed discount amount will be subtracted from each selected item'
            }
          </small>
        </div>

        {/* Items Selection */}
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Select Items for Discount Application:</h6>
            {hasItems && (
              <CButton
                size="sm"
                variant="outline"
                color="primary"
                onClick={selectAll}
              >
                {selectedItemIds.length === validCart.length ? 'Deselect All' : 'Select All'}
              </CButton>
            )}
          </div>
          
          {!hasItems ? (
            <div className="text-center py-3">
              <p className="text-muted mb-2">No items in cart</p>
              <small className="text-muted">
                Add items to your cart first, then apply discounts.
              </small>
            </div>
          ) : (
            <div className="item-list">
              {validCart.map((item) => {
                const itemId = item.id || item._id;
                const itemSubtotal = item.price * item.quantity;
                const hasCurrentDiscount =
                  (item.discountPercentage > 0) ||
                  (item.fixedDiscountAmount > 0) ||
                  (item.discountAmount > 0);
                const isSelected = selectedItemIds.includes(itemId);

                return (
                  <div
                    key={itemId}
                    className={`p-2 mb-2 rounded ${
                      isSelected ? 'bg-light border-primary' : 'bg-white'
                    } border`}
                  >
                    <div className="d-flex align-items-start">
                      <CFormCheck
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(itemId)}
                        className="me-3 mt-1"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark">{item.itemName || 'Unknown Item'}</div>
                        <div className="text-muted small">
                          <span className="me-3">Qty: {item.quantity || 0}</span>
                          <span className="me-3">Price: ₹{Number(item.price || 0).toFixed(2)}</span>
                          <span className="fw-medium">Subtotal: ₹{itemSubtotal.toFixed(2)}</span>
                        </div>
                        {hasCurrentDiscount && (
                          <div className="text-danger small mt-1">
                            Current Discount: {
                              item.discountType === 'percentage'
                                ? `${item.discountPercentage}% (₹${item.discountAmount?.toFixed(2)})`
                                : item.discountType === 'fixed'
                                  ? `₹${item.fixedDiscountAmount} fixed`
                                  : `₹${item.discountAmount?.toFixed(2)}`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Discount Preview */}
        {selectedItemIds.length > 0 && discountValue && Number(discountValue) > 0 && (
          <div className="alert alert-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Discount Preview:</strong>
                <div className="small text-muted mt-1">
                  {discountType === 'percentage'
                    ? `${discountValue}% discount on ${selectedItemIds.length} selected item(s)`
                    : `₹${discountValue} fixed discount on ${selectedItemIds.length} selected item(s)`
                  }
                </div>
              </div>
              <div className="text-end">
                <span className="h5 text-danger fw-bold">
                  -₹{calculatePreview().toFixed(2)}
                </span>
                <div className="small text-muted">Total Discount Amount</div>
              </div>
            </div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={onSubmit}
          disabled={selectedItemIds.length === 0 || !discountValue || Number(discountValue) <= 0 || !hasItems}
        >
          Apply {discountType === 'percentage' ? 'Percentage' : 'Fixed'} Discount
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DiscountModal;