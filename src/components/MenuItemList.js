import React from 'react'
import { CButton, CFormSwitch, CSpinner, CCard, CCardBody, CCardImage, CRow, CCol } from '@coreui/react'
import { cilPencil, cilTrash } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch } from 'react-redux'
import { updateMenuItemStatus, fetchMenuItems } from '../redux/slices/menuSlice'
import { toast } from 'react-toastify'
import { useMediaQuery } from '@mui/material'
import CustomToolbar from '../utils/CustomToolbar'
import { useHotkeys } from 'react-hotkeys-hook'
const MenuItemList = ({
  menuItems,
  menuItemsLoading,
  setSelectedMenu,
  setEditModalVisible,
  setDeleteModalVisible
}) => {
  const dispatch = useDispatch()
  const isMobile = useMediaQuery('(max-width:600px)')

  // ✅ transform menuItems safely
  const transformedMenuItems = React.useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return []
    return menuItems
      .filter(item => item != null)
      .map((item, index) => ({
        ...item,
        id: item._id || item.id || `temp-${index}`,
        itemName: item.itemName || 'Unknown',
        price: item.price || 0,
        itemImage: item.itemImage || '',
        status: item.status !== undefined ? item.status : 1,
      }))
  }, [menuItems])

  const handleToggleStatus = async (row) => {
    try {
      const newStatus = row.status === 1 ? 0 : 1
      await dispatch(updateMenuItemStatus({ id: row._id || row.id, status: newStatus })).unwrap()
      const restaurantId = localStorage.getItem('restaurantId')
      if (restaurantId) await dispatch(fetchMenuItems({ restaurantId }))
      toast.success('Status updated!')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  // Mobile responsive columns
  const columns = [
    {
      field: 'itemImage',
      headerName: 'Image',
      flex: 1,
      minWidth: 140,
      hide: isMobile,
      renderCell: (params) =>
        params.value ? (
          <div
            style={{
              width: 100,
              height: 70,
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
            }}
          >
            <img
              src={params.value}
              alt={params.row.itemName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ) : (
          <div
            style={{
              width: 100,
              height: 70,
              borderRadius: 10,
              border: '1px dashed #ccc',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#888',
              fontStyle: 'italic',
            }}
          >
            No Image
          </div>
        ),
    },
    {
      field: 'menuId',
      headerName: 'Menu Id',
      flex: 1.5,
      minWidth: 150,
      hide: isMobile
    },
    {
      field: 'itemName',
      headerName: 'Item Name',
      flex: 1.5,
      minWidth: 150,
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => `₹${params.value}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 130,
      hide: isMobile,
      renderCell: (params) => (
        <CFormSwitch
          color="primary"
          shape="rounded-pill"
          checked={params.row.status === 1}
          onChange={() => handleToggleStatus(params.row)}
          label={params.row.status === 1 ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex gap-1">
          <CButton
            color="info"
            size="sm"
            onClick={() => {
              setSelectedMenu(params.row)
              setEditModalVisible(true)
            }}
          >
            <CIcon icon={cilPencil} />
          </CButton>
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setSelectedMenu(params.row)
              setDeleteModalVisible(true)
            }}
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </div>
      ),
    },
  ]

  // Mobile Card Layout Component
  const MobileCardLayout = () => (
    <div className="d-block d-lg-none">
      {menuItemsLoading ? (
        <div className="text-center py-4">
          <CSpinner color="primary" />
          <p className="mt-2">Loading menu items...</p>
        </div>
      ) : (
        <CRow className="g-3">
          {transformedMenuItems.map((item) => (
            <CCol key={item.id} xs={12} sm={6} md={6}>
              <CCard className="menu-item-card h-100 shadow-sm border-0"
                style={{ borderRadius: '12px' }}
                tabIndex={0}
                role="button"
                aria-label={`Menu item ${item.itemName}`}
                data-id={item.id}>
                <CCardBody className="p-3">
                  <div className="d-flex align-items-start gap-3">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {item.itemImage ? (
                        <img
                          src={item.itemImage}
                          alt={item.itemName}
                          className="rounded"
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      ) : (
                        <div
                          className="rounded d-flex align-items-center justify-content-center text-muted"
                          style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f8f9fa',
                            border: '1px dashed #dee2e6',
                            fontSize: '10px',
                            borderRadius: '8px'
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1 fw-bold text-dark" style={{
                          maxWidth: '150px',
                          fontSize: '14px',
                          lineHeight: '1.3'
                        }}>
                          {item.itemName}
                        </h6>
                        <span className="text-success fw-bold flex-shrink-0" style={{ fontSize: '16px' }}>
                          ₹{item.price}
                        </span>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                          Menu ID: {item.menuId}
                        </small>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {/* Status Toggle */}
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="text-muted" style={{ fontSize: '12px' }}>
                            Status:
                          </span>
                          <CFormSwitch
                            color="primary"
                            shape="rounded-pill"
                            checked={item.status === 1}
                            onChange={() => handleToggleStatus(item)}
                            label={item.status === 1 ? 'Active' : 'Inactive'}
                          />
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2 justify-content-end">
                          <CButton
                            color="info"
                            size="sm"
                            className="px-3 py-1"
                            style={{ fontSize: '12px', borderRadius: '6px' }}
                            onClick={() => {
                              setSelectedMenu(item)
                              setEditModalVisible(true)
                            }}
                          >
                            <CIcon icon={cilPencil} className="me-1" />
                            Edit
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            className="px-3 py-1"
                            style={{ fontSize: '12px', borderRadius: '6px' }}
                            onClick={() => {
                              setSelectedMenu(item)
                              setDeleteModalVisible(true)
                            }}
                          >
                            <CIcon icon={cilTrash} className="me-1" />
                            Delete
                          </CButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      )}
    </div>
  )
  useHotkeys('arrowup, arrowdown', (e) => {
    const cards = document.querySelectorAll('.menu-item-card');
    const currentFocused = document.activeElement;
    let index = Array.from(cards).indexOf(currentFocused);

    if (e.key === 'ArrowDown') {
      index = index < cards.length - 1 ? index + 1 : 0;
      cards[index].focus();
    }
    if (e.key === 'ArrowUp') {
      index = index > 0 ? index - 1 : cards.length - 1;
      cards[index].focus();
    }
  }, { preventDefault: true });

  useHotkeys('enter', (e) => {
    const currentFocused = document.activeElement;
    if (currentFocused.classList.contains('menu-item-card')) {
      const itemId = currentFocused.dataset.id;
      const item = transformedMenuItems.find(i => i.id === itemId);
      if (item) {
        setSelectedMenu(item);
        setEditModalVisible(true);
      }
    }
  }, { preventDefault: true }, [transformedMenuItems]);
  return (
    <div style={{ width: '100%', backgroundColor: 'white' }}>
      {/* Desktop Table View */}
      <div className="d-none d-lg-block" style={{ width: '100%', minWidth: '800px' }}>
        <DataGrid
          style={{ width: '100%', minHeight: '400px' }}
          rows={transformedMenuItems}
          columns={columns}
          getRowId={(row) => row.id}
          loading={menuItemsLoading}
          disableRowSelectionOnClick
          autoHeight
          pagination
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20, 30]}
          slots={{ Toolbar: CustomToolbar }}
          sx={{
            border: 'none',
            width: '100%',
            minHeight: '400px',
            '& .MuiDataGrid-cell': {
              padding: '10px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-footerContainer': {
              justifyContent: 'space-between',
              padding: '0 10px',
            },
          }}
        />
      </div>

      {/* Mobile Card View */}
      <MobileCardLayout />
    </div>
  )
}

export default MenuItemList
