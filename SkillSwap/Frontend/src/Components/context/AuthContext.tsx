import type { ReactNode } from "react";
import { createContext, useState, useEffect } from "react";
import { authAPI } from "../../services/api";

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role?: "user" | "admin";
  skillsTeaching?: string[];
  skillsLearning?: string[];
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  clearError: () => void;
}

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("auth_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function - calls Django backend
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Django expects username, not email - but we'll use email as username
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      setUser(user);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function - calls Django backend
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(email, email, password, password);
      const { token, user } = response.data;

      setUser(user);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Signup failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - calls Django backend
  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
