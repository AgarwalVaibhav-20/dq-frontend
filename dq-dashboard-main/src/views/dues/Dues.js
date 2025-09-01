import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "react-toastify";
import {
    fetchDues,
    addDue,
    updateDue,
    deleteDue,
} from '../../redux/slices/duesSlice';
import { fetchTransactionsByRestaurant } from '../../redux/slices/transactionSlice';
import {fetchCustomers} from '../../redux/slices/customerSlice';
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

const Dues = () => {
    const dispatch = useDispatch();
    const { dues, loading } = useSelector((state) => state.dues);
    // const { transactions, loading: transactionLoading } = useSelector((state) => state.transactions);
    const { customers, loading: customersLoading } = useSelector((state) => state.customers);
    const restaurantId = useSelector((state) => state.auth.restaurantId);

    const isMobile = useMediaQuery('(max-width:600px)');

    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        transaction_id: '',
        total: '',
        status: 'unpaid',
    });
    const [selectedDue, setSelectedDue] = useState(null);

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchDues({ restaurantId }));
            // dispatch(fetchTransactionsByRestaurant({ restaurantId }));
            dispatch(fetchCustomers({ restaurantId }));
        }
    }, [dispatch, restaurantId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSaveDue = (e) => {
        e.preventDefault();
    
        if (!formData.transaction_id || !formData.total) {
            toast.error("Please fill out all required fields.");
            return;
        }
    
        const payload = {
            ...formData,
            restaurantId,
        };
    
        dispatch(addDue(payload))
            .unwrap()
            .then(() => {
                toast.success("Due added successfully");
                setFormData({ transaction_id: '', total: '', status: 'unpaid' });
                setModalVisible(false);
            })
            .catch((error) => {
                toast.error("Error adding due:", error);
            });
    };
    
    

    const handleUpdateDue = async () => {
        const payload = {
            id: selectedDue?.due_details.id,
            ...formData,
            restaurantId,
        };
    
        try {
            await dispatch(updateDue(payload)).unwrap();
            setEditModalVisible(false);
            toast.success("Due updated successfully");
        } catch (error) {
            toast.error(error || "Error updating due");
        }
    };
    
    

    const handleDeleteDue = async () => {
        try {
            await dispatch(deleteDue({ id: selectedDue?.due_details?.id })).unwrap();
            setDeleteModalVisible(false);
            toast.success("Due deleted successfully");
        } catch (error) {
            toast.error(error || "Error deleting due");
        }
    };
    
    

    const renderAddDueModal = () => (
        <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
            <CModalHeader>
                <CModalTitle>Add Due</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm onSubmit={handleSaveDue}>
                    <div className="mb-3">
                        <label htmlFor="transaction_id">Customer</label>
                        <Select
                            options={customers.map((transaction) => ({
                                value: transaction.id,
                                label: transaction.name,
                            }))}
                            onChange={(selectedOption) =>
                                setFormData({ ...formData, transaction_id: selectedOption.value })
                            }
                            placeholder="Search or select a customer"
                            isLoading={customersLoading}
                            className="basic-single"
                            classNamePrefix="select"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="total">Total</label>
                        <CFormInput
                            type="number"
                            id="total"
                            name="total"
                            value={formData.total}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="status">Status</label>
                        <Select
                            options={[
                                { value: 'unpaid', label: 'Unpaid' },
                                { value: 'paid', label: 'Paid' },
                            ]}
                            onChange={(selectedOption) =>
                                setFormData({ ...formData, status: selectedOption.value })
                            }
                            value={{ value: formData.status, label: formData.status }}
                            placeholder="Select status"
                            className="basic-single"
                            classNamePrefix="select"
                            required
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

    const renderEditDueModal = () => (
        <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
            <CModalHeader>
                <CModalTitle>Edit Due</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div className="mb-3">
                    <label htmlFor="transaction_id">Customer</label>
                    <Select
                        options={customers?.map((transaction) => ({
                            value: transaction.id,
                            label: transaction.userName,
                        }))}
                        onChange={(selectedOption) =>
                            setFormData({ ...formData, transaction_id: selectedOption.value })
                        }
                        value={{ value: formData.transaction_id, label: customers.find(t => t.id === formData.transaction_id)?.userName }}
                        placeholder="Search or select a transaction"
                        isLoading={customersLoading}
                        className="basic-single"
                        classNamePrefix="select"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="total">Total</label>
                    <CFormInput
                        type="number"
                        name="total"
                        value={formData.total}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="status">Status</label>
                    <Select
                        options={[
                            { value: 'unpaid', label: 'Unpaid' },
                            { value: 'paid', label: 'Paid' },
                        ]}
                        onChange={(selectedOption) =>
                            setFormData({ ...formData, status: selectedOption.value })
                        }
                        value={{ value: formData.status, label: formData.status }}
                        placeholder="Select status"
                        className="basic-single"
                        classNamePrefix="select"
                        required
                    />
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
                    Close
                </CButton>
                <CButton color="primary" onClick={handleUpdateDue} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const renderDeleteDueModal = () => (
        <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
            <CModalHeader>
                <CModalTitle>Delete Due</CModalTitle>
            </CModalHeader>
            <CModalBody>Are you sure you want to delete this due?</CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
                    Cancel
                </CButton>
                <CButton color="danger" onClick={handleDeleteDue}>
                    Delete
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const columns = [
        { field: 'due_details.id', headerName: 'ID', flex: isMobile ? undefined : 0.5,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.due_details?.id },
        { field: 'userName', headerName: 'Customer Name', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.transaction_details?.original[0]?.userName },
        { field: 'total', headerName: 'Total', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.due_details?.total },
        { field: 'status', headerName: 'Status', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined, valueGetter: (params) => params.row?.due_details?.status },
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
                            setSelectedDue(params.row);
                            setFormData({
                                transaction_id: params.row?.due_details.transaction_id,
                                total: params.row?.due_details.total,
                                status: params.row?.due_details.status,
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
                            setSelectedDue(params.row);
                            setDeleteModalVisible(true);
                        }}
                    >
                        <CIcon icon={cilTrash} />
                    </CButton>
                </div>
            ),
        },
    ];

    const validatedDues = dues
    .filter((due) => due?.due_details?.id) // Filter valid dues
    .sort((a, b) => {
        // Sort by due ID in descending order (higher ID first)
        return b.due_details.id - a.due_details.id;
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
                <h2>Dues</h2>
                <CButton color="primary" onClick={() => setModalVisible(true)}>
                    Add Due
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
                            rows={validatedDues}
                            columns={columns}
                            getRowId={(row) => row.due_details.id}
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

            {renderAddDueModal()}
            {renderEditDueModal()}
            {renderDeleteDueModal()}
        </div>
    );
};

export default Dues;