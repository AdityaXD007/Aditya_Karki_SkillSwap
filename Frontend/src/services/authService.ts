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
    deleteAccount: () => apiClient.delete('/auth/delete_account/'),

    getProfile: () => apiClient.get<UserProfile>('/profiles/me/'),

    getProfileById: (id: string | number) => apiClient.get<UserProfile>(`/profiles/${id}/`),

    updateProfile: (data: Partial<UserProfile>) =>
        apiClient.patch<UserProfile>('/profiles/me/', data),

    // Onboarding specific endpoints
    onboardingUpdate: (data: { full_name?: string, bio?: string, location?: string }) =>
        apiClient.patch<UserProfile>('/profiles/update/', data),

    onboardingSkills: (data: { 
        teaching: (number | { id: number, proficiency_level: string })[], 
        learning: (number | { id: number, proficiency_level: string })[] 
    }) => apiClient.post('/profiles/skills/', data),

    uploadProfileImage: (formData: FormData) =>
        apiClient.post("/profiles/upload-image/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    changePassword: (data: any) =>
        apiClient.post('/auth/change_password/', data),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot_password/', { email }),

    resetPassword: (data: any) =>
        apiClient.post('/auth/reset_password/', data),
};
