import React from "react";

const KOT = React.forwardRef(({ tableNumber, cart, selectedSystem }, ref) => {
  // Calculate total for the entire order
  const totalAmount = cart.reduce((acc, item) => acc + item.adjustedPrice * item.quantity, 0);
  const systemCharge = selectedSystem ? Number(selectedSystem.chargeOfSystem || 0) : 0;
  const grandTotal = totalAmount + systemCharge;

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
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", fontSize: "14px", margin: "0 0 10px" }}>
        Order Details
      </h2>
      <hr style={{ borderTop: "1px solid #000", margin: "5px 0" }} />

      <p style={{ margin: "2px 0" }}>
        <strong>Table:</strong> {tableNumber}
      </p>
      <hr style={{ borderTop: "1px solid #000", margin: "5px 0" }} />

      <h4 style={{ fontSize: "12px", margin: "5px 0" }}>Order Details:</h4>
      <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
        {cart.map((item) => (
          <li key={item.id} style={{ margin: "2px 0" }}>
            <div>
              <strong>{item.itemName} ({item.selectedSize})</strong> x {item.quantity} 
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              Price: ₹{item.adjustedPrice.toFixed(2)}
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
               Total: ₹{(item.adjustedPrice * item.quantity).toFixed(2)}
            </div>
            {item.notes && (
              <div style={{ fontSize: "11px", fontStyle: "italic", color: "#777" }}>
                Notes: {item.notes}
              </div>
            )}
          </li>
        ))}
      </ul>

      <hr style={{ borderTop: "1px solid #000", margin: "5px 0" }} />
      <p style={{ margin: "2px 0" }}>
        <strong>Subtotal:</strong> ₹{totalAmount.toFixed(2)}
      </p>
      {selectedSystem && (
        <p style={{ margin: "2px 0" }}>
          <strong>System Charge ({selectedSystem.systemName}):</strong> ₹{systemCharge.toFixed(2)}
        </p>
      )}
      <hr style={{ borderTop: "1px solid #000", margin: "5px 0" }} />
      <p style={{ textAlign: "right", margin: "5px 0", fontWeight: "bold" }}>
        Total: ₹{grandTotal.toFixed(2)}
      </p>
    </div>
  );
});

export default KOT;
