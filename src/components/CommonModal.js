import React from "react";
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton, CSpinner } from "@coreui/react";

const CommonModal = ({
  visible,
  onClose,
  title,
  onConfirm,
  confirmButtonText,
  confirmButtonColor = "primary",
  isLoading = false,
  children,
}) => {
  if (!visible) return null;

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>{title}</CModalHeader>
      <CModalBody>{children}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color={confirmButtonColor} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <CSpinner size="sm" /> : confirmButtonText}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CommonModal;
