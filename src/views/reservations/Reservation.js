import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchReservations,
    addReservation,
    updateReservation,
    deleteReservation,
} from '../../redux/slices/reservationSlice';
import { fetchCustomers } from '../../redux/slices/customerSlice'
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
    CForm
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';
import { useMediaQuery } from '@mui/material';
import Select from 'react-select';

const Reservation = () => {
    const dispatch = useDispatch();
    const { reservations, loading } = useSelector((state) => state.reservations);
    const { customers, loading: customerLoading } = useSelector((state) => state.customers)
    const restaurantId = useSelector((state) => state.auth.restaurantId);

    const isMobile = useMediaQuery('(max-width:600px)');

    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        restaurantId: '',
        startTime: '',
        endTime: '',
        customerId: '',
        payment: '',
        advance: '',
        notes: '',
        tableNumber: '',
    });
    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchReservations({ restaurantId }));
            dispatch(fetchCustomers({ restaurantId }))
        }
    }, [dispatch, restaurantId]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSaveReservation = () => {
        // Validate required fields
        if (!formData.startTime || !formData.endTime || !formData.customerId) {
            alert('Please fill out all required fields.');
            return;
        }

        // Validate date strings
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            alert('Invalid date format.');
            return;
        }

        const payload = {
            ...formData,
            restaurantId, // Ensure restaurantId is included
            startTime: startTime.toISOString(), // Convert to ISO string
            endTime: endTime.toISOString(), // Convert to ISO string
        };

        dispatch(addReservation(payload)).then(() => {
            dispatch(fetchReservations({ restaurantId }));
            setFormData({
                restaurantId: '',
                startTime: '',
                endTime: '',
                customerId: '',
                payment: '',
                advance: '',
                notes: '',
                tableNumber: '',
            });
            setModalVisible(false);
        });
    };

    const handleUpdateReservation = () => {
        const payload = {
            id: selectedReservation?.reservationDetails.id,
            ...formData,
            restaurantId,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
        };
        dispatch(updateReservation(payload)).then(() => {
            dispatch(fetchReservations({ restaurantId }));
            setFormData({
                restaurantId: '',
                startTime: '',
                endTime: '',
                customerId: 0,
                payment: 0,
                advance: 0,
                notes: '',
                tableNumber: '',
            });
            setEditModalVisible(false);
        });
    };

    const handleDeleteReservation = () => {
        dispatch(deleteReservation({ id: selectedReservation?.reservationDetails?.id, restaurantId })).then(() => {
            setDeleteModalVisible(false);
        });
    };

    const renderAddReservationModal = () => (
        <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
            <CModalTitle>Add Reservation</CModalTitle>
        </CModalHeader>
        <CModalBody>
            <CForm onSubmit={handleSaveReservation}>
                <div className="mb-3">
                    <label htmlFor="startTime">Start Time</label>
                    <CFormInput
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="endTime">End Time</label>
                    <CFormInput
                        type="datetime-local"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="customerId">Customer Name</label>
                    <Select
                        options={customers.map((customer) => ({
                            value: customer.id,
                            label: customer.name,
                        }))}
                        onChange={(selectedOption) =>
                            setFormData({ ...formData, customerId: selectedOption.value })
                        }
                        placeholder="Search or select a customer"
                        isLoading={customerLoading}
                        className="basic-single"
                        classNamePrefix="select"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="payment">Total Payment</label>
                    <CFormInput
                        type="number"
                        id="payment"
                        name="payment"
                        value={formData.payment}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="advance">Advance</label>
                    <CFormInput
                        type="number"
                        id="advance"
                        name="advance"
                        value={formData.advance}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="tableNumber">Table Number</label>
                    <CFormInput
                        id="tableNumber"
                        name="tableNumber"
                        value={formData.tableNumber}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="notes">Notes</label>
                    <CFormInput
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>
             
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setModalVisible(false)}>
                        Close
                    </CButton>
                    <CButton type="submit" color="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </CButton>
                </CModalFooter>
            </CForm>
        </CModalBody>
    </CModal>
    );

    const renderEditReservationModal = () => (
        <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
            <CModalHeader>
                <CModalTitle>Edit Reservation</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div className="mb-3">
                    <label htmlFor="startTime" className="form-label">Start Time</label>
                    <CFormInput
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="endTime" className="form-label">End Time</label>
                    <CFormInput
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                    />
                </div>
                  <div className="mb-3">
                    <label htmlFor="customerId">Customer Name</label>
                    <Select
                        options={customers.map((customer) => ({
                            value: customer.id,
                            label: customer.name,
                        }))}
                        onChange={(selectedOption) =>
                            setFormData({ ...formData, customerId: selectedOption.value })
                        }
                        placeholder="Search or select a customer"
                        isLoading={customerLoading}
                        className="basic-single"
                        classNamePrefix="select"

                    />
                </div>
                <div className="mb-3">
                    <label>Payment</label>
                    <CFormInput
                        type="number"
                        name="payment"
                        value={formData.payment}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label>Advance</label>
                    <CFormInput
                        type="number"
                        name="advance"
                        value={formData.advance}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label>Notes</label>
                    <CFormInput
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label>Table Number</label>
                    <CFormInput
                        name="tableNumber"
                        value={formData.tableNumber}
                        onChange={handleChange}
                    />
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
                    Close
                </CButton>
                <CButton color="primary" onClick={handleUpdateReservation} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const renderDeleteReservationModal = () => (
        <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
            <CModalHeader>
                <CModalTitle>Delete Reservation</CModalTitle>
            </CModalHeader>
            <CModalBody>Are you sure you want to delete this reservation?</CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
                    Cancel
                </CButton>
                <CButton color="danger" onClick={handleDeleteReservation}>
                    Delete
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const columns = [
        { field: 'reservationDetails.id', headerName: 'ID', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.reservationDetails?.id },
        { field: 'customerName', headerName: 'Customer Name', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,},
        { field: 'customerPhoneNumber', headerName: 'Mobile No. ', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,},
        { field: 'customerAddress', headerName: 'Address ', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,},
        { field: 'startTime', headerName: 'Start Time', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => new Date(params.row?.reservationDetails?.startTime).toLocaleString() },
        { field: 'endTime', headerName: 'End Time', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,valueGetter: (params) => new Date(params.row?.reservationDetails?.endTime).toLocaleString() },
        { field: 'payment', headerName: 'Payment', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.reservationDetails?.payment },
        { field: 'advance', headerName: 'Advance', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.reservationDetails?.advance },
        { field: 'notes', headerName: 'Notes', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.reservationDetails?.notes },
        { field: 'tableNumber', headerName: 'Table Number', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.reservationDetails?.tableNumber },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <CButton
                        color="secondary"
                        size="sm"
                        onClick={() => {
                            setSelectedReservation(params.row);
                            setFormData({
                                startTime: params.row?.reservationDetails.startTime,
                                endTime: params.row?.reservationDetails.endTime,
                                customerId: params.row?.reservationDetails.customerId,
                                payment: params.row?.reservationDetails.payment,
                                advance: params.row?.reservationDetails.advance,
                                notes: params.row?.reservationDetails.notes,
                                tableNumber: params.row?.reservationDetails.tableNumber,
                            });
                            setEditModalVisible(true);
                        }}
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
                    >
                        <CIcon icon={cilTrash} />
                    </CButton>
                </div>
            ),
        },
    ];

    const validatedReservations = reservations
    .filter((reservation) => reservation?.reservationDetails?.id) // Filter valid reservations
    .sort((a, b) => {
        // Sort by reservation ID in descending order (higher ID first)
        return b.reservationDetails.id - a.reservationDetails.id;
    });

    return (
        <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <h2>Reservations</h2>
                <CButton color="primary" onClick={() => setModalVisible(true)}>
                    Add Reservation
                </CButton>
            </div>
            <div style={{ height: 'auto', width: '100%', backgroundColor: 'white', overflowX: 'auto' }}>
                {loading ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '300px',
                        }}
                    >
                        <CSpinner />
                    </div>
                ) : (
                    <div style={{ height: 'auto', width: '100%', backgroundColor: 'white'}}>
                        <DataGrid
                            rows={validatedReservations}
                            columns={columns}
                            getRowId={(row) => row.reservationDetails.id}
                            pagination
                            pageSize={5}
                            rowsPerPageOptions={[5, 10, 20]}
                            slots={{
                                toolbar: CustomToolbar,
                            }}
                            disableSelectionOnClick
                            autoHeight
                        />
                    </div>
                )}
            </div>

            {renderAddReservationModal()}
            {renderEditReservationModal()}
            {renderDeleteReservationModal()}
        </div>
    );
};

export default Reservation;