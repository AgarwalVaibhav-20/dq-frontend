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
  const token = localStorage.getItem('authToken')
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)

  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchTransactionsByRestaurant({ restaurantId, token }))
    }
  }, [dispatch, restaurantId, token])

  useEffect(() => {
    if (restaurantId && token) {
      dispatch(getRestaurantProfile({ restaurantId, token }))
    }
  }, [dispatch, restaurantId, token])

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

  const generateInvoicePDF = (transactionDetails, restaurantProfile = {}) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160], // 80mm thermal receipt size
    })

    const pageWidth = 80
    let y = 8

    // Utility: center text
    const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
      doc.setFont('Courier', fontStyle)
      doc.setFontSize(fontSize)
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    }

    // Utility: line separator
    const line = () => {
      doc.setLineWidth(0.1)
      doc.line(5, y, pageWidth - 5, y)
      y += 4
    }

    // Utility: format numbers with commas
    const formatAmount = (amount) =>
      Number(amount || 0).toLocaleString('en-IN')

    // ---------- HEADER ----------
    centerText(restaurantProfile?.restName || 'DQ TEST RESTAURANT', y, 15)
    y += 5
    centerText(transactionDetails.restaurantAddress || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile.pinCode || 'XXXXXX'} `, y, 8)
    y += 4
    centerText(`Ph: ${transactionDetails.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    // ---------- INVOICE TITLE ----------
    centerText('INVOICE', y, 10, 'bold')
    y += 6

    // ---------- TRANSACTION INFO ----------
    centerText(
      `Date: ${new Date(transactionDetails.createdAt).toLocaleString()}`,
      y,
      8
    )
    y += 4
    centerText(`Table: ${transactionDetails.tableNumber || 'N/A'}`, y, 8)
    y += 4
    centerText(`Customer: ${transactionDetails?.username || 'Walk-in'}`, y, 8)
    y += 5
    line()

    // ---------- ORDER ITEMS ----------
    centerText('Items', y, 9, 'bold')
    y += 5

    transactionDetails.items?.forEach((item) => {
      const lineItem1 = `${item.itemName} x${item.quantity}`
      centerText(lineItem1, y, 8)
      y += 4

      const lineItem2 = `Rs. ${formatAmount(item.price * item.quantity)}`
      centerText(lineItem2, y, 8)
      y += 4
    })

    y += 1
    line()

    // ---------- TOTALS ----------
    centerText(`Subtotal: Rs ${formatAmount(transactionDetails.sub_total)}`, y, 8)
    y += 4
    centerText(`Tax: Rs ${formatAmount(transactionDetails.taxAmount || 0)}`, y, 8)
    y += 4
    centerText(
      `Discount: Rs ${formatAmount(transactionDetails.discountAmount || 0)}`,
      y,
      8
    )
    y += 4
    centerText(`RoundOff: Rs ${formatAmount(transactionDetails.roundOff || 0)}`, y, 8)
    y += 4
    line()
    y += 4

    centerText(`Total: Rs ${formatAmount(transactionDetails.total)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }


  const handleGenerateInvoice = (transactionId) => {
    console.log('🔍 Generating invoice for transaction ID:', transactionId)

    dispatch(fetchTransactionDetails({ transactionId })).then((action) => {
      console.log('📥 Transaction details response:', action.payload)

      if (action.payload && Array.isArray(action.payload)) {
        const transactionDetails = action.payload[0]
        console.log('📄 Transaction details object:', transactionDetails)

        if (!transactionDetails) {
          // alert('Transaction details not found')
          return
        }

        // Generate the PDF
        const doc = generateInvoicePDF(transactionDetails)
        setPdfDoc(doc)
        setInvoiceContent(transactionDetails)
        setModalVisible(true)
      } else {
        console.error('❌ Invalid response format:', action.payload)
        // alert('Failed to generate invoice. Please try again.')
      }
    }).catch((error) => {
      console.error('❌ Error generating invoice:', error)
      // alert('Error generating invoice: ' + error.message)
    })
  }

  const handleDownload = () => {
    if (pdfDoc && invoiceContent) {
      pdfDoc.save(`Invoice_${invoiceContent._id || invoiceContent.id}.pdf`)
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

  // Direct delete without note modal
  const handleDeleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch(deleteTransaction({ id }))
    }
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
      field: 'userId',
      headerName: 'User ID',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
    },
    {
      field: 'username',
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
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'tax',
      headerName: 'Tax',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'discount',
      headerName: 'Discount',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 200 : undefined,
      headerClassName: 'header-style',
      valueGetter: (params) => new Date(params.row.createdAt).toLocaleString() || 'N/A',
    },
    {
      field: 'type',
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
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilFile}
          style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'blue' }}
          onClick={() => handleGenerateInvoice(params.row.transactionId || params.row._id)}
        />
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 100 : undefined,
      headerClassName: 'header-style',
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilTrash}
          style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'red' }}
          onClick={() => handleDeleteTransaction(params.row.id)}
        />
      ),
    },
  ]

  // Transform data to ensure each row has an id
  const transformedTransactions = transactions
    ?.slice()
    ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    ?.map((transaction) => ({
      ...transaction,
      id: transaction._id || transaction.id, // Use _id as id if id doesn't exist
    })) || []

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
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
      ) : transformedTransactions.length > 0 ? (
        <div style={{ width: '100%' }}>
          <DataGrid
            autoHeight
            rows={transformedTransactions}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            slots={{
              toolbar: CustomToolbar,
            }}
            getRowId={(row) => row._id || row.id} // Alternative approach
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