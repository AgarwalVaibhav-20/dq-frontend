import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const SessionGuard = ({ children }) => {
  const sessionStarted = useSelector(state => state.auth.sessionStarted);
  const location = useLocation();
  
  // Allow access to login-activity page even without session
  if (location.pathname === '/login-activity') {
    return children;
  }
  
  // Redirect to login-activity if session not started
  if (!sessionStarted) {
    return <Navigate to="/login-activity" replace />;
  }
  
  return children;
};

export default SessionGuard;
