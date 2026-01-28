'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../types/user';
import apiClient from '../../lib/apiClient';
import { getCookie } from 'cookies-next';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        const token = getCookie('access_token');
        
        if (token) {
          // Fetch user profile from API
          const response = await apiClient.get('/auth/profile');
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Call your actual login API
      const response = await apiClient.post('/auth/login', { email, password });
      
      // The apiClient already handles setting the access_token cookie
      // Now fetch the user profile
      const profileResponse = await apiClient.get('/auth/profile');
      setUser(profileResponse.data.data);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (clears refresh token on server)
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // The apiClient logout function handles cookie clearing and redirect
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}