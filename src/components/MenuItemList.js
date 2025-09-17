import React from 'react'
import { CButton, CFormSwitch, CSpinner } from '@coreui/react'
import { cilPencil, cilTrash } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch } from 'react-redux'
import { updateMenuItemStatus, fetchMenuItems } from '../redux/slices/menuSlice'
import { toast } from 'react-toastify'
import { useMediaQuery } from '@mui/material'
import CustomToolbar from '../utils/CustomToolbar'

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

  const columns = [
    {
      field: 'itemImage',
      headerName: 'Image',
      flex: 1,
      minWidth: 140,
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
      minWidth: '150'
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
        <div>
          <CButton
            color="info"
            size="sm"
            className="me-1"
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

  return (
    <div style={{ width: '100%', backgroundColor: 'white' }}>
      <DataGrid
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
  )
}

export default MenuItemList
