// src/components/PrivateRoute.js
import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { syncLocalStorage } from '../redux/slices/authSlice';
import { isAuthenticated, getValidToken } from '../utils/tokenUtils';

const PrivateRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  
  // Sync localStorage with Redux state on component mount
  useEffect(() => {
    dispatch(syncLocalStorage());
  }, [dispatch]);

  // Check authentication using both Redux state and localStorage
  const isAuth = isAuthenticated();
  const validToken = getValidToken();
  const authToken = token || validToken;

  if (!isAuth || !authToken) {
    return <Navigate to="/login" replace />; // Redirect unauthenticated users
  }

  return children || <Outlet />; // Render protected routes
};

export default PrivateRoute;
