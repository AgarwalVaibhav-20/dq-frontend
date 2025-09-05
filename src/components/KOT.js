import React from "react";

const KOT = React.forwardRef(({ tableNumber, cart }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "2in",
        maxWidth: "2in",
        padding: "10px",
        // border: "1px solid #000",
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
            {item.itemName} x {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default KOT;
