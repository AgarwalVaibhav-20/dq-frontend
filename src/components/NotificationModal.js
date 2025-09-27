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
import { cilCalendar, cilUser, cilPhone, cilEnvelopeOpen } from '@coreui/icons';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';

const NotificationModal = ({ visible, onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchCustomersWithUpcomingEvents();
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

      const allCustomers = response.data;
      
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
      setError('Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

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
          Upcoming Customer Events
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
            <div className="mt-2">Loading customer events...</div>
          </div>
        ) : error ? (
          <CAlert color="danger">
            <strong>Error:</strong> {error}
          </CAlert>
        ) : customers.length === 0 ? (
          <CAlert color="info">
            <strong>No Events:</strong> No customers have birthdays or anniversaries today or tomorrow.
          </CAlert>
        ) : (
          <div>
            <div className="mb-3">
              <strong>Found {customers.length} customer(s) with upcoming events:</strong>
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
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
        <CButton color="primary" onClick={fetchCustomersWithUpcomingEvents}>
          Refresh
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default NotificationModal;
