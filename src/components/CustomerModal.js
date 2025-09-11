import React, { useState } from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormInput, CFormTextarea, CForm, CAlert } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPlus } from '@coreui/icons';

const CustomerModal = ({
  showCustomerModal,
  setShowCustomerModal,
  searchTerm,
  setSearchTerm,
  filteredCustomers,
  handleCustomerSelect,
  customerLoading,
  handleAddCustomer,
}) => {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formValues.name?.trim()) {
      errors.name = 'Customer name is required';
    }

    if (formValues.email && !/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formValues.phoneNumber && !/^\d{10}$/.test(formValues.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Submitting customer data:', formValues); // Debug log
      handleAddCustomer(formValues);
      // Reset form after successful submission
      setFormValues({ name: '', email: '', phoneNumber: '', address: '' });
      setFormErrors({});
    }
  };

  // Handle modal close
  const handleClose = () => {
    setShowCustomerModal(false);
    setFormValues({ name: '', email: '', phoneNumber: '', address: '' });
    setFormErrors({});
  };

  return (
    <CModal visible={showCustomerModal} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>Customer Management</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="d-flex">
          {/* Left side - Select existing customer */}
          <div className="w-50 border-end pe-3">
            <h5 className="mb-3">
              <CIcon icon={cilSearch} className="me-2" />
              Select Existing Customer
            </h5>
            <div className="input-group mb-3">
              <CFormInput
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="input-group-text">
                <CIcon icon={cilSearch} />
              </span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {customerLoading ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading customers...</p>
                </div>
              ) : filteredCustomers?.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id || customer._id}
                    className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 hover-bg-light"
                    onClick={() => handleCustomerSelect(customer)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div className="fw-bold">{customer.name}</div>
                      {customer.phoneNumber && (
                        <small className="text-muted">{customer.phoneNumber}</small>
                      )}
                    </div>
                    <span className="badge bg-success">
                      ID: {customer.id || customer._id}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted p-3">
                  {searchTerm ? 'No customers found' : 'No customers available'}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Add new customer */}
          <div className="w-50 ps-3">
            <h5 className="mb-3">
              <CIcon icon={cilPlus} className="me-2" />
              Add New Customer
            </h5>

            {/* Show validation errors */}
            {Object.keys(formErrors).length > 0 && (
              <CAlert color="warning" className="mb-3">
                <small>Please fix the following errors:</small>
                <ul className="mb-0 mt-1">
                  {Object.values(formErrors).map((error, index) => (
                    <li key={index}><small>{error}</small></li>
                  ))}
                </ul>
              </CAlert>
            )}

            <CForm>
              <div className="mb-3">
                <CFormInput
                  type="text"
                  name="name"
                  placeholder="Customer Name *"
                  value={formValues.name}
                  onChange={handleInputChange}
                  invalid={!!formErrors.name}
                  required
                />
                {formErrors.name && (
                  <div className="invalid-feedback d-block">
                    {formErrors.name}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <CFormInput
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formValues.email}
                  onChange={handleInputChange}
                  invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <div className="invalid-feedback d-block">
                    {formErrors.email}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <CFormInput
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formValues.phoneNumber}
                  onChange={handleInputChange}
                  invalid={!!formErrors.phoneNumber}
                />
                {formErrors.phoneNumber && (
                  <div className="invalid-feedback d-block">
                    {formErrors.phoneNumber}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <CFormTextarea
                  name="address"
                  rows="3"
                  placeholder="Address"
                  value={formValues.address}
                  onChange={handleInputChange}
                />
              </div>

              {/* Add Customer Button - Also in form area */}
              <CButton
                color="primary"
                onClick={handleSubmit}
                disabled={customerLoading || !formValues.name?.trim()}
                className="w-100 mb-2"
              >
                <CIcon icon={cilPlus} className="me-2" />
                {customerLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding Customer...
                  </>
                ) : (
                  'Add Customer'
                )}
              </CButton>

              <small className="text-muted">* Required field</small>
            </CForm>
          </div>
        </div>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-between">
        <div>
          <small className="text-muted">
            Select an existing customer or add a new one
          </small>
        </div>
        <div>
          <CButton color="secondary" onClick={handleClose} className="me-2">
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleSubmit}
            disabled={customerLoading || !formValues.name?.trim()}
            className="text-white fw-semibold"
          >
            <CIcon icon={cilPlus} className="me-1" />
            {customerLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              'Add New Customer'
            )}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  );
};

export default CustomerModal;
