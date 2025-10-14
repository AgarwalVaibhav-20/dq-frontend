import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
    createWasteMaterial,
    fetchWasteMaterials,
    updateWasteMaterial,
    deleteWasteMaterial,
} from "../../../src/redux/slices/wasteSlice";
import {
    fetchInventories,
} from "../../../src/redux/slices/stockSlice";
import CustomToolbar from "../../../src/utils/CustomToolbar";
import {
    CButton,
    CModal,
    CModalBody,
    CModalFooter,
    CModalHeader,
    CModalTitle,
    CFormInput,
    CFormSelect,
    CFormTextarea,
    CSpinner,
    CContainer,
    CRow,
    CCol,
    CBadge,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilTrash } from "@coreui/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";

// Mobile responsive styles
const mobileStyles = `
  @media (max-width: 768px) {
    .modal-responsive .modal-dialog {
      margin: 10px;
      max-width: calc(100% - 20px);
    }
    
    .mobile-header {
      font-size: 12px !important;
      padding: 4px !important;
    }
    
    .mobile-cell {
      font-size: 11px !important;
      padding: 4px !important;
    }
    
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .MuiDataGrid-root {
      min-width: 600px;
    }
  }
  
  @media (max-width: 480px) {
    .mobile-header {
      font-size: 10px !important;
      padding: 2px !important;
    }
    
    .mobile-cell {
      font-size: 9px !important;
      padding: 2px !important;
    }
    
    .MuiDataGrid-root {
      min-width: 500px;
    }
  }
`;

const Waste = () => {
    const dispatch = useDispatch();
    const { wastes, loading } = useSelector((state) => state.wastes);
    const { inventories } = useSelector((state) => state.inventories);
    const restaurantId = useSelector((state) => state.auth.restaurantId);
    const token = localStorage.getItem("authToken");

    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        itemId: "",
        itemName: "",
        wasteQuantity: "",
        unit: "",
        date: new Date().toISOString().split('T')[0],
    });
    const [selectedWaste, setSelectedWaste] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);

    // Fetch waste and stock data
    useEffect(() => {
        if (restaurantId && token) {
            dispatch(fetchWasteMaterials({ restaurantId, token }));
            dispatch(fetchInventories({ token }));
        }
    }, [dispatch, restaurantId, token]);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "itemId") {
            const stock = inventories.find(s => s._id === value);
            if (stock) {
                setSelectedStock(stock);
                setFormData({
                    ...formData,
                    itemId: value,
                    itemName: stock.itemName,
                    unit: stock.unit || 'kg'
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Save waste
    const handleSaveWaste = async () => {
        if (!formData.itemId || !formData.wasteQuantity) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (selectedStock && parseFloat(formData.wasteQuantity) > (selectedStock.stock?.quantity || 0)) {
            toast.error(`Insufficient stock. Available: ${selectedStock.stock?.quantity || 0} ${selectedStock.unit}`);
            return;
        }

        const wasteData = {
            restaurantId,
            itemId: formData.itemId,
            itemName: formData.itemName,
            wasteQuantity: parseFloat(formData.wasteQuantity),
            unit: formData.unit,
            date: formData.date,
        };

        await dispatch(createWasteMaterial({ wasteData, token }));
        await dispatch(fetchWasteMaterials({ restaurantId, token }));
        await dispatch(fetchInventories({ token }));
        setModalVisible(false);
        resetForm();
    };

    // Update waste
    const handleUpdateWaste = async () => {
        if (!selectedWaste) return;

        if (!formData.itemId || !formData.wasteQuantity) {
            toast.error("Please fill in all required fields");
            return;
        }

        const updatedData = {
            itemId: formData.itemId,
            itemName: formData.itemName,
            wasteQuantity: parseFloat(formData.wasteQuantity),
            unit: formData.unit,
            reason: formData.reason,
            date: formData.date,
        };

        await dispatch(
            updateWasteMaterial({
                id: selectedWaste._id,
                updatedData,
                token,
            })
        );
        await dispatch(fetchWasteMaterials({ restaurantId, token }));
        await dispatch(fetchInventories({ token }));
        setEditModalVisible(false);
        setSelectedWaste(null);
        resetForm();
    };

    // Delete waste
    const handleDeleteWaste = async () => {
        if (!selectedWaste) return;
        await dispatch(deleteWasteMaterial({
            id: selectedWaste._id,
            token
        }));
        await dispatch(fetchWasteMaterials({ restaurantId, token }));
        await dispatch(fetchInventories({ token }));
        setDeleteModalVisible(false);
        setSelectedWaste(null);
    };

    const resetForm = () => {
        setFormData({
            itemId: "",
            itemName: "",
            wasteQuantity: "",
            unit: "",
            date: new Date().toISOString().split('T')[0],
        });
        setSelectedStock(null);
    };

    const exportToCSV = () => {
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            ['Waste ID,Date,Stock Item,Waste Quantity,Unit,Reason'].join(',') +
            '\n' +
            wastes
                .map((row) => [
                    row._id,
                    row.date,
                    row.itemName,
                    row.wasteQuantity,
                    row.unit,
                    `"${row.reason}"`
                ].join(','))
                .join('\n');
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = 'waste_report.csv';
        link.click();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Waste Management Report', 10, 10);
        const tableColumn = ['Waste ID', 'Date', 'Stock Item', 'Waste Quantity', 'Unit', 'Reason'];
        const tableRows = wastes.map((row) => [
            row._id,
            new Date(row.date).toLocaleDateString(),
            row.itemName,
            row.wasteQuantity,
            row.unit,
            row.reason,
        ]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save('waste_report.pdf');
    };

    const rows = wastes.map((w) => ({
        id: w._id,
        ...w,
    }));

    const renderAddWasteModal = () => (
        <CModal
            visible={modalVisible}
            onClose={() => {
                setModalVisible(false);
                resetForm();
            }}
            size="lg"
            className="modal-responsive"
        >
            <CModalHeader>
                <CModalTitle>Add Waste Entry</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CRow>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Stock Item *</label>
                        <CFormSelect
                            name="itemId"
                            value={formData.itemId}
                            onChange={handleChange}
                        >
                            <option value="">Select Stock Item</option>
                            {inventories.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.itemName} (Available: {item.stock?.quantity || 0} {item.unit})
                                </option>
                            ))}
                        </CFormSelect>
                    </CCol>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Date *</label>
                        <CFormInput
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </CCol>
                </CRow>
                <CRow>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Waste Quantity *</label>
                        <CFormInput
                            type="number"
                            placeholder="Enter waste quantity"
                            name="wasteQuantity"
                            value={formData.wasteQuantity}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </CCol>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Unit</label>
                        <CFormInput
                            placeholder="Unit"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            disabled
                        />
                    </CCol>
                </CRow>
                {selectedStock && (
                    <CRow>
                        <CCol xs={12}>
                            <div className="alert alert-info">
                                <strong>Current Stock:</strong> {selectedStock.itemName} - {selectedStock.stock?.quantity || 0} {selectedStock.unit}
                            </div>
                        </CCol>
                    </CRow>
                )}
            </CModalBody>
            <CModalFooter className="d-flex justify-content-center gap-2">
                <CButton
                    color="secondary"
                    onClick={() => {
                        setModalVisible(false);
                        resetForm();
                    }}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    Close
                </CButton>
                <CButton
                    color="primary"
                    onClick={handleSaveWaste}
                    disabled={loading}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const renderEditWasteModal = () => (
        <CModal
            visible={editModalVisible}
            onClose={() => {
                setEditModalVisible(false);
                resetForm();
            }}
            size="lg"
            className="modal-responsive"
        >
            <CModalHeader>
                <CModalTitle>Edit Waste Entry</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CRow>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Stock Item *</label>
                        <CFormSelect
                            name="itemId"
                            value={formData.itemId}
                            onChange={handleChange}
                        >
                            <option value="">Select Stock Item</option>
                            {inventories.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.itemName} (Available: {item.stock?.quantity || 0} {item.unit})
                                </option>
                            ))}
                        </CFormSelect>
                    </CCol>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Date *</label>
                        <CFormInput
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </CCol>
                </CRow>
                <CRow>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Waste Quantity *</label>
                        <CFormInput
                            type="number"
                            placeholder="Enter waste quantity"
                            name="wasteQuantity"
                            value={formData.wasteQuantity}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </CCol>
                    <CCol xs={12} sm={6} className="mb-3">
                        <label className="form-label">Unit</label>
                        <CFormInput
                            placeholder="Unit"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            disabled
                        />
                    </CCol>
                </CRow>
            </CModalBody>
            <CModalFooter className="d-flex justify-content-center gap-2">
                <CButton
                    color="secondary"
                    onClick={() => {
                        setEditModalVisible(false);
                        resetForm();
                    }}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    Close
                </CButton>
                <CButton
                    color="primary"
                    onClick={handleUpdateWaste}
                    disabled={loading}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const renderDeleteWasteModal = () => (
        <CModal
            visible={deleteModalVisible}
            onClose={() => setDeleteModalVisible(false)}
            className="modal-responsive"
        >
            <CModalHeader>
                <CModalTitle>Delete Waste Entry</CModalTitle>
            </CModalHeader>
            <CModalBody>Are you sure you want to delete this waste entry?</CModalBody>
            <CModalFooter className="d-flex justify-content-center gap-2">
                <CButton
                    color="secondary"
                    onClick={() => setDeleteModalVisible(false)}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    Cancel
                </CButton>
                <CButton
                    color="danger"
                    onClick={handleDeleteWaste}
                    size="sm"
                    style={{
                        fontSize: '0.875rem',
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto'
                    }}
                >
                    Delete
                </CButton>
            </CModalFooter>
        </CModal>
    );

    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            flex: 0.6,
            minWidth: 20,
            headerClassName: 'mobile-header',
            cellClassName: 'mobile-cell',
            renderCell: (params) => (
                <span style={{ fontSize: '0.75rem' }}>
                    {params.value.substring(0, 20)}...
                </span>
            )
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            flex: 1,
            minWidth: 100,
            headerClassName: 'mobile-header',
            cellClassName: 'mobile-cell',
            valueFormatter: (params) => {
                return new Date(params.value).toLocaleDateString();
            }
        },
        {
            field: 'stockName',
            headerName: 'Stock Item',
            flex: 1.2,
            minWidth: 120,
            headerClassName: 'mobile-header',
            cellClassName: 'mobile-cell'
        },
        {
            field: 'wasteQuantity',
            headerName: 'Waste Qty',
            flex: 0.8,
            minWidth: 80,
            headerClassName: 'mobile-header',
            cellClassName: 'mobile-cell',
            renderCell: (params) => (
                <CBadge color="danger">
                    {params.value} {params.row.unit}
                </CBadge>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.8,
            minWidth: 80,
            sortable: false,
            filterable: false,
            headerClassName: 'mobile-header',
            cellClassName: 'mobile-cell',
            renderCell: (params) => (
                <div style={{
                    display: 'flex',
                    gap: '5px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <CButton
                        color="secondary"
                        size="sm"
                        onClick={() => {
                            setSelectedWaste(params.row);
                            setFormData({
                                itemId: params.row.itemId,
                                itemName: params.row.itemName,
                                wasteQuantity: params.row.wasteQuantity,
                                unit: params.row.unit,
                                reason: params.row.reason,
                                date: params.row.date.split('T')[0],
                            });
                            setEditModalVisible(true);
                        }}
                        style={{ minWidth: '30px', padding: '4px' }}
                    >
                        <CIcon icon={cilPencil} size="sm" />
                    </CButton>
                    <CButton
                        color="danger"
                        size="sm"
                        onClick={() => {
                            setSelectedWaste(params.row);
                            setDeleteModalVisible(true);
                        }}
                        style={{ minWidth: '30px', padding: '4px' }}
                    >
                        <CIcon icon={cilTrash} size="sm" />
                    </CButton>
                </div>
            ),
        },
    ];

    return (
        <>
            <style>{mobileStyles}</style>
            <CContainer fluid className="px-2 px-md-3">
                {/* Header Section - Mobile Responsive */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                    <h2 className="mb-2 mb-md-0">Waste Management</h2>
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                        <div className="d-flex justify-content-end">
                            <CButton
                                color="primary"
                                onClick={() => setModalVisible(true)}
                                className="w-100 w-sm-auto"
                                size="sm"
                                style={{
                                    fontSize: '0.875rem',
                                    padding: '0.375rem 0.75rem',
                                    minWidth: 'auto'
                                }}
                            >
                                Add Waste
                            </CButton>
                        </div>
                        <div className="d-flex gap-2">
                            <CButton
                                color="info"
                                onClick={exportToCSV}
                                size="sm"
                                style={{
                                    fontSize: '0.875rem',
                                    padding: '0.375rem 0.75rem',
                                    minWidth: 'auto'
                                }}
                            >
                                Export to CSV
                            </CButton>
                            <CButton
                                color="secondary"
                                onClick={exportToPDF}
                                size="sm"
                                style={{
                                    fontSize: '0.875rem',
                                    padding: '0.375rem 0.75rem',
                                    minWidth: 'auto'
                                }}
                            >
                                Export to PDF
                            </CButton>
                        </div>
                    </div>
                </div>

                {/* Data Grid - Mobile Responsive */}
                <CRow>
                    <CCol xs={12}>
                        <div
                            style={{
                                height: 'auto',
                                width: '100%',
                                backgroundColor: 'white',
                                overflow: 'auto'
                            }}
                            className="table-responsive"
                        >
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
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    pagination
                                    pageSize={5}
                                    rowsPerPageOptions={[5, 10, 20]}
                                    slots={{
                                        toolbar: CustomToolbar,
                                    }}
                                    disableSelectionOnClick
                                    autoHeight
                                    sx={{
                                        '& .MuiDataGrid-root': {
                                            border: 'none',
                                        },
                                        '& .MuiDataGrid-cell': {
                                            borderBottom: '1px solid #f0f0f0',
                                        },
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: '#f8f9fa',
                                            borderBottom: '2px solid #dee2e6',
                                        },
                                        '@media (max-width: 768px)': {
                                            '& .MuiDataGrid-cell': {
                                                fontSize: '12px',
                                                padding: '4px',
                                            },
                                            '& .MuiDataGrid-columnHeader': {
                                                fontSize: '12px',
                                                padding: '4px',
                                            },
                                            '& .MuiDataGrid-row': {
                                                minHeight: '40px',
                                            },
                                        },
                                        '@media (max-width: 480px)': {
                                            '& .MuiDataGrid-cell': {
                                                fontSize: '10px',
                                                padding: '2px',
                                            },
                                            '& .MuiDataGrid-columnHeader': {
                                                fontSize: '10px',
                                                padding: '2px',
                                            },
                                            '& .MuiDataGrid-row': {
                                                minHeight: '35px',
                                            },
                                        },
                                    }}
                                />
                            )}
                        </div>
                    </CCol>
                </CRow>

                {renderAddWasteModal()}
                {renderEditWasteModal()}
                {renderDeleteWasteModal()}
            </CContainer>
        </>
    );
};

export default Waste;