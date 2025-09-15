import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers } from "../../src/redux/slices/customerSlice";

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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSearch, cilPlus } from "@coreui/icons";

const CustomerModal = ({
  showCustomerModal,
  setShowCustomerModal,
  handleCustomerSelect,
  customerLoading,
  handleAddCustomer,
  restaurantId,
}) => {
  const dispatch = useDispatch();
  const { customers, loading, error } = useSelector((state) => state.customers);

  const [searchTerm, setSearchTerm] = useState("");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    birthday: "",
    anniversary: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers when modal opens
  useEffect(() => {
    if (showCustomerModal && restaurantId) {
      dispatch(fetchCustomers({ restaurantId }));
    }
  }, [showCustomerModal, restaurantId, dispatch]);

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
    });
    setFormErrors({});
    setSelectedCustomer(null);
    setSearchTerm("");
  };

  // Handle selecting an existing customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="input-group-text">
                <CIcon icon={cilSearch} />
              </span>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id || customer._id}
                    className={`d-flex justify-content-between align-items-center border rounded p-2 mb-2 ${
                      selectedCustomer?._id === customer._id ? "bg-light" : ""
                    }`}
                    onClick={() => handleSelectCustomer(customer)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <div className="fw-bold">{customer.name}</div>
                      {customer.phoneNumber && (
                        <small className="text-muted">
                          {customer.phoneNumber}
                        </small>
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
                <p className="mb-0">
                  <strong>Anniversary:</strong>{" "}
                  {selectedCustomer.anniversary || "N/A"}
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
                <label htmlFor="name" className="form-label fw-semibold">
                  Customer Name *
                </label>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  invalid={!!formErrors.name}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email Address
                </label>
                <CFormInput
                  type="email"
                  id="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleInputChange}
                  invalid={!!formErrors.email}
                />
              </div>

              {/* Phone */}
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label fw-semibold">
                  Phone Number
                </label>
                <CFormInput
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formValues.phoneNumber}
                  onChange={handleInputChange}
                  invalid={!!formErrors.phoneNumber}
                />
              </div>

              {/* Address */}
              <div className="mb-3">
                <label htmlFor="address" className="form-label fw-semibold">
                  Address
                </label>
                <CFormTextarea
                  id="address"
                  name="address"
                  rows="3"
                  value={formValues.address}
                  onChange={handleInputChange}
                />
              </div>

              {/* Birthday */}
              <div className="mb-3">
                <label htmlFor="birthday" className="form-label fw-semibold">
                  Birthday
                </label>
                <CFormInput
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formValues.birthday}
                  onChange={handleInputChange}
                />
              </div>

              {/* Anniversary */}
              <div className="mb-3">
                <label
                  htmlFor="anniversary"
                  className="form-label fw-semibold"
                >
                  Anniversary
                </label>
                <CFormInput
                  type="date"
                  id="anniversary"
                  name="anniversary"
                  value={formValues.anniversary}
                  onChange={handleInputChange}
                />
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
};

export default CustomerModal;
