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
  CAlert,
} from '@coreui/react';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';

const DiscountModal = ({
  showDiscountModal,
  setShowDiscountModal,
  cart = [],
  handleDiscountSubmit,
  selectedCustomer = null, // Customer with rewardCustomerPoints
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [useRewardPoints, setUseRewardPoints] = useState(false); // Reward points checkbox

  useEffect(() => {
    if (showDiscountModal) {
      setSelectedItemIds([]);
      setDiscountValue('');
      setDiscountType('percentage');
      setCouponCode('');
      setCouponDiscount(0);
      setUseRewardPoints(false);
    }
  }, [showDiscountModal, cart]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (couponCode.trim()) {
        validateCoupon(couponCode);
      } else {
        setCouponDiscount(0);
      }
    }, 500);

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
      const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${BASE_URL}/api/coupon/validate`, {
        couponCode: code.trim(),
        orderTotal: orderTotal
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  // Calculate total reward points from cart items
  const calculateTotalRewardPoints = () => {
    return cart.reduce((total, item) => {
      const itemRewardPoints = Number(item.rewardPoints) || 0;
      return total + (itemRewardPoints * item.quantity);
    }, 0);
  };

  // Calculate reward points discount (1 point = ₹1)
  const calculateRewardPointsDiscount = () => {
    if (!useRewardPoints || !selectedCustomer) return 0;
    
    const totalRewardPoints = calculateTotalRewardPoints();
    const customerPoints = Number(selectedCustomer.rewardCustomerPoints) || 0;
    
    // Customer can use up to the reward points they've earned from items in cart
    // But limited by their available balance
    return Math.min(totalRewardPoints, customerPoints);
  };

  const onSubmit = () => {
    if (
      (selectedItemIds.length === 0 && !couponDiscount.value && !useRewardPoints) ||
      (!discountValue && !couponDiscount.value && !useRewardPoints)
    ) {
      console.warn('Invalid submission: No discount applied');
      return;
    }

    const discounts = {
      selectedItemDiscount: {
        ids: selectedItemIds,
        value: Number(discountValue),
        type: discountType,
      },
      coupon: couponDiscount,
      rewardPoints: useRewardPoints ? {
        enabled: true,
        pointsUsed: calculateRewardPointsDiscount(),
        discountAmount: calculateRewardPointsDiscount(),
      } : null,
    };

    console.log('Submitting discounts:', discounts);
    handleDiscountSubmit(discounts);
    
    // Reset form
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setCouponCode('');
    setCouponDiscount(0);
    setUseRewardPoints(false);
    setShowDiscountModal(false);
  };

  const calculatePreview = () => {
    let totalDiscount = 0;

    // Item-specific discounts
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

    // Coupon discounts
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

    // Reward points discount
    if (useRewardPoints) {
      totalDiscount += calculateRewardPointsDiscount();
    }

    return totalDiscount;
  };

  const validCart = Array.isArray(cart) ? cart : [];
  const hasItems = validCart.length > 0;
  const totalRewardPoints = calculateTotalRewardPoints();
  const customerPoints = selectedCustomer ? Number(selectedCustomer.rewardCustomerPoints) || 0 : 0;
  const availableRewardDiscount = Math.min(totalRewardPoints, customerPoints);

  return (
    <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Discount / Coupon / Reward Points</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Reward Points Section */}
        {selectedCustomer && totalRewardPoints > 0 && (
          <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#fff3cd' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0 text-dark">🎁 Reward Points Discount</h6>
              <CFormCheck
                type="checkbox"
                id="useRewardPoints"
                label={<span className="fw-bold">Use Reward Points</span>}
                checked={useRewardPoints}
                onChange={(e) => setUseRewardPoints(e.target.checked)}
              />
            </div>
            
            <div className="row mt-3">
              <div className="col-6">
                <small className="text-muted">Customer's Balance:</small>
                <div className="fw-bold text-primary fs-5">{customerPoints} points</div>
              </div>
              <div className="col-6">
                <small className="text-muted">Cart Reward Points:</small>
                <div className="fw-bold text-success fs-5">{totalRewardPoints} points</div>
              </div>
            </div>

            {useRewardPoints && (
              <CAlert color="success" className="mt-3 mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">✅ Discount Applied:</span>
                  <span className="fw-bold fs-5">
                    ₹{availableRewardDiscount.toFixed(2)}
                  </span>
                </div>
                <small className="d-block mt-1">
                  Using {availableRewardDiscount} reward points (1 point = ₹1)
                </small>
              </CAlert>
            )}

            {customerPoints < totalRewardPoints && (
              <CAlert color="warning" className="mt-2 mb-0 py-2">
                <small>
                  ⚠️ Customer has {customerPoints} points available. 
                  Need {totalRewardPoints - customerPoints} more points for full discount.
                </small>
              </CAlert>
            )}
          </div>
        )}

        {/* No customer selected warning */}
        {!selectedCustomer && totalRewardPoints > 0 && (
          <CAlert color="info" className="mb-4">
            <small>
              ℹ️ Select a customer to use reward points. This cart has {totalRewardPoints} reward points available.
            </small>
          </CAlert>
        )}

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
            </div>
          ) : couponCode ? (
            <small className="text-danger d-block mt-2">
              ❌ Invalid Coupon
            </small>
          ) : null}
        </div>

        {/* Select Items */}
        <div className="border rounded p-3 mb-3">
          <h6 className="fw-bold mb-2">Select Items for Item-Specific Discount:</h6>
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
                const itemRewardPoints = Number(item.rewardPoints) || 0;
                return (
                  <div key={item.id} className="d-flex align-items-center border p-2 mb-2 rounded"> 
                    <CFormCheck
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="me-2"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{item.itemName}</div>
                          <small className="text-muted">
                            Qty: {item.quantity}, Price: ₹{item.adjustedPrice}
                          </small>
                        </div>
                        {itemRewardPoints > 0 && (
                          <span className="badge bg-warning text-dark">
                            🎁 {itemRewardPoints * item.quantity} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-muted">No items in cart.</p>
          )}
        </div>

        {/* Discount Preview */}
        {(selectedItemIds.length > 0 || couponDiscount.value || useRewardPoints) && (
          <CAlert color="info" className="mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <strong>Total Discount Preview:</strong>
              <strong className="fs-5">₹{calculatePreview().toFixed(2)}</strong>
            </div>
            {useRewardPoints && (
              <div className="mt-2">
                <small className="text-muted">
                  (Includes ₹{calculateRewardPointsDiscount().toFixed(2)} from reward points)
                </small>
              </div>
            )}
          </CAlert>
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
            (selectedItemIds.length === 0 && !couponDiscount.value && !useRewardPoints) ||
            (!discountValue && !couponDiscount.value && !useRewardPoints)
          }
        >
          Apply Discount
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DiscountModal;