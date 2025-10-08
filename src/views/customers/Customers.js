import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchCustomers, deleteCustomer, addCustomer, setSelectedCustomerType, updateCustomerFrequency } from '../../redux/slices/customerSlice'
import { CButton, CSpinner, CModal, CModalHeader, CModalBody, CModalFooter, CForm, CFormInput, CFormTextarea, CFormLabel, CAlert, CFormSelect, CFormCheck } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeOpen, cilChatBubble, cilTrash, cilPlus, cilFilter } from '@coreui/icons'
import CustomToolbar from '../../utils/CustomToolbar'
import { sendBulkEmail, resetBulkEmailStatus } from '../../redux/slices/SendBulkEmailSlice'
import { useMediaQuery } from '@mui/material'
import axiosInstance from '../../utils/axiosConfig'
import { toast } from 'react-toastify'

const Customer = () => {
  const dispatch = useDispatch()
  const { customers, loading, selectedCustomerType } = useSelector((state) => state.customers)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const isMobile = useMediaQuery('(max-width:600px)')

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [bulkEmailModalVisible, setBulkEmailModalVisible] = useState(false)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // Add Customer Modal states
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthday: '',
    anniversary: '',
    corporate: false,
  })
  const [formErrors, setFormErrors] = useState({})

  // CUSTOMER SETTINGS STATE - UPDATED WITH CORRECT FIELD NAMES
  const [customerSettings, setCustomerSettings] = useState({
    lostCustomerDays: '',            
    highSpenderAmount: '',        
    regularCustomerVisits: ''         
  })
  
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState('')

  // Customer type filter options
  const customerTypeOptions = [
    { value: 'All', label: 'All Customers' },
    { value: 'FirstTimer', label: 'First Timer' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Lost Customer', label: 'Lost Customer' },
    { value: 'High Spender', label: 'High Spender' },
  ]

  // Calculate days since customer was created (for Lost Customer logic)
  const daysSinceCreation = (createdAt) => {
    if (!createdAt) return 0;
    
    const today = new Date();
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(today - createdDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Main classification function - CORRECTED
  const classifyCustomer = (customer) => {
    console.log('Classifying customer:', customer.name, {
      corporate: customer.corporate,
      totalSpent: customer.totalSpent,
      frequency: customer.frequency,
      createdAt: customer.createdAt,
      settings: customerSettings
    });

    // 1. Corporate customer (highest priority)
    if (customer.corporate === true) {
      return 'Corporate';
    }
    
    // 2. High Spender check - based on totalSpent
    if ((customer.totalSpent || 0) >= customerSettings.highSpenderAmount) {
      return 'High Spender';
    }
    
    // 3. Regular Customer check - based on frequency (visit count)
    if ((customer.frequency || 0) >= customerSettings.regularCustomerVisits) {
      return 'Regular';
    }
    
    // 4. Lost Customer check - based on days since creation
    const daysSinceCreated = daysSinceCreation(customer.createdAt);
    if (daysSinceCreated > customerSettings.lostCustomerDays) {
      return 'Lost Customer';
    }
 
    return 'FirstTimer';
  };

  // FETCH CUSTOMER SETTINGS FUNCTION
  const fetchCustomerSettings = async () => {
    try {
      setCustomerLoading(true)
      const restaurantIdFromStorage = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/customer-settings?restaurantId=${restaurantIdFromStorage}`)

      if (response.data.success) {
        const settings = {
          lostCustomerDays: response.data.data.lostCustomerDays || 60,
          highSpenderAmount: response.data.data.highSpenderAmount || 10000,
          regularCustomerVisits: response.data.data.regularCustomerVisits || 5
        };
        setCustomerSettings(settings)
        console.log('Customer settings loaded:', settings)
      }
    } catch (error) {
      console.error('Error fetching customer settings:', error)
      if (error.response?.status !== 404) {
        setCustomerError('Failed to fetch customer settings')
        toast.error('Failed to fetch customer settings')
      }
    } finally {
      setCustomerLoading(false)
    }
  }

  // LOAD DATA ON COMPONENT MOUNT
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchCustomers({ restaurantId }))
      fetchCustomerSettings();
    }
  }, [dispatch, restaurantId])

  // GET CUSTOMERS WITH DYNAMIC CLASSIFICATION
  const getClassifiedCustomers = () => {
    return customers.map(customer => ({
      ...customer,
      dynamicCustomerType: classifyCustomer(customer)
    }));
  };

  // FILTER CUSTOMERS BASED ON CLASSIFICATION
  const getFilteredCustomers = () => {
    const classifiedCustomers = getClassifiedCustomers();
    
    if (selectedCustomerType === 'All') {
      return classifiedCustomers;
    }
    
    return classifiedCustomers.filter(customer => 
      customer.dynamicCustomerType === selectedCustomerType
    );
  };

  // GET COUNT FOR EACH CUSTOMER TYPE
  const getCustomerTypeCount = (type) => {
    if (type === 'All') return customers.length;
    
    const classifiedCustomers = getClassifiedCustomers();
    return classifiedCustomers.filter(customer => 
      customer.dynamicCustomerType === type
    ).length;
  };

  // Handle customer type filter change
  const handleCustomerTypeChange = (e) => {
    const newType = e.target.value
    dispatch(setSelectedCustomerType(newType))
  }

  // Get filtered customers for display
  const filteredCustomers = getFilteredCustomers();

  // REFRESH SETTINGS FUNCTION
  const refreshCustomerSettings = async () => {
    await fetchCustomerSettings();
    toast.success('Customer settings refreshed!');
  };

  // REST OF YOUR EXISTING FUNCTIONS (unchanged)
  const sendEmail = (email) => {
    window.location.href = `mailto:${email}?subject=Hello&body=Hi there!`
  }

  const sendWhatsApp = (phoneNumber) => {
    const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${sanitizedPhone}?text=Hi!`, '_blank')
  }

  const handleDelete = () => {
    if (selectedCustomerId) {
      dispatch(deleteCustomer({ _id: selectedCustomerId })).then(() => {
        setDeleteModalVisible(false)
        setSelectedCustomerId(null)
      })
    }
  }

  const openDeleteModal = (id) => {
    setSelectedCustomerId(id)
    setDeleteModalVisible(true)
  }

  let serialCounter = 1
  const generateSerialNumber = () => {
    return serialCounter++
  }

  const sendbulkEmail = () => {
    setBulkEmailModalVisible(true)
  }

  const handleSendBulkEmail = () => {
    if (!subject || !title || !body) {
      alert('Please fill in all fields')
      return
    }

    try {
      dispatch(sendBulkEmail({ restaurantId, subject, title, body }));
      setBulkEmailModalVisible(false);
      setSubject('');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Send bulk email failed:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Customer name is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await dispatch(addCustomer({
        token,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        birthday: formData.birthday,
        anniversary: formData.anniversary,
        corporate: formData.corporate
      })).unwrap();

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        birthday: '',
        anniversary: '',
        corporate: false,
      });
      setFormErrors({});
      setAddCustomerModalVisible(false);
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const closeAddCustomerModal = () => {
    setAddCustomerModalVisible(false);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      birthday: '',
      anniversary: '',
      corporate: false,
    });
    setFormErrors({});
  };

  // UPDATED COLUMNS WITH DYNAMIC CLASSIFICATION
  const columns = [
    {
      field: 'sno',
      headerName: 'S.No.',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 80 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.sno,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.name || 'N/A',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.email || 'N/A',
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone Number',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.phoneNumber || 'N/A',
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.address || 'N/A',
    },
    {
      field: 'frequency',
      headerName: 'Frequency',
      flex: isMobile ? undefined : 0.8,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.frequency || 0,
    },
    {
      field: 'dynamicCustomerType',
      headerName: 'Customer Type',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.dynamicCustomerType || 'FirstTimer',
      renderCell: (params) => {
        const type = params.row.dynamicCustomerType || 'FirstTimer';
        const getTypeColor = (type) => {
          switch (type) {
            case 'FirstTimer': return '#6c757d';
            case 'Corporate': return '#0d6efd';
            case 'Regular': return '#198754';
            case 'Lost Customer': return '#dc3545';
            case 'High Spender': return '#fd7e14';
            default: return '#6c757d';
          }
        };
        return (
          <span
            style={{
              backgroundColor: getTypeColor(type),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            {type}
          </span>
        );
      },
    },
    {
      field: 'totalSpent',
      headerName: 'Total Spent',
      flex: isMobile ? undefined : 0.8,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => `₹${params.row.totalSpent || 0}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 2,
      minWidth: isMobile ? 280 : 300,
      headerClassName: 'header-style',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const { email, phoneNumber, _id } = params.row;

        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
            <CButton color="primary" size="sm" onClick={() => sendEmail(email)}>
              <CIcon icon={cilEnvelopeOpen} /> Email
            </CButton>
            <CButton color="success" size="sm" onClick={() => sendWhatsApp(phoneNumber)}>
              <CIcon icon={cilChatBubble} /> WhatsApp
            </CButton>
            <CButton color="danger" size="sm" onClick={() => openDeleteModal(_id)}>
              <CIcon icon={cilTrash} /> Delete
            </CButton>
          </div>
        );
      },
    }
  ]

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0">Customers</h2>
        <div className="flex gap-2">
          <CButton color="success" onClick={() => setAddCustomerModalVisible(true)} className="shadow-sm">
            <CIcon icon={cilPlus} className="me-2" /> Add Customer
          </CButton>
          <CButton color="primary" onClick={sendbulkEmail} className="shadow-sm">
            <CIcon icon={cilEnvelopeOpen} className="me-2" /> Send Bulk Emails
          </CButton>
        </div>
      </div>

      {/* Customer Type Filter with Counts */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <CIcon icon={cilFilter} className="text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Filter by Customer Type:</label>
          <CFormSelect
            value={selectedCustomerType}
            onChange={handleCustomerTypeChange}
            style={{ width: '250px' }}
            className="shadow-sm"
          >
            {customerTypeOptions.map((option) => {
              const count = getCustomerTypeCount(option.value);
              return (
                <option key={option.value} value={option.value}>
                  {option.label} ({count})
                </option>
              );
            })}
          </CFormSelect>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-6">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4">
          <DataGrid
            autoHeight
            rows={filteredCustomers?.map((customer, index) => ({
              ...customer,
              sno: index + 1,
            }))}
            columns={columns}
            getRowId={(row) => row.id || row._id || Math.random()}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{ Toolbar: CustomToolbar }}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f9fafb',
                fontWeight: 'bold',
                fontSize: '1rem',
              },
              '& .MuiDataGrid-cell': {
                fontSize: '0.95rem',
                padding: '10px',
              },
              '@media (max-width: 640px)': {
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.8rem',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.75rem',
                },
              },
            }}
          />
        </div>
      )}

      {/* ALL YOUR EXISTING MODALS REMAIN THE SAME */}
      
      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        backdrop="static"
      >
        <CModalHeader className="fw-bold">Confirm Deletion</CModalHeader>
        <CModalBody className="text-gray-700">
          Are you sure you want to delete this customer? This action cannot be undone.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" className="shadow-sm" onClick={handleDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Email Modal */}
      <CModal
        visible={bulkEmailModalVisible}
        onClose={() => setBulkEmailModalVisible(false)}
        backdrop="static"
      >
        <CModalHeader className="fw-bold">Send Bulk Email</CModalHeader>
        <CModalBody>
          <CForm className="space-y-3">
            <CFormInput
              type="text"
              id="subject"
              label="Subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <CFormInput
              type="text"
              id="title"
              label="Title"
              placeholder="Enter email title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <CFormInput
              type="text"
              id="body"
              label="Body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setBulkEmailModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" className="shadow-sm" onClick={handleSendBulkEmail}>
            Send
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add Customer Modal */}
      <CModal
        visible={addCustomerModalVisible}
        onClose={closeAddCustomerModal}
        backdrop="static"
        size="lg"
      >
        <CModalHeader className="fw-bold">Add New Customer</CModalHeader>
        <CModalBody>
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
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="name" className="fw-semibold">
                    Customer Name <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    invalid={!!formErrors.name}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="email" className="fw-semibold">
                    Email Address
                  </CFormLabel>
                  <CFormInput
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    invalid={!!formErrors.email}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="phoneNumber" className="fw-semibold">
                    Phone Number
                  </CFormLabel>
                  <CFormInput
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    invalid={!!formErrors.phoneNumber}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="address" className="fw-semibold">
                    Address
                  </CFormLabel>
                  <CFormTextarea
                    id="address"
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="birthday" className="fw-semibold">
                    Birthday
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="anniversary" className="fw-semibold">
                    Anniversary
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    id="anniversary"
                    name="anniversary"
                    value={formData.anniversary}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <CFormCheck
                  id="corporate"
                  name="corporate"
                  label="Corporate Customer"
                  checked={formData.corporate}
                  onChange={handleInputChange}
                  inline
                  style={{ transform: 'scale(1.3)' }}
                />
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeAddCustomerModal}>
            Cancel
          </CButton>
          <CButton color="success" className="shadow-sm" onClick={handleAddCustomer}>
            <CIcon icon={cilPlus} className="me-2" />
            Add Customer
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Customer
