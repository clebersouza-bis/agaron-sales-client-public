import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const userData = localStorage.getItem('userData');
    const savedTheme = localStorage.getItem('app-theme') || 'light';

    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const login = async (username, password) => {
    // --- Mock Login Logic (Intercept demo accounts) ---
    const mockUsers = {
      'admin': { id: 1, username: 'admin', name: 'Admin Demo', role: 'Admin' },
      'manager': { id: 2, username: 'manager', name: 'Manager Demo', role: 'Manager' },
      'salesuser': { id: 3, username: 'salesuser', name: 'Sales Demo', role: 'Sales' }
    };

    const isDemoPassword = password === 'admin123' || password === 'manager123' || password === 'sales123' || password === 'admin' || password === 'manager' || password === 'salesuser';

    if (mockUsers[username] && isDemoPassword) {
      console.log('Using mock login for', username);
      const userData = mockUsers[username];
      const token = 'mock-jwt-token-' + Math.random().toString(36).substring(7);
      
      localStorage.setItem('jwt', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    }
    // ---------------------------------------------------

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('jwt', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userData');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isAdmin = () => hasRole('Admin');
  const isManager = () => hasRole('Manager');
  const isSales = () => hasRole('Sales');
  const isAdminOrManager = () => isAdmin() || isManager();

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin,
    isManager,
    isSales,
    isAdminOrManager,
    theme,
    toggleTheme
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};