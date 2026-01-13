import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '@/services/api';

// Define User interface
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  skillsTeaching: string[];
  skillsLearning: string[];
  rating: number;
  availability?: string[];
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user and token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        // Optionally verify token with profile call
        try {
          const response = await authAPI.getProfile();
          const userData = response.data;
          
          const mappedUser: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name || userData.username,
            skillsTeaching: [], // Default as backend doesn't have these yet
            skillsLearning: [],
            rating: 5.0,
          };
          
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
        } catch (error) {
          console.error("Token verification failed", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token } = response.data;
      
      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.email,
        name: userData.name || userData.username,
        skillsTeaching: [],
        skillsLearning: [],
        rating: 5.0,
      };

      setUser(mappedUser);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.register(email, password, name);
      const { user: userData, token } = response.data;
      
      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.email,
        name: userData.name || userData.username,
        skillsTeaching: [],
        skillsLearning: [],
        rating: 5.0,
      };
      
      setUser(mappedUser);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
    } catch (error: any) {
      const errorMsg = error.response?.data?.email?.[0] || 
                       error.response?.data?.password?.[0] || 
                       'Failed to create account';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    }
  };

  // Update user profile
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateUser
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
