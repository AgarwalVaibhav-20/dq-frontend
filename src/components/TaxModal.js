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
  cart = [],
  handleTaxSubmit,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [taxValue, setTaxValue] = useState('');
  const [taxType, setTaxType] = useState('percentage'); // 'percentage' or 'fixed'

  const toggleSelection = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    if (selectedItemIds.length === cart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map(item => item.id || item._id));
    }
  };

  const onSubmit = () => {
    if (selectedItemIds.length === 0 || !taxValue || Number(taxValue) <= 0) {
      return;
    }

    handleTaxSubmit(selectedItemIds, Number(taxValue), taxType);

    // Reset form
    setSelectedItemIds([]);
    setTaxValue('');
    setTaxType('percentage');
    setShowTaxModal(false);
  };

  const handleClose = () => {
    setSelectedItemIds([]);
    setTaxValue('');
    setTaxType('percentage');
    setShowTaxModal(false);
  };

  const calculatePreview = () => {
    if (!taxValue || selectedItemIds.length === 0 || Number(taxValue) <= 0) return 0;

    return selectedItemIds.reduce((total, itemId) => {
      const item = cart.find(cartItem => (cartItem.id || cartItem._id) === itemId);
      if (!item) return total;

      const itemSubtotal = item.adjustedPrice * item.quantity;
      let itemTax = 0;
      
      if (taxType === 'percentage') {
        itemTax = (itemSubtotal * Number(taxValue)) / 100;
      } else if (taxType === 'fixed') {
        itemTax = Number(taxValue);
      }

      return total + itemTax;
    }, 0);
  };

  return (
    <CModal visible={showTaxModal} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Tax to Items</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        
        {/* Tax Type Selection */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Select Tax Type:</label>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${taxType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTaxType('percentage')}
            >
              Percentage Tax (%)
            </button>
            <button
              type="button"
              className={`btn ${taxType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setTaxType('fixed')}
            >
              Fixed Amount Tax (₹)
            </button>
          </div>
          <small className="text-muted mt-2 d-block">
            <strong>Selected:</strong> {taxType === 'percentage' ? 'Percentage Tax' : 'Fixed Amount Tax'}
          </small>
        </div>

        {/* Tax Value Input */}
        <div className="mb-4">
          <label className="form-label fw-bold">
            {taxType === 'percentage' ? 'Enter Tax Percentage (%)' : 'Enter Fixed Tax Amount (₹)'}
          </label>
          <CFormInput
            type="number"
            placeholder={
              taxType === 'percentage'
                ? 'e.g., 18 (for 18% tax)'
                : 'e.g., 50 (for ₹50 tax per item)'
            }
            value={taxValue}
            onChange={(e) => setTaxValue(e.target.value)}
            step={taxType === 'percentage' ? '0.01' : '1'}
            min="0"
            className="form-control-lg"
          />
          <small className="text-muted mt-1">
            {taxType === 'percentage'
              ? 'Tax percentage will be applied to each item\'s subtotal (price × quantity)'
              : 'Fixed tax amount will be added to each selected item'
            }
          </small>
        </div>

        {/* Items Selection */}
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Select Items for Tax Application:</h6>
            {cart.length > 0 && (
              <CButton 
                size="sm" 
                variant="outline" 
                color="primary"
                onClick={selectAll}
              >
                {selectedItemIds.length === cart.length ? 'Deselect All' : 'Select All'}
              </CButton>
            )}
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-muted mb-0">No items in cart</p>
            </div>
          ) : (
            <div className="item-list">
              {cart.map((item) => {
                // const itemId = item.id || item._id; // This line is no longer needed if used correctly below
                const itemSubtotal = item.adjustedPrice * item.quantity;
                const hasCurrentTax = (item.taxPercentage > 0) || (item.fixedTaxAmount > 0) || (item.taxAmount > 0);
                const isSelected = selectedItemIds.includes(item.id); // Use item.id directly

                return (
                  <div 
                    key={item.id} // Use item.id for the key
                    className={`p-2 mb-2 rounded ${isSelected ? 'bg-light border-primary' : 'bg-white'} border`}
                  >
                    <div className="d-flex align-items-start">
                      <CFormCheck
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.id)} // Pass item.id
                        className="me-3 mt-1"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark">{item.itemName}</div>
                        <div className="text-muted small">
                          <span className="me-3">Qty: {item.quantity}</span>
                          <span className="me-3">Price: ₹{Number(item.adjustedPrice).toFixed(2)}</span>
                          <span className="fw-medium">Subtotal: ₹{itemSubtotal.toFixed(2)}</span>
                        </div>
                        {hasCurrentTax && (
                          <div className="text-info small mt-1">
                            <i className="fas fa-info-circle me-1"></i>
                            Current Tax: {
                              item.taxType === 'percentage' 
                                ? `${item.taxPercentage}% (₹${item.taxAmount?.toFixed(2)})`
                                : item.taxType === 'fixed' 
                                  ? `₹${item.fixedTaxAmount} fixed`
                                  : `₹${item.taxAmount?.toFixed(2)}`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tax Preview */}
        {selectedItemIds.length > 0 && taxValue && Number(taxValue) > 0 && (
          <div className="alert alert-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Tax Preview:</strong>
                <div className="small text-muted mt-1">
                  {taxType === 'percentage' 
                    ? `${taxValue}% tax on ${selectedItemIds.length} selected item(s)`
                    : `₹${taxValue} fixed tax on ${selectedItemIds.length} selected item(s)`
                  }
                </div>
              </div>
              <div className="text-end">
                <span className="h5 text-primary fw-bold">
                  ₹{calculatePreview().toFixed(2)}
                </span>
                <div className="small text-muted">Total Tax Amount</div>
              </div>
            </div>
          </div>
        )}

      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={onSubmit}
          disabled={selectedItemIds.length === 0 || !taxValue || Number(taxValue) <= 0}
        >
          Apply {taxType === 'percentage' ? 'Percentage' : 'Fixed'} Tax
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default TaxModal;