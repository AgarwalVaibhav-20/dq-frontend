import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { CBadge, CNavLink, CSidebarNav, CTooltip } from '@coreui/react';
import { useSelector } from 'react-redux';
import { shallowEqual } from 'react-redux';

export const AppSidebarNav = ({ items }) => {
  const { restaurantPermission } = useSelector(
    (state) => ({ restaurantPermission: state.restaurantProfile.restaurantPermission }),
    shallowEqual
  );
  const navigate = useNavigate();

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
      {items &&
        items.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index)
        )}
    </CSidebarNav>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};