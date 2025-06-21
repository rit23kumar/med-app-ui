import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isAuthenticatedInSession = sessionStorage.getItem('isAuthenticated');
    
    // If there's no session authentication flag but we have stored user data,
    // it means another tab logged out, so we should clear this session too
    if (!isAuthenticatedInSession && storedUser) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      return;
    }
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('activeTab');
        sessionStorage.removeItem('tabClosing');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      
      // Check if this is an error response
      if (response.code === 'USER_DISABLED') {
        throw new Error(response.message || 'User is disabled');
      }

      // Ensure all required fields are present
      if (!response.token || !response.username || !response.fullName || !response.role) {
        throw new Error('Invalid response from server: Missing required user data');
      }

      const { token, username: user, fullName, role, id } = response;
      
      // Create a user object
      const userObj = { id, username: user, fullName, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      sessionStorage.setItem('isAuthenticated', 'true');
      
      setToken(token);
      setUser(userObj);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear all session storage related to authentication and tabs
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('activeTab');
    sessionStorage.removeItem('tabClosing');
    
    // Clear any tab-specific storage items
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('tab_') && (key.includes('_active') || key.includes('_heartbeat'))) {
        sessionStorage.removeItem(key);
      }
    });
    
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 