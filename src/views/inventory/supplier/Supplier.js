import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../redux/slices/supplierSlice";
import CustomToolbar from "../../../utils/CustomToolbar";
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CFormInput,
  CSpinner,
  CContainer,
  CRow,
  CCol,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilTrash } from "@coreui/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

const Supplier = () => {
  const dispatch = useDispatch();
  const { suppliers, loading } = useSelector((state) => state.suppliers);
  const restaurantId = useSelector((state) => state.auth.restaurantId);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    email: "",
    phoneNumber: "",
    rawItem: "",
  });
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Fetch suppliers
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchSuppliers({ restaurantId }));
    }
  }, [dispatch, restaurantId]);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save supplier
  const handleSaveSupplier = async () => {
    await dispatch(addSupplier({ restaurantId, ...formData }));
    await dispatch(fetchSuppliers({ restaurantId }));
    setModalVisible(false);
    setFormData({ supplierName: "", email: "", phoneNumber: "", rawItem: "" });
  };

  // Update supplier
  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;
    await dispatch(
      updateSupplier({
        supplierId: selectedSupplier.supplierId,
        updates: formData,
      })
    );
    await dispatch(fetchSuppliers({ restaurantId }));
    setEditModalVisible(false);
    setSelectedSupplier(null);
    setFormData({ supplierName: "", email: "", phoneNumber: "", rawItem: "" });
  };

  // Delete supplier
  const handleDeleteSupplier = async () => {
    await dispatch(deleteSupplier()); // 👈 no supplierId needed
    await dispatch(fetchSuppliers({ restaurantId: localStorage.getItem('restaurantId') }));

    setDeleteModalVisible(false);
    setSelectedSupplier(null);
  };


  const exportToCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Supplier ID,Name,Email,Phone Number,Raw Items'].join(',') +
      '\n' +
      suppliers
        .map((row) => [row.id, row.supplierName, row.email, row.phoneNumber, row.rawItem].join(','))
        .join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = 'suppliers.csv'
    link.click()
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text('Suppliers Management', 10, 10)
    const tableColumn = ['Supplier ID', 'Name', 'Email', 'Phone Number', 'Raw Items']
    const tableRows = suppliers.map((row) => [
      row.id,
      row.supplierName,
      row.email,
      row.phoneNumber,
      row.rawItem,
    ])
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
    doc.save('suppliers.pdf')
  }

  const rows = suppliers.map((s) => ({
    id: s.supplierId || s._id, // use supplierId if available, otherwise fallback to _id
    ...s,
  }));

  const renderAddSupplierModal = () => (
    <CModal 
      visible={modalVisible} 
      onClose={() => setModalVisible(false)}
      size="lg"
      className="modal-responsive"
    >
      <CModalHeader>
        <CModalTitle>Add Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Supplier Name"
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
            />
          </CCol>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </CCol>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Raw Item"
              name="rawItem"
              value={formData.rawItem}
              onChange={handleChange}
            />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-center gap-2">
        <CButton 
          color="secondary" 
          onClick={() => setModalVisible(false)}
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
          onClick={handleSaveSupplier} 
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
  )

  const renderEditSupplierModal = () => (
    <CModal 
      visible={editModalVisible} 
      onClose={() => setEditModalVisible(false)}
      size="lg"
      className="modal-responsive"
    >
      <CModalHeader>
        <CModalTitle>Edit Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Supplier Name"
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
            />
          </CCol>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </CCol>
          <CCol xs={12} sm={6} className="mb-3">
            <CFormInput
              placeholder="Raw Item"
              name="rawItem"
              value={formData.rawItem}
              onChange={handleChange}
            />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-center gap-2">
        <CButton 
          color="secondary" 
          onClick={() => setEditModalVisible(false)}
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
          onClick={handleUpdateSupplier} 
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
  )

  const renderDeleteSupplierModal = () => (
    <CModal 
      visible={deleteModalVisible} 
      onClose={() => setDeleteModalVisible(false)}
      className="modal-responsive"
    >
      <CModalHeader>
        <CModalTitle>Delete Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>Are you sure you want to delete this supplier?</CModalBody>
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
          onClick={handleDeleteSupplier}
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
  )

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      flex: 0.8,
      minWidth: 60,
      headerClassName: 'mobile-header',
      cellClassName: 'mobile-cell'
    },
    { 
      field: 'supplierName', 
      headerName: 'Name', 
      flex: 1.2,
      minWidth: 120,
      headerClassName: 'mobile-header',
      cellClassName: 'mobile-cell'
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1.5,
      minWidth: 150,
      headerClassName: 'mobile-header',
      cellClassName: 'mobile-cell'
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Phone', 
      flex: 1,
      minWidth: 100,
      headerClassName: 'mobile-header',
      cellClassName: 'mobile-cell'
    },
    { 
      field: 'rawItem', 
      headerName: 'Raw Items', 
      flex: 1,
      minWidth: 100,
      headerClassName: 'mobile-header',
      cellClassName: 'mobile-cell'
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
              setSelectedSupplier(params.row)
              setFormData({
                supplierName: params.row.supplierName,
                email: params.row.email,
                phoneNumber: params.row.phoneNumber,
                rawItem: params.row.rawItem,
              })
              setEditModalVisible(true)
            }}
            style={{ minWidth: '30px', padding: '4px' }}
          >
            <CIcon icon={cilPencil} size="sm" />
          </CButton>
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedSupplier(params.row)
              setDeleteModalVisible(true)
            }}
            style={{ minWidth: '30px', padding: '4px' }}
          >
            <CIcon icon={cilTrash} size="sm" />
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{mobileStyles}</style>
      <CContainer fluid className="px-2 px-md-3">
      {/* Header Section - Mobile Responsive */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h2 className="mb-2 mb-md-0">Suppliers</h2>
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
              Add Supplier
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
                  // Mobile responsive styles
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

      {renderAddSupplierModal()}
      {renderEditSupplierModal()}
      {renderDeleteSupplierModal()}
      </CContainer>
    </>
  )
}

export default Supplier