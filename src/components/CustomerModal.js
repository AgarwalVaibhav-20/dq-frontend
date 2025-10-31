import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  const modalRef = useRef(null);
  const searchRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const addressRef = useRef(null);
  const birthdayRef = useRef(null);
  const anniversaryRef = useRef(null);
  const membershipRef = useRef(null);
  const modalHasFocusedRef = useRef(false);

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
  const [activeSection, setActiveSection] = useState('select'); // 'select' or 'add'

  // Fetch customers and members when modal opens
  useEffect(() => {
    if (showCustomerModal && restaurantId && token) {
      dispatch(fetchCustomers({ token, restaurantId }));
      dispatch(fetchMembers(token));
      setHighlightedCustomerIndex(-1);
      setActiveSection('select');
      modalHasFocusedRef.current = false;
    }
  }, [showCustomerModal, restaurantId, dispatch, token]);

  // Function to focus search bar when modal opens - multiple strategies
  const focusSearchBar = useCallback(() => {
    const attemptFocus = () => {
      // Strategy 1: Try ref directly
      if (searchRef.current) {
        try {
          searchRef.current.focus();
          modalHasFocusedRef.current = true;
          console.log('✅ Successfully focused search bar via ref in customer modal!');
          return true;
        } catch (error) {
          console.error('Error focusing search bar via ref:', error);
        }
      }
      
      // Strategy 2: Try finding by class name
      const searchInputByClass = modalRef.current?.querySelector('.customer-search-input');
      if (searchInputByClass) {
        try {
          searchInputByClass.focus();
          modalHasFocusedRef.current = true;
          console.log('✅ Successfully focused search bar via class in customer modal!');
          return true;
        } catch (error) {
          console.error('Error focusing search bar via class:', error);
        }
      }
      
      // Strategy 3: Try finding by placeholder
      const searchInputByPlaceholder = modalRef.current?.querySelector('input[placeholder*="Search customers"]');
      if (searchInputByPlaceholder) {
        try {
          searchInputByPlaceholder.focus();
          modalHasFocusedRef.current = true;
          console.log('✅ Successfully focused search bar via placeholder in customer modal!');
          return true;
        } catch (error) {
          console.error('Error focusing search bar via placeholder:', error);
        }
      }
      
      // Strategy 4: Try first focusable input (excluding close button)
      const firstFocusable = modalRef.current?.querySelector(
        'input:not([tabindex="-1"]):not(.btn-close), button:not([tabindex="-1"]):not(.btn-close), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
      );
      if (firstFocusable) {
        try {
          firstFocusable.focus();
          modalHasFocusedRef.current = true;
          console.log('✅ Successfully focused first focusable element in customer modal!');
          return true;
        } catch (error) {
          console.error('Error focusing first focusable element:', error);
        }
      }
      
      return false;
    };
    
    // Try immediately
    if (!attemptFocus()) {
      // Try after animation frame
      requestAnimationFrame(() => {
        if (!attemptFocus()) {
          // Try after short delay
          setTimeout(() => {
            if (!attemptFocus()) {
              // Try after longer delay
              setTimeout(() => {
                if (!attemptFocus()) {
                  // Final attempt after even longer delay
                  setTimeout(() => {
                    attemptFocus();
                  }, 400);
                }
              }, 300);
            }
          }, 150);
        }
      });
    }
  }, []);

  // Fix aria-hidden issue - ensure modal element doesn't have aria-hidden when visible
  useEffect(() => {
    if (!showCustomerModal) return;
    
    const observer = new MutationObserver(() => {
      if (modalRef.current) {
        const modalElement = modalRef.current.closest('.modal');
        if (modalElement) {
          // Remove aria-hidden when modal is visible
          if (showCustomerModal) {
            modalElement.removeAttribute('aria-hidden');
          }
        }
        
        // Also check if modal is in DOM and try to focus
        if (!modalHasFocusedRef.current && modalRef.current.offsetParent !== null) {
          // Modal is visible in DOM, try focusing
          setTimeout(() => {
            focusSearchBar();
          }, 50);
        }
      }
    });
    
    // Observe changes to modal and its parent
    if (modalRef.current) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden']
      });
    }
    
    return () => observer.disconnect();
  }, [showCustomerModal, focusSearchBar]);

  // Auto-focus on search bar when modal opens
  useEffect(() => {
    if (showCustomerModal && !modalHasFocusedRef.current) {
      // Multiple attempts with increasing delays
      const timeout1 = setTimeout(() => {
        focusSearchBar();
      }, 100);
      
      const timeout2 = setTimeout(() => {
        if (!modalHasFocusedRef.current) {
          focusSearchBar();
        }
      }, 300);
      
      const timeout3 = setTimeout(() => {
        if (!modalHasFocusedRef.current) {
          focusSearchBar();
        }
      }, 500);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [showCustomerModal, focusSearchBar]);

  // Handle modal close
  const handleClose = useCallback(() => {
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
  }, [setShowCustomerModal]);

  // Escape key handler to close modal
  useEffect(() => {
    if (!showCustomerModal) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [showCustomerModal, handleClose]);

  // Focus trapping - prevent focus from leaving modal
  useEffect(() => {
    if (!showCustomerModal) return;
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (!modalRef.current) return;
      
      // Get all focusable elements
      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [showCustomerModal]);

  // Filter customers locally - use useMemo so it's available in handlers
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNumber?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // Handle selecting an existing customer - define before handlers that use it
  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    localStorage.setItem("customer", JSON.stringify(customer));
    handleCustomerSelect(customer);
  }, [handleCustomerSelect]);

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

  // Handle form submission - define before handlers that use it
  const handleSubmit = useCallback(() => {
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
  }, [formValues, handleAddCustomer]);

  // Keyboard navigation handler for form inputs
  const handleKeyDown = useCallback((e, currentRef) => {
    if (!showCustomerModal) return;
    
    const inputs = [nameRef, emailRef, phoneNumberRef, addressRef, birthdayRef, anniversaryRef, membershipRef];
    const currentIndex = inputs.findIndex(ref => ref.current === currentRef?.current);
    
    // Handle Enter key - submit form if valid, otherwise move to next field
    if (e.key === 'Enter') {
      // For textarea (address), allow normal Enter behavior unless Ctrl/Cmd is pressed
      if (currentRef.current === addressRef.current && !e.ctrlKey && !e.metaKey) {
        // Allow normal Enter behavior for new line in textarea
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // If on last field (membership) and name is filled, submit form
      if (currentIndex === inputs.length - 1) {
        // Last field - submit if name is filled (required field)
        if (formValues.name?.trim()) {
          handleSubmit();
        }
      } else if (currentIndex < inputs.length - 1) {
        // Not on last field - move to next field
        inputs[currentIndex + 1]?.current?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      if (currentIndex < inputs.length - 1) {
        e.preventDefault();
        e.stopPropagation();
        inputs[currentIndex + 1]?.current?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      if (currentIndex > 0) {
        e.preventDefault();
        e.stopPropagation();
        inputs[currentIndex - 1]?.current?.focus();
      } else {
        // Move to search bar or last customer if in select section
        e.preventDefault();
        e.stopPropagation();
        if (activeSection === 'select' && filteredCustomers.length > 0) {
          setHighlightedCustomerIndex(filteredCustomers.length - 1);
          const lastCustomerId = filteredCustomers[filteredCustomers.length - 1]._id || filteredCustomers[filteredCustomers.length - 1].id;
          setTimeout(() => {
            const element = document.getElementById(`customer-${lastCustomerId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            element?.focus();
          }, 0);
        } else {
          searchRef.current?.focus();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      // Switch to select section
      e.preventDefault();
      e.stopPropagation();
      setActiveSection('select');
      searchRef.current?.focus();
    }
  }, [showCustomerModal, activeSection, filteredCustomers, formValues, handleSubmit]);

  // Keyboard navigation for search bar and customer list
  const handleSearchKeyDown = useCallback((e) => {
    if (!showCustomerModal) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setActiveSection('select');
      if (filteredCustomers.length > 0) {
        const nextIndex = highlightedCustomerIndex < 0 ? 0 : Math.min(highlightedCustomerIndex + 1, filteredCustomers.length - 1);
        setHighlightedCustomerIndex(nextIndex);
        // Scroll to highlighted customer
        setTimeout(() => {
          const customerId = filteredCustomers[nextIndex]._id || filteredCustomers[nextIndex].id;
          const customerElement = document.getElementById(`customer-${customerId}`);
          if (customerElement) {
            customerElement.focus();
            customerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 0);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedCustomerIndex > 0) {
        const prevIndex = highlightedCustomerIndex - 1;
        setHighlightedCustomerIndex(prevIndex);
        // Scroll to highlighted customer
        setTimeout(() => {
          const customerId = filteredCustomers[prevIndex]._id || filteredCustomers[prevIndex].id;
          const customerElement = document.getElementById(`customer-${customerId}`);
          if (customerElement) {
            customerElement.focus();
            customerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 0);
      }
    } else if (e.key === 'ArrowRight') {
      // Switch to add section
      e.preventDefault();
      e.stopPropagation();
      setActiveSection('add');
      nameRef.current?.focus();
    } else if (e.key === 'Enter' && highlightedCustomerIndex >= 0 && highlightedCustomerIndex < filteredCustomers.length) {
      e.preventDefault();
      e.stopPropagation();
      const customer = filteredCustomers[highlightedCustomerIndex];
      handleSelectCustomer(customer);
    }
  }, [showCustomerModal, filteredCustomers, highlightedCustomerIndex, handleSelectCustomer]);

  // Keyboard navigation for customer list items
  const handleCustomerItemKeyDown = useCallback((e, customer, index) => {
    if (!showCustomerModal) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (index < filteredCustomers.length - 1) {
        const nextIndex = index + 1;
        setHighlightedCustomerIndex(nextIndex);
        setTimeout(() => {
          const nextCustomerId = filteredCustomers[nextIndex]._id || filteredCustomers[nextIndex].id;
          const nextElement = document.getElementById(`customer-${nextCustomerId}`);
          if (nextElement) {
            nextElement.focus();
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 0);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (index > 0) {
        const prevIndex = index - 1;
        setHighlightedCustomerIndex(prevIndex);
        setTimeout(() => {
          const prevCustomerId = filteredCustomers[prevIndex]._id || filteredCustomers[prevIndex].id;
          const prevElement = document.getElementById(`customer-${prevCustomerId}`);
          if (prevElement) {
            prevElement.focus();
            prevElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 0);
      } else {
        // Move to search bar
        setHighlightedCustomerIndex(-1);
        searchRef.current?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      // Switch to add section
      e.preventDefault();
      e.stopPropagation();
      setActiveSection('add');
      nameRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      // Stay in select section, focus search bar
      e.preventDefault();
      e.stopPropagation();
      searchRef.current?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleSelectCustomer(customer);
    }
  }, [showCustomerModal, filteredCustomers, handleSelectCustomer]);

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

  return (
    <CModal 
      visible={showCustomerModal} 
      onClose={handleClose} 
      size="lg"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
    >
      <CModalHeader>
        <CModalTitle id="customer-modal-title">Customer Management</CModalTitle>
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
                className="customer-search-input"
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
                    onKeyDown={(e) => handleCustomerItemKeyDown(e, customer, index)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select customer ${customer.name}`}
                    style={{ 
                      cursor: "pointer",
                      backgroundColor: highlightedCustomerIndex === index ? "#e7f3ff" : undefined,
                      outline: highlightedCustomerIndex === index ? '2px solid #0d6efd' : 'none',
                      outlineOffset: highlightedCustomerIndex === index ? '2px' : '0'
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