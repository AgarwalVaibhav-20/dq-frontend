import React from "react";
import { useSelector } from 'react-redux';

const KOTModal = React.forwardRef(({ isVisible, onClose, children }, ref) => {
  const theme = useSelector((state) => state.theme.theme);
  const isDarkMode = theme === 'dark';

  if (!isVisible) return null;

  // Theme-aware colors
  const modalBackground = isDarkMode ? "#1e1e1e" : "#fff";
  const closeButtonColor = isDarkMode ? "#fff" : "#000";
  const overlayBackground = isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: overlayBackground,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: modalBackground,
          borderRadius: "8px",
          padding: "10px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
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
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
});

KOTModal.displayName = 'KOTModal';

export default KOTModal;
