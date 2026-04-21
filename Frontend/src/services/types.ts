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
    sessions_taught_count?: number;
    sessions_learned_count?: number;
    can_charge?: boolean;
    hourly_rate?: string | number;
    email_notifications_enabled?: boolean;
    push_notifications_enabled?: boolean;
    is_public?: boolean;
    is_google_connected?: boolean;
    is_github_connected?: boolean;
    experience_title?: string;
    is_onboarded?: boolean;
    is_email_verified?: boolean;
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
    partnerId: number;
    userName: string;
    userAvatar: string;
    lastMessage: string;
    lastMessageTime: string;
    lastMessageAt?: string; // Track for sorting
    unreadCount: number;
}

export interface Message {
    id: number;
    text: string;
    image?: string;
    audio?: string;
    senderId: number;
    userName: string;
    userAvatar: string;
    timestamp: string;
    isRead: boolean;
    replyTo?: {
        id: number;
        text: string;
        sender: string;
    };
    reactions?: Record<string, string>;
    isDeleted?: boolean;
    messageType?: 'text' | 'image' | 'audio' | 'video_call';
    callDuration?: number;
}

export interface SessionRequest {
    id: number;
    requester_details: UserProfile;
    partner_details: UserProfile;
    skill_learn_details: Skill;
    session_length: number;
    proposed_time: string | null;
    message: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    created_at: string;
}

export interface LearningSession {
    id: number;
    student: number;
    teacher: number;
    student_name: string;
    teacher_name: string;
    student_username: string;
    teacher_username: string;
    student_email: string;
    teacher_email: string;
    student_avatar?: string;
    teacher_avatar?: string;
    student_location?: string;
    teacher_location?: string;
    skill_name: string;
    scheduled_time: string;
    actual_start_time?: string;
    actual_end_time?: string;
    is_paused: boolean;
    remaining_duration_seconds?: number;
    duration: number;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    meeting_link: string;
    is_paid: boolean;
    is_free: boolean;
    total_price: number | string;
    admin_confirmed: boolean;
    payout_completed: boolean;
    rating_by_student?: number | null;
    rating_by_teacher?: number | null;
    feedback_by_student?: string;
    feedback_by_teacher?: string;
    reschedule_requested_time?: string;
    reschedule_reason?: string;
    reschedule_requested_by?: number;
}

export interface Notification {
    id: number;
    sender_username?: string;
    sender_avatar?: string;
    notification_type: 'SESSION_CANCELLED' | 'REQUEST_WITHDRAWN' | 'SESSION_ACCEPTED' | 'NEW_REQUEST' | 'GENERAL';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}
