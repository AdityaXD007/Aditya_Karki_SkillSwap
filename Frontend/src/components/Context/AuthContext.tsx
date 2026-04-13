import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI, skillsAPI } from "@/services";
import { getMediaUrl } from "@/services";

// Define User interface
export interface UserSkillInfo {
  id: number;
  skill_id: number;
  name: string;
  type: "TEACH" | "LEARN";
  proficiency: string;
  category: string;
  icon_class?: string;
  color_class?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  skillsTeaching: string[];
  skillsLearning: string[];
  userSkills: UserSkillInfo[];
  rating: number;
  availability?: string[];
  sessionsTaughtCount: number;
  sessionsLearnedCount: number;
  canCharge: boolean;
  hourlyRate: number;
  emailNotificationsEnabled: boolean;
  isOnboarded: boolean;
  isEmailVerified: boolean;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  signup: (registrationData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUserSkills: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user and token on mount
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if tokens are in the URL (from GitHub/Social redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      const urlRefresh = urlParams.get("refresh");

      if (urlToken && window.location.pathname !== '/reset-password') {
        localStorage.setItem("auth_token", urlToken);
        if (urlRefresh) localStorage.setItem("refresh_token", urlRefresh);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("auth_token");

      if (token) {
        // Parse the stored user if it exists
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.avatar) parsed.avatar = getMediaUrl(parsed.avatar);
          setUser(parsed);
        }
        try {
          const response = await authAPI.getProfile();
          const userData = response.data;

          const mappedUser: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.full_name || userData.username,
            username: userData.username,
            avatar:
              userData.profile_image ? getMediaUrl(userData.profile_image) : undefined,
            bio: userData.bio,
            location: userData.location,
            skillsTeaching: [],
            skillsLearning: [],
            userSkills: [],
            rating: 5.0,
            availability: userData.availability
              ? userData.availability.split(",").filter(Boolean)
              : [],
            sessionsTaughtCount: userData.sessions_taught_count || 0,
            sessionsLearnedCount: userData.sessions_learned_count || 0,
            canCharge: userData.can_charge || false,
            hourlyRate: parseFloat(userData.hourly_rate?.toString() || "0"),
            emailNotificationsEnabled: userData.email_notifications_enabled !== false,
            isOnboarded: !!userData.is_onboarded,
            isEmailVerified: !!userData.is_email_verified,
          };

          setUser(mappedUser);
          localStorage.setItem("user", JSON.stringify(mappedUser));

          // Fetch skills after user is set
          await refreshUserSkills();
        } catch (error) {
          console.error("Token verification failed", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshUserSkills = async () => {
    try {
      const response = await skillsAPI.getUserSkills();
      const skills = response.data;

      setUser((prev) => {
        if (!prev) return null;
        const userSkills: UserSkillInfo[] = skills.map((s: any) => ({
          id: s.id,
          skill_id: s.skill_id,
          name: s.skill_details?.name || "Unknown Skill",
          type: s.skill_type,
          proficiency: s.proficiency_level,
          category: s.skill_details?.category || "",
          icon_class: s.skill_details?.icon_class || "",
          color_class: s.skill_details?.color_class || "",
        }));

        const skillsTeaching = userSkills
          .filter((s) => s.type === "TEACH")
          .map((s) => s.name);
        const skillsLearning = userSkills
          .filter((s) => s.type === "LEARN")
          .map((s) => s.name);

        const updated = { ...prev, userSkills, skillsTeaching, skillsLearning };
        // We don't overwrite user profile fields here, only skills
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Failed to fetch user skills", error);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      // The login response gives basic User info, but we likely want the full profile
      // For now we can map what we have, or fetch profile immediately
      const token = response.data.token;
      localStorage.setItem("auth_token", token);

      // Fetch full profile details
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;

      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.email,
        name: userData.full_name || userData.username,
        username: userData.username,
        avatar: userData.profile_image ? getMediaUrl(userData.profile_image) : undefined,
        bio: userData.bio,
        location: userData.location,
        skillsTeaching: [],
        skillsLearning: [],
        userSkills: [],
        rating: 5.0,
        sessionsTaughtCount: userData.sessions_taught_count || 0,
        sessionsLearnedCount: userData.sessions_learned_count || 0,
        canCharge: userData.can_charge || false,
        hourlyRate: parseFloat(userData.hourly_rate?.toString() || "0"),
        availability: userData.availability
          ? userData.availability.split(",").filter(Boolean)
          : [],
        emailNotificationsEnabled: userData.email_notifications_enabled !== false,
        isOnboarded: !!userData.is_onboarded,
        isEmailVerified: !!userData.is_email_verified,
      };

      setUser(mappedUser);
      localStorage.setItem("user", JSON.stringify(mappedUser));
      await refreshUserSkills();
    } catch (error: any) {
      console.error("Login Error Details:", error.response?.data);
      if (!error.response) {
          throw new Error("Cannot connect to server. Check if your backend is running.");
      }
      
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        const err: any = new Error(error.response.data.error);
        err.code = "EMAIL_NOT_VERIFIED";
        throw err;
      }
      
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.email?.[0] || 
                       error.response?.data?.password?.[0] || 
                       "Invalid credentials";
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Google Login function
  const loginWithGoogle = async (googleToken: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authAPI.googleLogin(googleToken);
      const token = response.data.token;
      localStorage.setItem("auth_token", token);

      // Fetch full profile details
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;

      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.email,
        name: userData.full_name || userData.username,
        username: userData.username,
        avatar: userData.profile_image ? getMediaUrl(userData.profile_image) : undefined,
        bio: userData.bio,
        location: userData.location,
        skillsTeaching: [],
        skillsLearning: [],
        userSkills: [],
        rating: 5.0,
        sessionsTaughtCount: userData.sessions_taught_count || 0,
        sessionsLearnedCount: userData.sessions_learned_count || 0,
        canCharge: userData.can_charge || false,
        hourlyRate: parseFloat(userData.hourly_rate?.toString() || "0"),
        availability: userData.availability
          ? userData.availability.split(",").filter(Boolean)
          : [],
        emailNotificationsEnabled: userData.email_notifications_enabled !== false,
        isOnboarded: !!userData.is_onboarded,
        isEmailVerified: !!userData.is_email_verified,
      };

      setUser(mappedUser);
      localStorage.setItem("user", JSON.stringify(mappedUser));
      await refreshUserSkills();
    } catch (error: any) {
      console.error("Google Login Error:", error.response?.data);
      const errorMsg = error.response?.data?.error || "Failed to login with Google";
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (registrationData: any): Promise<void> => {
    setLoading(true);
    try {
      await authAPI.register(registrationData);
      // Wait for email verification, do not log user in
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.username?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.error ||
        "Failed to create account";
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
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
    }
  };

  // Update user profile wrapper
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      // Optimistic update
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // TODO: Call authAPI.updateProfile here if we want to persist changes to backend automatically
      // For now, we assume the component calling this also calls the API
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateUser,
    refreshUserSkills,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
