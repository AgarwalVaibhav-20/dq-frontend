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

const TaxModal = React.forwardRef(({
  showTaxModal,
  setShowTaxModal,
  cart = [],
  handleTaxSubmit,
}, ref) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedTax, setSelectedTax] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taxValue, setTaxValue] = useState('');
  const [taxType, setTaxType] = useState('percentage'); // 'percentage' or 'fixed'
  
  // Refs for focus management
  const modalRef = React.useRef(null);
  const firstInputRef = React.useRef(null);

  // Fetch taxes from database when modal opens
  useEffect(() => {
    if (showTaxModal) {
      fetchTaxes();
    }
  }, [showTaxModal]);
  
  // Auto-focus on percentage tax button when modal opens
  useEffect(() => {
    if (showTaxModal && modalRef.current) {
      setTimeout(() => {
        // Focus on percentage tax button first (default tax type)
        const percentageBtn = modalRef.current?.querySelector('.tax-type-btn[data-type="percentage"]');
        if (percentageBtn) {
          percentageBtn.focus();
        }
      }, 100);
    }
  }, [showTaxModal]);
  
  // Focus trapping - prevent focus from leaving modal
  useEffect(() => {
    if (!showTaxModal) return;
    
    const isFocusInsideModal = () => {
      if (!modalRef.current) return false;
      const activeElement = document.activeElement;
      return modalRef.current.contains(activeElement);
    };
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      // Only trap if focus is inside modal
      if (!isFocusInsideModal()) {
        e.preventDefault();
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
        return;
      }
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    // Strict focus trap - ensure focus never leaves modal
    const handleFocusTrap = (e) => {
      if (!modalRef.current || !showTaxModal) return;
      
      const activeElement = document.activeElement;
      
      // If focus is not inside modal, bring it back
      if (!modalRef.current.contains(activeElement)) {
        e.preventDefault();
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    };
    
    // Prevent clicks on background and maintain focus
    const handleClick = (e) => {
      if (!modalRef.current?.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        // Keep focus inside modal
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    };
    
    // Check focus on focusin event
    const handleFocusIn = (e) => {
      if (!modalRef.current || !showTaxModal) return;
      
      // If focus moves to an element outside modal, bring it back
      if (!modalRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('focusin', handleFocusIn, true);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [showTaxModal]);
  
  // Keyboard shortcuts - Enter to Apply, Escape to Close
  useEffect(() => {
    if (!showTaxModal) return;
    
    const handleKeyDown = (e) => {
      // Escape to close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      // Enter to apply (if not in input field or textarea)
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const submitButton = modalRef.current?.querySelector('.apply-tax-btn');
        if (submitButton && !submitButton.disabled) {
          e.preventDefault();
          submitButton.click();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    if (selectedItemIds.length === 0) {
      return;
    }

    if (selectedTax) {
      // Use selected tax from database
      const taxValue = parseFloat(selectedTax.taxCharge);
      const taxType = selectedTax.taxType;
      handleTaxSubmit(selectedItemIds, taxValue, taxType, selectedTax.taxName);
    } else {
      // Use manual input
      if (!taxValue || Number(taxValue) <= 0) {
        return;
      }
      handleTaxSubmit(selectedItemIds, Number(taxValue), taxType);
    }

    // Reset form
    setSelectedItemIds([]);
    setSelectedTax(null);
    setTaxValue('');
    setTaxType('percentage');
    setShowTaxModal(false);
  };

  const handleClose = () => {
    setSelectedItemIds([]);
    setSelectedTax(null);
    setTaxValue('');
    setTaxType('percentage');
    setError('');
    setShowTaxModal(false);
  };

  const calculatePreview = () => {
    if (selectedItemIds.length === 0) return 0;

    let taxValueNum, taxTypeToUse;

    if (selectedTax) {
      // Use selected tax from database
      taxValueNum = parseFloat(selectedTax.taxCharge);
      taxTypeToUse = selectedTax.taxType;
    } else {
      // Use manual input
      if (!taxValue || Number(taxValue) <= 0) return 0;
      taxValueNum = Number(taxValue);
      taxTypeToUse = taxType;
    }

    return selectedItemIds.reduce((total, itemId) => {
      const item = cart.find(cartItem => (cartItem.id || cartItem._id) === itemId);
      if (!item) return total;

      const itemSubtotal = item.adjustedPrice * item.quantity;
      let itemTax = 0;
      
      if (taxTypeToUse === 'percentage') {
        itemTax = (itemSubtotal * taxValueNum) / 100;
      } else if (taxTypeToUse === 'fixed') {
        itemTax = taxValueNum;
      }

      return total + itemTax;
    }, 0);
  };

  // Auto-fill percentage tax value when percentage is selected
  const handleTaxTypeChange = (type) => {
    setTaxType(type);
    if (type === 'percentage' && !taxValue) {
      setTaxValue('18'); // Default 18% tax
    } else if (type === 'fixed' && taxValue === '18') {
      setTaxValue(''); // Clear if switching from percentage default
    }
  };

  // Handle tax selection from dropdown
  const handleTaxSelection = (taxId) => {
    if (taxId) {
      const tax = taxes.find(t => t._id === taxId);
      setSelectedTax(tax);
      // Auto-fill tax type and value based on selected tax
      setTaxType(tax.taxType);
      setTaxValue(tax.taxCharge.toString());
    } else {
      setSelectedTax(null);
      setTaxValue('');
      setTaxType('percentage');
    }
  };

  const formatTaxDisplay = (tax) => {
    if (tax.taxType === 'percentage') {
      return `${tax.taxName} (${tax.taxCharge}%)`;
    } else {
      return `${tax.taxName} (₹${tax.taxCharge})`;
    }
  };

  return (
    <CModal 
      visible={showTaxModal} 
      onClose={handleClose} 
      size="lg"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-modal-title"
    >
      <CModalHeader>
        <CModalTitle id="tax-modal-title">Apply Tax to Items</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        
        {/* Select Tax from Database */}
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
              onChange={(e) => handleTaxSelection(e.target.value)}
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

        {/* Tax Type Selection */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Select Tax Type:</label>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${taxType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'} tax-type-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              data-type="percentage"
              onClick={() => handleTaxTypeChange('percentage')}
              disabled={selectedTax ? true : false}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!modalRef.current?.contains(e.target)) return;
                
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTaxTypeChange('percentage');
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  const fixedBtn = modalRef.current?.querySelector('.tax-type-btn[data-type="fixed"]');
                  if (fixedBtn) fixedBtn.focus();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = modalRef.current?.querySelector('.tax-value-input');
                  if (input) input.focus();
                }
              }}
            >
              Percentage Tax (%)
            </button>
            <button
              type="button"
              className={`btn ${taxType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'} tax-type-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              data-type="fixed"
              onClick={() => handleTaxTypeChange('fixed')}
              disabled={selectedTax ? true : false}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!modalRef.current?.contains(e.target)) return;
                
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTaxTypeChange('fixed');
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  e.stopPropagation();
                  const percentageBtn = modalRef.current?.querySelector('.tax-type-btn[data-type="percentage"]');
                  if (percentageBtn) percentageBtn.focus();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  const input = modalRef.current?.querySelector('.tax-value-input');
                  if (input) input.focus();
                }
              }}
            >
              Fixed Amount Tax (₹)
            </button>
          </div>
          <small className="text-muted mt-2 d-block">
            <strong>Selected:</strong> {taxType === 'percentage' ? 'Percentage Tax' : 'Fixed Amount Tax'}
            {selectedTax && (
              <span className="text-info ms-2">
                <i className="fas fa-info-circle me-1"></i>
                (Auto-filled from selected tax)
              </span>
            )}
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
            className="form-control-lg tax-value-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ref={firstInputRef}
            disabled={selectedTax ? true : false}
            tabIndex={0}
            onKeyDown={(e) => {
              if (!modalRef.current?.contains(e.target)) return;
              
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                modalRef.current?.querySelector('.tax-type-btn')?.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                modalRef.current?.querySelector('.select-all-tax-btn')?.focus();
              }
            }}
          />
          <small className="text-muted mt-1">
            {taxType === 'percentage'
              ? 'Tax percentage will be applied to each item\'s subtotal (price × quantity)'
              : 'Fixed tax amount will be added to each selected item'
            }
            {selectedTax && (
              <span className="text-info d-block mt-1">
                <i className="fas fa-info-circle me-1"></i>
                Value auto-filled from selected tax
              </span>
            )}
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
                className="select-all-tax-btn"
                onClick={selectAll}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!modalRef.current?.contains(e.target)) return;
                  
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectAll();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    modalRef.current?.querySelector('.tax-value-input')?.focus();
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    const firstCheckbox = modalRef.current?.querySelector('.item-tax-checkbox');
                    if (firstCheckbox) firstCheckbox.focus();
                  }
                }}
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
              {cart.map((item, index) => {
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
                        className="me-3 mt-1 item-tax-checkbox"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (!modalRef.current?.contains(e.target)) return;
                          
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSelection(item.id);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (index === 0) {
                              modalRef.current?.querySelector('.select-all-tax-btn')?.focus();
                            } else {
                              const checkboxes = modalRef.current?.querySelectorAll('.item-tax-checkbox');
                              if (checkboxes[index - 1]) checkboxes[index - 1].focus();
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            e.stopPropagation();
                            const checkboxes = modalRef.current?.querySelectorAll('.item-tax-checkbox');
                            if (checkboxes[index + 1]) {
                              checkboxes[index + 1].focus();
                            } else {
                              modalRef.current?.querySelector('.cancel-tax-btn')?.focus();
                            }
                          }
                        }}
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
        {selectedItemIds.length > 0 && (
          (selectedTax) || 
          (taxValue && Number(taxValue) > 0)
        ) && (
          <div className="alert alert-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Tax Preview:</strong>
                <div className="small text-muted mt-1">
                  {selectedTax ? (
                    selectedTax.taxType === 'percentage' 
                      ? `${selectedTax.taxCharge}% ${selectedTax.taxName} on ${selectedItemIds.length} selected item(s)`
                      : `₹${selectedTax.taxCharge} ${selectedTax.taxName} on ${selectedItemIds.length} selected item(s)`
                  ) : (
                    taxType === 'percentage' 
                      ? `${taxValue}% tax on ${selectedItemIds.length} selected item(s)`
                      : `₹${taxValue} fixed tax on ${selectedItemIds.length} selected item(s)`
                  )}
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
        <CButton 
          color="secondary" 
          className="cancel-tax-btn"
          onClick={handleClose}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!modalRef.current?.contains(e.target)) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClose();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              e.stopPropagation();
              modalRef.current?.querySelector('.apply-tax-btn')?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              e.stopPropagation();
              const checkboxes = modalRef.current?.querySelectorAll('.item-tax-checkbox');
              if (checkboxes.length > 0) {
                checkboxes[checkboxes.length - 1].focus();
              }
            }
          }}
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          className="apply-tax-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onSubmit}
          disabled={
            selectedItemIds.length === 0 || 
            (!selectedTax && (!taxValue || Number(taxValue) <= 0))
          }
          tabIndex={0}
          onKeyDown={(e) => {
            if (!modalRef.current?.contains(e.target)) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSubmit();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              e.stopPropagation();
              modalRef.current?.querySelector('.cancel-tax-btn')?.focus();
            }
          }}
        >
          Apply {selectedTax ? selectedTax.taxName : `${taxType === 'percentage' ? 'Percentage' : 'Fixed'} Tax`}
        </CButton>
      </CModalFooter>
    </CModal>
  );
});

TaxModal.displayName = 'TaxModal';

export default TaxModal;