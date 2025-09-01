import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchCustomers, deleteCustomer } from '../../redux/slices/customerSlice'
import { CButton, CSpinner, CModal, CModalHeader, CModalBody, CModalFooter , CForm, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilEnvelopeOpen, cilChatBubble, cilTrash } from '@coreui/icons'
import CustomToolbar from '../../utils/CustomToolbar'
import { sendBulkEmail, resetBulkEmailStatus } from '../../redux/slices/SendBulkEmailSlice'
import { useMediaQuery } from '@mui/material'

const Customer = () => {
  const dispatch = useDispatch()
  const { customers, loading } = useSelector((state) => state.customers)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const isMobile = useMediaQuery('(max-width:600px)')

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const [bulkEmailModalVisible, setBulkEmailModalVisible] = useState(false)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchCustomers({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  const sendEmail = (email) => {
    window.location.href = `mailto:${email}?subject=Hello&body=Hi there!`
  }

  const sendWhatsApp = (phoneNumber) => {
    const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, '') // Ensure the number is in the correct format
    window.open(`https://wa.me/${sanitizedPhone}?text=Hi!`, '_blank')
  }

  const handleDelete = () => {
    if (selectedCustomerId) {
      dispatch(deleteCustomer({ id: selectedCustomerId })).then(() => {
        setDeleteModalVisible(false)
        setSelectedCustomerId(null)
      })
    }
  }

  const openDeleteModal = (id) => {
    setSelectedCustomerId(id)
    setDeleteModalVisible(true)
  }

  // Static method to generate serial numbers
  let serialCounter = 1
  const generateSerialNumber = () => {
    return serialCounter++
  }
  const sendbulkEmail = () => {
      setBulkEmailModalVisible(true)

  }
const handleSendBulkEmail = () => {
  if (!subject || !title || !body) {
    alert('Please fill in all fields')
    return
  }

  try {
     dispatch(sendBulkEmail({ restaurantId, subject, title, body }));
    setBulkEmailModalVisible(false);
    setSubject('');
    setTitle('');
    setBody('');
  } catch (error) {
    console.error('Send bulk email failed:', error)
  }
}


  const columns = [
    {
      field: 'sno',
      headerName: 'S.No.',
      flex: isMobile ? undefined : 0.5,
      minWidth: isMobile ? 80 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.sno, // Use the `sno` from rows
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.name || 'N/A',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.email || 'N/A',
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone Number',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.phoneNumber || 'N/A',
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.address || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: isMobile ? undefined : 1.5,
      minWidth: isMobile ? 225 : undefined,
      headerClassName: 'header-style',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <CButton color="primary" size="sm" onClick={() => sendEmail(params.row.email)}>
            <CIcon icon={cilEnvelopeOpen} /> Email
          </CButton>
          <CButton color="success" size="sm" onClick={() => sendWhatsApp(params.row.phoneNumber)}>
            <CIcon icon={cilChatBubble} /> WhatsApp
          </CButton>
          <CButton color="danger" size="sm" onClick={() => openDeleteModal(params.row.id)}>
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Customers</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {/* create a button for sending bulk emails */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <CButton color="primary" onClick={sendbulkEmail}>
              <CIcon icon={cilEnvelopeOpen} /> Send Bulk Emails
            </CButton>
          </div>

          <DataGrid
            style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}
            rows={customers?.map((customer) => ({
              ...customer,
              sno: generateSerialNumber(),
            }))}
            columns={columns}
            getRowId={(row) => row.id || row.data?.id || Math.random()}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{ Toolbar: CustomToolbar }}
            sx={{
              '& .header-style': {
                fontWeight: 'bold',
                fontSize: '1.1rem',
              },
              '& .MuiDataGrid-root': {
                overflowX: 'auto', // Enable horizontal scrolling
              },
              '@media (max-width: 600px)': {
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '10px',
                },
              },
            }}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        backdrop="static"
      >
        <CModalHeader>Confirm Deletion</CModalHeader>
        <CModalBody>Are you sure you want to delete this customer?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      {/* bulk email modal */}
      <CModal
  visible={bulkEmailModalVisible}
  onClose={() => setBulkEmailModalVisible(false)}
  backdrop="static"
>
  <CModalHeader>Send Bulk Email</CModalHeader>
  <CModalBody>
    <CForm>
      <CFormInput
        type="text"
        id="subject"
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <CFormInput
        type="text"
        id="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <CFormInput
        type="text"
        id="body"
        label="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </CForm>
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" onClick={() => setBulkEmailModalVisible(false)}>
      Cancel
    </CButton>
    <CButton color="primary" onClick={handleSendBulkEmail}>
      Send
    </CButton>
  </CModalFooter>
</CModal>

    </div>
  )
}

export default Customer
