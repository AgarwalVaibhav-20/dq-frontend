import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReservations,
  addReservation,
  updateReservation,
  deleteReservation,
} from '../../redux/slices/reservationSlice';
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
  CFormLabel
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilPlus, cilHistory } from '@coreui/icons';
import { useMediaQuery } from '@mui/material';
import Select from 'react-select';

const Reservation = () => {
  const dispatch = useDispatch();
  const { reservations, loading, error } = useSelector((state) => state.reservations);
  const { customers, loading: customerLoading } = useSelector((state) => state.customers);
  const restaurantId = localStorage.getItem('restaurantId');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    customerId: '',
    customerName: '',
    payment: '',
    advance: '',
    notes: '',
    tableNumber: '',
  });

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    console.log("RestaurantId from localStorage:", restaurantId);

    // Use the restaurantId from your MongoDB data - override localStorage for testing
    const actualRestaurantId = "68c80294c2283cb53671cde9";

    console.log("🔍 Using restaurantId for API call:", actualRestaurantId);
    console.log("🔍 API URL will be:", `http://localhost:4000/AllByRestaurantId/${actualRestaurantId}`);

    if (actualRestaurantId) {
      console.log("📡 Fetching reservations with restaurantId:", actualRestaurantId);
      dispatch(fetchReservations({ restaurantId: actualRestaurantId }));
      // Fetch ALL customers for reservation dropdown (not filtered by restaurantId)
      dispatch(fetchCustomers({}));
    } else {
      console.error("No restaurantId found!");
    }
  }, [dispatch, restaurantId]);

  // Debug logging for data changes
  useEffect(() => {
    console.log("Reservations data:", reservations);
    console.log("Loading state:", loading);
    console.log("Customers data:", customers);
    console.log("Error state:", error);

    if (reservations && reservations.length > 0) {
      console.log("First reservation structure:", reservations[0]);
      console.log("Available keys in first reservation:", Object.keys(reservations[0]));
    }
  }, [reservations, loading, customers, error]);

  // Generic form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Special handler for customer select dropdown
  const handleCustomerChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption?.value || '',
      customerName: selectedOption?.label || ''
    }));

    if (formErrors.customerId) {
      setFormErrors(prev => ({ ...prev, customerId: '' }));
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors = {};

    // Required field validations
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (!formData.customerId) {
      errors.customerId = 'Customer selection is required';
    }

    // Business logic validations
    if (!formData.payment || formData.payment <= 0) {
      errors.payment = 'Valid payment amount is required';
    }

    if (formData.advance && parseFloat(formData.advance) > parseFloat(formData.payment)) {
      errors.advance = 'Advance cannot be greater than total payment';
    }

    // Date/time validation
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (startTime >= endTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      startTime: '',
      endTime: '',
      customerId: '',
      customerName: '',
      payment: '',
      advance: '',
      notes: '',
      tableNumber: '',
    });
    setFormErrors({});
  };

  // Create new reservation
  const handleSaveReservation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      const actualRestaurantId = restaurantId || "68c80294c2283cb53671cde9";
      const payload = {
        ...formData,
        restaurantId: actualRestaurantId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        payment: parseFloat(formData.payment),
        advance: parseFloat(formData.advance) || 0,
      };

      await dispatch(addReservation(payload)).unwrap();
      await dispatch(fetchReservations({ restaurantId: actualRestaurantId }));

      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving reservation:', error);
      setFormErrors({ general: error.message || 'Failed to save reservation' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update existing reservation
  const handleUpdateReservation = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      const actualRestaurantId = restaurantId || "68c80294c2283cb53671cde9";
      const payload = {
        id: selectedReservation?._id,
        ...formData,
        restaurantId: actualRestaurantId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        payment: parseFloat(formData.payment),
        advance: parseFloat(formData.advance) || 0,
      };

      await dispatch(updateReservation(payload)).unwrap();
      await dispatch(fetchReservations({ restaurantId: actualRestaurantId }));

      resetForm();
      setEditModalVisible(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error updating reservation:', error);
      setFormErrors({ general: error.message || 'Failed to update reservation' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete reservation
  const handleDeleteReservation = async () => {
    setSubmitLoading(true);

    try {
      const actualRestaurantId = restaurantId || "68c80294c2283cb53671cde9";
      const id = selectedReservation?._id;
      await dispatch(deleteReservation({ id })).unwrap();
      await dispatch(fetchReservations({ restaurantId: actualRestaurantId }));

      setDeleteModalVisible(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Utility function to format time for input fields
  function formatTimeForInput(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Utility function to format datetime for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      return new Date(dateTime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format datetime for datetime-local input
  const formatDateTimeForInput = (dateTime) => {
    if (!dateTime) return '';
    try {
      const date = new Date(dateTime);
      return date.toISOString().slice(0, 16);
    } catch (error) {
      return '';
    }
  };

  // Get reservation ID from data structure
  const getReservationId = (row) => {
    return row?._id || row?.id;
  };

  // Get customer information from data structure
  const getCustomerInfo = (row, field) => {
    return row[field] || 'N/A';
  };

  // DataGrid column definitions
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 150 : 200,
      valueGetter: (params) => getReservationId(params.row),
      renderCell: (params) => (
        <span title={params.value}>{params.value}</span>
      ),
    }
    ,
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerName')
    },
    {
      field: 'customerPhoneNumber',
      headerName: 'Mobile No.',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : undefined,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerPhoneNumber')
    },
    {
      field: 'customerAddress',
      headerName: 'Address',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerAddress')
    },
    {
      field: 'startTime',
      headerName: 'Start Time',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      valueGetter: (params) => {
        return formatDateTime(params.row?.startTime);
      }
    },
    {
      field: 'endTime',
      headerName: 'End Time',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      valueGetter: (params) => {
        return formatDateTime(params.row?.endTime);
      }
    },
    {
      field: 'payment',
      headerName: 'Payment',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 100 : undefined,
      valueGetter: (params) => {
        return params.row?.payment ? `₹${params.row.payment}` : 'N/A';
      }
    },
    {
      field: 'advance',
      headerName: 'Advance',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 100 : undefined,
      valueGetter: (params) => {
        return params.row?.advance ? `₹${params.row.advance}` : 'N/A';
      }
    },
    {
      field: 'tableNumber',
      headerName: 'Table No.',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 80 : undefined,
      valueGetter: (params) => {
        return params.row?.tableNumber || 'N/A';
      }
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      valueGetter: (params) => {
        return params.row?.notes || 'N/A';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 0.8,
      minWidth: isMobile ? 120 : undefined,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <CButton
            color="info"
            size="sm"
            onClick={() => {
              const row = params.row;
              setSelectedReservation(row);

              setFormData({
                startTime: formatDateTimeForInput(row.startTime),
                endTime: formatDateTimeForInput(row.endTime),
                customerId: row.customerId || "",
                customerName: row.customerName || "",
                payment: row.payment || "",
                advance: row.advance || "",
                notes: row.notes || "",
                tableNumber: row.tableNumber || "",
              });

              setEditModalVisible(true);
            }}
            title="Edit Reservation"
          >
            <CIcon icon={cilPencil} />
          </CButton>
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedReservation(params.row);
              setDeleteModalVisible(true);
            }}
            title="Delete Reservation"
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
    },
  ];

  // History columns (read-only, no actions)
  const historyColumns = columns.filter(col => col.field !== 'actions');

  // Process reservations data - split into future and past
  const { futureReservations, pastReservations } = React.useMemo(() => {
    if (!Array.isArray(reservations)) {
      console.warn('Reservations is not an array:', reservations);
      return { futureReservations: [], pastReservations: [] };
    }

    const now = new Date();
    const future = [];
    const past = [];

    reservations.forEach(reservation => {
      const hasValidId = getReservationId(reservation);
      if (!hasValidId) return;

      const endTime = new Date(reservation.endTime);

      if (endTime >= now) {
        future.push(reservation);
      } else {
        past.push(reservation);
      }
    });

    // Sort future reservations (upcoming first)
    future.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Sort past reservations (most recent first)
    past.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

    return { futureReservations: future, pastReservations: past };
  }, [reservations]);

  // Get customer options for Select dropdown
  const customerOptions = React.useMemo(() => {
    if (!Array.isArray(customers)) return [];

    return customers.map(customer => ({
      value: customer._id || customer.id,
      label: customer.name,
      phoneNumber: customer.phoneNumber,
      address: customer.address
    }));
  }, [customers]);

  // Reusable form field component
  const FormField = ({
    label,
    name,
    type = 'text',
    required = false,
    placeholder = '',
    ...props
  }) => (
    <div className="mb-3">
      <CFormLabel htmlFor={name}>
        {label} {required && <span className="text-danger">*</span>}
      </CFormLabel>
      <CFormInput
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        invalid={!!formErrors[name]}
        {...props}
      />
      {formErrors[name] && (
        <div className="invalid-feedback d-block">
          {formErrors[name]}
        </div>
      )}
    </div>
  );

  // Add reservation modal component
  const renderAddReservationModal = () => (
    <CModal visible={modalVisible} onClose={() => {
      setModalVisible(false);
      resetForm();
    }} size="lg">
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilPlus} className="me-2" />
          Add New Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {formErrors.general && (
          <CAlert color="danger" className="mb-3">
            {formErrors.general}
          </CAlert>
        )}

        <CForm onSubmit={handleSaveReservation}>
          <div className="row">
            <div className="col-md-6">
              <FormField
                label="Start Date & Time"
                name="startTime"
                type="datetime-local"
                required
              />
            </div>
            <div className="col-md-6">
              <FormField
                label="End Date & Time"
                name="endTime"
                type="datetime-local"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel>
              Customer <span className="text-danger">*</span>
            </CFormLabel>
            <Select
              options={customerOptions}
              onChange={handleCustomerChange}
              placeholder="Search or select a customer"
              isLoading={customerLoading}
              className={`basic-single ${formErrors.customerId ? 'is-invalid' : ''}`}
              classNamePrefix="select"
              isClearable
              isSearchable
            />
            {formErrors.customerId && (
              <div className="invalid-feedback d-block">
                {formErrors.customerId}
              </div>
            )}
          </div>

          <div className="row">
            <div className="col-md-6">
              <FormField
                label="Total Payment"
                name="payment"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total amount"
                required
              />
            </div>
            <div className="col-md-6">
              <FormField
                label="Advance Payment"
                name="advance"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter advance amount"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <FormField
                label="Table Number"
                name="tableNumber"
                placeholder="Enter table number"
              />
            </div>
            <div className="col-md-6">
              <FormField
                label="Notes"
                name="notes"
                placeholder="Additional notes"
              />
            </div>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={() => {
            setModalVisible(false);
            resetForm();
          }}
          disabled={submitLoading}
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={handleSaveReservation}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Reservation'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Edit reservation modal component
  const renderEditReservationModal = () => (
    <CModal visible={editModalVisible} onClose={() => {
      setEditModalVisible(false);
      resetForm();
      setSelectedReservation(null);
    }} size="lg">
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilPencil} className="me-2" />
          Edit Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {formErrors.general && (
          <CAlert color="danger" className="mb-3">
            {formErrors.general}
          </CAlert>
        )}

        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Start Date & Time"
              name="startTime"
              type="datetime-local"
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="End Date & Time"
              name="endTime"
              type="datetime-local"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <CFormLabel>
            Customer <span className="text-danger">*</span>
          </CFormLabel>
          <Select
            options={customerOptions}
            value={customerOptions.find(option => option.value === formData.customerId)}
            onChange={handleCustomerChange}
            placeholder="Search or select a customer"
            isLoading={customerLoading}
            className={`basic-single ${formErrors.customerId ? 'is-invalid' : ''}`}
            classNamePrefix="select"
            isClearable
            isSearchable
          />
          {formErrors.customerId && (
            <div className="invalid-feedback d-block">
              {formErrors.customerId}
            </div>
          )}
        </div>

        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Total Payment"
              name="payment"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="Advance Payment"
              name="advance"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Table Number"
              name="tableNumber"
              placeholder="Enter table number"
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="Notes"
              name="notes"
              placeholder="Additional notes"
            />
          </div>
        </div>

      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={() => {
            setEditModalVisible(false);
            resetForm();
            setSelectedReservation(null);
          }}
          disabled={submitLoading}
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={handleUpdateReservation}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            'Update Reservation'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Delete confirmation modal component
  const renderDeleteReservationModal = () => (
    <CModal visible={deleteModalVisible} onClose={() => {
      setDeleteModalVisible(false);
      setSelectedReservation(null);
    }}>
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilTrash} className="me-2" />
          Delete Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>Are you sure you want to delete this reservation?</p>
        {selectedReservation && (
          <div className="bg-light p-3 rounded">
            <strong>Customer:</strong> {selectedReservation.customerName}<br />
            <strong>Date:</strong> {formatDateTime(selectedReservation.startTime)}
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={() => {
            setDeleteModalVisible(false);
            setSelectedReservation(null);
          }}
          disabled={submitLoading}
        >
          Cancel
        </CButton>
        <CButton
          color="danger"
          onClick={handleDeleteReservation}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Reservation History Modal
  const renderHistoryModal = () => (
    <CModal
      visible={historyModalVisible}
      onClose={() => setHistoryModalVisible(false)}
      size="xl"
      scrollable
    >
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilHistory} className="me-2" />
          Reservation History
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {pastReservations.length === 0 ? (
          <div className="text-center py-5">
            <CIcon icon={cilHistory} size="3xl" className="text-muted mb-3" />
            <p className="text-muted">No past reservations found</p>
          </div>
        ) : (
          <div style={{ height: '500px', width: '100%' }}>
            <DataGrid
              rows={pastReservations}
              columns={historyColumns}
              getRowId={(row) => getReservationId(row)}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              slots={{
                toolbar: CustomToolbar,
              }}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6',
                },
                '& .MuiDataGrid-row': {
                  backgroundColor: '#f9f9f9',
                },
              }}
            />
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={() => setHistoryModalVisible(false)}
        >
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Main component render
  return (
    <div style={{ padding: '20px' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Reservations Management</h2>
        <div className="d-flex gap-2">
          <CButton
            color="secondary"
            onClick={() => setHistoryModalVisible(true)}
            disabled={!restaurantId}
          >
            <CIcon icon={cilHistory} className="me-2" />
            View History ({pastReservations.length})
          </CButton>
          <CButton
            color="primary"
            onClick={() => setModalVisible(true)}
            disabled={!restaurantId}
          >
            <CIcon icon={cilPlus} className="me-2" />
            Add Reservation
          </CButton>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <CAlert color="danger" className="mb-4">
          Error: {error}
        </CAlert>
      )}

      {/* No Restaurant ID Alert */}
      {!restaurantId && (
        <CAlert color="warning" className="mb-4">
          No restaurant ID found. Please log in again.
        </CAlert>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Upcoming Reservations</h5>
              <h2 className="mb-0">{futureReservations.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-secondary text-white">
            <div className="card-body">
              <h5 className="card-title">Past Reservations</h5>
              <h2 className="mb-0">{pastReservations.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid Container - Future Reservations Only */}
      <div style={{
        height: 'auto',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <CSpinner size="lg" className="mb-3" />
              <p>Loading reservations...</p>
            </div>
          </div>
        ) : futureReservations.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No upcoming reservations found</p>
            <CButton
              color="primary"
              onClick={() => setModalVisible(true)}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Create Your First Reservation
            </CButton>
          </div>
        ) : (
          <DataGrid
            rows={futureReservations}
            columns={columns}
            getRowId={(row) => getReservationId(row)}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            slots={{
              toolbar: CustomToolbar,
            }}
            disableSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
              },
            }}
          />
        )}
      </div>

      {/* Modal Components */}
      {renderAddReservationModal()}
      {renderEditReservationModal()}
      {renderDeleteReservationModal()}
      {renderHistoryModal()}
    </div>
  );
};

export default Reservation;