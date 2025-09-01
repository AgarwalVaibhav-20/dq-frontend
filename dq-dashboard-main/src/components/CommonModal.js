import React from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react'

const CommonModal = ({ visible, onClose, title, children, onConfirm, confirmButtonText, confirmButtonColor, isLoading, formId }) => {

  const handleConfirm = () => {
    if (formId) {
      // Trigger form submission
      document.getElementById(formId).requestSubmit();
    } else {
      // Fallback to onConfirm
      onConfirm();
    }
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{children}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color={confirmButtonColor || 'primary'} onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? 'Loading...' : confirmButtonText}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default CommonModal