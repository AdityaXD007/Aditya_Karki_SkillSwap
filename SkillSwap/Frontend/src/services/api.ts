import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if this is a login or register attempt - let the form handle it
      const isAuthEndpoint = error.config?.url?.includes('/auth/login/') ||
        error.config?.url?.includes('/auth/register/');

      if (!isAuthEndpoint) {
        // Token expired or invalid, log user out
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  profile_image: string | null;
  location: string;
  bio: string;
  languages: string;
  availability: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  icon_class: string;
  color_class: string;
}

export interface UserSkill {
  id: number;
  skill_id: number;
  skill_details: Skill;
  skill_type: 'TEACH' | 'LEARN';
  proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
}

export interface Match {
  id: number;
  teacher: UserProfile;
  skill: Skill;
  proficiency_level: string;
  status: string;
  description: string;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SessionRequest {
  id: number;
  requester_details: UserProfile;
  partner_details: UserProfile;
  skill_learn_details: Skill; // The skill being learned
  session_length: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  created_at: string;
}

export interface LearningSession {
  id: number;
  student_name: string;
  teacher_name: string;
  skill_name: string;
  scheduled_time: string;
  duration: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  meeting_link: string;
}

// Auth API calls
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register/', {
      email,
      password,
      password_confirm: password,
      name
    }),

  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),

  logout: () => api.post('/auth/logout/'),

  getProfile: () => api.get<UserProfile>('/profiles/me/'),
  updateProfile: (data: Partial<UserProfile>) => api.patch<UserProfile>('/profiles/me/', data),
};

// Skills API
export const skillsAPI = {
  getAllSkills: () => api.get<Skill[]>('/skills/'),
  getUserSkills: () => api.get<UserSkill[]>('/user-skills/'),
  addUserSkill: (data: { skill_id: number; skill_type: 'TEACH' | 'LEARN'; proficiency_level: string; description: string }) =>
    api.post('/user-skills/', data),
  deleteUserSkill: (id: number) => api.delete(`/user-skills/${id}/`),
};

// Matching API
export const matchesApi = {
  getRecommended: () => api.get<Match[]>('/matches/recommended/'),
  search: (query: string) => api.get<Match[]>(`/matches/?search=${query}`),
};

// Requests API
export const requestsAPI = {
  getRequests: () => api.get<SessionRequest[]>('/requests/'),
  sendRequest: (data: { partner: number; skill_to_learn: number; session_length: number; message: string }) =>
    api.post('/requests/', data),
  acceptRequest: (id: number) => api.post(`/requests/${id}/accept/`),
  rejectRequest: (id: number) => api.post(`/requests/${id}/reject/`),
};

// Sessions API
export const sessionsAPI = {
  getSessions: () => api.get<LearningSession[]>('/sessions/'),
};

export const messagesApi = {
  getConversations: async (): Promise<Conversation[]> => {
    // Mock data - replace with real API call
    return Promise.resolve([
      {
        id: '1',
        userName: 'Alice Johnson',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        lastMessage: 'Looking forward to our session!',
        lastMessageTime: '2026-01-12T10:30:00Z',
        unreadCount: 2,
      },
      {
        id: '2',
        userName: 'Bob Smith',
        userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        lastMessage: 'Thanks for the help with TypeScript!',
        lastMessageTime: '2026-01-11T15:45:00Z',
        unreadCount: 0,
      },
    ]);
  },
  send: async (conversationId: string, message: string): Promise<void> => {
    // Mock implementation - replace with real API call
    console.log(`Sending message to ${conversationId}: ${message}`);
    return Promise.resolve();
  },
};

export default api;
