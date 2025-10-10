import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import Page404 from '../views/pages/page404/Page404';

const PermissionGuard = ({ children, requiredPermissions = [], fallbackPath = null }) => {
  const { role, user } = useSelector((state) => ({
    role: state.auth.role,
    user: state.auth.user
  }));

  // Debug logging
  console.log('🔍 PermissionGuard Debug:', {
    role,
    user,
    requiredPermissions,
    userPermissions: user?.permissions
  });

  // अगर user data अभी भी load हो रहा है तो loading show करें
  if (!user || !role) {
    console.log('⏳ Loading user data...');
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
        <div className="mt-2">Loading permissions...</div>
      </div>
    );
  }

  // अगर role admin है तो सभी pages allow हैं
  if (role === 'admin') {
    console.log('✅ Admin access granted');
    return children;
  }

  // अगर required permissions नहीं दिए गए हैं तो allow करें
  if (!requiredPermissions || requiredPermissions.length === 0) {
    console.log('✅ No required permissions, allowing access');
    return children;
  }

  // Check localStorage for permissions if user.permissions is empty
  let userPermissions = user?.permissions || [];
  if (userPermissions.length === 0) {
    try {
      const storedPermissions = localStorage.getItem('userPermissions');
      if (storedPermissions) {
        userPermissions = JSON.parse(storedPermissions);
        console.log('📦 Loaded permissions from localStorage:', userPermissions);
      }
    } catch (error) {
      console.error('Error parsing permissions from localStorage:', error);
    }
  }

  // अगर अभी भी permissions नहीं हैं
  if (!userPermissions || userPermissions.length === 0) {
    console.log('❌ No user permissions found in user object or localStorage');
    return fallbackPath ? <Navigate to={fallbackPath} replace /> : <Page404 />;
  }

  // Check करें कि user के पास सभी required permissions हैं या नहीं
  const hasPermission = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );

  console.log('🔍 Permission check:', {
    requiredPermissions,
    userPermissions,
    hasPermission,
    role,
    userRole: user?.role
  });

  if (!hasPermission) {
    console.log('❌ Permission denied');
    return fallbackPath ? <Navigate to={fallbackPath} replace /> : <Page404 />;
  }

  console.log('✅ Permission granted');

  return children;
};

export default PermissionGuard;
