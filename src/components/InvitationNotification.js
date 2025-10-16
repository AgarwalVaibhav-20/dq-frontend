import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
  CAlert,
  CButtonGroup
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBell, cilCheck, cilX, cilUserFollow } from '@coreui/icons';
import { toast } from 'react-toastify';

const InvitationNotification = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/my-notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notificationId, action) => {
    setProcessing(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/notifications/${notificationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        toast.success(`Invitation ${action} successfully!`);
        // Remove the notification from list
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action} invitation:`, error);
      toast.error(`Failed to ${action} invitation`);
    } finally {
      setProcessing(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <CBadge color="warning">Pending</CBadge>;
      case 'accepted':
        return <CBadge color="success">Accepted</CBadge>;
      case 'rejected':
        return <CBadge color="danger">Rejected</CBadge>;
      default:
        return <CBadge color="secondary">Unknown</CBadge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'invitation':
        return <CIcon icon={cilUserFollow} className="text-primary" />;
      default:
        return <CIcon icon={cilBell} className="text-info" />;
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center">
          <CIcon icon={cilBell} className="me-2" />
          Invitation Notifications
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner size="lg" />
            <p className="mt-3">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <CAlert color="info">
            <div className="d-flex align-items-center">
              <CIcon icon={cilBell} className="me-2" />
              <div>
                <h5 className="mb-1">No Notifications</h5>
                <p className="mb-0">You don't have any pending invitations.</p>
              </div>
            </div>
          </CAlert>
        ) : (
          <CListGroup>
            {notifications.map((notification) => (
              <CListGroupItem key={notification._id} className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    {getTypeIcon(notification.type)}
                    <div className="ms-2">
                      <h6 className="mb-1">
                        {notification.sender?.username || 'Unknown User'}
                      </h6>
                      <small className="text-muted">
                        {notification.sender?.email}
                      </small>
                    </div>
                  </div>
                  
                  <p className="mb-2">{notification.message}</p>
                  
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      Restaurant: {notification.restaurantId?.restaurantName || 'Unknown'}
                    </small>
                    <small className="text-muted">•</small>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                
                <div className="d-flex flex-column align-items-end gap-2">
                  {getStatusBadge(notification.status)}
                  
                  {notification.status === 'pending' && (
                    <CButtonGroup size="sm">
                      <CButton
                        color="success"
                        variant="outline"
                        onClick={() => handleNotificationAction(notification._id, 'accepted')}
                        disabled={processing[notification._id]}
                      >
                        {processing[notification._id] ? (
                          <CSpinner size="sm" />
                        ) : (
                          <>
                            <CIcon icon={cilCheck} className="me-1" />
                            Accept
                          </>
                        )}
                      </CButton>
                      <CButton
                        color="danger"
                        variant="outline"
                        onClick={() => handleNotificationAction(notification._id, 'rejected')}
                        disabled={processing[notification._id]}
                      >
                        {processing[notification._id] ? (
                          <CSpinner size="sm" />
                        ) : (
                          <>
                            <CIcon icon={cilX} className="me-1" />
                            Reject
                          </>
                        )}
                      </CButton>
                    </CButtonGroup>
                  )}
                </div>
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default InvitationNotification;
