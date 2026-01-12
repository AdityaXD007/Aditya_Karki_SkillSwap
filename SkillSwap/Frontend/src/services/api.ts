import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
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
export interface Match {
  availability: string[];
  id: string;
  name: string;
  avatar: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  matchScore: number;
  rating: number;
}

export interface Booking {
  id: string;
  skill: string;
  partnerName: string;
  partnerAvatar: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: 'teaching' | 'learning';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// Auth API calls
export const authAPI = {
  register: (username: string, email: string, password: string, password_confirm: string) =>
    api.post('/auth/register/', { username, email, password, password_confirm }),

  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),

  logout: () => api.post('/auth/logout/'),

  getProfile: () => api.get('/auth/profile/'),
};

// Matches API (Mock implementation - replace with real API calls)
export const matchesApi = {
  getRecommended: async (): Promise<Match[]> => {
    // Mock data - replace with real API call
    return Promise.resolve([
      {
        id: '1',
        name: 'Alice Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        bio: 'Frontend developer passionate about React and UI/UX',
        skillsOffered: ['React', 'TypeScript', 'CSS'],
        skillsWanted: ['Node.js', 'MongoDB'],
        matchScore: 95,
        rating: 4.8,
        availability: ['Mon, Wed 6-8 PM'],
      },
      {
        id: '2',
        name: 'Bob Smith',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        bio: 'Backend engineer looking to learn frontend',
        skillsOffered: ['Node.js', 'Python', 'MongoDB'],
        skillsWanted: ['React', 'Vue.js'],
        matchScore: 88,
        rating: 4.6,
        availability: ['Tue, Thu 7-9 PM'],
      },
      {
        id: '3',
        name: 'Carol Davis',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        bio: 'Full-stack developer and design enthusiast',
        skillsOffered: ['UI/UX Design', 'Figma', 'Adobe XD'],
        skillsWanted: ['React', 'TypeScript'],
        matchScore: 82,
        rating: 4.9,
        availability: ['Weekends 10 AM-4 PM'],
      },
    ]);
  },
};

// Bookings API (Mock implementation - replace with real API calls)
export const bookingsApi = {
  getUserBookings: async (): Promise<Booking[]> => {
    // Mock data - replace with real API call
    return Promise.resolve([
      {
        id: '1',
        skill: 'React Fundamentals',
        partnerName: 'Alice Johnson',
        partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        date: 'Jan 15, 2026',
        time: '2:00 PM',
        duration: 60,
        location: 'Google Meet',
        type: 'learning',
        status: 'confirmed',
      },
      {
        id: '2',
        skill: 'TypeScript Best Practices',
        partnerName: 'Bob Smith',
        partnerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        date: 'Jan 18, 2026',
        time: '4:00 PM',
        duration: 90,
        location: 'Zoom',
        type: 'teaching',
        status: 'pending',
      },
    ]);
  },
};

// Messages API (Mock implementation - replace with real API calls)
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