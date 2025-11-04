import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
  cilUserFollow,
} from '@coreui/icons';

import { AppBreadcrumb } from './index';
import { AppHeaderDropdown } from './header/index';
import { toggleSidebar } from '../redux/slices/sidebarSlice';
import NotificationModal from './NotificationModal';
import InvitationNotification from './InvitationNotification';
import { BASE_URL } from '../utils/constants';

const AppHeader = () => {
  const headerRef = useRef();
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [invitationModalVisible, setInvitationModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const dispatch = useDispatch();
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow);
  const location = useLocation();

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0);
    });
  }, []);

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleNotificationClick = () => {
    setNotificationModalVisible(true);
  };

  const handleInvitationClick = () => {
    setInvitationModalVisible(true);
  };

  const handleNotificationModalClose = () => {
    setNotificationModalVisible(false);
  };

  const handleInvitationModalClose = () => {
    setInvitationModalVisible(false);
  };

  const handleNotificationCountChange = (count) => {
    setNotificationCount(count);
  };

  // Fetch notification count on mount and periodically
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const restaurantId = localStorage.getItem('restaurantId');
        
        if (!token || !restaurantId) return;

        // Fetch customer events
        const customerResponse = await fetch(`${BASE_URL}/customer/${restaurantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let customerCount = 0;
        if (customerResponse.ok) {
          const data = await customerResponse.json();
          const allCustomers = data?.data || data || [];
          
          // Filter customers with birthdays or anniversaries today or tomorrow
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const isSameDate = (date1, date2) => {
            return date1.getMonth() === date2.getMonth() && 
                   date1.getDate() === date2.getDate();
          };

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

          customerCount = upcomingCustomers.length;
        }

        // Fetch low stock items
        let lowStockCount = 0;
        try {
          const stockResponse = await fetch(`${BASE_URL}/api/low-stock/items?restaurantId=${restaurantId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            const lowStockData = stockData?.data || {};
            lowStockCount = lowStockData.items?.length || 0;
          }
        } catch (stockError) {
          console.error('Error fetching low stock count:', stockError);
          // Don't fail the entire notification count if low stock fails
        }

        // Set total count (customers + low stock items)
        setNotificationCount(customerCount + lowStockCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    // Fetch immediately
    fetchNotificationCount();

    // Fetch every 5 minutes
    const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={handleSidebarToggle}  // Fix for sidebar toggle
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex">
          <CNavItem>
            <CNavLink to="/dashboard" as={NavLink}>
              Dashboard
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink to="/permission" as={NavLink}>
              Users
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink to="/setting" as={NavLink}>
              Settings
            </CNavLink>
            </CNavItem>
          </CHeaderNav>
        <CHeaderNav className="ms-auto">
          <CNavItem>
            <CNavLink href="#" onClick={handleNotificationClick} style={{ cursor: 'pointer', position: 'relative' }}>
              <CIcon icon={cilBell} size="lg" />
              {notificationCount > 0 && (
                <CBadge 
                  color="danger" 
                  shape="rounded-pill" 
                  style={{ 
                    position: 'absolute', 
                    top: '-5px', 
                    right: '-5px',
                    fontSize: '0.7rem',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px'
                  }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </CBadge>
              )}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#" onClick={handleInvitationClick} style={{ cursor: 'pointer', position: 'relative' }}>
              <CIcon icon={cilUserFollow} size="lg" />
              {/* Invitation notifications */}
            </CNavLink>
          </CNavItem>
          {/* Three lines icon - hidden as per user request */}
          {/* <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilList} size="lg" />
            </CNavLink>
          </CNavItem> */}
          {/* Message/envelope icon - hidden as per user request */}
          {/* <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilEnvelopeOpen} size="lg" />
            </CNavLink>
          </CNavItem> */}
        </CHeaderNav>
        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <CDropdown variant="nav-item" placement="bottom-end" popperconfig={{ modifiers: [{ name: 'offset', options: { offset: [0, 10] } }] }}>
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      {/* <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer> */}
      
      {/* Notification Modal */}
      <NotificationModal 
        visible={notificationModalVisible} 
        onClose={handleNotificationModalClose} 
        onCountChange={handleNotificationCountChange}
      />
      
      {/* Invitation Notification Modal */}
      <InvitationNotification 
        visible={invitationModalVisible} 
        onClose={handleInvitationModalClose} 
      />
    </CHeader>
  );
};

export default AppHeader;