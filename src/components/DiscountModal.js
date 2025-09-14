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
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    if (showDiscountModal) {
      setSelectedItemIds([]);
      setDiscountValue('');
      setDiscountType('percentage');
      setCouponCode('');
      setCouponDiscount(0);
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
      setSelectedItemIds(cart.map((item) => item.id || item._id));
    }
  };

  const validateCoupon = (code) => {
    let discount = 0;
    if (code.toUpperCase() === 'DISCOUNT10') {
      discount = { type: 'percentage', value: 10 };
    } else if (code.toUpperCase() === 'SAVE100') {
      discount = { type: 'fixed', value: 100 };
    }
    setCouponDiscount(discount);
  };

  const onSubmit = () => {
    if (
      (selectedItemIds.length === 0 && !couponDiscount.value) ||
      (!discountValue && !couponDiscount.value)
    ) {
      console.warn('Invalid submission');
      return;
    }

    const discounts = {
      selectedItemDiscount: {
        ids: selectedItemIds,
        value: Number(discountValue),
        type: discountType,
      },
      coupon: couponDiscount,
    };

    handleDiscountSubmit(discounts);
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setCouponCode('');
    setCouponDiscount(0);
    setShowDiscountModal(false);
  };

  const calculatePreview = () => {
    let totalDiscount = 0;

    if (discountValue && selectedItemIds.length > 0) {
      totalDiscount += selectedItemIds.reduce((total, itemId) => {
        const item = cart.find(
          (cartItem) => (cartItem.id || cartItem._id) === itemId
        );
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
    }

    if (couponDiscount.value) {
      if (couponDiscount.type === 'percentage') {
        const subtotal = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        totalDiscount += (subtotal * couponDiscount.value) / 100;
      } else if (couponDiscount.type === 'fixed') {
        totalDiscount += couponDiscount.value;
      }
    }

    return totalDiscount;
  };

  const validCart = Array.isArray(cart) ? cart : [];
  const hasItems = validCart.length > 0;

  return (
    <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Discount / Coupon</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Discount Type */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Discount Type:</label>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDiscountType('percentage')}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDiscountType('fixed')}
            >
              Fixed (₹)
            </button>
          </div>
        </div>

        {/* Discount Value */}
        <div className="mb-4">
          <label className="form-label fw-bold">
            {discountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
          </label>
          <CFormInput
            type="number"
            placeholder={discountType === 'percentage' ? '10 (for 10%)' : '100 (for ₹100 off)'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
        </div>

        {/* Coupon Code */}
        <div className="mb-4">
          <label className="form-label fw-bold">Coupon Code</label>
          <div className="d-flex">
            <CFormInput
              type="text"
              placeholder="Enter coupon (e.g., DISCOUNT10)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <CButton
              color="success"
              className="ms-2"
              onClick={() => validateCoupon(couponCode)}
            >
              Apply
            </CButton>
          </div>
          {couponDiscount.value ? (
            <small className="text-success fw-semibold d-block mt-2">
              ✅ Coupon applied: {couponDiscount.type === 'percentage'
                ? `${couponDiscount.value}%`
                : `₹${couponDiscount.value}`} off
            </small>
          ) : couponCode ? (
            <small className="text-danger d-block mt-2">
              ❌ Invalid Coupon
            </small>
          ) : null}
        </div>

        {/* Items */}
        <div className="border rounded p-3 mb-3">
          <h6 className="fw-bold mb-2">Select Items:</h6>
          {hasItems ? (
            <>
              <CButton
                size="sm"
                color="secondary"
                className="mb-2"
                onClick={selectAll}
              >
                {selectedItemIds.length === validCart.length ? 'Deselect All' : 'Select All'}
              </CButton>
              {validCart.map((item) => {
                const itemId = item.id || item._id;
                return (
                  <div key={itemId} className="d-flex align-items-center border p-2 mb-2 rounded">
                    <CFormCheck
                      type="checkbox"
                      checked={selectedItemIds.includes(itemId)}
                      onChange={() => toggleSelection(itemId)}
                      className="me-2"
                    />
                    <div className="flex-grow-1">
                      <div>{item.itemName}</div>
                      <small className="text-muted">
                        Qty: {item.quantity}, Price: ₹{item.price}
                      </small>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-muted">No items in cart.</p>
          )}
        </div>

        {/* Preview */}
        {(selectedItemIds.length > 0 || couponDiscount.value) && (
          <div className="alert alert-info">
            <strong>Total Discount: </strong> ₹{calculatePreview().toFixed(2)}
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setShowDiscountModal(false)}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={onSubmit}
          disabled={
            (selectedItemIds.length === 0 && !couponDiscount.value) ||
            (!discountValue && !couponDiscount.value)
          }
        >
          Apply Discount
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DiscountModal;
