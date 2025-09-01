import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import {
  fetchTransactionsByRestaurant,
  fetchTransactionDetails,
  deleteTransaction,
  fetchPOSTransactions,
} from '../../redux/slices/transactionSlice'
import { CSpinner, CModal, CModalBody, CModalHeader, CButton } from '@coreui/react'
import { CModalTitle, CModalFooter, CFormInput } from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilFile, cilTrash } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'
const Transactions = () => {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state) => state.transactions)

  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const auth = useSelector((state) => state.auth.auth)
  const theme = useSelector((state) => state.theme.theme)

  const [modalVisible, setModalVisible] = useState(false)
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)

  const isMobile = useMediaQuery('(max-width:600px)')

  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [note, setNote] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchTransactionsByRestaurant({ restaurantId }))
    }
  }, [dispatch, restaurantId])

  useEffect(() => {
    if (restaurantId) {
      dispatch(getRestaurantProfile({ restaurantId }))
    }
  }, [])
  const formatDate = (dateString) => {
    const date = new Date(dateString)

    const options = {
      year: 'numeric',
      month: 'short', // Mar
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }

    return date.toLocaleString('en-US', options)
  }

  const generateInvoicePDF = (transactionDetails) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160], // Receipt-style: 80mm width, dynamic height
    })

    const pageWidth = 80
    let y = 8
    const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
      // doc.setFont('helvetica', fontStyle)
      doc.setFont('Courier', fontStyle)
      doc.setFontSize(fontSize)
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    }

    const line = () => {
      doc.setLineWidth(0.1)
      doc.line(5, y, pageWidth - 5, y)
      y += 4
    }

    // Header

    centerText(restaurantProfile?.restName || 'Restaurant Name', y, 15)
    y += 5
    centerText(transactionDetails.restaurantAddress || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile.pinCode || 'XXXXXX'} `, y, 8)
    y += 4
    centerText(`Ph: ${transactionDetails.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    // Invoice title
    centerText('INVOICE', y, 10, 'bold')
    y += 6

    // Transaction Info
    centerText(`Date: ${new Date(transactionDetails.created_at).toLocaleString()}`, y, 8)
    y += 4
    centerText(`Table: ${transactionDetails?.tableNumber || 'N/A'}`, y, 8)
    y += 4
    centerText(`Customer: ${transactionDetails?.userName || 'Walk-in'}`, y, 8)
    y += 5
    line()

    // Order Items
    centerText('Items', y, 9, 'bold')
    y += 5

    transactionDetails.items?.forEach((item) => {
      const lineItem1 = `${item.itemName} x${item.quantity}`
      centerText(lineItem1, y, 8)
      y += 4
      const lineItem2 = ` Rs. ${(item.price * item.quantity).toFixed(2)}`
      centerText(lineItem2, y, 8)
      y += 4
    })

    y += 1
    line()

    // Totals
    centerText(`Subtotal: Rs ${transactionDetails.sub_total.toFixed(2)}`, y, 8)
    y += 4
    centerText(`Tax:  Rs ${transactionDetails.tax.toFixed(2)}`, y, 8)
    y += 4
    centerText(`Discount: Rs. ${transactionDetails.discount.toFixed(2)}`, y, 8)
    y += 4
    line()
    y += 4

    centerText(`Total: Rs ${transactionDetails.total.toFixed(2)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }

  const handleGenerateInvoice = (transactionId) => {
    dispatch(fetchTransactionDetails({ transactionId })).then((action) => {
      if (action.payload && Array.isArray(action.payload)) {
        const transactionDetails = action.payload[0]
        if (!transactionDetails) {
          alert('Transaction details not found')
          return
        }

        // Generate the PDF
        const doc = generateInvoicePDF(transactionDetails)
        setPdfDoc(doc)
        setInvoiceContent(transactionDetails)
        setModalVisible(true)
      } else {
        alert('Failed to generate invoice. Please try again.')
      }
    })
  }

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(`Invoice_${invoiceContent.id}.pdf`)
    }
  }

  const handlePrint = () => {
    if (pdfDoc) {
      const printWindow = window.open('', '_blank')
      const pdfString = pdfDoc.output('datauristring')
      printWindow.document.write(`<iframe width='100%' height='100%' src='${pdfString}'></iframe>`)
      printWindow.document.close()
    }
  }
  const handleDeleteTransaction = (id) => {
    setShowNoteModal(true)
    setSelectedTransactionId(id)
  }

  const handleDelete = () => {
    if (selectedTransactionId && note.trim()) {
      dispatch(deleteTransaction({ id: selectedTransactionId, note }))
    }
    setShowNoteModal(false)
    setNote('')
    setSelectedTransactionId(null)
  }

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'user_id',
      headerName: 'User ID',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'userName',
      headerName: 'Name',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'tax',
      headerName: 'Tax',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'discount',
      headerName: 'Discount',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 200 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => new Date(params.row.created_at).toLocaleString() || 'N/A',
    },
    {
      field: 'payment_type',
      headerName: 'Payment Type',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'invoice',
      headerName: 'Invoice',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',

      renderCell: (params) => (
        <CIcon
          icon={cilFile}
          style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
          onClick={() => handleGenerateInvoice(params.row.id)}
        />
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      renderCell: (params) => (
        <CIcon
          icon={cilTrash}
          style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'red' }}
          onClick={() => handleDeleteTransaction(params.row.id)}
        />
      ),
    },
  ]

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      {/* <h2 className="mb-4">Transactions</h2> */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transactions</h2>
        <CButton color="primary" onClick={() => dispatch(fetchPOSTransactions())}>
          Fetch POS Transactions
        </CButton>
      </div>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div style={{ width: '100%' }}>
          <DataGrid
            autoHeight
            rows={transactions
              ?.slice()
              ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              ?.map((transaction) => ({
                id: transaction.id,
                ...transaction,
              }))}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{
              toolbar: CustomToolbar,
            }}
            sx={{
              backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              '& .MuiDataGrid-cell': {
                color: theme === 'dark' ? '#ffffff' : '#000000',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme === 'dark' ? '#333333' : '#f5f5f5',
                color: theme === 'dark' ? '#ffffff' : '#000000',
              },
            }}
          />
        </div>
      ) : (
        <center>No transactions found.</center>
      )}

      <CModal visible={showNoteModal} onClose={() => setShowNoteModal(false)}>
        <CModalHeader>
          <CModalTitle>Add a Note</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            type="text"
            placeholder="Write a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowNoteModal(false)}>
            Cancel
          </CButton>

          {/* <CButton color="danger" onClick={handleDelete} disabled={!note.trim()}>
            Delete Transaction
          </CButton> */}
          <CButton
            color="danger"
            onClick={handleDelete}
            disabled={!note.trim()}
            style={{
              cursor: !note.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Delete Transaction
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Invoice Preview */}
      {invoiceContent && (
        <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
          <CModalHeader>Invoice Preview</CModalHeader>
          <CModalBody>
            <iframe
              src={pdfDoc?.output('datauristring')}
              style={{ width: '100%', height: '400px', border: 'none' }}
              title="Invoice Preview"
            ></iframe>
            <div className="mt-3 d-flex justify-content-between">
              <CButton color="primary" onClick={handleDownload}>
                Download
              </CButton>
              <CButton color="secondary" onClick={handlePrint}>
                Print
              </CButton>
            </div>
          </CModalBody>
        </CModal>
      )}
    </div>
  )
}

export default Transactions
