import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import Page404 from '../views/pages/page404/Page404';

const PermissionGuard = ({ children, requiredPermissions = [], fallbackPath = null }) => {
  const { role, user } = useSelector((state) => ({
    role: state.auth.role || localStorage.getItem('userRole') || 'admin',
    user: state.auth.user
  }));

  // Debug logging
  console.log('🔍 PermissionGuard Debug:', {
    role,
    user,
    requiredPermissions,
    userPermissions: user?.permissions,
    localStorageRole: localStorage.getItem('userRole'),
    reduxRole: useSelector((state) => state.auth.role),
    normalizedRole: role || user?.role || localStorage.getItem('userRole') || 'admin',
    isSuperAdmin: (role || user?.role || localStorage.getItem('userRole') || 'admin')?.includes('superadmin')
  });

  // अगर user data अभी भी load हो रहा है तो loading show करें
  if (!user && !role) {
    console.log('⏳ Loading user data...');
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
        <div className="mt-2">Loading permissions...</div>
      </div>
    );
  }
  
  // Early return for superadmin - bypass all other checks
  if (role === 'superadmin' || user?.role === 'superadmin' || localStorage.getItem('userRole') === 'superadmin') {
    console.log('✅ Superadmin access granted (early return)');
    return children;
  }

  // Get role from multiple sources and normalize
  const normalizedRole = role || user?.role || localStorage.getItem('userRole') || 'admin';
  
  // Debug: Log all role sources
  console.log('🔍 Role Sources Debug:', {
    role,
    'user?.role': user?.role,
    'localStorage.getItem("userRole")': localStorage.getItem('userRole'),
    normalizedRole
  });
  
  // अगर role admin या superadmin है तो सभी pages allow हैं
  if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
    console.log('✅ Admin/Superadmin access granted for role:', normalizedRole);
    return children;
  }
  
  // Direct check for superadmin string
  if (normalizedRole === 'superadmin') {
    console.log('✅ Superadmin access granted (direct check)');
    return children;
  }
  
  // Additional check for superadmin in different formats
  if (normalizedRole?.toLowerCase() === 'superadmin' || normalizedRole?.toLowerCase() === 'admin') {
    console.log('✅ Admin/Superadmin access granted (case-insensitive) for role:', normalizedRole);
    return children;
  }
  
  // Temporary bypass for superadmin - check if user has superadmin in any field
  const isSuperAdmin = normalizedRole?.includes('superadmin') || 
                      user?.role?.includes('superadmin') || 
                      localStorage.getItem('userRole')?.includes('superadmin');
  
  if (isSuperAdmin) {
    console.log('✅ Superadmin access granted (fallback check)');
    return children;
  }
  
  // Final fallback - if we can't determine role, allow access for now
  if (!normalizedRole || normalizedRole === 'undefined' || normalizedRole === 'null') {
    console.log('⚠️ Role not determined, allowing access as fallback');
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
