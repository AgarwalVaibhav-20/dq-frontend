import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchRestaurantDetails } from '../redux/slices/authSlice';

const Invoice = React.forwardRef(
  (
    {
      tableNumber,
      selectedCustomerName,
      cart,
      calculateSubtotal,
      tax,
      calculateTaxAmount,
      discount,
      calculateDiscountAmount,
      calculateTotal,
      selectedSystem,
    },
    ref,
  ) => {
    // Get tax display name
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
    const dispatch = useDispatch();
    const restaurantId = useSelector((state) => state.auth.restaurantId);
    const token = useSelector((state) => state.auth.token);
    const hasFetched = useRef(false);
    const { auth } = useSelector((state) => state.auth, shallowEqual);

    useEffect(() => {
      if (restaurantId && token && !hasFetched.current) {
        dispatch(fetchRestaurantDetails({ restaurantId, token }));
        hasFetched.current = true; // Ensures API call happens only once
      }
    }, [restaurantId, token, dispatch]);


    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return (
      <div
        id="invoice-section"
        ref={ref} // Forward the ref to this div
        style={{
          display: 'none',
          width: "2in",
          maxWidth: "2in",
          padding: '10px',
          marginBottom: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.2',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Restaurant Details */}
        <h2 style={{ fontSize: '14px', marginBottom: '5px' }}>
          {auth?.restName || 'Restaurant Name'}
        </h2>
        <p style={{ margin: '2px 0' }}>{auth?.address || 'Restaurant Address'}</p>
        <p style={{ margin: '2px 0' }}>
          <strong>Pin Code:</strong> {auth?.pinCode || 'XXXXX'}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Phone:</strong> {auth?.phoneNumber || 'N/A'}
        </p>

        <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

        {/* Invoice Heading */}
        <h2 style={{ fontSize: '14px', margin: '5px 0' }}>INVOICE</h2>

        {/* Invoice Details */}
        <p style={{ margin: '2px 0' }}>
          <strong>Date:</strong> {currentDate}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Table:</strong> {tableNumber}
        </p>
        {selectedCustomerName ? (
          <p style={{ margin: '2px 0' }}>
            <strong>Customer:</strong> {selectedCustomerName}
          </p>
        ) : (
          <p style={{ margin: '2px 0' }}>
            <strong>Customer ID:</strong> CUST-{Math.floor(1000 + Math.random() * 9000)}
          </p>
        )}

        <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

        {/* Order Details */}
        <h4 style={{ fontSize: '12px', margin: '5px 0' }}>Order Details:</h4>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
          {cart.map((item) => {
            console.log("item from bill,=>", item)
            const price = item.adjustedPrice || item.price || item.subtotal || 0;
            const quantity = item.quantity || 1;
            const itemName = item.itemName || item.item_name || 'Unknown Item';
            const selectedSize = item.selectedSize || '';
            
            return (
              <li key={item.id || item._id || item.itemId} style={{ margin: '2px 0' }}>
                {itemName}{selectedSize ? ` (${selectedSize})` : ''} x {quantity} - ₹{(Number(price) * quantity).toFixed(2)}
              </li>
            );
          })}
        </ul>

        <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

        {/* Pricing Breakdown */}
        <p style={{ margin: '2px 0' }}>
          <strong>Subtotal:</strong> ₹{calculateSubtotal()}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>{getTaxDisplayName()}:</strong> ₹{calculateTaxAmount().toFixed(2)}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Discount :</strong> ₹{calculateDiscountAmount().toFixed(2)}
        </p>
        {selectedSystem && (
          <p style={{ margin: '2px 0' }}>
            <strong>System Charge ({selectedSystem.systemName}) :</strong> ₹{Number(selectedSystem.chargeOfSystem || 0).toFixed(2)}
          </p>
        )}

        <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

        {/* Total Amount */}
        <h3 style={{ fontSize: '14px', margin: '5px 0' }}>
          Total: ₹{calculateTotal()}
        </h3>
        <h3 style={{ fontSize: '10px', margin: '5px 0', textAlign: 'center', paddingBottom: '10px' }}>
          ---Thank you for visiting---
        </h3>
      </div>
    );
  },
);

export default Invoice;
