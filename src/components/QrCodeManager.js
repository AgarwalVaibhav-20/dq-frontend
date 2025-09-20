import React, { useEffect, useState } from 'react';
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CFormSelect,
  CContainer,
  CRow,
  CCol,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilDownload, cilTrash } from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createQrCode, 
  fetchQrCodes, 
  deleteQrCode 
} from '../../redux/slices/qrSlice';
import { fetchTables } from '../../redux/slices/tableSlice';

export default function QRCodeManager() {
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    tableId: '',
  });
  const [previewQr, setPreviewQr] = useState(null);
  const [saving, setSaving] = useState(false);

  const { qrList, loading, error } = useSelector((state) => state.qr);
  const { tables } = useSelector((state) => state.tables);
  const token = localStorage.getItem("authToken");
  const restaurantId = localStorage.getItem("restaurantId");
  const theme = useSelector((state) => state.theme.theme);

  const dispatch = useDispatch();

  // Fetch QR codes and tables on mount
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchQrCodes({ restaurantId, token }));
      dispatch(fetchTables({ restaurantId, token }));
    }
  }, [dispatch, restaurantId, token]);

  // Save QR code
  const handleSave = async () => {
    if (!formData.tableNumber) {
      alert('Please enter a valid table number.');
      return;
    }

    setSaving(true);
    try {
      const result = await dispatch(createQrCode({ 
        restaurantId,
        tableNumber: formData.tableNumber,
        tableId: formData.tableId || null,
        token 
      }));

      if (result.meta.requestStatus === 'fulfilled') {
        setModalVisible(false);
        setFormData({ tableNumber: '', tableId: '' });
        setPreviewQr(result.payload);
      } else {
        alert(result.payload || 'Failed to create QR code');
      }
    } catch (error) {
      alert('Failed to create QR code');
    }
    setSaving(false);
  };

  // Delete QR code
  const handleDelete = async () => {
    if (selectedQr) {
      try {
        await dispatch(deleteQrCode({ 
          restaurantId,
          qrId: selectedQr._id || selectedQr.id,
          token 
        }));
        setConfirmDeleteModalVisible(false);
        setActionModalVisible(false);
        setPreviewQr(null);
      } catch (error) {
        alert('Failed to delete QR code');
      }
    }
  };

  // Download QR code as PNG
  const handleDownload = () => {
    const qr = selectedQr || previewQr;
    if (qr && qr.qrImage) {
      const link = document.createElement('a');
      link.href = qr.qrImage;
      link.download = `Table-${qr.tableNumber}-QR.png`;
      link.click();
      setActionModalVisible(false);
    }
  };

  // Click on a QR to open action modal
  const handleQrClick = (qr) => {
    setSelectedQr(qr);
    setActionModalVisible(true);
  };

  // Handle table selection change
  const handleTableSelect = (e) => {
    const tableId = e.target.value;
    const selectedTable = tables.find(t => t._id === tableId);
    
    setFormData(prev => ({
      ...prev,
      tableId,
      tableNumber: selectedTable ? selectedTable.tableNumber : prev.tableNumber
    }));
  };

  return (
    <div className="p-4">
      {/* Heading */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-bold">QR Code Management</h1>
        <CButton
          color="primary"
          onClick={() => setModalVisible(true)}
          className="d-flex align-items-center gap-2"
        >
          <CIcon icon={cilPlus} size="sm" />
          Generate QR Code
        </CButton>
      </div>

      {/* Error Alert */}
      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      )}

      {/* Statistics */}
      <CRow className="mb-4">
        <CCol md={3}>
          <div className="bg-light p-3 rounded text-center">
            <h4 className="fw-bold text-primary">{qrList.length}</h4>
            <p className="mb-0 text-muted">Total QR Codes</p>
          </div>
        </CCol>
        <CCol md={3}>
          <div className="bg-light p-3 rounded text-center">
            <h4 className="fw-bold text-success">
              {qrList.reduce((sum, qr) => sum + (qr.scanCount || 0), 0)}
            </h4>
            <p className="mb-0 text-muted">Total Scans</p>
          </div>
        </CCol>
      </CRow>

      {/* Loader */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <CRow className="g-4">
          {/* Render QR containers */}
          {Array.isArray(qrList) &&
            qrList.map((qr) => (
              <CCol
                key={qr._id || qr.id}
                xs={6}
                sm={4}
                md={3}
                lg={2}
                className="d-flex justify-content-center"
              >
                <CContainer
                  className={`d-flex flex-column align-items-center justify-content-center shadow-sm border rounded-3 position-relative ${
                    theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"
                  }`}
                  style={{
                    width: "100%",
                    maxWidth: "12rem",
                    height: "12rem",
                    cursor: "pointer",
                  }}
                  onClick={() => handleQrClick(qr)}
                >
                  <div className="fw-semibold mb-2 text-truncate text-center">
                    {qr.tableNumber}
                  </div>
                  <img
                    src={qr.qrImage}
                    alt={`QR ${qr.tableNumber}`}
                    width={80}
                    height={80}
                    className="img-fluid mb-2"
                  />
                  <small className="text-muted">
                    Scans: {qr.scanCount || 0}
                  </small>
                  {qr.lastScanned && (
                    <small className="text-muted">
                      Last: {new Date(qr.lastScanned).toLocaleDateString()}
                    </small>
                  )}
                </CContainer>
              </CCol>
            ))}

          {/* Add QR Code button */}
          <CCol xs={6} sm={4} md={3} lg={2} className="d-flex justify-content-center">
            <CContainer
              className="d-flex align-items-center justify-content-center shadow-sm border rounded-3 bg-light hover-shadow"
              style={{
                width: "100%",
                maxWidth: "12rem",
                height: "12rem",
                cursor: "pointer",
              }}
              onClick={() => setModalVisible(true)}
            >
              <CIcon icon={cilPlus} size="xxl" className="text-primary" />
            </CContainer>
          </CCol>
        </CRow>
      )}

      {/* Preview newly created QR */}
      {previewQr && (
        <div className="text-center my-5 p-4 bg-light rounded">
          <h5 className="fw-semibold mb-3">
            🎉 QR Code Created Successfully!
          </h5>
          <p className="text-muted mb-3">Table: {previewQr.tableNumber}</p>
          <img
            src={previewQr.qrImage}
            alt={`Preview ${previewQr.tableNumber}`}
            width={150}
            height={150}
            className="img-fluid rounded shadow-sm mb-3"
          />
          <div className="d-flex gap-2 justify-content-center">
            <CButton
              color="primary"
              size="sm"
              onClick={() => handleDownload()}
            >
              <CIcon icon={cilDownload} className="me-1" />
              Download
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={() => setPreviewQr(null)}
            >
              Close
            </CButton>
          </div>
        </div>
      )}

      {/* Modal for Creating QR */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <h2 className="fs-5 fw-bold">Generate QR Code</h2>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Select Existing Table (Optional)</label>
            <CFormSelect
              value={formData.tableId}
              onChange={handleTableSelect}
            >
              <option value="">-- Select a table --</option>
              {tables.map((table) => (
                <option key={table._id} value={table._id}>
                  {table.tableNumber} (Capacity: {table.capacity})
                </option>
              ))}
            </CFormSelect>
            <small className="text-muted">
              Or enter a custom table number below
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">Table Number *</label>
            <CFormInput
              type="text"
              placeholder="Enter Table Number"
              value={formData.tableNumber}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tableNumber: e.target.value 
              }))}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            variant="outline" 
            onClick={() => setModalVisible(false)}
          >
            Close
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <CSpinner size="sm" /> : "Generate QR Code"}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Actions */}
      <CModal visible={actionModalVisible} onClose={() => setActionModalVisible(false)}>
        <CModalHeader>
          <h2 className="fs-5 fw-bold">QR Code Actions</h2>
        </CModalHeader>
        <CModalBody className="text-center">
          <img
            src={selectedQr?.qrImage}
            alt={`QR ${selectedQr?.tableNumber}`}
            width={120}
            height={120}
            className="img-fluid mb-3"
          />
          <h5>Table: {selectedQr?.tableNumber}</h5>
          <p className="text-muted mb-0">Scans: {selectedQr?.scanCount || 0}</p>
          {selectedQr?.lastScanned && (
            <p className="text-muted">
              Last scanned: {new Date(selectedQr.lastScanned).toLocaleString()}
            </p>
          )}
        </CModalBody>
        <CModalFooter className="justify-content-between">
          <CButton
            color="danger"
            variant="outline"
            onClick={() => {
              setConfirmDeleteModalVisible(true);
              setActionModalVisible(false);
            }}
          >
            <CIcon icon={cilTrash} className="me-1" />
            Delete
          </CButton>
          <CButton color="primary" onClick={handleDownload}>
            <CIcon icon={cilDownload} className="me-1" />
            Download
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Confirmation Modal for Delete */}
      <CModal
        visible={confirmDeleteModalVisible}
        onClose={() => setConfirmDeleteModalVisible(false)}
      >
        <CModalHeader>
          <h2 className="fs-5 fw-bold text-danger">Confirm Delete</h2>
        </CModalHeader>
        <CModalBody className="text-center">
          <p>Are you sure you want to delete the QR Code for</p>
          <strong className="text-danger fs-5">Table {selectedQr?.tableNumber}?</strong>
          <p className="text-muted mt-2 mb-0">This action cannot be undone.</p>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            variant="outline" 
            onClick={() => setConfirmDeleteModalVisible(false)}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            <CIcon icon={cilTrash} className="me-1" />
            Delete QR Code
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}