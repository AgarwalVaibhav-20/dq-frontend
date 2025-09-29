import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormCheck,
  CFormSelect,
  CSpinner,
  CAlert,
} from '@coreui/react';
import axiosInstance from '../utils/axiosConfig';

const TaxModal = ({
  showTaxModal,
  setShowTaxModal,
  cart = [],
  handleTaxSubmit,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedTax, setSelectedTax] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch taxes from database when modal opens
  useEffect(() => {
    if (showTaxModal) {
      fetchTaxes();
    }
  }, [showTaxModal]);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError('');
      const restaurantId = localStorage.getItem('restaurantId');
      const response = await axiosInstance.get(`/api/tax?restaurantId=${restaurantId}`);
      
      if (response.data.success) {
        setTaxes(response.data.data || []);
      } else {
        setError('Failed to fetch taxes');
      }
    } catch (error) {
      console.error('Error fetching taxes:', error);
      setError('Failed to fetch taxes');
    } finally {
      setLoading(false);
    }
  };

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
    if (selectedItemIds.length === 0 || !selectedTax) {
      return;
    }

    const taxValue = parseFloat(selectedTax.taxCharge);
    const taxType = selectedTax.taxType;

    handleTaxSubmit(selectedItemIds, taxValue, taxType, selectedTax.taxName);

    // Reset form
    setSelectedItemIds([]);
    setSelectedTax(null);
    setShowTaxModal(false);
  };

  const handleClose = () => {
    setSelectedItemIds([]);
    setSelectedTax(null);
    setError('');
    setShowTaxModal(false);
  };

  const calculatePreview = () => {
    if (!selectedTax || selectedItemIds.length === 0) return 0;

    const taxValue = parseFloat(selectedTax.taxCharge);
    const taxType = selectedTax.taxType;

    return selectedItemIds.reduce((total, itemId) => {
      const item = cart.find(cartItem => (cartItem.id || cartItem._id) === itemId);
      if (!item) return total;

      const itemSubtotal = item.adjustedPrice * item.quantity;
      let itemTax = 0;
      
      if (taxType === 'percentage') {
        itemTax = (itemSubtotal * taxValue) / 100;
      } else if (taxType === 'fixed') {
        itemTax = taxValue;
      }

      return total + itemTax;
    }, 0);
  };

  const formatTaxDisplay = (tax) => {
    if (tax.taxType === 'percentage') {
      return `${tax.taxName} (${tax.taxCharge}%)`;
    } else {
      return `${tax.taxName} (₹${tax.taxCharge})`;
    }
  };

  return (
    <CModal visible={showTaxModal} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Tax to Items</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        
        {/* Tax Selection */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Select Tax:</label>
          {loading ? (
            <div className="text-center py-3">
              <CSpinner size="sm" />
              <span className="ms-2">Loading taxes...</span>
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : taxes.length === 0 ? (
            <CAlert color="warning">
              No taxes found. Please add taxes in Settings first.
            </CAlert>
          ) : (
            <CFormSelect
              value={selectedTax ? selectedTax._id : ''}
              onChange={(e) => {
                const taxId = e.target.value;
                const tax = taxes.find(t => t._id === taxId);
                setSelectedTax(tax || null);
              }}
              className="form-control-lg"
            >
              <option value="">Select a tax...</option>
              {taxes.map((tax) => (
                <option key={tax._id} value={tax._id}>
                  {formatTaxDisplay(tax)}
                </option>
              ))}
            </CFormSelect>
          )}
          
          {selectedTax && (
            <small className="text-muted mt-2 d-block">
              <strong>Selected:</strong> {formatTaxDisplay(selectedTax)}
            </small>
          )}
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
                const itemSubtotal = item.adjustedPrice * item.quantity;
                const hasCurrentTax = (item.taxPercentage > 0) || (item.fixedTaxAmount > 0) || (item.taxAmount > 0);
                const isSelected = selectedItemIds.includes(item.id);

                return (
                  <div 
                    key={item.id}
                    className={`p-2 mb-2 rounded ${isSelected ? 'bg-light border-primary' : 'bg-white'} border`}
                  >
                    <div className="d-flex align-items-start">
                      <CFormCheck
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.id)}
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
        {selectedItemIds.length > 0 && selectedTax && (
          <div className="alert alert-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Tax Preview:</strong>
                <div className="small text-muted mt-1">
                  {selectedTax.taxType === 'percentage' 
                    ? `${selectedTax.taxCharge}% ${selectedTax.taxName} on ${selectedItemIds.length} selected item(s)`
                    : `₹${selectedTax.taxCharge} ${selectedTax.taxName} on ${selectedItemIds.length} selected item(s)`
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
          disabled={selectedItemIds.length === 0 || !selectedTax}
        >
          Apply {selectedTax?.taxName || 'Tax'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default TaxModal;