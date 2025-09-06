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
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilReload } from '@coreui/icons';
import { useMediaQuery } from '@mui/material';
import Select from 'react-select';

const Dues = () => {
  const dispatch = useDispatch();
  const { dues, loading, error } = useSelector((state) => state.dues);
  const { customers, loading: customersLoading, error: customersError } = useSelector((state) => state.customers);
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  
  console.log("Dues-->", dues);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    transaction_id: '',
    total: '',
    status: 'unpaid',
  });
  const [selectedDue, setSelectedDue] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Utility functions for consistent ID handling
  const getCustomerId = useCallback((customer) => customer?.id || customer?._id, []);
  const getDueId = useCallback((due) => due?.due_details?.id || due?.due_details?._id, []);
  const getCustomerName = useCallback((customer) => customer?.name || customer?.customerName, []);

  // Fetch data function with error handling
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    
    if (!restaurantId || !token) {
      console.warn('Missing restaurantId or token');
      return;
    }

    try {
      // Fetch dues with error handling
      await dispatch(fetchDues({ token })).unwrap();
    } catch (error) {
      console.error('Failed to fetch dues:', error);
      toast.error('Failed to load dues data');
    }

    try {
      // Fetch customers with error handling
      await dispatch(fetchCustomers({ restaurantId,token })).unwrap();
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers data');
    }
  }, [dispatch, restaurantId]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual refresh function
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
      transaction_id: '',
      total: '',
      status: 'unpaid',
    });
  };

  const closeModals = () => {
    setModalVisible(false);
    setEditModalVisible(false);
    setDeleteModalVisible(false);
    setSelectedDue(null);
    resetForm();
  };

  // Validation function
  const validateForm = () => {
    if (!formData.transaction_id || !formData.total) {
      toast.error("Please fill out all required fields.");
      return false;
    }

    if (parseFloat(formData.total) <= 0) {
      toast.error("Total amount must be greater than 0.");
      return false;
    }

    return true;
  };

  // Add due handler
  const handleSaveDue = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setFormLoading(true);
    
    try {
      const payload = {
        ...formData,
        restaurantId,
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
    if (!validateForm()) return;

    console.log('Update form data:', formData);
    console.log('Selected due:', selectedDue);

    setFormLoading(true);

    try {
      const payload = {
        id: getDueId(selectedDue),
        transaction_id: formData.transaction_id,
        total: parseFloat(formData.total),
        status: formData.status,
        restaurantId,
      };

      console.log('Update payload being sent:', payload);

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
    const customerId = dueRow?.due_details?.customer_id;
    setFormData({
      transaction_id: customerId || '',
      total: dueRow?.due_details?.total?.toString() || '',
      status: dueRow?.due_details?.status || 'unpaid',
    });
    setEditModalVisible(true);
  };

  // Delete handler
  const handleDelete = (dueRow) => {
    setSelectedDue(dueRow);
    setDeleteModalVisible(true);
  };

  // Customer options for select
  const customerOptions = customers?.map((customer) => ({
    value: getCustomerId(customer),
    label: getCustomerName(customer),
  })) || [];

  // Get selected customer for form
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

  // Add Due Modal
  const renderAddDueModal = () => (
    <CModal visible={modalVisible} onClose={closeModals}>
      <CModalHeader>
        <CModalTitle>Add Due</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSaveDue}>
             <div className="mb-3">
          <label htmlFor="transaction_id">Customer</label>
          <Select
            options={customers?.map((customer) => ({
              value: customer.id || customer._id,
              label: customer.name || customer.customerName,
            }))}
            onChange={(selectedOption) =>
              setFormData({ ...formData, transaction_id: selectedOption?.value || '' })
            }
            value={customers?.find(c => (c.id || c._id) === formData.transaction_id) ?
              { value: formData.transaction_id, label: customers.find(c => (c.id || c._id) === formData.transaction_id)?.name || customers.find(c => (c.id || c._id) === formData.transaction_id)?.customerName } : null}
            placeholder="Search or select a customer"
            isLoading={customersLoading}
            isClearable
            isSearchable
            className="basic-single"
            classNamePrefix="select"
            required
          />
        </div>
          <div className="mb-3">
            <label htmlFor="total">Total Amount *</label>
            <CFormInput
              type="number"
              step="0.01"
              min="0.01"
              id="total"
              name="total"
              value={formData.total}
              onChange={handleChange}
              placeholder="Enter amount"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="status">Status *</label>
            <Select
              options={statusOptions}
              onChange={(selectedOption) =>
                setFormData(prev => ({ ...prev, status: selectedOption?.value || 'unpaid' }))
              }
              value={statusOptions.find(option => option.value === formData.status)}
              placeholder="Select status"
              className="basic-single"
              classNamePrefix="select"
              required
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={closeModals} disabled={formLoading}>
          Cancel
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleSaveDue} 
          disabled={formLoading || !formData.transaction_id || !formData.total}
        >
          {formLoading ? <><CSpinner size="sm" /> Saving...</> : 'Save Due'}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Edit Due Modal
  const renderEditDueModal = () => (
    <CModal visible={editModalVisible} onClose={closeModals}>
      <CModalHeader>
        <CModalTitle>Edit Due</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <label htmlFor="transaction_id">Customer *</label>
          <Select
            options={customerOptions}
            onChange={(selectedOption) =>
              setFormData(prev => ({ ...prev, transaction_id: selectedOption?.value || '' }))
            }
            value={getSelectedCustomer(formData.transaction_id)}
            placeholder="Search or select a customer"
            isLoading={customersLoading}
            isClearable
            isSearchable
            className="basic-single"
            classNamePrefix="select"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="total">Total Amount *</label>
          <CFormInput
            type="number"
            step="0.01"
            min="0.01"
            name="total"
            value={formData.total}
            onChange={handleChange}
            placeholder="Enter amount"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="status">Status *</label>
          <Select
            options={statusOptions}
            onChange={(selectedOption) =>
              setFormData(prev => ({ ...prev, status: selectedOption?.value || 'unpaid' }))
            }
            value={statusOptions.find(option => option.value === formData.status)}
            placeholder="Select status"
            className="basic-single"
            classNamePrefix="select"
            required
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={closeModals} disabled={formLoading}>
          Cancel
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleUpdateDue} 
          disabled={formLoading || !formData.transaction_id || !formData.total}
        >
          {formLoading ? <><CSpinner size="sm" /> Saving...</> : 'Update Due'}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Delete Confirmation Modal
  const renderDeleteDueModal = () => {
    const customerName = selectedDue?.due_details?.customerName || 
                        selectedDue?.transaction_details?.original?.[0]?.userName || 
                        'Unknown Customer';
    
    return (
      <CModal visible={deleteModalVisible} onClose={closeModals}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Are you sure you want to delete this due for customer <strong>"{customerName}"</strong>?</p>
          <p className="text-muted">This action cannot be undone.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeModals} disabled={formLoading}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteDue} disabled={formLoading}>
            {formLoading ? <><CSpinner size="sm" /> Deleting...</> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    );
  };

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 80 : 100,
      valueGetter: (params) => getDueId(params.row)
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : 200,
      valueGetter: (params) => {
        return params.row?.due_details?.customerName ||
          params.row?.transaction_details?.original?.[0]?.userName ||
          'Unknown Customer';
      }
    },
    {
      field: 'total',
      headerName: 'Total Amount',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 150,
      valueGetter: (params) => params.row?.due_details?.total,
      renderCell: (params) => {
        return `₹${parseFloat(params.value || 0).toFixed(2)}`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : 120,
      valueGetter: (params) => params.row?.due_details?.status,
      renderCell: (params) => {
        const status = params.value;
        const statusColors = {
          'paid': '#28a745',
          'unpaid': '#ffc107',
        };
        return (
          <span
            style={{
              backgroundColor: statusColors[status] || '#6c757d',
              color: status === 'unpaid' ? '#000' : '#fff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}
          >
            {status || 'Unknown'}
          </span>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <CButton
            color="info"
            variant="outline"
            size="sm"
            onClick={() => handleEdit(params.row)}
            disabled={loading || formLoading}
            title="Edit Due"
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
          >
            <CIcon icon={cilTrash} size="sm" />
          </CButton>
        </div>
      ),
    },
  ];

  // Process and validate dues data
  const validatedDues = React.useMemo(() => {
    if (!dues || !Array.isArray(dues)) return [];
    
    return dues
      .filter((due) => {
        const id = getDueId(due);
        return id && due?.due_details;
      })
      .sort((a, b) => {
        const idA = getDueId(a) || 0;
        const idB = getDueId(b) || 0;
        return idB - idA; // Sort by ID descending
      });
  }, [dues, getDueId]);

  // Loading state
  const isLoading = loading || customersLoading;

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <h2>Dues Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <CButton
            color="secondary"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh Data"
          >
            <CIcon icon={cilReload} size="sm" />
            {isMobile ? '' : ' Refresh'}
          </CButton>
          <CButton
            color="primary"
            onClick={() => setModalVisible(true)}
            disabled={isLoading}
          >
            Add Due
          </CButton>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <CAlert color="danger" className="mb-3">
          <strong>Error loading dues:</strong> {error}
        </CAlert>
      )}
      
      {customersError && (
        <CAlert color="warning" className="mb-3">
          <strong>Error loading customers:</strong> {customersError}
        </CAlert>
      )}

      {/* Data Grid Container */}
      <div style={{ 
        height: 'auto', 
        width: '100%', 
        backgroundColor: 'white', 
        overflowX: 'auto',
        position: 'relative'
      }}>
        {isLoading && validatedDues.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <CSpinner />
            <p>Loading dues data...</p>
          </div>
        ) : (
          <DataGrid
            rows={validatedDues}
            columns={columns}
            getRowId={(row) => getDueId(row)}
            pagination
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
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
            autoHeight
            loading={isLoading}
            sx={{
              '& .MuiDataGrid-cell:hover': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9f9f9',
              },
              '& .MuiDataGrid-overlay': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          />
        )}
      </div>

      {/* Empty State */}
      {validatedDues.length === 0 && !isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>No dues found</p>
          <p style={{ color: '#999' }}>Click "Add Due" to create your first due record.</p>
        </div>
      )}

      {/* Modals */}
      {renderAddDueModal()}
      {renderEditDueModal()}
      {renderDeleteDueModal()}
    </div>
  );
};

export default Dues;