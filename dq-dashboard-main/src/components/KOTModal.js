import React from "react";

const KOTModal = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
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
            color: "black",
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default KOTModal;
