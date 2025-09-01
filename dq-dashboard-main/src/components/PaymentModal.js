import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormSelect } from '@coreui/react';

const PaymentModal = ({
  showPaymentModal,
  setShowPaymentModal,
  paymentType,
  setPaymentType,
  splitPercentages,
  setSplitPercentages,
  handlePaymentSubmit,
}) => {
  return (
    <CModal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
      <CModalHeader>
        <CModalTitle>Select Payment Type</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormSelect value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
          <option value="">Select Payment Type</option>
          <option value="cash">Cash</option>
          <option value="online">Online</option>
          <option value="credit_card">Card</option>
          <option value="split">Split</option>
        </CFormSelect>
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={handlePaymentSubmit}>
          Submit
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default PaymentModal;