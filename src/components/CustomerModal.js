import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers } from "../../src/redux/slices/customerSlice";
import { fetchMembers } from "../../src/redux/slices/memberSlice";

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormTextarea,
  CForm,
  CAlert,
  CFormSelect,
  CFormLabel,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSearch, cilPlus } from "@coreui/icons";

const CustomerModal = React.forwardRef(({
  showCustomerModal,
  setShowCustomerModal,
  handleCustomerSelect,
  customerLoading,
  handleAddCustomer,
  restaurantId,
}, ref) => {
  const dispatch = useDispatch();
  const { customers, loading, error } = useSelector((state) => state.customers);
  const { members } = useSelector((state) => state.members);
  const token = localStorage.getItem('authToken');

  // Refs for input fields
  const searchRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const addressRef = useRef(null);
  const birthdayRef = useRef(null);
  const anniversaryRef = useRef(null);
  const membershipRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    birthday: "",
    anniversary: "",
    membershipId: "",
    membershipName: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(-1);

  // Fetch customers and members when modal opens
  useEffect(() => {
    if (showCustomerModal && restaurantId && token) {
      dispatch(fetchCustomers({ token, restaurantId }));
      dispatch(fetchMembers(token));
      setHighlightedCustomerIndex(-1);
    }
  }, [showCustomerModal, restaurantId, dispatch, token]);

  // Keyboard navigation handler for form inputs
  const handleKeyDown = (e, currentRef) => {
    if (!showCustomerModal) return;
    
    const inputs = [nameRef, emailRef, phoneNumberRef, addressRef, birthdayRef, anniversaryRef, membershipRef];
    const currentIndex = inputs.findIndex(ref => ref.current === currentRef?.current);
    
    if (e.key === 'ArrowDown' && currentIndex < inputs.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      inputs[currentIndex + 1]?.current?.focus();
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      e.stopPropagation();
      inputs[currentIndex - 1]?.current?.focus();
    }
  };

  // Keyboard navigation for search bar and customer list
  const handleSearchKeyDown = (e) => {
    if (!showCustomerModal) return;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        const nextIndex = Math.min(highlightedCustomerIndex + 1, filteredCustomers.length - 1);
        setHighlightedCustomerIndex(nextIndex);
        // Scroll to highlighted customer
        const customerId = filteredCustomers[nextIndex]._id || filteredCustomers[nextIndex].id;
        document.getElementById(`customer-${customerId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (highlightedCustomerIndex > 0) {
        const prevIndex = highlightedCustomerIndex - 1;
        setHighlightedCustomerIndex(prevIndex);
        // Scroll to highlighted customer
        const customerId = filteredCustomers[prevIndex]._id || filteredCustomers[prevIndex].id;
        document.getElementById(`customer-${customerId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'Enter' && highlightedCustomerIndex >= 0 && highlightedCustomerIndex < filteredCustomers.length) {
      e.preventDefault();
      const customer = filteredCustomers[highlightedCustomerIndex];
      handleSelectCustomer(customer);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  // Handle membership selection
  const handleMembershipChange = (e) => {
    const selectedId = e.target.value;
    const selectedMembership = members.find(m => m._id === selectedId);

    setFormValues({
      ...formValues,
      membershipId: selectedId,
      membershipName: selectedMembership?.membershipName || ''
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formValues.name?.trim()) {
      errors.name = "Customer name is required";
    }

    if (formValues.email && !/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (
      formValues.phoneNumber &&
      !/^\d{10}$/.test(formValues.phoneNumber.replace(/\D/g, ""))
    ) {
      errors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      handleAddCustomer(formValues);
      setFormValues({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
        birthday: "",
        anniversary: "",
        membershipId: "",
        membershipName: ""
      });
      setFormErrors({});
    }
  };

  // Handle modal close
  const handleClose = () => {
    setShowCustomerModal(false);
    setFormValues({
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
      birthday: "",
      anniversary: "",
      membershipId: "",
      membershipName: ""
    });
    setFormErrors({});
    setSelectedCustomer(null);
    setSearchTerm("");
    setHighlightedCustomerIndex(-1);
  };

  // Handle selecting an existing customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    localStorage.setItem("customer", JSON.stringify(customer));
    handleCustomerSelect(customer);
  };

  // Filter customers locally
  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber?.includes(searchTerm)
  );

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
                ref={searchRef}
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedCustomerIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
              />
              <span className="input-group-text">
                <CIcon icon={cilSearch} />
              </span>
            </div>
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {loading ? (
                <div className="text-center p-3">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading customers...</p>
                </div>
              ) : error ? (
                <div className="text-danger text-center p-3">
                  Failed to load customers
                </div>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.id || customer._id}
                    id={`customer-${customer.id || customer._id}`}
                    className={`d-flex justify-content-between align-items-center border rounded p-2 mb-2 ${
                      selectedCustomer?._id === customer._id ? "bg-light" : ""
                    } ${
                      highlightedCustomerIndex === index ? "border-primary border-2 shadow-sm" : ""
                    }`}
                    onClick={() => handleSelectCustomer(customer)}
                    style={{ 
                      cursor: "pointer",
                      backgroundColor: highlightedCustomerIndex === index ? "#e7f3ff" : undefined
                    }}
                  >
                    <div>
                      <div className="fw-bold">{customer.name}</div>
                      {customer.phoneNumber && (
                        <small className="text-muted">
                          {customer.phoneNumber}
                        </small>
                      )}
                      {customer.membership?.membershipName && (
                        <div>
                          <small className="badge bg-info text-dark mt-1">
                            {customer.membership.membershipName}
                          </small>
                        </div>
                      )}
                    </div>
                    <span className="badge bg-success">
                      ID: {customer.id || customer._id}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted p-3">
                  {searchTerm ? "No customers found" : "No customers available"}
                </div>
              )}
            </div>

            {/* Show details of selected customer */}
            {selectedCustomer && (
              <div className="mt-3 p-2 border rounded bg-light">
                <h6 className="fw-bold">Customer Details</h6>
                <p className="mb-1">
                  <strong>Name:</strong> {selectedCustomer.name}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {selectedCustomer.email || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Phone:</strong>{" "}
                  {selectedCustomer.phoneNumber || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Address:</strong> {selectedCustomer.address || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Birthday:</strong>{" "}
                  {selectedCustomer.birthday || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Anniversary:</strong>{" "}
                  {selectedCustomer.anniversary || "N/A"}
                </p>
                <p className="mb-0">
                  <strong>Membership:</strong>{" "}
                  {selectedCustomer.membership?.membershipName || "None"}
                </p>
              </div>
            )}
          </div>

          {/* Right side - Add new customer */}
          <div className="w-50 ps-3">
            <h5 className="mb-3">
              <CIcon icon={cilPlus} className="me-2" />
              Add New Customer
            </h5>

            {Object.keys(formErrors).length > 0 && (
              <CAlert color="warning" className="mb-3">
                <small>Please fix the following errors:</small>
                <ul className="mb-0 mt-1">
                  {Object.values(formErrors).map((error, index) => (
                    <li key={index}>
                      <small>{error}</small>
                    </li>
                  ))}
                </ul>
              </CAlert>
            )}

            <CForm>
              {/* Name */}
              <div className="mb-3">
                <CFormLabel htmlFor="name" className="fw-semibold">
                  Customer Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  ref={nameRef}
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, nameRef)}
                  invalid={!!formErrors.name}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <CFormLabel htmlFor="email" className="fw-semibold">
                  Email Address
                </CFormLabel>
                <CFormInput
                  ref={emailRef}
                  type="email"
                  id="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, emailRef)}
                  invalid={!!formErrors.email}
                  placeholder="Enter email address"
                />
              </div>

              {/* Phone */}
              <div className="mb-3">
                <CFormLabel htmlFor="phoneNumber" className="fw-semibold">
                  Phone Number
                </CFormLabel>
                <CFormInput
                  ref={phoneNumberRef}
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formValues.phoneNumber}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, phoneNumberRef)}
                  invalid={!!formErrors.phoneNumber}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Address */}
              <div className="mb-3">
                <CFormLabel htmlFor="address" className="fw-semibold">
                  Address
                </CFormLabel>
                <CFormTextarea
                  ref={addressRef}
                  id="address"
                  name="address"
                  rows="2"
                  value={formValues.address}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, addressRef)}
                  placeholder="Enter address"
                />
              </div>

              {/* Birthday */}
              <div className="mb-3">
                <CFormLabel htmlFor="birthday" className="fw-semibold">
                  Birthday
                </CFormLabel>
                <CFormInput
                  ref={birthdayRef}
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formValues.birthday}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, birthdayRef)}
                />
              </div>

              {/* Anniversary */}
              <div className="mb-3">
                <CFormLabel htmlFor="anniversary" className="fw-semibold">
                  Anniversary
                </CFormLabel>
                <CFormInput
                  ref={anniversaryRef}
                  type="date"
                  id="anniversary"
                  name="anniversary"
                  value={formValues.anniversary}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, anniversaryRef)}
                />
              </div>

              {/* Membership Plan */}
              <div className="mb-3">
                <CFormLabel htmlFor="membershipId" className="fw-semibold">
                  Membership Plan
                </CFormLabel>
                <CFormSelect
                  ref={membershipRef}
                  id="membershipId"
                  name="membershipId"
                  value={formValues.membershipId}
                  onChange={handleMembershipChange}
                  onKeyDown={(e) => handleKeyDown(e, membershipRef)}
                >
                  <option value="">No Membership</option>
                  {members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.membershipName} -
                      {member.discountType === 'fixed' ? `₹${member.discount}` : `${member.discount}%`} OFF
                      (Min: ₹{member.minSpend})
                    </option>
                  ))}
                </CFormSelect>
              </div>

              {/* Add Button */}
              <CButton
                color="primary"
                onClick={handleSubmit}
                disabled={customerLoading || !formValues.name?.trim()}
                className="w-100 mb-2"
              >
                <CIcon icon={cilPlus} className="me-2" />
                {customerLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Adding Customer...
                  </>
                ) : (
                  "Add Customer"
                )}
              </CButton>
            </CForm>
          </div>
        </div>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-between">
        <small className="text-muted">
          Select an existing customer or add a new one
        </small>
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
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving...
              </>
            ) : (
              "Add New Customer"
            )}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  );
});

CustomerModal.displayName = 'CustomerModal';

export default CustomerModal;