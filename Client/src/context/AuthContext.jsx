import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthData, getAuthData, clearAuthData, handleAuthCallback } from '../utils/auth.util';
import { authAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for storage changes (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'logout') {
        // Another tab logged out
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const authData = getAuthData();
      
      if (authData.isAuthenticated && authData.token) {
        // Set cached user first for immediate load
        if (authData.user) {
          setUser(authData.user);
        }
        setIsAuthenticated(true);

        // Added by Qaisar: Fetch fresh profile in the background to get updated roles/modules
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            setAuthData(authData.token, response.data);
            setUser(response.data);
          }
        } catch (profileError) {
          console.error('Failed to fetch fresh profile:', profileError);
        }

      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback((token, userData, redirectPath = null) => {
    try {
      setAuthData(token, userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Redirect to intended page or dashboard
      const intendedPath = location.state?.from?.pathname || redirectPath || '/dashboard';
      navigate(intendedPath, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [navigate, location.state]);

  // Logout function
  const logout = useCallback(() => {
    try {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      
      // Notify other tabs
      localStorage.setItem('logout', Date.now().toString());
      setTimeout(() => localStorage.removeItem('logout'), 100);
      
      // Redirect to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [navigate]);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(() => {
    const authResult = handleAuthCallback();
    
    if (authResult) {
      if (authResult.success) {
        // Get auth data after callback
        const authData = getAuthData();
        if (authData.isAuthenticated) {
          login(authData.token, authData.user);
        }
        return { success: true, message: 'Login successful! Welcome to AI Audio Doctor.' };
      } else {
        return { success: false, error: authResult.error };
      }
    }
    return null;
  }, [login]);

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthStatus,
    handleOAuthCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
