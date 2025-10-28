import React, { useState } from "react";
import { fetchCustomers, addCustomer ,} from '../redux/slices/customerSlice'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormInput,
} from "@coreui/react";

const PaymentModal = React.forwardRef(({
  showPaymentModal,
  setShowPaymentModal,
  paymentType,
  setPaymentType,
  handlePaymentSubmit
}, ref) => {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [numPeople, setNumPeople] = useState(2);

  // Handle payment type selection
  const handleSelectPayment = async(value) => {
    setPaymentType(value);
    if (value === "Split") {
      setNumPeople(2); // default number of people
      setShowSplitModal(true);
    }
  };

  // Handle number of people selection
  const handleNumPeopleChange = (e) => {
    setNumPeople(parseInt(e.target.value, 10));
  };

  // Handle submit (send only type to backend)
  const handleSubmit = () => {
    handlePaymentSubmit({
      type: paymentType // "Cash", "Online", "Card", or "Split"
    });
    setShowPaymentModal(false);
    setShowSplitModal(false);
  };

  return (
    <>
      {/* Main Payment Type Modal */}
      <CModal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
        <CModalHeader>
          <CModalTitle>Select Payment Type</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormSelect
            value={paymentType}
            onChange={(e) => handleSelectPayment(e.target.value)}
          >
            <option value="">Select Payment Type</option>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
            <option value="Card">Card</option>
            <option value="Split">Split</option>
          </CFormSelect>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleSubmit}>
            Submit
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Split Modal (UI only) */}
      <CModal visible={showSplitModal} onClose={() => setShowSplitModal(false)}>
        <CModalHeader>
          <CModalTitle>Split Payment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormSelect value={numPeople} onChange={handleNumPeopleChange}>
            <option value={2}>2 People</option>
            <option value={3}>3 People</option>
            <option value={4}>4 People</option>
            <option value={5}>5 People</option>
          </CFormSelect>

          {/* Inputs are UI only, not saved */}
          {Array.from({ length: numPeople }, (_, index) => (
            <div key={index} className="mt-2">
              <CFormInput
                type="text"
                placeholder={`Person ${index + 1} name (UI only)`}
              />
            </div>
          ))}
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleSubmit}>
            Save Split
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
});

PaymentModal.displayName = 'PaymentModal';

export default PaymentModal;
