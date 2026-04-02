import apiClient from './apiClient';
import type { UserProfile } from './types';

export const authAPI = {
    register: (data: any) =>
        apiClient.post('/auth/register/', data),

    login: (email: string, password: string) =>
        apiClient.post('/auth/login/', { email, password }),

    googleLogin: (token: string) =>
        apiClient.post('/auth/google_login/', { token }),

    logout: () => apiClient.post('/auth/logout/'),

    getProfile: () => apiClient.get<UserProfile>('/profiles/me/'),

    getProfileById: (id: string | number) => apiClient.get<UserProfile>(`/profiles/${id}/`),

    updateProfile: (data: Partial<UserProfile>) =>
        apiClient.patch<UserProfile>('/profiles/me/', data),

    uploadProfileImage: (formData: FormData) =>
        apiClient.post("/profiles/upload-image/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    changePassword: (data: any) =>
        apiClient.post('/auth/change_password/', data),
};
