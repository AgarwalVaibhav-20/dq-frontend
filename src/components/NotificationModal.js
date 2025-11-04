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
  CCardTitle,
  CListGroup,
  CListGroupItem,
  CBadge,
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilUser, cilPhone, cilEnvelopeOpen, cilWarning } from '@coreui/icons';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';

const NotificationModal = ({ visible, onClose, onCountChange }) => {
  const [customers, setCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchCustomersWithUpcomingEvents();
      fetchLowStockItems();
    }
  }, [visible]);

  const fetchCustomersWithUpcomingEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const restaurantId = localStorage.getItem('restaurantId');
      
      if (!token || !restaurantId) {
        setError('Authentication required');
        return;
      }

      // Fetch all customers for the restaurant
      const response = await axios.get(`${BASE_URL}/customer/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Backend returns { success: true, data: customers } or just customers array
      const allCustomers = response.data?.data || response.data || [];
      
      // Filter customers with birthdays or anniversaries today or tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingCustomers = allCustomers.filter(customer => {
        if (!customer.birthday && !customer.anniversary) return false;
        
        const birthday = customer.birthday ? new Date(customer.birthday) : null;
        const anniversary = customer.anniversary ? new Date(customer.anniversary) : null;
        
        const isBirthdayToday = birthday && isSameDate(birthday, today);
        const isBirthdayTomorrow = birthday && isSameDate(birthday, tomorrow);
        const isAnniversaryToday = anniversary && isSameDate(anniversary, today);
        const isAnniversaryTomorrow = anniversary && isSameDate(anniversary, tomorrow);
        
        return isBirthdayToday || isBirthdayTomorrow || isAnniversaryToday || isAnniversaryTomorrow;
      });

      // Add event type and date info to each customer
      const customersWithEventInfo = upcomingCustomers.map(customer => {
        const birthday = customer.birthday ? new Date(customer.birthday) : null;
        const anniversary = customer.anniversary ? new Date(customer.anniversary) : null;
        
        const events = [];
        
        if (birthday && isSameDate(birthday, today)) {
          events.push({ type: 'birthday', date: 'Today', dateObj: birthday });
        }
        if (birthday && isSameDate(birthday, tomorrow)) {
          events.push({ type: 'birthday', date: 'Tomorrow', dateObj: birthday });
        }
        if (anniversary && isSameDate(anniversary, today)) {
          events.push({ type: 'anniversary', date: 'Today', dateObj: anniversary });
        }
        if (anniversary && isSameDate(anniversary, tomorrow)) {
          events.push({ type: 'anniversary', date: 'Tomorrow', dateObj: anniversary });
        }
        
        return {
          ...customer,
          events
        };
      });

      setCustomers(customersWithEventInfo);
    } catch (err) {
      console.error('Error fetching customers:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const restaurantId = localStorage.getItem('restaurantId');
      
      if (!token || !restaurantId) return;

      const response = await axios.get(`${BASE_URL}/api/low-stock/items`, {
        params: { restaurantId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const lowStockData = response.data?.data || {};
      const items = lowStockData.items || [];
      const threshold = lowStockData.threshold || 10;
      
      setLowStockItems(items);
      setLowStockThreshold(threshold);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      // Don't set error for low stock, just log it
    }
  };

  // Update total count whenever customers or lowStockItems change
  useEffect(() => {
    if (onCountChange && !loading) {
      const totalCount = customers.length + lowStockItems.length;
      onCountChange(totalCount);
    }
  }, [customers.length, lowStockItems.length, onCountChange, loading]);

  const isSameDate = (date1, date2) => {
    return date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEventIcon = (eventType) => {
    return eventType === 'birthday' ? '🎂' : '💍';
  };

  const getEventColor = (eventType) => {
    return eventType === 'birthday' ? 'success' : 'info';
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg" scrollable>
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilCalendar} className="me-2" />
          Notifications
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
            <div className="mt-2">Loading notifications...</div>
          </div>
        ) : error ? (
          <CAlert color="danger">
            <strong>Error:</strong> {error}
          </CAlert>
        ) : (
          <div>
            {/* Customer Events Section */}
            {customers.length > 0 && (
              <div className="mb-4">
            <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <CIcon icon={cilCalendar} className="me-2" />
                    Upcoming Customer Events ({customers.length})
                  </strong>
            </div>
            <CListGroup>
              {customers.map((customer, index) => (
                <CListGroupItem key={customer._id || index} className="d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold d-flex align-items-center">
                      <CIcon icon={cilUser} className="me-2" />
                      {customer.name}
                    </div>
                    <div className="text-muted small">
                      <div className="d-flex align-items-center mb-1">
                        <CIcon icon={cilPhone} className="me-1" size="sm" />
                        {customer.phoneNumber}
                      </div>
                      <div className="d-flex align-items-center">
                        <CIcon icon={cilEnvelopeOpen} className="me-1" size="sm" />
                        {customer.email}
                      </div>
                    </div>
                    <div className="mt-2">
                      {customer.events.map((event, eventIndex) => (
                        <CBadge 
                          key={eventIndex}
                          color={getEventColor(event.type)}
                          className="me-2"
                        >
                          {getEventIcon(event.type)} {event.type.charAt(0).toUpperCase() + event.type.slice(1)} - {event.date}
                        </CBadge>
                      ))}
                    </div>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
              </div>
            )}

            {/* Low Stock Items Section */}
            {lowStockItems.length > 0 && (
              <div className="mb-4">
                <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <CIcon icon={cilWarning} className="me-2" />
                    Low Stock Items ({lowStockItems.length})
                  </strong>
                </div>
                <CListGroup>
                  {lowStockItems.map((item, index) => {
                    const currentQuantity = item.currentQuantity || item.totalRemainingQuantity || item.stock?.quantity || item.stock?.totalQuantity || item.quantity || 0;
                    const threshold = item.threshold || lowStockThreshold || 10;
                    const unit = item.unit || '';
                    
                    return (
                      <CListGroupItem key={item._id || index} className="d-flex justify-content-between align-items-start">
                        <div className="ms-2 me-auto">
                          <div className="fw-bold d-flex align-items-center">
                            <CIcon icon={cilWarning} className="me-2 text-warning" />
                            {item.itemName}
                          </div>
                          <div className="text-muted small mt-1">
                            Current Quantity: <strong className="text-danger">{currentQuantity} {unit}</strong>
                          </div>
                          <div className="mt-2">
                            <CBadge color="warning" className="me-2">
                              ⚠️ Low Stock (Threshold: {threshold} {unit})
                            </CBadge>
                          </div>
                        </div>
                      </CListGroupItem>
                    );
                  })}
                </CListGroup>
              </div>
            )}

            {/* No Notifications Message */}
            {customers.length === 0 && lowStockItems.length === 0 && (
              <CAlert color="info">
                <strong>No Notifications:</strong> No upcoming customer events or low stock items.
              </CAlert>
            )}
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
        <CButton color="primary" onClick={() => {
          fetchCustomersWithUpcomingEvents();
          fetchLowStockItems();
        }}>
          Refresh
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default NotificationModal;
