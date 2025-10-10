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
  const token = localStorage.getItem('authToken')
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

    if (restaurantId && token) {
      dispatch(fetchReservations({ restaurantId, token }));
      dispatch(fetchCustomers({ restaurantId }));
    } else {
      console.error("No restaurantId found!");
    }
  }, [dispatch, restaurantId, token]);

  // Debug logging for data changes
  useEffect(() => {
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
      const payload = {
        ...formData,
        restaurantId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        payment: parseFloat(formData.payment),
        advance: parseFloat(formData.advance) || 0,
      };

      await dispatch(addReservation(payload)).unwrap();
      await dispatch(fetchReservations({ restaurantId }));

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
  // const handleUpdateReservation = async () => {
  //   if (!validateForm()) {
  //     return;
  //   }

  //   setSubmitLoading(true);

  //   try {
  //     const restaurantId = restaurantId || "68c80294c2283cb53671cde9";
  //     const payload = {
  //       id: selectedReservation?._id,
  //       ...formData,
  //       restaurantId: restaurantId,
  //       startTime: new Date(formData.startTime).toISOString(),
  //       endTime: new Date(formData.endTime).toISOString(),
  //       payment: parseFloat(formData.payment),
  //       advance: parseFloat(formData.advance) || 0,
  //     };

  //     await dispatch(updateReservation(payload)).unwrap();
  //     await dispatch(fetchReservations({ restaurantId: restaurantId }));

  //     resetForm();
  //     setEditModalVisible(false);
  //     setSelectedReservation(null);
  //   } catch (error) {
  //     console.error('Error updating reservation:', error);
  //     setFormErrors({ general: error.message || 'Failed to update reservation' });
  //   } finally {
  //     setSubmitLoading(false);
  //   }
  // };
  const handleUpdateReservation = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        id: selectedReservation?._id,
        ...formData,
        restaurantId: restaurantId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        payment: parseFloat(formData.payment),
        advance: parseFloat(formData.advance) || 0,
      };

      await dispatch(updateReservation(payload)).unwrap();
      await dispatch(fetchReservations({ restaurantId, token }));

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
      const id = selectedReservation?._id;
      await dispatch(deleteReservation({ id })).unwrap();
      await dispatch(fetchReservations({ restaurantId }));

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

  // Desktop DataGrid column definitions with full headers
  const columns = [
    {
      field: 'id',
      headerName: 'Reservation ID',
      flex: 0.5,
      minWidth: 120,
      valueGetter: (params) => getReservationId(params.row),
      renderCell: (params) => (
        <span title={params.value} className="text-truncate">{params.value}</span>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerName'),
      renderCell: (params) => (
        <div className="text-truncate" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      field: 'customerPhoneNumber',
      headerName: 'Mobile Number',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerPhoneNumber')
    },
    {
      field: 'customerAddress',
      headerName: 'Customer Address',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => getCustomerInfo(params.row, 'customerAddress')
    },
    {
      field: 'startTime',
      headerName: 'Start Date & Time',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        return formatDateTime(params.row?.startTime);
      },
      renderCell: (params) => (
        <div className="text-truncate" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      field: 'endTime',
      headerName: 'End Date & Time',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        return formatDateTime(params.row?.endTime);
      }
    },
    {
      field: 'payment',
      headerName: 'Total Payment',
      flex: 0.5,
      minWidth: 100,
      valueGetter: (params) => {
        return params.row?.payment ? `₹${params.row.payment}` : 'N/A';
      }
    },
    {
      field: 'advance',
      headerName: 'Advance Payment',
      flex: 0.5,
      minWidth: 100,
      valueGetter: (params) => {
        return params.row?.advance ? `₹${params.row.advance}` : 'N/A';
      }
    },
    {
      field: 'tableNumber',
      headerName: 'Table Number',
      flex: 0.5,
      minWidth: 80,
      valueGetter: (params) => {
        return params.row?.tableNumber || 'N/A';
      }
    },
    {
      field: 'notes',
      headerName: 'Special Notes',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        return params.row?.notes || 'N/A';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
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
            <CIcon icon={cilPencil} size="sm" />
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
            <CIcon icon={cilTrash} size="sm" />
          </CButton>
        </div>
      ),
    },
  ];

  // History columns (read-only, no actions)
  const historyColumns = columns.filter(col => col.field !== 'actions');

  // Mobile Card Component for reservations
  const ReservationCard = ({ reservation }) => (
    <div className="card mb-3 shadow-sm">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title mb-0 text-primary">
            {getCustomerInfo(reservation, 'customerName')}
          </h6>
          <div className="d-flex gap-1">
            <CButton
              color="info"
              size="sm"
              onClick={() => {
                setSelectedReservation(reservation);
                setFormData({
                  startTime: formatDateTimeForInput(reservation.startTime),
                  endTime: formatDateTimeForInput(reservation.endTime),
                  customerId: reservation.customerId || "",
                  customerName: reservation.customerName || "",
                  payment: reservation.payment || "",
                  advance: reservation.advance || "",
                  notes: reservation.notes || "",
                  tableNumber: reservation.tableNumber || "",
                });
                setEditModalVisible(true);
              }}
              title="Edit Reservation"
            >
              <CIcon icon={cilPencil} size="sm" />
            </CButton>
            <CButton
              color="danger"
              size="sm"
              onClick={() => {
                setSelectedReservation(reservation);
                setDeleteModalVisible(true);
              }}
              title="Delete Reservation"
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          </div>
        </div>
        
        <div className="row g-2">
          <div className="col-6">
            <small className="text-muted">Mobile:</small>
            <div className="fw-medium">{getCustomerInfo(reservation, 'customerPhoneNumber')}</div>
          </div>
          <div className="col-6">
            <small className="text-muted">Table:</small>
            <div className="fw-medium">{reservation.tableNumber || 'N/A'}</div>
          </div>
        </div>
        
        <div className="row g-2 mt-2">
          <div className="col-6">
            <small className="text-muted">Start Time:</small>
            <div className="fw-medium">{formatDateTime(reservation.startTime)}</div>
          </div>
          <div className="col-6">
            <small className="text-muted">End Time:</small>
            <div className="fw-medium">{formatDateTime(reservation.endTime)}</div>
          </div>
        </div>
        
        <div className="row g-2 mt-2">
          <div className="col-6">
            <small className="text-muted">Total Payment:</small>
            <div className="fw-medium text-success">
              {reservation.payment ? `₹${reservation.payment}` : 'N/A'}
            </div>
          </div>
          <div className="col-6">
            <small className="text-muted">Advance:</small>
            <div className="fw-medium text-warning">
              {reservation.advance ? `₹${reservation.advance}` : 'N/A'}
            </div>
          </div>
        </div>
        
        {reservation.notes && (
          <div className="mt-2">
            <small className="text-muted">Notes:</small>
            <div className="fw-medium">{reservation.notes}</div>
          </div>
        )}
        
        {getCustomerInfo(reservation, 'customerAddress') !== 'N/A' && (
          <div className="mt-2">
            <small className="text-muted">Address:</small>
            <div className="fw-medium">{getCustomerInfo(reservation, 'customerAddress')}</div>
          </div>
        )}
      </div>
    </div>
  );

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

  // Mobile responsive reusable form field component
  const FormField = ({
    label,
    name,
    type = 'text',
    required = false,
    placeholder = '',
    ...props
  }) => (
    <div className="mb-3">
      <CFormLabel htmlFor={name} className={isMobile ? "small" : ""}>
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
        size={isMobile ? "sm" : ""}
        className={isMobile ? "form-control-sm" : ""}
        style={isMobile ? { minHeight: '44px' } : {}}
        {...props}
      />
      {formErrors[name] && (
        <div className="invalid-feedback d-block small">
          {formErrors[name]}
        </div>
      )}
    </div>
  );

  // Mobile responsive Add reservation modal component
  const renderAddReservationModal = () => (
    <CModal 
      visible={modalVisible} 
      onClose={() => {
        setModalVisible(false);
        resetForm();
      }} 
      size={isMobile ? "fullscreen" : "lg"}
      className={isMobile ? "modal-mobile-responsive" : ""}
    >
      <CModalHeader className={isMobile ? "pb-2" : ""}>
        <CModalTitle className={isMobile ? "h5" : ""}>
          <CIcon icon={cilPlus} className="me-2" />
          Add New Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody className={isMobile ? "px-3 py-2" : ""}>
        {formErrors.general && (
          <CAlert color="danger" className="mb-3">
            {formErrors.general}
          </CAlert>
        )}

        <CForm onSubmit={handleSaveReservation}>
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <FormField
                label="Start Date & Time"
                name="startTime"
                type="datetime-local"
                required
              />
            </div>
            <div className="col-12 col-md-6">
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
              styles={isMobile ? {
                control: (base) => ({
                  ...base,
                  fontSize: '0.875rem',
                  minHeight: '44px'
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: '0.875rem'
                })
              } : {}}
            />
            {formErrors.customerId && (
              <div className="invalid-feedback d-block">
                {formErrors.customerId}
              </div>
            )}
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
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

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <FormField
                label="Table Number"
                name="tableNumber"
                placeholder="Enter table number"
              />
            </div>
            <div className="col-12 col-md-6">
              <FormField
                label="Notes"
                name="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={handleChange}
                // error={formErrors.notes}
              />
            </div>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter className={isMobile ? "px-3 py-2" : ""}>
        <div className={isMobile ? "d-flex flex-column w-100 gap-2" : "d-flex gap-2"}>
          <CButton
            color="secondary"
            onClick={() => {
              setModalVisible(false);
              resetForm();
            }}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveReservation}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
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
        </div>
      </CModalFooter>
    </CModal>
  );

  // Mobile responsive Edit reservation modal component
  const renderEditReservationModal = () => (
    <CModal 
      visible={editModalVisible} 
      onClose={() => {
        setEditModalVisible(false);
        resetForm();
        setSelectedReservation(null);
      }} 
      size={isMobile ? "fullscreen" : "lg"}
      className={isMobile ? "modal-mobile-responsive" : ""}
    >
      <CModalHeader className={isMobile ? "pb-2" : ""}>
        <CModalTitle className={isMobile ? "h5" : ""}>
          <CIcon icon={cilPencil} className="me-2" />
          Edit Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody className={isMobile ? "px-3 py-2" : ""}>
        {formErrors.general && (
          <CAlert color="danger" className="mb-3">
            {formErrors.general}
          </CAlert>
        )}

        <div className="row g-2">
          <div className="col-12 col-md-6">
            <FormField
              label="Start Date & Time"
              name="startTime"
              type="datetime-local"
              required
            />
          </div>
          <div className="col-12 col-md-6">
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
            styles={isMobile ? {
              control: (base) => ({
                ...base,
                fontSize: '0.875rem',
                minHeight: '44px'
              }),
              menu: (base) => ({
                ...base,
                fontSize: '0.875rem'
              })
            } : {}}
          />
          {formErrors.customerId && (
            <div className="invalid-feedback d-block">
              {formErrors.customerId}
            </div>
          )}
        </div>

        <div className="row g-2">
          <div className="col-12 col-md-6">
            <FormField
              label="Total Payment"
              name="payment"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <FormField
              label="Advance Payment"
              name="advance"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="row g-2">
          <div className="col-12 col-md-6">
            <FormField
              label="Table Number"
              name="tableNumber"
              placeholder="Enter table number"
            />
          </div>
          <div className="col-12 col-md-6">
            <FormField
              label="Notes"
              name="notes"
              placeholder="Additional notes"
            />
          </div>
        </div>

      </CModalBody>
      <CModalFooter className={isMobile ? "px-3 py-2" : ""}>
        <div className={isMobile ? "d-flex flex-column w-100 gap-2" : "d-flex gap-2"}>
          <CButton
            color="secondary"
            onClick={() => {
              setEditModalVisible(false);
              resetForm();
              setSelectedReservation(null);
            }}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateReservation}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
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
        </div>
      </CModalFooter>
    </CModal>
  );

  // Mobile responsive Delete confirmation modal component
  const renderDeleteReservationModal = () => (
    <CModal 
      visible={deleteModalVisible} 
      onClose={() => {
        setDeleteModalVisible(false);
        setSelectedReservation(null);
      }}
      size={isMobile ? "sm" : ""}
      className={isMobile ? "modal-mobile-responsive" : ""}
    >
      <CModalHeader className={isMobile ? "pb-2" : ""}>
        <CModalTitle className={isMobile ? "h6" : ""}>
          <CIcon icon={cilTrash} className="me-2" />
          Delete Reservation
        </CModalTitle>
      </CModalHeader>
      <CModalBody className={isMobile ? "px-3 py-2" : ""}>
        <p className={isMobile ? "mb-3" : ""}>Are you sure you want to delete this reservation?</p>
        {selectedReservation && (
          <div className="bg-light p-3 rounded">
            <div className="mb-2">
              <strong>Customer:</strong> {selectedReservation.customerName}
            </div>
            <div>
              <strong>Date:</strong> {formatDateTime(selectedReservation.startTime)}
            </div>
          </div>
        )}
      </CModalBody>
      <CModalFooter className={isMobile ? "px-3 py-2" : ""}>
        <div className={isMobile ? "d-flex flex-column w-100 gap-2" : "d-flex gap-2"}>
          <CButton
            color="secondary"
            onClick={() => {
              setDeleteModalVisible(false);
              setSelectedReservation(null);
            }}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
          >
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={handleDeleteReservation}
            disabled={submitLoading}
            className={isMobile ? "w-100" : ""}
            size={isMobile ? "sm" : ""}
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
        </div>
      </CModalFooter>
    </CModal>
  );

  // Mobile responsive Reservation History Modal
  const renderHistoryModal = () => (
    <CModal
      visible={historyModalVisible}
      onClose={() => setHistoryModalVisible(false)}
      size={isMobile ? "fullscreen" : "xl"}
      scrollable
      className={isMobile ? "modal-mobile-responsive" : ""}
    >
      <CModalHeader className={isMobile ? "pb-2" : ""}>
        <CModalTitle className={isMobile ? "h5" : ""}>
          <CIcon icon={cilHistory} className="me-2" />
          Reservation History
        </CModalTitle>
      </CModalHeader>
      <CModalBody className={isMobile ? "px-3 py-2" : ""}>
        {pastReservations.length === 0 ? (
          <div className="text-center py-5">
            <CIcon icon={cilHistory} size="3xl" className="text-muted mb-3" />
            <p className="text-muted">No past reservations found</p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards for History */}
            {isMobile ? (
              <div className="p-3">
                {pastReservations.map((reservation) => (
                  <ReservationCard 
                    key={getReservationId(reservation)} 
                    reservation={reservation} 
                  />
                ))}
              </div>
            ) : (
              /* Desktop View - DataGrid with full headers for History */
              <div style={{ 
                height: '500px', 
                width: '100%',
                overflow: 'visible'
              }}>
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
                  autoHeight
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.875rem',
                      padding: '8px 16px',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #dee2e6',
                      fontSize: '0.875rem',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-row': {
                      backgroundColor: '#f9f9f9',
                      minHeight: '52px',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </CModalBody>
      <CModalFooter className={isMobile ? "px-3 py-2" : ""}>
        <CButton
          color="secondary"
          onClick={() => setHistoryModalVisible(false)}
          className={isMobile ? "w-100" : ""}
          size={isMobile ? "sm" : ""}
        >
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Main component render
  return (
    <div className="container-fluid px-2 px-md-3 py-2">
      {/* Mobile Responsive Header */}
      <div className="mb-4">
        {/* Title Section - Mobile Responsive */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
          <div className="mb-2 mb-md-0">
            <h2 className="mb-0 text-center text-md-start">Reservations Management</h2>
          </div>
          
          {/* Mobile Responsive Button Groups */}
          <div className="w-100 d-md-none">
            {/* Mobile: Stack buttons vertically */}
            <div className="d-flex flex-column gap-2">
              <CButton
                color="primary"
                onClick={() => setModalVisible(true)}
                disabled={!restaurantId}
                className="w-100"
                size="sm"
              >
                <CIcon icon={cilPlus} className="me-2" />
                Add Reservation
              </CButton>
              <CButton
                color="secondary"
                onClick={() => setHistoryModalVisible(true)}
                disabled={!restaurantId}
                className="w-100"
                size="sm"
              >
                <CIcon icon={cilHistory} className="me-2" />
                View History ({pastReservations.length})
              </CButton>
            </div>
          </div>
          
          {/* Desktop: Horizontal buttons */}
          <div className="d-none d-md-flex gap-2">
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

      {/* Mobile Responsive Stats Cards */}
      <div className="row mb-4 g-2">
        <div className="col-12 col-md-6">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center text-md-start">
              <h5 className="card-title mb-2">
                <CIcon icon={cilPlus} className="me-2" />
                Upcoming Reservations
              </h5>
              <h2 className="mb-0">{futureReservations.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card bg-secondary text-white h-100">
            <div className="card-body text-center text-md-start">
              <h5 className="card-title mb-2">
                <CIcon icon={cilHistory} className="me-2" />
                Past Reservations
              </h5>
              <h2 className="mb-0">{pastReservations.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Data Grid Container */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <div className="text-center">
                <CSpinner size="lg" className="mb-3" />
                <p>Loading reservations...</p>
              </div>
            </div>
          ) : futureReservations.length === 0 ? (
            <div className="text-center py-5 px-3">
              <CIcon icon={cilPlus} size="3xl" className="text-muted mb-3" />
              <p className="text-muted mb-3">No upcoming reservations found</p>
              <CButton
                color="primary"
                onClick={() => setModalVisible(true)}
                className="w-100 w-md-auto"
              >
                <CIcon icon={cilPlus} className="me-2" />
                Create Your First Reservation
              </CButton>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              {isMobile ? (
                <div className="p-3">
                  {futureReservations.map((reservation) => (
                    <ReservationCard 
                      key={getReservationId(reservation)} 
                      reservation={reservation} 
                    />
                  ))}
                </div>
              ) : (
                /* Desktop View - DataGrid with full headers */
                <div style={{ 
                  height: 'auto',
                  width: '100%',
                  overflow: 'visible'
                }}>
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
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                      },
                      '& .MuiDataGrid-row': {
                        minHeight: '52px',
                      },
                      '& .MuiDataGrid-footerContainer': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
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