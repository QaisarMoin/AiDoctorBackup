// Frontend Authentication Utilities

// Store auth data in localStorage
export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Get auth data from localStorage
export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return {
    token,
    user: user ? JSON.parse(user) : null,
    isAuthenticated: !!token
  };
};

// Clear auth data from localStorage
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const { token } = getAuthData();
  return !!token;
};

// Get current user
export const getCurrentUser = () => {
  const { user } = getAuthData();
  return user;
};

// Setup axios interceptor for API calls
export const setupAuthInterceptor = (axiosInstance) => {
  // Request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config) => {
      const { token } = getAuthData();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle auth errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Added by Qaisar: Prevent redirect loop when submitting wrong credentials on the login page
        clearAuthData();
        
        // Only redirect to login if we are not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// Handle Google OAuth callback
export const handleAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('success');
  const token = params.get('token');
  const user = params.get('user');
  const error = params.get('error');

  if (success === 'true' && token && user) {
    try {
      // Store auth data
      setAuthData(token, JSON.parse(decodeURIComponent(user)));
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return {
        success: true,
        message: 'Login successful!'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Failed to process authentication data'
      };
    }
  } else if (error) {
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return {
      success: false,
      error: decodeURIComponent(error)
    };
  }

  return null; // No auth callback present
};

// Logout function
export const logout = async () => {
  try {
    // Call backend logout endpoint (optional)
    const { token } = getAuthData();
    if (token) {
      await fetch('https://aidoctorassist.dentalguru.software/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local data
    clearAuthData();
    // Redirect to login
    window.location.href = '/login';
  }
};

// Protected route component (for React Router)
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }
  
  return children;
};
