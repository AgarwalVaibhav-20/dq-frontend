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

const LoginActivity = () => {
  const dispatch = useDispatch();
  const { token, currentUserId } = useSelector(state => state.auth);
  
  // Get token from Redux or localStorage as fallback
  const authToken = token || localStorage.getItem('authToken');
  
  // State for form
  const [name, setName] = useState('');
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
      const response = await fetch('/api/login-activity/current', {
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
      const response = await fetch('/api/login-activity', {
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

    setSaving(true);
    try {
      const response = await fetch('/api/login-activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Login activity saved successfully!');
        setName('');
        loadCurrentSession();
        loadActivities();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save login activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Error saving login activity');
    } finally {
      setSaving(false);
    }
  };


  // Format date
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
    <CContainer fluid>
      <CRow className="mb-4">
        <CCol>
          <h2>Login Activity</h2>
          <p className="text-muted">Track your login and logout activities</p>
        </CCol>
      </CRow>

      {/* Current Session Status */}
      {currentSession && (
        <CRow className="mb-4">
          <CCol>
            <CAlert color="info" className="d-flex align-items-center">
              <CIcon icon={cilCheckCircle} className="me-2" />
              <div>
                <strong>Active Session:</strong> {currentSession.name} - 
                Logged in at {formatDate(currentSession.logintime)}
              </div>
            </CAlert>
          </CCol>
        </CRow>
      )}

      {/* Login Form */}
      {!currentSession && (
        <CRow className="mb-4">
          <CCol md={6}>
            <CCard>
              <CCardHeader>
                <CCardTitle>Record Login Activity</CCardTitle>
              </CCardHeader>
              <CCardBody>
                <form onSubmit={handleSaveActivity}>
                  <div className="mb-3">
                    <label className="form-label">Your Name</label>
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
                  <CButton 
                    type="submit" 
                    color="primary" 
                    disabled={saving}
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

      {/* Activities List */}
      <CRow>
        <CCol>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <CCardTitle>Login Activities History</CCardTitle>
              <CButton 
                color="primary" 
                size="sm" 
                onClick={loadActivities}
                disabled={loading}
              >
                {loading ? <CSpinner size="sm" /> : 'Refresh'}
              </CButton>
            </CCardHeader>
            <CCardBody>
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
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>Login Time</CTableHeaderCell>
                      <CTableHeaderCell>Logout Time</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {activities.map((activity, index) => (
                      <CTableRow key={activity._id || index}>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon icon={cilUser} className="me-2" />
                            {activity.name}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CIcon icon={cilClock} className="me-2" />
                          {formatDate(activity.logintime)}
                        </CTableDataCell>
                        <CTableDataCell>
                          {activity.logouttime ? (
                            <>
                              <CIcon icon={cilXCircle} className="me-2" />
                              {formatDate(activity.logouttime)}
                            </>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {calculateDuration(activity.logintime, activity.logouttime)}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getStatusBadgeColor(activity.status)}>
                            {activity.status}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default LoginActivity;
