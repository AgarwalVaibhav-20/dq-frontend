// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const authToken = localStorage.getItem('authToken'); // Check token in localStorage

  if (!authToken) {
    return <Navigate to="/login" replace />; // Redirect unauthenticated users
  }

  return children || <Outlet />; // Render protected routes
};

export default PrivateRoute;
