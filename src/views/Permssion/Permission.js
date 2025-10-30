import React, { useState, useEffect, useMemo } from 'react';
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CAlert,
  CButtonGroup,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CTooltip,
  CPagination,
  CPaginationItem
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchAllUsers, updateUserRole } from '../../redux/slices/authSlice';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilUserFollow,
  cilUser,
  cilSearch,
  cilReload,
  cilSettings,
  cilCheck,
  cilX
} from '@coreui/icons';

// Role configurations - Updated to include superadmin, admin, waiter, manager, and cashier
const ROLE_CONFIG = {
  superadmin: {
    label: 'Super Administrator',
    color: 'dark',
    permissions: [
      'Overview',
      'POS',
      'Purchase Analytics',
      'Category',
      'Restaurants',
      'SubCategory',
      'Customer Loyality',
      'Sales Analytics',
      'Menu',
      'Orders',
      'Delivery',
      'Delivery Timing',
      'Transactions',
      'Permission',
      'Customers',
      'QR Code',
      'Reservations',
      'Dues',
      'Feedbacks',
      'Banners',
      'Inventory',
      'Reports',
      'Help',
      'Settings',
      'Downloads',
      'License'
    ],
    description: 'Complete system access with all administrative privileges and restaurant management capabilities'
  },
  admin: {
    label: 'Administrator',
    color: 'danger',
    permissions: [
      'Overview',
      'POS',
      'Purchase Analytics',
      'Category',
      'Restaurants',
      'SubCategory',
      'Customer Loyality',
      'Sales Analytics',
      'Menu',
      'Orders',
      'Delivery',
      'Delivery Timing',
      'Transactions',
      'Permission',
      'Customers',
      'QR Code',
      'Reservations',
      'Dues',
      'Feedbacks',
      'Banners',
      'Inventory',
      'Reports',
      'Help',
      'Settings',
      'Downloads',
      'License'
    ],
    description: 'Full system access with all administrative privileges and restaurant management capabilities'
  },
  manager: {
    label: 'Manager',
    color: 'warning',
    permissions: [
      'Overview',
      'POS',
      'Purchase Analytics',
      'Category',
      'Restaurants',
      'SubCategory',
      'Customer Loyality',
      'Sales Analytics',
      'Menu',
      'Orders',
      'Delivery',
      'Delivery Timing',
      'Transactions',
      'Permission',
      'Customers',
      'QR Code',
      'Reservations',
      'Dues',
      'Feedbacks',
      'Banners',
      'Inventory',
      'Reports',
      'Help',
      'Settings',
      'Downloads',
      'License'
    ],
    description: 'Management level access with all administrative privileges and restaurant management capabilities'
  },
  waiter: {
    label: 'Waiter',
    color: 'success',
    permissions: [
      'Overview',
      'POS',
      'Purchase Analytics',
      'Category',
      'Restaurants',
      'SubCategory',
      'Customer Loyality',
      'Sales Analytics',
      'Menu',
      'Orders',
      'Delivery',
      'Delivery Timing',
      'Transactions',
      'Permission',
      'Customers',
      'QR Code',
      'Reservations',
      'Dues',
      'Feedbacks',
      'Banners',
      'Inventory',
      'Reports',
      'Help',
      'Settings',
      'Downloads',
      'License'
    ],
    description: 'Restaurant service staff with order and table management access'
  },
  cashier: {
    label: 'Cashier',
    color: 'info',
    permissions: [
      'Overview',
      'POS',
      'Purchase Analytics',
      'Category',
      'Restaurants',
      'SubCategory',
      'Customer Loyality',
      'Sales Analytics',
      'Menu',
      'Orders',
      'Delivery',
      'Delivery Timing',
      'Transactions',
      'Permission',
      'Customers',
      'QR Code',
      'Reservations',
      'Dues',
      'Feedbacks',
      'Banners',
      'Inventory',
      'Reports',
      'Help',
      'Settings',
      'Downloads',
      'License'
    ],
    description: 'Cash handling and payment processing with full system access'
  }
};

// Items per page options
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function PermissionManagement() {
  const dispatch = useDispatch();

  // Redux state
  const token = localStorage.getItem('authToken');
  const currentUserRole = useSelector(state => state.auth.role);
  const currentUserId = useSelector(state => state.auth.userId);
  const users = useSelector(state => state.auth.users || []);
  const authLoading = useSelector(state => state.auth.loading);
  const updateLoading = useSelector(state => state.auth.updateLoading);

  // Local state
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    user: null,
    newRole: null,
    type: 'single' // 'single' or 'bulk'
  });
  const [roleInfoModal, setRoleInfoModal] = useState({ visible: false, role: null });
  const [inviteModal, setInviteModal] = useState({ visible: false });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'waiter',
    message: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showOnlyInvited, setShowOnlyInvited] = useState(true);

  const [updating, setUpdating] = useState({});
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // State for managing checkbox states in role change modal (only for new role)
  const [checkboxStates, setCheckboxStates] = useState({
    newRole: false, // Start with no role selected
    newPermissions: {} // Start with no permissions selected
  });

  // Function to toggle checkbox states (only for new role)
  const toggleCheckbox = (type, permission = null) => {
    setCheckboxStates(prev => {
      if (type === 'newRole') {
        return { ...prev, newRole: !prev.newRole };
      } else if (type === 'newPermission' && permission) {
        return {
          ...prev,
          newPermissions: {
            ...prev.newPermissions,
            [permission]: !prev.newPermissions[permission]
          }
        };
      }
      return prev;
    });
  };

  // Function to check if at least one permission is selected
  const hasSelectedPermissions = () => {
    const permissions = ROLE_CONFIG[confirmModal.newRole]?.permissions || [];
    return permissions.some(permission => checkboxStates.newPermissions[permission] === true);
  };

  // Function to check if role change is allowed
  const canChangeRole = () => {
    return checkboxStates.newRole && hasSelectedPermissions();
  };

  const isAdmin = currentUserRole === 'admin';
  const userId = currentUserId || localStorage.getItem('userId');

  // Memoized filtered and sorted users - Updated to handle only admin/waiter
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchTerm === '' ||
        (user.username || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      // Filter for invited users only if toggle is on
      // Show only users who are in the same restaurant or are current user
      const matchesInvited = !showOnlyInvited || 
        (user.restaurantId && user.restaurantId === currentUserId) ||
        (user._id === currentUserId); // Always show current user

      return matchesSearch && matchesRole && matchesStatus && matchesInvited;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.username || a.name || '').toLowerCase();
          bValue = (b.username || b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'role':
          aValue = a.role || 'waiter'; // Default to waiter instead of user
          bValue = b.role || 'waiter';
          break;
        case 'status':
          aValue = a.status || 'inactive';
          bValue = b.status || 'inactive';
          break;
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics - Updated for all four roles
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const roles = {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      waiter: users.filter(u => u.role === 'waiter' || !u.role || u.role === 'user').length, // Include legacy users as waiters
      cashier: users.filter(u => u.role === 'cashier').length,
    };
    return { total, active, roles };
  }, [users]);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      if (!userId) {
        toast.error('User ID not found. Please login again.');
        return;
      }

      try {
        setLoading(true);
        await dispatch(fetchAllUsers({ token })).unwrap();
      } catch (error) {
        console.error('Failed to fetch users:', error);

        if (error.message === 'Unauthorized' || error.status === 401) {
          toast.error('Session expired. Please login again.');
        } else if (error.message === 'Forbidden' || error.status === 403) {
          toast.error('You do not have permission to view users.');
        } else {
          toast.error(error.message || 'Failed to load users. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [dispatch, token, userId]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, itemsPerPage]);

  // Handle single user role change
  const handleRoleChange = (user, newRole) => {
    if (user.role === newRole) return;

    // Reset checkbox states when opening modal
    setCheckboxStates({
      newRole: false,
      newPermissions: {}
    });

    setConfirmModal({
      visible: true,
      user,
      newRole,
      type: 'single'
    });
  };

  // Handle bulk role change - Updated for two roles only
  const handleBulkRoleChange = (newRole) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users to update.');
      return;
    }

    setConfirmModal({
      visible: true,
      user: null,
      newRole,
      type: 'bulk'
    });
  };

  // Confirm role change (single or bulk)
  const confirmRoleChange = async () => {
    const { user, newRole, type } = confirmModal;

    if (type === 'single') {
      setUpdating(prev => ({ ...prev, [user._id]: true }));

      try {
        // Get only the selected permissions from checkboxes
        const selectedPermissions = Object.keys(checkboxStates.newPermissions)
          .filter(permission => checkboxStates.newPermissions[permission] === true);

        console.log('=== ROLE CHANGE DEBUG ===');
        console.log('Selected permissions:', selectedPermissions);
        console.log('Checkbox states:', checkboxStates.newPermissions);
        console.log('========================');

        await dispatch(updateUserRole({
          userId: user._id,
          role: newRole,
          permissions: selectedPermissions,
          token
        })).unwrap();

        // Refresh users list to get updated data
        await dispatch(fetchAllUsers({ token })).unwrap();

        toast.success(`${user.username || user.name}'s role updated to ${newRole} successfully!`);
      } catch (error) {
        console.log("Role error", error)
        console.error('Role update error:', error);
        toast.error(error.message || 'Failed to update user role. Please try again.');
      } finally {
        setUpdating(prev => ({ ...prev, [user._id]: false }));
      }
    } else {
      setBulkUpdating(true);

      try {
        // Get only the selected permissions from checkboxes
        const selectedPermissions = Object.keys(checkboxStates.newPermissions)
          .filter(permission => checkboxStates.newPermissions[permission] === true);

        console.log('=== BULK ROLE CHANGE DEBUG ===');
        console.log('Selected permissions:', selectedPermissions);
        console.log('Checkbox states:', checkboxStates.newPermissions);
        console.log('==============================');

        // Update users sequentially to avoid overwhelming the server
        const updatePromises = selectedUsers.map(userId =>
          dispatch(updateUserRole({
            userId,
            role: newRole,
            permissions: selectedPermissions,
            token
          })).unwrap()
        );

        await Promise.all(updatePromises);

        // Refresh users list to get updated data
        await dispatch(fetchAllUsers({ token })).unwrap();

        toast.success(`${selectedUsers.length} users updated to ${newRole} successfully!`);
        setSelectedUsers([]);
      } catch (error) {
        console.error('Bulk update error:', error);
        toast.error('Some users failed to update. Please try again.');
      } finally {
        setBulkUpdating(false);
      }
    }

    setConfirmModal({ visible: false, user: null, newRole: null, type: 'single' });
  };

  // Handle user selection
  const handleUserSelection = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const selectableUsers = paginatedUsers
        .filter(user => user._id !== currentUserId)
        .map(user => user._id);
      setSelectedUsers(selectableUsers);
    } else {
      setSelectedUsers([]);
    }
  };

  // Utility functions
  const getRoleBadgeColor = (role) => ROLE_CONFIG[role]?.color || 'success'; // Default to success (waiter) instead of secondary

  const getStatusBadgeColor = (status) => status === 'active' ? 'success' : 'secondary';

  // Helper function to normalize role display
  const normalizeRole = (role) => {
    if (role === 'user' || !role) return 'waiter'; // Convert legacy users to waiters
    return role;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const refreshUsers = async () => {
    setLoading(true);
    try {
      await dispatch(fetchAllUsers({ token })).unwrap();
      toast.success('Users list refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh users list.');
    } finally {
      setLoading(false);
    }
  };


  // Handle invite user
  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if user is already in the restaurant
    const existingUser = users.find(user => 
      user.email === inviteForm.email && 
      user.restaurantId === currentUserId
    );
    
    if (existingUser) {
      toast.error('User is already part of this restaurant');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver: inviteForm.email, // Email address
          restaurantId: currentUserId, // Current user's restaurant
          message: inviteForm.message || `You have been invited to join as ${inviteForm.role}`,
          type: 'invitation'
        })
      });

      if (response.ok) {
        toast.success('Invitation sent successfully!');
        setInviteModal({ visible: false });
        setInviteForm({ email: '', role: 'waiter', message: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Early return for non-admin users
  if (!isAdmin && currentUserRole && currentUserRole !== 'admin' && currentUserRole !== 'superadmin') {
    return (
      <div className="p-4">
        <CAlert color="danger">
          <div className="d-flex align-items-center">
            <div className="me-2 text-danger" style={{ fontSize: '1.5rem' }}>🛡️</div>
            <div>
              <h4 className="mb-1">Access Denied</h4>
              <p className="mb-1">You don't have permission to access this page. Only administrators and super administrators can manage user permissions.</p>
              <small>Your current role: <strong>{currentUserRole || 'unknown'}</strong></small>
            </div>
          </div>
        </CAlert>
      </div>
    );
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <CSpinner size="lg" />
          <p className="mt-3">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!users || users.length === 0) {
    return (
      <div className="p-4">
        <CAlert color="warning">
          <div className="d-flex align-items-center">
            <CIcon icon={cilUser} className="me-2" size="lg" />
            <div>
              <h4 className="mb-1">No Users Found</h4>
              <p className="mb-2">Unable to load users data. This might be due to:</p>
              <ul className="mb-3">
                <li>Network connectivity issues</li>
                <li>Server unavailable</li>
                <li>Authentication problems</li>
              </ul>
              <CButton color="primary" onClick={() => window.location.reload()}>
                <CIcon icon={cilReload} className="me-1" />
                Retry
              </CButton>
            </div>
          </div>
        </CAlert>
      </div>
    );
  }

  return (
<div className="p-4">
    <div className="mb-4">
        {/* Main Flex Container: Column on mobile, Row on desktop */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
            
            {/* LEFT: Heading & Subtitle (Centered on mobile, Left on desktop) */}
            <div className="mb-3 mb-md-0 w-100 w-md-auto text-center text-md-start">
                
                {/* Heading: Centered on mobile */}
                <h1 className="fs-4 fw-semibold d-flex align-items-center justify-content-center justify-content-md-start text-theme-aware">
                    <CIcon icon={cilPeople} className="me-2" />
                    Permission Management
                </h1>
                
                {/* Subtitle: Automatically centered by parent div */}
                <p className="text-secondary mb-0">Manage user roles and permissions (Admin & Waiter)</p>
            </div>

            {/* RIGHT: Badge & Buttons (Centered stack on mobile, Right aligned row on desktop) */}
            <div className="d-flex flex-column flex-sm-row flex-md-nowrap align-items-center gap-2 w-100 w-md-auto">
                
                {/* Total Users Badge: Use text-theme-aware for text color in dark mode */}
                <CBadge 
                    color="info" 
                    className="fs-6 px-3 py-2 text-center w-100 w-sm-auto order-sm-1 order-md-1 text-theme-aware"
                    style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.375rem 0.75rem',
                        minWidth: 'auto',
                        // Ensure dark mode background for info badge is correct
                        backgroundColor: 'var(--cui-info-bg)', 
                        color: 'var(--cui-info-color)' 
                    }}
                >
                    Total Users: {stats.total}
                </CBadge>
                
                {/* Buttons Group: Centered on mobile */}
                <div className="d-flex justify-content-center justify-content-md-end gap-2 w-100 w-sm-auto order-sm-2 order-md-2">
                    
                    <CButton
                        color="success"
                        size="sm"
                        onClick={() => setInviteModal({ visible: true })}
                        className="w-100 w-sm-auto"
                        style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                    >
                        <CIcon icon={cilUserFollow} className="me-1" />
                        Invite User
                    </CButton>
                    
                    <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={refreshUsers}
                        disabled={loading}
                        className="w-100 w-sm-auto"
                        style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                    >
                        <CIcon icon={cilReload} className="me-1" />
                        Refresh
                    </CButton>
                </div>
            </div>
        </div>
    </div>
 
 
 

      {/* Statistics Cards - Mobile Responsive */}
      <CRow className="mb-4 g-3">
        <CCol xs={6} sm={6} md={3}>
          <CCard className="text-center border-start border-danger border-3 h-100">
            <CCardBody className="py-3">
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center">
                <div className="text-danger me-0 me-sm-2 mb-2 mb-sm-0" style={{ fontSize: '1.5rem' }}>👤</div>
                <div>
                  <h3 className="text-danger mb-0">{stats.roles.admin}</h3>
                  <p className="mb-0 small">Administrators</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={6} sm={6} md={3}>
          <CCard className="text-center border-start border-warning border-3 h-100">
            <CCardBody className="py-3">
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center">
                <div className="text-warning me-0 me-sm-2 mb-2 mb-sm-0" style={{ fontSize: '1.5rem' }}>👔</div>
                <div>
                  <h3 className="text-warning mb-0">{stats.roles.manager}</h3>
                  <p className="mb-0 small">Managers</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={6} sm={6} md={3}>
          <CCard className="text-center border-start border-success border-3 h-100">
            <CCardBody className="py-3">
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center">
                <CIcon icon={cilUserFollow} className="text-success me-0 me-sm-2 mb-2 mb-sm-0" size="lg" />
                <div>
                  <h3 className="text-success mb-0">{stats.roles.waiter}</h3>
                  <p className="mb-0 small">Waiters</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={6} sm={6} md={3}>
          <CCard className="text-center border-start border-info border-3 h-100">
            <CCardBody className="py-3">
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center">
                <div className="text-info me-0 me-sm-2 mb-2 mb-sm-0" style={{ fontSize: '1.5rem' }}>💰</div>
                <div>
                  <h3 className="text-info mb-0">{stats.roles.cashier}</h3>
                  <p className="mb-0 small">Cashiers</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Active Users Card */}
      <CRow className="mb-4">
        <CCol md={12}>
          <CCard className="text-center border-start border-primary border-3">
            <CCardBody className="py-3">
              <div className="d-flex align-items-center justify-content-center">
                <div className="text-primary me-2" style={{ fontSize: '1.5rem' }}>✅</div>
                <div>
                  <h3 className="text-primary mb-0">{stats.active}</h3>
                  <p className="mb-0 small">Active Users</p>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Filters and Bulk Actions - Mobile Responsive */}
      <CCard className="mb-4">
        <CCardHeader className="py-2">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <h6 className="mb-2 mb-md-0">Search & Filters</h6>
            {selectedUsers.length > 0 && (
              <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                <small className="text-muted align-self-center mb-2 mb-sm-0">
                  {selectedUsers.length} selected
                </small>
                <CDropdown className="w-100 w-sm-auto">
                  <CDropdownToggle color="primary" size="sm" disabled={bulkUpdating || updateLoading} className="w-100 w-sm-auto">
                    {(bulkUpdating || updateLoading) ? <CSpinner size="sm" className="me-1" /> : null}
                    Bulk Actions
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => handleBulkRoleChange('admin')}>
                      Make Administrators
                    </CDropdownItem>
                    <CDropdownItem onClick={() => handleBulkRoleChange('manager')}>
                      Make Managers
                    </CDropdownItem>
                    <CDropdownItem onClick={() => handleBulkRoleChange('waiter')}>
                      Make Waiters
                    </CDropdownItem>
                    <CDropdownItem onClick={() => handleBulkRoleChange('cashier')}>
                      Make Cashiers
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} sm={6} md={4}>
              <div className="position-relative">
                <CIcon icon={cilSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3" />
                <CFormInput
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5"
                />
              </div>
            </CCol>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="waiter">Waiter</option>
                <option value="cashier">Cashier</option>
              </CFormSelect>
            </CCol>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </CFormSelect>
            </CCol>
            <CCol xs={6} sm={6} md={2}>
              <CFormSelect
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option} per page</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={6} sm={6} md={2}>
              <CFormSelect
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="role-asc">Role A-Z</option>
                <option value="role-desc">Role Z-A</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12} sm={12} md={2}>
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  id="showOnlyInvited"
                  checked={showOnlyInvited}
                  onChange={(e) => setShowOnlyInvited(e.target.checked)}
                />
                <label htmlFor="showOnlyInvited" className="form-label mb-0 small">
                  Show only my restaurant users
                </label>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Users Table - Mobile Responsive */}
      <CCard>
        <CCardBody className="p-0">
          {/* Desktop Table View */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <CTable hover className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={paginatedUsers.filter(u => u._id !== currentUserId).length > 0 &&
                          paginatedUsers.filter(u => u._id !== currentUserId).every(u => selectedUsers.includes(u._id))}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      User {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('email')}
                    >
                      Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('role')}
                    >
                      Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('date')}
                    >
                      Joined {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => {
                      const displayRole = normalizeRole(user.role);
                      const isUserUpdating = updating[user._id] || updateLoading;

                      return (
                        <CTableRow key={user._id}>
                          <CTableDataCell>
                            {user._id !== currentUserId && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                              />
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <div className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-gradient text-white fw-semibold"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
                                }}>
                                {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold">{user.username || user.name || 'Unknown User'}</div>
                                {user._id === currentUserId && (
                                  <small className="text-primary fw-bold">(You)</small>
                                )}
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>{user.email || 'No email'}</CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center gap-2">
                              <CBadge
                                color={getRoleBadgeColor(displayRole)}
                                className="text-capitalize"
                              >
                                {ROLE_CONFIG[displayRole]?.label || displayRole}
                              </CBadge>
                              <CButton
                                color="light"
                                size="sm"
                                variant="ghost"
                                onClick={() => setRoleInfoModal({ visible: true, role: displayRole })}
                              >
                                <CIcon icon={cilSettings} size="sm" />
                              </CButton>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={getStatusBadgeColor(user.status)} className="text-capitalize">
                              {user.status || 'inactive'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {user._id !== currentUserId ? (
                              <CButtonGroup size="sm">
                                {displayRole !== 'admin' && (
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user, 'admin')}
                                    disabled={isUserUpdating}
                                  >
                                    {isUserUpdating ? <CSpinner size="sm" /> : 'Admin'}
                                  </CButton>
                                )}
                                {displayRole !== 'manager' && (
                                  <CButton
                                    color="warning"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user, 'manager')}
                                    disabled={isUserUpdating}
                                  >
                                    {isUserUpdating ? <CSpinner size="sm" /> : 'Manager'}
                                  </CButton>
                                )}
                                {displayRole !== 'waiter' && (
                                  <CButton
                                    color="success"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user, 'waiter')}
                                    disabled={isUserUpdating}
                                  >
                                    {isUserUpdating ? <CSpinner size="sm" /> : 'Waiter'}
                                  </CButton>
                                )}
                                {displayRole !== 'cashier' && (
                                  <CButton
                                    color="info"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user, 'cashier')}
                                    disabled={isUserUpdating}
                                  >
                                    {isUserUpdating ? <CSpinner size="sm" /> : 'Cashier'}
                                  </CButton>
                                )}
                              </CButtonGroup>
                            ) : (
                              <span className="text-muted small">Current User</span>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center py-5 text-muted">
                        <div style={{ fontSize: '3rem' }} className="mb-3">👥</div>
                        <h5>No users found</h5>
                        <p>Try adjusting your search or filter criteria</p>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="d-lg-none">
            {paginatedUsers.length > 0 ? (
              <div className="p-3">
                {paginatedUsers.map((user) => {
                  const displayRole = normalizeRole(user.role);
                  const isUserUpdating = updating[user._id] || updateLoading;

                  return (
                    <CCard key={user._id} className="mb-3">
                      <CCardBody className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center">
                            <div className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-gradient text-white fw-semibold"
                              style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
                              }}>
                              {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold">{user.username || user.name || 'Unknown User'}</div>
                              {user._id === currentUserId && (
                                <small className="text-primary fw-bold">(You)</small>
                              )}
                            </div>
                          </div>
                          {user._id !== currentUserId && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                              className="form-check-input"
                            />
                          )}
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <small className="text-muted">Email</small>
                            <div className="fw-medium">{user.email || 'No email'}</div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Status</small>
                            <div>
                              <CBadge color={getStatusBadgeColor(user.status)} className="text-capitalize">
                                {user.status || 'inactive'}
                              </CBadge>
                            </div>
                          </div>
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <small className="text-muted">Role</small>
                            <div className="d-flex align-items-center gap-2">
                              <CBadge
                                color={getRoleBadgeColor(displayRole)}
                                className="text-capitalize"
                              >
                                {ROLE_CONFIG[displayRole]?.label || displayRole}
                              </CBadge>
                              <CButton
                                color="light"
                                size="sm"
                                variant="ghost"
                                onClick={() => setRoleInfoModal({ visible: true, role: displayRole })}
                              >
                                <CIcon icon={cilSettings} size="sm" />
                              </CButton>
                            </div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Joined</small>
                            <div className="fw-medium">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        </div>

                        {user._id !== currentUserId && (
                          <div className="d-grid gap-2">
                            <div className="d-flex flex-wrap gap-1">
                              {displayRole !== 'admin' && (
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user, 'admin')}
                                  disabled={isUserUpdating}
                                  className="flex-fill"
                                >
                                  {isUserUpdating ? <CSpinner size="sm" /> : 'Admin'}
                                </CButton>
                              )}
                              {displayRole !== 'manager' && (
                                <CButton
                                  color="warning"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user, 'manager')}
                                  disabled={isUserUpdating}
                                  className="flex-fill"
                                >
                                  {isUserUpdating ? <CSpinner size="sm" /> : 'Manager'}
                                </CButton>
                              )}
                              {displayRole !== 'waiter' && (
                                <CButton
                                  color="success"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user, 'waiter')}
                                  disabled={isUserUpdating}
                                  className="flex-fill"
                                >
                                  {isUserUpdating ? <CSpinner size="sm" /> : 'Waiter'}
                                </CButton>
                              )}
                              {displayRole !== 'cashier' && (
                                <CButton
                                  color="info"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user, 'cashier')}
                                  disabled={isUserUpdating}
                                  className="flex-fill"
                                >
                                  {isUserUpdating ? <CSpinner size="sm" /> : 'Cashier'}
                                </CButton>
                              )}
                            </div>
                          </div>
                        )}
                      </CCardBody>
                    </CCard>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }} className="mb-3">👥</div>
                <h5>No users found</h5>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* Pagination - Mobile Responsive */}
      {totalPages > 1 && (
        <div className="mt-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="text-muted small text-center text-md-start">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
            </div>
            <div className="d-flex justify-content-center">
              <CPagination className="mb-0">
                {/* Mobile: Show only prev/next and current page */}
                <div className="d-md-none d-flex gap-1">
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ←
                  </CPaginationItem>
                  <CPaginationItem active>
                    {currentPage} / {totalPages}
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    →
                  </CPaginationItem>
                </div>

                {/* Desktop: Show full pagination */}
                <div className="d-none d-md-flex">
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    First
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </CPaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum <= totalPages) {
                      return (
                        <CPaginationItem
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </CPaginationItem>
                      );
                    }
                    return null;
                  })}

                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Last
                  </CPaginationItem>
                </div>
              </CPagination>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal - Mobile Responsive */}
      <CModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, user: null, newRole: null, type: 'single' })}
        size="lg"
      >
        <CModalHeader>
          <h5 className="d-flex align-items-center">
            <div className="me-2" style={{ fontSize: '1.2rem' }}>⚙️</div>
            Confirm Role Change
          </h5>
        </CModalHeader>
        <CModalBody>
          {confirmModal.type === 'single' && confirmModal.user && (
            <div>
              <div className="mb-4">
                <p className="mb-3">
                  Are you sure you want to change the role of{' '}
                  <strong>{confirmModal.user.username || confirmModal.user.name}</strong>{' '}
                  from{' '}
                  <CBadge color={getRoleBadgeColor(normalizeRole(confirmModal.user.role))} className="text-capitalize">
                    {ROLE_CONFIG[normalizeRole(confirmModal.user.role)]?.label || normalizeRole(confirmModal.user.role)}
                  </CBadge>{' '}
                  to{' '}
                  <CBadge color={getRoleBadgeColor(confirmModal.newRole)} className="text-capitalize">
                    {ROLE_CONFIG[confirmModal.newRole]?.label || confirmModal.newRole}
                  </CBadge>?
                </p>
              </div>

              {/* Role Comparison - Mobile Responsive */}
              <CRow className="mb-4 g-3">
                <CCol xs={12} md={6}>
                  <CCard className="h-100">
                    <CCardHeader className="py-2">
                      <small className="text-muted">Current Role</small>
                    </CCardHeader>
                    <CCardBody className="py-3">
                      <h6 className="text-danger mb-2">
                        <CBadge color={getRoleBadgeColor(normalizeRole(confirmModal.user.role))}>
                          {ROLE_CONFIG[normalizeRole(confirmModal.user.role)]?.label || normalizeRole(confirmModal.user.role)}
                        </CBadge>
                      </h6>
                      <p className="small mb-2">
                        {ROLE_CONFIG[normalizeRole(confirmModal.user.role)]?.description || 'No description available'}
                      </p>
                      <div>
                        <small className="text-muted d-block mb-1">Permissions:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {ROLE_CONFIG[normalizeRole(confirmModal.user.role)]?.permissions.map((permission, idx) => (
                            <small key={idx} className="badge bg-light text-dark me-1 mb-1">{permission}</small>
                          ))}
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol xs={12} md={6}>
                  <CCard className="h-100 border-primary">
                    <CCardHeader className="py-2 bg-primary text-white">
                      <small>New Role</small>
                    </CCardHeader>
                    <CCardBody className="py-3">
                      <h6 className="text-primary mb-2 d-flex align-items-center">
                        <input 
                          type="checkbox" 
                          className="form-check-input me-2" 
                          checked={checkboxStates.newRole}
                          onChange={() => toggleCheckbox('newRole')}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        <CBadge color={getRoleBadgeColor(confirmModal.newRole)}>
                          {ROLE_CONFIG[confirmModal.newRole]?.label || confirmModal.newRole}
                        </CBadge>
                      </h6>
                      <p className="small mb-2">
                        {ROLE_CONFIG[confirmModal.newRole]?.description || 'No description available'}
                      </p>
                      <div>
                        <small className="text-muted d-block mb-1">Permissions:</small>
                        <div className="d-flex flex-column gap-1">
                          {ROLE_CONFIG[confirmModal.newRole]?.permissions.map((permission, idx) => (
                            <div key={idx} className="d-flex align-items-center">
                              <input 
                                type="checkbox" 
                                className="form-check-input me-2" 
                                checked={checkboxStates.newPermissions[permission] === true}
                                onChange={() => toggleCheckbox('newPermission', permission)}
                                style={{ transform: 'scale(0.9)' }}
                              />
                              <small className="text-primary">{permission}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {!canChangeRole() && (
                <CAlert color="info">
                  <div className="d-flex align-items-start">
                    <div className="me-2 mt-1" style={{ fontSize: '1.2rem' }}>ℹ️</div>
                    <div>
                      <strong>Select Permissions:</strong> Please select at least one permission from the "New Role" section to enable role change.
                    </div>
                  </div>
                </CAlert>
              )}
              
              <CAlert color="warning">
                <div className="d-flex align-items-start">
                  <div className="me-2 mt-1" style={{ fontSize: '1.2rem' }}>⚠️</div>
                  <div>
                    <strong>Important:</strong> This action will immediately change the user's permissions and access level.
                    The user may need to log out and log back in for all changes to take effect.
                  </div>
                </div>
              </CAlert>
            </div>
          )}

          {confirmModal.type === 'bulk' && (
            <div>
              <div className="mb-4">
                <p className="mb-3">
                  Are you sure you want to change the role of{' '}
                  <strong>{selectedUsers.length} selected users</strong>{' '}
                  to{' '}
                  <CBadge color={getRoleBadgeColor(confirmModal.newRole)} className="text-capitalize">
                    {ROLE_CONFIG[confirmModal.newRole]?.label || confirmModal.newRole}
                  </CBadge>?
                </p>
              </div>

              {/* New Role Info */}
              <CCard className="mb-4">
                <CCardHeader className="py-2">
                  <h6 className="mb-0">New Role Details</h6>
                </CCardHeader>
                <CCardBody>
                  <div className="mb-2 d-flex align-items-center">
                    <input 
                      type="checkbox" 
                      className="form-check-input me-2" 
                      checked={checkboxStates.newRole}
                      onChange={() => toggleCheckbox('newRole')}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <CBadge color={getRoleBadgeColor(confirmModal.newRole)} className="me-2">
                      {ROLE_CONFIG[confirmModal.newRole]?.label || confirmModal.newRole}
                    </CBadge>
                  </div>
                  <p className="mb-2">
                    {ROLE_CONFIG[confirmModal.newRole]?.description || 'No description available'}
                  </p>
                  <div>
                    <small className="text-muted d-block mb-1">Permissions:</small>
                    {ROLE_CONFIG[confirmModal.newRole]?.permissions.map((permission, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-1">
                        <input 
                          type="checkbox" 
                          className="form-check-input me-2" 
                          checked={checkboxStates.newPermissions[permission] === true}
                          onChange={() => toggleCheckbox('newPermission', permission)}
                          style={{ transform: 'scale(0.9)' }}
                        />
                        <small>{permission}</small>
                      </div>
                    ))}
                  </div>
                </CCardBody>
              </CCard>

              <CAlert color="warning">
                <div className="d-flex align-items-start">
                  <div className="me-2 mt-1" style={{ fontSize: '1.2rem' }}>⚠️</div>
                  <div>
                    <strong>Bulk Operation Warning:</strong> This will update multiple users simultaneously.
                    Users may need to log out and log back in for all changes to take effect.
                  </div>
                </div>
              </CAlert>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="d-flex flex-column flex-sm-row gap-2">
          <CButton
            color="secondary"
            onClick={() => setConfirmModal({ visible: false, user: null, newRole: null, type: 'single' })}
            className="w-100 w-sm-auto"
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={confirmRoleChange}
            disabled={updating[confirmModal.user?._id] || bulkUpdating || updateLoading || !canChangeRole()}
            className="w-100 w-sm-auto"
          >
            {(updating[confirmModal.user?._id] || bulkUpdating || updateLoading) && (
              <CSpinner size="sm" className="me-2" />
            )}
            Confirm Change
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Role Information Modal - Mobile Responsive */}
      <CModal
        visible={roleInfoModal.visible}
        onClose={() => setRoleInfoModal({ visible: false, role: null })}
        size="lg"
      >
        <CModalHeader>
          <h5 className="d-flex align-items-center">
            <div className="me-2" style={{ fontSize: '1.2rem' }}>ℹ️</div>
            Role Information
          </h5>
        </CModalHeader>
        <CModalBody>
          {roleInfoModal.role && ROLE_CONFIG[roleInfoModal.role] && (
            <div>
              <div className="text-center mb-4">
                <CBadge
                  color={getRoleBadgeColor(roleInfoModal.role)}
                  className="fs-5 px-3 py-2"
                >
                  {ROLE_CONFIG[roleInfoModal.role].label}
                </CBadge>
              </div>

              <div className="mb-4">
                <h6>Description</h6>
                <p>{ROLE_CONFIG[roleInfoModal.role].description}</p>
              </div>

              <div>
                <h6>Permissions & Access</h6>
                <ul className="list-unstyled">
                  {ROLE_CONFIG[roleInfoModal.role].permissions.map((permission, idx) => (
                    <li key={idx} className="d-flex align-items-center mb-2">
                      <span className="text-success me-2" style={{ fontSize: '1rem' }}>✓</span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              {roleInfoModal.role === 'admin' && (
                <CAlert color="danger" className="mt-3">
                  <strong>Administrator Role:</strong> Has complete system access and can manage all users and settings.
                  Use this role carefully.
                </CAlert>
              )}

              {roleInfoModal.role === 'waiter' && (
                <CAlert color="success" className="mt-3">
                  <strong>Waiter Role:</strong> Designed for restaurant service staff with operational access to order and table management.
                </CAlert>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setRoleInfoModal({ visible: false, role: null })}
            className="w-100 w-sm-auto"
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Invite User Modal */}
      <CModal
        visible={inviteModal.visible}
        onClose={() => setInviteModal({ visible: false })}
        size="lg"
      >
        <CModalHeader>
          <h5 className="d-flex align-items-center">
            <CIcon icon={cilUserFollow} className="me-2" />
            Invite User
          </h5>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Email Address *</label>
            <CFormInput
              type="email"
              placeholder="Enter user's email address"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              required
            />
            <small className="text-muted">User will receive an invitation notification</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <CFormSelect
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            >
              <option value="waiter">Waiter</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </CFormSelect>
            <small className="text-muted">Default role for the invited user</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Message (Optional)</label>
            <CFormInput
              type="text"
              placeholder="Custom invitation message"
              value={inviteForm.message}
              onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
            />
            <small className="text-muted">Personal message to include in the invitation</small>
          </div>

          <CAlert color="info">
            <div className="d-flex align-items-start">
              <div className="me-2 mt-1" style={{ fontSize: '1.2rem' }}>ℹ️</div>
              <div>
                <strong>How it works:</strong>
                <ul className="mb-0 mt-2">
                  <li>User will receive a notification invitation</li>
                  <li>They need to accept the invitation to join</li>
                  <li>Once accepted, they'll appear in your user list</li>
                </ul>
              </div>
            </div>
          </CAlert>

          <CAlert color="warning">
            <div className="d-flex align-items-start">
              <div className="me-2 mt-1" style={{ fontSize: '1.2rem' }}>⚠️</div>
              <div>
                <strong>Note:</strong>
                <ul className="mb-0 mt-2">
                  <li>Cannot invite users who are already in this restaurant</li>
                  <li>Cannot send duplicate invitations</li>
                  <li>User must be registered in the system</li>
                </ul>
              </div>
            </div>
          </CAlert>
        </CModalBody>
        <CModalFooter className="d-flex flex-column flex-sm-row gap-2">
          <CButton
            color="secondary"
            onClick={() => setInviteModal({ visible: false })}
            className="w-100 w-sm-auto"
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleInviteUser}
            disabled={inviteLoading || !inviteForm.email}
            className="w-100 w-sm-auto"
          >
            {inviteLoading && <CSpinner size="sm" className="me-2" />}
            Send Invitation
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
// import React, { useState, useEffect } from 'react';
// import {
//   CButton, CModal, CModalBody, CModalHeader, CModalFooter,
//   CFormInput, CRow, CCol, CCard, CCardBody, CSpinner,
//   CFormSelect, CTable, CTableHead, CTableRow, CTableHeaderCell,
//   CTableBody, CTableDataCell, CBadge, CAlert
// } from '@coreui/react';
// import { useDispatch, useSelector } from 'react-redux';
// import { toast } from 'react-toastify';
// import { fetchAllUsers } from '../../redux/slices/authSlice';

// export default function PermissionManagement() {
//   const dispatch = useDispatch();

//   // Get values from Redux state
//   const token = useSelector(state => state.auth.token);
//   const currentUserRole = useSelector(state => state.auth.role);
//   const currentUserId = useSelector(state => state.auth.userId);
//   const users = useSelector(state => state.auth.users || []);
//   const authLoading = useSelector(state => state.auth.loading);

//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [roleFilter, setRoleFilter] = useState('All');
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [confirmModal, setConfirmModal] = useState({ visible: false, user: null, newRole: null });
//   const [updating, setUpdating] = useState({});

//   // Check if current user is admin
//   const isAdmin = currentUserRole === 'admin';

//   console.log('Debug - Current user role:', currentUserRole);
//   console.log('Debug - Is admin:', isAdmin);
//   console.log('Debug - Current user ID:', currentUserId);
//   console.log('Debug - Users from Redux:', users);

//   // Get userId from Redux first, fallback to localStorage
//   const userId = currentUserId || localStorage.getItem('userId');

//   // Fetch users when component mounts
//   useEffect(() => {
//     const loadUsers = async () => {
//       // Check if we have both token and userId
//       if (!token) {
//         console.error('No token available');
//         toast.error('Authentication token not found. Please login again.');
//         return;
//       }

//       if (!userId) {
//         console.error('No userId available');
//         toast.error('User ID not found. Please login again.');
//         return;
//       }

//       try {
//         setLoading(true);
//         console.log('Fetching users with token:', token, 'and userId:', userId);

//         const result = await dispatch(fetchAllUsers({ token })).unwrap();
//         console.log('Users fetched successfully:', result);

//       } catch (error) {
//         console.error('Failed to fetch users:', error);

//         // Handle different error types
//         if (error.message === 'Unauthorized' || error.status === 401) {
//           toast.error('Session expired. Please login again.');
//           // You might want to redirect to login here
//         } else if (error.message === 'Forbidden' || error.status === 403) {
//           toast.error('You do not have permission to view users.');
//         } else {
//           toast.error(error.message || 'Failed to load users. Please try again.');
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadUsers();
//   }, [dispatch, token, userId]);

//   // Update user role function
//   const updateUserRole = async (userId, newRole) => {
//     try {
//       const response = await fetch(`/api/auth/users/${userId}/role`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ role: newRole })
//       });

//       const responseData = await response.json();

//       if (!response.ok) {
//         throw new Error(responseData.message || 'Failed to update user role');
//       }

//       return responseData;
//     } catch (error) {
//       console.error('Update role error:', error);
//       throw error;
//     }
//   };

//   const handleRoleChange = (user, newRole) => {
//     if (user.role === newRole) return;

//     setConfirmModal({
//       visible: true,
//       user,
//       newRole
//     });
//   };

//   const confirmRoleChange = async () => {
//     const { user, newRole } = confirmModal;
//     setUpdating(prev => ({ ...prev, [user._id]: true }));

//     try {
//       // Call the API to update user role
//       await updateUserRole(user._id, newRole);

//       // Refresh the users list to get updated data
//       await dispatch(fetchAllUsers({ token })).unwrap();

//       toast.success(`${user.fullname || user.name}'s role updated to ${newRole} successfully!`);
//       setConfirmModal({ visible: false, user: null, newRole: null });
//     } catch (error) {
//       console.error('Role update error:', error);
//       toast.error(error.message || 'Failed to update user role. Please try again.');
//     } finally {
//       setUpdating(prev => ({ ...prev, [user._id]: false }));
//     }
//   };

//   const getRoleBadgeColor = (role) => {
//     switch (role) {
//       case 'admin': return 'danger';
//       case 'waiter': return 'success';
//       case 'user': return 'secondary';
//       default: return 'secondary';
//     }
//   };

//   const getStatusBadgeColor = (status) => {
//     return status === 'active' ? 'success' : 'secondary';
//   };

//   const filteredUsers = users
//     .filter(user =>
//       roleFilter === 'All' || user.role === roleFilter.toLowerCase()
//     )
//     .filter(user =>
//       statusFilter === 'All' || user.status === statusFilter.toLowerCase()
//     )
//     .filter(user =>
//       (user.fullname || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
//     );

//   // Early return for non-admin users
//   if (!isAdmin && currentUserRole && currentUserRole !== 'admin') {
//     return (
//       <div className="p-4">
//         <CAlert color="danger">
//           <h4>Access Denied</h4>
//           <p>You don't have permission to access this page. Only administrators can manage user permissions.</p>
//           <small>Your current role: <strong>{currentUserRole || 'unknown'}</strong></small>
//         </CAlert>
//       </div>
//     );
//   }

//   // Show loading state
//   if (authLoading || loading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
//         <div className="text-center">
//           <CSpinner />
//           <p className="mt-2">Loading users...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state if no users and not loading
//   if (!users || users.length === 0) {
//     return (
//       <div className="p-4">
//         <CAlert color="warning">
//           <h4>No Users Found</h4>
//           <p>Unable to load users data. This might be due to:</p>
//           <ul>
//             <li>Network connectivity issues</li>
//             <li>Server unavailable</li>
//             <li>Authentication problems</li>
//           </ul>
//           <CButton
//             color="primary"
//             onClick={() => window.location.reload()}
//           >
//             Retry
//           </CButton>
//         </CAlert>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <div>
//           <h1 className="fs-4 fw-semibold">Permission Management</h1>
//           <p className="text-muted mb-0">Manage user roles and permissions</p>
//         </div>
//         <CBadge color="info" className="fs-6 px-3 py-2">
//           Total Users: {users.length}
//         </CBadge>
//       </div>

//       {/* Filters */}
//       <CCard className="mb-4">
//         <CCardBody>
//           <CRow className="g-3">
//             <CCol md={6}>
//               <CFormInput
//                 placeholder="Search by name or email..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </CCol>
//             <CCol md={3}>
//               <CFormSelect
//                 value={roleFilter}
//                 onChange={(e) => setRoleFilter(e.target.value)}
//               >
//                 <option value="All">All Roles</option>
//                 <option value="Admin">Admin</option>
//                 <option value="Waiter">Waiter</option>
//                 <option value="User">User</option>
//               </CFormSelect>
//             </CCol>
//             <CCol md={3}>
//               <CFormSelect
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="All">All Status</option>
//                 <option value="Active">Active</option>
//                 <option value="Inactive">Inactive</option>
//               </CFormSelect>
//             </CCol>
//           </CRow>
//         </CCardBody>
//       </CCard>

//       {/* Statistics Cards */}
//       <CRow className="mb-4">
//         <CCol md={3}>
//           <CCard className="text-center">
//             <CCardBody>
//               <h3 className="text-primary">{users.filter(u => u.role === 'admin').length}</h3>
//               <p className="mb-0">Admins</p>
//             </CCardBody>
//           </CCard>
//         </CCol>
//         <CCol md={3}>
//           <CCard className="text-center">
//             <CCardBody>
//               <h3 className="text-success">{users.filter(u => u.role === 'waiter').length}</h3>
//               <p className="mb-0">Waiters</p>
//             </CCardBody>
//           </CCard>
//         </CCol>
//         <CCol md={3}>
//           <CCard className="text-center">
//             <CCardBody>
//               <h3 className="text-secondary">{users.filter(u => u.role === 'user').length}</h3>
//               <p className="mb-0">Users</p>
//             </CCardBody>
//           </CCard>
//         </CCol>
//         <CCol md={3}>
//           <CCard className="text-center">
//             <CCardBody>
//               <h3 className="text-info">{users.filter(u => u.status === 'active').length}</h3>
//               <p className="mb-0">Active</p>
//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>

//       {/* Users Table */}
//       <CCard>
//         <CCardBody className="p-0">
//           <CTable hover responsive>
//             <CTableHead>
//               <CTableRow>
//                 <CTableHeaderCell>User</CTableHeaderCell>
//                 <CTableHeaderCell>Email</CTableHeaderCell>
//                 <CTableHeaderCell>Current Role</CTableHeaderCell>
//                 <CTableHeaderCell>Status</CTableHeaderCell>
//                 <CTableHeaderCell>Joined Date</CTableHeaderCell>
//                 <CTableHeaderCell>Actions</CTableHeaderCell>
//               </CTableRow>
//             </CTableHead>
//             <CTableBody>
//               {filteredUsers.length > 0 ? (
//                 filteredUsers.map((user) => (
//                   <CTableRow key={user._id}>
//                     <CTableDataCell>
//                       <div className="d-flex align-items-center">
//                         <div className="flex items-center">
//                           <div className=" mr-2 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold h-10 w-10 shadow-md hover:scale-105 transition-transform duration-200">
//                             {(user.username || user.name || 'U').charAt(0).toUpperCase()}
//                           </div>
//                         </div>

//                         <div>
//                           <div className="fw-semibold">{user.username || user.name || 'Unknown User'}</div>
//                           {user._id === currentUserId && (
//                             <small className="text-muted">(You)</small>
//                           )}
//                         </div>
//                       </div>
//                     </CTableDataCell>
//                     <CTableDataCell>{user.email || 'No email'}</CTableDataCell>
//                     <CTableDataCell>
//                       <CBadge color={getRoleBadgeColor(user.role)} className="text-capitalize">
//                         {user.role || 'user'}
//                       </CBadge>
//                     </CTableDataCell>
//                     <CTableDataCell>
//                       <CBadge color={getStatusBadgeColor(user.status)} className="text-capitalize">
//                         {user.status || 'inactive'}
//                       </CBadge>
//                     </CTableDataCell>
//                     <CTableDataCell>
//                       {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
//                     </CTableDataCell>
//                     <CTableDataCell>
//                       {user._id !== currentUserId ? (
//                         <div className="d-flex gap-2">
//                           {user.role !== 'waiter' && (
//                             <CButton
//                               size="sm"
//                               color="success"
//                               variant="outline"
//                               onClick={() => handleRoleChange(user, 'waiter')}
//                               disabled={updating[user._id]}
//                             >
//                               {updating[user._id] ? <CSpinner size="sm" /> : 'Make Waiter'}
//                             </CButton>
//                           )}
//                           {user.role !== 'user' && (
//                             <CButton
//                               size="sm"
//                               color="secondary"
//                               variant="outline"
//                               onClick={() => handleRoleChange(user, 'user')}
//                               disabled={updating[user._id]}
//                             >
//                               {updating[user._id] ? <CSpinner size="sm" /> : 'Make User'}
//                             </CButton>
//                           )}
//                           {user.role !== 'admin' && currentUserRole === 'admin' && (
//                             <CButton
//                               size="sm"
//                               color="danger"
//                               variant="outline"
//                               onClick={() => handleRoleChange(user, 'admin')}
//                               disabled={updating[user._id]}
//                             >
//                               {updating[user._id] ? <CSpinner size="sm" /> : 'Make Admin'}
//                             </CButton>
//                           )}
//                         </div>
//                       ) : (
//                         <span className="text-muted">Current User</span>
//                       )}
//                     </CTableDataCell>
//                   </CTableRow>
//                 ))
//               ) : (
//                 <CTableRow>
//                   <CTableDataCell colSpan="6" className="text-center py-5 text-muted">
//                     <h5>No users found</h5>
//                     <p>Try adjusting your search or filter criteria</p>
//                   </CTableDataCell>
//                 </CTableRow>
//               )}
//             </CTableBody>
//           </CTable>
//         </CCardBody>
//       </CCard>

//       {/* Confirmation Modal */}
//       <CModal visible={confirmModal.visible} onClose={() => setConfirmModal({ visible: false, user: null, newRole: null })}>
//         <CModalHeader>
//           <h5>Confirm Role Change</h5>
//         </CModalHeader>
//         <CModalBody>
//           {confirmModal.user && (
//             <div>
//               <p>Are you sure you want to change the role of <strong>{confirmModal.user.fullname || confirmModal.user.name}</strong> from <strong>{confirmModal.user.role}</strong> to <strong>{confirmModal.newRole}</strong>?</p>

//               <CAlert color="warning" className="mt-3">
//                 <strong>Note:</strong> This action will immediately change the user's permissions and access level.
//               </CAlert>
//             </div>
//           )}
//         </CModalBody>
//         <CModalFooter>
//           <CButton
//             color="secondary"
//             onClick={() => setConfirmModal({ visible: false, user: null, newRole: null })}
//           >
//             Cancel
//           </CButton>
//           <CButton color="primary" onClick={confirmRoleChange}>
//             Confirm Change
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     </div>
//   );
// }
