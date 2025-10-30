// Token validation and management utilities

/**
 * Check if a JWT token is valid (not expired)
 * @param {string} token - JWT token to validate
 * @returns {boolean} - True if token is valid, false otherwise
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decode JWT token (without verification for client-side check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Get token from localStorage and validate it
 * @returns {string|null} - Valid token or null
 */
export const getValidToken = () => {
  const token = localStorage.getItem('authToken');
  return isTokenValid(token) ? token : null;
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('restaurantId');
  localStorage.removeItem('categoryId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userPermissions');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('username');
  // Ensure sessionStarted is also removed (not just set false)
  localStorage.removeItem('sessionStarted');
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return getValidToken() !== null;
};

/**
 * Get user data from localStorage
 * @returns {object} - User data object
 */
export const getUserData = () => {
  return {
    id: localStorage.getItem('userId'),
    name: localStorage.getItem('userName'),
    email: localStorage.getItem('userEmail'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole'),
    permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]'),
    restaurantId: localStorage.getItem('restaurantId'),
    categoryId: localStorage.getItem('categoryId'),
  };
};
