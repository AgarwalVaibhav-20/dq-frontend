import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { CBadge, CNavLink, CSidebarNav, CTooltip } from '@coreui/react';
import { useSelector, useDispatch } from 'react-redux';
import { shallowEqual } from 'react-redux';
import { refreshUserRole } from '../redux/slices/authSlice';

export const AppSidebarNav = ({ items }) => {
  const { restaurantPermission, userRole, userPermissions } = useSelector(
    (state) => ({ 
      restaurantPermission: state.restaurantProfile.restaurantPermission,
      userRole: state.auth.role || localStorage.getItem('userRole') || 'admin',
      userPermissions: state.auth.user?.permissions || JSON.parse(localStorage.getItem('userPermissions') || '[]')
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();


  // Auto-refresh role on component mount
  useEffect(() => {
    const autoRefreshRole = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          await dispatch(refreshUserRole({ userId }));
        }
      } catch (error) {
        console.error(error)
        // console.log('Auto-refresh role failed:', error);
      }
    };
    
    autoRefreshRole();
  }, [dispatch]);

  // Filter navigation items based on user permissions
  const filterItemsByPermissions = (items) => {
    return items.filter(item => {
      // Admin always sees everything
      if (userRole === 'admin') return true;
      
      // For non-admin users, check if they have permission for this item
      if (userPermissions && Array.isArray(userPermissions) && userPermissions.length > 0) {
        // Check if the item name is in the permissions array
        return userPermissions.includes(item.name);
      }
      
      // If no permissions are set, show nothing (don't fall back to role-based filtering)
      return false;
    }).map(item => {
      // Recursively filter nested items
      if (item.items) {
        const filteredSubItems = filterItemsByPermissions(item.items);
        // Only include the group if it has at least one visible item
        return filteredSubItems.length > 0 ? {
          ...item,
          items: filteredSubItems
        } : null;
      }
      return item;
    }).filter(item => item !== null); // Remove null items
  };

  // Filter navigation items based on user permissions
  const filteredItems = filterItemsByPermissions(items);

  // Debug logging
  // console.log('User role:', userRole);
  // console.log('Filtered items count:', filteredItems.length);
  // console.log('All items count:', items.length);

  const navLink = (name, icon, badge, indent = false, disabled = false) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
              <span className="nav-icon">
                <span className="nav-icon-bullet"></span>
              </span>
            )}
        <span style={disabled ? { opacity: 0.5 } : {}}>
          {name && name}
        </span>
        {badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </>
    );
  };

  const handleDisabledClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, to, ...rest } = item;
    const Component = component;
    const isDisabled = restaurantPermission?.permission === 0 && to !== '/orders';

    return (
      <Component as="div" key={index}>
        {to || rest.href ? (
          <CTooltip
            content={isDisabled ? "Access restricted. Contact support." : ""}
            placement="right"
          >
            <div>
              <CNavLink
                {...(to && { as: NavLink, to: isDisabled ? '#' : to })}
                {...(rest.href && { target: '_blank', rel: 'noopener noreferrer' })}
                style={isDisabled ? { 
                  cursor: 'not-allowed', 
                  opacity: 0.5,
                  pointerEvents: 'none' 
                } : {}}
                onClick={isDisabled ? handleDisabledClick : undefined}
                {...rest}
              >
                {navLink(name, icon, badge, indent, isDisabled)}
              </CNavLink>
            </div>
          </CTooltip>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    );
  };

  const navGroup = (item, index) => {
    const { component, name, icon, items, to, ...rest } = item;
    const Component = component;
    const isDisabled = restaurantPermission?.permission === 0;

    return (
      <Component
        compact
        as="div"
        key={index}
        toggler={navLink(name, icon, undefined, false, isDisabled)}
        style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        onClick={isDisabled ? handleDisabledClick : undefined}
        {...rest}
      >
        {items?.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index, true)
        )}
      </Component>
    );
  };

  return (
    <CSidebarNav as={SimpleBar}>
      {filteredItems &&
        filteredItems.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index)
        )}
    </CSidebarNav>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};