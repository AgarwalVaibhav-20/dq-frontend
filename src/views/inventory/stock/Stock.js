import React, { useState, useEffect, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventories,
  addInventory,
  updateInventory,
  deleteInventory,
  reduceStock, // NEW: Import the new action
} from '../../../redux/slices/stockSlice'
import { fetchSuppliers } from '../../../redux/slices/supplierSlice'
import CustomToolbar from '../../../utils/CustomToolbar'
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CFormInput,
  CSpinner,
  CFormSelect,
  CAlert, // NEW: For displaying stock warnings
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilMinus } from '@coreui/icons' // NEW: Import cilMinus for sell button
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Stock = () => {
  const dispatch = useDispatch()
  const { inventories, loading: inventoryLoading, saleProcessing } = useSelector((state) => state.inventories) // NEW: Added saleProcessing
  const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)

  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [sellModalVisible, setSellModalVisible] = useState(false) // NEW: Sell modal state
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: '',
    supplierId: '',
  })
  const [sellData, setSellData] = useState({ quantityToSell: '' }) // NEW: Sell form data
  const [selectedStock, setSelectedStock] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([]) // NEW: Track low stock items

  const { token, restaurantId } = useSelector((state) => state.auth)

  useEffect(() => {
    if (restaurantId || token) {
      dispatch(fetchInventories({ token }))
      dispatch(fetchSuppliers({ restaurantId, token }))
    }
  }, [restaurantId, token, dispatch])

  // NEW: Monitor low stock items
  useEffect(() => {
    const lowStock = inventories.filter(item => item.quantity <= 5) // Threshold of 5 units
    setLowStockItems(lowStock)
  }, [inventories])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // NEW: Handle sell form changes
  const handleSellChange = (e) => {
    setSellData({ ...sellData, [e.target.name]: e.target.value })
  }

  const handleSaveStock = () => {
    dispatch(addInventory({ restaurantId, ...formData }))
    dispatch(fetchSuppliers({ restaurantId }))
    dispatch(fetchInventories({ restaurantId }))
    resetForm()
    setModalVisible(false)
  }

  const handleUpdateInventory = async () => {
    try {
      dispatch(updateInventory({ id: selectedStock.id, restaurantId, ...formData }))
      dispatch(fetchSuppliers({ restaurantId }))
      dispatch(fetchInventories({ restaurantId }))
      resetForm()
      setEditModalVisible(false)
    } catch (error) {
      console.error('Error updating inventory:', error)
    }
  }

  const handleDeleteInventory = () => {
    dispatch(deleteInventory({ id: selectedStock.id, restaurantId })).unwrap()
    dispatch(fetchInventories({ restaurantId }))
    setDeleteModalVisible(false)
  }

  // NEW: Handle sell item
  const handleSellItem = async () => {
    try {
      await dispatch(reduceStock({
        itemId: selectedStock.id,
        quantitySold: parseInt(sellData.quantityToSell)
      })).unwrap()
      
      setSellData({ quantityToSell: '' })
      setSellModalVisible(false)
      setSelectedStock(null)
    } catch (error) {
      console.error('Sale failed:', error)
    }
  }

  const resetForm = () => {
    setFormData({ itemName: '', quantity: '', unit: '', supplierId: '' })
  }

  // NEW: Reset sell form
  const resetSellForm = () => {
    setSellData({ quantityToSell: '' })
  }

  const exportToCSV = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Stock ID,Item Name,Quantity,Unit,Supplier Name'].join(',') +
      '\n' +
      inventories
        ?.map((row) =>
          [row._id, row.itemName, row.quantity, row.unit, row.supplier?.supplierName || 'N/A'].join(
            ',',
          ),
        )
        .join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = 'inventories.csv'
    link.click()
  }, [inventories])

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF()
    doc.text('Stock Management', 10, 10)
    const tableColumn = ['Stock ID', 'Item Name', 'Quantity', 'Unit', 'Supplier Name']
    const tableRows = inventories?.map((row) => [
      row?._id,
      row?.itemName,
      row?.quantity,
      row?.unit,
      row?.supplier?.supplierName || 'N/A',
    ])
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
    doc.save('inventories.pdf')
  }, [inventories])

  const rows = inventories.map((s) => ({
    id: s._id,
    ...s,
  }))

  const columns = [
    {
      field: 'id',
      headerName: 'Stock ID',
      flex: 1,
      valueGetter: (params) => `SUP-${params.row.id.slice(0, 14).toUpperCase()}`,
    },
    { 
      field: 'itemName', 
      headerName: 'Item Name', 
      flex: 1,
      // NEW: Add styling for low stock items
      renderCell: (params) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: params.row.quantity <= 5 ? '#dc3545' : 'inherit',
          fontWeight: params.row.quantity <= 5 ? 'bold' : 'normal'
        }}>
          {params.row.quantity <= 5 && <span style={{ marginRight: '5px' }}>⚠️</span>}
          {params.value}
        </div>
      )
    },
    { 
      field: 'quantity', 
      headerName: 'Quantity', 
      flex: 1,
      // NEW: Add color coding for quantity levels
      renderCell: (params) => (
        <span style={{
          color: params.value <= 5 ? '#dc3545' : params.value <= 10 ? '#fd7e14' : '#28a745',
          fontWeight: params.value <= 5 ? 'bold' : 'normal'
        }}>
          {params.value}
        </span>
      )
    },
    { field: 'unit', headerName: 'Unit', flex: 1 },
    {
      field: 'supplierName',
      headerName: 'Supplier Name',
      flex: 1,
      valueGetter: (params) => params?.row?.supplierName || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.5, // NEW: Made wider to accommodate sell button
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* NEW: Sell Button */}
          <CButton
            color="success"
            size="sm"
            disabled={params.row.quantity <= 0}
            onClick={() => {
              setSelectedStock(params.row)
              setSellModalVisible(true)
            }}
            title="Sell Item"
          >
            <CIcon icon={cilMinus} />
          </CButton>

          <CButton
            color="secondary"
            size="sm"
            onClick={() => {
              setSelectedStock(params.row)
              setFormData({
                itemName: params.row.itemName || '',
                quantity: params.row.quantity || '',
                unit: params.row.unit || '',
                supplierId: params.row.supplierId || '',
              })
              setEditModalVisible(true)
            }}
            title="Edit Item"
          >
            <CIcon icon={cilPencil} />
          </CButton>

          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedStock(params.row)
              setDeleteModalVisible(true)
            }}
            title="Delete Item"
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-4">
      {/* NEW: Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <CAlert color="warning" className="mb-4">
          <strong>⚠️ Low Stock Alert!</strong>
          <div className="mt-2">
            {lowStockItems.map(item => (
              <div key={item._id} className="mb-1">
                <strong>{item.itemName}</strong>: Only {item.quantity} {item.unit} remaining
              </div>
            ))}
          </div>
        </CAlert>
      )}

      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark m-0">📦 Inventory Stock</h2>
        <CButton color="primary" className="shadow-sm px-4" onClick={() => setModalVisible(true)}>
          + Add Inventory
        </CButton>
      </div>

      {/* Action Buttons */}
      <div className="d-flex gap-2 mb-4">
        <CButton
          className="px-4 py-2 shadow-sm fw-semibold text-white"
          style={{
            background: '#4361ee',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={exportToCSV}
        >
          📑 <span>Export CSV</span>
        </CButton>

        <CButton
          className="px-4 py-2 shadow-sm fw-semibold text-white"
          style={{
            background: '#212121',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={exportToPDF}
        >
          📄 <span>Export PDF</span>
        </CButton>
      </div>

      {/* Inventory Table (Improved) */}
      <div className="bg-white rounded shadow-sm p-3">
        {inventoryLoading || supplierLoading || saleProcessing ? (
          <div className="d-flex justify-content-center py-5">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            className="border-0"
            disableRowSelectionOnClick
            slots={{
              toolbar: CustomToolbar,
            }}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f6fa',
                color: '#333',
                fontWeight: 'bold',
                fontSize: '0.95rem',
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(odd)': {
                  backgroundColor: '#fafafa',
                },
                '&:hover': {
                  backgroundColor: '#e9f2ff',
                },
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-footerContainer': {
                backgroundColor: '#f5f6fa',
              },
            }}
          />
        )}
      </div>

      {/* Add Inventory Modal */}
      <CModal visible={modalVisible} alignment="center" onClose={() => setModalVisible(false)}>
        <CModalHeader className="bg-light">
          <CModalTitle className="fw-bold">➕ Add Inventory</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Item Name"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
          />
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
          />
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Unit (e.g., kg, ltr)"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
          />
          <CFormSelect
            className="mb-3 shadow-sm"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
          >
            <option key="default-add" value="">
              Select Supplier
            </option>
            {suppliers?.map((supplier, index) => (
              <option key={supplier._id ?? `supplier-${index}`} value={supplier._id ?? ''}>
                {supplier.supplierName}
              </option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" variant="outline" onClick={() => setModalVisible(false)}>
            Close
          </CButton>
          <CButton color="primary" className="px-4" onClick={handleSaveStock}>
            {inventoryLoading ? 'Saving...' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* NEW: Sell Item Modal */}
      <CModal visible={sellModalVisible} alignment="center" onClose={() => {
        setSellModalVisible(false)
        resetSellForm()
        setSelectedStock(null)
      }}>
        <CModalHeader className="bg-light">
          <CModalTitle className="fw-bold">💰 Sell Item</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedStock && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">{selectedStock.itemName}</h6>
                <p className="mb-1 text-muted">Available Stock: <strong>{selectedStock.quantity} {selectedStock.unit}</strong></p>
                <p className="mb-0 text-muted">Supplier: <strong>{selectedStock.supplierName || 'N/A'}</strong></p>
              </div>
              
              <CFormInput
                className="mb-3 shadow-sm"
                placeholder="Quantity to sell"
                name="quantityToSell"
                type="number"
                min="1"
                max={selectedStock.quantity}
                value={sellData.quantityToSell}
                onChange={handleSellChange}
              />
              
              {sellData.quantityToSell && (
                <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
                  <small className="text-info">
                    Remaining after sale: <strong>
                      {selectedStock.quantity - parseInt(sellData.quantityToSell || 0)} {selectedStock.unit}
                    </strong>
                  </small>
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" variant="outline" onClick={() => {
            setSellModalVisible(false)
            resetSellForm()
            setSelectedStock(null)
          }}>
            Cancel
          </CButton>
          <CButton 
            color="success" 
            className="px-4" 
            onClick={handleSellItem}
            disabled={
              !sellData.quantityToSell || 
              parseInt(sellData.quantityToSell) <= 0 || 
              parseInt(sellData.quantityToSell) > selectedStock?.quantity ||
              saleProcessing
            }
          >
            {saleProcessing ? 'Processing...' : 'Confirm Sale'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Inventory Modal */}
      <CModal visible={editModalVisible} alignment="center" onClose={() => setEditModalVisible(false)}>
        <CModalHeader className="bg-light">
          <CModalTitle className="fw-bold">✏️ Edit Inventory</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Item Name"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
          />
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
          />
          <CFormInput
            className="mb-3 shadow-sm"
            placeholder="Unit (e.g., kg, ltr)"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
          />
          <CFormSelect
            className="mb-3 shadow-sm"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
          >
            <option key="default-edit" value="">
              Select Supplier
            </option>
            {suppliers?.map((supplier) => (
              <option key={`edit-${supplier._id}`} value={supplier._id}>
                {supplier.supplierName}
              </option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" variant="outline" onClick={() => setEditModalVisible(false)}>
            Close
          </CButton>
          <CButton color="primary" className="px-4" onClick={handleUpdateInventory}>
            {inventoryLoading ? 'Updating...' : 'Update'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        alignment="center"
        onClose={() => setDeleteModalVisible(false)}
      >
        <CModalHeader className="bg-light">
          <CModalTitle className="fw-bold text-danger">⚠️ Delete Inventory</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center fs-6">
          Are you sure you want to <strong className="text-danger">delete</strong> this inventory?
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" variant="outline" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" className="px-4" onClick={handleDeleteInventory}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Stock