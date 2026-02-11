export interface UserProfile {
    id: number;
    username: string;
    email: string;
    full_name: string;
    profile_image: string | null;
    profile_image_url?: string | null;
    location: string;
    bio: string;
    languages: string;
    availability: string;
    user_skills?: UserSkill[];
    rating?: number;
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
    skills?: Skill[]; // New aggregated format
    skill?: Skill;   // Old single skill format
    proficiency_level: string;
    status: string;
    description: string;
}

export interface Conversation {
    id: number;
    userName: string;
    userAvatar: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export interface Message {
    id: number;
    text: string;
    senderId: number;
    userName: string;
    userAvatar: string;
    timestamp: string;
    isRead: boolean;
}

export interface SessionRequest {
    id: number;
    requester_details: UserProfile;
    partner_details: UserProfile;
    skill_learn_details: Skill;
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
