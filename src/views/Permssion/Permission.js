import React, { useState, useEffect } from 'react';
import {
  CButton, CModal, CModalBody, CModalHeader, CModalFooter,
  CFormInput, CRow, CCol, CCard, CCardBody, CSpinner,
  CFormSelect, CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CBadge, CAlert
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchAllUsers } from '../../redux/slices/authSlice';

export default function PermissionManagement() {
  const dispatch = useDispatch();

  // Get values from Redux state
  const token = useSelector(state => state.auth.token);
  const currentUserRole = useSelector(state => state.auth.role);
  const currentUserId = useSelector(state => state.auth.userId);
  const users = useSelector(state => state.auth.users || []);
  const authLoading = useSelector(state => state.auth.loading);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmModal, setConfirmModal] = useState({ visible: false, user: null, newRole: null });
  const [updating, setUpdating] = useState({});

  // Check if current user is admin
  const isAdmin = currentUserRole === 'admin';

  console.log('Debug - Current user role:', currentUserRole);
  console.log('Debug - Is admin:', isAdmin);
  console.log('Debug - Current user ID:', currentUserId);
  console.log('Debug - Users from Redux:', users);

  // Get userId from Redux first, fallback to localStorage
  const userId = currentUserId || localStorage.getItem('userId');

  // Fetch users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      // Check if we have both token and userId
      if (!token) {
        console.error('No token available');
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      if (!userId) {
        console.error('No userId available');
        toast.error('User ID not found. Please login again.');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching users with token:', token, 'and userId:', userId);

        const result = await dispatch(fetchAllUsers({ token })).unwrap();
        console.log('Users fetched successfully:', result);

      } catch (error) {
        console.error('Failed to fetch users:', error);

        // Handle different error types
        if (error.message === 'Unauthorized' || error.status === 401) {
          toast.error('Session expired. Please login again.');
          // You might want to redirect to login here
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

  // Update user role function
  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update user role');
      }

      return responseData;
    } catch (error) {
      console.error('Update role error:', error);
      throw error;
    }
  };

  const handleRoleChange = (user, newRole) => {
    if (user.role === newRole) return;

    setConfirmModal({
      visible: true,
      user,
      newRole
    });
  };

  const confirmRoleChange = async () => {
    const { user, newRole } = confirmModal;
    setUpdating(prev => ({ ...prev, [user._id]: true }));

    try {
      // Call the API to update user role
      await updateUserRole(user._id, newRole);

      // Refresh the users list to get updated data
      await dispatch(fetchAllUsers({ token })).unwrap();

      toast.success(`${user.fullname || user.name}'s role updated to ${newRole} successfully!`);
      setConfirmModal({ visible: false, user: null, newRole: null });
    } catch (error) {
      console.error('Role update error:', error);
      toast.error(error.message || 'Failed to update user role. Please try again.');
    } finally {
      setUpdating(prev => ({ ...prev, [user._id]: false }));
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'waiter': return 'success';
      case 'user': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  const filteredUsers = users
    .filter(user =>
      roleFilter === 'All' || user.role === roleFilter.toLowerCase()
    )
    .filter(user =>
      statusFilter === 'All' || user.status === statusFilter.toLowerCase()
    )
    .filter(user =>
      (user.fullname || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Early return for non-admin users
  if (!isAdmin && currentUserRole && currentUserRole !== 'admin') {
    return (
      <div className="p-4">
        <CAlert color="danger">
          <h4>Access Denied</h4>
          <p>You don't have permission to access this page. Only administrators can manage user permissions.</p>
          <small>Your current role: <strong>{currentUserRole || 'unknown'}</strong></small>
        </CAlert>
      </div>
    );
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <CSpinner />
          <p className="mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  // Show error state if no users and not loading
  if (!users || users.length === 0) {
    return (
      <div className="p-4">
        <CAlert color="warning">
          <h4>No Users Found</h4>
          <p>Unable to load users data. This might be due to:</p>
          <ul>
            <li>Network connectivity issues</li>
            <li>Server unavailable</li>
            <li>Authentication problems</li>
          </ul>
          <CButton
            color="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </CButton>
        </CAlert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fs-4 fw-semibold">Permission Management</h1>
          <p className="text-muted mb-0">Manage user roles and permissions</p>
        </div>
        <CBadge color="info" className="fs-6 px-3 py-2">
          Total Users: {users.length}
        </CBadge>
      </div>

      {/* Filters */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormInput
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Waiter">Waiter</option>
                <option value="User">User</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Statistics Cards */}
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="text-center">
            <CCardBody>
              <h3 className="text-primary">{users.filter(u => u.role === 'admin').length}</h3>
              <p className="mb-0">Admins</p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center">
            <CCardBody>
              <h3 className="text-success">{users.filter(u => u.role === 'waiter').length}</h3>
              <p className="mb-0">Waiters</p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center">
            <CCardBody>
              <h3 className="text-secondary">{users.filter(u => u.role === 'user').length}</h3>
              <p className="mb-0">Users</p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center">
            <CCardBody>
              <h3 className="text-info">{users.filter(u => u.status === 'active').length}</h3>
              <p className="mb-0">Active</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Users Table */}
      <CCard>
        <CCardBody className="p-0">
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>User</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Current Role</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Joined Date</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <CTableRow key={user._id}>
                    <CTableDataCell>
                      <div className="d-flex align-items-center">
                        <div className="flex items-center">
                          <div className=" mr-2 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold h-10 w-10 shadow-md hover:scale-105 transition-transform duration-200">
                            {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div>
                          <div className="fw-semibold">{user.username || user.name || 'Unknown User'}</div>
                          {user._id === currentUserId && (
                            <small className="text-muted">(You)</small>
                          )}
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{user.email || 'No email'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getRoleBadgeColor(user.role)} className="text-capitalize">
                        {user.role || 'user'}
                      </CBadge>
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
                        <div className="d-flex gap-2">
                          {user.role !== 'waiter' && (
                            <CButton
                              size="sm"
                              color="success"
                              variant="outline"
                              onClick={() => handleRoleChange(user, 'waiter')}
                              disabled={updating[user._id]}
                            >
                              {updating[user._id] ? <CSpinner size="sm" /> : 'Make Waiter'}
                            </CButton>
                          )}
                          {user.role !== 'user' && (
                            <CButton
                              size="sm"
                              color="secondary"
                              variant="outline"
                              onClick={() => handleRoleChange(user, 'user')}
                              disabled={updating[user._id]}
                            >
                              {updating[user._id] ? <CSpinner size="sm" /> : 'Make User'}
                            </CButton>
                          )}
                          {user.role !== 'admin' && currentUserRole === 'admin' && (
                            <CButton
                              size="sm"
                              color="danger"
                              variant="outline"
                              onClick={() => handleRoleChange(user, 'admin')}
                              disabled={updating[user._id]}
                            >
                              {updating[user._id] ? <CSpinner size="sm" /> : 'Make Admin'}
                            </CButton>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Current User</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="6" className="text-center py-5 text-muted">
                    <h5>No users found</h5>
                    <p>Try adjusting your search or filter criteria</p>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Confirmation Modal */}
      <CModal visible={confirmModal.visible} onClose={() => setConfirmModal({ visible: false, user: null, newRole: null })}>
        <CModalHeader>
          <h5>Confirm Role Change</h5>
        </CModalHeader>
        <CModalBody>
          {confirmModal.user && (
            <div>
              <p>Are you sure you want to change the role of <strong>{confirmModal.user.fullname || confirmModal.user.name}</strong> from <strong>{confirmModal.user.role}</strong> to <strong>{confirmModal.newRole}</strong>?</p>

              <CAlert color="warning" className="mt-3">
                <strong>Note:</strong> This action will immediately change the user's permissions and access level.
              </CAlert>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setConfirmModal({ visible: false, user: null, newRole: null })}
          >
            Cancel
          </CButton>
          <CButton color="primary" onClick={confirmRoleChange}>
            Confirm Change
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}