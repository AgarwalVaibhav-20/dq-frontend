import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CSpinner,
  CAlert,
  CCardTitle,
  CCardText,
  CContainer,
} from '@coreui/react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import CIcon from '@coreui/icons-react';
import { cilUser, cilClock, cilCheckCircle, cilXCircle, cilSave } from '@coreui/icons';
import {BASE_URL} from '../../utils/constants';

const LoginActivity = () => {
  const dispatch = useDispatch();
  const { token, currentUserId } = useSelector(state => state.auth);
  
  // Get token from Redux or localStorage as fallback
  const authToken = token || localStorage.getItem('authToken');
  
  // State for form
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  
  // State for activities
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  console.log('LoginActivity component loaded');
  console.log('Token from Redux:', token ? 'Present' : 'Missing');
  console.log('Auth Token (fallback):', authToken ? 'Present' : 'Missing');
  console.log('Current User ID:', currentUserId);
  

  // Load current session and activities on component mount
  useEffect(() => {
    console.log('LoginActivity useEffect triggered');
    loadCurrentSession();
    loadActivities();
  }, []);

  // Load current active session
  const loadCurrentSession = async () => {
    try {
      console.log('Loading current session with token:', authToken ? 'present' : 'missing');
      const response = await fetch(`${BASE_URL}/api/login-activity/current`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Current session response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Current session data:', data);
        setCurrentSession(data.session);
      } else {
        console.error('Failed to load current session:', response.status);
      }
    } catch (error) {
      console.error('Error loading current session:', error);
    }
  };

  // Load login activities
  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/login-activity`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        toast.error('Failed to load login activities');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Error loading login activities');
    } finally {
      setLoading(false);
    }
  };

  // Handle save login activity
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!pin.trim()) {
      toast.error('Please enter your PIN');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 Frontend: Sending request with:', { name: name.trim(), pin: pin.trim() });
      
      const response = await fetch(`${BASE_URL}/api/login-activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(),
          pin: pin.trim()
        }),
      });

      console.log('🔍 Frontend: Response status:', response.status);
      console.log('🔍 Frontend: Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        toast.success('Login activity saved successfully!');
        setName('');
        setPin('');

        localStorage.setItem('sessionStarted', 'true');
        dispatch({ type: 'auth/setSessionStarted', payload: true });
        loadCurrentSession();
        loadActivities();
        
        // Set session started flag in localStorage
        // localStorage.setItem('sessionStarted', 'true');
        
        // Dispatch action to update Redux state
        // dispatch({ type: 'auth/setSessionStarted', payload: true });
      } else {
        const errorData = await response.json();
        console.error('❌ Backend error response:', errorData);
        toast.error(errorData.message || 'Failed to save login activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Error saving login activity');
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/login-activity/logout`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Logged out successfully!');
        setCurrentSession(null);
        loadActivities();
        
        // Clear session started flag
        localStorage.removeItem('sessionStarted');
        dispatch({ type: 'auth/setSessionStarted', payload: false });
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'Not logged out';
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  // Calculate session duration
  const calculateDuration = (loginTime, logoutTime) => {
    if (!logoutTime) return 'Active session';
    
    const login = new Date(loginTime);
    const logout = new Date(logoutTime);
    const diffMs = logout - login;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <CContainer fluid className="px-2 px-md-3">
      {/* Header Section - Mobile Responsive */}
      <CRow className="mb-3 mb-md-4">
        <CCol>
          <h2 className="h4 h3-md mb-2">Login Activity</h2>
          <p className="text-muted small">Track your login and logout activities</p>
        </CCol>
      </CRow>

      {/* Current Session Status - Mobile Responsive */}
      {currentSession && (
        <CRow className="mb-3 mb-md-4">
          <CCol>
            <CAlert color="info" className="d-flex align-items-start">
              <div className="d-flex align-items-start w-100">
                <CIcon icon={cilCheckCircle} className="me-2 mt-1 flex-shrink-0" />
                <div className="flex-grow-1">
                  <strong>Active Session:</strong><br className="d-md-none" />
                  <span className="d-md-inline d-block">{currentSession.name}</span>
                  <br className="d-md-none" />
                  <small className="d-block d-md-inline ms-md-2">
                    Logged in at {formatDate(currentSession.logintime)}
                  </small>
                </div>
                {/* Logout button hidden */}
                {/* <div className="flex-shrink-0 ms-2">
                  <CButton 
                    color="danger" 
                    size="sm" 
                    onClick={handleLogout}
                    className="d-flex align-items-center"
                  >
                    <CIcon icon={cilXCircle} className="me-1" />
                    Logout
                  </CButton>
                </div> */}
              </div>
            </CAlert>
          </CCol>
        </CRow>
      )}

      {/* Login Form - Mobile Responsive */}
      {!currentSession && (
        <CRow className="mb-3 mb-md-4">
          <CCol xs={12} sm={12} md={8} lg={6} xl={5}>
            <CCard className="shadow-sm">
              <CCardHeader className="py-3">
                <CCardTitle className="h5 mb-0">Record Login Activity</CCardTitle>
              </CCardHeader>
              <CCardBody className="p-3 p-md-4">
                <form onSubmit={handleSaveActivity}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Your Name</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <CIcon icon={cilUser} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Enter PIN</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        🔒
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <CButton 
                    type="submit" 
                    color="primary" 
                    disabled={saving}
                    className="w-100 w-md-auto"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilSave} className="me-2" />
                        Save Login Activity
                      </>
                    )}
                  </CButton>
                </form>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Activities List - Mobile Responsive */}
      <CRow>
        <CCol>
          <CCard className="shadow-sm">
            <CCardHeader className="py-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <CCardTitle className="h5 mb-2 mb-md-0">Login Activities History</CCardTitle>
                <div className="d-flex justify-content-end">
                  <CButton 
                    color="primary" 
                    size="sm" 
                    onClick={loadActivities}
                    disabled={loading}
                    className="w-100 w-md-auto"
                    style={{ 
                      fontSize: '0.875rem', 
                      padding: '0.375rem 0.75rem',
                      minWidth: 'auto'
                    }}
                  >
                    {loading ? <CSpinner size="sm" /> : 'Refresh'}
                  </CButton>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              {loading ? (
                <div className="text-center py-4">
                  <CSpinner />
                  <p className="mt-2">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-4">
                  <CIcon icon={cilClock} size="3xl" className="text-muted" />
                  <p className="mt-2 text-muted">No login activities found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <CTable responsive hover className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell className="border-0">Name</CTableHeaderCell>
                        <CTableHeaderCell className="border-0 d-none d-md-table-cell">Login Time</CTableHeaderCell>
                        <CTableHeaderCell className="border-0 d-none d-lg-table-cell">Logout Time</CTableHeaderCell>
                        <CTableHeaderCell className="border-0 d-none d-sm-table-cell">Duration</CTableHeaderCell>
                        <CTableHeaderCell className="border-0">Status</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {activities.map((activity, index) => (
                        <CTableRow key={activity._id || index}>
                          <CTableDataCell className="border-0">
                            <div className="d-flex align-items-center">
                              <CIcon icon={cilUser} className="me-2" />
                              <div>
                                <div className="fw-semibold">{activity.name}</div>
                                <div className="small text-muted d-md-none">
                                  <CIcon icon={cilClock} className="me-1" />
                                  {formatDate(activity.logintime)}
                                </div>
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="border-0 d-none d-md-table-cell">
                            <CIcon icon={cilClock} className="me-2" />
                            {formatDate(activity.logintime)}
                          </CTableDataCell>
                          <CTableDataCell className="border-0 d-none d-lg-table-cell">
                            {activity.logouttime ? (
                              <>
                                <CIcon icon={cilXCircle} className="me-2" />
                                {formatDate(activity.logouttime)}
                              </>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="border-0 d-none d-sm-table-cell">
                            {calculateDuration(activity.logintime, activity.logouttime)}
                          </CTableDataCell>
                          <CTableDataCell className="border-0">
                            <CBadge color={getStatusBadgeColor(activity.status)}>
                              {activity.status}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default LoginActivity;
