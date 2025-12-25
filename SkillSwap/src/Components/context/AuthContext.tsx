import type { ReactNode } from "react";
import { createContext, useState, useEffect } from "react";

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  skillsTeaching: string[];
  skillsLearning: string[];
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Mock user for demo purposes
const mockUser: User = {
  id: "1",
  email: "demo@skillexchange.com",
  name: "Demo User",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  role: "user",
  skillsTeaching: ["React", "TypeScript", "Node.js"],
  skillsLearning: ["Python", "Machine Learning", "UI Design"],
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function - mock implementation
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo: any email/password works
    const loggedInUser = { ...mockUser, email };
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setIsLoading(false);
  };

  // Signup function - mock implementation
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser = { ...mockUser, email, name, id: Date.now().toString() };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    setIsLoading(false);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
