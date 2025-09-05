import React, { useState } from 'react'
import { CButton, CFormSwitch, CSpinner } from '@coreui/react'
import { useDispatch } from 'react-redux'
import { cilPencil, cilTrash, cilStorage } from '@coreui/icons'
import { DataGrid } from '@mui/x-data-grid'
import CustomToolbar from '../utils/CustomToolbar'
import CIcon from '@coreui/icons-react'
import { updateMenuItemStatus, fetchMenuItems } from '../redux/slices/menuSlice'
import { useMediaQuery } from '@mui/material';

const MenuItemList = ({ menuItems, menuItemsLoading, setSelectedMenu, setEditModalVisible, setDeleteModalVisible, setEditStockModalVisible }) => {
    const isMobile = useMediaQuery('(max-width:600px)');

    const dispatch = useDispatch()

    const columns = [
        {
            field: 'itemImage',
            headerName: 'Image',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
            renderCell: (params) => (
                <img src={params.value} alt={params.row.itemName} style={{ maxWidth: '100px' }} />
            ),
        },
        {
            field: 'itemName',
            headerName: 'Item Name',
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
        },
        {
            field: 'price', headerName: 'Price', flex: isMobile ? undefined : 1,
            minWidth: isMobile ? 150 : undefined,
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

                        await dispatch(
                            updateMenuItemStatus({
                                id: params.row.id,
                                status: newStatus,
                            })
                        ).unwrap();
                        await dispatch(fetchMenuItems({ restaurantId }));

                        toast.success('Menu item status updated successfully!');
                    } catch (error) {
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
                                checked={localStatus === 0}
                                onChange={handleToggle}
                                label={localStatus === 0 ? 'Active' : 'Inactive'}
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
            renderCell: (params) => (
                <div>
                    {/* <CButton
                        color="warning"
                        size="sm"
                        className='mx-1'
                        onClick={() => {
                            setSelectedMenu(params.row);
                            setEditStockModalVisible(true)
                        }}
                    >Edit Stock
                    </CButton> */}
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
                        className="ms-1"
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
        <div style={{ height: 'auto', width: '100%', backgroundColor: 'white' }}>
            <DataGrid
                rows={menuItems || []}
                columns={columns}
                getRowId={(row) => row.id}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                loading={menuItemsLoading}
                autoHeight
                slots={{ Toolbar: CustomToolbar }}
            />
        </div>
    )
}

export default MenuItemList