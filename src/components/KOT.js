import React from "react";
import { useSelector } from 'react-redux';

const KOT = React.forwardRef(({ 
  tableNumber, 
  cart, 
  selectedSystem,
  subtotal, // Order subtotal (if provided, use it instead of calculating)
  discountAmount, // Order discount amount
  discountPercentage, // Order discount percentage
  taxAmount, // Order tax amount
  taxPercentage, // Order tax percentage
  systemCharge: orderSystemCharge, // Order system charge
  roundOff, // Order round off
}, ref) => {
  // Get theme from Redux store
  const theme = useSelector((state) => state.theme.theme);
  const isDarkMode = theme === 'dark';

  // Calculate subtotal from cart if not provided
  const calculatedSubtotal = cart.reduce((acc, item) => {
    const price = item.adjustedPrice || item.price || (item.subtotal / (item.quantity || 1)) || 0;
    const quantity = item.quantity || 1;
    return acc + (price * quantity);
  }, 0);
  
  // Use provided subtotal or calculated
  const orderSubtotal = subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
  
  // Calculate tax from cart items if not provided
  const calculatedTaxAmount = cart.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0);
  const orderTaxAmount = taxAmount !== undefined ? Number(taxAmount) : calculatedTaxAmount;
  
  // System charge from order or selectedSystem
  const systemCharge = orderSystemCharge !== undefined 
    ? Number(orderSystemCharge) 
    : (selectedSystem ? Number(selectedSystem.chargeOfSystem || 0) : 0);
  
  // Discount amount
  const finalDiscountAmount = discountAmount !== undefined ? Number(discountAmount) : 0;
  
  // Round off
  const finalRoundOff = roundOff !== undefined ? Number(roundOff) : 0;
  
  // Calculate grand total: subtotal + tax + system charge + round off (discount के बिना)
  const grandTotal = Math.max(0, orderSubtotal + orderTaxAmount + systemCharge + finalRoundOff);

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

  // Theme-aware colors - always white background for printing, but dark text colors for dark mode display
  const backgroundColor = "#fff"; // Always white for printing
  const textColor = isDarkMode ? "#000" : "#000"; // Black text for visibility on white
  const borderColor = "#000"; // Black borders for visibility
  const secondaryTextColor = isDarkMode ? "#333" : "#555"; // Darker for better contrast

  return (
    <div
      ref={ref}
      style={{
        width: "2in",
        maxWidth: "2in",
        padding: "10px",
        fontFamily: "monospace",
        fontSize: "14px",
        lineHeight: "1.5",
        margin: "0 auto",
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    >
      <h2 style={{ textAlign: "center", fontSize: "14px", margin: "0 0 10px", color: textColor }}>
        Order Details
      </h2>
      <hr style={{ borderTop: `1px solid ${borderColor}`, margin: "5px 0" }} />

      <p style={{ margin: "2px 0", color: textColor }}>
        <strong>Table:</strong> {tableNumber}
      </p>
      <hr style={{ borderTop: `1px solid ${borderColor}`, margin: "5px 0" }} />

      <h4 style={{ fontSize: "12px", margin: "5px 0", color: textColor }}>Order Details:</h4>
      <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
        {cart.map((item) => {
          const price = item.adjustedPrice || item.price || item.subtotal || 0;
          const quantity = item.quantity || 1;
          const itemName = item.itemName || item.item_name || 'Unknown Item';
          const selectedSize = item.selectedSize || item.size || '';
          
          return (
            <li key={item.id || item._id || item.itemId} style={{ margin: "2px 0" }}>
              <div style={{ color: textColor }}>
                <strong>{itemName}{selectedSize ? ` (${selectedSize})` : ''}</strong> x {quantity}
              </div>
              <div style={{ fontSize: "12px", color: secondaryTextColor }}>
                Price: ₹{Number(price).toFixed(2)}
              </div>
              <div style={{ fontSize: "12px", color: secondaryTextColor }}>
                 Total: ₹{(Number(price) * quantity).toFixed(2)}
              </div>
              {item.notes && (
                <div style={{ fontSize: "11px", fontStyle: "italic", color: secondaryTextColor }}>
                  Notes: {item.notes}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <hr style={{ borderTop: `1px solid ${borderColor}`, margin: "5px 0" }} />
      <p style={{ margin: "2px 0", color: textColor }}>
        <strong>Subtotal:</strong> ₹{orderSubtotal.toFixed(2)}
      </p>
      {finalDiscountAmount > 0 && (
        <p style={{ margin: "2px 0", color: textColor }}>
          <strong>Discount{discountPercentage ? ` (${discountPercentage}%)` : ''}:</strong> -₹{finalDiscountAmount.toFixed(2)}
        </p>
      )}
      {orderTaxAmount > 0 && (
        <p style={{ margin: "2px 0", color: textColor }}>
          <strong>{getTaxDisplayName()}{taxPercentage ? ` (${taxPercentage}%)` : ''}:</strong> ₹{orderTaxAmount.toFixed(2)}
        </p>
      )}
      {systemCharge > 0 && (
        <p style={{ margin: "2px 0", color: textColor }}>
          <strong>System Charge{selectedSystem ? ` (${selectedSystem.systemName})` : ''}:</strong> ₹{systemCharge.toFixed(2)}
        </p>
      )}
      {finalRoundOff !== 0 && (
        <p style={{ margin: "2px 0", color: textColor }}>
          <strong>Round Off:</strong> {finalRoundOff > 0 ? '+' : ''}₹{Math.abs(finalRoundOff).toFixed(2)}
        </p>
      )}
      <hr style={{ borderTop: `1px solid ${borderColor}`, margin: "5px 0" }} />
      <p style={{ textAlign: "right", margin: "5px 0", fontWeight: "bold", color: textColor }}>
        Total: ₹{grandTotal.toFixed(2)}
      </p>
    </div>
  );
});

export default KOT;
