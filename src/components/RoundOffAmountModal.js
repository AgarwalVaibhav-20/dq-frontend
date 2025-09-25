import React from 'react';
import { 
  CModal, 
  CModalHeader, 
  CModalTitle, 
  CModalBody, 
  CModalFooter, 
  CButton, 
  CInputGroup,
  CRow,
  CCol,
  CFormInput
} from '@coreui/react';

const RoundOffAmountModal = ({ 
  showRoundOffModal, 
  setShowRoundOffModal, 
  inputValue, 
  setInputValue, 
  roundOff,
  setRoundOff,
  handleRoundOffSubmit,
  subtotal = 0,        
  tax = 0,              
  discount = 0,
  cart = []          
}) => {
  // Calculate base total (before round off)
  const originalTotal = subtotal + tax - discount;

  // Handle increment
  const handleIncrement = () => {
    const currentValue = parseFloat(inputValue) || 0;
    setInputValue((currentValue + 1).toString());
    setRoundOff((currentValue + 1).toString());
  };

  // Handle decrement
  const handleDecrement = () => {
    const currentValue = parseFloat(inputValue) || 0;
    if (currentValue > 0) {
      setInputValue((currentValue - 1).toString());
      setRoundOff((currentValue - 1).toString());
    }
  };

  // Handle input change with validation
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      setRoundOff(value);
    }
  };

  // Calculate rounded value for display
  const getRoundedValue = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) return 0;
    return Math.round(value);
  };

  // Final total after applying round off
  const finalTotal = originalTotal - getRoundedValue();

  // Handle reset to original total
  const handleReset = () => {
    setInputValue('0');
  };

  // Handle apply and close
  const handleApply = () => {
    const roundOffValue = getRoundedValue();
    handleRoundOffSubmit(roundOffValue);
    setShowRoundOffModal(false);
  };

  return (
    <CModal visible={showRoundOffModal} onClose={() => setShowRoundOffModal(false)} size="lg">
      <CModalHeader>
        <CModalTitle>Apply Round Off Amount</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {/* Cart Items Display */}
        {cart && cart.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-3 text-primary">Cart Items:</h6>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded p-2">
                {cart.map((item) => { // No longer need 'index'
                // const itemId = item._id || item.id || index; // This line is removed
                const itemPrice = parseFloat(item.adjustedPrice || item.price || 0);
                const itemSubtotal = itemPrice * (item.quantity || 1);
                const itemTaxAmount = parseFloat(item.taxAmount || 0);
                const itemDiscountAmount = parseFloat(item.discountAmount || 0);
                const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;

                return (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded"> {/* <-- Use item.id for the key */}
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark">{item.itemName || 'Item'}</div>
                      <div className="text-muted small">
                        ₹{itemPrice.toFixed(2)} × {item.quantity || 1}
                        {item.selectedSize && (
                          <span className="badge bg-primary ms-1">{item.selectedSize}</span>
                        )}
                      </div>
                      {(itemTaxAmount > 0 || itemDiscountAmount > 0) && (
                        <div className="text-muted small">
                          {itemTaxAmount > 0 && <span className="me-2">Tax: ₹{itemTaxAmount.toFixed(2)}</span>}
                          {itemDiscountAmount > 0 && <span className="text-warning">Discount: -₹{itemDiscountAmount.toFixed(2)}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">₹{itemTotal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cart Summary */}
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3 text-primary">Bill Summary:</h6>
          <div className="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span className="fw-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Total Tax:</span>
            <span className="fw-semibold">₹{tax.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Total Discount:</span>
            <span className="text-danger fw-semibold">-₹{discount.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-bold">Total Before Round Off:</span>
            <span className="fw-bold fs-5 text-primary">₹{originalTotal.toFixed(2)}</span>
          </div>
          
          {getRoundedValue() > 0 && (
            <>
              <div className="d-flex justify-content-between mb-2">
                <span>Round Off Applied:</span>
                <span className="text-danger fw-semibold">-₹{getRoundedValue().toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between">
                <span className="fw-bold text-success">Final Total:</span>
                <span className="fw-bold fs-4 text-success">₹{finalTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Round Off Control */}
        <CRow className="mb-3">
          <CCol>
            <label className="form-label fw-semibold">Set Round Off Amount:</label>
            <CInputGroup className="mb-2">
              <CButton 
                type="button" 
                color="outline-danger" 
                onClick={handleDecrement}
                disabled={parseFloat(inputValue) <= 0}
              >
                -
              </CButton>

              <CFormInput
                type="text"
                value={`₹${getRoundedValue().toFixed(2)}`}
                readOnly
                className="text-center fw-bold fs-5 bg-white text-primary"
              />

              <CButton 
                type="button" 
                color="outline-success" 
                onClick={handleIncrement}
              >
                +
              </CButton>
            </CInputGroup>

            {/* Manual Input Option */}
            <div className="mb-2">
              <label className="form-label small">Or enter manually:</label>
              <CFormInput
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="text-center"
              />
            </div>

            <div className="d-flex justify-content-between">
              <small className="text-muted">Use +/- buttons or enter amount manually</small>
              <CButton 
                color="outline-secondary" 
                size="sm"
                onClick={handleReset}
              >
                Reset
              </CButton>
            </div>
          </CCol>
        </CRow>

        {/* Round Off Preview */}
        {getRoundedValue() > 0 && (
          <div className="alert alert-success">
            <div className="row">
              <div className="col-md-6">
                <div className="text-center">
                  <h6 className="text-muted mb-1">Original Total</h6>
                  <div className="fs-5 fw-bold text-dark">₹{originalTotal.toFixed(2)}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-center">
                  <h6 className="text-muted mb-1">After Round Off</h6>
                  <div className="fs-4 fw-bold text-success">₹{finalTotal.toFixed(2)}</div>
                  <small className="text-muted">Saved: ₹{getRoundedValue().toFixed(2)}</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Round Off State */}
        {getRoundedValue() === 0 && (
          <div className="alert alert-info">
            <div className="text-center">
              <h6 className="mb-2">Current Total</h6>
              <div className="fs-4 fw-bold text-primary">₹{originalTotal.toFixed(2)}</div>
              <small className="text-muted">No round off applied</small>
            </div>
          </div>
        )}
      </CModalBody>
      
      <CModalFooter className="d-flex justify-content-between">
        <div>
          <small className="text-muted">
            {getRoundedValue() > 0 
              ? `Applying round off of ₹${getRoundedValue().toFixed(2)}` 
              : 'No round off will be applied'
            }
          </small>
        </div>
        <div>
          <CButton 
            color="secondary" 
            className="me-2"
            onClick={() => setShowRoundOffModal(false)}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleApply}
          >
            {getRoundedValue() > 0 ? 'Apply Round Off' : 'Keep Original Total'}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  );
};

export default RoundOffAmountModal;