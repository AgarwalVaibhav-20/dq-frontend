import React, { useState, useEffect, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventories,
  addInventory,
  updateInventory,
  deleteInventory,
  addQuantityStock, // Updated thunk
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
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilPlus } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Stock = () => {
  const dispatch = useDispatch()
  const { inventories, loading: inventoryLoading, saleProcessing } = useSelector((state) => state.inventories)
  const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
  const { restaurantId, token } = useSelector((state) => state.auth)

  // States
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [addQuantityStockModalVisible, setaddQuantityStockModalVisible] = useState(false) // Add stock modal
  const [formData, setFormData] = useState({ itemName: '', quantity: '', unit: '', amount: '', supplierId: '', total: '' })
  const [addQuantityStockData, setaddQuantityStockData] = useState({ quantityToAdd: '' })
  const [selectedStock, setSelectedStock] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])
  const [availableItems, setAvailableItems] = useState([]) // Items from suppliers (rawItem)
  const [filteredSuppliers, setFilteredSuppliers] = useState([]) // Filtered suppliers based on selected item

  // Fetch inventories and suppliers
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchInventories({ token }))
      dispatch(fetchSuppliers({ restaurantId, token }))
    }
  }, [restaurantId, token, dispatch])

  // Debug: Log inventories data
  useEffect(() => {
    console.log('=== FRONTEND DEBUG ===');
    console.log('Inventories data:', inventories);
    console.log('Inventories length:', inventories?.length);
    
    if (inventories && inventories.length > 0) {
      inventories.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          name: item.itemName,
          stock: item.stock,
          quantity: item.stock?.quantity,
          hasStock: !!item.stock,
          stockKeys: item.stock ? Object.keys(item.stock) : 'No stock object'
        });
      });
    } else {
      console.log('No inventories data found');
    }
    console.log('=== END FRONTEND DEBUG ===');
  }, [inventories])

  // Extract unique items from all suppliers (based on rawItem field)
  useEffect(() => {
    console.log('Suppliers data:', suppliers) // Debug log

    if (suppliers && suppliers.length > 0) {
      const items = []
      suppliers.forEach(supplier => {
        console.log('Processing supplier:', supplier) // Debug log

        // Get the raw item from supplier
        const rawItemName = supplier.rawItem

        if (rawItemName && rawItemName.trim()) {
          console.log('Processing raw item:', rawItemName) // Debug log

          // Check if item already exists in the array
          const existingItem = items.find(existingItem =>
            existingItem.itemName.toLowerCase() === rawItemName.toLowerCase().trim()
          )

          if (!existingItem) {
            items.push({
              itemName: rawItemName.trim(),
              unit: 'kg', // Default unit, can be changed by user
              supplierId: supplier._id,
              supplierName: supplier.supplierName,
              supplierItems: [{
                rawItem: rawItemName,
                supplierId: supplier._id,
                supplierName: supplier.supplierName
              }]
            })
          } else {
            // Add supplier info to existing item (multiple suppliers for same item)
            existingItem.supplierItems.push({
              rawItem: rawItemName,
              supplierId: supplier._id,
              supplierName: supplier.supplierName
            })
          }
        } else {
          console.log('No rawItem found for supplier:', supplier.supplierName)
        }
      })

      console.log('Final available items:', items) // Debug log
      setAvailableItems(items)
    } else {
      console.log('No suppliers found or suppliers array is empty')
    }
  }, [suppliers])

  // Monitor low stock
  useEffect(() => {
    const lowStock = inventories.filter(item => (item.stock?.quantity || 0) <= 5)
    setLowStockItems(lowStock)
  }, [inventories])

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'itemName') {
      // Find the selected item
      const selectedItem = availableItems.find(item => item.itemName === value)

      if (selectedItem) {
        // Get suppliers for this item
        const itemSuppliers = selectedItem.supplierItems.map(item => ({
          _id: item.supplierId,
          supplierName: item.supplierName
        }))

        setFilteredSuppliers(itemSuppliers)

        // If only one supplier, auto-select it
        if (itemSuppliers.length === 1) {
          setFormData({
            ...formData,
            [name]: value,
            unit: selectedItem.unit || '',
            supplierId: itemSuppliers[0]._id
          })
        } else {
          setFormData({
            ...formData,
            [name]: value,
            unit: selectedItem.unit || '',
            supplierId: '' // Reset supplier selection if multiple suppliers
          })
        }
      } else {
        setFilteredSuppliers([])
        setFormData({ ...formData, [name]: value, unit: '', supplierId: '' })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleaddQuantityStockChange = (e) => setaddQuantityStockData({ ...addQuantityStockData, [e.target.name]: e.target.value })

  // Add inventory
  const handleSaveStock = async () => {
    try {
      await dispatch(addInventory({ restaurantId, ...formData, token })).unwrap() // wait until added
      await dispatch(fetchInventories({ restaurantId, token })).unwrap()           // fetch updated inventories
      resetForm()
      setModalVisible(false)
    } catch (error) {
      console.log(error, "error is here")
      console.error("Failed to add inventory:", error)
    }
  }

  // Update inventory
  const handleUpdateInventory = async () => {
    try {
      await dispatch(updateInventory({ id: selectedStock.id, restaurantId, ...formData, token })).unwrap()
      await dispatch(fetchInventories({ restaurantId, token })).unwrap()
      resetForm()
      setEditModalVisible(false)
    } catch (error) {
      console.error('Error updating inventory:', error)
    }
  }

  // Delete inventory
  const handleDeleteInventory = async () => {
    try {
      await dispatch(deleteInventory({ id: selectedStock.id, restaurantId, token })).unwrap()
      await dispatch(fetchInventories({ restaurantId, token })).unwrap()
      setDeleteModalVisible(false)
    } catch (error) {
      console.error('Error deleting inventory:', error)
    }
  }

  // Add stock handler
  const handleaddQuantityStockItem = async () => {
    try {
      await dispatch(addQuantityStock({
        itemId: selectedStock.id,
        quantityToAdd: parseInt(addQuantityStockData.quantityToAdd),
        token
      })).unwrap()

      await dispatch(fetchInventories({ restaurantId, token })).unwrap()
      setaddQuantityStockData({ quantityToAdd: '' })
      setaddQuantityStockModalVisible(false)
      setSelectedStock(null)
    } catch (error) {
      console.error('Failed to add stock:', error)
    }
  }

  const resetForm = () => {
    setFormData({ itemName: '', quantity: '', unit: '', amount: '', supplierId: '' })
    setFilteredSuppliers([])
  }

  // Export CSV
  const exportToCSV = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Stock ID,Item Name,Quantity,Unit,Amount,Supplier Name'].join(',') +
      '\n' +
      inventories
        ?.map((row) =>
          [row._id, row.itemName, row.quantity, row.unit, row.amount || 'N/A', row.supplierName || 'N/A'].join(',')
        )
        .join('\n') // Join all rows with newline

    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = 'inventories.csv'
    link.click()
  }, [inventories])

  // Export PDF
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF()
    doc.text('Stock Management', 10, 10)
    const tableColumn = ['Stock ID', 'Item Name', 'Quantity', 'Unit', 'Amount', 'Total', 'Supplier Name']
    const tableRows = inventories?.map((row) => [
      row._id,
      row.itemName,
      row.quantity,
      row.unit,
      row.amount || 'N/A',
      row.supplierName || 'N/A',
    ])

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
    doc.save('inventories.pdf')
  }, [inventories])

  // DataGrid rows
  const rows = inventories.map((s) => ({ id: s._id, ...s }))

  // DataGrid columns
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      flex: 0.8, 
      minWidth: 80,
      valueGetter: (params) => `STK-${params.row.id.slice(-6).toUpperCase()}`,
      hide: false
    },
    {
      field: 'itemName', 
      headerName: 'Item Name', 
      flex: 1.5, 
      minWidth: 120,
      renderCell: (params) => {
        const quantity = params.row.stock?.quantity || 0;
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: quantity <= 5 ? '#dc3545' : 'inherit',
            fontWeight: quantity <= 5 ? 'bold' : 'normal',
            fontSize: '0.875rem'
          }}>
            {quantity <= 5 && <span style={{ marginRight: '4px', fontSize: '0.75rem' }}>⚠️</span>}
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {params.value}
            </span>
          </div>
        )
      }
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      flex: 0.8,
      minWidth: 60,
      valueGetter: (params) => {
        const qty = params.row?.stock?.quantity ?? 0;
        return qty;
      },
      renderCell: (params) => {
        const qty = params.row?.stock?.quantity ?? 0;
        return (
          <span
            style={{
              color: qty <= 5 ? '#dc3545' : qty <= 10 ? '#fd7e14' : '#28a745',
              fontWeight: qty <= 5 ? 'bold' : 'normal',
              fontSize: '0.875rem'
            }}
          >
            {qty}
          </span>
        )
      },
    },
    { 
      field: 'unit', 
      headerName: 'Unit', 
      flex: 0.6, 
      minWidth: 50,
      renderCell: (params) => (
        <span style={{ fontSize: '0.875rem' }}>{params.value}</span>
      )
    },
    {
      field: 'total',
      headerName: 'Amount',
      flex: 1,
      minWidth: 80,
      valueGetter: (params) => {
        const total = params?.row?.stock?.total ?? 0;
        return total;
      },
      renderCell: (params) => {
        const total = params?.row?.stock?.total ?? 0;
        return (
          <span style={{
            color: total > 0 ? '#28a745' : '#6c757d',
            fontWeight: total > 0 ? 'bold' : 'normal',
            fontSize: '0.875rem'
          }}>
            ₹{total.toLocaleString()}
          </span>
        )
      }
    },
    {
      field: 'actions', 
      headerName: 'Actions', 
      flex: 1.2, 
      minWidth: 100,
      sortable: false, 
      filterable: false,
      renderCell: (params) => (
        <div style={{ 
          display: 'flex', 
          gap: '2px', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CButton 
            color="secondary" 
            size="sm" 
            className="btn-sm p-1" 
            onClick={() => {
              setSelectedStock(params.row)

              // Find the item in availableItems to get supplier info
              const availableItem = availableItems.find(item =>
                item.itemName.toLowerCase() === params.row.itemName.toLowerCase()
              )

              if (availableItem) {
                const itemSuppliers = availableItem.supplierItems.map(item => ({
                  _id: item.supplierId,
                  supplierName: item.supplierName
                }))
                setFilteredSuppliers(itemSuppliers)
              } else {
                setFilteredSuppliers(suppliers || [])
              }

              setFormData({
                itemName: params.row.itemName || '',
                quantity: params.row.stock?.quantity || '',
                unit: params.row.unit || '',
                amount: params.row.stock?.amount || '',
                supplierId: params.row.supplierId || '',
              })
              setEditModalVisible(true)
            }} 
            title="Edit Item"
            style={{ minWidth: '32px', height: '32px' }}
          >
            <CIcon icon={cilPencil} size="sm" />
          </CButton>

          <CButton 
            color="danger" 
            size="sm" 
            className="btn-sm p-1" 
            onClick={() => {
              setSelectedStock(params.row)
              setDeleteModalVisible(true)
            }} 
            title="Delete Item"
            style={{ minWidth: '32px', height: '32px' }}
          >
            <CIcon icon={cilTrash} size="sm" />
          </CButton>
        </div>
      )
    },
  ]

  return (
    <div className="p-2 p-md-4">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <CAlert color="warning" className="mb-4">
          <strong>⚠️ Low Stock Alert!</strong>
          <div className="mt-2">
            {lowStockItems.map(item => (
              <div key={item._id} className="mb-1">
                <strong className="d-block d-sm-inline">{item.itemName}</strong>
                <span className="d-block d-sm-inline ms-sm-1">Only {item.stock?.quantity || 0} {item.unit} remaining</span>
              </div>
            ))}
          </div>
        </CAlert>
      )}

      {/* Header & Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h2 className="fw-bold text-dark m-0">📦 Inventory Stock</h2>
        <CButton color="primary" className="shadow-sm px-4 w-100 w-md-auto" onClick={() => setModalVisible(true)}>+ Add Inventory</CButton>
      </div>

      <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
        <CButton className="px-4 py-2 shadow-sm fw-semibold text-white w-100 w-sm-auto" style={{ background: '#4361ee', border: 'none', borderRadius: '8px' }} onClick={exportToCSV}>📑 <span>Export CSV</span></CButton>
        <CButton className="px-4 py-2 shadow-sm fw-semibold text-white w-100 w-sm-auto" style={{ background: '#212121', border: 'none', borderRadius: '8px' }} onClick={exportToPDF}>📄 <span>Export PDF</span></CButton>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded shadow-sm p-2 p-md-3">
        {inventoryLoading || supplierLoading || saleProcessing ? (
          <div className="d-flex justify-content-center py-5">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="d-none d-lg-block">
              <div className="table-responsive" style={{ minHeight: '400px' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  autoHeight
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  className="border-0"
                  disableRowSelectionOnClick
                  slots={{ toolbar: CustomToolbar }}
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      '& .MuiDataGrid-cell:focus-within': {
                        outline: 'none',
                      },
                    },
                    '& .MuiDataGrid-columnHeaders': { 
                      backgroundColor: '#f5f6fa', 
                      color: '#333', 
                      fontWeight: 'bold', 
                      fontSize: '0.8rem',
                      minHeight: '40px !important',
                      borderBottom: '2px solid #dee2e6'
                    },
                    '& .MuiDataGrid-row': { 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafafa' }, 
                      '&:hover': { backgroundColor: '#e9f2ff' },
                      minHeight: '40px !important',
                      '&:hover .MuiDataGrid-cell': {
                        backgroundColor: 'transparent'
                      }
                    },
                    '& .MuiDataGrid-cell': { 
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.8rem',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      '&:focus': {
                        outline: 'none'
                      }
                    },
                    '& .MuiDataGrid-footerContainer': { 
                      backgroundColor: '#f5f6fa',
                      borderTop: '1px solid #dee2e6',
                      minHeight: '52px !important'
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    },
                    '& .MuiDataGrid-cellContent': {
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    },
                    '& .MuiDataGrid-toolbarContainer': {
                      padding: '8px 16px',
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #dee2e6'
                    },
                    '& .MuiDataGrid-main': {
                      overflow: 'auto'
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      overflow: 'auto'
                    }
                  }}
                />
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-lg-none">
              {inventories.map((item, index) => {
                const quantity = item.stock?.quantity || 0;
                const total = item.stock?.total || 0;
                
                return (
                  <div key={item._id} className="card mb-3 border-0 shadow-sm">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="card-title mb-1 d-flex align-items-center">
                            {quantity <= 5 && <span className="me-2 text-danger">⚠️</span>}
                            <span className={quantity <= 5 ? 'text-danger fw-bold' : ''}>
                              {item.itemName}
                            </span>
                          </h6>
                          <small className="text-muted">ID: STK-{item._id.slice(-6).toUpperCase()}</small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${quantity <= 5 ? 'bg-danger' : quantity <= 10 ? 'bg-warning' : 'bg-success'}`}>
                            {quantity} {item.unit}
                          </span>
                        </div>
                      </div>
                      
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted d-block">Amount</small>
                          <span className={`fw-bold ${total > 0 ? 'text-success' : 'text-muted'}`}>
                            ₹{total.toLocaleString()}
                          </span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Supplier</small>
                          <span className="text-dark">{item.supplierName || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <CButton 
                          color="secondary" 
                          size="sm" 
                          className="flex-fill"
                          onClick={() => {
                            setSelectedStock(item);
                            const availableItem = availableItems.find(avItem =>
                              avItem.itemName.toLowerCase() === item.itemName.toLowerCase()
                            );
                            if (availableItem) {
                              const itemSuppliers = availableItem.supplierItems.map(supplier => ({
                                _id: supplier.supplierId,
                                supplierName: supplier.supplierName
                              }));
                              setFilteredSuppliers(itemSuppliers);
                            } else {
                              setFilteredSuppliers(suppliers || []);
                            }
                            setFormData({
                              itemName: item.itemName || '',
                              quantity: item.stock?.quantity || '',
                              unit: item.unit || '',
                              amount: item.stock?.amount || '',
                              supplierId: item.supplierId || '',
                            });
                            setEditModalVisible(true);
                          }}
                        >
                          <CIcon icon={cilPencil} className="me-1" />
                          Edit
                        </CButton>
                        <CButton 
                          color="danger" 
                          size="sm" 
                          className="flex-fill"
                          onClick={() => {
                            setSelectedStock(item);
                            setDeleteModalVisible(true);
                          }}
                        >
                          <CIcon icon={cilTrash} className="me-1" />
                          Delete
                        </CButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Inventory Modal */}
      <CModal visible={modalVisible} alignment="center" onClose={() => { setModalVisible(false); resetForm() }} size="lg" scrollable>
        <CModalHeader className="bg-light border-0"><CModalTitle className="fw-bold">📦 Add Inventory</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="p-2 p-md-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
              <CFormSelect name="itemName" value={formData.itemName} onChange={handleChange} className="form-select">
                <option value="">Select Item</option>
                {availableItems.map((item, index) => (
                  <option key={index} value={item.itemName}>
                    {item.itemName}
                  </option>
                ))}
              </CFormSelect>
              <small className="text-muted">Items are loaded from your suppliers' raw items</small>
            </div>

            <div className="row">
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
                <CFormInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
                <CFormSelect
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                  <option value="ltr">ltr</option>
                  <option value="mg">mg</option>
                  <option value="pcs">pcs</option>
                  <option value="ml">ml</option>
                </CFormSelect>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Amount (Optional)</label>
              <CFormInput
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount/price"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div>
              <label className="form-label fw-semibold">Supplier <span className="text-danger">*</span></label>
              <CFormSelect name="supplierId" value={formData.supplierId} onChange={handleChange} className="form-select">
                <option value="">
                  {formData.itemName
                    ? (filteredSuppliers.length > 0 ? "Select Supplier" : "No suppliers available for this item")
                    : "Select an item first"
                  }
                </option>
                {filteredSuppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </CFormSelect>
              {formData.itemName && filteredSuppliers.length > 1 && (
                <small className="text-info">This item is available from multiple suppliers</small>
              )}
            </div>
          </div>
        </CModalBody>
        <CModalFooter className="d-flex flex-column flex-sm-row justify-content-end gap-2 border-0">
          <CButton color="secondary" variant="outline" className="w-100 w-sm-auto" onClick={() => { setModalVisible(false); resetForm() }}>Cancel</CButton>
          <CButton
            color="success"
            className="px-4 w-100 w-sm-auto"
            onClick={handleSaveStock}
            disabled={inventoryLoading || !formData.itemName || !formData.quantity || !formData.unit || !formData.supplierId}
          >
            {inventoryLoading ? 'Saving...' : 'Save Inventory'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add Stock Modal */}
      <CModal visible={addQuantityStockModalVisible} alignment="center" onClose={() => { setaddQuantityStockModalVisible(false); setaddQuantityStockData({ quantityToAdd: '' }); setSelectedStock(null) }} scrollable>
        <CModalHeader className="bg-light"><CModalTitle className="fw-bold">✅ Add Stock</CModalTitle></CModalHeader>
        <CModalBody>
          {selectedStock && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">{selectedStock.itemName}</h6>
                <p className="mb-1 text-muted">Current Stock: <strong>{selectedStock.stock?.quantity || 0} {selectedStock.unit}</strong></p>
                <p className="mb-0 text-muted">Supplier: <strong>{selectedStock.supplierName || 'N/A'}</strong></p>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Quantity to Add <span className="text-danger">*</span></label>
                <CFormInput
                  className="shadow-sm form-control"
                  placeholder="Enter quantity to add"
                  name="quantityToAdd"
                  type="number"
                  min="1"
                  value={addQuantityStockData.quantityToAdd}
                  onChange={handleaddQuantityStockChange}
                />
              </div>

              {addQuantityStockData.quantityToAdd && (
                <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
                  <small className="text-info">
                    <strong>New Total Stock:</strong> {(selectedStock.stock?.quantity || 0) + parseInt(addQuantityStockData.quantityToAdd || 0)} {selectedStock.unit}
                  </small>
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter className="bg-light d-flex flex-column flex-sm-row justify-content-end gap-2">
          <CButton
            color="secondary"
            variant="outline"
            className="w-100 w-sm-auto"
            onClick={() => { setaddQuantityStockModalVisible(false); setaddQuantityStockData({ quantityToAdd: '' }); setSelectedStock(null) }}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            className="px-4 w-100 w-sm-auto"
            onClick={handleaddQuantityStockItem}
            disabled={!addQuantityStockData.quantityToAdd || parseInt(addQuantityStockData.quantityToAdd) <= 0 || saleProcessing}
          >
            {saleProcessing ? 'Processing...' : 'Add Stock'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Inventory Modal */}
      <CModal visible={editModalVisible} alignment="center" onClose={() => { setEditModalVisible(false); resetForm() }} size="lg" scrollable>
        <CModalHeader className="bg-light"><CModalTitle className="fw-bold">✏️ Edit Inventory</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="p-2 p-md-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Item Name</label>
              <CFormInput
                className="shadow-sm form-control"
                placeholder="Item Name"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                readOnly
                style={{ backgroundColor: '#e9ecef' }}
              />
              <small className="text-muted">Item name cannot be changed</small>
            </div>

            <div className="row">
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Quantity</label>
                <CFormInput
                  className="shadow-sm form-control"
                  placeholder="Quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label fw-semibold">Unit</label>
                <CFormSelect
                  className="shadow-sm form-select"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="gm">gm</option>
                  <option value="ltr">ltr</option>
                  <option value="mg">mg</option>
                  <option value="pcs">pcs</option>
                  <option value="ml">ml</option>
                </CFormSelect>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Amount</label>
              <CFormInput
                className="shadow-sm form-control"
                placeholder="Amount/Price"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label fw-semibold">Supplier</label>
              <CFormSelect className="shadow-sm form-select" name="supplierId" value={formData.supplierId} onChange={handleChange}>
                <option value="">Select Supplier</option>
                {filteredSuppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </div>
        </CModalBody>
        <CModalFooter className="bg-light d-flex flex-column flex-sm-row justify-content-end gap-2">
          <CButton color="secondary" variant="outline" className="w-100 w-sm-auto" onClick={() => { setEditModalVisible(false); resetForm() }}>Cancel</CButton>
          <CButton
            color="primary"
            className="px-4 w-100 w-sm-auto"
            onClick={handleUpdateInventory}
            disabled={inventoryLoading}
          >
            {inventoryLoading ? 'Updating...' : 'Update Inventory'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Inventory Modal */}
      <CModal visible={deleteModalVisible} alignment="center" onClose={() => setDeleteModalVisible(false)} scrollable>
        <CModalHeader className="bg-light"><CModalTitle className="fw-bold text-danger">⚠️ Delete Inventory</CModalTitle></CModalHeader>
        <CModalBody className="text-center py-4">
          {selectedStock && (
            <div>
              <p className="fs-6 mb-3">Are you sure you want to delete this inventory item?</p>
              <div className="p-3 bg-light rounded">
                <strong className="d-block mb-2">{selectedStock.itemName}</strong>
                <span className="text-muted d-block">Quantity: {selectedStock.stock?.quantity || 0} {selectedStock.unit}</span>
                <span className="text-muted d-block">Supplier: {selectedStock.supplierName || 'N/A'}</span>
              </div>
              <p className="text-danger mt-3 mb-0"><strong>This action cannot be undone!</strong></p>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="bg-light d-flex flex-column flex-sm-row justify-content-end gap-2">
          <CButton color="secondary" variant="outline" className="w-100 w-sm-auto" onClick={() => setDeleteModalVisible(false)}>Cancel</CButton>
          <CButton
            color="danger"
            className="px-4 w-100 w-sm-auto"
            onClick={handleDeleteInventory}
            disabled={inventoryLoading}
          >
            {inventoryLoading ? 'Deleting...' : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Stock