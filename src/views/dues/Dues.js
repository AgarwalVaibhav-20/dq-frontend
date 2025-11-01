import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "react-toastify";
import {
  fetchDues,
  addDue,
  updateDue,
  deleteDue,
} from '../../redux/slices/duesSlice';
import { fetchCustomers } from '../../redux/slices/customerSlice';
import CustomToolbar from '../../utils/CustomToolbar';
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CFormInput,
  CSpinner,
  CForm,
  CAlert,
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilReload, cilPlus, cilCheckCircle, cilWarning, cilMoney, cilSearch, cilX } from '@coreui/icons';
import { useMediaQuery } from '@mui/material';
import Select from 'react-select';

const Dues = () => {
  const dispatch = useDispatch();
  const { dues, loading, error } = useSelector((state) => state.dues);
  const { customers, loading: customersLoading, error: customersError } = useSelector((state) => state.customers);
  const restaurantId = localStorage.getItem('restaurantId');

  const isMobile = useMediaQuery('(max-width:768px)');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    customerName: '',
    total: '',
    paidAmount: '',
    status: 'unpaid',
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedDue, setSelectedDue] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Utility functions
  const getCustomerId = useCallback((customer) => customer?.id || customer?._id, []);
  const getDueId = useCallback((due) => due?.id || due?._id, []);
  const getCustomerName = useCallback((customer) => customer?.name || customer?.customerName, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('authToken');

    if (!restaurantId || !token) {
      console.warn('Missing restaurantId or token');
      return;
    }

    try {
      await dispatch(fetchDues({ token })).unwrap();
    } catch (error) {
      console.error('Failed to fetch dues:', error);
      toast.error('Failed to load dues data');
    }

    try {
      await dispatch(fetchCustomers({ restaurantId, token })).unwrap();
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers data');
    }
  }, [dispatch, restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
    toast.info('Refreshing data...');
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customerName: '',
      total: '',
      paidAmount: '',
      status: 'unpaid',
    });
    setPaymentAmount('');
  };

  const closeModals = () => {
    setModalVisible(false);
    setEditModalVisible(false);
    setPaymentModalVisible(false);
    setDeleteModalVisible(false);
    setSelectedDue(null);
    resetForm();
  };

  // Add due handler
  const handleSaveDue = async (e) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.total) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const total = parseFloat(formData.total);
    const paidAmount = parseFloat(formData.paidAmount) || 0;

    if (total <= 0) {
      toast.error("Total amount must be greater than 0.");
      return;
    }

    if (paidAmount < 0 || paidAmount > total) {
      toast.error("Paid amount must be between 0 and total amount.");
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        customer_id: formData.customer_id,
        customerName: formData.customerName,
        total,
        paidAmount,
        status: paidAmount >= total ? 'paid' : 'unpaid',
        restaurantId,
        token: localStorage.getItem('authToken'),
      };

      await dispatch(addDue(payload)).unwrap();
      toast.success("Due added successfully");
      closeModals();
    } catch (error) {
      console.error('Error adding due:', error);
      toast.error(`Error adding due: ${error.message || error}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Update due handler
  const handleUpdateDue = async () => {
    if (!formData.customer_id || !formData.total) {
      toast.error("Please fill out all required fields.");
      return;
    }

    if (parseFloat(formData.total) <= 0) {
      toast.error("Total amount must be greater than 0.");
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        id: getDueId(selectedDue),
        customer_id: formData.customer_id,
        total: parseFloat(formData.total),
        status: formData.status,
        restaurantId,
      };

      await dispatch(updateDue(payload)).unwrap();
      toast.success("Due updated successfully");
      closeModals();
    } catch (error) {
      console.error('Error updating due:', error);
      toast.error(`Error updating due: ${error.message || error}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Add payment handler
  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const payment = parseFloat(paymentAmount);
    const remaining = selectedDue?.remainingAmount || 0;

    if (payment > remaining) {
      toast.error(`Payment cannot exceed remaining amount of ₹${remaining.toFixed(2)}`);
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        id: getDueId(selectedDue),
        addPayment: payment,
      };

      await dispatch(updateDue(payload)).unwrap();
      toast.success("Payment added successfully");
      closeModals();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error(`Error adding payment: ${error.message || error}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete due handler
  const handleDeleteDue = async () => {
    if (!selectedDue) return;

    setFormLoading(true);

    try {
      const dueId = getDueId(selectedDue);
      await dispatch(deleteDue({ id: dueId })).unwrap();
      toast.success("Due deleted successfully");
      closeModals();
    } catch (error) {
      console.error('Error deleting due:', error);
      toast.error(`Error deleting due: ${error.message || error}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit handler
  const handleEdit = (dueRow) => {
    setSelectedDue(dueRow);
    const customerId = dueRow?.customer_id || dueRow?.transaction_id;
    
    setFormData({
      customer_id: customerId || '',
      customerName: dueRow?.customerName || '',
      total: dueRow?.total?.toString() || '',
      status: dueRow?.status || 'unpaid',
    });
    setEditModalVisible(true);
  };

  // Payment handler
  const handlePayment = (dueRow) => {
    setSelectedDue(dueRow);
    setPaymentAmount('');
    setPaymentModalVisible(true);
  };

  // Delete handler
  const handleDelete = (dueRow) => {
    setSelectedDue(dueRow);
    setDeleteModalVisible(true);
  };

  // Customer options
  const customerOptions = customers?.map((customer) => ({
    value: getCustomerId(customer),
    label: getCustomerName(customer),
  })) || [];

  const getSelectedCustomer = (customerId) => {
    const customer = customers?.find(c => getCustomerId(c) === customerId);
    return customer ? {
      value: getCustomerId(customer),
      label: getCustomerName(customer)
    } : null;
  };

  // Status options
  const statusOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' },
  ];

  // Custom Select Styles
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#321fdb' : '#d8dbe0',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(50, 31, 219, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#321fdb',
      },
      minHeight: '38px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#321fdb' : state.isFocused ? '#f0f0f0' : 'white',
      color: state.isSelected ? 'white' : '#333',
      '&:active': {
        backgroundColor: '#321fdb',
      },
    }),
  };

  // Add Due Modal
  const renderAddDueModal = () => (
    <CModal 
      visible={modalVisible} 
      onClose={closeModals}
      size="lg"
      backdrop="static"
    >
      <CModalHeader className="bg-primary text-white">
        <CModalTitle className="d-flex align-items-center gap-2">
          <CIcon icon={cilPlus} size="lg" />
          Add New Due
        </CModalTitle>
      </CModalHeader>
      <CModalBody className="p-4">
        <CForm onSubmit={handleSaveDue}>
          <div className="mb-4">
            <label htmlFor="customer_select" className="form-label fw-semibold">
              Customer <span className="text-danger">*</span>
            </label>
            <Select
              id="customer_select"
              options={customerOptions}
              onChange={(selectedOption) =>
                setFormData({
                  ...formData,
                  customer_id: selectedOption?.value || '',
                  customerName: selectedOption?.label || '',
                })
              }
              value={getSelectedCustomer(formData.customer_id)}
              placeholder="Search or select a customer..."
              isLoading={customersLoading}
              isClearable
              isSearchable
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "No customers found"}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="total" className="form-label fw-semibold">
              Total Amount <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">₹</span>
              <CFormInput
                type="number"
                step="0.01"
                min="0.01"
                id="total"
                name="total"
                value={formData.total}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="paidAmount" className="form-label fw-semibold">
              Paid Amount (Optional)
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">₹</span>
              <CFormInput
                type="number"
                step="0.01"
                min="0"
                id="paidAmount"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                placeholder="0.00"
                className="form-control"
              />
            </div>
            <small className="text-muted">Leave empty if no payment made yet</small>
          </div>

          {formData.total && formData.paidAmount && (
            <div className="alert alert-info">
              <strong>Remaining Balance:</strong> ₹{(parseFloat(formData.total) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)}
            </div>
          )}
        </CForm>
      </CModalBody>
      <CModalFooter className="bg-light">
        <CButton 
          color="secondary" 
          onClick={closeModals} 
          disabled={formLoading}
          variant="outline"
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={handleSaveDue}
          disabled={formLoading || !formData.customer_id || !formData.total}
          className="px-4"
        >
          {formLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <CIcon icon={cilCheckCircle} className="me-2" />
              Save Due
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Edit Due Modal
  const renderEditDueModal = () => (
    <CModal 
      visible={editModalVisible} 
      onClose={closeModals}
      size="lg"
      backdrop="static"
    >
      <CModalHeader className="bg-info text-white">
        <CModalTitle className="d-flex align-items-center gap-2">
          <CIcon icon={cilPencil} size="lg" />
          Edit Due
        </CModalTitle>
      </CModalHeader>
      <CModalBody className="p-4">
        {selectedDue && (
          <div className="alert alert-info mb-4">
            <strong>Editing due for:</strong> {selectedDue.customerName || 'Unknown Customer'}
            <br />
            <strong>Current Balance:</strong> ₹{(selectedDue.remainingAmount || 0).toFixed(2)}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="edit_customer_select" className="form-label fw-semibold">
            Customer <span className="text-danger">*</span>
          </label>
          <Select
            id="edit_customer_select"
            options={customerOptions}
            onChange={(selectedOption) =>
              setFormData(prev => ({ 
                ...prev, 
                customer_id: selectedOption?.value || '',
                customerName: selectedOption?.label || ''
              }))
            }
            value={getSelectedCustomer(formData.customer_id)}
            placeholder="Search or select a customer..."
            isLoading={customersLoading}
            isClearable
            isSearchable
            styles={customSelectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="edit_total" className="form-label fw-semibold">
            Total Amount <span className="text-danger">*</span>
          </label>
          <div className="input-group">
            <span className="input-group-text bg-light">₹</span>
            <CFormInput
              type="number"
              step="0.01"
              min="0.01"
              id="edit_total"
              name="total"
              value={formData.total}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </CModalBody>
      <CModalFooter className="bg-light">
        <CButton 
          color="secondary" 
          onClick={closeModals} 
          disabled={formLoading}
          variant="outline"
        >
          Cancel
        </CButton>
        <CButton
          color="info"
          onClick={handleUpdateDue}
          disabled={formLoading || !formData.customer_id || !formData.total}
          className="px-4 text-white"
        >
          {formLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            <>
              <CIcon icon={cilCheckCircle} className="me-2" />
              Update Due
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Add Payment Modal
  const renderPaymentModal = () => (
    <CModal 
      visible={paymentModalVisible} 
      onClose={closeModals}
      backdrop="static"
    >
      <CModalHeader className="bg-success text-white">
        <CModalTitle className="d-flex align-items-center gap-2">
          <CIcon icon={cilMoney} size="lg" />
          Add Payment
        </CModalTitle>
      </CModalHeader>
      <CModalBody className="p-4">
        {selectedDue && (
          <>
            <div className="alert alert-light border">
              <p className="mb-2"><strong>Customer:</strong> {selectedDue.customerName}</p>
              <p className="mb-2"><strong>Total Amount:</strong> ₹{(selectedDue.total || 0).toFixed(2)}</p>
              <p className="mb-2"><strong>Paid Amount:</strong> ₹{(selectedDue.paidAmount || 0).toFixed(2)}</p>
              <p className="mb-0 text-danger"><strong>Remaining Balance:</strong> ₹{(selectedDue.remainingAmount || 0).toFixed(2)}</p>
            </div>

            <div className="mb-3">
              <label htmlFor="payment_amount" className="form-label fw-semibold">
                Payment Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">₹</span>
                <CFormInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDue.remainingAmount}
                  id="payment_amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <small className="text-muted">
                Maximum: ₹{(selectedDue.remainingAmount || 0).toFixed(2)}
              </small>
            </div>

            {paymentAmount && (
              <div className="alert alert-success">
                <strong>New Remaining Balance:</strong> ₹{((selectedDue.remainingAmount || 0) - (parseFloat(paymentAmount) || 0)).toFixed(2)}
              </div>
            )}
          </>
        )}
      </CModalBody>
      <CModalFooter className="bg-light">
        <CButton 
          color="secondary" 
          onClick={closeModals} 
          disabled={formLoading}
          variant="outline"
        >
          Cancel
        </CButton>
        <CButton
          color="success"
          onClick={handleAddPayment}
          disabled={formLoading || !paymentAmount}
          className="px-4"
        >
          {formLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <CIcon icon={cilCheckCircle} className="me-2" />
              Add Payment
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Delete Modal
  const renderDeleteDueModal = () => {
    const customerName = selectedDue?.customerName || 'Unknown Customer';
    const amount = selectedDue?.total || 0;

    return (
      <CModal 
        visible={deleteModalVisible} 
        onClose={closeModals}
        backdrop="static"
      >
        <CModalHeader className="bg-danger text-white">
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilTrash} size="lg" />
            Confirm Delete
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <div className="alert alert-danger d-flex align-items-start">
            <CIcon icon={cilWarning} size="xl" className="me-3 mt-1" />
            <div>
              <h6 className="mb-2">Are you sure you want to delete this due?</h6>
              <p className="mb-1"><strong>Customer:</strong> {customerName}</p>
              <p className="mb-1"><strong>Amount:</strong> ₹{parseFloat(amount).toFixed(2)}</p>
              <p className="mb-0 text-muted mt-2"><small>⚠️ This action cannot be undone.</small></p>
            </div>
          </div>
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton 
            color="secondary" 
            onClick={closeModals} 
            disabled={formLoading}
            variant="outline"
          >
            Cancel
          </CButton>
          <CButton 
            color="danger" 
            onClick={handleDeleteDue} 
            disabled={formLoading}
            className="px-4"
          >
            {formLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <CIcon icon={cilTrash} className="me-2" />
                Delete
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    );
  };

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: 'Due ID',
      flex: isMobile ? undefined : 0.7,
      minWidth: isMobile ? 120 : 150,
      valueGetter: (params) => {
        const rawId = getDueId(params.row);
        if (rawId) {
          const shortId = rawId.slice(0, 8).toUpperCase();
          return `DUE-${shortId}`;
        }
        return 'N/A';
      },
      renderCell: (params) => (
        <CBadge color="secondary" className="px-2 py-1">
          {params.value}
        </CBadge>
      )
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: isMobile ? undefined : 1.2,
      minWidth: isMobile ? 150 : 200,
      valueGetter: (params) => params.row?.customerName || 'Unknown Customer',
      renderCell: (params) => (
        <strong>{params.value}</strong>
      )
    },
    {
      field: 'total',
      headerName: 'Total Amount',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 140,
      valueGetter: (params) => params.row.total,
      renderCell: (params) => (
        <span style={{ fontWeight: '600', color: '#2eb85c' }}>
          ₹{parseFloat(params.value || 0).toFixed(2)}
        </span>
      )
    },
    {
      field: 'paidAmount',
      headerName: 'Paid Amount',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 140,
      valueGetter: (params) => params.row.paidAmount || 0,
      renderCell: (params) => (
        <span style={{ fontWeight: '600', color: '#321fdb' }}>
          ₹{parseFloat(params.value || 0).toFixed(2)}
        </span>
      )
    },
    {
      field: 'remainingAmount',
      headerName: 'Remaining',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 140,
      valueGetter: (params) => params.row.remainingAmount || 0,
      renderCell: (params) => {
        const amount = parseFloat(params.value || 0);
        const color = amount > 0 ? '#e55353' : '#2eb85c';
        return (
          <span style={{ fontWeight: '700', color }}>
            ₹{amount.toFixed(2)}
          </span>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: isMobile ? undefined : 0.8,
      minWidth: isMobile ? 100 : 120,
      valueGetter: (params) => params.row?.status,
      renderCell: (params) => {
        const status = params.value;
        const statusConfig = {
          'paid': { color: 'success', icon: cilCheckCircle },
          'unpaid': { color: 'warning', icon: cilWarning },
        };
        const config = statusConfig[status] || { color: 'secondary', icon: cilWarning };
        
        return (
          <CBadge color={config.color} className="px-3 py-2 d-flex align-items-center gap-1">
            <CIcon icon={config.icon} size="sm" />
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
          </CBadge>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 1.2,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const hasRemaining = (params.row.remainingAmount || 0) > 0;
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {hasRemaining && (
              <CButton
                color="success"
                variant="outline"
                size="sm"
                onClick={() => handlePayment(params.row)}
                disabled={loading || formLoading}
                title="Add Payment"
                style={{ minWidth: '36px' }}
              >
                <CIcon icon={cilMoney} size="sm" />
              </CButton>
            )}
            <CButton
              color="info"
              variant="outline"
              size="sm"
              onClick={() => handleEdit(params.row)}
              disabled={loading || formLoading}
              title="Edit Due"
              style={{ minWidth: '36px' }}
            >
              <CIcon icon={cilPencil} size="sm" />
            </CButton>
            <CButton
              color="danger"
              variant="outline"
              size="sm"
              onClick={() => handleDelete(params.row)}
              disabled={loading || formLoading}
              title="Delete Due"
              style={{ minWidth: '36px' }}
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          </div>
        );
      },
    },
  ];

  // Process dues data with search filter
  const validatedDues = React.useMemo(() => {
    if (!dues || !Array.isArray(dues)) return [];

    let filteredDues = dues.filter((due) => {
      const id = getDueId(due);
      return id && due;
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredDues = filteredDues.filter((due) => {
        const customerName = (due.customerName || '').toLowerCase();
        const dueId = getDueId(due);
        const shortId = dueId ? dueId.slice(0, 8).toUpperCase() : '';
        return customerName.includes(searchLower) || shortId.includes(searchLower.toUpperCase());
      });
    }

    return filteredDues.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [dues, getDueId, searchTerm]);

  const isLoading = loading || customersLoading;

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalDues = validatedDues.length;
    const paidDues = validatedDues.filter(d => d.status === 'paid').length;
    const unpaidDues = validatedDues.filter(d => d.status === 'unpaid').length;
    const totalAmount = validatedDues.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
    const paidAmount = validatedDues.reduce((sum, d) => sum + (parseFloat(d.paidAmount) || 0), 0);
    const remainingAmount = validatedDues.reduce((sum, d) => sum + (parseFloat(d.remainingAmount) || 0), 0);

    return { totalDues, paidDues, unpaidDues, totalAmount, paidAmount, remainingAmount };
  }, [validatedDues]);

  // Mobile Card Component
  const DueCard = ({ due }) => {
    const dueId = getDueId(due);
    const shortId = dueId ? dueId.slice(0, 8).toUpperCase() : 'N/A';
    const hasRemaining = (due.remainingAmount || 0) > 0;
    
    return (
      <div className="card mb-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3">
          {/* Header with Due ID and Status */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <CBadge color="secondary" className="px-2 py-1 mb-1">
                DUE-{shortId}
              </CBadge>
              <h6 className="mb-1 fw-bold text-dark">{due.customerName || 'Unknown Customer'}</h6>
              {due.createdAt && (
                <small className="text-muted">
                  Created: {new Date(due.createdAt).toLocaleDateString()}
                </small>
              )}
            </div>
            <CBadge 
              color={due.status === 'paid' ? 'success' : 'warning'} 
              className="px-3 py-2 d-flex align-items-center gap-1"
            >
              <CIcon icon={due.status === 'paid' ? cilCheckCircle : cilWarning} size="sm" />
              {due.status ? due.status.charAt(0).toUpperCase() + due.status.slice(1) : 'Unknown'}
            </CBadge>
          </div>

          {/* Amount Details */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="text-center p-2 bg-light rounded">
                <small className="text-muted d-block">Total Amount</small>
                <strong className="text-success">₹{parseFloat(due.total || 0).toFixed(2)}</strong>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center p-2 bg-light rounded">
                <small className="text-muted d-block">Paid Amount</small>
                <strong className="text-primary">₹{parseFloat(due.paidAmount || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="text-center mb-3">
            <div className="p-2 rounded" style={{ 
              backgroundColor: (due.remainingAmount || 0) > 0 ? '#fff3cd' : '#d1edff',
              border: `1px solid ${(due.remainingAmount || 0) > 0 ? '#ffeaa7' : '#bee5eb'}`
            }}>
              <small className="text-muted d-block">Remaining Balance</small>
              <strong 
                className={`${(due.remainingAmount || 0) > 0 ? 'text-danger' : 'text-success'}`}
                style={{ fontSize: '1.1rem' }}
              >
                ₹{parseFloat(due.remainingAmount || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 justify-content-center">
            {hasRemaining && (
              <CButton
                color="success"
                variant="outline"
                size="sm"
                onClick={() => handlePayment(due)}
                disabled={loading || formLoading}
                className="flex-fill"
              >
                <CIcon icon={cilMoney} size="sm" className="me-1" />
                Payment
              </CButton>
            )}
            <CButton
              color="info"
              variant="outline"
              size="sm"
              onClick={() => handleEdit(due)}
              disabled={loading || formLoading}
              className="flex-fill"
            >
              <CIcon icon={cilPencil} size="sm" className="me-1" />
              Edit
            </CButton>
            <CButton
              color="danger"
              variant="outline"
              size="sm"
              onClick={() => handleDelete(due)}
              disabled={loading || formLoading}
              className="flex-fill"
            >
              <CIcon icon={cilTrash} size="sm" className="me-1" />
              Delete
            </CButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 120px)', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '0 1rem'
    }}>
      <div className="due-header-flex" style={{marginBottom: 12, flexShrink: 0}}>
        <h2 style={{ margin: 0, marginBottom: 8 }} className="text-center mb-2">Dues Management</h2>
        <div className="header-btns" style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          marginBottom: 12
        }}>
          <CButton
            color="primary"
            onClick={() => setModalVisible(true)}
            style={{
              fontWeight: '600',
              width: '180px',
              maxWidth: '100%'
            }}
          >
            + Add Due
          </CButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-2 mb-3" style={{ flexShrink: 0 }}>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #321fdb' }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Dues</h6>
              <h3 className="mb-0">{stats.totalDues}</h3>
              <small className="text-muted">₹{stats.totalAmount.toFixed(2)}</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #2eb85c' }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Paid</h6>
              <h3 className="mb-0 text-success">₹{stats.paidAmount.toFixed(2)}</h3>
              <small className="text-muted">{stats.paidDues} completed</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #e55353' }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Remaining</h6>
              <h3 className="mb-0 text-danger">₹{stats.remainingAmount.toFixed(2)}</h3>
              <small className="text-muted">{stats.unpaidDues} pending</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #f9b115' }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Collection Rate</h6>
              <h3 className="mb-0 text-warning">
                {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
              </h3>
              <small className="text-muted">of total amount</small>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {customersError && (
        <CAlert color="warning" className="mb-3 d-flex align-items-center">
          <CIcon icon={cilWarning} className="me-2" />
          <strong>Warning:</strong> {customersError}
        </CAlert>
      )}

      {/* Data Grid / Mobile Cards */}
      <div className="card border-0 shadow-sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div className="card-body p-0" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {isLoading && validatedDues.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '300px',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <CSpinner color="primary" />
              <p className="text-muted">Loading dues data...</p>
            </div>
          ) : isMobile ? (
            // Mobile Cards View
            <div className="p-3" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {/* Mobile Search Bar */}
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <CIcon icon={cilSearch} size="sm" />
                  </span>
                  <CFormInput
                    type="text"
                    placeholder="Search by customer name or due ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                  />
                  {searchTerm && (
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => setSearchTerm('')}
                      title="Clear search"
                    >
                      <CIcon icon={cilX} size="sm" />
                    </CButton>
                  )}
                </div>
                {searchTerm && (
                  <small className="text-muted">
                    Found {validatedDues.length} result(s) for "{searchTerm}"
                  </small>
                )}
              </div>

              {validatedDues.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {searchTerm ? '🔍' : '📋'}
                  </div>
                  <h5 className="text-muted">
                    {searchTerm ? 'No dues found' : 'No dues found'}
                  </h5>
                  <p className="text-muted">
                    {searchTerm 
                      ? `No dues match "${searchTerm}". Try a different search term.`
                      : 'Start by adding your first due record'
                    }
                  </p>
                  {!searchTerm && (
                    <CButton
                      color="primary"
                      onClick={() => setModalVisible(true)}
                      className="mt-2"
                    >
                      <CIcon icon={cilPlus} className="me-2" />
                      Add Your First Due
                    </CButton>
                  )}
                </div>
              ) : (
                validatedDues.map((due) => (
                  <DueCard key={getDueId(due)} due={due} />
                ))
              )}
            </div>
          ) : (
            // Desktop DataGrid View
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <DataGrid
                style={{ width: '100%', height: '100%' }}
                rows={validatedDues}
                columns={columns}
                getRowId={(row) => getDueId(row)}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                slots={{
                  toolbar: CustomToolbar,
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                disableSelectionOnClick
                loading={isLoading}
                sx={{
                  border: 'none',
                  height: '100%',
                  '& .MuiDataGrid-cell:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f9f9f9',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                  },
                  '& .MuiDataGrid-root': {
                    height: '100%',
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Empty State - Only show on desktop when not in mobile cards view */}
      {validatedDues.length === 0 && !isLoading && !isMobile && (
        <div className="card border-0 shadow-sm mt-3" style={{ flexShrink: 0 }}>
          <div className="card-body text-center p-5">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h4 className="mb-3">No Dues Found</h4>
            <p className="text-muted mb-4">
              You haven't added any dues yet. Get started by adding your first due record.
            </p>
            <CButton
              color="primary"
              onClick={() => setModalVisible(true)}
              className="px-4"
            >
              <CIcon icon={cilPlus} className="me-2" />
              Add Your First Due
            </CButton>
          </div>
        </div>
      )}

      {/* Modals */}
      {renderAddDueModal()}
      {renderEditDueModal()}
      {renderPaymentModal()}
      {renderDeleteDueModal()}
    </div>
  );
};

export default Dues;

// import React, { useState, useEffect, useCallback } from 'react';
// import { DataGrid } from '@mui/x-data-grid';
// import { useDispatch, useSelector } from 'react-redux';
// import { toast } from "react-toastify";
// import {
//   fetchDues,
//   addDue,
//   updateDue,
//   deleteDue,
// } from '../../redux/slices/duesSlice';
// import { fetchCustomers } from '../../redux/slices/customerSlice';
// import CustomToolbar from '../../utils/CustomToolbar';
// import {
//   CButton,
//   CModal,
//   CModalBody,
//   CModalFooter,
//   CModalHeader,
//   CModalTitle,
//   CFormInput,
//   CSpinner,
//   CForm,
//   CAlert,
//   CBadge
// } from '@coreui/react';
// import CIcon from '@coreui/icons-react';
// import { cilPencil, cilTrash, cilReload, cilPlus, cilCheckCircle, cilWarning } from '@coreui/icons';
// import { useMediaQuery } from '@mui/material';
// import Select from 'react-select';

// const Dues = () => {
//   const dispatch = useDispatch();
//   const { dues, loading, error } = useSelector((state) => state.dues);
//   const { customers, loading: customersLoading, error: customersError } = useSelector((state) => state.customers);
//   const restaurantId = useSelector((state) => state.auth.restaurantId);

//   const isMobile = useMediaQuery('(max-width:768px)');

//   // Modal states
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [deleteModalVisible, setDeleteModalVisible] = useState(false);

//   // Form state
//   const [formData, setFormData] = useState({
//     customer_id: '',
//     customerName: '',
//     total: '',
//     status: 'unpaid',
//   });
//   const [selectedDue, setSelectedDue] = useState(null);
//   const [formLoading, setFormLoading] = useState(false);

//   // Utility functions for consistent ID handling
//   const getCustomerId = useCallback((customer) => customer?.id || customer?._id, []);
//   const getDueId = useCallback((due) => due?.id || due?._id, []);
//   const getCustomerName = useCallback((customer) => customer?.name || customer?.customerName, []);

//   // Fetch data function with error handling
//   const fetchData = useCallback(async () => {
//     const token = localStorage.getItem('authToken');

//     if (!restaurantId || !token) {
//       console.warn('Missing restaurantId or token');
//       return;
//     }

//     try {
//       await dispatch(fetchDues({ token })).unwrap();
//     } catch (error) {
//       console.error('Failed to fetch dues:', error);
//       toast.error('Failed to load dues data');
//     }

//     try {
//       await dispatch(fetchCustomers({ restaurantId, token })).unwrap();
//     } catch (error) {
//       console.error('Failed to fetch customers:', error);
//       toast.error('Failed to load customers data');
//     }
//   }, [dispatch, restaurantId]);

//   // Initial data fetch
//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   // Manual refresh function
//   const handleRefresh = () => {
//     fetchData();
//     toast.info('Refreshing data...');
//   };

//   // Form handlers
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const resetForm = () => {
//     setFormData({
//       customer_id: '',
//       customerName: '',
//       total: '',
//       status: 'unpaid',
//     });
//   };

//   const closeModals = () => {
//     setModalVisible(false);
//     setEditModalVisible(false);
//     setDeleteModalVisible(false);
//     setSelectedDue(null);
//     resetForm();
//   };

//   // Add due handler
//   const handleSaveDue = async (e) => {
//     e.preventDefault();

//     if (!formData.customer_id || !formData.total) {
//       toast.error("Please fill out all required fields.");
//       return;
//     }

//     if (parseFloat(formData.total) <= 0) {
//       toast.error("Total amount must be greater than 0.");
//       return;
//     }

//     setFormLoading(true);

//     try {
//       const payload = {
//         customer_id: formData.customer_id,
//         customerName: formData.customerName,
//         total: parseFloat(formData.total),
//         status: formData.status,
//         restaurantId,
//         token: localStorage.getItem('authToken'),
//       };

//       await dispatch(addDue(payload)).unwrap();
//       toast.success("Due added successfully");
//       closeModals();
//     } catch (error) {
//       console.error('Error adding due:', error);
//       toast.error(`Error adding due: ${error.message || error}`);
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Update due handler - FIXED to show customer name
//   const handleUpdateDue = async () => {
//     if (!formData.customer_id || !formData.total) {
//       toast.error("Please fill out all required fields.");
//       return;
//     }

//     if (parseFloat(formData.total) <= 0) {
//       toast.error("Total amount must be greater than 0.");
//       return;
//     }

//     setFormLoading(true);

//     try {
//       const payload = {
//         id: getDueId(selectedDue),
//         customer_id: formData.customer_id,
//         total: parseFloat(formData.total),
//         status: formData.status,
//         restaurantId,
//         token: localStorage.getItem('authToken'),
//       };

//       await dispatch(updateDue(payload)).unwrap();
//       toast.success("Due updated successfully");
//       closeModals();
//     } catch (error) {
//       console.error('Error updating due:', error);
//       toast.error(`Error updating due: ${error.message || error}`);
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Delete due handler
//   const handleDeleteDue = async () => {
//     if (!selectedDue) return;

//     setFormLoading(true);

//     try {
//       const dueId = getDueId(selectedDue);
//       await dispatch(deleteDue({ id: dueId })).unwrap();
//       toast.success("Due deleted successfully");
//       closeModals();
//     } catch (error) {
//       console.error('Error deleting due:', error);
//       toast.error(`Error deleting due: ${error.message || error}`);
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   // Edit handler - FIXED to properly set customer_id
//   const handleEdit = (dueRow) => {
//     setSelectedDue(dueRow);
//     const customerId = dueRow?.customer_id || dueRow?.transaction_id;
    
//     setFormData({
//       customer_id: customerId || '',
//       customerName: dueRow?.customerName || '',
//       total: dueRow?.total?.toString() || '',
//       status: dueRow?.status || 'unpaid',
//     });
//     setEditModalVisible(true);
//   };

//   // Delete handler
//   const handleDelete = (dueRow) => {
//     setSelectedDue(dueRow);
//     setDeleteModalVisible(true);
//   };

//   // Customer options for select
//   const customerOptions = customers?.map((customer) => ({
//     value: getCustomerId(customer),
//     label: getCustomerName(customer),
//   })) || [];

//   // Get selected customer for form - FIXED
//   const getSelectedCustomer = (customerId) => {
//     const customer = customers?.find(c => getCustomerId(c) === customerId);
//     return customer ? {
//       value: getCustomerId(customer),
//       label: getCustomerName(customer)
//     } : null;
//   };

//   // Status options
//   const statusOptions = [
//     { value: 'unpaid', label: 'Unpaid' },
//     { value: 'paid', label: 'Paid' },
//   ];

//   // Custom Select Styles
//   const customSelectStyles = {
//     control: (base, state) => ({
//       ...base,
//       borderColor: state.isFocused ? '#321fdb' : '#d8dbe0',
//       boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(50, 31, 219, 0.25)' : 'none',
//       '&:hover': {
//         borderColor: '#321fdb',
//       },
//       minHeight: '38px',
//     }),
//     option: (base, state) => ({
//       ...base,
//       backgroundColor: state.isSelected ? '#321fdb' : state.isFocused ? '#f0f0f0' : 'white',
//       color: state.isSelected ? 'white' : '#333',
//       '&:active': {
//         backgroundColor: '#321fdb',
//       },
//     }),
//   };

//   // Add Due Modal - Enhanced UI
//   const renderAddDueModal = () => (
//     <CModal 
//       visible={modalVisible} 
//       onClose={closeModals}
//       size="lg"
//       backdrop="static"
//     >
//       <CModalHeader className="bg-primary text-white">
//         <CModalTitle className="d-flex align-items-center gap-2">
//           <CIcon icon={cilPlus} size="lg" />
//           Add New Due
//         </CModalTitle>
//       </CModalHeader>
//       <CModalBody className="p-4">
//         <CForm onSubmit={handleSaveDue}>
//           <div className="mb-4">
//             <label htmlFor="customer_select" className="form-label fw-semibold">
//               Customer <span className="text-danger">*</span>
//             </label>
//             <Select
//               id="customer_select"
//               options={customerOptions}
//               onChange={(selectedOption) =>
//                 setFormData({
//                   ...formData,
//                   customer_id: selectedOption?.value || '',
//                   customerName: selectedOption?.label || '',
//                 })
//               }
//               value={getSelectedCustomer(formData.customer_id)}
//               placeholder="🔍 Search or select a customer..."
//               isLoading={customersLoading}
//               isClearable
//               isSearchable
//               styles={customSelectStyles}
//               className="react-select-container"
//               classNamePrefix="react-select"
//               noOptionsMessage={() => "No customers found"}
//               required
//             />
//             {customersLoading && (
//               <small className="text-muted">Loading customers...</small>
//             )}
//           </div>

//           <div className="mb-4">
//             <label htmlFor="total" className="form-label fw-semibold">
//               Total Amount <span className="text-danger">*</span>
//             </label>
//             <div className="input-group">
//               <span className="input-group-text bg-light">₹</span>
//               <CFormInput
//                 type="number"
//                 step="0.01"
//                 min="0.01"
//                 id="total"
//                 name="total"
//                 value={formData.total}
//                 onChange={handleChange}
//                 placeholder="0.00"
//                 required
//                 className="form-control"
//               />
//             </div>
//             <small className="text-muted">Enter the total due amount</small>
//           </div>

//           <div className="mb-4">
//             <label htmlFor="status_select" className="form-label fw-semibold">
//               Payment Status <span className="text-danger">*</span>
//             </label>
//             <Select
//               id="status_select"
//               options={statusOptions}
//               onChange={(selectedOption) =>
//                 setFormData(prev => ({ ...prev, status: selectedOption?.value || 'unpaid' }))
//               }
//               value={statusOptions.find(option => option.value === formData.status)}
//               placeholder="Select payment status"
//               styles={customSelectStyles}
//               className="react-select-container"
//               classNamePrefix="react-select"
//               required
//             />
//           </div>
//         </CForm>
//       </CModalBody>
//       <CModalFooter className="bg-light">
//         <CButton 
//           color="secondary" 
//           onClick={closeModals} 
//           disabled={formLoading}
//           variant="outline"
//         >
//           Cancel
//         </CButton>
//         <CButton
//           color="primary"
//           onClick={handleSaveDue}
//           disabled={formLoading || !formData.customer_id || !formData.total}
//           className="px-4"
//         >
//           {formLoading ? (
//             <>
//               <CSpinner size="sm" className="me-2" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <CIcon icon={cilCheckCircle} className="me-2" />
//               Save Due
//             </>
//           )}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   );

//   // Edit Due Modal - Enhanced UI with customer name display
//   const renderEditDueModal = () => (
//     <CModal 
//       visible={editModalVisible} 
//       onClose={closeModals}
//       size="lg"
//       backdrop="static"
//     >
//       <CModalHeader className="bg-purple-400 text-white">
//         <CModalTitle className="d-flex align-items-center gap-2">
//           <CIcon icon={cilPencil} size="lg" />
//           Edit Due
//         </CModalTitle>
//       </CModalHeader>
//       <CModalBody className="p-4">
//         {selectedDue && (
//           <div className="alert alert-info mb-4 d-flex align-items-center">
//             <CIcon icon={cilWarning} className="me-2" size="lg" />
//             <div>
//               <strong>Editing due for:</strong> {selectedDue.customerName || 'Unknown Customer'}
//               <br />
//               <small className="text-muted">Due ID: DUE-{getDueId(selectedDue)?.slice(0, 8).toUpperCase()}</small>
//             </div>
//           </div>
//         )}

//         <div className="mb-4">
//           <label htmlFor="edit_customer_select" className="form-label fw-semibold">
//             Customer <span className="text-danger">*</span>
//           </label>
//           <Select
//             id="edit_customer_select"
//             options={customerOptions}
//             onChange={(selectedOption) =>
//               setFormData(prev => ({ 
//                 ...prev, 
//                 customer_id: selectedOption?.value || '',
//                 customerName: selectedOption?.label || ''
//               }))
//             }
//             value={getSelectedCustomer(formData.customer_id)}
//             placeholder="🔍 Search or select a customer..."
//             isLoading={customersLoading}
//             isClearable
//             isSearchable
//             styles={customSelectStyles}
//             className="react-select-container"
//             classNamePrefix="react-select"
//             noOptionsMessage={() => "No customers found"}
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="edit_total" className="form-label fw-semibold">
//             Total Amount <span className="text-danger">*</span>
//           </label>
//           <div className="input-group">
//             <span className="input-group-text bg-light">₹</span>
//             <CFormInput
//               type="number"
//               step="0.01"
//               min="0.01"
//               id="edit_total"
//               name="total"
//               value={formData.total}
//               onChange={handleChange}
//               placeholder="0.00"
//               required
//               className="form-control"
//             />
//           </div>
//         </div>

//         <div className="mb-4">
//           <label htmlFor="edit_status_select" className="form-label fw-semibold">
//             Payment Status <span className="text-danger">*</span>
//           </label>
//           <Select
//             id="edit_status_select"
//             options={statusOptions}
//             onChange={(selectedOption) =>
//               setFormData(prev => ({ ...prev, status: selectedOption?.value || 'unpaid' }))
//             }
//             value={statusOptions.find(option => option.value === formData.status)}
//             placeholder="Select payment status"
//             styles={customSelectStyles}
//             className="react-select-container"
//             classNamePrefix="react-select"
//             required
//           />
//         </div>
//       </CModalBody>
//       <CModalFooter className="bg-light">
//         <CButton 
//           color="secondary" 
//           onClick={closeModals} 
//           disabled={formLoading}
//           variant="outline"
//         >
//           Cancel
//         </CButton>
//         <CButton
//           color="info"
//           onClick={handleUpdateDue}
//           disabled={formLoading || !formData.customer_id || !formData.total}
//           className="px-4 text-white"
//         >
//           {formLoading ? (
//             <>
//               <CSpinner size="sm" className="me-2" />
//               Updating...
//             </>
//           ) : (
//             <>
//               <CIcon icon={cilCheckCircle} className="me-2" />
//               Update Due
//             </>
//           )}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   );

//   // Delete Confirmation Modal - Enhanced UI
//   const renderDeleteDueModal = () => {
//     const customerName = selectedDue?.customerName || 'Unknown Customer';
//     const amount = selectedDue?.total || 0;

//     return (
//       <CModal 
//         visible={deleteModalVisible} 
//         onClose={closeModals}
//         backdrop="static"
//       >
//         <CModalHeader className="bg-danger text-white">
//           <CModalTitle className="d-flex align-items-center gap-2">
//             <CIcon icon={cilTrash} size="lg" />
//             Confirm Delete
//           </CModalTitle>
//         </CModalHeader>
//         <CModalBody className="p-4">
//           <div className="alert alert-danger d-flex align-items-start">
//             <CIcon icon={cilWarning} size="xl" className="me-3 mt-1" />
//             <div>
//               <h6 className="mb-2">Are you sure you want to delete this due?</h6>
//               <p className="mb-1"><strong>Customer:</strong> {customerName}</p>
//               <p className="mb-1"><strong>Amount:</strong> ₹{parseFloat(amount).toFixed(2)}</p>
//               <p className="mb-0 text-muted mt-2"><small>⚠️ This action cannot be undone.</small></p>
//             </div>
//           </div>
//         </CModalBody>
//         <CModalFooter className="bg-light">
//           <CButton 
//             color="secondary" 
//             onClick={closeModals} 
//             disabled={formLoading}
//             variant="outline"
//           >
//             Cancel
//           </CButton>
//           <CButton 
//             color="danger" 
//             onClick={handleDeleteDue} 
//             disabled={formLoading}
//             className="px-4"
//           >
//             {formLoading ? (
//               <>
//                 <CSpinner size="sm" className="me-2" />
//                 Deleting...
//               </>
//             ) : (
//               <>
//                 <CIcon icon={cilTrash} className="me-2" />
//                 Delete
//               </>
//             )}
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     );
//   };

//   // DataGrid columns - Enhanced
//   const columns = [
//     {
//       field: 'id',
//       headerName: 'Due ID',
//       flex: isMobile ? undefined : 0.7,
//       minWidth: isMobile ? 120 : 150,
//       valueGetter: (params) => {
//         const rawId = getDueId(params.row);
//         if (rawId) {
//           const shortId = rawId.slice(0, 8).toUpperCase();
//           return `DUE-${shortId}`;
//         }
//         return 'N/A';
//       },
//       renderCell: (params) => (
//         <CBadge color="secondary" className="px-2 py-1">
//           {params.value}
//         </CBadge>
//       )
//     },
//     {
//       field: 'customerName',
//       headerName: 'Customer Name',
//       flex: isMobile ? undefined : 1.2,
//       minWidth: isMobile ? 150 : 200,
//       valueGetter: (params) => params.row?.customerName || 'Unknown Customer',
//       renderCell: (params) => (
//         <strong>{params.value}</strong>
//       )
//     },
//     {
//       field: 'total',
//       headerName: 'Total Amount',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 120 : 150,
//       valueGetter: (params) => params.row.total,
//       renderCell: (params) => (
//         <span style={{ fontWeight: '600', color: '#2eb85c' }}>
//           ₹{parseFloat(params.value || 0).toFixed(2)}
//         </span>
//       )
//     },
//     {
//       field: 'status',
//       headerName: 'Status',
//       flex: isMobile ? undefined : 1,
//       minWidth: isMobile ? 100 : 120,
//       valueGetter: (params) => params.row?.status,
//       renderCell: (params) => {
//         const status = params.value;
//         const statusConfig = {
//           'paid': { color: 'success', icon: cilCheckCircle },
//           'unpaid': { color: 'warning', icon: cilWarning },
//         };
//         const config = statusConfig[status] || { color: 'secondary', icon: cilWarning };
        
//         return (
//           <CBadge color={config.color} className="px-3 py-2 d-flex align-items-center gap-1">
//             <CIcon icon={config.icon} size="sm" />
//             {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
//           </CBadge>
//         );
//       }
//     },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       flex: isMobile ? undefined : 1,
//       minWidth: 130,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <div style={{ display: 'flex', gap: '8px' }}>
//           <CButton
//             color="info"
//             variant="outline"
//             size="sm"
//             onClick={() => handleEdit(params.row)}
//             disabled={loading || formLoading}
//             title="Edit Due"
//             style={{ minWidth: '36px' }}
//           >
//             <CIcon icon={cilPencil} size="sm" />
//           </CButton>
//           <CButton
//             color="danger"
//             variant="outline"
//             size="sm"
//             onClick={() => handleDelete(params.row)}
//             disabled={loading || formLoading}
//             title="Delete Due"
//             style={{ minWidth: '36px' }}
//           >
//             <CIcon icon={cilTrash} size="sm" />
//           </CButton>
//         </div>
//       ),
//     },
//   ];

//   // Process and validate dues data
//   const validatedDues = React.useMemo(() => {
//     if (!dues || !Array.isArray(dues)) return [];

//     return dues
//       .filter((due) => {
//         const id = getDueId(due);
//         return id && due;
//       })
//       .sort((a, b) => {
//         const dateA = new Date(a.createdAt || 0).getTime();
//         const dateB = new Date(b.createdAt || 0).getTime();
//         return dateB - dateA;
//       });
//   }, [dues, getDueId]);

//   // Loading state
//   const isLoading = loading || customersLoading;

//   // Calculate statistics
//   const stats = React.useMemo(() => {
//     const totalDues = validatedDues.length;
//     const paidDues = validatedDues.filter(d => d.status === 'paid').length;
//     const unpaidDues = validatedDues.filter(d => d.status === 'unpaid').length;
//     const totalAmount = validatedDues.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
//     const paidAmount = validatedDues.filter(d => d.status === 'paid').reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
//     const unpaidAmount = validatedDues.filter(d => d.status === 'unpaid').reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);

//     return { totalDues, paidDues, unpaidDues, totalAmount, paidAmount, unpaidAmount };
//   }, [validatedDues]);

//   return (
//     <div style={{ padding: '20px', minHeight: '100vh' }}>
//       {/* Header with gradient */}
//       <div
//       >
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: '16px',
//           }}
//         >
//           <div>
//             <h2 style={{margin: 0, marginBottom: '8px' }}>
//               💰 Dues Management
//             </h2>
//           </div>
//           <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
//             <CButton
//               color="dark"
//               variant="outline"
//               onClick={handleRefresh}
//               disabled={isLoading}
//               title="Refresh Data"
//               className="d-flex align-items-center gap-2"
//             >
//               <CIcon icon={cilReload} size="sm" />
//               {!isMobile && 'Refresh'}
//             </CButton>
//             <CButton
//               color="dark"
//               onClick={() => setModalVisible(true)}
//               disabled={isLoading}
//               className="d-flex align-items-center gap-2"
//               style={{ fontWeight: '600' }}
//             >
//               <CIcon icon={cilPlus} size="sm" />
//               Add Due
//             </CButton>
//           </div>
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       {/* <div className="row g-3 mb-4">
//         <div className="col-12 col-md-6 col-lg-3">
//           <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #321fdb' }}>
//             <div className="card-body">
//               <h6 className="text-muted mb-2">Total Dues</h6>
//               <h3 className="mb-0">{stats.totalDues}</h3>
//               <small className="text-muted">₹{stats.totalAmount.toFixed(2)}</small>
//             </div>
//           </div>
//         </div>
//         <div className="col-12 col-md-6 col-lg-3">
//           <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #2eb85c' }}>
//             <div className="card-body">
//               <h6 className="text-muted mb-2">Paid</h6>
//               <h3 className="mb-0 text-success">{stats.paidDues}</h3>
//               <small className="text-muted">₹{stats.paidAmount.toFixed(2)}</small>
//             </div>
//           </div>
//         </div>
//         <div className="col-12 col-md-6 col-lg-3">
//           <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #f9b115' }}>
//             <div className="card-body">
//               <h6 className="text-muted mb-2">Unpaid</h6>
//               <h3 className="mb-0 text-warning">{stats.unpaidDues}</h3>
//               <small className="text-muted">₹{stats.unpaidAmount.toFixed(2)}</small>
//             </div>
//           </div>
//         </div>
//         <div className="col-12 col-md-6 col-lg-3">
//           <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #e55353' }}>
//             <div className="card-body">
//               <h6 className="text-muted mb-2">Outstanding</h6>
//               <h3 className="mb-0 text-danger">₹{stats.unpaidAmount.toFixed(2)}</h3>
//               <small className="text-muted">{stats.unpaidDues} pending</small>
//             </div>
//           </div>
//         </div>
//       </div> */}

//       {/* Error Messages */}
//       {customersError && (
//         <CAlert color="warning" className="mb-3 d-flex align-items-center">
//           <CIcon icon={cilWarning} className="me-2" />
//           <strong>Warning:</strong> {customersError}
//         </CAlert>
//       )}

//       {/* Data Grid Container */}
//       <div className="card border-0 shadow-sm">
//         <div className="card-body p-0">
//           {isLoading && validatedDues.length === 0 ? (
//             <div
//               style={{
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 height: '400px',
//                 flexDirection: 'column',
//                 gap: '16px',
//               }}
//             >
//               <CSpinner color="primary" />
//               <p className="text-muted">Loading dues data...</p>
//             </div>
//           ) : (
//             <DataGrid
//               rows={validatedDues}
//               columns={columns}
//               getRowId={(row) => getDueId(row)}
//               initialState={{
//                 pagination: {
//                   paginationModel: { pageSize: 10 },
//                 },
//               }}
//               pageSizeOptions={[5, 10, 20, 50]}
//               slots={{
//                 toolbar: CustomToolbar,
//               }}
//               slotProps={{
//                 toolbar: {
//                   showQuickFilter: true,
//                   quickFilterProps: { debounceMs: 500 },
//                 },
//               }}
//               disableSelectionOnClick
//               autoHeight
//               loading={isLoading}
//               sx={{
//                 border: 'none',
//                 '& .MuiDataGrid-cell:hover': {
//                   backgroundColor: '#f5f5f5',
//                 },
//                 '& .MuiDataGrid-row:hover': {
//                   backgroundColor: '#f9f9f9',
//                 },
//                 '& .MuiDataGrid-columnHeaders': {
//                   backgroundColor: '#f8f9fa',
//                   fontWeight: 'bold',
//                 },
//               }}
//             />
//           )}
//         </div>
//       </div>

//       {/* Empty State */}
//       {validatedDues.length === 0 && !isLoading && (
//         <div className="card border-0 shadow-sm mt-4">
//           <div className="card-body text-center p-5">
//             <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
//             <h4 className="mb-3">No Dues Found</h4>
//             <p className="text-muted mb-4">
//               You haven't added any dues yet. Get started by adding your first due record.
//             </p>
//             <CButton
//               color="primary"
//               onClick={() => setModalVisible(true)}
//               className="px-4"
//             >
//               <CIcon icon={cilPlus} className="me-2" />
//               Add Your First Due
//             </CButton>
//           </div>
//         </div>
//       )}

//       {/* Modals */}
//       {renderAddDueModal()}
//       {renderEditDueModal()}
//       {renderDeleteDueModal()}
//     </div>
//   );
// };

// export default Dues;