import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CCloseButton,
} from '@coreui/react';
import { AppSidebarNav } from './AppSidebarNav';
import DQLogo from '../assets/brand/logo-dark.png';
import { toggleUnfoldable, setSidebarShow } from '../redux/slices/sidebarSlice';
import navigation from '../_nav';

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow);
  const handleSidebarToggle = () => {
    dispatch(setSidebarShow(!sidebarShow)); // Toggle sidebar state
  };

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={false}
      visible={sidebarShow} // Controlled by Redux state
      onVisibleChange={(visible) => dispatch(setSidebarShow(visible))} // Sync visibility with Redux
      style={{ 
        '--cui-sidebar-width': '256px',
        '--cui-sidebar-bg': '#2c3e50',
        '--cui-sidebar-nav-link-hover-bg': 'rgba(255, 255, 255, 0.1)',
        '--cui-sidebar-nav-link-hover-color': '#ffffff'
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <div className="d-flex align-items-center justify-content-center">
            <img
              src={DQLogo}
              alt="Brand Logo"
              className="sidebar-brand-full"
              style={{ height: '40px', marginRight: '8px' }}
            />
            <h3 className="text-white m-0">DQ</h3>
          </div>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={handleSidebarToggle} // Close on small screens
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
