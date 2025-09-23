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
import axiosInstance from '../utils/axiosConfig';

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

  // Validate coupon when coupon code changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (couponCode.trim()) {
        validateCoupon(couponCode);
      } else {
        setCouponDiscount(0);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [couponCode]);

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

  const validateCoupon = async (code) => {
    if (!code || code.trim() === '') {
      setCouponDiscount(0);
      return;
    }

    try {
      // Calculate order total for validation
      const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = await axiosInstance.post('/api/coupon/validate', {
        couponCode: code.trim(),
        orderTotal: orderTotal
      });

      if (response.data.success) {
        const coupon = response.data.coupon;
        setCouponDiscount({
          type: coupon.discountType,
          value: coupon.discountValue,
          amount: coupon.discountAmount,
          id: coupon.id,
          code: coupon.code,
          expiryDate: coupon.expiryDate,
          minOrderValue: coupon.minOrderValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
          usageCount: coupon.usageCount,
          maxUsage: coupon.maxUsage,
          description: coupon.description
        });
      } else {
        setCouponDiscount(0);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponDiscount(0);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCoupon(couponCode);
    }
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
        const itemSubtotal = item.adjustedPrice * item.quantity;
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
              placeholder="Enter coupon code (e.g., BQHWM70)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <CButton
              color="success"
              className="ms-2"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim()}
            >
              Apply
            </CButton>
          </div>
          {couponDiscount.value ? (
            <div className="mt-3 p-3 border rounded bg-light">
              <div className="d-flex align-items-center mb-2">
                <span className="text-success me-2">✅</span>
                <span className="fw-bold text-success">Coupon Applied Successfully!</span>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>Code:</strong> <span className="text-primary">{couponDiscount.code}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Discount:</strong> 
                    <span className="text-success ms-1">
                      {couponDiscount.type === 'percentage' 
                        ? `${couponDiscount.value}% OFF` 
                        : `₹${couponDiscount.value} OFF`}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Discount Amount:</strong> 
                    <span className="text-success ms-1">₹{couponDiscount.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>Min Order:</strong> 
                    <span className="text-info ms-1">₹{couponDiscount.minOrderValue || '0'}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Max Discount:</strong> 
                    <span className="text-warning ms-1">₹{couponDiscount.maxDiscountAmount || 'No limit'}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Expires:</strong> 
                    <span className="text-secondary ms-1">
                      {couponDiscount.expiryDate ? new Date(couponDiscount.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {couponDiscount.description && (
                <div className="mt-2">
                  <strong>Description:</strong> 
                  <span className="text-muted ms-1">{couponDiscount.description}</span>
                </div>
              )}
              
              <div className="mt-2">
                <strong>Usage:</strong> 
                <span className="text-info ms-1">
                  {couponDiscount.usageCount || 0}/{couponDiscount.maxUsage || 'Unlimited'}
                </span>
              </div>
            </div>
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
                // const itemId = item.id || item._id; // This line is removed
                return (
                  <div key={item.id} className="d-flex align-items-center border p-2 mb-2 rounded"> 
                    <CFormCheck
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)} // Use item.id directly
                      onChange={() => toggleSelection(item.id)} // Pass item.id
                      className="me-2"
                    />
                    <div className="flex-grow-1">
                      <div>{item.itemName}</div>
                      <small className="text-muted">
                        Qty: {item.quantity}, Price: ₹{item.adjustedPrice}
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
