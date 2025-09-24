import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import {
  fetchTransactionsByRestaurant,
  fetchTransactionDetails,
  deleteTransaction,
  fetchPOSTransactions,
} from '../../redux/slices/transactionSlice'
import { fetchDuesByCustomer } from '../../redux/slices/duesSlice'
import { CSpinner, CModal, CModalBody, CModalHeader, CModalTitle, CModalFooter, CButton } from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilFile, cilTrash, cilUser } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import CustomToolbar from '../../utils/CustomToolbar'
import { useMediaQuery } from '@mui/material'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'

const Transactions = () => {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state) => state.transactions)
  const { customerDues, loading: duesLoading } = useSelector((state) => state.dues)

  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const auth = useSelector((state) => state.auth.auth)
  const theme = useSelector((state) => state.theme.theme)

  const [modalVisible, setModalVisible] = useState(false)
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [showCustomerDuesModal, setShowCustomerDuesModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

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
    console.log('🔍 Generating PDF for transaction:', transactionDetails);
    console.log('🏪 Restaurant profile:', restaurantProfile);

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
    centerText(restaurantProfile?.name || restaurantProfile?.restName || 'DQ TEST RESTAURANT', y, 15)
    y += 5
    centerText(restaurantProfile?.address || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile?.pinCode || 'XXXXXX'}`, y, 8)
    y += 4
    centerText(`Ph: ${restaurantProfile?.phone || restaurantProfile?.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    // ---------- INVOICE TITLE ----------
    centerText('INVOICE', y, 10, 'bold')
    y += 6

    // ---------- TRANSACTION INFO ----------
    const transactionDate = transactionDetails.createdAt ?
      new Date(transactionDetails.createdAt).toLocaleString() :
      'Invalid Date';
    centerText(`Date: ${transactionDate}`, y, 8)
    y += 4

    centerText(`Table: ${transactionDetails.tableNumber || 'N/A'}`, y, 8)
    y += 4

    // Try different customer name fields
    const customerName = transactionDetails?.customerId?.name ||
                        transactionDetails?.userId?.name ||
                        transactionDetails?.userId?.username ||
                        transactionDetails?.username ||
                        transactionDetails?.customerName ||
                        'Walk-in';
    centerText(`Customer: ${customerName}`, y, 8)
    y += 5
    line()

    // ---------- ORDER ITEMS ----------
    centerText('Items', y, 9, 'bold')
    y += 5

    if (transactionDetails.items && transactionDetails.items.length > 0) {
      transactionDetails.items.forEach((item) => {
        const lineItem1 = `${item.itemName} x${item.quantity}`
        centerText(lineItem1, y, 8)
        y += 4

        const lineItem2 = `Rs. ${formatAmount(item.price * item.quantity)}`
        centerText(lineItem2, y, 8)
        y += 4
      })
    } else {
      centerText('No items found', y, 8)
      y += 4
    }

    y += 1
    line()

    // ---------- TOTALS ----------
    centerText(`Subtotal: Rs ${formatAmount(transactionDetails.sub_total || 0)}`, y, 8)
    y += 4
    centerText(`Tax: Rs ${formatAmount(transactionDetails.taxAmount || 0)}`, y, 8)
    y += 4
    centerText(`Discount: Rs ${formatAmount(transactionDetails.discountAmount || 0)}`, y, 8)
    y += 4
    centerText(`RoundOff: Rs ${formatAmount(transactionDetails.roundOff || 0)}`, y, 8)
    y += 4
    line()
    y += 4

    centerText(`Total: Rs ${formatAmount(transactionDetails.total || 0)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }


  const handleGenerateInvoice = (transactionId) => {
    console.log('🔍 Generating invoice for transaction ID:', transactionId)
    console.log('🔍 Transaction ID type:', typeof transactionId)
    console.log('🔍 Available transaction data:', transactions.find(t => t.transactionId === transactionId || t._id === transactionId))

    if (!transactionId) {
      console.error('❌ No transaction ID provided')
      return
    }

    dispatch(fetchTransactionDetails({ transactionId })).then((action) => {
      console.log('📥 Transaction details response:', action.payload)
      console.log('📥 Action type:', action.type)

      if (action.type === 'transactions/fetchTransactionDetails/fulfilled') {
        const transactionDetails = action.payload
        console.log('📄 Transaction details object:', transactionDetails)

        if (!transactionDetails) {
          console.error('❌ Transaction details not found')
          return
        }

        // Generate the PDF with restaurant profile
        const doc = generateInvoicePDF(transactionDetails, restaurantProfile)
        setPdfDoc(doc)
        setInvoiceContent(transactionDetails)
        setModalVisible(true)
      } else {
        console.error('❌ Failed to fetch transaction details:', action.payload)
        console.error('❌ Action type:', action.type)
      }
    }).catch((error) => {
      console.error('❌ Error generating invoice:', error)
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

  // Handle customer dues
  const handleCustomerDues = async (transaction) => {
    console.log('Customer Dues for transaction:', transaction)

    // Set the selected customer
    setSelectedCustomer({
      id: transaction.userId,
      name: transaction.username || 'Unknown Customer'
    })

    // Fetch customer dues
    try {
      await dispatch(fetchDuesByCustomer({
        customerId: transaction.userId,
        token
      })).unwrap()

      // Show the modal
      setShowCustomerDuesModal(true)
    } catch (error) {
      console.error('Error fetching customer dues:', error)
      // Still show modal with empty dues
      setShowCustomerDuesModal(true)
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
      field: 'customerDues',
      headerName: 'Customer Dues',
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 150 : undefined,
      headerClassName: 'header-style',
      sortable: false,
      renderCell: (params) => (
        <CIcon
          icon={cilUser}
          style={{ fontSize: '1.5rem', cursor: 'pointer', color: 'green' }}
          onClick={() => handleCustomerDues(params.row)}
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
        <CButton color="primary" onClick={() => dispatch(fetchTransactionsByRestaurant({ restaurantId, token })) }>
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


      {/* Modal for Customer Dues */}
      <CModal visible={showCustomerDuesModal} onClose={() => setShowCustomerDuesModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>{selectedCustomer?.name || 'Customer'}'s Due Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {duesLoading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="mt-2">Loading dues...</p>
            </div>
          ) : customerDues && customerDues.length > 0 ? (
            <div>
              {/* Customer Information */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-2 text-primary">Customer Information:</h6>
                <p className="mb-1"><strong>Customer:</strong> {selectedCustomer?.name || 'N/A'}</p>
                <p className="mb-1"><strong>Customer ID:</strong> {selectedCustomer?.id || 'N/A'}</p>
                <p className="mb-0"><strong>Total Dues Found:</strong> {customerDues.length}</p>
              </div>

              {/* Summary */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-3 text-primary">Summary:</h6>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Total Amount Due:</strong>
                      <span className="text-danger ms-2">
                        Rs. {customerDues.reduce((sum, due) => sum + (parseFloat(due.total) || 0), 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Paid Dues:</strong>
                      <span className="text-success ms-2">
                        {customerDues.filter(due => due.status === 'paid').length}
                      </span>
                    </p>
                    <p className="mb-0"><strong>Unpaid Dues:</strong>
                      <span className="text-warning ms-2">
                        {customerDues.filter(due => due.status === 'unpaid').length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Dues List */}
              <div className="mb-3">
                <h6 className="mb-3 text-primary">List of Individual Dues:</h6>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {customerDues.map((due, index) => (
                    <div key={due._id || index} className="mb-3 p-3 border rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Due ID:</strong> {due._id?.slice(-6) || 'N/A'}</p>
                          <p className="mb-1"><strong>Created:</strong> {new Date(due.createdAt).toLocaleString()}</p>
                          <p className="mb-0"><strong>Amount:</strong> Rs. {parseFloat(due.total || 0).toFixed(3)}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1">
                            <strong>Status:</strong>
                            <span className={`badge ms-2 ${due.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                              {due.status?.toUpperCase() || 'UNPAID'}
                            </span>
                          </p>
                          <p className="mb-0"><strong>Transaction ID:</strong> {due.transaction_id || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mb-3">
                <CIcon icon={cilUser} size="3xl" className="text-muted" />
              </div>
              <h5 className="text-muted">No dues found for {selectedCustomer?.name || 'this customer'}</h5>
              <p className="text-muted">This customer has no outstanding dues.</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowCustomerDuesModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Transactions
