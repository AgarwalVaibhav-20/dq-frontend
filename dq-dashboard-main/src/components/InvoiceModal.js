import React from "react";

const InvoiceModal = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
        zIndex: 9999, // Ensure modal is always on top
        padding: "20px", // Prevent content from getting cut off
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          width: "90%",
          maxWidth: "450px",
          maxHeight: "90vh", // Prevent overflow on smaller screens
          overflowY: "auto", // Allow scrolling if content is large
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#333",
            zIndex: 10, // Ensure it's always visible
          }}
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
};

export default InvoiceModal;
