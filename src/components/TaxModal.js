import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormCheck,
} from '@coreui/react';

const TaxModal = ({
  showTaxModal,
  setShowTaxModal,
  cart = [],  // Ensure cart is always an array
  handleTaxSubmit,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [taxPercentage, setTaxPercentage] = useState('');

  const toggleSelection = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const onSubmit = () => {
    handleTaxSubmit(selectedItemIds, Number(taxPercentage));
    setSelectedItemIds([]);
    setTaxPercentage('');
    setShowTaxModal(false);
  };

  return (
    <CModal visible={showTaxModal} onClose={() => setShowTaxModal(false)}>
      <CModalHeader>
        <CModalTitle>Select Items & Enter Tax %</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {cart.map((item) => (
          <CFormCheck
            key={item.id || item._id}
            type="checkbox"
            label={`${item.itemName} (Qty: ${item.quantity}, Price: ₹${item.price})`}
            checked={selectedItemIds.includes(item.id || item._id)}
            onChange={() => toggleSelection(item.id || item._id)}
          />
        ))}
        <CFormInput
          type="number"
          placeholder="Tax % (e.g. 5)"
          value={taxPercentage}
          onChange={(e) => setTaxPercentage(e.target.value)}
          className="mt-3"
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={onSubmit}>
          Apply Tax
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default TaxModal;
