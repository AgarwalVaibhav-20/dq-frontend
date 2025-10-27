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
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';
// Import the thunk for deduction
import { deductRewardPoints } from '../redux/slices/customerSlice'; 

const DiscountModal = ({
  showDiscountModal,
  setShowDiscountModal,
  cart = [],
  handleDiscountSubmit,
  selectedCustomer = null,
}) => {
  const dispatch = useDispatch();
  const { loading: customerLoading } = useSelector((state) => state.customers);

  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [manualRewardPoints, setManualRewardPoints] = useState('');

  // Use totalReward for customer's available points
  const customerEarnedPoints = selectedCustomer ? Number(selectedCustomer.rewardCustomerPoints) || 0 : 0;
  const customerAdminPoints = selectedCustomer ? Number(selectedCustomer.rewardByAdminPoints) || 0 : 0;
  const customerTotalPoints = selectedCustomer ? Number(selectedCustomer.totalReward) || 0 : 0;
  const [couponError, setCouponError] = useState(''); // Error message for coupon

  useEffect(() => {
    if (showDiscountModal) {
      setSelectedItemIds([]);
      setDiscountValue('');
      setDiscountType('percentage');
      setCouponCode('');
      setCouponDiscount(0);
      setUseRewardPoints(false);
      setCouponError(''); // Reset error message
      setManualRewardPoints('');
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
        
        // Check max usage before applying
        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
          setCouponDiscount(0);
          setCouponError(`Coupon usage limit exceeded. Used: ${coupon.usageCount}/${coupon.maxUsage}`);
          return;
        }

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
        setCouponError(''); // Clear error message on success
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

  const calculateTotalRewardPointsFromCart = () => {
    return cart.reduce((total, item) => {
      const itemRewardPoints = Number(item.rewardPoints) || 0;
      return total + (itemRewardPoints * item.quantity);
    }, 0);
  };

  const calculatePointsToUse = () => {
    const manualPoints = Number(manualRewardPoints) || 0;
    const autoPoints = useRewardPoints ? calculateTotalRewardPointsFromCart() : 0;
    const totalDesiredPoints = manualPoints + autoPoints;
    
    // This is the fix for the "40 -> 38" issue.
    // We cap the *total desired points* by the *total available points*.
    const finalPointsToUse = Math.min(totalDesiredPoints, customerTotalPoints);
    
    return {
      totalDesired: totalDesiredPoints,
      finalPointsToUse: finalPointsToUse,
      discountAmount: finalPointsToUse // 1 point = 1 Rupee
    };
  };

  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.adjustedPrice * item.quantity), 0);
  };

  const onSubmit = async () => {
    const { finalPointsToUse, discountAmount } = calculatePointsToUse();

    if (
      (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
      (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
    ) {
      console.warn('Invalid submission: No discount to apply');
      // You might want to show a toast message here
      return;
    }

    // *** NEW: Dispatch Redux thunk for reward points deduction (saves to backend immediately)
    // if (finalPointsToUse > 0 && selectedCustomer) {
    //   try {
    //     await dispatch(deductRewardPoints({
    //       customerId: selectedCustomer._id,
    //       pointsToDeduct: finalPointsToUse,
    //     })).unwrap();  // Await and handle rejection
    //     console.log('✅ Reward points deducted and saved to backend via Redux');
    //     // Optional: Update local selectedCustomer if needed (but Redux will refresh via fetch if called elsewhere)
    //   } catch (error) {
    //     console.error('❌ Failed to deduct reward points:', error);
    //     // The slice already shows toast.error; abort submission
    //     return;
    //   }
    // }

    // Note: Usage count will be incremented only after successful payment
    // This is just applying the coupon to the cart, not finalizing the order

    const discounts = {
      selectedItemDiscount: {
        ids: selectedItemIds,
        value: Number(discountValue),
        type: discountType,
      },
      coupon: couponDiscount.value ? couponDiscount : null, // Pass full coupon object or null
      
      // *** MODIFIED ***
      // Pass the reward points calculation back to POSTableContent
      rewardPoints: finalPointsToUse > 0 ? {
        enabled: true,
        pointsUsed: finalPointsToUse,
        discountAmount: discountAmount, // This is the amount (1 point = ₹1)
      } : null,
      
      // This section is removed as it's now combined into 'rewardPoints'
      // manualRewardPoints: null, 
    };

    console.log('Submitting discounts to parent:', discounts);
    handleDiscountSubmit(discounts);

    // Reset form
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setCouponCode('');
    setCouponDiscount(0);
    setUseRewardPoints(false);
    setCouponError(''); // Reset error message
    setManualRewardPoints('');
    setShowDiscountModal(false);
  };

  const calculatePreview = () => {
    let totalDiscount = 0;

    // Item-specific discounts
    if (discountValue && selectedItemIds.length > 0) {
      totalDiscount += selectedItemIds.reduce((total, itemId) => {
        const item = cart.find((cartItem) => (cartItem.id || cartItem._id) === itemId);
        if (!item) return total;
        const itemSubtotal = item.adjustedPrice * item.quantity;
        let itemDiscount = 0;
        if (discountType === 'percentage') {
          itemDiscount = (itemSubtotal * Number(discountValue)) / 100;
        } else if (discountType === 'fixed') {
          // Note: Fixed discount is usually per-item, not total. 
          // Adjust this if it's a total fixed amount spread across items.
          // Assuming 'discountValue' is per item selected:
          // itemDiscount = Number(discountValue) * item.quantity;
          // Assuming 'discountValue' is a total to be applied once:
          itemDiscount = Number(discountValue); 
        }
        return total + itemDiscount;
      }, 0);
    }

    // Coupon discounts
    if (couponDiscount.value) {
      if (couponDiscount.type === 'percentage') {
        const subtotal = calculateCartSubtotal();
        const calculatedDiscountAmount = (subtotal * couponDiscount.value) / 100;
        
        // Check if max discount limit exists and apply it
        if (couponDiscount.maxDiscountAmount && calculatedDiscountAmount > couponDiscount.maxDiscountAmount) {
          totalDiscount += couponDiscount.maxDiscountAmount;
        } else {
          totalDiscount += calculatedDiscountAmount;
        }
      } else if (couponDiscount.type === 'fixed') {
        // For fixed discount, check if it exceeds max discount limit
        if (couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount) {
          totalDiscount += couponDiscount.maxDiscountAmount;
        } else {
          totalDiscount += couponDiscount.value;
        }
      }
    }

    // Reward points discount (both manual and auto)
    const { discountAmount } = calculatePointsToUse();
    totalDiscount += discountAmount;

    return totalDiscount;
  };

  const validCart = Array.isArray(cart) ? cart : [];
  const hasItems = validCart.length > 0;
  const totalRewardPointsFromCart = calculateTotalRewardPointsFromCart();
  
  const { totalDesired, finalPointsToUse, discountAmount: rewardDiscountAmount } = calculatePointsToUse();
  const manualPointsEntered = Number(manualRewardPoints) || 0;

  return (
    <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Discount / Coupon / Reward Points</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Manual Reward Points Section (Admin) */}
        {selectedCustomer && (
          <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#e7f3ff' }}>
            <h6 className="fw-bold mb-3 text-dark">👤 Use Reward Points</h6>

            <div className="row mb-3">
              <div className="col-4">
                <small className="text-muted d-block mb-1">Earned Points:</small>
                <div className="fw-bold text-success fs-6">{customerEarnedPoints} pts</div>
              </div>
              {/* <div className="col-4">
                <small className="text-muted d-block mb-1">Admin Points:</small>
                <div className="fw-bold text-primary fs-6">{customerAdminPoints} pts</div>
              </div> */}
              <div className="col-4">
                <small className="text-muted d-block mb-1">Total Available:</small>
                <div className="fw-bold text-dark fs-5">{customerTotalPoints} pts</div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Enter Reward Points to Use:</label>
              <CFormInput
                type="number"
                placeholder="Enter points (e.g., 50)"
                value={manualRewardPoints}
                onChange={(e) => setManualRewardPoints(e.target.value)}
                min="0"
                // max={customerTotalPoints} // We won't set max, we'll just show a warning
              />
              <small className="text-muted">1 point = ₹1 discount</small>
            </div>
            
            {/* Automatic Reward Points Section */}
            {totalRewardPointsFromCart > 0 && (
              <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#fff3cd' }}>
                <CFormCheck
                  type="checkbox"
                  id="useRewardPoints"
                  label={
                    <span className="fw-bold">
                      Also use {totalRewardPointsFromCart} points from items in cart?
                    </span>
                  }
                  checked={useRewardPoints}
                  onChange={(e) => setUseRewardPoints(e.target.checked)}
                />
              </div>
            )}

            {rewardDiscountAmount > 0 && (
              <CAlert color="success" className="mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">✅ Reward Discount Applied:</span>
                  <span className="fw-bold fs-5">
                    ₹{rewardDiscountAmount.toFixed(2)}
                  </span>
                </div>
                <small className="d-block mt-1">
                  Using {finalPointsToUse} reward points for this order.
                </small>
              </CAlert>
            )}

            {totalDesired > customerTotalPoints && (
              <CAlert color="danger" className="mt-2 mb-0 py-2">
                <small>
                  ❌ You are trying to use {totalDesired} points, but the
                  customer only has {customerTotalPoints} points available.
                  The discount will be capped at ₹{customerTotalPoints.toFixed(2)}.
                </small>
              </CAlert>
            )}
          </div>
        )}

        {/* No customer selected warning */}
        {!selectedCustomer && (
          <CAlert color="info" className="mb-4">
            <small>
              ℹ️ Select a customer to use reward points.
            </small>
          </CAlert>
        )}

        {/* Discount Type */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Item-Specific Discount Type:</label>
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
            {discountType === 'percentage' ? 'Item Discount %' : 'Item Discount ₹'}
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
                    <span className="text-success ms-1">
                      ₹{(() => {
                        const subtotal = calculateCartSubtotal();
                        let actualDiscount = 0;
                        
                        if (couponDiscount.type === 'percentage') {
                          const calculatedDiscount = (subtotal * couponDiscount.value) / 100;
                          actualDiscount = couponDiscount.maxDiscountAmount && calculatedDiscount > couponDiscount.maxDiscountAmount 
                            ? couponDiscount.maxDiscountAmount 
                            : calculatedDiscount;
                        } else if (couponDiscount.type === 'fixed') {
                          actualDiscount = couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount 
                            ? couponDiscount.maxDiscountAmount 
                            : couponDiscount.value;
                        }
                        
                        return actualDiscount.toFixed(2);
                      })()}
                    </span>
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
                  <div className="mb-2">
                    <strong>Usage:</strong>
                    <span className="text-info ms-1">
                      {couponDiscount.usageCount || 0}
                      {couponDiscount.maxUsage ? `/${couponDiscount.maxUsage}` : ''}
                      {couponDiscount.maxUsage && couponDiscount.usageCount >= couponDiscount.maxUsage ? 
                        ' (Limit Reached)' : ''
                      }
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

              {/* Max Discount Warning */}
              {(() => {
                const subtotal = calculateCartSubtotal();
                let showWarning = false;
                let warningMessage = '';
                
                if (couponDiscount.type === 'percentage') {
                  const calculatedDiscount = (subtotal * couponDiscount.value) / 100;
                  if (couponDiscount.maxDiscountAmount && calculatedDiscount > couponDiscount.maxDiscountAmount) {
                    showWarning = true;
                    warningMessage = `Max discount limit of ₹${couponDiscount.maxDiscountAmount} applied instead of calculated ₹${calculatedDiscount.toFixed(2)}`;
                  }
                } else if (couponDiscount.type === 'fixed') {
                  if (couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount) {
                    showWarning = true;
                    warningMessage = `Max discount limit of ₹${couponDiscount.maxDiscountAmount} applied instead of ₹${couponDiscount.value}`;
                  }
                }
                
                return showWarning ? (
                  <div className="mt-2">
                    <div className="alert alert-warning py-2 mb-0">
                      <small>
                        <strong>⚠️ Max Discount Applied:</strong> {warningMessage}
                      </small>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : couponCode ? (
            <small className="text-danger d-block mt-2">
              ❌ Invalid Coupon
            </small>
          ) : null}
          
          {/* Coupon Error Message */}
          {couponError && (
            <div className="mt-2">
              <div className="alert alert-danger py-2 mb-0">
                <small>
                  <strong>❌ Error:</strong> {couponError}
                </small>
              </div>
            </div>
          )}
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
        {(selectedItemIds.length > 0 || (couponDiscount && couponDiscount.amount > 0) || rewardDiscountAmount > 0) && (
          <CAlert color="info" className="mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <strong>Total Discount Preview:</strong>
              <strong className="fs-5">₹{calculatePreview().toFixed(2)}</strong>
            </div>
            {rewardDiscountAmount > 0 && (
              <div className="mt-2">
                <small className="text-muted">
                  (Includes ₹{rewardDiscountAmount.toFixed(2)} from reward points)
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
            customerLoading ||  // Existing: customer loading
            // *** NEW: Include thunk loading for deduction
            (finalPointsToUse > 0 && customerLoading) ||  // Deduction-specific loading check
            (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
            (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
          }
        >
          {customerLoading ? 'Processing...' : 'Apply Discount'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DiscountModal;

// import React, { useState, useEffect } from 'react';
// import {
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
//   CButton,
//   CFormInput,
//   CFormCheck,
//   CAlert,
// } from '@coreui/react';
// import { useDispatch, useSelector } from 'react-redux';
// import axios from 'axios';
// import { BASE_URL } from '../utils/constants';
// // No need to import deductRewardPoints here, POSTableContent will handle it.
// // import { deductRewardPoints } from '../redux/slices/customerSlice'; 

// const DiscountModal = ({
//   showDiscountModal,
//   setShowDiscountModal,
//   cart = [],
//   handleDiscountSubmit,
//   selectedCustomer = null,
// }) => {
//   const dispatch = useDispatch();
//   const { loading: customerLoading } = useSelector((state) => state.customers);

//   const [selectedItemIds, setSelectedItemIds] = useState([]);
//   const [discountValue, setDiscountValue] = useState('');
//   const [discountType, setDiscountType] = useState('percentage');
//   const [couponCode, setCouponCode] = useState('');
//   const [couponDiscount, setCouponDiscount] = useState(0);
//   const [useRewardPoints, setUseRewardPoints] = useState(false);
//   const [manualRewardPoints, setManualRewardPoints] = useState('');

//   // Use totalReward for customer's available points
//   const customerEarnedPoints = selectedCustomer ? Number(selectedCustomer.rewardCustomerPoints) || 0 : 0;
//   const customerAdminPoints = selectedCustomer ? Number(selectedCustomer.rewardByAdminPoints) || 0 : 0;
//   const customerTotalPoints = selectedCustomer ? Number(selectedCustomer.totalReward) || 0 : 0;


//   useEffect(() => {
//     if (showDiscountModal) {
//       setSelectedItemIds([]);
//       setDiscountValue('');
//       setDiscountType('percentage');
//       setCouponCode('');
//       setCouponDiscount(0);
//       setUseRewardPoints(false);
//       setManualRewardPoints('');
//     }
//   }, [showDiscountModal, cart]);

//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (couponCode.trim()) {
//         validateCoupon(couponCode);
//       } else {
//         setCouponDiscount(0);
//       }
//     }, 500);

//     return () => clearTimeout(timeoutId);
//   }, [couponCode]);

//   const toggleSelection = (itemId) => {
//     setSelectedItemIds((prev) =>
//       prev.includes(itemId)
//         ? prev.filter((id) => id !== itemId)
//         : [...prev, itemId]
//     );
//   };

//   const selectAll = () => {
//     if (selectedItemIds.length === cart.length) {
//       setSelectedItemIds([]);
//     } else {
//       setSelectedItemIds(cart.map((item) => item.id || item._id));
//     }
//   };

//   const validateCoupon = async (code) => {
//     if (!code || code.trim() === '') {
//       setCouponDiscount(0);
//       return;
//     }

//     try {
//       const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

//       const token = localStorage.getItem('authToken');
//       const response = await axios.post(`${BASE_URL}/api/coupon/validate`, {
//         couponCode: code.trim(),
//         orderTotal: orderTotal
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });

//       if (response.data.success) {
//         const coupon = response.data.coupon;
//         setCouponDiscount({
//           type: coupon.discountType,
//           value: coupon.discountValue,
//           amount: coupon.discountAmount,
//           id: coupon.id,
//           code: coupon.code,
//           expiryDate: coupon.expiryDate,
//           minOrderValue: coupon.minOrderValue,
//           maxDiscountAmount: coupon.maxDiscountAmount,
//           usageCount: coupon.usageCount,
//           maxUsage: coupon.maxUsage,
//           description: coupon.description
//         });
//       } else {
//         setCouponDiscount(0);
//       }
//     } catch (error) {
//       console.error('Error validating coupon:', error);
//       setCouponDiscount(0);
//     }
//   };

//   const handleApplyCoupon = () => {
//     if (couponCode.trim()) {
//       validateCoupon(couponCode);
//     }
//   };

//   const calculateTotalRewardPointsFromCart = () => {
//     return cart.reduce((total, item) => {
//       const itemRewardPoints = Number(item.rewardPoints) || 0;
//       return total + (itemRewardPoints * item.quantity);
//     }, 0);
//   };

//   const calculatePointsToUse = () => {
//     const manualPoints = Number(manualRewardPoints) || 0;
//     const autoPoints = useRewardPoints ? calculateTotalRewardPointsFromCart() : 0;
//     const totalDesiredPoints = manualPoints + autoPoints;


//     // This is the fix for the "40 -> 38" issue.
//     // We cap the *total desired points* by the *total available points*.
//     const finalPointsToUse = Math.min(totalDesiredPoints, customerTotalPoints);

//     return {
//       totalDesired: totalDesiredPoints,
//       finalPointsToUse: finalPointsToUse,
//       discountAmount: finalPointsToUse // 1 point = 1 Rupee
//     };
//   };


//   const calculateCartSubtotal = () => {
//     return cart.reduce((sum, item) => sum + (item.adjustedPrice * item.quantity), 0);
//   };

//   const onSubmit = async () => {
//     // We no longer call dispatch(deductRewardPoints) here.
//     // We just pass the *intent* to use points back to POSTableContent.
//     // POSTableContent will be responsible for the final deduction *after* payment.

//     const { finalPointsToUse, discountAmount } = calculatePointsToUse();

//     if (
//       (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
//       (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
//     ) {
//       console.warn('Invalid submission: No discount to apply');
//       // You might want to show a toast message here
//       return;
//     }
//     const adminPointsToUse = customerAdminPoints;
//     const adminDiscountAmount = adminPointsToUse;
//     const discounts = {
//       selectedItemDiscount: {
//         ids: selectedItemIds,
//         value: Number(discountValue),
//         type: discountType,
//       },
//       coupon: couponDiscount.value ? couponDiscount : null, // Pass full coupon object or null

//       // *** MODIFIED ***
//       // Pass the reward points calculation back to POSTableContent
//       rewardPoints: finalPointsToUse > 0 ? {
//         enabled: true,
//         pointsUsed: finalPointsToUse,
//         discountAmount: discountAmount, // This is the amount (1 point = ₹1)
//       } : null,

//       adminRewardPoints: adminPointsToUse > 0 ? {
//         enabled: true,
//         pointsUsed: adminPointsToUse,
//         discountAmount: adminDiscountAmount, // ₹ value for admin points
//       } : null

//       // This section is removed as it's now combined into 'rewardPoints'
//       // manualRewardPoints: null, 
//     };

//     console.log('Submitting discounts to parent:', discounts);
//     handleDiscountSubmit(discounts);

//     // Reset form
//     setSelectedItemIds([]);
//     setDiscountValue('');
//     setDiscountType('percentage');
//     setCouponCode('');
//     setCouponDiscount(0);
//     setUseRewardPoints(false);
//     setManualRewardPoints('');
//     setShowDiscountModal(false);
//   };

//   const calculatePreview = () => {
//     let totalDiscount = 0;

//     // Item-specific discounts
//     if (discountValue && selectedItemIds.length > 0) {
//       totalDiscount += selectedItemIds.reduce((total, itemId) => {
//         const item = cart.find((cartItem) => (cartItem.id || cartItem._id) === itemId);
//         if (!item) return total;
//         const itemSubtotal = item.adjustedPrice * item.quantity;
//         let itemDiscount = 0;
//         if (discountType === 'percentage') {
//           itemDiscount = (itemSubtotal * Number(discountValue)) / 100;
//         } else if (discountType === 'fixed') {
//           // Note: Fixed discount is usually per-item, not total. 
//           // Adjust this if it's a total fixed amount spread across items.
//           // Assuming 'discountValue' is per item selected:
//           // itemDiscount = Number(discountValue) * item.quantity;
//           // Assuming 'discountValue' is a total to be applied once:
//           itemDiscount = Number(discountValue);
//         }
//         return total + itemDiscount;
//       }, 0);
//     }

//     // Coupon discounts
//     if (couponDiscount && couponDiscount.amount) {
//       totalDiscount += couponDiscount.amount;
//     }

//     // Reward points discount (both manual and auto)
//     const { discountAmount } = calculatePointsToUse();
//     totalDiscount += discountAmount;

//     return totalDiscount;
//   };

//   const validCart = Array.isArray(cart) ? cart : [];
//   const hasItems = validCart.length > 0;
//   const totalRewardPointsFromCart = calculateTotalRewardPointsFromCart();

//   const { totalDesired, finalPointsToUse, discountAmount: rewardDiscountAmount } = calculatePointsToUse();
//   const manualPointsEntered = Number(manualRewardPoints) || 0;

//   return (
//     <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)} size="lg">
//       <CModalHeader>
//         <CModalTitle>Apply Discount / Coupon / Reward Points</CModalTitle>
//       </CModalHeader>
//       <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//         {/* Manual Reward Points Section (Admin) */}
//         {selectedCustomer && (
//           <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#e7f3ff' }}>
//             <h6 className="fw-bold mb-3 text-dark">👤 Use Reward Points</h6>

//             <div className="row mb-3">
//               <div className="col-4">
//                 <small className="text-muted d-block mb-1">Earned Points:</small>
//                 <div className="fw-bold text-success fs-6">{customerEarnedPoints} pts</div>
//               </div>
//               {/* <div className="col-4">
//                 <small className="text-muted d-block mb-1">Admin Points:</small>
//                 <div className="fw-bold text-primary fs-6">{customerAdminPoints} pts</div>
//               </div> */}
//               <div className="col-4">
//                 <small className="text-muted d-block mb-1">Total Available:</small>
//                 <div className="fw-bold text-dark fs-5">{customerTotalPoints} pts</div>
//               </div>
//             </div>

//             <div className="mb-3">
//               <label className="form-label fw-bold">Enter Reward Points to Use:</label>
//               <CFormInput
//                 type="number"
//                 placeholder="Enter points (e.g., 50)"
//                 value={manualRewardPoints}
//                 onChange={(e) => setManualRewardPoints(e.target.value)}
//                 min="0"
//               // max={customerTotalPoints} // We won't set max, we'll just show a warning
//               />
//               <small className="text-muted">1 point = ₹1 discount</small>
//             </div>

//             {/* Automatic Reward Points Section */}
//             {totalRewardPointsFromCart > 0 && (
//               <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#fff3cd' }}>
//                 <CFormCheck
//                   type="checkbox"
//                   id="useRewardPoints"
//                   label={
//                     <span className="fw-bold">
//                       Also use {totalRewardPointsFromCart} points from items in cart?
//                     </span>
//                   }
//                   checked={useRewardPoints}
//                   onChange={(e) => setUseRewardPoints(e.target.checked)}
//                 />
//               </div>
//             )}

//             {rewardDiscountAmount > 0 && (
//               <CAlert color="success" className="mb-0">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <span className="fw-bold">✅ Reward Discount Applied:</span>
//                   <span className="fw-bold fs-5">
//                     ₹{rewardDiscountAmount.toFixed(2)}
//                   </span>
//                 </div>
//                 <small className="d-block mt-1">
//                   Using {finalPointsToUse} reward points for this order.
//                 </small>
//               </CAlert>
//             )}

//             {totalDesired > customerTotalPoints && (
//               <CAlert color="danger" className="mt-2 mb-0 py-2">
//                 <small>
//                   ❌ You are trying to use {totalDesired} points, but the
//                   customer only has {customerTotalPoints} points available.
//                   The discount will be capped at ₹{customerTotalPoints.toFixed(2)}.
//                 </small>
//               </CAlert>
//             )}
//           </div>
//         )}

//         {/* No customer selected warning */}
//         {!selectedCustomer && (
//           <CAlert color="info" className="mb-4">
//             <small>
//               ℹ️ Select a customer to use reward points.
//             </small>
//           </CAlert>
//         )}

//         {/* Discount Type */}
//         <div className="mb-4">
//           <label className="form-label fw-bold mb-2">Item-Specific Discount Type:</label>
//           <div className="btn-group w-100" role="group">
//             <button
//               type="button"
//               className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'}`}
//               onClick={() => setDiscountType('percentage')}
//             >
//               Percentage (%)
//             </button>
//             <button
//               type="button"
//               className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'}`}
//               onClick={() => setDiscountType('fixed')}
//             >
//               Fixed (₹)
//             </button>
//           </div>
//         </div>

//         {/* Discount Value */}
//         <div className="mb-4">
//           <label className="form-label fw-bold">
//             {discountType === 'percentage' ? 'Item Discount %' : 'Item Discount ₹'}
//           </label>
//           <CFormInput
//             type="number"
//             placeholder={discountType === 'percentage' ? '10 (for 10%)' : '100 (for ₹100 off)'}
//             value={discountValue}
//             onChange={(e) => setDiscountValue(e.target.value)}
//           />
//         </div>

//         {/* Coupon Code */}
//         <div className="mb-4">
//           <label className="form-label fw-bold">Coupon Code</label>
//           <div className="d-flex">
//             <CFormInput
//               type="text"
//               placeholder="Enter coupon code (e.g., BQHWM70)"
//               value={couponCode}
//               onChange={(e) => setCouponCode(e.target.value)}
//             />
//             <CButton
//               color="success"
//               className="ms-2"
//               onClick={handleApplyCoupon}
//               disabled={!couponCode.trim()}
//             >
//               Apply
//             </CButton>
//           </div>
//           {couponDiscount.value ? (
//             <div className="mt-3 p-3 border rounded bg-light">
//               <div className="d-flex align-items-center mb-2">
//                 <span className="text-success me-2">✅</span>
//                 <span className="fw-bold text-success">Coupon Applied Successfully!</span>
//               </div>

//               <div className="row">
//                 <div className="col-md-6">
//                   <div className="mb-2">
//                     <strong>Code:</strong> <span className="text-primary">{couponDiscount.code}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Discount:</strong>
//                     <span className="text-success ms-1">
//                       {couponDiscount.type === 'percentage'
//                         ? `${couponDiscount.value}% OFF`
//                         : `₹${couponDiscount.value} OFF`}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Discount Amount:</strong>
//                     <span className="text-success ms-1">₹{couponDiscount.amount?.toFixed(2) || '0.00'}</span>
//                   </div>
//                 </div>

//                 <div className="col-md-6">
//                   <div className="mb-2">
//                     <strong>Min Order:</strong>
//                     <span className="text-info ms-1">₹{couponDiscount.minOrderValue || '0'}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Max Discount:</strong>
//                     <span className="text-warning ms-1">₹{couponDiscount.maxDiscountAmount || 'No limit'}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Expires:</strong>
//                     <span className="text-secondary ms-1">
//                       {couponDiscount.expiryDate ? new Date(couponDiscount.expiryDate).toLocaleDateString() : 'N/A'}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {couponDiscount.description && (
//                 <div className="mt-2">
//                   <strong>Description:</strong>
//                   <span className="text-muted ms-1">{couponDiscount.description}</span>
//                 </div>
//               )}
//             </div>
//           ) : couponCode ? (
//             <small className="text-danger d-block mt-2">
//               ❌ Invalid Coupon
//             </small>
//           ) : null}
//         </div>

//         {/* Select Items */}
//         <div className="border rounded p-3 mb-3">
//           <h6 className="fw-bold mb-2">Select Items for Item-Specific Discount:</h6>
//           {hasItems ? (
//             <>
//               <CButton
//                 size="sm"
//                 color="secondary"
//                 className="mb-2"
//                 onClick={selectAll}
//               >
//                 {selectedItemIds.length === validCart.length ? 'Deselect All' : 'Select All'}
//               </CButton>
//               {validCart.map((item) => {
//                 const itemRewardPoints = Number(item.rewardPoints) || 0;
//                 return (
//                   <div key={item.id} className="d-flex align-items-center border p-2 mb-2 rounded">
//                     <CFormCheck
//                       type="checkbox"
//                       checked={selectedItemIds.includes(item.id)}
//                       onChange={() => toggleSelection(item.id)}
//                       className="me-2"
//                     />
//                     <div className="flex-grow-1">
//                       <div className="d-flex justify-content-between align-items-start">
//                         <div>
//                           <div className="fw-bold">{item.itemName}</div>
//                           <small className="text-muted">
//                             Qty: {item.quantity}, Price: ₹{item.adjustedPrice}
//                           </small>
//                         </div>
//                         {itemRewardPoints > 0 && (
//                           <span className="badge bg-warning text-dark">
//                             🎁 {itemRewardPoints * item.quantity} pts
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </>
//           ) : (
//             <p className="text-muted">No items in cart.</p>
//           )}
//         </div>

//         {/* Discount Preview */}
//         {(selectedItemIds.length > 0 || (couponDiscount && couponDiscount.amount > 0) || rewardDiscountAmount > 0) && (
//           <CAlert color="info" className="mb-0">
//             <div className="d-flex justify-content-between align-items-center">
//               <strong>Total Discount Preview:</strong>
//               <strong className="fs-5">₹{calculatePreview().toFixed(2)}</strong>
//             </div>
//             {rewardDiscountAmount > 0 && (
//               <div className="mt-2">
//                 <small className="text-muted">
//                   (Includes ₹{rewardDiscountAmount.toFixed(2)} from reward points)
//                 </small>
//               </div>
//             )}
//           </CAlert>
//         )}
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={() => setShowDiscountModal(false)}>
//           Cancel
//         </CButton>
//         <CButton
//           color="primary"
//           onClick={onSubmit}
//           disabled={
//             customerLoading ||
//             (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
//             (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
//           }
//         >
//           {customerLoading ? 'Processing...' : 'Apply Discount'}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   );
// };

// export default DiscountModal;