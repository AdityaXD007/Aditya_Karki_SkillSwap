import apiClient from './apiClient';
import type { Skill, UserSkill } from './types';

export const skillsAPI = {
    getAllSkills: () => apiClient.get<Skill[]>('/skills/'),

    getUserSkills: () => apiClient.get<UserSkill[]>('/user-skills/'),

    addUserSkill: (data: {
        skill_id: number;
        skill_type: 'TEACH' | 'LEARN';
        proficiency_level: string;
        description: string
    }) => apiClient.post('/user-skills/', data),

    deleteUserSkill: (id: number) => apiClient.delete(`/user-skills/${id}/`),
};
