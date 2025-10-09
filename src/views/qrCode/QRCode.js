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
    <div className="p-2 p-md-4">
      {/* Mobile Responsive Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h1 className="fs-4 fs-md-3 fw-bold mb-0">Generate QR for Tables</h1>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          {/* Create Floor Button */}
          <CButton
            color="success"
            variant="outline"
            onClick={() => setFloorModalVisible(true)}
            className="d-flex align-items-center justify-content-center w-100 w-sm-auto"
            size="sm"
          >
            <CIcon icon={cilHome} className="me-2" />
            <span className="d-none d-sm-inline">Create Floor</span>
            <span className="d-sm-none">Floor</span>
          </CButton>

          {/* Add QR Code Button - Only show if floors exist and restaurantId is available */}
          {restaurantId && floors && floors.length > 0 && (
            <CButton
              color="primary"
              onClick={() => setModalVisible(true)}
              className="d-flex align-items-center justify-content-center w-100 w-sm-auto"
              size="sm"
            >
              <CIcon icon={cilPlus} className="me-2" />
              <span className="d-none d-sm-inline">Add QR Code</span>
              <span className="d-sm-none">Add QR</span>
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
                  <CRow className="g-2 g-md-4">
                    {floorQrs.map((qr) => (
                      <CCol
                        key={qr._id}
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        xl={2}
                        className="d-flex justify-content-center"
                      >
                        <CContainer
                          className={`d-flex flex-column align-items-center justify-content-center shadow-sm border rounded-3 transition-all ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white text-dark'
                            }`}
                          style={{
                            width: '100%',
                            maxWidth: '8rem',
                            minWidth: '6rem',
                            height: '8rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleQrClick(qr)}
                        >
                          <div className="fw-semibold mb-1 mb-md-2 text-truncate fs-6 fs-md-5">
                            Table {qr.tableNumber}
                          </div>
                          <img
                            src={qr.qrImage}
                            alt={`QR Table ${qr.tableNumber}`}
                            width={60}
                            className="img-fluid"
                            style={{ maxWidth: '60px', height: 'auto' }}
                          />
                          {/* Debug info for each QR - Hide on mobile */}
                          <div className="d-none d-md-block" style={{ fontSize: '8px', color: '#999' }}>
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

      {/* Modal for Creating Floor - Mobile Responsive */}
      <CModal 
        visible={floorModalVisible} 
        onClose={() => setFloorModalVisible(false)}
        size="lg"
        className="modal-fullscreen-sm-down"
      >
        <CModalHeader className="pb-2">
          <h2 className="fs-5 fw-bold mb-0">Create New Floor</h2>
        </CModalHeader>
        <CModalBody className="py-3">
          <CFormInput
            type="text"
            placeholder="Enter Floor Name (e.g., Ground Floor, First Floor, etc.)"
            value={name}
            onChange={(e) => setname(e.target.value)}
            className="mb-3"
            size="lg"
          />
        </CModalBody>
        <CModalFooter className="pt-2 d-flex flex-column flex-sm-row gap-2">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setFloorModalVisible(false)
              setname('')
            }}
            className="w-100 w-sm-auto order-2 order-sm-1"
          >
            Cancel
          </CButton>
          <CButton 
            color="success" 
            onClick={handleSaveFloor} 
            disabled={savingFloor}
            className="w-100 w-sm-auto order-1 order-sm-2"
          >
            {savingFloor ? <CSpinner size="sm" /> : 'Create Floor'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Adding QR - Mobile Responsive */}
      <CModal 
        visible={modalVisible} 
        backdrop="static" 
        onClose={() => setModalVisible(false)}
        size="lg"
        className="modal-fullscreen-sm-down"
      >
        <CModalHeader className="pb-2">
          <h2 className="fs-5 fw-bold mb-0">Generate QR Code for Table</h2>
        </CModalHeader>
        <CModalBody className="py-3">
          <CFormSelect
            className="mb-3"
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            size="lg"
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
            size="lg"
          />
          {error && <div style={{ color: 'red', fontSize: '12px' }}>{error}</div>}
        </CModalBody>
        <CModalFooter className="pt-2 d-flex flex-column flex-sm-row gap-2">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setModalVisible(false)
              setTableNumber('')
              setFloorId('')
            }}
            className="w-100 w-sm-auto order-2 order-sm-1"
          >
            Cancel
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleSave} 
            disabled={saving}
            className="w-100 w-sm-auto order-1 order-sm-2"
          >
            {saving ? <CSpinner size="sm" /> : 'Generate QR Code'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Action Modal - Mobile Responsive */}
      <CModal 
        visible={actionModalVisible} 
        onClose={() => setActionModalVisible(false)}
        size="md"
        className="modal-fullscreen-sm-down"
      >
        <CModalHeader className="pb-2">
          <h2 className="fs-5 fw-bold mb-0">QR Code Actions</h2>
        </CModalHeader>
        <CModalBody className="text-center py-3">
          <p className="mb-0">Select an action for <strong>Table {selectedQr?.tableNumber}</strong></p>
        </CModalBody>
        <CModalFooter className="pt-2 d-flex flex-column flex-sm-row gap-2 justify-content-between">
          <CButton
            color="danger"
            variant="outline"
            onClick={() => {
              setConfirmDeleteModalVisible(true)
              setActionModalVisible(false)
            }}
            className="w-100 w-sm-auto order-2 order-sm-1"
          >
            Delete
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleDownload}
            className="w-100 w-sm-auto order-1 order-sm-2"
          >
            Download
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Confirm Delete Modal - Mobile Responsive */}
      <CModal
        visible={confirmDeleteModalVisible}
        onClose={() => setConfirmDeleteModalVisible(false)}
        size="md"
        className="modal-fullscreen-sm-down"
      >
        <CModalHeader className="pb-2">
          <h2 className="fs-5 fw-bold mb-0">Confirm Delete</h2>
        </CModalHeader>
        <CModalBody className="text-center py-3">
          <p className="mb-0">Are you sure you want to delete the QR Code for{' '}
          <strong>Table {selectedQr?.tableNumber}</strong>?</p>
        </CModalBody>
        <CModalFooter className="pt-2 d-flex flex-column flex-sm-row gap-2">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setConfirmDeleteModalVisible(false)}
            className="w-100 w-sm-auto order-2 order-sm-1"
          >
            Cancel
          </CButton>
          <CButton 
            color="danger" 
            onClick={handleDelete}
            className="w-100 w-sm-auto order-1 order-sm-2"
          >
            Confirm Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}