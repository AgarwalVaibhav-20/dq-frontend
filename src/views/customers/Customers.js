import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchCustomers, deleteCustomer, addCustomer, updateCustomer, setSelectedCustomerType, updateCustomerFrequency } from '../../redux/slices/customerSlice'
import { CButton, CSpinner, CModal, CModalHeader, CModalBody, CModalFooter, CForm, CFormInput, CFormTextarea, CFormLabel, CAlert, CFormSelect, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CFormCheck } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeOpen, cilChatBubble, cilTrash, cilPlus, cilFilter, cilPencil, cilOptions, cilPeople } from '@coreui/icons'
import CustomToolbar from '../../utils/CustomToolbar'
import { sendBulkEmail, resetBulkEmailStatus } from '../../redux/slices/SendBulkEmailSlice'
import { useMediaQuery } from '@mui/material'
import axiosInstance from '../../utils/axiosConfig'
import { toast } from 'react-toastify'
import { fetchMembers } from '../../redux/slices/memberSlice'
import { Portal } from '@mui/material';
const Customer = () => {
  const dispatch = useDispatch()
  const { customers, loading, selectedCustomerType } = useSelector((state) => state.customers)
  const restaurantId = localStorage.getItem('restaurantId')
  const token = localStorage.getItem('authToken')
  const isMobile = useMediaQuery('(max-width:600px)')

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [bulkEmailModalVisible, setBulkEmailModalVisible] = useState(false)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthday: '',
    anniversary: '',
    membershipId: '',
    membershipName: ''
  })

  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [updateFormData, setUpdateFormData] = useState({
    _id: '',
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthday: '',
    anniversary: '',
    membershipId: '',
    membershipName: '',
    corporate: false,
  })

  const [formErrors, setFormErrors] = useState({})
  const { members } = useSelector((state) => state.members)

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
    if (restaurantId && token) {
      dispatch(fetchCustomers({ token, restaurantId }))
      dispatch(fetchMembers(token))
      fetchCustomerSettings();
    }
  }, [dispatch, restaurantId, token])

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
        dispatch(fetchCustomers({ restaurantId })) // ✅ FIXED
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
      dispatch(sendBulkEmail({ restaurantId, subject, title, body }))
      setBulkEmailModalVisible(false)
      setSubject('')
      setTitle('')
      setBody('')
    } catch (error) {
      console.error('Send bulk email failed:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Update Customer input handler
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name?.trim()) {
      errors.name = 'Customer name is required'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCustomer = async () => {
    if (!validateForm()) return

    try {
      await dispatch(addCustomer({
        token,
        name: formData.name,
        email: formData.email,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        birthday: formData.birthday,
        anniversary: formData.anniversary,
        corporate: formData.corporate,
        membershipId: formData.membershipId || null,
        membershipName: formData.membershipName || null
      })).unwrap()

      dispatch(fetchCustomers({ restaurantId, token }))

      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        birthday: '',
        anniversary: '',
        corporate: false,
        membershipId: '',
        membershipName: ''
      })
      setFormErrors({})
      setAddCustomerModalVisible(false)
    } catch (error) {
      console.error('Failed to add customer:', error)
    }
  }

  const openUpdateModal = (customer) => {
    console.log("customer is thi", customer)
    setUpdateFormData({
      _id: customer._id,
      name: customer.name || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      anniversary: customer.anniversary ? customer.anniversary.split('T')[0] : '',
      membershipId: customer.membershipId?._id || customer.membershipId || '',
      membershipName: customer.membership?.membershipName || customer.membershipName || ''
    })
    setUpdateModalVisible(true)
  }

  const handleUpdateCustomer = async () => {
    if (!updateFormData.name?.trim()) {
      alert('Customer name is required')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      await dispatch(updateCustomer({
        _id: updateFormData._id,
        token,
        name: updateFormData.name,
        email: updateFormData.email,
        address: updateFormData.address,
        phoneNumber: updateFormData.phoneNumber,
        birthday: updateFormData.birthday,
        anniversary: updateFormData.anniversary,
        membershipId: updateFormData.membershipId || null,
        membershipName: updateFormData.membershipName || null
      })).unwrap()

      dispatch(fetchCustomers({ restaurantId })) // ✅ FIXED

      setUpdateModalVisible(false)
      setUpdateFormData({
        _id: '',
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        birthday: '',
        anniversary: '',
        membershipId: '',
        membershipName: ''
      })
    } catch (error) {
      console.error('Failed to update customer:', error)
    }
  }

  const closeAddCustomerModal = () => {
    setAddCustomerModalVisible(false)
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      birthday: '',
      anniversary: '',
      corporate: false,
      membershipId: '',
      membershipName: ''
    })
    setFormErrors({})
  }

  const closeUpdateModal = () => {
    setUpdateModalVisible(false)
    setUpdateFormData({
      _id: '',
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      birthday: '',
      anniversary: '',
      membershipId: '',
      membershipName: ''
    })
  }
  // UPDATED COLUMNS WITH DYNAMIC CLASSIFICATION
  const columns = [
    {
      field: 'sno',
      headerName: 'S.No.',
      width: isMobile ? 80 : 100,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      width: isMobile ? 150 : 200,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'email',
      headerName: 'Email Address',
      width: isMobile ? 180 : 250,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone Number',
      width: isMobile ? 140 : 180,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'address',
      headerName: 'Address',
      width: isMobile ? 150 : 200,
      headerAlign: 'left',
      align: 'left',
    },
    {
      field: 'frequency',
      headerName: 'Visit Count',
      width: isMobile ? 100 : 120,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
    },
    {
      field: 'dynamicCustomerType',
      headerName: 'Customer Type',
      width: isMobile ? 120 : 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const type = params.row.dynamicCustomerType || 'FirstTimer'
        const getTypeColor = (type) => {
          switch (type) {
            case 'FirstTimer': return '#6c757d'
            case 'Corporate': return '#0d6efd'
            case 'Regular': return '#198754'
            case 'Lost Customer': return '#dc3545'
            case 'High Spender': return '#fd7e14'
            default: return '#6c757d'
          }
        }
        return (
          <span
            style={{
              backgroundColor: getTypeColor(type),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500',
              display: 'inline-block',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            {type}
          </span>
        )
      },
    },
    {
      field: 'totalSpent',
      headerName: 'Total Spent (₹)',
      width: isMobile ? 120 : 150,
      headerAlign: 'right',
      align: 'right',
      type: 'number',
      renderCell: (params) => {
        const amount = params.row.totalSpent || 0;
        return (
          <span style={{ fontWeight: 'bold', color: '#198754' }}>
            ₹{amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 280 : 350,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const { email, phoneNumber, _id } = params.row;

        return (
          <div className='d-flex gap-2 justify-content-center align-items-center'
            style={{
              flexWrap: 'nowrap',
              overflow: 'visible',
              zIndex: 9999,
            }}
          >
            <CButton color="primary" size="sm" onClick={() => sendEmail(email)}>
              <CIcon icon={cilEnvelopeOpen} className="me-1" /> Email
            </CButton>

            <CButton color="success" size="sm" onClick={() => sendWhatsApp(phoneNumber)}>
              <CIcon icon={cilChatBubble} className="me-1" /> WhatsApp
            </CButton>

            <CDropdown variant="btn-group">
              <CDropdownToggle color="secondary" size="sm" caret={false}>
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <Portal>
                <CDropdownMenu placement="bottom-end" style={{ zIndex: 2000 }}>
                  <CDropdownItem onClick={() => openUpdateModal(params.row)}>
                    <CIcon icon={cilPencil} className="me-2" /> Update
                  </CDropdownItem>
                  <CDropdownItem
                    onClick={() => openDeleteModal(_id)}
                    className="text-danger"
                  >
                    <CIcon icon={cilTrash} className="me-2" /> Delete
                  </CDropdownItem>
                </CDropdownMenu>
              </Portal>
            </CDropdown>
          </div>
        )
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
        <>
          {/* Desktop View - DataGrid */}
          <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4 hidden sm:block">
            <DataGrid
              autoHeight
              rows={filteredCustomers?.map((customer, index) => ({
                ...customer,
                sno: index + 1,
                membership: customer.membership || '',
              }))}
              columns={columns}
              getRowId={(row) => row.id || row._id || Math.random()}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              slots={{ Toolbar: CustomToolbar }}
              disableColumnMenu={false}
              disableColumnFilter={false}
              disableColumnSelector={false}
              disableDensitySelector={false}
              columnHeaderHeight={60}
              rowHeight={60}
              headerHeight={60}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  borderBottom: '2px solid #dee2e6',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    color: '#495057',
                    textOverflow: 'unset',
                    whiteSpace: 'normal',
                    lineHeight: 1.2,
                  },
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    justifyContent: 'center',
                  }
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.9rem',
                  padding: '12px 8px',
                  borderBottom: '1px solid #e9ecef',
                  '&:focus': {
                    outline: 'none',
                  }
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: '#fafafa',
                  }
                },
                '& .MuiDataGrid-columnHeader': {
                  '&:focus': {
                    outline: 'none',
                  }
                },
              }}
            />
          </div>

          {/* Mobile View - Cards */}
          <div className="block sm:hidden space-y-3">
            {filteredCustomers?.map((customer, index) => {
              const customerType = customer.dynamicCustomerType || 'FirstTimer';
              const getTypeColor = (type) => {
                switch (type) {
                  case 'FirstTimer': return '#6c757d'
                  case 'Corporate': return '#0d6efd'
                  case 'Regular': return '#198754'
                  case 'Lost Customer': return '#dc3545'
                  case 'High Spender': return '#fd7e14'
                  default: return '#6c757d'
                }
              }

              return (
                <div key={customer._id || customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Header with Customer Name and Type */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {customer.name || 'N/A'}
                      </h3>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getTypeColor(customerType) }}
                      >
                        {customerType}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center">
                        <CIcon icon={cilEnvelopeOpen} className="text-gray-400 me-2" size="sm" />
                        <span className="text-sm text-gray-600">{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.phoneNumber && (
                      <div className="flex items-center">
                        <CIcon icon={cilChatBubble} className="text-gray-400 me-2" size="sm" />
                        <span className="text-sm text-gray-600">{customer.phoneNumber}</span>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-start">
                        <span className="text-sm text-gray-600 flex-1">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{customer.frequency || 0}</div>
                      <div className="text-gray-500">Visits</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">₹{customer.totalSpent || 0}</div>
                      <div className="text-gray-500">Total Spent</div>
                    </div>
                    {customer.membership?.membershipName && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{customer.membership.membershipName}</div>
                        <div className="text-gray-500">Membership</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {customer.email && (
                      <CButton 
                        color="primary" 
                        size="sm" 
                        onClick={() => sendEmail(customer.email)}
                        className="flex-1 min-w-0"
                      >
                        <CIcon icon={cilEnvelopeOpen} className="me-1" />
                        Email
                      </CButton>
                    )}
                    
                    {customer.phoneNumber && (
                      <CButton 
                        color="success" 
                        size="sm" 
                        onClick={() => sendWhatsApp(customer.phoneNumber)}
                        className="flex-1 min-w-0"
                      >
                        <CIcon icon={cilChatBubble} className="me-1" />
                        WhatsApp
                      </CButton>
                    )}

                    <CDropdown variant="btn-group" className="flex-1 min-w-0">
                      <CDropdownToggle color="secondary" size="sm" caret={false} className="w-100">
                        <CIcon icon={cilOptions} />
                      </CDropdownToggle>
                      <CDropdownMenu placement="bottom-end">
                        <CDropdownItem onClick={() => openUpdateModal(customer)}>
                          <CIcon icon={cilPencil} className="me-2" /> Update
                        </CDropdownItem>
                        <CDropdownItem
                          onClick={() => openDeleteModal(customer._id)}
                          className="text-danger"
                        >
                          <CIcon icon={cilTrash} className="me-2" /> Delete
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  </div>
                </div>
              );
            })}

            {/* No customers message for mobile */}
            {filteredCustomers?.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">
                  <CIcon icon={cilPeople} size="3xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
                <p className="text-gray-500">Try adjusting your filters or add new customers.</p>
              </div>
            )}
          </div>
        </>
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
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="membershipId" className="fw-semibold">
                    Membership Plan
                  </CFormLabel>
                  <CFormSelect
                    id="membershipId"
                    name="membershipId"
                    value={formData.membershipId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedMembership = members.find(m => m._id === selectedId)

                      setFormData({
                        ...formData,
                        membershipId: selectedId,
                        membershipName: selectedMembership?.membershipName || ''
                      })
                    }}
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

      {/* Update Customer Modal */}
      <CModal
        visible={updateModalVisible}
        onClose={closeUpdateModal}
        backdrop="static"
        size="lg"
      >
        <CModalHeader className="fw-bold">Update Customer</CModalHeader>
        <CModalBody>
          <CForm>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-name" className="fw-semibold">
                    Customer Name <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="update-name"
                    name="name"
                    value={updateFormData.name}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-email" className="fw-semibold">
                    Email Address
                  </CFormLabel>
                  <CFormInput
                    type="email"
                    id="update-email"
                    name="email"
                    value={updateFormData.email}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-phoneNumber" className="fw-semibold">
                    Phone Number
                  </CFormLabel>
                  <CFormInput
                    type="tel"
                    id="update-phoneNumber"
                    name="phoneNumber"
                    value={updateFormData.phoneNumber}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-address" className="fw-semibold">
                    Address
                  </CFormLabel>
                  <CFormTextarea
                    id="update-address"
                    name="address"
                    rows="3"
                    value={updateFormData.address}
                    onChange={handleUpdateInputChange}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-birthday" className="fw-semibold">
                    Birthday
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    id="update-birthday"
                    name="birthday"
                    value={updateFormData.birthday}
                    onChange={handleUpdateInputChange}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-anniversary" className="fw-semibold">
                    Anniversary
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    id="update-anniversary"
                    name="anniversary"
                    value={updateFormData.anniversary}
                    onChange={handleUpdateInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-membershipId" className="fw-semibold">
                    Membership Plan
                  </CFormLabel>
                  <CFormSelect
                    id="update-membershipId"
                    name="membershipId"
                    value={updateFormData.membershipId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedMembership = members.find(m => m._id === selectedId)

                      setUpdateFormData({
                        ...updateFormData,
                        membershipId: selectedId,
                        membershipName: selectedMembership?.membershipName || ''
                      })
                    }}
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
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeUpdateModal}>
            Cancel
          </CButton>
          <CButton color="warning" className="shadow-sm" onClick={handleUpdateCustomer}>
            <CIcon icon={cilPencil} className="me-2" />
            Update Customer
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Customer