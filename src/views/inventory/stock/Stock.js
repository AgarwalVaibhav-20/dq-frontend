import React, { useState, useEffect, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInventories,
  addInventory,
  updateInventory,
  deleteInventory,
  getSupplierStockDetails,
  deductStock,
  clearSupplierStockDetails
} from '../../../redux/slices/stockSlice'
import { Plus } from 'lucide-react';
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
  CProgress,
  CProgressBar,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilPlus, cilInfo } from '@coreui/icons'
import jsPDF from 'jspdf'
import 'jspdf-autotable'


const processInventoryData = (inventories) => {
  return inventories.map(item => {
   
    if (item.totalQuantity === 0 && item.suppliers && item.suppliers.length > 0) {
      const calculatedTotalQuantity = item.suppliers.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const calculatedTotalAmount = item.suppliers.reduce((sum, s) => sum + (s.total || 0), 0);
     
      const calculatedRemainingQuantity = calculatedTotalQuantity - (item.totalUsedQuantity || 0);

      return {
        ...item,
       
        totalQuantity: calculatedTotalQuantity,
        totalRemainingQuantity: calculatedRemainingQuantity,
        totalAmount: calculatedTotalAmount,
      };
    }
 
    return item;
  });
};
 

const Stock = () => {
  const dispatch = useDispatch()
  const { 
    inventories: rawInventories, // Use a different name for the raw data
    supplierStockDetails, 
    loading: inventoryLoading, 
    saleProcessing 
  } = useSelector((state) => state.inventories)
  const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
  const { restaurantId, token } = useSelector((state) => state.auth)

  // Use a state for the processed inventory data
  const [inventories, setInventories] = useState([]);

  // States
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [supplierDetailsModalVisible, setSupplierDetailsModalVisible] = useState(false)
  // Deduct stock modal is commented out in the provided code, so we can keep this state commented out too
  // const [deductStockModalVisible, setDeductStockModalVisible] = useState(false)
  const [editItems, setEditItems] = useState([{
    itemName: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
    supplierId: ''
  }]);

  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editItems];
    updatedItems[index][field] = value;
    
    // If itemName changes, update filtered suppliers for that item
    if (field === 'itemName') {
      const selectedItem = availableItems.find(item => item.itemName === value);
      if (selectedItem) {
        updatedItems[index].suppliers = selectedItem.suppliers;
        if (selectedItem.suppliers.length === 1) {
          updatedItems[index].supplierId = selectedItem.suppliers[0].supplierId;
        } else {
          updatedItems[index].supplierId = '';
        }
      }
    }
    
    setEditItems(updatedItems);
  };

  const addEditItemField = () => {
    setEditItems([...editItems, {
      itemName: '',
      quantity: '',
      unit: '',
      pricePerUnit: '',
      supplierId: ''
    }]);
  };

  const removeEditItemField = (index) => {
    if (editItems.length > 1) {
      const updatedItems = editItems.filter((_, i) => i !== index);
      setEditItems(updatedItems);
    }
  };

  const [formData, setFormData] = useState({ 
    itemName: '', 
    quantity: '', 
    unit: '', 
    pricePerUnit: '', 
    supplierId: '' 
  })
  // Deduct stock data state can be removed if the modal is commented out, 
  // but keeping it for completeness if you uncomment it later.
  const [deductStockData, setDeductStockData] = useState({ 
    quantityToDeduct: '',
    deductUnit: ''
  })
  const [selectedStock, setSelectedStock] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])

  // Unit conversion helper (keep as is)
  const convertUnit = (value, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return value

    // Weight conversions
    const weightUnits = {
      'kg': 1000,
      'gm': 1,
      'mg': 0.001
    }

    // Volume conversions
    const volumeUnits = {
      'ltr': 1000,
      'ml': 1
    }

    // Check if both units are weight units
    if (weightUnits[fromUnit] && weightUnits[toUnit]) {
      const valueInGrams = value * weightUnits[fromUnit]
      return valueInGrams / weightUnits[toUnit]
    }

    // Check if both units are volume units
    if (volumeUnits[fromUnit] && volumeUnits[toUnit]) {
      const valueInMl = value * volumeUnits[fromUnit]
      return valueInMl / volumeUnits[toUnit]
    }

    // If units are not compatible, return original value
    return value
  }

  // Get compatible units for a given unit (keep as is)
  const getCompatibleUnits = (baseUnit) => {
    const weightUnits = ['kg', 'gm', 'mg']
    const volumeUnits = ['ltr', 'ml']
    
    if (weightUnits.includes(baseUnit)) return weightUnits
    if (volumeUnits.includes(baseUnit)) return volumeUnits
    return [baseUnit] // For 'pcs' or other units, only same unit allowed
  }

  // Fetch data
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchInventories({ token }))
      dispatch(fetchSuppliers({ restaurantId, token }))
    }
  }, [restaurantId, token, dispatch])


  useEffect(() => {
    
    const processedData = processInventoryData(rawInventories);
    setInventories(processedData);
  }, [rawInventories]); // Depend on rawInventories change

  // Extract items from suppliers (keep as is)
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      const items = []
      suppliers.forEach(supplier => {
        if (supplier.rawItems && supplier.rawItems.length > 0) {
          supplier.rawItems.forEach(rawItem => {
            if (rawItem && rawItem.trim()) {
              const existingItem = items.find(item =>
                item.itemName.toLowerCase() === rawItem.toLowerCase().trim()
              )
              if (!existingItem) {
                items.push({
                  itemName: rawItem.trim(),
                  suppliers: [{
                    supplierId: supplier._id,
                    supplierName: supplier.supplierName
                  }]
                })
              } else {
                existingItem.suppliers.push({
                  supplierId: supplier._id,
                  supplierName: supplier.supplierName
                })
              }
            }
          })
        }
      })
      setAvailableItems(items)
    }
  }, [suppliers])

  // Monitor low stock (Use processed inventories)
  useEffect(() => {
    const lowStock = inventories.filter(item => (item.totalRemainingQuantity || 0) <= 5)
    setLowStockItems(lowStock)
  }, [inventories])

  // Form handlers (keep as is)
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'itemName') {
      const selectedItem = availableItems.find(item => item.itemName === value)
      if (selectedItem) {
        setFilteredSuppliers(selectedItem.suppliers)
        if (selectedItem.suppliers.length === 1) {
          setFormData({
            ...formData,
            [name]: value,
            supplierId: selectedItem.suppliers[0].supplierId
          })
        } else {
          setFormData({
            ...formData,
            [name]: value,
            supplierId: ''
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

  const handleDeductStockChange = (e) => {
    setDeductStockData({ ...deductStockData, [e.target.name]: e.target.value })
  }

  // Add/Purchase inventory (keep as is)
  const handleSaveStock = async () => {
    try {
      console.log('🔄 Adding inventory with data:', formData);
      console.log('🔄 Restaurant ID:', restaurantId);
      console.log('🔄 Token:', token ? 'Present' : 'Missing');
      
      const result = await dispatch(addInventory({ 
        restaurantId, 
        ...formData, 
        token 
      })).unwrap();
      
      console.log('✅ Inventory added successfully:', result);
      
      // ✅ Fetch inventories again to get the latest data
      await dispatch(fetchInventories({ token })).unwrap()
      console.log('✅ Inventories refreshed');
      
      resetForm()
      setModalVisible(false)
    } catch (error) {
      console.error("❌ Failed to add inventory:", error)
    }
  }

  // Update inventory (Purchase more stock) (keep as is)
  const handleUpdateInventory = async () => {
    try {
      console.log('🔄 Purchasing stock for items:', editItems);
      
      
      for (const item of editItems) {
        if (item.itemName && item.quantity && item.unit && item.pricePerUnit && item.supplierId) {
         
          await dispatch(addInventory({ 
            restaurantId, 
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            supplierId: item.supplierId,
            token 
          })).unwrap();
          
          console.log('✅ Stock purchased for:', item.itemName);
        }
      }
      
      console.log('🔄 Refreshing inventory list...');
      // ✅ Fetch inventories again to get the latest data
      await dispatch(fetchInventories({ token })).unwrap();
      console.log('✅ Inventory list refreshed');
      
      setEditItems([{
        itemName: '',
        quantity: '',
        unit: '',
        pricePerUnit: '',
        supplierId: ''
      }]);
      setEditModalVisible(false);
    } catch (error) {
      console.log("❌ Error purchasing stock:", error);
      console.error('❌ Error purchasing stock:', error);
    }
  };

  // Delete inventory (keep as is)
  const handleDeleteInventory = async () => {
    try {
      await dispatch(deleteInventory({ id: selectedStock._id, token })).unwrap()
      await dispatch(fetchInventories({ restaurantId, token })).unwrap()
      setDeleteModalVisible(false)
    } catch (error) {
      console.error('Error deleting inventory:', error)
    }
  }

  // View supplier details (keep as is)
  const handleViewSupplierDetails = async (item) => {
    setSelectedStock(item)
    try {
      // Use the actual inventory ID, which is correct
      await dispatch(getSupplierStockDetails({ itemId: item._id, token })).unwrap() 
      setSupplierDetailsModalVisible(true)
    } catch (error) {
      console.error('Error fetching supplier details:', error)
    }
  }

  // Deduct stock handler (keep as is)
  const handleDeductStockItem = async () => {
    try {
      const baseUnit = selectedStock.unit;
      const deductUnit = deductStockData.deductUnit;
      const quantityInDeductUnit = parseFloat(deductStockData.quantityToDeduct);
      
      await dispatch(deductStock({
        itemId: selectedStock._id,
        quantityToDeduct: quantityInDeductUnit,
        unit: deductUnit,
        token
      })).unwrap();
      
      await dispatch(fetchInventories({ restaurantId, token })).unwrap();
      setDeductStockData({ quantityToDeduct: '', deductUnit: '' });
      // setDeductStockModalVisible(false); // Commented out to match the original code's flow
      setSelectedStock(null);
    } catch (error) {
      console.error('Failed to deduct stock:', error);
    }
  };

  const resetForm = () => {
    setFormData({ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' })
    setFilteredSuppliers([])
  }

  // Export CSV (Use processed inventories)
  const exportToCSV = useCallback(() => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Item Name,Unit,Total Qty,Remaining Qty,Used Qty,Total Amount'].join(',') +
      '\n' +
      inventories
        ?.map((row) =>
          [
            row.itemName, 
            row.unit, 
            row.totalQuantity, 
            row.totalRemainingQuantity, 
            row.totalUsedQuantity, 
            row.totalAmount
          ].join(',')
        )
        .join('\n')

    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = 'inventories.csv'
    link.click()
  }, [inventories])

  // Export PDF (Use processed inventories)
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF()
    doc.text('Stock Management', 10, 10)
    const tableColumn = ['Item Name', 'Unit', 'Total Qty', 'Remaining', 'Used', 'Amount']
    const tableRows = inventories?.map((row) => [
      row.itemName,
      row.unit,
      row.totalQuantity,
      row.totalRemainingQuantity,
      row.totalUsedQuantity,
      `₹${(row.totalAmount || 0).toLocaleString()}`
    ])

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
    doc.save('inventories.pdf')
  }, [inventories])

  // DataGrid rows (Use processed inventories)
  const rows = inventories.map((s) => ({ id: s._id, ...s }))

  // DataGrid columns (keep as is, they use the aggregated fields)
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      flex: 0.8, 
      minWidth: 80,
      valueGetter: (params) => `STK-${params.row.id.slice(-6).toUpperCase()}`,
    },
    {
      field: 'itemName', 
      headerName: 'Item Name', 
      flex: 1.5, 
      minWidth: 120,
      renderCell: (params) => {
        const remaining = params.row.totalRemainingQuantity || 0;
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: remaining <= 5 ? '#dc3545' : 'inherit',
            fontWeight: remaining <= 5 ? 'bold' : 'normal',
          }}>
            {remaining <= 5 && <span style={{ marginRight: '4px' }}>⚠️</span>}
            {params.value}
          </div>
        )
      }
    },
    {
      field: 'totalRemainingQuantity',
      headerName: 'Remaining',
      flex: 0.8,
      minWidth: 80,
      renderCell: (params) => {
        const remaining = params.value || 0;
        return (
          <span style={{
            color: remaining <= 5 ? '#dc3545' : remaining <= 10 ? '#fd7e14' : '#28a745',
            fontWeight: remaining <= 5 ? 'bold' : 'normal',
          }}>
            {remaining} {params.row.unit}
          </span>
        )
      },
    },
    {
      field: 'totalUsedQuantity',
      headerName: 'Used',
      flex: 0.8,
      minWidth: 70,
      renderCell: (params) => (
        <span style={{ color: '#6c757d' }}>
          {params.value || 0} {params.row.unit}
        </span>
      )
    },
    {
      field: 'totalQuantity',
      headerName: 'Total Purchased',
      flex: 0.9,
      minWidth: 90,
      renderCell: (params) => (
        <span style={{ fontWeight: '500' }}>
          {params.value || 0} {params.row.unit}
        </span>
      )
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      flex: 1,
      minWidth: 90,
      renderCell: (params) => (
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
          ₹{(params.value || 0).toLocaleString()}
        </span>
      )
    },
    {
      field: 'actions', 
      headerName: 'Actions', 
      flex: 1.5, 
      minWidth: 180,  
      sortable: false, 
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <CButton 
            color="info" 
            size="sm" 
            onClick={() => handleViewSupplierDetails(params.row)} 
            title="View Supplier Details"
          >
            <CIcon icon={cilInfo} size="sm" />
          </CButton>
          {/* Deduct Stock Button is commented out */}
          {/* <CButton 
            color="warning" 
            size="sm" 
            onClick={() => {
              setSelectedStock(params.row)
              setDeductStockData({ 
                quantityToDeduct: '', 
                deductUnit: params.row.unit
              })
              setDeductStockModalVisible(true)
            }} 
            title="Deduct Stock"
          >
            <CIcon icon={cilMinus} size="sm" />
          </CButton> */}
          <CButton 
            color="secondary" 
            size="sm" 
            onClick={() => {
              setSelectedStock(params.row);
              
              // Get supplier information
              const itemSuppliers = params.row.suppliers && params.row.suppliers.length > 0
                ? params.row.suppliers.map(stock => ({
                    supplierId: stock.supplierId,
                    supplierName: stock.supplierName
                  }))
                : [];
              
              // Find item in available items
              const availableItem = availableItems.find(item => 
                item.itemName.toLowerCase() === params.row.itemName.toLowerCase()
              );
              
              // Initialize ALL fields with current data
              setEditItems([{
                _id: params.row._id,
                itemName: params.row.itemName || '', // ✅ Item name pre-filled
                quantity: '', // ✅ Quantity field empty for new purchase
                unit: params.row.unit || '', // ✅ Unit pre-filled
                pricePerUnit: '', // ✅ Price field empty for new purchase
                supplierId: '', // ✅ Supplier field empty for new purchase
                supplierName: '', // ✅ Supplier name empty for new purchase
                // Use availableItem's suppliers (all potential suppliers) OR current item's suppliers
                suppliers: availableItem ? availableItem.suppliers : itemSuppliers,
                isExisting: true
              }]);
              
              setEditModalVisible(true);
            }} 
            title="Edit / Add Stock"
          >
            <Plus size={20} />
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
        <CAlert color="warning" className="mb-4 alert-theme-aware">
          <strong>⚠️ Low Stock Alert!</strong>
          <div className="mt-2">
            {lowStockItems.map(item => (
              <div key={item._id} className="mb-1">
                <strong>{item.itemName}</strong> - Only {item.totalRemainingQuantity || 0} {item.unit} remaining
              </div>
            ))}
          </div>
        </CAlert>
      )}

      {/* Header & Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <h2 className="fw-bold text-theme-aware m-0">📦 Inventory Stock</h2>

        <div className="d-flex flex-wrap gap-2">
          <CButton 
            color="primary" 
            onClick={() => setModalVisible(true)}
            size="sm"
          >
            <CIcon icon={cilPlus} className="me-1" />
            Purchase Stock
          </CButton>
          <CButton color="info" onClick={exportToCSV} size="sm">
            📊 Export CSV
          </CButton>
          <CButton color="secondary" onClick={exportToPDF} size="sm">
            📄 Export PDF
          </CButton>
        </div>
      </div>

      {/* Inventory Table */}
    <div className="card-theme-aware rounded shadow-sm p-3">
        {inventoryLoading || supplierLoading ? (
          <div className="d-flex justify-content-center py-5">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <div style={{ minHeight: '400px' }}>
  <div style={{ overflowX: 'auto', width: '100%' }}>
    <div style={{ minWidth: 600 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        pageSize={10}
        rowsPerPageOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        slots={{ toolbar: CustomToolbar }}
        sx={{
          '& .MuiDataGrid-columnHeaders': { 
            backgroundColor: '#f5f6fa', 
            fontWeight: 'bold', 
            fontSize: '0.85rem'
          },
          '& .MuiDataGrid-row:hover': { 
            backgroundColor: '#e9f2ff' 
          },
        }}
      />
    </div>
  </div>
</div>

        )}
      </div>

      {/* Purchase Stock Modal */}
      <CModal visible={modalVisible} onClose={() => { setModalVisible(false); resetForm() }} size="lg">
        <CModalHeader><CModalTitle>🛒 Purchase Stock from Supplier</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
            <CFormSelect name="itemName" value={formData.itemName} onChange={handleChange}>
              <option value="">Select Item</option>
              {availableItems.map((item, index) => (
                <option key={index} value={item.itemName}>{item.itemName}</option>
              ))}
            </CFormSelect>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
              <CFormInput
                type="number"
                min="0.01"
                step="0.01"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
              <CFormSelect name="unit" value={formData.unit} onChange={handleChange}>
                <option value="">Select Unit</option>
                <option value="kg">kg</option>
                <option value="gm">gm</option>
                <option value="ltr">ltr</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="mg">mg</option>
              </CFormSelect>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Price Per Unit <span className="text-danger">*</span></label>
            <CFormInput
              type="number"
              min="0"
              step="0.01"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleChange}
              placeholder="Enter price per unit"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Supplier <span className="text-danger">*</span></label>
            <CFormSelect name="supplierId" value={formData.supplierId} onChange={handleChange}>
              <option value="">
                {formData.itemName
                  ? (filteredSuppliers.length > 0 ? "Select Supplier" : "No suppliers for this item")
                  : "Select an item first"
                }
              </option>
              {filteredSuppliers.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierName}
                </option>
              ))}
            </CFormSelect>
          </div>

          {formData.quantity && formData.pricePerUnit && (
            <CAlert color="info">
              <strong>Total Amount:</strong> ₹{(formData.quantity * formData.pricePerUnit).toFixed(2)}
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setModalVisible(false); resetForm() }}>
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleSaveStock}
            disabled={!formData.itemName || !formData.quantity || !formData.unit || !formData.pricePerUnit || !formData.supplierId}
          >
            Purchase Stock
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit / Purchase More Stock Modal */}
      <CModal visible={editModalVisible} onClose={() => { setEditModalVisible(false); setEditItems([{ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' }]) }} size="xl">
        <CModalHeader><CModalTitle>✏️ Edit Item / Purchase More Stock</CModalTitle></CModalHeader>
        <CModalBody>
          {editItems.map((item, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Item {index + 1}</h6>
                {editItems.length > 1 && (
                  <CButton 
                    color="danger" 
                    size="sm"
                    onClick={() => removeEditItemField(index)}
                  >
                    <CIcon icon={cilTrash} size="sm" className="me-1" />
                    Remove
                  </CButton>
                )}
              </div>

              {/* Item Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Item Name <span className="text-danger">*</span>
                </label>
                {item.isExisting ? (
                  // ✅ For existing items, show readonly input (cannot be changed)
                  <CFormInput 
                    value={item.itemName}
                    readOnly
                    disabled
                    className="bg-light"
                  />
                ) : (
                  // ✅ For new items, show dropdown to select
                  <CFormSelect 
                    value={item.itemName}
                    onChange={(e) => handleEditItemChange(index, 'itemName', e.target.value)}
                  >
                    <option value="">Select Item</option>
                    {availableItems.map((availItem, idx) => (
                      <option key={idx} value={availItem.itemName}>
                        {availItem.itemName}
                      </option>
                    ))}
                  </CFormSelect>
                )}
                {item.isExisting && (
                  <small className="text-muted">Item name cannot be changed for existing items</small>
                )}
              </div>

              {/* Quantity and Unit Row */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <CFormInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Unit <span className="text-danger">*</span>
                  </label>
                  <CFormSelect 
                    value={item.unit}
                    onChange={(e) => handleEditItemChange(index, 'unit', e.target.value)}
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">kg</option>
                    <option value="gm">gm</option>
                    <option value="ltr">ltr</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="mg">mg</option>
                  </CFormSelect>
                </div>
              </div>

              {/* Price Per Unit */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Price Per Unit <span className="text-danger">*</span>
                </label>
                <CFormInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.pricePerUnit}
                  onChange={(e) => handleEditItemChange(index, 'pricePerUnit', e.target.value)}
                  placeholder="Enter price per unit"
                />
              </div>

              {/* Supplier */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Supplier <span className="text-danger">*</span>
                </label>
                <CFormSelect 
                  value={item.supplierId}
                  onChange={(e) => handleEditItemChange(index, 'supplierId', e.target.value)}
                >
                  <option value="">
                    {item.itemName
                      ? (item.suppliers?.length > 0 ? "Select Supplier" : "No suppliers for this item")
                      : "Select an item first"
                    }
                  </option>
                  {item.suppliers?.map((supplier) => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.supplierName}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              {/* Total Amount Display */}
              {item.quantity && item.pricePerUnit && (
                <CAlert color="info">
                  <strong>Total Amount:</strong> ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
                </CAlert>
              )}
            </div>
          ))}

          {/* Add Another Item Button */}
          <div className="text-center">
            <CButton 
              color="success" 
              variant="outline"
              onClick={addEditItemField}
              className="mb-3"
            >
              <CIcon icon={cilPlus} className="me-2" />
              Add Another Item
            </CButton>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => { 
              setEditModalVisible(false); 
              setEditItems([{ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' }]) 
            }}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateInventory}
            disabled={editItems.some(item => !item.itemName || !item.quantity || !item.unit || !item.pricePerUnit || !item.supplierId)}
          >
            Save Changes
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Supplier Details Modal */}
      <CModal visible={supplierDetailsModalVisible} onClose={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }} size="xl">
        <CModalHeader><CModalTitle>📊 Supplier Stock Details (FIFO Order)</CModalTitle></CModalHeader>
        <CModalBody>
          {supplierStockDetails && (
            <>
              <div className="mb-4 p-3 bg-light rounded">
                <h5 className="fw-bold mb-3">{supplierStockDetails.itemName}</h5>
                <div className="row">
                  <div className="col-md-3">
                    <small className="text-muted">Unit</small>
                    <p className="fw-bold mb-0">{supplierStockDetails.unit}</p>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Total Purchased</small>
                    <p className="fw-bold mb-0 text-primary">{supplierStockDetails.totalQuantity} {supplierStockDetails.unit}</p>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Remaining Stock</small>
                    <p className="fw-bold mb-0 text-success">{supplierStockDetails.totalRemainingQuantity} {supplierStockDetails.unit}</p>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted">Used Stock</small>
                    <p className="fw-bold mb-0 text-danger">{supplierStockDetails.totalUsedQuantity} {supplierStockDetails.unit}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <small className="text-muted">Total Investment</small>
                  <p className="fw-bold mb-0 text-success fs-5">₹{(supplierStockDetails.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Use supplierStocks or suppliers array for breakdown */}
              <h6 className="fw-bold mb-3">Supplier-wise Stock Breakdown (FIFO Order)</h6>
              <CTable striped bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Supplier</CTableHeaderCell>
                    <CTableHeaderCell>Purchased</CTableHeaderCell>
                    <CTableHeaderCell>Used</CTableHeaderCell>
                    <CTableHeaderCell>Remaining</CTableHeaderCell>
                    <CTableHeaderCell>Price/Unit</CTableHeaderCell>
                    <CTableHeaderCell>Total Amount</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Usage</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {/* Using supplierStockDetails.supplierStocks which should be populated by the API */}
                  {(supplierStockDetails.supplierStocks || []).map((stock, index) => {
                    // Fallback calculation for usage if API data is incomplete
                    const purchased = stock.purchasedQuantity || stock.quantity || 0;
                    const used = stock.usedQuantity || 0;
                    const remaining = stock.remainingQuantity || purchased - used;
                    const totalAmount = stock.totalAmount || (stock.quantity * stock.pricePerUnit) || stock.total || 0;
                    const pricePerUnit = stock.pricePerUnit || (stock.amount || 0);
                    const usagePercentage = purchased > 0 ? Math.round((used / purchased) * 100) : 0;
                    const isFullyUsed = remaining <= 0 && purchased > 0;

                    return (
                    <CTableRow key={index}>
                      <CTableDataCell>{stock.index || index + 1}</CTableDataCell>
                      <CTableDataCell className="fw-bold">{stock.supplierName}</CTableDataCell>
                      <CTableDataCell>{purchased} {supplierStockDetails.unit}</CTableDataCell>
                      <CTableDataCell className="text-danger">{used} {supplierStockDetails.unit}</CTableDataCell>
                      <CTableDataCell className="text-success fw-bold">{remaining} {supplierStockDetails.unit}</CTableDataCell>
                      <CTableDataCell>₹{pricePerUnit}</CTableDataCell>
                      <CTableDataCell className="fw-bold">₹{totalAmount.toLocaleString()}</CTableDataCell>
                      <CTableDataCell>{new Date(stock.purchasedAt).toLocaleDateString()}</CTableDataCell>
                      <CTableDataCell>
                        <div>
                          <CProgress className="mb-1" height={20}>
                            <CProgressBar color={usagePercentage > 80 ? 'danger' : usagePercentage > 50 ? 'warning' : 'success'} value={usagePercentage}>
                              {usagePercentage}%
                            </CProgressBar>
                          </CProgress>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        {isFullyUsed ? (
                          <CBadge color="danger">Fully Used</CBadge>
                        ) : remaining <= 5 && remaining > 0 ? (
                          <CBadge color="warning">Low Stock</CBadge>
                        ) : remaining > 0 ? (
                          <CBadge color="success">Available</CBadge>
                        ) : (
                          <CBadge color="secondary">No Stock</CBadge>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  )}
                </CTableBody>
              </CTable>

              <CAlert color="info" className="mt-3">
                <strong>ℹ️ FIFO Method:</strong> Stock is automatically deducted from the oldest purchase first. 
                Supplier #{supplierStockDetails.supplierStocks.find(s => !s.isFullyUsed)?.index || 'None'} will be used next.
              </CAlert>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Deduct Stock Modal with Unit Selection - COMMENTED OUT */}
      {/* <CModal visible={deductStockModalVisible} onClose={() => { setDeductStockModalVisible(false); setDeductStockData({ quantityToDeduct: '', deductUnit: '' }) }}>
        ...
      </CModal> */}

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
        <CModalHeader><CModalTitle>🗑️ Delete Inventory Item</CModalTitle></CModalHeader>
        <CModalBody>
          {selectedStock && (
            <>
              <CAlert color="danger">
                <strong>⚠️ Warning:</strong> This action cannot be undone!
              </CAlert>
              <p>Are you sure you want to delete <strong>{selectedStock.itemName}</strong>?</p>
              <p className="text-muted">This will remove all associated supplier stock records.</p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDeleteInventory}>
            Delete Item
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Stock

// import React, { useState, useEffect, useCallback } from 'react'
// import { DataGrid } from '@mui/x-data-grid'
// import { useDispatch, useSelector } from 'react-redux'
// import {
//   fetchInventories,
//   addInventory,
//   updateInventory,
//   deleteInventory,
//   getSupplierStockDetails,
//   deductStock,
//   clearSupplierStockDetails
// } from '../../../redux/slices/stockSlice'
// import { Plus } from 'lucide-react';
// import { fetchSuppliers } from '../../../redux/slices/supplierSlice'
// import CustomToolbar from '../../../utils/CustomToolbar'
// import {
//   CButton,
//   CModal,
//   CModalBody,
//   CModalFooter,
//   CModalHeader,
//   CModalTitle,
//   CFormInput,
//   CSpinner,
//   CFormSelect,
//   CAlert,
//   CProgress,
//   CProgressBar,
//   CBadge,
//   CTable,
//   CTableHead,
//   CTableRow,
//   CTableHeaderCell,
//   CTableBody,
//   CTableDataCell
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import { cilPencil, cilTrash, cilPlus, cilInfo, cilMinus } from '@coreui/icons'
// import jsPDF from 'jspdf'
// import 'jspdf-autotable'

// const Stock = () => {
//   const dispatch = useDispatch()
//   const { 
//     inventories, 
//     supplierStockDetails, 
//     loading: inventoryLoading, 
//     saleProcessing 
//   } = useSelector((state) => state.inventories)
//   const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
//   const { restaurantId, token } = useSelector((state) => state.auth)

//   // States
//   const [modalVisible, setModalVisible] = useState(false)
//   const [editModalVisible, setEditModalVisible] = useState(false)
//   const [deleteModalVisible, setDeleteModalVisible] = useState(false)
//   const [supplierDetailsModalVisible, setSupplierDetailsModalVisible] = useState(false)
//   const [deductStockModalVisible, setDeductStockModalVisible] = useState(false)
//   const [editItems, setEditItems] = useState([{
//   itemName: '',
//   quantity: '',
//   unit: '',
//   pricePerUnit: '',
//   supplierId: ''
// }]);

// const handleEditItemChange = (index, field, value) => {
//   const updatedItems = [...editItems];
//   updatedItems[index][field] = value;
  
//   // If itemName changes, update filtered suppliers for that item
//   if (field === 'itemName') {
//     const selectedItem = availableItems.find(item => item.itemName === value);
//     if (selectedItem) {
//       updatedItems[index].suppliers = selectedItem.suppliers;
//       if (selectedItem.suppliers.length === 1) {
//         updatedItems[index].supplierId = selectedItem.suppliers[0].supplierId;
//       } else {
//         updatedItems[index].supplierId = '';
//       }
//     }
//   }
  
//   setEditItems(updatedItems);
// };

// const addEditItemField = () => {
//   setEditItems([...editItems, {
//     itemName: '',
//     quantity: '',
//     unit: '',
//     pricePerUnit: '',
//     supplierId: ''
//   }]);
// };

// const removeEditItemField = (index) => {
//   if (editItems.length > 1) {
//     const updatedItems = editItems.filter((_, i) => i !== index);
//     setEditItems(updatedItems);
//   }
// };
//   const [formData, setFormData] = useState({ 
//     itemName: '', 
//     quantity: '', 
//     unit: '', 
//     pricePerUnit: '', 
//     supplierId: '' 
//   })
//   const [deductStockData, setDeductStockData] = useState({ 
//     quantityToDeduct: '',
//     deductUnit: '' // New field for deduction unit
//   })
//   const [selectedStock, setSelectedStock] = useState(null)
//   const [lowStockItems, setLowStockItems] = useState([])
//   const [availableItems, setAvailableItems] = useState([])
//   const [filteredSuppliers, setFilteredSuppliers] = useState([])

//   // Unit conversion helper
//   const convertUnit = (value, fromUnit, toUnit) => {
//     if (fromUnit === toUnit) return value

//     // Weight conversions
//     const weightUnits = {
//       'kg': 1000,
//       'gm': 1,
//       'mg': 0.001
//     }

//     // Volume conversions
//     const volumeUnits = {
//       'ltr': 1000,
//       'ml': 1
//     }

//     // Check if both units are weight units
//     if (weightUnits[fromUnit] && weightUnits[toUnit]) {
//       const valueInGrams = value * weightUnits[fromUnit]
//       return valueInGrams / weightUnits[toUnit]
//     }

//     // Check if both units are volume units
//     if (volumeUnits[fromUnit] && volumeUnits[toUnit]) {
//       const valueInMl = value * volumeUnits[fromUnit]
//       return valueInMl / volumeUnits[toUnit]
//     }

//     // If units are not compatible, return original value
//     return value
//   }

//   // Get compatible units for a given unit
//   const getCompatibleUnits = (baseUnit) => {
//     const weightUnits = ['kg', 'gm', 'mg']
//     const volumeUnits = ['ltr', 'ml']
    
//     if (weightUnits.includes(baseUnit)) return weightUnits
//     if (volumeUnits.includes(baseUnit)) return volumeUnits
//     return [baseUnit] // For 'pcs' or other units, only same unit allowed
//   }

//   // Fetch data
//   useEffect(() => {
//     if (restaurantId && token) {
//       dispatch(fetchInventories({ token }))
//       dispatch(fetchSuppliers({ restaurantId, token }))
//     }
//   }, [restaurantId, token, dispatch])

//   // Extract items from suppliers
// //   useEffect(() => {
// //   if (suppliers && suppliers.length > 0) {
// //     const items = []
// //     suppliers.forEach(supplier => {
// //       if (supplier.rawItems && supplier.rawItems.length > 0) {
// //         supplier.rawItems.forEach(rawItem => {
// //           if (rawItem && rawItem.trim()) {
// //             const existingItem = items.find(item =>
// //               item.itemName.toLowerCase() === rawItem.toLowerCase().trim()
// //             )
// //             if (!existingItem) {
// //               items.push({
// //                 itemName: rawItem.trim(),
// //                 // ✅ Remove unit: 'kg' - let user select manually
// //                 suppliers: [{
// //                   supplierId: supplier._id,
// //                   supplierName: supplier.supplierName
// //                 }]
// //               })
// //             } else {
// //               existingItem.suppliers.push({
// //                 supplierId: supplier._id,
// //                 supplierName: supplier.supplierName
// //               })
// //             }
// //           }
// //         })
// //       }
// //     })
// //     setAvailableItems(items)
// //   }
// // }, [suppliers])
// useEffect(() => {
//   if (suppliers && suppliers.length > 0) {
//     const items = []
//     suppliers.forEach(supplier => {
//       if (supplier.rawItems && supplier.rawItems.length > 0) {
//         supplier.rawItems.forEach(rawItem => {
//           if (rawItem && rawItem.trim()) {
//             const existingItem = items.find(item =>
//               item.itemName.toLowerCase() === rawItem.toLowerCase().trim()
//             )
//             if (!existingItem) {
//               items.push({
//                 itemName: rawItem.trim(),
//                 // ✅ REMOVED: unit: 'kg' - Let user select manually
//                 suppliers: [{
//                   supplierId: supplier._id,
//                   supplierName: supplier.supplierName
//                 }]
//               })
//             } else {
//               existingItem.suppliers.push({
//                 supplierId: supplier._id,
//                 supplierName: supplier.supplierName
//               })
//             }
//           }
//         })
//       }
//     })
//     setAvailableItems(items)
//   }
// }, [suppliers])
//   // Monitor low stock
//   useEffect(() => {
//     const lowStock = inventories.filter(item => (item.totalRemainingQuantity || 0) <= 5)
//     setLowStockItems(lowStock)
//   }, [inventories])

//   // Form handlers
// //   const handleChange = (e) => {
// //   const { name, value } = e.target

// //   if (name === 'itemName') {
// //     const selectedItem = availableItems.find(item => item.itemName === value)
// //     if (selectedItem) {
// //       setFilteredSuppliers(selectedItem.suppliers)
// //       if (selectedItem.suppliers.length === 1) {
// //         setFormData({
// //           ...formData,
// //           [name]: value,
// //           // ✅ Remove unit assignment - let user select manually
// //           supplierId: selectedItem.suppliers[0].supplierId
// //         })
// //       } else {
// //         setFormData({
// //           ...formData,
// //           [name]: value,
// //           // ✅ Remove unit assignment - let user select manually
// //           supplierId: ''
// //         })
// //       }
// //     } else {
// //       setFilteredSuppliers([])
// //       setFormData({ ...formData, [name]: value, unit: '', supplierId: '' })
// //     }
// //   } else {
// //     setFormData({ ...formData, [name]: value })
// //   }
// // }
// const handleChange = (e) => {
//   const { name, value } = e.target

//   if (name === 'itemName') {
//     const selectedItem = availableItems.find(item => item.itemName === value)
//     if (selectedItem) {
//       setFilteredSuppliers(selectedItem.suppliers)
//       if (selectedItem.suppliers.length === 1) {
//         setFormData({
//           ...formData,
//           [name]: value,
//           // ✅ REMOVED: unit assignment - User must select manually
//           supplierId: selectedItem.suppliers[0].supplierId
//         })
//       } else {
//         setFormData({
//           ...formData,
//           [name]: value,
//           // ✅ REMOVED: unit assignment - User must select manually
//           supplierId: ''
//         })
//       }
//     } else {
//       setFilteredSuppliers([])
//       setFormData({ ...formData, [name]: value, unit: '', supplierId: '' })
//     }
//   } else {
//     setFormData({ ...formData, [name]: value })
//   }
// }
//   const handleDeductStockChange = (e) => {
//     setDeductStockData({ ...deductStockData, [e.target.name]: e.target.value })
//   }

//   // Add/Purchase inventory
//   const handleSaveStock = async () => {
//     try {
//       await dispatch(addInventory({ 
//         restaurantId, 
//         ...formData, 
//         token 
//       })).unwrap()
//       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
//       resetForm()
//       setModalVisible(false)
//     } catch (error) {
//       console.error("Failed to add inventory:", error)
//     }
//   }

//   // Update inventory
//   // const handleUpdateInventory = async () => {
//   //   try {
//   //     await dispatch(updateInventory({ 
//   //       id: selectedStock._id, 
//   //       unit: formData.unit, 
//   //       token 
//   //     })).unwrap()
//   //     await dispatch(fetchInventories({ restaurantId, token })).unwrap()
//   //     resetForm()
//   //     setEditModalVisible(false)
//   //   } catch (error) {
//   //     console.error('Error updating inventory:', error)
//   //   }
//   // }
//   const handleUpdateInventory = async () => {
//   try {
//     // Process each item in the editItems array
//     for (const item of editItems) {
//       if (item.itemName && item.quantity && item.unit && item.pricePerUnit && item.supplierId) {
//         // If editing existing item (has _id), update it
//         if (selectedStock && item._id) {
//           await dispatch(updateInventory({ 
//             id: item._id, 
//             unit: item.unit, 
//             token 
//           })).unwrap();
//         } else {
//           // If new item, add it as a purchase
//           await dispatch(addInventory({ 
//             restaurantId, 
//             itemName: item.itemName,
//             quantity: item.quantity,
//             unit: item.unit,
//             pricePerUnit: item.pricePerUnit,
//             supplierId: item.supplierId,
//             token 
//           })).unwrap();
//         }
//       }
//     }
    
//     await dispatch(fetchInventories({ restaurantId, token })).unwrap();
//     resetForm();
//     setEditModalVisible(false);
//   } catch (error) {
//     console.error('Error updating inventory:', error);
//   }
// };

//   // Delete inventory
//   const handleDeleteInventory = async () => {
//     try {
//       await dispatch(deleteInventory({ id: selectedStock._id, token })).unwrap()
//       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
//       setDeleteModalVisible(false)
//     } catch (error) {
//       console.error('Error deleting inventory:', error)
//     }
//   }

//   // View supplier details
//   const handleViewSupplierDetails = async (item) => {
//     setSelectedStock(item)
//     try {
//       await dispatch(getSupplierStockDetails({ itemId: item._id, token })).unwrap()
//       setSupplierDetailsModalVisible(true)
//     } catch (error) {
//       console.error('Error fetching supplier details:', error)
//     }
//   }

//  // In Stock.js - handleDeductStockItem function (around line 250)
// const handleDeductStockItem = async () => {
//   try {
//     const baseUnit = selectedStock.unit;
//     const deductUnit = deductStockData.deductUnit;
//     const quantityInDeductUnit = parseFloat(deductStockData.quantityToDeduct);
    
//     // ✅ Send both quantity AND unit to backend
//     await dispatch(deductStock({
//       itemId: selectedStock._id,
//       quantityToDeduct: quantityInDeductUnit, // Send original quantity
//       unit: deductUnit, // ✅ Send the unit
//       token
//     })).unwrap();
    
//     await dispatch(fetchInventories({ restaurantId, token })).unwrap();
//     setDeductStockData({ quantityToDeduct: '', deductUnit: '' });
//     setDeductStockModalVisible(false);
//     setSelectedStock(null);
//   } catch (error) {
//     console.error('Failed to deduct stock:', error);
//   }
// };

//   const resetForm = () => {
//     setFormData({ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' })
//     setFilteredSuppliers([])
//   }

//   // Export CSV
//   const exportToCSV = useCallback(() => {
//     const csvContent =
//       'data:text/csv;charset=utf-8,' +
//       ['Item Name,Unit,Total Qty,Remaining Qty,Used Qty,Total Amount'].join(',') +
//       '\n' +
//       inventories
//         ?.map((row) =>
//           [
//             row.itemName, 
//             row.unit, 
//             row.totalQuantity, 
//             row.totalRemainingQuantity, 
//             row.totalUsedQuantity, 
//             row.totalAmount
//           ].join(',')
//         )
//         .join('\n')

//     const link = document.createElement('a')
//     link.href = encodeURI(csvContent)
//     link.download = 'inventories.csv'
//     link.click()
//   }, [inventories])

//   // Export PDF
//   const exportToPDF = useCallback(() => {
//     const doc = new jsPDF()
//     doc.text('Stock Management', 10, 10)
//     const tableColumn = ['Item Name', 'Unit', 'Total Qty', 'Remaining', 'Used', 'Amount']
//     const tableRows = inventories?.map((row) => [
//       row.itemName,
//       row.unit,
//       row.totalQuantity,
//       row.totalRemainingQuantity,
//       row.totalUsedQuantity,
//       `₹${row.totalAmount}`
//     ])

//     doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
//     doc.save('inventories.pdf')
//   }, [inventories])

//   // DataGrid rows
//   const rows = inventories.map((s) => ({ id: s._id, ...s }))

//   // DataGrid columns
//   const columns = [
//     { 
//       field: 'id', 
//       headerName: 'ID', 
//       flex: 0.8, 
//       minWidth: 80,
//       valueGetter: (params) => `STK-${params.row.id.slice(-6).toUpperCase()}`,
//     },
//     {
//       field: 'itemName', 
//       headerName: 'Item Name', 
//       flex: 1.5, 
//       minWidth: 120,
//       renderCell: (params) => {
//         const remaining = params.row.totalRemainingQuantity || 0;
//         return (
//           <div style={{
//             display: 'flex',
//             alignItems: 'center',
//             color: remaining <= 5 ? '#dc3545' : 'inherit',
//             fontWeight: remaining <= 5 ? 'bold' : 'normal',
//           }}>
//             {remaining <= 5 && <span style={{ marginRight: '4px' }}>⚠️</span>}
//             {params.value}
//           </div>
//         )
//       }
//     },
//     {
//       field: 'totalRemainingQuantity',
//       headerName: 'Remaining',
//       flex: 0.8,
//       minWidth: 80,
//       renderCell: (params) => {
//         const remaining = params.value || 0;
//         return (
//           <span style={{
//             color: remaining <= 5 ? '#dc3545' : remaining <= 10 ? '#fd7e14' : '#28a745',
//             fontWeight: remaining <= 5 ? 'bold' : 'normal',
//           }}>
//             {remaining} {params.row.unit}
//           </span>
//         )
//       },
//     },
//     {
//       field: 'totalUsedQuantity',
//       headerName: 'Used',
//       flex: 0.8,
//       minWidth: 70,
//       renderCell: (params) => (
//         <span style={{ color: '#6c757d' }}>
//           {params.value || 0} {params.row.unit}
//         </span>
//       )
//     },
//     {
//       field: 'totalQuantity',
//       headerName: 'Total Purchased',
//       flex: 0.9,
//       minWidth: 90,
//       renderCell: (params) => (
//         <span style={{ fontWeight: '500' }}>
//           {params.value || 0} {params.row.unit}
//         </span>
//       )
//     },
//     {
//       field: 'totalAmount',
//       headerName: 'Total Amount',
//       flex: 1,
//       minWidth: 90,
//       renderCell: (params) => (
//         <span style={{ color: '#28a745', fontWeight: 'bold' }}>
//           ₹{(params.value || 0).toLocaleString()}
//         </span>
//       )
//     },
//     {
//       field: 'actions', 
//       headerName: 'Actions', 
//       flex: 1.5, 
//       minWidth: 140,
//       sortable: false, 
//       filterable: false,
//       renderCell: (params) => (
//         <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
//           <CButton 
//             color="info" 
//             size="sm" 
//             onClick={() => handleViewSupplierDetails(params.row)} 
//             title="View Supplier Details"
//           >
//             <CIcon icon={cilInfo} size="sm" />
//           </CButton>
//           <CButton 
//             color="warning" 
//             size="sm" 
//             onClick={() => {
//               setSelectedStock(params.row)
//               setDeductStockData({ 
//                 quantityToDeduct: '', 
//                 deductUnit: params.row.unit // Set default to item's base unit
//               })
//               setDeductStockModalVisible(true)
//             }} 
//             title="Deduct Stock"
//           >
//             <CIcon icon={cilMinus} size="sm" />
//           </CButton>
//           <CButton 
//   color="secondary" 
//   size="sm" 
//   onClick={() => {
//     setSelectedStock(params.row);
    
//     // Initialize with current item data
//     setEditItems([{
//       _id: params.row._id,
//       itemName: params.row.itemName || '',
//       quantity: params.row.totalRemainingQuantity || '',
//       unit: params.row.unit || '',
//       pricePerUnit: '', // Can't edit price for existing items
//       supplierId: params.row.supplierStocks?.[0]?.supplierId || '',
//       isExisting: true // Flag to identify existing items
//     }]);
    
//     setEditModalVisible(true);
//   }} 
//   title="Edit Unit"
// >
//   <Plus size={20} />
// </CButton>
//           <CButton 
//             color="danger" 
//             size="sm" 
//             onClick={() => {
//               setSelectedStock(params.row)
//               setDeleteModalVisible(true)
//             }} 
//             title="Delete Item"
//           >
//             <CIcon icon={cilTrash} size="sm" />
//           </CButton>
//         </div>
//       )
//     },
//   ]

//   return (
//     <div className="p-2 p-md-4">
//       {/* Low Stock Alert */}
//       {lowStockItems.length > 0 && (
//         <CAlert color="warning" className="mb-4">
//           <strong>⚠️ Low Stock Alert!</strong>
//           <div className="mt-2">
//             {lowStockItems.map(item => (
//               <div key={item._id} className="mb-1">
//                 <strong>{item.itemName}</strong> - Only {item.totalRemainingQuantity || 0} {item.unit} remaining
//               </div>
//             ))}
//           </div>
//         </CAlert>
//       )}

//       {/* Header & Buttons */}
//       <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
//         <h2 className="fw-bold text-dark m-0">📦 Inventory Stock</h2>
//         <div className="d-flex flex-wrap gap-2">
//           <CButton 
//             color="primary" 
//             onClick={() => setModalVisible(true)}
//             size="sm"
//           >
//             <CIcon icon={cilPlus} className="me-1" />
//             Purchase Stock
//           </CButton>
//           <CButton color="info" onClick={exportToCSV} size="sm">
//             📊 Export CSV
//           </CButton>
//           <CButton color="secondary" onClick={exportToPDF} size="sm">
//             📄 Export PDF
//           </CButton>
//         </div>
//       </div>

//       {/* Inventory Table */}
//       <div className="bg-white rounded shadow-sm p-3">
//         {inventoryLoading || supplierLoading ? (
//           <div className="d-flex justify-content-center py-5">
//             <CSpinner color="primary" variant="grow" />
//           </div>
//         ) : (
//           <div style={{ minHeight: '400px' }}>
//             <DataGrid
//               rows={rows}
//               columns={columns}
//               autoHeight
//               pageSize={10}
//               rowsPerPageOptions={[5, 10, 20]}
//               disableRowSelectionOnClick
//               slots={{ toolbar: CustomToolbar }}
//               sx={{
//                 '& .MuiDataGrid-columnHeaders': { 
//                   backgroundColor: '#f5f6fa', 
//                   fontWeight: 'bold', 
//                   fontSize: '0.85rem'
//                 },
//                 '& .MuiDataGrid-row:hover': { 
//                   backgroundColor: '#e9f2ff' 
//                 },
//               }}
//             />
//           </div>
//         )}
//       </div>

//       {/* Purchase Stock Modal */}
//       <CModal visible={modalVisible} onClose={() => { setModalVisible(false); resetForm() }} size="lg">
//         <CModalHeader><CModalTitle>🛒 Purchase Stock from Supplier</CModalTitle></CModalHeader>
//         <CModalBody>
//           <div className="mb-3">
//             <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
//             <CFormSelect name="itemName" value={formData.itemName} onChange={handleChange}>
//               <option value="">Select Item</option>
//               {availableItems.map((item, index) => (
//                 <option key={index} value={item.itemName}>{item.itemName}</option>
//               ))}
//             </CFormSelect>
//           </div>

//           <div className="row">
//             <div className="col-md-6 mb-3">
//               <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
//               <CFormInput
//                 type="number"
//                 min="0.01"
//                 step="0.01"
//                 name="quantity"
//                 value={formData.quantity}
//                 onChange={handleChange}
//                 placeholder="Enter quantity"
//               />
//             </div>
//             <div className="col-md-6 mb-3">
//               <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
//               <CFormSelect name="unit" value={formData.unit} onChange={handleChange}>
//                 <option value="">Select Unit</option>
//                 <option value="kg">kg</option>
//                 <option value="gm">gm</option>
//                 <option value="ltr">ltr</option>
//                 <option value="ml">ml</option>
//                 <option value="pcs">pcs</option>
//                 <option value="mg">mg</option>
//               </CFormSelect>
//             </div>
//           </div>

//           <div className="mb-3">
//             <label className="form-label fw-semibold">Price Per Unit <span className="text-danger">*</span></label>
//             <CFormInput
//               type="number"
//               min="0"
//               step="0.01"
//               name="pricePerUnit"
//               value={formData.pricePerUnit}
//               onChange={handleChange}
//               placeholder="Enter price per unit"
//             />
//           </div>

//           <div className="mb-3">
//             <label className="form-label fw-semibold">Supplier <span className="text-danger">*</span></label>
//             <CFormSelect name="supplierId" value={formData.supplierId} onChange={handleChange}>
//               <option value="">
//                 {formData.itemName
//                   ? (filteredSuppliers.length > 0 ? "Select Supplier" : "No suppliers for this item")
//                   : "Select an item first"
//                 }
//               </option>
//               {filteredSuppliers.map((supplier) => (
//                 <option key={supplier.supplierId} value={supplier.supplierId}>
//                   {supplier.supplierName}
//                 </option>
//               ))}
//             </CFormSelect>
//           </div>

//           {formData.quantity && formData.pricePerUnit && (
//             <CAlert color="info">
//               <strong>Total Amount:</strong> ₹{(formData.quantity * formData.pricePerUnit).toFixed(2)}
//             </CAlert>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => { setModalVisible(false); resetForm() }}>
//             Cancel
//           </CButton>
//           <CButton
//             color="success"
//             onClick={handleSaveStock}
//             disabled={!formData.itemName || !formData.quantity || !formData.unit || !formData.pricePerUnit || !formData.supplierId}
//           >
//             Purchase Stock
//           </CButton>
//         </CModalFooter>
//       </CModal>

//       {/* Supplier Details Modal */}
//       <CModal visible={supplierDetailsModalVisible} onClose={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }} size="xl">
//         <CModalHeader><CModalTitle>📊 Supplier Stock Details (FIFO Order)</CModalTitle></CModalHeader>
//         <CModalBody>
//           {supplierStockDetails && (
//             <>
//               <div className="mb-4 p-3 bg-light rounded">
//                 <h5 className="fw-bold mb-3">{supplierStockDetails.itemName}</h5>
//                 <div className="row">
//                   <div className="col-md-3">
//                     <small className="text-muted">Unit</small>
//                     <p className="fw-bold mb-0">{supplierStockDetails.unit}</p>
//                   </div>
//                   <div className="col-md-3">
//                     <small className="text-muted">Total Purchased</small>
//                     <p className="fw-bold mb-0 text-primary">{supplierStockDetails.totalQuantity} {supplierStockDetails.unit}</p>
//                   </div>
//                   <div className="col-md-3">
//                     <small className="text-muted">Remaining Stock</small>
//                     <p className="fw-bold mb-0 text-success">{supplierStockDetails.totalRemainingQuantity} {supplierStockDetails.unit}</p>
//                   </div>
//                   <div className="col-md-3">
//                     <small className="text-muted">Used Stock</small>
//                     <p className="fw-bold mb-0 text-danger">{supplierStockDetails.totalUsedQuantity} {supplierStockDetails.unit}</p>
//                   </div>
//                 </div>
//                 <div className="mt-2">
//                   <small className="text-muted">Total Investment</small>
//                   <p className="fw-bold mb-0 text-success fs-5">₹{supplierStockDetails.totalAmount.toLocaleString()}</p>
//                 </div>
//               </div>

//               <h6 className="fw-bold mb-3">Supplier-wise Stock Breakdown (FIFO Order)</h6>
//               <CTable striped bordered hover responsive>
//                 <CTableHead>
//                   <CTableRow>
//                     <CTableHeaderCell>#</CTableHeaderCell>
//                     <CTableHeaderCell>Supplier</CTableHeaderCell>
//                     <CTableHeaderCell>Purchased</CTableHeaderCell>
//                     <CTableHeaderCell>Used</CTableHeaderCell>
//                     <CTableHeaderCell>Remaining</CTableHeaderCell>
//                     <CTableHeaderCell>Price/Unit</CTableHeaderCell>
//                     <CTableHeaderCell>Total Amount</CTableHeaderCell>
//                     <CTableHeaderCell>Date</CTableHeaderCell>
//                     <CTableHeaderCell>Usage</CTableHeaderCell>
//                     <CTableHeaderCell>Status</CTableHeaderCell>
//                   </CTableRow>
//                 </CTableHead>
//                 <CTableBody>
//                   {supplierStockDetails.supplierStocks.map((stock, index) => (
//                     <CTableRow key={index}>
//                       <CTableDataCell>{stock.index}</CTableDataCell>
//                       <CTableDataCell className="fw-bold">{stock.supplierName}</CTableDataCell>
//                       <CTableDataCell>{stock.purchasedQuantity} {supplierStockDetails.unit}</CTableDataCell>
//                       <CTableDataCell className="text-danger">{stock.usedQuantity} {supplierStockDetails.unit}</CTableDataCell>
//                       <CTableDataCell className="text-success fw-bold">{stock.remainingQuantity} {supplierStockDetails.unit}</CTableDataCell>
//                       <CTableDataCell>₹{stock.pricePerUnit}</CTableDataCell>
//                       <CTableDataCell className="fw-bold">₹{stock.totalAmount.toLocaleString()}</CTableDataCell>
//                       <CTableDataCell>{new Date(stock.purchasedAt).toLocaleDateString()}</CTableDataCell>
//                       <CTableDataCell>
//                         <div>
//                           <CProgress className="mb-1" height={20}>
//                             <CProgressBar color={stock.usagePercentage > 80 ? 'danger' : stock.usagePercentage > 50 ? 'warning' : 'success'} value={stock.usagePercentage}>
//                               {stock.usagePercentage}%
//                             </CProgressBar>
//                           </CProgress>
//                         </div>
//                       </CTableDataCell>
//                       <CTableDataCell>
//                         {stock.isFullyUsed ? (
//                           <CBadge color="danger">Fully Used</CBadge>
//                         ) : stock.remainingQuantity <= 5 ? (
//                           <CBadge color="warning">Low Stock</CBadge>
//                         ) : (
//                           <CBadge color="success">Available</CBadge>
//                         )}
//                       </CTableDataCell>
//                     </CTableRow>
//                   ))}
//                 </CTableBody>
//               </CTable>

//               <CAlert color="info" className="mt-3">
//                 <strong>ℹ️ FIFO Method:</strong> Stock is automatically deducted from the oldest purchase first. 
//                 Supplier #{supplierStockDetails.supplierStocks.find(s => !s.isFullyUsed)?.index || 'None'} will be used next.
//               </CAlert>
//             </>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }}>
//             Close
//           </CButton>
//         </CModalFooter>
//       </CModal>

//       {/* Deduct Stock Modal with Unit Selection */}
//       <CModal visible={deductStockModalVisible} onClose={() => { setDeductStockModalVisible(false); setDeductStockData({ quantityToDeduct: '', deductUnit: '' }) }}>
//         <CModalHeader><CModalTitle>➖ Deduct Stock (FIFO)</CModalTitle></CModalHeader>
//         <CModalBody>
//           {selectedStock && (
//             <>
//               <div className="mb-3 p-3 bg-light rounded">
//                 <h6 className="fw-bold">{selectedStock.itemName}</h6>
//                 <p className="mb-1">Available Stock: <strong className="text-success">{selectedStock.totalRemainingQuantity} {selectedStock.unit}</strong></p>
//               </div>

//               <div className="row">
//                 <div className="col-md-7 mb-3">
//                   <label className="form-label fw-semibold">Quantity to Deduct <span className="text-danger">*</span></label>
//                   <CFormInput
//                     type="number"
//                     min="0.01"
//                     step="0.01"
//                     name="quantityToDeduct"
//                     value={deductStockData.quantityToDeduct}
//                     onChange={handleDeductStockChange}
//                     placeholder="Enter quantity"
//                   />
//                 </div>
//                 <div className="col-md-5 mb-3">
//                   <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
//                   <CFormSelect
//                     name="deductUnit"
//                     value={deductStockData.deductUnit}
//                     onChange={handleDeductStockChange}
//                   >
//                     <option value="">Select Unit</option>
//                     {getCompatibleUnits(selectedStock.unit).map(unit => (
//                       <option key={unit} value={unit}>{unit}</option>
//                     ))}
//                   </CFormSelect>
//                 </div>
//               </div>

//             {/* {deductStockData.quantityToDeduct && deductStockData.deductUnit && (
//                <CAlert color="info">
//     {deductStockData.deductUnit !== selectedStock.unit ? (
//       <>
//         <strong>Conversion:</strong> {deductStockData.quantityToDeduct} {deductStockData.deductUnit} = {' '}
//         {convertUnit(parseFloat(deductStockData.quantityToDeduct), deductStockData.deductUnit, selectedStock.unit).toFixed(2)} {selectedStock.unit}
//       </>
//     ) : (
//       <strong>Deducting:</strong> {deductStockData.quantityToDeduct} {selectedStock.unit}
//     )}
//   </CAlert>
// )} */}

//               {deductStockData.quantityToDeduct && deductStockData.deductUnit && 
//                convertUnit(parseFloat(deductStockData.quantityToDeduct), deductStockData.deductUnit, selectedStock.unit) > selectedStock.totalRemainingQuantity && (
//                 <CAlert color="danger">
//                   ⚠️ Insufficient stock! You're trying to deduct more than available.
//                 </CAlert>
//               )}

//               <CAlert color="warning" className="mt-3">
//                 <strong>⚠️ Note:</strong> Stock will be deducted using FIFO method (oldest stock first).
//               </CAlert>
//             </>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => { setDeductStockModalVisible(false); setDeductStockData({ quantityToDeduct: '', deductUnit: '' }) }}>
//             Cancel
//           </CButton>
//           <CButton
//             color="danger"
//             onClick={handleDeductStockItem}
//             disabled={
//               !deductStockData.quantityToDeduct || 
//               !deductStockData.deductUnit ||
//               saleProcessing ||
//               (deductStockData.quantityToDeduct && deductStockData.deductUnit && 
//                convertUnit(parseFloat(deductStockData.quantityToDeduct), deductStockData.deductUnit, selectedStock.unit) > selectedStock.totalRemainingQuantity)
//             }
//           >
//             {saleProcessing ? <CSpinner size="sm" /> : 'Deduct Stock'}
//           </CButton>
//         </CModalFooter>
//       </CModal>
// <CModal visible={editModalVisible} onClose={() => { setEditModalVisible(false); setEditItems([{ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' }]) }} size="xl">
//   <CModalHeader><CModalTitle>✏️ Edit Item / Purchase More Stock</CModalTitle></CModalHeader>
//   <CModalBody>
//     {editItems.map((item, index) => (
//       <div key={index} className="mb-4 p-3 border rounded">
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h6 className="mb-0">Item {index + 1}</h6>
//           {editItems.length > 1 && (
//             <CButton 
//               color="danger" 
//               size="sm"
//               onClick={() => removeEditItemField(index)}
//             >
//               <CIcon icon={cilTrash} size="sm" className="me-1" />
//               Remove
//             </CButton>
//           )}
//         </div>

//         {/* Item Name */}
//         <div className="mb-3">
//           <label className="form-label fw-semibold">
//             Item Name <span className="text-danger">*</span>
//           </label>
//           {item.isExisting ? (
//             <>
//               <CFormInput 
//                 value={item.itemName} 
//                 disabled 
//                 style={{ backgroundColor: '#e9ecef' }}
//               />
//               <small className="text-muted">Item name cannot be changed for existing items</small>
//             </>
//           ) : (
//             <CFormSelect 
//               value={item.itemName}
//               onChange={(e) => handleEditItemChange(index, 'itemName', e.target.value)}
//             >
//               <option value="">Select Item</option>
//               {availableItems.map((availItem, idx) => (
//                 <option key={idx} value={availItem.itemName}>
//                   {availItem.itemName}
//                 </option>
//               ))}
//             </CFormSelect>
//           )}
//         </div>

//         {/* Quantity and Unit Row */}
//         <div className="row">
//           <div className="col-md-6 mb-3">
//             <label className="form-label fw-semibold">
//               Quantity <span className="text-danger">*</span>
//             </label>
//             <CFormInput
//               type="number"
//               min="0.01"
//               step="0.01"
//               value={item.quantity}
//               onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
//               placeholder="Enter quantity"
//               disabled={item.isExisting}
//             />
//             {item.isExisting && (
//               <small className="text-muted">Cannot change quantity for existing items</small>
//             )}
//           </div>

//           <div className="col-md-6 mb-3">
//             <label className="form-label fw-semibold">
//               Unit <span className="text-danger">*</span>
//             </label>
//             <CFormSelect 
//               value={item.unit}
//               onChange={(e) => handleEditItemChange(index, 'unit', e.target.value)}
//             >
//               <option value="">Select Unit</option>
//               <option value="kg">kg</option>
//               <option value="gm">gm</option>
//               <option value="ltr">ltr</option>
//               <option value="ml">ml</option>
//               <option value="pcs">pcs</option>
//               <option value="mg">mg</option>
//             </CFormSelect>
//           </div>
//         </div>

//         {/* Price Per Unit */}
//         <div className="mb-3">
//           <label className="form-label fw-semibold">
//             Price Per Unit <span className="text-danger">*</span>
//           </label>
//           <CFormInput
//             type="number"
//             min="0"
//             step="0.01"
//             value={item.pricePerUnit}
//             onChange={(e) => handleEditItemChange(index, 'pricePerUnit', e.target.value)}
//             placeholder="Enter price per unit"
//             disabled={item.isExisting}
//           />
//           {item.isExisting && (
//             <small className="text-muted">Cannot change price for existing items</small>
//           )}
//         </div>

//         {/* Supplier */}
//         <div className="mb-3">
//           <label className="form-label fw-semibold">
//             Supplier <span className="text-danger">*</span>
//           </label>
//           <CFormSelect 
//             value={item.supplierId}
//             onChange={(e) => handleEditItemChange(index, 'supplierId', e.target.value)}
//             disabled={item.isExisting}
//           >
//             <option value="">
//               {item.itemName
//                 ? (item.suppliers?.length > 0 ? "Select Supplier" : "No suppliers for this item")
//                 : "Select an item first"
//               }
//             </option>
//             {item.suppliers?.map((supplier) => (
//               <option key={supplier.supplierId} value={supplier.supplierId}>
//                 {supplier.supplierName}
//               </option>
//             ))}
//           </CFormSelect>
//           {item.isExisting && (
//             <small className="text-muted">Supplier cannot be changed for existing items</small>
//           )}
//         </div>

//         {/* Total Amount Display */}
//         {item.quantity && item.pricePerUnit && !item.isExisting && (
//           <CAlert color="info">
//             <strong>Total Amount:</strong> ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
//           </CAlert>
//         )}

//         {/* Warning for existing items */}
//         {item.isExisting && (
//           <CAlert color="warning">
//             <strong>⚠️ Note:</strong> You can only change the unit for existing items. 
//             To purchase more stock, add a new item below.
//           </CAlert>
//         )}
//       </div>
//     ))}

//     {/* Add Another Item Button */}
//     <div className="text-center">
//       <CButton 
//         color="success" 
//         variant="outline"
//         onClick={addEditItemField}
//         className="mb-3"
//       >
//         <CIcon icon={cilPlus} className="me-2" />
//         Add Another Item
//       </CButton>
//     </div>
//   </CModalBody>
//   <CModalFooter>
//     <CButton 
//       color="secondary" 
//       onClick={() => { 
//         setEditModalVisible(false); 
//         setEditItems([{ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' }]) 
//       }}
//     >
//       Cancel
//     </CButton>
//     <CButton
//       color="primary"
//       onClick={handleUpdateInventory}
//       disabled={editItems.some(item => !item.itemName || !item.unit || (!item.isExisting && (!item.quantity || !item.pricePerUnit || !item.supplierId)))}
//     >
//       Save Changes
//     </CButton>
//   </CModalFooter>
// </CModal>
//       {/* Edit Unit Modal */}
//       {/* <CModal visible={editModalVisible} onClose={() => { setEditModalVisible(false); resetForm() }} size="xl">
//   <CModalHeader><CModalTitle>✏️ Edit / Add Items</CModalTitle></CModalHeader>
//   <CModalBody>
//     {editItems.map((item, index) => (
//       <div key={index} className="mb-4 p-3 border rounded">
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h6 className="mb-0">Item {index + 1}</h6>
//           {editItems.length > 1 && (
//             <CButton 
//               color="danger" 
//               size="sm"
//               onClick={() => removeEditItemField(index)}
//             >
//               <CIcon icon={cilTrash} size="sm" className="me-1" />
//               Remove
//             </CButton>
//           )}
//         </div>

//         <div className="row">
//           <div className="col-md-6 mb-3">
//             <label className="form-label fw-semibold">
//               Item Name <span className="text-danger">*</span>
//             </label>
//             {item.isExisting ? (
//               <CFormInput 
//                 value={item.itemName} 
//                 disabled 
//                 style={{ backgroundColor: '#e9ecef' }}
//               />
//             ) : (
//               <CFormSelect 
//                 value={item.itemName}
//                 onChange={(e) => handleEditItemChange(index, 'itemName', e.target.value)}
//               >
//                 <option value="">Select Item</option>
//                 {availableItems.map((availItem, idx) => (
//                   <option key={idx} value={availItem.itemName}>
//                     {availItem.itemName}
//                   </option>
//                 ))}
//               </CFormSelect>
//             )}
//             {item.isExisting && (
//               <small className="text-muted">Item name cannot be changed for existing items</small>
//             )}
//           </div>

//           <div className="col-md-6 mb-3">
//             <label className="form-label fw-semibold">
//               Unit <span className="text-danger">*</span>
//             </label>
//             <CFormSelect 
//               value={item.unit}
//               onChange={(e) => handleEditItemChange(index, 'unit', e.target.value)}
//             >
//               <option value="">Select Unit</option>
//               <option value="kg">kg</option>
//               <option value="gm">gm</option>
//               <option value="ltr">ltr</option>
//               <option value="ml">ml</option>
//               <option value="pcs">pcs</option>
//               <option value="mg">mg</option>
//             </CFormSelect>
//           </div>
//         </div>

//         {!item.isExisting && (
//           <>
//             <div className="row">
//               <div className="col-md-6 mb-3">
//                 <label className="form-label fw-semibold">
//                   Quantity <span className="text-danger">*</span>
//                 </label>
//                 <CFormInput
//                   type="number"
//                   min="0.01"
//                   step="0.01"
//                   value={item.quantity}
//                   onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
//                   placeholder="Enter quantity"
//                 />
//               </div>

//               <div className="col-md-6 mb-3">
//                 <label className="form-label fw-semibold">
//                   Price Per Unit <span className="text-danger">*</span>
//                 </label>
//                 <CFormInput
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={item.pricePerUnit}
//                   onChange={(e) => handleEditItemChange(index, 'pricePerUnit', e.target.value)}
//                   placeholder="Enter price per unit"
//                 />
//               </div>
//             </div>

//             <div className="mb-3">
//               <label className="form-label fw-semibold">
//                 Supplier <span className="text-danger">*</span>
//               </label>
//               <CFormSelect 
//                 value={item.supplierId}
//                 onChange={(e) => handleEditItemChange(index, 'supplierId', e.target.value)}
//               >
//                 <option value="">
//                   {item.itemName
//                     ? (item.suppliers?.length > 0 ? "Select Supplier" : "No suppliers for this item")
//                     : "Select an item first"
//                   }
//                 </option>
//                 {item.suppliers?.map((supplier) => (
//                   <option key={supplier.supplierId} value={supplier.supplierId}>
//                     {supplier.supplierName}
//                   </option>
//                 ))}
//               </CFormSelect>
//             </div>

//             {item.quantity && item.pricePerUnit && (
//               <CAlert color="info">
//                 <strong>Total Amount:</strong> ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
//               </CAlert>
//             )}
//           </>
//         )}

//         {item.isExisting && (
//           <CAlert color="warning">
//             <strong>⚠️ Note:</strong> You can only change the unit for existing items. 
//             To purchase more stock, add a new item below.
//           </CAlert>
//         )}
//       </div>
//     ))}

//     <div className="text-center">
//       <CButton 
//         color="success" 
//         variant="outline"
//         onClick={addEditItemField}
//         className="mb-3"
//       >
//         <CIcon icon={cilPlus} className="me-2" />
//         Add Another Item
//       </CButton>
//     </div>
//   </CModalBody>
//   <CModalFooter>
//     <CButton color="secondary" onClick={() => { setEditModalVisible(false); resetForm() }}>
//       Cancel
//     </CButton>
//     <CButton
//       color="primary"
//       onClick={handleUpdateInventory}
//       disabled={editItems.every(item => !item.itemName || !item.unit)}
//     >
//       Save Changes
//     </CButton>
//   </CModalFooter>
// </CModal> */}

//       {/* Delete Confirmation Modal */}
//       <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
//         <CModalHeader><CModalTitle>🗑️ Delete Inventory Item</CModalTitle></CModalHeader>
//         <CModalBody>
//           {selectedStock && (
//             <>
//               <CAlert color="danger">
//                 <strong>⚠️ Warning:</strong> This action cannot be undone!
//               </CAlert>
//               <p>Are you sure you want to delete <strong>{selectedStock.itemName}</strong>?</p>
//               <p className="text-muted">This will remove all associated supplier stock records.</p>
//             </>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
//             Cancel
//           </CButton>
//           <CButton color="danger" onClick={handleDeleteInventory}>
//             Delete Item
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     </div>
//   )
// }

// export default Stock

// // import React, { useState, useEffect, useCallback } from 'react'
// // import { DataGrid } from '@mui/x-data-grid'
// // import { useDispatch, useSelector } from 'react-redux'
// // import {
// //   fetchInventories,
// //   addInventory,
// //   updateInventory,
// //   deleteInventory,
// //   getSupplierStockDetails,
// //   deductStock,
// //   clearSupplierStockDetails
// // } from '../../../redux/slices/stockSlice'
// // import { fetchSuppliers } from '../../../redux/slices/supplierSlice'
// // import CustomToolbar from '../../../utils/CustomToolbar'
// // import {
// //   CButton,
// //   CModal,
// //   CModalBody,
// //   CModalFooter,
// //   CModalHeader,
// //   CModalTitle,
// //   CFormInput,
// //   CSpinner,
// //   CFormSelect,
// //   CAlert,
// //   CProgress,
// //   CProgressBar,
// //   CBadge,
// //   CTable,
// //   CTableHead,
// //   CTableRow,
// //   CTableHeaderCell,
// //   CTableBody,
// //   CTableDataCell
// // } from '@coreui/react'
// // import CIcon from '@coreui/icons-react'
// // import { cilPencil, cilTrash, cilPlus, cilInfo, cilMinus } from '@coreui/icons'
// // import jsPDF from 'jspdf'
// // import 'jspdf-autotable'

// // const Stock = () => {
// //   const dispatch = useDispatch()
// //   const { 
// //     inventories, 
// //     supplierStockDetails, 
// //     loading: inventoryLoading, 
// //     saleProcessing 
// //   } = useSelector((state) => state.inventories)
// //   const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
// //   const { restaurantId, token } = useSelector((state) => state.auth)

// //   // States
// //   const [modalVisible, setModalVisible] = useState(false)
// //   const [editModalVisible, setEditModalVisible] = useState(false)
// //   const [deleteModalVisible, setDeleteModalVisible] = useState(false)
// //   const [supplierDetailsModalVisible, setSupplierDetailsModalVisible] = useState(false)
// //   const [deductStockModalVisible, setDeductStockModalVisible] = useState(false)
  
// //   const [formData, setFormData] = useState({ 
// //     itemName: '', 
// //     quantity: '', 
// //     unit: '', 
// //     pricePerUnit: '', 
// //     supplierId: '' 
// //   })
// //   const [deductStockData, setDeductStockData] = useState({ quantityToDeduct: '' })
// //   const [selectedStock, setSelectedStock] = useState(null)
// //   const [lowStockItems, setLowStockItems] = useState([])
// //   const [availableItems, setAvailableItems] = useState([])
// //   const [filteredSuppliers, setFilteredSuppliers] = useState([])

// //   // Fetch data
// //   useEffect(() => {
// //     if (restaurantId && token) {
// //       dispatch(fetchInventories({ token }))
// //       dispatch(fetchSuppliers({ restaurantId, token }))
// //     }
// //   }, [restaurantId, token, dispatch])

// //   // Extract items from suppliers
// //   useEffect(() => {
// //     if (suppliers && suppliers.length > 0) {
// //       const items = []
// //       suppliers.forEach(supplier => {
// //         if (supplier.rawItems && supplier.rawItems.length > 0) {
// //           supplier.rawItems.forEach(rawItem => {
// //             if (rawItem && rawItem.trim()) {
// //               const existingItem = items.find(item =>
// //                 item.itemName.toLowerCase() === rawItem.toLowerCase().trim()
// //               )
// //               if (!existingItem) {
// //                 items.push({
// //                   itemName: rawItem.trim(),
// //                   unit: 'kg',
// //                   suppliers: [{
// //                     supplierId: supplier._id,
// //                     supplierName: supplier.supplierName
// //                   }]
// //                 })
// //               } else {
// //                 existingItem.suppliers.push({
// //                   supplierId: supplier._id,
// //                   supplierName: supplier.supplierName
// //                 })
// //               }
// //             }
// //           })
// //         }
// //       })
// //       setAvailableItems(items)
// //     }
// //   }, [suppliers])

// //   // Monitor low stock
// //   useEffect(() => {
// //     const lowStock = inventories.filter(item => (item.totalRemainingQuantity || 0) <= 5)
// //     setLowStockItems(lowStock)
// //   }, [inventories])

// //   // Form handlers
// //   const handleChange = (e) => {
// //     const { name, value } = e.target

// //     if (name === 'itemName') {
// //       const selectedItem = availableItems.find(item => item.itemName === value)
// //       if (selectedItem) {
// //         setFilteredSuppliers(selectedItem.suppliers)
// //         if (selectedItem.suppliers.length === 1) {
// //           setFormData({
// //             ...formData,
// //             [name]: value,
// //             unit: selectedItem.unit || '',
// //             supplierId: selectedItem.suppliers[0].supplierId
// //           })
// //         } else {
// //           setFormData({
// //             ...formData,
// //             [name]: value,
// //             unit: selectedItem.unit || '',
// //             supplierId: ''
// //           })
// //         }
// //       } else {
// //         setFilteredSuppliers([])
// //         setFormData({ ...formData, [name]: value, unit: '', supplierId: '' })
// //       }
// //     } else {
// //       setFormData({ ...formData, [name]: value })
// //     }
// //   }

// //   const handleDeductStockChange = (e) => {
// //     setDeductStockData({ ...deductStockData, [e.target.name]: e.target.value })
// //   }

// //   // Add/Purchase inventory
// //   const handleSaveStock = async () => {
// //     try {
// //       await dispatch(addInventory({ 
// //         restaurantId, 
// //         ...formData, 
// //         token 
// //       })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       resetForm()
// //       setModalVisible(false)
// //     } catch (error) {
// //       console.error("Failed to add inventory:", error)
// //     }
// //   }

// //   // Update inventory
// //   const handleUpdateInventory = async () => {
// //     try {
// //       await dispatch(updateInventory({ 
// //         id: selectedStock._id, 
// //         unit: formData.unit, 
// //         token 
// //       })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       resetForm()
// //       setEditModalVisible(false)
// //     } catch (error) {
// //       console.error('Error updating inventory:', error)
// //     }
// //   }

// //   // Delete inventory
// //   const handleDeleteInventory = async () => {
// //     try {
// //       await dispatch(deleteInventory({ id: selectedStock._id, token })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       setDeleteModalVisible(false)
// //     } catch (error) {
// //       console.error('Error deleting inventory:', error)
// //     }
// //   }

// //   // View supplier details
// //   const handleViewSupplierDetails = async (item) => {
// //     setSelectedStock(item)
// //     try {
// //       await dispatch(getSupplierStockDetails({ itemId: item._id, token })).unwrap()
// //       setSupplierDetailsModalVisible(true)
// //     } catch (error) {
// //       console.error('Error fetching supplier details:', error)
// //     }
// //   }

// //   // Deduct stock handler
// //   const handleDeductStockItem = async () => {
// //     try {
// //       await dispatch(deductStock({
// //         itemId: selectedStock._id,
// //         quantityToDeduct: parseFloat(deductStockData.quantityToDeduct),
// //         token
// //       })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       setDeductStockData({ quantityToDeduct: '' })
// //       setDeductStockModalVisible(false)
// //       setSelectedStock(null)
// //     } catch (error) {
// //       console.error('Failed to deduct stock:', error)
// //     }
// //   }

// //   const resetForm = () => {
// //     setFormData({ itemName: '', quantity: '', unit: '', pricePerUnit: '', supplierId: '' })
// //     setFilteredSuppliers([])
// //   }

// //   // Export CSV
// //   const exportToCSV = useCallback(() => {
// //     const csvContent =
// //       'data:text/csv;charset=utf-8,' +
// //       ['Item Name,Unit,Total Qty,Remaining Qty,Used Qty,Total Amount'].join(',') +
// //       '\n' +
// //       inventories
// //         ?.map((row) =>
// //           [
// //             row.itemName, 
// //             row.unit, 
// //             row.totalQuantity, 
// //             row.totalRemainingQuantity, 
// //             row.totalUsedQuantity, 
// //             row.totalAmount
// //           ].join(',')
// //         )
// //         .join('\n')

// //     const link = document.createElement('a')
// //     link.href = encodeURI(csvContent)
// //     link.download = 'inventories.csv'
// //     link.click()
// //   }, [inventories])

// //   // Export PDF
// //   const exportToPDF = useCallback(() => {
// //     const doc = new jsPDF()
// //     doc.text('Stock Management', 10, 10)
// //     const tableColumn = ['Item Name', 'Unit', 'Total Qty', 'Remaining', 'Used', 'Amount']
// //     const tableRows = inventories?.map((row) => [
// //       row.itemName,
// //       row.unit,
// //       row.totalQuantity,
// //       row.totalRemainingQuantity,
// //       row.totalUsedQuantity,
// //       `₹${row.totalAmount}`
// //     ])

// //     doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
// //     doc.save('inventories.pdf')
// //   }, [inventories])

// //   // DataGrid rows
// //   const rows = inventories.map((s) => ({ id: s._id, ...s }))

// //   // DataGrid columns
// //   const columns = [
// //     { 
// //       field: 'id', 
// //       headerName: 'ID', 
// //       flex: 0.8, 
// //       minWidth: 80,
// //       valueGetter: (params) => `STK-${params.row.id.slice(-6).toUpperCase()}`,
// //     },
// //     {
// //       field: 'itemName', 
// //       headerName: 'Item Name', 
// //       flex: 1.5, 
// //       minWidth: 120,
// //       renderCell: (params) => {
// //         const remaining = params.row.totalRemainingQuantity || 0;
// //         return (
// //           <div style={{
// //             display: 'flex',
// //             alignItems: 'center',
// //             color: remaining <= 5 ? '#dc3545' : 'inherit',
// //             fontWeight: remaining <= 5 ? 'bold' : 'normal',
// //           }}>
// //             {remaining <= 5 && <span style={{ marginRight: '4px' }}>⚠️</span>}
// //             {params.value}
// //           </div>
// //         )
// //       }
// //     },
// //     {
// //       field: 'totalRemainingQuantity',
// //       headerName: 'Remaining',
// //       flex: 0.8,
// //       minWidth: 80,
// //       renderCell: (params) => {
// //         const remaining = params.value || 0;
// //         return (
// //           <span style={{
// //             color: remaining <= 5 ? '#dc3545' : remaining <= 10 ? '#fd7e14' : '#28a745',
// //             fontWeight: remaining <= 5 ? 'bold' : 'normal',
// //           }}>
// //             {remaining} {params.row.unit}
// //           </span>
// //         )
// //       },
// //     },
// //     {
// //       field: 'totalUsedQuantity',
// //       headerName: 'Used',
// //       flex: 0.8,
// //       minWidth: 70,
// //       renderCell: (params) => (
// //         <span style={{ color: '#6c757d' }}>
// //           {params.value || 0} {params.row.unit}
// //         </span>
// //       )
// //     },
// //     {
// //       field: 'totalQuantity',
// //       headerName: 'Total Purchased',
// //       flex: 0.9,
// //       minWidth: 90,
// //       renderCell: (params) => (
// //         <span style={{ fontWeight: '500' }}>
// //           {params.value || 0} {params.row.unit}
// //         </span>
// //       )
// //     },
// //     {
// //       field: 'totalAmount',
// //       headerName: 'Total Amount',
// //       flex: 1,
// //       minWidth: 90,
// //       renderCell: (params) => (
// //         <span style={{ color: '#28a745', fontWeight: 'bold' }}>
// //           ₹{(params.value || 0).toLocaleString()}
// //         </span>
// //       )
// //     },
// //     {
// //       field: 'actions', 
// //       headerName: 'Actions', 
// //       flex: 1.5, 
// //       minWidth: 140,
// //       sortable: false, 
// //       filterable: false,
// //       renderCell: (params) => (
// //         <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
// //           <CButton 
// //             color="info" 
// //             size="sm" 
// //             onClick={() => handleViewSupplierDetails(params.row)} 
// //             title="View Supplier Details"
// //           >
// //             <CIcon icon={cilInfo} size="sm" />
// //           </CButton>
// //           <CButton 
// //             color="warning" 
// //             size="sm" 
// //             onClick={() => {
// //               setSelectedStock(params.row)
// //               setDeductStockModalVisible(true)
// //             }} 
// //             title="Deduct Stock"
// //           >
// //             <CIcon icon={cilMinus} size="sm" />
// //           </CButton>
// //           <CButton 
// //             color="secondary" 
// //             size="sm" 
// //             onClick={() => {
// //               setSelectedStock(params.row)
// //               setFormData({
// //                 itemName: params.row.itemName || '',
// //                 unit: params.row.unit || '',
// //               })
// //               setEditModalVisible(true)
// //             }} 
// //             title="Edit Unit"
// //           >
// //             <CIcon icon={cilPencil} size="sm" />
// //           </CButton>
// //           <CButton 
// //             color="danger" 
// //             size="sm" 
// //             onClick={() => {
// //               setSelectedStock(params.row)
// //               setDeleteModalVisible(true)
// //             }} 
// //             title="Delete Item"
// //           >
// //             <CIcon icon={cilTrash} size="sm" />
// //           </CButton>
// //         </div>
// //       )
// //     },
// //   ]

// //   return (
// //     <div className="p-2 p-md-4">
// //       {/* Low Stock Alert */}
// //       {lowStockItems.length > 0 && (
// //         <CAlert color="warning" className="mb-4">
// //           <strong>⚠️ Low Stock Alert!</strong>
// //           <div className="mt-2">
// //             {lowStockItems.map(item => (
// //               <div key={item._id} className="mb-1">
// //                 <strong>{item.itemName}</strong> - Only {item.totalRemainingQuantity || 0} {item.unit} remaining
// //               </div>
// //             ))}
// //           </div>
// //         </CAlert>
// //       )}

// //       {/* Header & Buttons */}
// //       <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
// //         <h2 className="fw-bold text-dark m-0">📦 Inventory Stock (FIFO Method)</h2>
// //         <div className="d-flex flex-wrap gap-2">
// //           <CButton 
// //             color="primary" 
// //             onClick={() => setModalVisible(true)}
// //             size="sm"
// //           >
// //             <CIcon icon={cilPlus} className="me-1" />
// //             Purchase Stock
// //           </CButton>
// //           <CButton color="info" onClick={exportToCSV} size="sm">
// //             📑 Export CSV
// //           </CButton>
// //           <CButton color="secondary" onClick={exportToPDF} size="sm">
// //             📄 Export PDF
// //           </CButton>
// //         </div>
// //       </div>

// //       {/* Inventory Table */}
// //       <div className="bg-white rounded shadow-sm p-3">
// //         {inventoryLoading || supplierLoading ? (
// //           <div className="d-flex justify-content-center py-5">
// //             <CSpinner color="primary" variant="grow" />
// //           </div>
// //         ) : (
// //           <div style={{ minHeight: '400px' }}>
// //             <DataGrid
// //               rows={rows}
// //               columns={columns}
// //               autoHeight
// //               pageSize={10}
// //               rowsPerPageOptions={[5, 10, 20]}
// //               disableRowSelectionOnClick
// //               slots={{ toolbar: CustomToolbar }}
// //               sx={{
// //                 '& .MuiDataGrid-columnHeaders': { 
// //                   backgroundColor: '#f5f6fa', 
// //                   fontWeight: 'bold', 
// //                   fontSize: '0.85rem'
// //                 },
// //                 '& .MuiDataGrid-row:hover': { 
// //                   backgroundColor: '#e9f2ff' 
// //                 },
// //               }}
// //             />
// //           </div>
// //         )}
// //       </div>

// //       {/* Purchase Stock Modal */}
// //       <CModal visible={modalVisible} onClose={() => { setModalVisible(false); resetForm() }} size="lg">
// //         <CModalHeader><CModalTitle>🛒 Purchase Stock from Supplier</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           <div className="mb-3">
// //             <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
// //             <CFormSelect name="itemName" value={formData.itemName} onChange={handleChange}>
// //               <option value="">Select Item</option>
// //               {availableItems.map((item, index) => (
// //                 <option key={index} value={item.itemName}>{item.itemName}</option>
// //               ))}
// //             </CFormSelect>
// //           </div>

// //           <div className="row">
// //             <div className="col-md-6 mb-3">
// //               <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
// //               <CFormInput
// //                 type="number"
// //                 min="0.01"
// //                 step="0.01"
// //                 name="quantity"
// //                 value={formData.quantity}
// //                 onChange={handleChange}
// //                 placeholder="Enter quantity"
// //               />
// //             </div>
// //             <div className="col-md-6 mb-3">
// //               <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
// //               <CFormSelect name="unit" value={formData.unit} onChange={handleChange}>
// //                 <option value="">Select Unit</option>
// //                 <option value="kg">kg</option>
// //                 <option value="gm">gm</option>
// //                 <option value="ltr">ltr</option>
// //                 <option value="ml">ml</option>
// //                 <option value="pcs">pcs</option>
// //                 <option value="mg">mg</option>
// //               </CFormSelect>
// //             </div>
// //           </div>

// //           <div className="mb-3">
// //             <label className="form-label fw-semibold">Price Per Unit <span className="text-danger">*</span></label>
// //             <CFormInput
// //               type="number"
// //               min="0"
// //               step="0.01"
// //               name="pricePerUnit"
// //               value={formData.pricePerUnit}
// //               onChange={handleChange}
// //               placeholder="Enter price per unit"
// //             />
// //           </div>

// //           <div className="mb-3">
// //             <label className="form-label fw-semibold">Supplier <span className="text-danger">*</span></label>
// //             <CFormSelect name="supplierId" value={formData.supplierId} onChange={handleChange}>
// //               <option value="">
// //                 {formData.itemName
// //                   ? (filteredSuppliers.length > 0 ? "Select Supplier" : "No suppliers for this item")
// //                   : "Select an item first"
// //                 }
// //               </option>
// //               {filteredSuppliers.map((supplier) => (
// //                 <option key={supplier.supplierId} value={supplier.supplierId}>
// //                   {supplier.supplierName}
// //                 </option>
// //               ))}
// //             </CFormSelect>
// //           </div>

// //           {formData.quantity && formData.pricePerUnit && (
// //             <CAlert color="info">
// //               <strong>Total Amount:</strong> ₹{(formData.quantity * formData.pricePerUnit).toFixed(2)}
// //             </CAlert>
// //           )}
// //         </CModalBody>
// //         <CModalFooter>
// //           <CButton color="secondary" onClick={() => { setModalVisible(false); resetForm() }}>
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="success"
// //             onClick={handleSaveStock}
// //             disabled={!formData.itemName || !formData.quantity || !formData.unit || !formData.pricePerUnit || !formData.supplierId}
// //           >
// //             Purchase Stock
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Supplier Details Modal */}
// //       <CModal visible={supplierDetailsModalVisible} onClose={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }} size="xl">
// //         <CModalHeader><CModalTitle>📊 Supplier Stock Details (FIFO Order)</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           {supplierStockDetails && (
// //             <>
// //               <div className="mb-4 p-3 bg-light rounded">
// //                 <h5 className="fw-bold mb-3">{supplierStockDetails.itemName}</h5>
// //                 <div className="row">
// //                   <div className="col-md-3">
// //                     <small className="text-muted">Unit</small>
// //                     <p className="fw-bold mb-0">{supplierStockDetails.unit}</p>
// //                   </div>
// //                   <div className="col-md-3">
// //                     <small className="text-muted">Total Purchased</small>
// //                     <p className="fw-bold mb-0 text-primary">{supplierStockDetails.totalQuantity} {supplierStockDetails.unit}</p>
// //                   </div>
// //                   <div className="col-md-3">
// //                     <small className="text-muted">Remaining Stock</small>
// //                     <p className="fw-bold mb-0 text-success">{supplierStockDetails.totalRemainingQuantity} {supplierStockDetails.unit}</p>
// //                   </div>
// //                   <div className="col-md-3">
// //                     <small className="text-muted">Used Stock</small>
// //                     <p className="fw-bold mb-0 text-danger">{supplierStockDetails.totalUsedQuantity} {supplierStockDetails.unit}</p>
// //                   </div>
// //                 </div>
// //                 <div className="mt-2">
// //                   <small className="text-muted">Total Investment</small>
// //                   <p className="fw-bold mb-0 text-success fs-5">₹{supplierStockDetails.totalAmount.toLocaleString()}</p>
// //                 </div>
// //               </div>

// //               <h6 className="fw-bold mb-3">Supplier-wise Stock Breakdown (FIFO Order)</h6>
// //               <CTable striped bordered hover responsive>
// //                 <CTableHead>
// //                   <CTableRow>
// //                     <CTableHeaderCell>#</CTableHeaderCell>
// //                     <CTableHeaderCell>Supplier</CTableHeaderCell>
// //                     <CTableHeaderCell>Purchased</CTableHeaderCell>
// //                     <CTableHeaderCell>Used</CTableHeaderCell>
// //                     <CTableHeaderCell>Remaining</CTableHeaderCell>
// //                     <CTableHeaderCell>Price/Unit</CTableHeaderCell>
// //                     <CTableHeaderCell>Total Amount</CTableHeaderCell>
// //                     <CTableHeaderCell>Date</CTableHeaderCell>
// //                     <CTableHeaderCell>Usage</CTableHeaderCell>
// //                     <CTableHeaderCell>Status</CTableHeaderCell>
// //                   </CTableRow>
// //                 </CTableHead>
// //                 <CTableBody>
// //                   {supplierStockDetails.supplierStocks.map((stock, index) => (
// //                     <CTableRow key={index}>
// //                       <CTableDataCell>{stock.index}</CTableDataCell>
// //                       <CTableDataCell className="fw-bold">{stock.supplierName}</CTableDataCell>
// //                       <CTableDataCell>{stock.purchasedQuantity} {supplierStockDetails.unit}</CTableDataCell>
// //                       <CTableDataCell className="text-danger">{stock.usedQuantity} {supplierStockDetails.unit}</CTableDataCell>
// //                       <CTableDataCell className="text-success fw-bold">{stock.remainingQuantity} {supplierStockDetails.unit}</CTableDataCell>
// //                       <CTableDataCell>₹{stock.pricePerUnit}</CTableDataCell>
// //                       <CTableDataCell className="fw-bold">₹{stock.totalAmount.toLocaleString()}</CTableDataCell>
// //                       <CTableDataCell>{new Date(stock.purchasedAt).toLocaleDateString()}</CTableDataCell>
// //                       <CTableDataCell>
// //                         <div>
// //                           <CProgress className="mb-1" height={20}>
// //                             <CProgressBar color={stock.usagePercentage > 80 ? 'danger' : stock.usagePercentage > 50 ? 'warning' : 'success'} value={stock.usagePercentage}>
// //                               {stock.usagePercentage}%
// //                             </CProgressBar>
// //                           </CProgress>
// //                         </div>
// //                       </CTableDataCell>
// //                       <CTableDataCell>
// //                         {stock.isFullyUsed ? (
// //                           <CBadge color="danger">Fully Used</CBadge>
// //                         ) : stock.remainingQuantity <= 5 ? (
// //                           <CBadge color="warning">Low Stock</CBadge>
// //                         ) : (
// //                           <CBadge color="success">Available</CBadge>
// //                         )}
// //                       </CTableDataCell>
// //                     </CTableRow>
// //                   ))}
// //                 </CTableBody>
// //               </CTable>

// //               <CAlert color="info" className="mt-3">
// //                 <strong>ℹ️ FIFO Method:</strong> Stock is automatically deducted from the oldest purchase first. 
// //                 Supplier #{supplierStockDetails.supplierStocks.find(s => !s.isFullyUsed)?.index || 'None'} will be used next.
// //               </CAlert>
// //             </>
// //           )}
// //         </CModalBody>
// //         <CModalFooter>
// //           <CButton color="secondary" onClick={() => { setSupplierDetailsModalVisible(false); dispatch(clearSupplierStockDetails()) }}>
// //             Close
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Deduct Stock Modal */}
// //       <CModal visible={deductStockModalVisible} onClose={() => { setDeductStockModalVisible(false); setDeductStockData({ quantityToDeduct: '' }) }}>
// //         <CModalHeader><CModalTitle>➖ Deduct Stock (FIFO)</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           {selectedStock && (
// //             <>
// //               <div className="mb-3 p-3 bg-light rounded">
// //                 <h6 className="fw-bold">{selectedStock.itemName}</h6>
// //                 <p className="mb-1">Available Stock: <strong className="text-success">{selectedStock.totalRemainingQuantity} {selectedStock.unit}</strong></p>
// //               </div>

// //               <div className="mb-3">
// //                 <label className="form-label fw-semibold">Quantity to Deduct <span className="text-danger">*</span></label>
// //                 <CFormInput
// //                   type="number"
// //                   min="0.01"
// //                   step="0.01"
// //                   max={selectedStock.totalRemainingQuantity}
// //                   name="quantityToDeduct"
// //                   value={deductStockData.quantityToDeduct}
// //                   onChange={handleDeductStockChange}
// //                   placeholder="Enter quantity"
// //                 />
// //               </div>

// //               <CAlert color="warning">
// //                 <strong>⚠️ FIFO Method:</strong> Stock will be deducted from the oldest supplier purchase first.
// //               </CAlert>
// //             </>
// //           )}
// //         </CModalBody>
// //         <CModalFooter>
// //           <CButton color="secondary" onClick={() => { setDeductStockModalVisible(false); setDeductStockData({ quantityToDeduct: '' }) }}>
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="danger"
// //             onClick={handleDeductStockItem}
// //             disabled={!deductStockData.quantityToDeduct || saleProcessing}
// //           >
// //             {saleProcessing ? 'Processing...' : 'Deduct Stock'}
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Edit Modal */}
// //       <CModal visible={editModalVisible} onClose={() => { setEditModalVisible(false); resetForm() }}>
// //         <CModalHeader><CModalTitle>✏️ Edit Unit</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           <div className="mb-3">
// //             <label className="form-label">Item Name</label>
// //             <CFormInput value={formData.itemName} readOnly style={{ backgroundColor: '#e9ecef' }} />
// //           </div>
// //           <div className="mb-3">
// //             <label className="form-label fw-semibold">Unit</label>
// //             <CFormSelect name="unit" value={formData.unit} onChange={handleChange}>
// //               <option value="kg">kg</option>
// //               <option value="gm">gm</option>
// //               <option value="ltr">ltr</option>
// //               <option value="ml">ml</option>
// //               <option value="pcs">pcs</option>
// //               <option value="mg">mg</option>
// //             </CFormSelect>
// //           </div>
// //         </CModalBody>
// //         <CModalFooter>
// //           <CButton color="secondary" onClick={() => { setEditModalVisible(false); resetForm() }}>Cancel</CButton>
// //           <CButton color="primary" onClick={handleUpdateInventory}>Update</CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Delete Modal */}
// //       <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
// //         <CModalHeader><CModalTitle className="text-danger">⚠️ Delete Inventory</CModalTitle></CModalHeader>
// //         <CModalBody className="text-center">
// //           {selectedStock && (
// //             <div>
// //               <p>Are you sure you want to delete <strong>{selectedStock.itemName}</strong>?</p>
// //               <p className="text-danger"><strong>This will delete all supplier stock records!</strong></p>
// //             </div>
// //           )}
// //         </CModalBody>
// //         <CModalFooter>
// //           <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>Cancel</CButton>
// //           <CButton color="danger" onClick={handleDeleteInventory}>Delete</CButton>
// //         </CModalFooter>
// //       </CModal>
// //     </div>
// //   )
// // }

// // export default Stock

// // import React, { useState, useEffect, useCallback } from 'react'
// // import { DataGrid } from '@mui/x-data-grid'
// // import { useDispatch, useSelector } from 'react-redux'
// // import {
// //   fetchInventories,
// //   addInventory,
// //   updateInventory,
// //   deleteInventory,
// //   addQuantityStock, // Updated thunk
// // } from '../../../redux/slices/stockSlice'
// // import { fetchSuppliers } from '../../../redux/slices/supplierSlice'
// // import CustomToolbar from '../../../utils/CustomToolbar'
// // import {
// //   CButton,
// //   CModal,
// //   CModalBody,
// //   CModalFooter,
// //   CModalHeader,
// //   CModalTitle,
// //   CFormInput,
// //   CSpinner,
// //   CFormSelect,
// //   CAlert,
// // } from '@coreui/react'
// // import CIcon from '@coreui/icons-react'
// // import { cilPencil, cilTrash, cilPlus } from '@coreui/icons'
// // import jsPDF from 'jspdf'
// // import 'jspdf-autotable'

// // const Stock = () => {
// //   const dispatch = useDispatch()
// //   const { inventories, loading: inventoryLoading, saleProcessing } = useSelector((state) => state.inventories)
// //   const { suppliers, loading: supplierLoading } = useSelector((state) => state.suppliers)
// //   const { restaurantId, token } = useSelector((state) => state.auth)

// //   // States
// //   const [modalVisible, setModalVisible] = useState(false)
// //   const [editModalVisible, setEditModalVisible] = useState(false)
// //   const [deleteModalVisible, setDeleteModalVisible] = useState(false)
// //   const [addQuantityStockModalVisible, setaddQuantityStockModalVisible] = useState(false) // Add stock modal
// //   const [formData, setFormData] = useState({ itemName: '', quantity: '', unit: '', amount: '', supplierId: '', total: '' })
// //   const [addQuantityStockData, setaddQuantityStockData] = useState({ quantityToAdd: '' })
// //   const [selectedStock, setSelectedStock] = useState(null)
// //   const [lowStockItems, setLowStockItems] = useState([])
// //   const [availableItems, setAvailableItems] = useState([]) // Items from suppliers (rawItem)
// //   const [filteredSuppliers, setFilteredSuppliers] = useState([]) // Filtered suppliers based on selected item

// //   // Fetch inventories and suppliers
// //   useEffect(() => {
// //     if (restaurantId && token) {
// //       dispatch(fetchInventories({ token }))
// //       dispatch(fetchSuppliers({ restaurantId, token }))
// //     }
// //   }, [restaurantId, token, dispatch])

// //   // Debug: Log inventories data
// //   useEffect(() => {
// //     console.log('=== FRONTEND DEBUG ===');
// //     console.log('Inventories data:', inventories);
// //     console.log('Inventories length:', inventories?.length);
    
// //     if (inventories && inventories.length > 0) {
// //       inventories.forEach((item, index) => {
// //         console.log(`Item ${index + 1}:`, {
// //           name: item.itemName,
// //           stock: item.stock,
// //           quantity: item.stock?.quantity,
// //           hasStock: !!item.stock,
// //           stockKeys: item.stock ? Object.keys(item.stock) : 'No stock object'
// //         });
// //       });
// //     } else {
// //       console.log('No inventories data found');
// //     }
// //     console.log('=== END FRONTEND DEBUG ===');
// //   }, [inventories])

// //   // Extract unique items from all suppliers (based on rawItem field)
// //   useEffect(() => {
// //     console.log('Suppliers data:', suppliers) // Debug log

// //     if (suppliers && suppliers.length > 0) {
// //       const items = []
// //       suppliers.forEach(supplier => {
// //         console.log('Processing supplier:', supplier) // Debug log

// //         // Get the raw item from supplier
// //         const rawItemName = supplier.rawItem

// //         if (rawItemName && rawItemName.trim()) {
// //           console.log('Processing raw item:', rawItemName) // Debug log

// //           // Check if item already exists in the array
// //           const existingItem = items.find(existingItem =>
// //             existingItem.itemName.toLowerCase() === rawItemName.toLowerCase().trim()
// //           )

// //           if (!existingItem) {
// //             items.push({
// //               itemName: rawItemName.trim(),
// //               unit: 'kg', // Default unit, can be changed by user
// //               supplierId: supplier._id,
// //               supplierName: supplier.supplierName,
// //               supplierItems: [{
// //                 rawItem: rawItemName,
// //                 supplierId: supplier._id,
// //                 supplierName: supplier.supplierName
// //               }]
// //             })
// //           } else {
// //             // Add supplier info to existing item (multiple suppliers for same item)
// //             existingItem.supplierItems.push({
// //               rawItem: rawItemName,
// //               supplierId: supplier._id,
// //               supplierName: supplier.supplierName
// //             })
// //           }
// //         } else {
// //           console.log('No rawItem found for supplier:', supplier.supplierName)
// //         }
// //       })

// //       console.log('Final available items:', items) // Debug log
// //       setAvailableItems(items)
// //     } else {
// //       console.log('No suppliers found or suppliers array is empty')
// //     }
// //   }, [suppliers])

// //   // Monitor low stock
// //   useEffect(() => {
// //     const lowStock = inventories.filter(item => (item.stock?.quantity || 0) <= 5)
// //     setLowStockItems(lowStock)
// //   }, [inventories])

// //   // Form handlers
// //   const handleChange = (e) => {
// //     const { name, value } = e.target

// //     if (name === 'itemName') {
// //       // Find the selected item
// //       const selectedItem = availableItems.find(item => item.itemName === value)

// //       if (selectedItem) {
// //         // Get suppliers for this item
// //         const itemSuppliers = selectedItem.supplierItems.map(item => ({
// //           _id: item.supplierId,
// //           supplierName: item.supplierName
// //         }))

// //         setFilteredSuppliers(itemSuppliers)

// //         // If only one supplier, auto-select it
// //         if (itemSuppliers.length === 1) {
// //           setFormData({
// //             ...formData,
// //             [name]: value,
// //             unit: selectedItem.unit || '',
// //             supplierId: itemSuppliers[0]._id
// //           })
// //         } else {
// //           setFormData({
// //             ...formData,
// //             [name]: value,
// //             unit: selectedItem.unit || '',
// //             supplierId: '' // Reset supplier selection if multiple suppliers
// //           })
// //         }
// //       } else {
// //         setFilteredSuppliers([])
// //         setFormData({ ...formData, [name]: value, unit: '', supplierId: '' })
// //       }
// //     } else {
// //       setFormData({ ...formData, [name]: value })
// //     }
// //   }

// //   const handleaddQuantityStockChange = (e) => setaddQuantityStockData({ ...addQuantityStockData, [e.target.name]: e.target.value })

// //   // Add inventory
// //   const handleSaveStock = async () => {
// //     try {
// //       await dispatch(addInventory({ restaurantId, ...formData, token })).unwrap() // wait until added
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()           // fetch updated inventories
// //       resetForm()
// //       setModalVisible(false)
// //     } catch (error) {
// //       console.log(error, "error is here")
// //       console.error("Failed to add inventory:", error)
// //     }
// //   }

// //   // Update inventory
// //   const handleUpdateInventory = async () => {
// //     try {
// //       await dispatch(updateInventory({ id: selectedStock.id, restaurantId, ...formData, token })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       resetForm()
// //       setEditModalVisible(false)
// //     } catch (error) {
// //       console.error('Error updating inventory:', error)
// //     }
// //   }

// //   // Delete inventory
// //   const handleDeleteInventory = async () => {
// //     try {
// //       await dispatch(deleteInventory({ id: selectedStock.id, restaurantId, token })).unwrap()
// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       setDeleteModalVisible(false)
// //     } catch (error) {
// //       console.error('Error deleting inventory:', error)
// //     }
// //   }

// //   // Add stock handler
// //   const handleaddQuantityStockItem = async () => {
// //     try {
// //       await dispatch(addQuantityStock({
// //         itemId: selectedStock.id,
// //         quantityToAdd: parseInt(addQuantityStockData.quantityToAdd),
// //         token
// //       })).unwrap()

// //       await dispatch(fetchInventories({ restaurantId, token })).unwrap()
// //       setaddQuantityStockData({ quantityToAdd: '' })
// //       setaddQuantityStockModalVisible(false)
// //       setSelectedStock(null)
// //     } catch (error) {
// //       console.error('Failed to add stock:', error)
// //     }
// //   }

// //   const resetForm = () => {
// //     setFormData({ itemName: '', quantity: '', unit: '', amount: '', supplierId: '' })
// //     setFilteredSuppliers([])
// //   }

// //   // Export CSV
// //   const exportToCSV = useCallback(() => {
// //     const csvContent =
// //       'data:text/csv;charset=utf-8,' +
// //       ['Stock ID,Item Name,Quantity,Unit,Amount,Supplier Name'].join(',') +
// //       '\n' +
// //       inventories
// //         ?.map((row) =>
// //           [row._id, row.itemName, row.quantity, row.unit, row.amount || 'N/A', row.supplierName || 'N/A'].join(',')
// //         )
// //         .join('\n') // Join all rows with newline

// //     const link = document.createElement('a')
// //     link.href = encodeURI(csvContent)
// //     link.download = 'inventories.csv'
// //     link.click()
// //   }, [inventories])

// //   // Export PDF
// //   const exportToPDF = useCallback(() => {
// //     const doc = new jsPDF()
// //     doc.text('Stock Management', 10, 10)
// //     const tableColumn = ['Stock ID', 'Item Name', 'Quantity', 'Unit', 'Amount', 'Total', 'Supplier Name']
// //     const tableRows = inventories?.map((row) => [
// //       row._id,
// //       row.itemName,
// //       row.quantity,
// //       row.unit,
// //       row.amount || 'N/A',
// //       row.supplierName || 'N/A',
// //     ])

// //     doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 })
// //     doc.save('inventories.pdf')
// //   }, [inventories])

// //   // DataGrid rows
// //   const rows = inventories.map((s) => ({ id: s._id, ...s }))

// //   // DataGrid columns
// //   const columns = [
// //     { 
// //       field: 'id', 
// //       headerName: 'ID', 
// //       flex: 0.8, 
// //       minWidth: 80,
// //       valueGetter: (params) => `STK-${params.row.id.slice(-6).toUpperCase()}`,
// //       hide: false
// //     },
// //     {
// //       field: 'itemName', 
// //       headerName: 'Item Name', 
// //       flex: 1.5, 
// //       minWidth: 120,
// //       renderCell: (params) => {
// //         const quantity = params.row.stock?.quantity || 0;
// //         return (
// //           <div style={{
// //             display: 'flex',
// //             alignItems: 'center',
// //             color: quantity <= 5 ? '#dc3545' : 'inherit',
// //             fontWeight: quantity <= 5 ? 'bold' : 'normal',
// //             fontSize: '0.875rem'
// //           }}>
// //             {quantity <= 5 && <span style={{ marginRight: '4px', fontSize: '0.75rem' }}>⚠️</span>}
// //             <span style={{ 
// //               overflow: 'hidden', 
// //               textOverflow: 'ellipsis', 
// //               whiteSpace: 'nowrap',
// //               maxWidth: '100%'
// //             }}>
// //               {params.value}
// //             </span>
// //           </div>
// //         )
// //       }
// //     },
// //     {
// //       field: 'quantity',
// //       headerName: 'Qty',
// //       flex: 0.8,
// //       minWidth: 60,
// //       valueGetter: (params) => {
// //         const qty = params.row?.stock?.quantity ?? 0;
// //         return qty;
// //       },
// //       renderCell: (params) => {
// //         const qty = params.row?.stock?.quantity ?? 0;
// //         return (
// //           <span
// //             style={{
// //               color: qty <= 5 ? '#dc3545' : qty <= 10 ? '#fd7e14' : '#28a745',
// //               fontWeight: qty <= 5 ? 'bold' : 'normal',
// //               fontSize: '0.875rem'
// //             }}
// //           >
// //             {qty}
// //           </span>
// //         )
// //       },
// //     },
// //     { 
// //       field: 'unit', 
// //       headerName: 'Unit', 
// //       flex: 0.6, 
// //       minWidth: 50,
// //       renderCell: (params) => (
// //         <span style={{ fontSize: '0.875rem' }}>{params.value}</span>
// //       )
// //     },
// //     {
// //       field: 'total',
// //       headerName: 'Amount',
// //       flex: 1,
// //       minWidth: 80,
// //       valueGetter: (params) => {
// //         const total = params?.row?.stock?.total ?? 0;
// //         return total;
// //       },
// //       renderCell: (params) => {
// //         const total = params?.row?.stock?.total ?? 0;
// //         return (
// //           <span style={{
// //             color: total > 0 ? '#28a745' : '#6c757d',
// //             fontWeight: total > 0 ? 'bold' : 'normal',
// //             fontSize: '0.875rem'
// //           }}>
// //             ₹{total.toLocaleString()}
// //           </span>
// //         )
// //       }
// //     },
// //     {
// //       field: 'actions', 
// //       headerName: 'Actions', 
// //       flex: 1.2, 
// //       minWidth: 100,
// //       sortable: false, 
// //       filterable: false,
// //       renderCell: (params) => (
// //         <div style={{ 
// //           display: 'flex', 
// //           gap: '2px', 
// //           flexWrap: 'wrap',
// //           justifyContent: 'center',
// //           alignItems: 'center'
// //         }}>
// //           <CButton 
// //             color="secondary" 
// //             size="sm" 
// //             className="btn-sm p-1" 
// //             onClick={() => {
// //               setSelectedStock(params.row)

// //               // Find the item in availableItems to get supplier info
// //               const availableItem = availableItems.find(item =>
// //                 item.itemName.toLowerCase() === params.row.itemName.toLowerCase()
// //               )

// //               if (availableItem) {
// //                 const itemSuppliers = availableItem.supplierItems.map(item => ({
// //                   _id: item.supplierId,
// //                   supplierName: item.supplierName
// //                 }))
// //                 setFilteredSuppliers(itemSuppliers)
// //               } else {
// //                 setFilteredSuppliers(suppliers || [])
// //               }

// //               setFormData({
// //                 itemName: params.row.itemName || '',
// //                 quantity: params.row.stock?.quantity || '',
// //                 unit: params.row.unit || '',
// //                 amount: params.row.stock?.amount || '',
// //                 supplierId: params.row.supplierId || '',
// //               })
// //               setEditModalVisible(true)
// //             }} 
// //             title="Edit Item"
// //             style={{ minWidth: '32px', height: '32px' }}
// //           >
// //             <CIcon icon={cilPencil} size="sm" />
// //           </CButton>

// //           <CButton 
// //             color="danger" 
// //             size="sm" 
// //             className="btn-sm p-1" 
// //             onClick={() => {
// //               setSelectedStock(params.row)
// //               setDeleteModalVisible(true)
// //             }} 
// //             title="Delete Item"
// //             style={{ minWidth: '32px', height: '32px' }}
// //           >
// //             <CIcon icon={cilTrash} size="sm" />
// //           </CButton>
// //         </div>
// //       )
// //     },
// //   ]

// //   return (
// //     <div className="p-2 p-md-4">
// //       {/* Low Stock Alert */}
// //       {lowStockItems.length > 0 && (
// //         <CAlert color="warning" className="mb-4">
// //           <strong>⚠️ Low Stock Alert!</strong>
// //           <div className="mt-2">
// //             {lowStockItems.map(item => (
// //               <div key={item._id} className="mb-1">
// //                 <strong className="d-block d-sm-inline">{item.itemName}</strong>
// //                 <span className="d-block d-sm-inline ms-sm-1">Only {item.stock?.quantity || 0} {item.unit} remaining</span>
// //               </div>
// //             ))}
// //           </div>
// //         </CAlert>
// //       )}

// //       {/* Header & Buttons */}
// //       <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
// //         <h2 className="fw-bold text-dark m-0">📦 Inventory Stock</h2>
// //         <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
// //           <div className="d-flex justify-content-end">
// //             <CButton 
// //               color="primary" 
// //               onClick={() => setModalVisible(true)}
// //               className="w-100 w-sm-auto"
// //               size="sm"
// //               style={{ 
// //                 fontSize: '0.875rem', 
// //                 padding: '0.375rem 0.75rem',
// //                 minWidth: 'auto'
// //               }}
// //             >
// //               + Add Inventory
// //             </CButton>
// //           </div>
// //           <div className="d-flex gap-2">
// //             <CButton 
// //               color="info" 
// //               onClick={exportToCSV}
// //               size="sm"
// //               style={{ 
// //                 fontSize: '0.875rem', 
// //                 padding: '0.375rem 0.75rem',
// //                 minWidth: 'auto'
// //               }}
// //             >
// //               📑 Export CSV
// //             </CButton>
// //             <CButton 
// //               color="secondary" 
// //               onClick={exportToPDF}
// //               size="sm"
// //               style={{ 
// //                 fontSize: '0.875rem', 
// //                 padding: '0.375rem 0.75rem',
// //                 minWidth: 'auto'
// //               }}
// //             >
// //               📄 Export PDF
// //             </CButton>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Inventory Table */}
// //       <div className="bg-white rounded shadow-sm p-2 p-md-3">
// //         {inventoryLoading || supplierLoading || saleProcessing ? (
// //           <div className="d-flex justify-content-center py-5">
// //             <CSpinner color="primary" variant="grow" />
// //           </div>
// //         ) : (
// //           <>
// //             {/* Desktop Table View */}
// //             <div className="d-none d-lg-block" style={{ width: '100%', minWidth: '800px' }}>
// //               <div className="table-responsive" style={{ minHeight: '400px', width: '100%' }}>
// //                 <DataGrid
// //                   style={{ width: '100%', minHeight: '400px' }}
// //                   rows={rows}
// //                   columns={columns}
// //                   autoHeight
// //                   pageSize={10}
// //                   rowsPerPageOptions={[5, 10, 20]}
// //                   className="border-0"
// //                   disableRowSelectionOnClick
// //                   slots={{ toolbar: CustomToolbar }}
// //                   sx={{
// //                     '& .MuiDataGrid-root': {
// //                       border: 'none',
// //                       '& .MuiDataGrid-cell:focus': {
// //                         outline: 'none',
// //                       },
// //                       '& .MuiDataGrid-cell:focus-within': {
// //                         outline: 'none',
// //                       },
// //                     },
// //                     '& .MuiDataGrid-columnHeaders': { 
// //                       backgroundColor: '#f5f6fa', 
// //                       color: '#333', 
// //                       fontWeight: 'bold', 
// //                       fontSize: '0.8rem',
// //                       minHeight: '40px !important',
// //                       borderBottom: '2px solid #dee2e6'
// //                     },
// //                     '& .MuiDataGrid-row': { 
// //                       '&:nth-of-type(odd)': { backgroundColor: '#fafafa' }, 
// //                       '&:hover': { backgroundColor: '#e9f2ff' },
// //                       minHeight: '40px !important',
// //                       '&:hover .MuiDataGrid-cell': {
// //                         backgroundColor: 'transparent'
// //                       }
// //                     },
// //                     '& .MuiDataGrid-cell': { 
// //                       borderBottom: '1px solid #f0f0f0',
// //                       fontSize: '0.8rem',
// //                       padding: '4px 8px',
// //                       display: 'flex',
// //                       alignItems: 'center',
// //                       '&:focus': {
// //                         outline: 'none'
// //                       }
// //                     },
// //                     '& .MuiDataGrid-footerContainer': { 
// //                       backgroundColor: '#f5f6fa',
// //                       borderTop: '1px solid #dee2e6',
// //                       minHeight: '52px !important'
// //                     },
// //                     '& .MuiDataGrid-columnHeaderTitle': {
// //                       fontSize: '0.8rem',
// //                       fontWeight: '600',
// //                       overflow: 'hidden',
// //                       textOverflow: 'ellipsis',
// //                       whiteSpace: 'nowrap'
// //                     },
// //                     '& .MuiDataGrid-cellContent': {
// //                       fontSize: '0.8rem',
// //                       overflow: 'hidden',
// //                       textOverflow: 'ellipsis',
// //                       whiteSpace: 'nowrap'
// //                     },
// //                     '& .MuiDataGrid-toolbarContainer': {
// //                       padding: '8px 16px',
// //                       backgroundColor: '#f8f9fa',
// //                       borderBottom: '1px solid #dee2e6'
// //                     },
// //                     '& .MuiDataGrid-main': {
// //                       overflow: 'auto'
// //                     },
// //                     '& .MuiDataGrid-virtualScroller': {
// //                       overflow: 'auto'
// //                     }
// //                   }}
// //                 />
// //               </div>
// //             </div>

// //             {/* Mobile Card View */}
// //             <div className="d-lg-none">
// //               {inventories.map((item, index) => {
// //                 const quantity = item.stock?.quantity || 0;
// //                 const total = item.stock?.total || 0;
                
// //                 return (
// //                   <div key={item._id} className="card mb-3 border-0 shadow-sm">
// //                     <div className="card-body p-3">
// //                       <div className="d-flex justify-content-between align-items-start mb-2">
// //                         <div className="flex-grow-1">
// //                           <h6 className="card-title mb-1 d-flex align-items-center">
// //                             {quantity <= 5 && <span className="me-2 text-danger">⚠️</span>}
// //                             <span className={quantity <= 5 ? 'text-danger fw-bold' : ''}>
// //                               {item.itemName}
// //                             </span>
// //                           </h6>
// //                           <small className="text-muted">ID: STK-{item._id.slice(-6).toUpperCase()}</small>
// //                         </div>
// //                         <div className="text-end">
// //                           <span className={`badge ${quantity <= 5 ? 'bg-danger' : quantity <= 10 ? 'bg-warning' : 'bg-success'}`}>
// //                             {quantity} {item.unit}
// //                           </span>
// //                         </div>
// //                       </div>
                      
// //                       <div className="row g-2 mb-3">
// //                         <div className="col-6">
// //                           <small className="text-muted d-block">Amount</small>
// //                           <span className={`fw-bold ${total > 0 ? 'text-success' : 'text-muted'}`}>
// //                             ₹{total.toLocaleString()}
// //                           </span>
// //                         </div>
// //                         <div className="col-6">
// //                           <small className="text-muted d-block">Supplier</small>
// //                           <span className="text-dark">{item.supplierName || 'N/A'}</span>
// //                         </div>
// //                       </div>
                      
// //                       <div className="d-flex gap-2">
// //                         <CButton 
// //                           color="secondary" 
// //                           size="sm" 
// //                           className="flex-fill"
// //                           onClick={() => {
// //                             setSelectedStock(item);
// //                             const availableItem = availableItems.find(avItem =>
// //                               avItem.itemName.toLowerCase() === item.itemName.toLowerCase()
// //                             );
// //                             if (availableItem) {
// //                               const itemSuppliers = availableItem.supplierItems.map(supplier => ({
// //                                 _id: supplier.supplierId,
// //                                 supplierName: supplier.supplierName
// //                               }));
// //                               setFilteredSuppliers(itemSuppliers);
// //                             } else {
// //                               setFilteredSuppliers(suppliers || []);
// //                             }
// //                             setFormData({
// //                               itemName: item.itemName || '',
// //                               quantity: item.stock?.quantity || '',
// //                               unit: item.unit || '',
// //                               amount: item.stock?.amount || '',
// //                               supplierId: item.supplierId || '',
// //                             });
// //                             setEditModalVisible(true);
// //                           }}
// //                         >
// //                           <CIcon icon={cilPencil} className="me-1" />
// //                           Edit
// //                         </CButton>
// //                         <CButton 
// //                           color="danger" 
// //                           size="sm" 
// //                           className="flex-fill"
// //                           onClick={() => {
// //                             setSelectedStock(item);
// //                             setDeleteModalVisible(true);
// //                           }}
// //                         >
// //                           <CIcon icon={cilTrash} className="me-1" />
// //                           Delete
// //                         </CButton>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //           </>
// //         )}
// //       </div>

// //       {/* Add Inventory Modal */}
// //       <CModal visible={modalVisible} alignment="center" onClose={() => { setModalVisible(false); resetForm() }} size="lg" scrollable>
// //         <CModalHeader className="bg-light border-0"><CModalTitle className="fw-bold">📦 Add Inventory</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           <div className="p-2 p-md-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
// //             <div className="mb-3">
// //               <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
// //               <CFormSelect name="itemName" value={formData.itemName} onChange={handleChange} className="form-select">
// //                 <option value="">Select Item</option>
// //                 {availableItems.map((item, index) => (
// //                   <option key={index} value={item.itemName}>
// //                     {item.itemName}
// //                   </option>
// //                 ))}
// //               </CFormSelect>
// //               <small className="text-muted">Items are loaded from your suppliers' raw items</small>
// //             </div>

// //             <div className="row">
// //               <div className="col-12 col-md-6 mb-3">
// //                 <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
// //                 <CFormInput
// //                   type="number"
// //                   min="0"
// //                   step="0.01"
// //                   placeholder="Enter quantity"
// //                   name="quantity"
// //                   value={formData.quantity}
// //                   onChange={handleChange}
// //                   className="form-control"
// //                 />
// //               </div>
// //               <div className="col-12 col-md-6 mb-3">
// //                 <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
// //                 <CFormSelect
// //                   name="unit"
// //                   value={formData.unit}
// //                   onChange={handleChange}
// //                   className="form-select"
// //                 >
// //                   <option value="">Select Unit</option>
// //                   <option value="kg">kg</option>
// //                   <option value="gm">gm</option>
// //                   <option value="ltr">ltr</option>
// //                   <option value="mg">mg</option>
// //                   <option value="pcs">pcs</option>
// //                   <option value="ml">ml</option>
// //                 </CFormSelect>
// //               </div>
// //             </div>

// //             <div className="mb-3">
// //               <label className="form-label fw-semibold">Amount (Optional)</label>
// //               <CFormInput
// //                 type="number"
// //                 min="0"
// //                 step="0.01"
// //                 placeholder="Enter amount/price"
// //                 name="amount"
// //                 value={formData.amount}
// //                 onChange={handleChange}
// //                 className="form-control"
// //               />
// //             </div>

// //             <div>
// //               <label className="form-label fw-semibold">Supplier <span className="text-danger">*</span></label>
// //               <CFormSelect name="supplierId" value={formData.supplierId} onChange={handleChange} className="form-select">
// //                 <option value="">
// //                   {formData.itemName
// //                     ? (filteredSuppliers.length > 0 ? "Select Supplier" : "No suppliers available for this item")
// //                     : "Select an item first"
// //                   }
// //                 </option>
// //                 {filteredSuppliers.map((supplier) => (
// //                   <option key={supplier._id} value={supplier._id}>
// //                     {supplier.supplierName}
// //                   </option>
// //                 ))}
// //               </CFormSelect>
// //               {formData.itemName && filteredSuppliers.length > 1 && (
// //                 <small className="text-info">This item is available from multiple suppliers</small>
// //               )}
// //             </div>
// //           </div>
// //         </CModalBody>
// //         <CModalFooter className="d-flex justify-content-center gap-2 border-0">
// //           <CButton 
// //             color="secondary" 
// //             variant="outline" 
// //             onClick={() => { setModalVisible(false); resetForm() }}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="success"
// //             onClick={handleSaveStock}
// //             disabled={inventoryLoading || !formData.itemName || !formData.quantity || !formData.unit || !formData.supplierId}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             {inventoryLoading ? 'Saving...' : 'Save Inventory'}
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Add Stock Modal */}
// //       <CModal visible={addQuantityStockModalVisible} alignment="center" onClose={() => { setaddQuantityStockModalVisible(false); setaddQuantityStockData({ quantityToAdd: '' }); setSelectedStock(null) }} scrollable>
// //         <CModalHeader className="bg-light"><CModalTitle className="fw-bold">✅ Add Stock</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           {selectedStock && (
// //             <>
// //               <div className="mb-3 p-3 bg-light rounded">
// //                 <h6 className="fw-bold mb-2">{selectedStock.itemName}</h6>
// //                 <p className="mb-1 text-muted">Current Stock: <strong>{selectedStock.stock?.quantity || 0} {selectedStock.unit}</strong></p>
// //                 <p className="mb-0 text-muted">Supplier: <strong>{selectedStock.supplierName || 'N/A'}</strong></p>
// //               </div>

// //               <div className="mb-3">
// //                 <label className="form-label fw-semibold">Quantity to Add <span className="text-danger">*</span></label>
// //                 <CFormInput
// //                   className="shadow-sm form-control"
// //                   placeholder="Enter quantity to add"
// //                   name="quantityToAdd"
// //                   type="number"
// //                   min="1"
// //                   value={addQuantityStockData.quantityToAdd}
// //                   onChange={handleaddQuantityStockChange}
// //                 />
// //               </div>

// //               {addQuantityStockData.quantityToAdd && (
// //                 <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
// //                   <small className="text-info">
// //                     <strong>New Total Stock:</strong> {(selectedStock.stock?.quantity || 0) + parseInt(addQuantityStockData.quantityToAdd || 0)} {selectedStock.unit}
// //                   </small>
// //                 </div>
// //               )}
// //             </>
// //           )}
// //         </CModalBody>
// //         <CModalFooter className="bg-light d-flex justify-content-center gap-2">
// //           <CButton
// //             color="secondary"
// //             variant="outline"
// //             onClick={() => { setaddQuantityStockModalVisible(false); setaddQuantityStockData({ quantityToAdd: '' }); setSelectedStock(null) }}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="success"
// //             onClick={handleaddQuantityStockItem}
// //             disabled={!addQuantityStockData.quantityToAdd || parseInt(addQuantityStockData.quantityToAdd) <= 0 || saleProcessing}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             {saleProcessing ? 'Processing...' : 'Add Stock'}
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Edit Inventory Modal */}
// //       <CModal visible={editModalVisible} alignment="center" onClose={() => { setEditModalVisible(false); resetForm() }} size="lg" scrollable>
// //         <CModalHeader className="bg-light"><CModalTitle className="fw-bold">✏️ Edit Inventory</CModalTitle></CModalHeader>
// //         <CModalBody>
// //           <div className="p-2 p-md-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
// //             <div className="mb-3">
// //               <label className="form-label fw-semibold">Item Name</label>
// //               <CFormInput
// //                 className="shadow-sm form-control"
// //                 placeholder="Item Name"
// //                 name="itemName"
// //                 value={formData.itemName}
// //                 onChange={handleChange}
// //                 readOnly
// //                 style={{ backgroundColor: '#e9ecef' }}
// //               />
// //               <small className="text-muted">Item name cannot be changed</small>
// //             </div>

// //             <div className="row">
// //               <div className="col-12 col-md-6 mb-3">
// //                 <label className="form-label fw-semibold">Quantity</label>
// //                 <CFormInput
// //                   className="shadow-sm form-control"
// //                   placeholder="Quantity"
// //                   name="quantity"
// //                   type="number"
// //                   min="0"
// //                   step="0.01"
// //                   value={formData.quantity}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //               <div className="col-12 col-md-6 mb-3">
// //                 <label className="form-label fw-semibold">Unit</label>
// //                 <CFormSelect
// //                   className="shadow-sm form-select"
// //                   name="unit"
// //                   value={formData.unit}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select Unit</option>
// //                   <option value="kg">kg</option>
// //                   <option value="gm">gm</option>
// //                   <option value="ltr">ltr</option>
// //                   <option value="mg">mg</option>
// //                   <option value="pcs">pcs</option>
// //                   <option value="ml">ml</option>
// //                 </CFormSelect>
// //               </div>
// //             </div>

// //             <div className="mb-3">
// //               <label className="form-label fw-semibold">Amount</label>
// //               <CFormInput
// //                 className="shadow-sm form-control"
// //                 placeholder="Amount/Price"
// //                 name="amount"
// //                 type="number"
// //                 min="0"
// //                 step="0.01"
// //                 value={formData.amount}
// //                 onChange={handleChange}
// //               />
// //             </div>

// //             <div>
// //               <label className="form-label fw-semibold">Supplier</label>
// //               <CFormSelect className="shadow-sm form-select" name="supplierId" value={formData.supplierId} onChange={handleChange}>
// //                 <option value="">Select Supplier</option>
// //                 {filteredSuppliers.map((supplier) => (
// //                   <option key={supplier._id} value={supplier._id}>
// //                     {supplier.supplierName}
// //                   </option>
// //                 ))}
// //               </CFormSelect>
// //             </div>
// //           </div>
// //         </CModalBody>
// //         <CModalFooter className="bg-light d-flex justify-content-center gap-2">
// //           <CButton 
// //             color="secondary" 
// //             variant="outline" 
// //             onClick={() => { setEditModalVisible(false); resetForm() }}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="primary"
// //             onClick={handleUpdateInventory}
// //             disabled={inventoryLoading}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             {inventoryLoading ? 'Updating...' : 'Update Inventory'}
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>

// //       {/* Delete Inventory Modal */}
// //       <CModal visible={deleteModalVisible} alignment="center" onClose={() => setDeleteModalVisible(false)} scrollable>
// //         <CModalHeader className="bg-light"><CModalTitle className="fw-bold text-danger">⚠️ Delete Inventory</CModalTitle></CModalHeader>
// //         <CModalBody className="text-center py-4">
// //           {selectedStock && (
// //             <div>
// //               <p className="fs-6 mb-3">Are you sure you want to delete this inventory item?</p>
// //               <div className="p-3 bg-light rounded">
// //                 <strong className="d-block mb-2">{selectedStock.itemName}</strong>
// //                 <span className="text-muted d-block">Quantity: {selectedStock.stock?.quantity || 0} {selectedStock.unit}</span>
// //                 <span className="text-muted d-block">Supplier: {selectedStock.supplierName || 'N/A'}</span>
// //               </div>
// //               <p className="text-danger mt-3 mb-0"><strong>This action cannot be undone!</strong></p>
// //             </div>
// //           )}
// //         </CModalBody>
// //         <CModalFooter className="bg-light d-flex justify-content-center gap-2">
// //           <CButton 
// //             color="secondary" 
// //             variant="outline" 
// //             onClick={() => setDeleteModalVisible(false)}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             Cancel
// //           </CButton>
// //           <CButton
// //             color="danger"
// //             onClick={handleDeleteInventory}
// //             disabled={inventoryLoading}
// //             size="sm"
// //             style={{ 
// //               fontSize: '0.875rem', 
// //               padding: '0.375rem 0.75rem',
// //               minWidth: 'auto'
// //             }}
// //           >
// //             {inventoryLoading ? 'Deleting...' : 'Delete'}
// //           </CButton>
// //         </CModalFooter>
// //       </CModal>
// //     </div>
// //   )
// // }

// // export default Stock