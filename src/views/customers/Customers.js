import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
  fetchCustomers,
  deleteCustomer,
  addCustomer,
  updateCustomer,
  setSelectedCustomerType,
  updateCustomerFrequency,
} from '../../redux/slices/customerSlice';
import {
  fetchCoupons,
} from '../../redux/slices/coupenSlice';
import {
  CButton,
  CSpinner,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CAlert,
  CFormSelect,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormCheck,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilEnvelopeOpen,
  cilChatBubble,
  cilTrash,
  cilPlus,
  cilFilter,
  cilPencil,
  cilOptions,
  cilPeople,
} from '@coreui/icons';
import CustomToolbar from '../../utils/CustomToolbar';
import { sendBulkEmail, resetBulkEmailStatus } from '../../redux/slices/SendBulkEmailSlice';
import { useMediaQuery } from '@mui/material';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { fetchMembers } from '../../redux/slices/memberSlice';
import { Portal } from '@mui/material';

const Customer = () => {
  const dispatch = useDispatch();
  const { customers, loading, selectedCustomerType, error } = useSelector((state) => state.customers);
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const token = localStorage.getItem('authToken');
  const isMobile = useMediaQuery('(max-width:600px)');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [bulkEmailModalVisible, setBulkEmailModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Send Message Modal States
  const [sendMessageModalVisible, setSendMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState('');

  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    birthday: '',
    anniversary: '',
    membershipId: '',
    membershipName: '',
    corporate: false,
  });

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
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
  });

  const [formErrors, setFormErrors] = useState({});
  const { members } = useSelector((state) => state.members);

  // Customer settings state
  const [customerSettings, setCustomerSettings] = useState({
    lostCustomerDays: 60,
    highSpenderAmount: 10000,
    regularCustomerVisits: 5,
  });

  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  // Customer type filter options
  const customerTypeOptions = [
    { value: 'All', label: 'All Customers' },
    { value: 'FirstTimer', label: 'First Timer' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Lost Customer', label: 'Lost Customer' },
    { value: 'High Spender', label: 'High Spender' },
  ];

  // ✅ Get coupons from Redux
  const { coupons } = useSelector(state => state.coupons);

  // ✅ Fetch coupons on mount
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchCustomers({ token, restaurantId }));
      dispatch(fetchMembers(token));
      dispatch(fetchCoupons({ restaurantId }));
      fetchCustomerSettings();
    } else {
      console.error('Missing token or restaurantId');
      toast.error('Authentication error: Please log in again.');
    }
  }, [dispatch, restaurantId, token]);

  // Calculate days since customer was created
  const daysSinceCreation = (createdAt) => {
    if (!createdAt) return 0;
    const today = new Date();
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(today - createdDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Classify customer
  const classifyCustomer = (customer) => {
    if (customer.corporate === true) {
      return 'Corporate';
    }
    if ((customer.totalSpent || 0) >= customerSettings.highSpenderAmount) {
      return 'High Spender';
    }
    if ((customer.frequency || 0) >= customerSettings.regularCustomerVisits) {
      return 'Regular';
    }
    const daysSinceCreated = daysSinceCreation(customer.createdAt);
    if (daysSinceCreated > customerSettings.lostCustomerDays) {
      return 'Lost Customer';
    }
    return 'FirstTimer';
  };

  // Fetch customer settings
  const fetchCustomerSettings = async () => {
    try {
      setCustomerLoading(true);
      const restaurantIdFromStorage = restaurantId;
      const response = await axiosInstance.get(`/api/customer-settings?restaurantId=${restaurantIdFromStorage}`);
      if (response.data.success) {
        const settings = {
          lostCustomerDays: response.data.data.lostCustomerDays || 60,
          highSpenderAmount: response.data.data.highSpenderAmount || 10000,
          regularCustomerVisits: response.data.data.regularCustomerVisits || 5,
        };
        setCustomerSettings(settings);
        console.log('Customer settings loaded:', settings);
      }
    } catch (error) {
      console.error('Error fetching customer settings:', error);
      if (error.response?.status !== 404) {
        setCustomerError('Failed to fetch customer settings');
        toast.error('Failed to fetch customer settings');
      }
    } finally {
      setCustomerLoading(false);
    }
  };

  // Get customers with dynamic classification
  const getClassifiedCustomers = () => {
    return customers.map((customer) => ({
      ...customer,
      dynamicCustomerType: classifyCustomer(customer),
    }));
  };

  // Filter customers based on classification
  const getFilteredCustomers = () => {
    const classifiedCustomers = getClassifiedCustomers();
    if (selectedCustomerType === 'All') {
      return classifiedCustomers;
    }
    return classifiedCustomers.filter((customer) => customer.dynamicCustomerType === selectedCustomerType);
  };

  // Get count for each customer type
  const getCustomerTypeCount = (type) => {
    if (type === 'All') return customers.length;
    const classifiedCustomers = getClassifiedCustomers();
    return classifiedCustomers.filter((customer) => customer.dynamicCustomerType === type).length;
  };

  // Handle customer type filter change
  const handleCustomerTypeChange = (e) => {
    const newType = e.target.value;
    dispatch(setSelectedCustomerType(newType));
  };

  // Get filtered customers for display
  const filteredCustomers = getFilteredCustomers();

  // Refresh settings
  const refreshCustomerSettings = async () => {
    await fetchCustomerSettings();
    toast.success('Customer settings refreshed!');
  };

  // Action handlers
  const sendEmail = (email) => {
    window.location.href = `mailto:${email}?subject=Hello&body=Hi there!`;
  };

  const sendWhatsApp = (phoneNumber) => {
    const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${sanitizedPhone}?text=Hi!`, '_blank');
  };

  // Send Message Modal Functions
  const openSendMessageModal = () => {
    setSendMessageModalVisible(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/send-message', {
        message: messageText,
        restaurantId,
        couponId: selectedCoupon || null,
      });

      if (response.data.success) {
        toast.success('Message sent successfully');
        setSendMessageModalVisible(false);
        setMessageText('');
        setSelectedCoupon('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const closeSendMessageModal = () => {
    setSendMessageModalVisible(false);
    setMessageText('');
    setSelectedCoupon('');
  };

  const handleDelete = () => {
    if (selectedCustomerId) {
      dispatch(deleteCustomer({ _id: selectedCustomerId })).then(() => {
        dispatch(fetchCustomers({ token, restaurantId }));
        setDeleteModalVisible(false);
        setSelectedCustomerId(null);
      });
    }
  };

  const openDeleteModal = (id) => {
    setSelectedCustomerId(id);
    setDeleteModalVisible(true);
  };

  let serialCounter = 1;
  const generateSerialNumber = () => {
    return serialCounter++;
  };

  const sendBulkEmailHandler = () => {
    setBulkEmailModalVisible(true);
  };

  const handleSendBulkEmail = () => {
    if (!subject || !title || !body) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      dispatch(sendBulkEmail({ restaurantId, subject, title, body }));
      setBulkEmailModalVisible(false);
      setSubject('');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Send bulk email failed:', error);
      toast.error('Failed to send bulk email');
    }
  };

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    if (!validateForm()) return;
    try {
      await dispatch(
        addCustomer({
          token,
          name: formData.name,
          email: formData.email,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          birthday: formData.birthday,
          anniversary: formData.anniversary,
          corporate: formData.corporate,
          membershipId: formData.membershipId || null,
          membershipName: formData.membershipName || null,
        })
      ).unwrap();
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        birthday: '',
        anniversary: '',
        corporate: false,
        membershipId: '',
        membershipName: '',
      });
      setFormErrors({});
      setAddCustomerModalVisible(false);
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast.error('Failed to add customer: ' + (error.message || 'Unknown error'));
    }
  };

  const openUpdateModal = (customer) => {
    setUpdateFormData({
      _id: customer._id,
      name: customer.name || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      anniversary: customer.anniversary ? customer.anniversary.split('T')[0] : '',
      membershipId: customer.membershipId?._id || customer.membershipId || '',
      membershipName: customer.membership?.membershipName || customer.membershipName || '',
      corporate: customer.corporate || false,
    });
    setUpdateModalVisible(true);
  };

  const handleUpdateCustomer = async () => {
    if (!updateFormData.name?.trim()) {
      toast.error('Customer name is required');
      return;
    }
    try {
      await dispatch(
        updateCustomer({
          _id: updateFormData._id,
          token,
          name: updateFormData.name,
          email: updateFormData.email,
          address: updateFormData.address,
          phoneNumber: updateFormData.phoneNumber,
          birthday: updateFormData.birthday,
          anniversary: updateFormData.anniversary,
          membershipId: updateFormData.membershipId || null,
          membershipName: updateFormData.membershipName || null,
        })
      ).unwrap();
      setUpdateModalVisible(false);
      setUpdateFormData({
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
      });
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer: ' + (error.message || 'Unknown error'));
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
      membershipId: '',
      membershipName: '',
    });
    setFormErrors({});
  };

  const closeUpdateModal = () => {
    setUpdateModalVisible(false);
    setUpdateFormData({
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
    });
  };

  const columns = [
    {
      field: 'sno',
      headerName: 'S.No.',
      width: isMobile ? 80 : 100,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        // Get all sorted and filtered row IDs
        const sortedIds = params.api.getSortedRowIds();
        // Find the 0-based index of the current row's ID
        const index = sortedIds.indexOf(params.id);
        // Return the 1-based serial number
        return index + 1;
      },
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
        const type = params.row.dynamicCustomerType || 'FirstTimer';
        const getTypeColor = (type) => {
          switch (type) {
            case 'FirstTimer':
              return '#6c757d';
            case 'Corporate':
              return '#0d6efd';
            case 'Regular':
              return '#198754';
            case 'Lost Customer':
              return '#dc3545';
            case 'High Spender':
              return '#fd7e14';
            default:
              return '#6c757d';
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
              fontWeight: '500',
              display: 'inline-block',
              minWidth: '80px',
              textAlign: 'center',
            }}
          >
            {type}
          </span>
        );
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
      width: isMobile ? 150 : 200,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const { email, phoneNumber, _id } = params.row;
        return (
          <div
            className="d-flex gap-2 justify-content-center align-items-center"
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
                  <CDropdownItem onClick={() => openDeleteModal(_id)} className="text-danger">
                    <CIcon icon={cilTrash} className="me-2" /> Delete
                  </CDropdownItem>
                </CDropdownMenu>
              </Portal>
            </CDropdown>
          </div>
        );
      },
    },
  ];

  return (

    <div className="p-4 min-h-screen" style={{ backgroundColor: 'var(--cui-body-bg)', color: 'var(--cui-body-color)' }}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-3 sm:mb-0" style={{ color: 'var(--cui-body-color)' }}>Customers</h2>
        <div className="flex gap-2">
          <CButton
            color="info"
            onClick={openSendMessageModal}
            className="shadow-sm"
          >
            <CIcon icon={cilChatBubble} className="me-2" /> Send Message
          </CButton>
          <CButton
            color="success"
            onClick={() => setAddCustomerModalVisible(true)}
            className="shadow-sm"
          >
            <CIcon icon={cilPlus} className="me-2" /> Add Customer
          </CButton>
          <CButton color="primary" onClick={sendBulkEmailHandler} className="shadow-sm">
            <CIcon icon={cilEnvelopeOpen} className="me-2" /> Send Bulk Emails
          </CButton>
        </div>
      </div>

      {/* Customer Type Filter with Counts */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <CIcon icon={cilFilter} style={{ color: 'var(--cui-secondary-color)' }} />
          <label className="text-sm font-medium" style={{ color: 'var(--cui-body-color)' }}>Filter by Customer Type:</label>
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
          <CSpinner color="primary" />
        </div>
      ) : (
        <>
          {!isMobile ? (
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredCustomers}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                components={{ Toolbar: CustomToolbar }}
                getRowId={(row) => row._id}
                disableSelectionOnClick
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers?.map((customer) => (
                <div
                  key={customer._id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h3>
                      <span
                        style={{
                          backgroundColor:
                            customer.dynamicCustomerType === 'FirstTimer'
                              ? '#6c757d'
                              : customer.dynamicCustomerType === 'Corporate'
                                ? '#0d6efd'
                                : customer.dynamicCustomerType === 'Regular'
                                  ? '#198754'
                                  : customer.dynamicCustomerType === 'Lost Customer'
                                    ? '#dc3545'
                                    : '#fd7e14',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}
                      >
                        {customer.dynamicCustomerType || 'FirstTimer'}
                      </span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 mt-2">
                        <CIcon icon={cilEnvelopeOpen} size="sm" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</span>
                      </div>
                    )}
                    {customer.phoneNumber && (
                      <div className="flex items-center gap-2 mt-1">
                        <CIcon icon={cilChatBubble} size="sm" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{customer.phoneNumber}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{customer.frequency || 0}</div>
                      <div className="text-gray-500 dark:text-gray-400">Visits</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        ₹{customer.totalSpent || 0}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Total Spent</div>
                    </div>
                    {customer.membership?.membershipName && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {customer.membership.membershipName}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Membership</div>
                      </div>
                    )}
                  </div>
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
              ))}
              {filteredCustomers?.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    <CIcon icon={cilPeople} size="3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No customers found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or add new customers.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)} backdrop="static">
        <CModalHeader className="fw-bold dark:text-gray-100">Confirm Deletion</CModalHeader>
        <CModalBody className="text-gray-700 dark:text-gray-300">
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
        <CModalHeader className="fw-bold dark:text-gray-100">Send Bulk Email</CModalHeader>
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
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setBulkEmailModalVisible(false)}
          >
            Cancel
          </CButton>
          <CButton color="primary" className="shadow-sm" onClick={handleSendBulkEmail}>
            Send
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Send Message Modal with Coupon Selection - ✅ FIXED */}
      <CModal
        visible={sendMessageModalVisible}
        onClose={closeSendMessageModal}
        backdrop="static"
      >
        <CModalHeader className="fw-bold dark:text-gray-100">
          Send Message to All Customers
        </CModalHeader>
        <CModalBody>
          <CForm>
            {/* Coupon Selection Dropdown */}
            <div className="mb-3">
              <CFormLabel htmlFor="couponSelect" className="fw-semibold dark:text-gray-200">
                Attach Coupon (Optional)
              </CFormLabel>
              <CFormSelect
                id="couponSelect"
                value={selectedCoupon}
                onChange={(e) => setSelectedCoupon(e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                <option value="">-- No Coupon --</option>
                {coupons?.map((coupon) => (
                  <option key={coupon._id} value={coupon._id}>
                    {coupon.code} - {coupon.discountValue}
                    {coupon.discountType === 'percentage' ? '%' : '₹'} OFF
                    {coupon.minOrderValue > 0 && ` (Min: ₹${coupon.minOrderValue})`}
                  </option>
                ))}
              </CFormSelect>
              <small className="text-muted dark:text-gray-400">
                Select a coupon to include with the message
              </small>
            </div>

            {/* Message Text Area */}
            <div className="mb-3">
              <CFormLabel htmlFor="messageText" className="fw-semibold dark:text-gray-200">
                Message <span className="text-danger">*</span>
              </CFormLabel>
              <CFormTextarea
                id="messageText"
                rows="4"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            {/* Coupon Preview - ✅ FIXED: Using coupons instead of availableCoupons */}
            {selectedCoupon && (
              <div className="alert alert-info mb-3" style={{ backgroundColor: '#d1ecf1', borderColor: '#bee5eb', color: '#0c5460', padding: '12px', borderRadius: '4px' }}>
                <strong>Selected Coupon:</strong>
                <br />
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {coupons?.find(c => c._id === selectedCoupon)?.code}
                </span>
                {' - '}
                {coupons?.find(c => c._id === selectedCoupon)?.description || 'No description'}
              </div>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeSendMessageModal}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSendMessage}>
            <CIcon icon={cilChatBubble} className="me-2" />
            Send Message
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
        <CModalHeader className="fw-bold dark:text-gray-100">Add New Customer</CModalHeader>
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
                  <CFormLabel htmlFor="name" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="email" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="phoneNumber" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="address" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="birthday" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="anniversary" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="membershipId" className="fw-semibold dark:text-gray-200">
                    Membership Plan
                  </CFormLabel>
                  <CFormSelect
                    id="membershipId"
                    name="membershipId"
                    value={formData.membershipId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedMembership = members.find((m) => m._id === selectedId);
                      setFormData({
                        ...formData,
                        membershipId: selectedId,
                        membershipName: selectedMembership?.membershipName || '',
                      });
                    }}
                  >
                    <option value="">No Membership</option>
                    {members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.membershipName} -{' '}
                        {member.discountType === 'fixed'
                          ? `₹${member.discount}`
                          : `${member.discount}%`}{' '}
                        OFF (Min: ₹{member.minSpend})
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
        <CModalHeader className="fw-bold dark:text-gray-100">Update Customer</CModalHeader>
        <CModalBody>
          <CForm>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="update-name" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-email" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-phoneNumber" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-address" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-birthday" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-anniversary" className="fw-semibold dark:text-gray-200">
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
                  <CFormLabel htmlFor="update-membershipId" className="fw-semibold dark:text-gray-200">
                    Membership Plan
                  </CFormLabel>
                  <CFormSelect
                    id="update-membershipId"
                    name="membershipId"
                    value={updateFormData.membershipId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedMembership = members.find((m) => m._id === selectedId);
                      setUpdateFormData({
                        ...updateFormData,
                        membershipId: selectedId,
                        membershipName: selectedMembership?.membershipName || '',
                      });
                    }}
                  >
                    <option value="">No Membership</option>
                    {members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.membershipName} -{' '}
                        {member.discountType === 'fixed'
                          ? `₹${member.discount}`
                          : `${member.discount}%`}{' '}
                        OFF (Min: ₹{member.minSpend})
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
  );
};

export default Customer;
