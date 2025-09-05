import React, { useState } from 'react'
import { CButton, CFormSwitch, CSpinner } from '@coreui/react'
import { useDispatch } from 'react-redux'
import { cilPencil, cilTrash, cilStorage } from '@coreui/icons'
import { DataGrid } from '@mui/x-data-grid'
import CustomToolbar from '../utils/CustomToolbar'
import CIcon from '@coreui/icons-react'
import { updateMenuItemStatus, fetchMenuItems } from '../redux/slices/menuSlice'
import { useMediaQuery } from '@mui/material';
import { toast } from 'react-toastify';

const MenuItemList = ({ menuItems, menuItemsLoading, setSelectedMenu, setEditModalVisible, setDeleteModalVisible, setEditStockModalVisible }) => {
    const isMobile = useMediaQuery('(max-width:600px)');
    const dispatch = useDispatch()

    // Transform menuItems to ensure they have id property and handle missing data
    const transformedMenuItems = React.useMemo(() => {
        if (!menuItems || !Array.isArray(menuItems)) {
            return [];
        }

        return menuItems.map((item, index) => ({
            ...item,
            id: item._id || item.id || `temp-id-${index}`, // Use _id, fallback to id, or create temp id
            itemImage: item.itemImage || '', // Ensure itemImage exists
            itemName: item.itemName || 'Unknown Item',
            price: item.price || 0,
            status: item.status !== undefined ? item.status : 1
        }));
    }, [menuItems]);

    const columns = [
        {
            field: 'itemImage',
            headerName: 'Image',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
            renderCell: (params) => {
                const imageUrl = params.value;
                return imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={params.row.itemName}
                        style={{
                            maxWidth: '100px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                        }}
                        onError={(e) => {
                            e.target.src = '/placeholder-image.png'; // Add a placeholder image
                            e.target.style.display = 'none'; // Or hide if no placeholder
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100px',
                        height: '60px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        No Image
                    </div>
                );
            },
        },
        {
            field: 'itemName',
            headerName: 'Item Name',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
        },
        {
            field: 'price',
            headerName: 'Price',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
            renderCell: (params) => `₹${params.value || 0}`,
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
            renderCell: (params) => {
                const [loading, setLoading] = React.useState(false);
                const [localStatus, setLocalStatus] = React.useState(params.row.status);

                React.useEffect(() => {
                    setLocalStatus(params.row.status);
                }, [params.row.status]);

                const handleToggle = async () => {
                    try {
                        setLoading(true);
                        const newStatus = localStatus === 0 ? 1 : 0;
                        setLocalStatus(newStatus);

                        // Get restaurantId from localStorage or props
                        const restaurantId = localStorage.getItem('restaurantId');

                        await dispatch(
                            updateMenuItemStatus({
                                id: params.row._id || params.row.id, // Use _id if available
                                status: newStatus,
                            })
                        ).unwrap();

                        if (restaurantId) {
                            await dispatch(fetchMenuItems({ restaurantId }));
                        }

                        toast.success('Menu item status updated successfully!');
                    } catch (error) {
                        console.error('Status update error:', error);
                        // Revert local status on error
                        setLocalStatus(params.row.status);
                        toast.error(error || 'Status update failed');
                    } finally {
                        setLoading(false);
                    }
                };

                return (
                    <div className="d-flex align-items-center">
                        {loading ? (
                            <CSpinner size="sm" />
                        ) : (
                            <CFormSwitch
                                className="mx-1"
                                color="primary"
                                shape="rounded-pill"
                                checked={localStatus === 1} // Fixed: 1 should be active/checked
                                onChange={handleToggle}
                                label={localStatus === 1 ? 'Active' : 'Inactive'}
                            />
                        )}
                    </div>
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 200 : undefined,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div>
                    {/* Uncomment if you need stock editing
                    <CButton
                        color="warning"
                        size="sm"
                        className='mx-1'
                        onClick={() => {
                            setSelectedMenu(params.row);
                            setEditStockModalVisible(true)
                        }}
                        title="Edit Stock"
                    >
                        <CIcon icon={cilStorage} />
                    </CButton> */}

                    <CButton
                        color="info"
                        size="sm"
                        onClick={() => {
                            setSelectedMenu(params.row)
                            setEditModalVisible(true)
                        }}
                        title="Edit Item"
                    >
                        <CIcon icon={cilPencil} />
                    </CButton>

                    <CButton
                        color="danger"
                        size="sm"
                        className="ms-1"
                        onClick={() => {
                            setSelectedMenu(params.row)
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
        <div style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}>
            <DataGrid
                rows={transformedMenuItems}
                columns={columns}
                getRowId={(row) => row.id} 
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10, 20]}
                loading={menuItemsLoading}
                autoHeight
                slots={{ Toolbar: CustomToolbar }}
                sx={{
                    '& .MuiDataGrid-cell': {
                        padding: '8px',
                    },
                    '& .MuiDataGrid-row': {
                        minHeight: '80px !important',
                    }
                }}
            />
        </div>
    )
}

export default MenuItemList
