import React, { useEffect, useState } from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CContainer,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { createQrCode, fetchQrCodes, deleteQrCode } from '../../redux/slices/qrSlice'

export default function QRCode() {
  const [modalVisible, setModalVisible] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false)
  const [selectedQr, setSelectedQr] = useState(null)
  const [tableNumber, setTableNumber] = useState('')
  const [previewQr, setPreviewQr] = useState(null)
  const [saving, setSaving] = useState(false)

  const { qrList, loading } = useSelector((state) => state.qr)
  const token = localStorage.getItem("authToken")
  const theme = useSelector((state) => state.theme.theme)

  const dispatch = useDispatch()
console.log(token)
  // Fetch QR codes on mount
  useEffect(() => {
      dispatch(fetchQrCodes(token))
  }, [dispatch, token])

  // Save QR code
  const handleSave = async () => {
    if (!tableNumber) {
      alert('Please enter a valid table number.')
      return
    }

    setSaving(true)
    const result = await dispatch(createQrCode({ tableNumber }))

    setSaving(false)

    if (result.meta.requestStatus === 'fulfilled') {
      setModalVisible(false)
      setTableNumber('')
      setPreviewQr(result.payload) // show preview immediately
    } else {
      alert(result.payload || 'Failed to create QR code')
    }
  }

  // Delete QR code
  const handleDelete = async () => {
    if (selectedQr) {
      await dispatch(deleteQrCode(selectedQr.id))
      setConfirmDeleteModalVisible(false)
      setActionModalVisible(false)
      dispatch(fetchQrCodes(restaurantId))
      setPreviewQr(null)
    }
  }

  // Download QR code as PNG
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

  // Click on a QR to open action modal
  const handleQrClick = (qr) => {
    setSelectedQr(qr)
    setActionModalVisible(true)
  }

  return (
   <div className="p-4">
  {/* Heading */}
  <h1 className="fs-3 fw-bold text-center mb-4">Generate QR for Table</h1>

  {/* Loader */}
  {loading ? (
    <div className="d-flex justify-content-center my-5">
      <CSpinner color="primary" />
    </div>
  ) : (
    <CRow className="g-4 justify-content-center">
      {/* Render QR containers */}
      {Array.isArray(qrList) &&
        qrList.map((qr) => (
          <CCol
            key={qr.id || qr._id}
            xs={6}
            sm={4}
            md={3}
            lg={2}
            className="d-flex justify-content-center"
          >
            <CContainer
              className={`d-flex flex-column align-items-center justify-content-center shadow-sm border rounded-3 transition-all ${
                theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"
              }`}
              style={{
                width: "100%",
                maxWidth: "10rem",
                height: "10rem",
                cursor: "pointer",
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
            </CContainer>
          </CCol>
        ))}

      {/* Add QR Code button */}
      <CCol xs={6} sm={4} md={3} lg={2} className="d-flex justify-content-center">
        <CContainer
          className="d-flex align-items-center justify-content-center shadow-sm border rounded-3 bg-light hover-shadow"
          style={{
            width: "100%",
            maxWidth: "10rem",
            height: "10rem",
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

  {/* Modal for Adding QR */}
  <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
    <CModalHeader className="d-flex justify-content-between align-items-center">
      <h2 className="fs-5 fw-bold">Generate QR</h2>
    </CModalHeader>
    <CModalBody>
      <CFormInput
        type="text"
        placeholder="Enter Table Number"
        value={tableNumber}
        onChange={(e) => setTableNumber(e.target.value)}
        className="mb-3"
      />
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" onClick={() => setModalVisible(false)}>
        Close
      </CButton>
      <CButton color="primary" onClick={handleSave} disabled={saving}>
        {saving ? <CSpinner size="sm" /> : "Save"}
      </CButton>
    </CModalFooter>
  </CModal>

  {/* Modal for Actions */}
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
          setConfirmDeleteModalVisible(true);
          setActionModalVisible(false);
        }}
      >
        Delete
      </CButton>
      <CButton color="primary" onClick={handleDownload}>
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
      <h2 className="fs-5 fw-bold">Confirm Delete</h2>
    </CModalHeader>
    <CModalBody className="text-center">
      Are you sure you want to delete the QR Code for{" "}
      <strong>Table {selectedQr?.tableNumber}</strong>?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" onClick={() => setConfirmDeleteModalVisible(false)}>
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
