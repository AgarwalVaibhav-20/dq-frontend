import React,{useState} from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormInput, CFormTextarea, CForm } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch } from '@coreui/icons';

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

   // Handle input changes
   const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    handleAddCustomer(formValues);
    setFormValues({ name: '', email: '', phoneNumber: '', address: '' });
  };

  return (
    <CModal visible={showCustomerModal} onClose={() => setShowCustomerModal(false)} size="lg">
      <CModalHeader>
        <CModalTitle>Customer Management</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="d-flex">
          <div className="w-50 border-end pe-3">
            <h5 className="mb-3">Select Customer</h5>
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
              {filteredCustomers?.map((customer) => (
                <div
                  key={customer.id}
                  className="d-flex justify-content-between align-items-center border p-2 mb-2"
                  onClick={() => handleCustomerSelect(customer)}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{customer.name}</span>
                  <span className="badge bg-success">ID: {customer.id}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-50 ps-3">
            <h5 className="mb-3">Add New Customer</h5>
            <CForm>
              <CFormInput
                className="mb-2"
                type="text"
                name="name"
                placeholder="Name"
                value={formValues.name}
                onChange={handleInputChange}
              />
              <CFormInput
                className="mb-2"
                type="email"
                name="email"
                placeholder="Email"
                value={formValues.email}
                onChange={handleInputChange}
              />
              <CFormInput
                className="mb-2"
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formValues.phoneNumber}
                onChange={handleInputChange}
              />
              <CFormTextarea
                className="mb-2"
                name="address"
                rows="3"
                placeholder="Address"
                value={formValues.address}
                onChange={handleInputChange}
              />
            </CForm>
          </div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setShowCustomerModal(false)}>
          Close
        </CButton>
        <CButton color="success" className="text-white font fw-semibold" onClick={handleSubmit}>
          {customerLoading ? 'Saving...' : 'Add Customer'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CustomerModal;