import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormInput } from '@coreui/react';

const TaxModal = ({ showTaxModal, setShowTaxModal, inputValue, setInputValue, handleTaxSubmit }) => {
  return (
    <CModal visible={showTaxModal} onClose={() => setShowTaxModal(false)}>
      <CModalHeader>
        <CModalTitle>Enter Tax Percentage (%)</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          type="number"
          placeholder="e.g. 5"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={handleTaxSubmit}>
          Submit
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default TaxModal;