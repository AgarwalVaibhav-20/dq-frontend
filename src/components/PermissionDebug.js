import React from 'react';
import { useSelector } from 'react-redux';

const PermissionDebug = () => {
  const { role, user } = useSelector((state) => ({
    role: state.auth.role,
    user: state.auth.user
  }));

  const storedPermissions = localStorage.getItem('userPermissions');
  const parsedPermissions = storedPermissions ? JSON.parse(storedPermissions) : [];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', margin: '20px', borderRadius: '8px' }}>
      <h3>🔍 Permission Debug Info</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Role:</strong> {role || 'Not set'}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>User Object:</strong>
        <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>User Permissions (from Redux):</strong>
        <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(user?.permissions || [], null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Stored Permissions (from localStorage):</strong>
        <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(parsedPermissions, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>localStorage Keys:</strong>
        <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(Object.keys(localStorage), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PermissionDebug;
