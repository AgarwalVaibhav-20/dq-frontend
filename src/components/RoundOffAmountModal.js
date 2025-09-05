import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormInput } from '@coreui/react';

const RoundOffAmountModal = ({ showRoundOffModal, setShowRoundOffModal, inputValue, setInputValue, handleRoundOffSubmit }) => {
  return (
    <CModal visible={showRoundOffModal} onClose={() => setShowRoundOffModal(false)}>
      <CModalHeader>
        <CModalTitle>Enter round Off Number</CModalTitle>
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
        <CButton color="primary" onClick={handleRoundOffSubmit}>
          Submit
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default RoundOffAmountModal;