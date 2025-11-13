import React from "react";
import { useSelector } from 'react-redux';

const InvoiceModal = React.forwardRef(({ isVisible, onClose, children }, ref) => {
  const theme = useSelector((state) => state.theme.theme);
  const isDarkMode = theme === 'dark';

  if (!isVisible) return null;

  // Theme-aware colors
  const modalBackground = isDarkMode ? "#1e1e1e" : "#fff";
  const closeButtonColor = isDarkMode ? "#fff" : "#333";
  const overlayBackground = isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)";

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
        backgroundColor: overlayBackground,
        zIndex: 9999, // Ensure modal is always on top
        padding: "20px", // Prevent content from getting cut off
      }}
    >
      <div
        style={{
          background: modalBackground,
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
            color: closeButtonColor,
            zIndex: 10, // Ensure it's always visible
          }}
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
});

InvoiceModal.displayName = 'InvoiceModal';

export default InvoiceModal;
