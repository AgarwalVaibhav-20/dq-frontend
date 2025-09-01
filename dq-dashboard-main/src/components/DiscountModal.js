import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormInput } from '@coreui/react';

const DiscountModal = ({ showDiscountModal, setShowDiscountModal, inputValue, setInputValue, handleDiscountSubmit }) => {
  return (
    <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)}>
      <CModalHeader>
        <CModalTitle>Enter Discount Percentage (%)</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          type="number"
          placeholder="e.g. 10"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={handleDiscountSubmit}>
          Submit
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DiscountModal;