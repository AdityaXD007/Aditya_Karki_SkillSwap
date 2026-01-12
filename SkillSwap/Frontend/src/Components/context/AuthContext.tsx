import React, { createContext, useState, useContext, useEffect } from 'react';

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
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  bio: 'Full-stack developer passionate about teaching web development and learning design.',
  skillsTeaching: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
  skillsLearning: ['UI/UX Design', 'Figma', 'Product Management'],
  rating: 4.8,
  availability: ['Monday 6pm-8pm', 'Wednesday 7pm-9pm', 'Saturday 10am-2pm']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function - mocked for demo
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (email && password) {
      const userData = { ...mockUser, email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error('Invalid credentials');
    }
    setLoading(false);
  };

  // Signup function - mocked for demo
  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      ...mockUser,
      id: Date.now().toString(),
      email,
      name,
      skillsTeaching: [],
      skillsLearning: [],
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    setLoading(false);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
