import React, { useState, useEffect, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventories,
  addInventory,
  updateInventory,
  deleteInventory,
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Stock = () => {
  const dispatch = useDispatch()
  const { inventories, loading: inventoryLoading } = useSelector((state) => state.inventories)
  const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
  const restaurantId = useSelector((state) => state.auth.restaurantId)

  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: '',
    supplierId: '',
  })
  const [selectedStock, setSelectedStock] = useState(null)

  // Fetch inventories and suppliers on component mount
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchInventories({ restaurantId }))
      dispatch(fetchSuppliers({ restaurantId }))
    }
  }, [restaurantId, dispatch])


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      // console.log('formData', formData);
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
    // dispatch(fetchInventories({ restaurantId }))
    setDeleteModalVisible(false)
  }

  const resetForm = () => {
    setFormData({ itemName: '', quantity: '', unit: '', supplierId: '' })
  }

  const exportToCSV = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Stock ID,Item Name,Quantity,Unit,Supplier Name'].join(',') +
      '\n' +
      inventories
        ?.map((row) =>
          [row.id, row.itemName, row.quantity, row.unit, row.supplier?.supplierName || 'N/A'].join(
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
      row?.id,
      row?.itemName,
      row?.quantity,
      row?.unit,
      row?.supplier?.supplierName || 'N/A',
    ])
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
    doc.save('inventories.pdf')
  }, [inventories])

  const columns = [
    { field: 'id', headerName: 'Stock ID', flex: 1 },
    { field: 'itemName', headerName: 'Item Name', flex: 1 },
    { field: 'quantity', headerName: 'Quantity', flex: 1 },
    { field: 'unit', headerName: 'Unit', flex: 1 },
    {
      field: 'supplierName',
      headerName: 'Supplier Name',
      flex: 1,
      valueGetter: (params) => params?.row?.supplier?.supplierName || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Edit Button */}
          <CButton
            color="secondary"
            size="sm"
            onClick={() => {
              setSelectedStock(params.row)
              setFormData({
                itemName: params.row.itemName || '',
                quantity: params.row.quantity || '',
                unit: params.row.unit || '',
                supplierId: params.row.supplier?.id || '',
              })
              setEditModalVisible(true)
            }}
          >
            <CIcon icon={cilPencil} />
          </CButton>
          {/* Delete Button */}
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedStock(params.row)
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
    <div className="p-4">
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
            background: "#4361ee",
            border: "none",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={exportToCSV}
        >
          📑 <span>Export CSV</span>
        </CButton>

        <CButton
          className="px-4 py-2 shadow-sm fw-semibold text-white"
          style={{
            background: "#212121", // darker tone
            border: "none",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={exportToPDF}
        >
          📄 <span>Export PDF</span>
        </CButton>

      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded shadow-sm p-3">
        {inventoryLoading || supplierLoading ? (
          <div className="d-flex justify-content-center py-5">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <DataGrid
            rows={inventories || []}
            columns={columns}
            autoHeight
            className="border-0"
            slots={{
              toolbar: CustomToolbar,
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
            <option key="default-add" value="">Select Supplier</option>
            {suppliers?.map((supplier) => (
              <option key={`add-${supplier.id}`} value={supplier.id}>
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
            <option key="default-edit" value="">Select Supplier</option>
            {suppliers?.map((supplier) => (
              <option key={`edit-${supplier.id}`} value={supplier.id}>
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
      <CModal visible={deleteModalVisible} alignment="center" onClose={() => setDeleteModalVisible(false)}>
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
