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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilTrash } from "@coreui/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
    if (!selectedSupplier) return;
    await dispatch(deleteSupplier(selectedSupplier.supplierId));
    await dispatch(fetchSuppliers({ restaurantId }));
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
    <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
      <CModalHeader>
        <CModalTitle>Add Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          className="mb-3"
          placeholder="Supplier Name"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Raw Item"
          name="rawItem"
          value={formData.rawItem}
          onChange={handleChange}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setModalVisible(false)}>
          Close
        </CButton>
        <CButton color="primary" onClick={handleSaveSupplier} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  const renderEditSupplierModal = () => (
    <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
      <CModalHeader>
        <CModalTitle>Edit Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          className="mb-3"
          placeholder="Supplier Name"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
        <CFormInput
          className="mb-3"
          placeholder="Raw Item"
          name="rawItem"
          value={formData.rawItem}
          onChange={handleChange}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
          Close
        </CButton>
        <CButton color="primary" onClick={handleUpdateSupplier} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  const renderDeleteSupplierModal = () => (
    <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
      <CModalHeader>
        <CModalTitle>Delete Supplier</CModalTitle>
      </CModalHeader>
      <CModalBody>Are you sure you want to delete this supplier?</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={handleDeleteSupplier}>
          Delete
        </CButton>
      </CModalFooter>
    </CModal>
  )

  const columns = [
    { field: 'id', headerName: 'Supplier ID', flex: 1 },
    { field: 'supplierName', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'phoneNumber', headerName: 'Phone Number', flex: 1 },
    { field: 'rawItem', headerName: 'Raw Items', flex: 1 },
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
              setSelectedSupplier(params.row)
              setFormData({
                supplierName: params.row.supplierName,
                email: params.row.email,
                phoneNumber: params.row.phoneNumber,
                rawItem: params.row.rawItem,
              })
              setEditModalVisible(true)
            }}
          >
            <CIcon icon={cilPencil} />
          </CButton>
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedSupplier(params.row)
              setDeleteModalVisible(true)
            }}
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
    },
  ]

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
        <h2>Suppliers</h2>
        <CButton color="primary" onClick={() => setModalVisible(true)}>
          Add Supplier
        </CButton>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <CButton color="info" onClick={exportToCSV}>
          Export to CSV
        </CButton>
        <CButton color="secondary" onClick={exportToPDF}>
          Export to PDF
        </CButton>
      </div>
      <div style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}>
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
          />
        )}
      </div>

      {renderAddSupplierModal()}
      {renderEditSupplierModal()}
      {renderDeleteSupplierModal()}
    </div>
  )
}

export default Supplier