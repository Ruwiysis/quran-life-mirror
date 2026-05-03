import React, { createContext, useState, useEffect } from 'react';

/**
 * AuthContext - manages user authentication state
 * Stores tokens in localStorage for persistence
 * Provides: isLoggedIn, user, token, login(), logout(), setToken()
 */

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('qf_access_token');
    const storedRefreshToken = localStorage.getItem('qf_refresh_token');
    const storedUser = localStorage.getItem('qf_user');

    if (storedToken) {
      setTokenState(storedToken);
      setRefreshToken(storedRefreshToken);
      setIsLoggedIn(true);
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.log('Could not parse stored user', e);
        }
      }
    }
    
    setLoading(false);
  }, []);

  const setToken = (accessToken, refresh_token = null, userData = null) => {
    /**
     * Set authentication tokens and user data
     */
    setTokenState(accessToken);
    setRefreshToken(refresh_token);
    setIsLoggedIn(!!accessToken);

    // Store in localStorage
    if (accessToken) {
      localStorage.setItem('qf_access_token', accessToken);
      if (refresh_token) {
        localStorage.setItem('qf_refresh_token', refresh_token);
      }
    } else {
      localStorage.removeItem('qf_access_token');
      localStorage.removeItem('qf_refresh_token');
    }

    // Store user data
    if (userData) {
      setUser(userData);
      localStorage.setItem('qf_user', JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem('qf_user');
    }
  };

  const login = async (authCode) => {
    /**
     * Login: exchange OAuth2 code for tokens
     * authCode comes from QF OAuth2 callback
     */
    try {
      const response = await fetch((process.env.REACT_APP_API_URL || '') + '/api/auth/callback?code=' + authCode);
      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData = {
        user_id: data.user_id,
        email: data.email,
      };

      setToken(data.access_token, data.refresh_token, userData);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    /**
     * Logout: clear all auth state
     */
    setToken(null);
    setUser(null);
  };

  const refreshAccessToken = async () => {
    /**
     * Refresh expired access token using refresh_token
     */
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await fetch((process.env.REACT_APP_API_URL || '') + '/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      setToken(data.access_token, data.refresh_token || refreshToken);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  };

  const value = {
    isLoggedIn,
    user,
    token,
    loading,
    setToken,
    login,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
