import React, { useEffect, useState } from 'react'
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
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilHome } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { addTable, getQrs, getTablesByFloor, deleteQr } from '../../redux/slices/qrSlice'
import { getFloors, addFloor } from '../../redux/slices/floorSlices'

export default function QRCode() {
  const [modalVisible, setModalVisible] = useState(false)
  const [floorModalVisible, setFloorModalVisible] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false)
  const [selectedQr, setSelectedQr] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [error, setError] = useState('')
  const [floorId, setFloorId] = useState('')
  const [name, setname] = useState('')
  const [previewQr, setPreviewQr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingFloor, setSavingFloor] = useState(false)

  const { qrList = [], loading } = useSelector((state) => state.qr)
  const { floors = [], loading: floorsLoading } = useSelector((state) => state.floors)
  const token = localStorage.getItem("authToken")
  const theme = useSelector((state) => state.theme.theme)

  // Get restaurantId from localStorage or user state
  const restaurantId = localStorage.getItem("restaurantId")
  const dispatch = useDispatch()
  const getFloorIdFromQr = (qr) => {
    return qr.floorId?._id || qr.floorId || qr.floor
  }

  // Helper function to get floor name from QR object
  const getFloorNameFromQr = (qr) => {
    return qr.floorId?.name || 'Unknown Floor'
  }

  // Fetch QR codes + floors on mount
  useEffect(() => {
    if (restaurantId) {
      dispatch(getQrs({ restaurantId }))
      dispatch(getFloors(restaurantId))
    }
  }, [dispatch, token, restaurantId])
  // Save Floor
  const handleSaveFloor = async () => {
    if (!name.trim()) {
      alert('Please enter a valid floor name.');
      return;
    }

    if (!restaurantId) {
      alert('Restaurant ID is required. Please ensure you are logged in properly.');
      return;
    }

    setSavingFloor(true);

    const result = await dispatch(addFloor({
      id: restaurantId,
      name: name.trim()
    }));

    setSavingFloor(false);

    if (result.meta.requestStatus === 'fulfilled') {
      setFloorModalVisible(false);
      setname('');
      dispatch(getFloors(restaurantId));
    } else {
      console.error('Floor creation error:', result.payload);
      let errorMessage = result.payload?.message || 'Failed to create floor';
      alert(errorMessage);
    }
  };

  // Save QR code
  const handleSave = async () => {
    if (!floorId || !tableNumber) {
      alert('Please select a floor and enter a valid table number.')
      return
    }

    setSaving(true)
    const result = await dispatch(addTable({ restaurantId, floorId, tableNumber }))

    setSaving(false)

    if (result.meta.requestStatus === 'fulfilled') {
      setModalVisible(false)
      setTableNumber('')
      setFloorId('')
      setPreviewQr(result.payload)
      // Refresh QR list to show the new table
      dispatch(getQrs({ restaurantId }))
    } else {
      alert(result.payload.message || 'Failed to create QR code')
    }
  }

  // Delete QR code
  const handleDelete = async () => {
    if (selectedQr) {
      await dispatch(deleteQr(selectedQr._id))
      setConfirmDeleteModalVisible(false)
      setActionModalVisible(false)
      dispatch(getQrs({ restaurantId }))
      setPreviewQr(null)
    }
  }

  // Download QR code
  const handleDownload = () => {
    const qr = selectedQr || previewQr
    if (qr) {
      const link = document.createElement('a')
      link.href = qr.qrImage
      link.download = `Table-${qr.tableNumber}.png`
      link.click()
      setActionModalVisible(false)
    }
  }

  // Click on a QR
  const handleQrClick = (qr) => {
    setSelectedQr(qr)
    setActionModalVisible(true)
  }

  // FIXED: Get QR codes for a specific floor
  const getQRsForFloor = (floorId) => {
    const filteredQrs = qrList.filter((qr) => {
      const qrFloorId = getFloorIdFromQr(qr)
      const matches = qrFloorId === floorId
      return matches
    })
    return filteredQrs
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-bold">Generate QR for Tables</h1>
        <div className="d-flex gap-2">
          {/* Create Floor Button */}
          <CButton
            color="success"
            variant="outline"
            onClick={() => setFloorModalVisible(true)}
            className="d-flex align-items-center"
          >
            <CIcon icon={cilHome} className="me-2" />
            Create Floor
          </CButton>

          {/* Add QR Code Button - Only show if floors exist and restaurantId is available */}
          {restaurantId && floors && floors.length > 0 && (
            <CButton
              color="primary"
              onClick={() => setModalVisible(true)}
              className="d-flex align-items-center"
            >
              <CIcon icon={cilPlus} className="me-2" />
              Add QR Code
            </CButton>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Debug: restaurantId = {restaurantId}, totalQRs = {qrList.length}, totalFloors = {floors.length}
      </div>

      {/* Show loading or no restaurant message */}
      {!restaurantId ? (
        <CCard className="text-center my-5">
          <CCardHeader>
            <h4 className="mb-0">Restaurant Not Found</h4>
          </CCardHeader>
          <CCardBody>
            <p className="fs-5 text-muted mb-3">
              Unable to load restaurant information. Please ensure you are logged in properly.
            </p>
          </CCardBody>
        </CCard>
      ) : floorsLoading || loading ? (
        <div className="d-flex justify-content-center my-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <>
          {/* Show message if no floors exist */}
          {restaurantId && floors.length === 0 && !floorsLoading && (
            <CCard className="text-center my-5">
              <CCardHeader>
                <h4 className="mb-0">No Floors Created Yet</h4>
              </CCardHeader>
              <CCardBody>
                <p className="fs-5 text-muted mb-3">
                  You need to create at least one floor before generating QR codes for tables.
                </p>
                <CButton
                  color="success"
                  size="lg"
                  onClick={() => setFloorModalVisible(true)}
                  className="d-flex align-items-center mx-auto"
                >
                  <CIcon icon={cilHome} className="me-2" />
                  Create Your First Floor
                </CButton>
              </CCardBody>
            </CCard>
          )}

          {/* FIXED: Group by floor with proper filtering */}
          {floors && floors.length > 0 && floors.map((floor) => {
            const floorQrs = getQRsForFloor(floor._id)
            return (
              <div key={floor._id} className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold mb-0">Floor: {floor.name}</h4>
                  <span className="badge bg-primary">{floorQrs.length} Tables</span>
                </div>

                {floorQrs.length > 0 ? (
                  <CRow className="g-4">
                    {floorQrs.map((qr) => (
                      <CCol
                        key={qr._id}
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        className="d-flex justify-content-center"
                      >
                        <CContainer
                          className={`d-flex flex-column align-items-center justify-content-center shadow-sm border rounded-3 transition-all ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white text-dark'
                            }`}
                          style={{
                            width: '100%',
                            maxWidth: '10rem',
                            height: '10rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleQrClick(qr)}
                        >
                          <div className="fw-semibold mb-2 text-truncate">
                            Table {qr.tableNumber}
                          </div>
                          <img
                            src={qr.qrImage}
                            alt={`QR Table ${qr.tableNumber}`}
                            width={80}
                            className="img-fluid"
                          />
                          {/* Debug info for each QR */}
                          <div style={{ fontSize: '8px', color: '#999' }}>
                            Floor ID: {getFloorIdFromQr(qr)}
                          </div>
                        </CContainer>
                      </CCol>
                    ))}
                  </CRow>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-2">No tables created for this floor yet.</p>
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFloorId(floor._id) // Pre-select this floor
                        setModalVisible(true)
                      }}
                    >
                      Add First Table
                    </CButton>
                  </div>
                )}
              </div>
            )
          })}

          {/* Show message if floors exist but no QR codes */}
          {floors.length > 0 && qrList && qrList.length === 0 && (
            <div className="text-center my-5">
              <p className="fs-5 text-muted">No QR codes generated yet.</p>
              <p className="text-muted">Click the "Add QR Code" button above to create your first QR code.</p>
            </div>
          )}
        </>
      )}

      {/* Preview newly created QR */}
      {previewQr && (
        <div className="text-center my-5">
          <h5 className="fw-semibold mb-3">
            Preview Table {previewQr.tableNumber}
          </h5>
          <img
            src={previewQr.qrImage}
            alt={`Preview Table ${previewQr.tableNumber}`}
            width={150}
            className="img-fluid rounded shadow-sm"
          />
        </div>
      )}

      {/* Modal for Creating Floor */}
      <CModal visible={floorModalVisible} onClose={() => setFloorModalVisible(false)}>
        <CModalHeader>
          <h2 className="fs-5 fw-bold">Create New Floor</h2>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            type="text"
            placeholder="Enter Floor Name (e.g., Ground Floor, First Floor, etc.)"
            value={name}
            onChange={(e) => setname(e.target.value)}
            className="mb-3"
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setFloorModalVisible(false)
              setname('')
            }}
          >
            Cancel
          </CButton>
          <CButton color="success" onClick={handleSaveFloor} disabled={savingFloor}>
            {savingFloor ? <CSpinner size="sm" /> : 'Create Floor'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Adding QR */}
      <CModal visible={modalVisible} backdrop="static" onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <h2 className="fs-5 fw-bold">Generate QR Code for Table</h2>
        </CModalHeader>
        <CModalBody>
          <CFormSelect
            className="mb-3"
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
          >
            <option value="">Select Floor</option>
            {floors && floors.length > 0 && floors.map((floor) => (
              <option key={floor._id} value={floor._id}>
                {floor.name}
              </option>
            ))}
          </CFormSelect>
          <CFormInput
            type="text"
            placeholder="Enter Table Number"
            value={tableNumber}
            //onChange={(e) => setTableNumber(e.target.value)}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setTableNumber(val);
                if (val === '') {
                  setError('Table number is required')
                } else {
                  setError('')
                }
              } else {
                setError('Only numbers are allowed')
              }
            }}
            className={`mb-1 ${error ? 'is-invalid' : ''}`}
          />
          {error && <div style={{ color: 'red', fontSize: '12px' }}>{error}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setModalVisible(false)
              setTableNumber('')
              setFloorId('')
            }}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Generate QR Code'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Action Modal */}
      <CModal visible={actionModalVisible} onClose={() => setActionModalVisible(false)}>
        <CModalHeader>
          <h2 className="fs-5 fw-bold">QR Code Actions</h2>
        </CModalHeader>
        <CModalBody className="text-center">
          Select an action for <strong>Table {selectedQr?.tableNumber}</strong>
        </CModalBody>
        <CModalFooter className="justify-content-between">
          <CButton
            color="danger"
            variant="outline"
            onClick={() => {
              setConfirmDeleteModalVisible(true)
              setActionModalVisible(false)
            }}
          >
            Delete
          </CButton>
          <CButton color="primary" onClick={handleDownload}>
            Download
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Confirm Delete Modal */}
      <CModal
        visible={confirmDeleteModalVisible}
        onClose={() => setConfirmDeleteModalVisible(false)}
      >
        <CModalHeader>
          <h2 className="fs-5 fw-bold">Confirm Delete</h2>
        </CModalHeader>
        <CModalBody className="text-center">
          Are you sure you want to delete the QR Code for{' '}
          <strong>Table {selectedQr?.tableNumber}</strong>?
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
            Confirm Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}