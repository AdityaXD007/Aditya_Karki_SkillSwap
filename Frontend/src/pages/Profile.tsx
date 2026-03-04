import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/Context/AuthContext";
import {
  Camera,
  Star,
  MapPin,
  Clock,
  Edit2,
  Save,
  Plus,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  Award,
  CheckCircle,
  Users,
  BarChart,
  Calendar,
  Lock,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { skillsAPI, authAPI, type Skill } from "@/services";
import { SessionRequestModal } from "@/components/SessionRequestModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, refreshUserSkills, isAuthenticated } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // ... rest of the component state and logic ...
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newAvailabilityTime, setNewAvailabilityTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
  });

  // Fetch target profile user
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        let profileData;
        if (!userId || userId === currentUser?.id) {
          // It's my profile
          const response = await authAPI.getProfile();
          profileData = response.data;
          setIsOwnProfile(true);
        } else {
          // It's someone else's profile
          const response = await authAPI.getProfileById(userId);
          profileData = response.data;
          setIsOwnProfile(false);
        }
        
        // Normalize profile data to match component expectations
        const normalized = {
          ...profileData,
          avatar: profileData.profile_image_url || profileData.profile_image,
          name: profileData.full_name || profileData.username,
          availability: profileData.availability ? profileData.availability.split(',').filter(Boolean) : [],
            userSkills: profileData.user_skills ? profileData.user_skills.map((s: any) => ({
              id: s.id,
              skill_id: s.skill_details?.id || s.skill_id,
              name: s.skill_details?.name || "Unknown Skill",
              type: s.skill_type,
              proficiency: s.proficiency_level,
              icon_class: s.skill_details?.icon_class || "",
              color_class: s.skill_details?.color_class || "",
            })) : [],
            sessionsTaughtCount: profileData.sessions_taught_count || 0,
            sessionsLearnedCount: profileData.sessions_learned_count || 0,
            canCharge: profileData.can_charge || false,
          };
        
        setProfileUser(normalized);
        setFormData({
            name: normalized.name,
            bio: normalized.bio || "",
        });
        setError(null);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. The user might not exist.");
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [userId, currentUser?.id, isAuthenticated]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await skillsAPI.getAllSkills();
        if (Array.isArray(response.data)) {
          setAvailableSkills(response.data);
          setError(null);
        }
      } catch (err: any) {
        console.error("Fetch skills error:", err);
      }
    };

    if (isAuthenticated && isOwnProfile) {
      fetchSkills();
    }
  }, [isAuthenticated, isOwnProfile]);

  const handleImageClick = () => {
    if (!isOwnProfile) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await authAPI.uploadProfileImage(formData);
      updateUser({ avatar: response.data.profile_image_url });
      
      // Update local profile user state too
      setProfileUser((prev: any) => ({ ...prev, avatar: response.data.profile_image_url }));
      
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const [pendingSkill, setPendingSkill] = useState<{ id: number; name: string; type: "TEACH" | "LEARN" } | null>(null);

  const PROFICIENCY_LEVELS = [
    { 
      value: "BEGINNER", 
      label: "Beginner", 
      color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/80"
    },
    { 
      value: "INTERMEDIATE", 
      label: "Intermediate", 
      color: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100/80"
    },
    { 
      value: "ADVANCED", 
      label: "Advanced", 
      color: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100/80"
    },
    { 
      value: "EXPERT", 
      label: "Expert", 
      color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/80"
    },
  ];

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        full_name: formData.name,
        bio: formData.bio,
      });
      updateUser({
        name: formData.name,
        bio: formData.bio,
      });
      setProfileUser((prev: any) => ({ ...prev, name: formData.name, bio: formData.bio }));
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async (level: string) => {
    if (!pendingSkill) return;
    try {
      const response = await skillsAPI.addUserSkill({
        skill_id: pendingSkill.id,
        skill_type: pendingSkill.type,
        proficiency_level: level,
        description: "",
      });
      await refreshUserSkills();
      
      // Update local state to show new skill immediately
      const newSkillDetail = availableSkills.find(s => s.id === pendingSkill.id);
      if (newSkillDetail) {
         const newSkill = {
             id: response.data.id, // Use real ID from backend
             skill_id: pendingSkill.id,
             name: newSkillDetail.name,
             type: pendingSkill.type,
             proficiency: level,
             icon_class: newSkillDetail.icon_class,
             color_class: newSkillDetail.color_class
         };
         setProfileUser((prev: any) => ({
             ...prev,
             userSkills: [...prev.userSkills, newSkill]
         }));
      }

      toast.success(`${pendingSkill.name} added`);
      setPendingSkill(null);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.non_field_errors?.[0] || "Failed to add skill";
      toast.error(errorMsg);
    }
  };

  const onSkillSelect = async (skillId: number, type: "TEACH" | "LEARN") => {
    const skill = availableSkills.find(s => s.id === skillId);
    if (!skill) return;

    if (type === "LEARN") {
      try {
        const response = await skillsAPI.addUserSkill({
          skill_id: skill.id,
          skill_type: "LEARN",
          proficiency_level: "BEGINNER",
          description: "",
        });
        await refreshUserSkills();
        
        const newSkill = {
            id: response.data.id, // Use real ID from backend
            skill_id: skill.id,
            name: skill.name,
            type: "LEARN" as const,
            proficiency: "BEGINNER",
            icon_class: skill.icon_class,
            color_class: skill.color_class
        };
        setProfileUser((prev: any) => ({
            ...prev,
            userSkills: [...prev.userSkills, newSkill]
        }));

        toast.success(`${skill.name} added to interests`);
      } catch (error: any) {
        const errorMsg = error.response?.data?.non_field_errors?.[0] || "Failed to add skill";
        toast.error(errorMsg);
      }
    } else {
      setPendingSkill({ id: skill.id, name: skill.name, type });
    }
  };

  const handleRemoveSkill = async (userSkillId: number) => {
    try {
      await skillsAPI.deleteUserSkill(userSkillId);
      await refreshUserSkills();
      setProfileUser((prev: any) => ({
          ...prev,
          userSkills: prev.userSkills.filter((s: any) => s.id !== userSkillId)
      }));
      toast.success("Skill removed");
    } catch (error) {
      toast.error("Failed to remove skill");
    }
  };

  const handleSaveAvailability = async () => {
    if (!newAvailabilityTime || !profileUser) return;

    const currentAvailability = profileUser.availability || [];
    const newAvailability = [...currentAvailability, newAvailabilityTime];

    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        availability: newAvailability.join(","),
      });
      updateUser({ availability: newAvailability });
      setProfileUser((prev: any) => ({ ...prev, availability: newAvailability }));
      setNewAvailabilityTime("");
      setIsAddingAvailability(false);
      toast.success("Availability added");
    } catch (error) {
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvailability = async (index: number) => {
    if (!profileUser) return;
    const newAvailability = (profileUser.availability || []).filter(
      (_: any, i: number) => i !== index,
    );

    try {
      await authAPI.updateProfile({
        availability: newAvailability.join(","),
      });
      updateUser({ availability: newAvailability });
      setProfileUser((prev: any) => ({ ...prev, availability: newAvailability }));
      toast.success("Availability removed");
    } catch (error) {
      toast.error("Failed to remove availability");
    }
  };

  if (isLoading && !profileUser) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
    );
  }

  if (!profileUser && error) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
              <div className="text-center max-w-md">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                  <Button onClick={() => navigate("/matches")}>Back to Matches</Button>
              </div>
          </div>
      );
  }

  const teachingSkills = profileUser?.userSkills.filter((s: any) => s.type === "TEACH") || [];
  const learningSkills = profileUser?.userSkills.filter((s: any) => s.type === "LEARN") || [];

  // --- RENDER OWN PROFILE ---
  const renderMyProfile = () => (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 ring-1 ring-slate-200/50">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg relative">
                <img
                  src={
                    profileUser?.avatar ||
                    `https://ui-avatars.com/api/?name=${profileUser?.username}&background=random`
                  }
                  alt={profileUser?.username}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage}
              />
              <button
                disabled={isUploadingImage}
                aria-label="Upload profile picture"
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 shadow-md transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="text-3xl font-bold text-slate-900 dark:text-white border-b-2 border-blue-500 focus:outline-none bg-transparent"
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {profileUser?.username}
                      </h1>
                    )}
                    {!isEditing && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-600 border-blue-200 uppercase tracking-widest px-2 py-0">
                        Me
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                    @{profileUser?.username}
                  </p>
                  {profileUser?.name && profileUser.name !== profileUser.username && (
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5 font-medium">{profileUser.name}</p>
                  )}
                </div>

                <Button
                  onClick={() =>
                    isEditing ? handleSaveProfile() : setIsEditing(true)
                  }
                  disabled={isLoading}
                  className={
                    isEditing
                      ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                      : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                  }
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isEditing ? (
                    <Save className="w-4 h-4 mr-2" />
                  ) : (
                    <Edit2 className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </Button>
              </div>

               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                <div className="flex items-center space-x-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
                    {profileUser?.rating?.toFixed(1) || "5.0"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {profileUser?.location || "Remote"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Joined Jan 2026</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-blue-50/50 dark:bg-blue-900/10 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/20">
                  <Award className={`w-4 h-4 ${profileUser?.canCharge ? 'text-green-500' : 'text-blue-500'}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {profileUser?.sessionsTaughtCount || 0} taught
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {profileUser?.sessionsLearnedCount || 0} learned
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
              Detailed Bio
            </h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="w-full p-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 dark:bg-slate-800 dark:text-white shadow-inner"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg italic bg-slate-50/30 dark:bg-slate-800/20 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                {profileUser?.bio || "No bio added yet. Tell people what you're passionate about!"}
              </p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Teaching Skills */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                Skills I Teach
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5 min-h-[40px]">
              {teachingSkills.map((skill: any) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors gap-2 text-sm font-semibold group flex items-center"
                >
                  {skill.icon_class && (
                    <i
                      className={`${skill.icon_class} ${
                        skill.color_class || (skill.icon_class.includes("devicon") ? "colored" : "text-slate-400")
                      }`}
                    ></i>
                  )}
                  <span className="text-blue-700 dark:text-blue-400">
                    {skill.name}
                    <span className="text-[10px] opacity-60 font-normal ml-1 capitalize">
                      ({skill.proficiency.toLowerCase()})
                    </span>
                  </span>
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {teachingSkills.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 italic">
                  No teaching skills listed
                </p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              {pendingSkill?.type === "TEACH" ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      LEVEL FOR <span className="text-blue-600 dark:text-blue-400 font-extrabold">{pendingSkill.name.toUpperCase()}</span>
                    </p>
                    <button onClick={() => setPendingSkill(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PROFICIENCY_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => handleAddSkill(level.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${level.color} border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  <label htmlFor="teach-skill-select" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                    Add New Skill
                  </label>
                  <select
                    id="teach-skill-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        onSkillSelect(Number(e.target.value), "TEACH");
                        e.target.value = "";
                      }
                    }}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                  >
                    <option value="">+ Find a skill to teach...</option>
                    {availableSkills
                      .filter(
                        (s) => !teachingSkills.find((ts: any) => ts.skill_id === s.id),
                      )
                      .map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Learning Skills */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-8 bg-purple-500 rounded-full" />
                Skills I want to learn
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5 min-h-[40px]">
              {learningSkills.map((skill: any) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors gap-2 text-sm font-semibold group flex items-center"
                >
                  {skill.icon_class && (
                    <i
                      className={`${skill.icon_class} ${
                        skill.color_class || (skill.icon_class.includes("devicon") ? "colored" : "text-slate-400")
                      }`}
                    ></i>
                  )}
                  <span className="text-purple-700 dark:text-purple-400">{skill.name}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="ml-1 text-purple-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {learningSkills.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 italic">
                  No learning skills listed
                </p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <label htmlFor="learn-skill-select" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Add New Interest
              </label>
              <select
                id="learn-skill-select"
                onChange={(e) => {
                  if (e.target.value) {
                    onSkillSelect(Number(e.target.value), "LEARN");
                    e.target.value = "";
                  }
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-700 shadow-sm"
              >
                <option value="">+ Find a skill to learn...</option>
                {availableSkills
                  .filter(
                    (s) => !learningSkills.find((ls: any) => ls.skill_id === s.id),
                  )
                  .map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Weekly Availability
              </h2>
            </div>
            {!isAddingAvailability && (
              <Button
                onClick={() => setIsAddingAvailability(true)}
                variant="outline"
                size="sm"
                className="border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-bold"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Time
              </Button>
            )}
          </div>

          {isAddingAvailability && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50 flex flex-col sm:flex-row gap-3 shadow-inner">
              <label htmlFor="availability-input" className="sr-only">
                Add availability time
              </label>
              <input
                id="availability-input"
                type="text"
                autoFocus
                placeholder="e.g. Mon 10:00 - 12:00"
                value={newAvailabilityTime}
                onChange={(e) => setNewAvailabilityTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAvailability()}
                className="flex-1 p-2.5 border border-green-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white dark:bg-slate-800 text-slate-700 dark:text-white transition-colors"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAvailability}
                  disabled={!newAvailabilityTime || isLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none font-bold"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingAvailability(false);
                    setNewAvailabilityTime("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 dark:text-slate-400 flex-1 sm:flex-none font-medium hover:bg-white/50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profileUser?.availability && profileUser.availability.length > 0 ? (
              profileUser.availability.map((time: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{time}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAvailability(idx)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove availability"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 dark:text-slate-500 col-span-full italic py-4 flex items-center gap-2">
                <Lock className="w-4 h-4 opacity-50" />
                No availability set yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER PUBLIC PROFILE ---
  const renderPublicProfile = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Header */}
      <div className="h-64 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden shadow-inner">
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:24px_24px]" />
         <div className="absolute -bottom-16 left-0 right-0 h-32 bg-slate-50 dark:bg-slate-950 rounded-[50%] scale-x-125" />
      </div>

       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Sidebar Profile */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all hover:shadow-2xl">
                <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
                  <div className="w-40 h-40 rounded-3xl overflow-hidden mx-auto shadow-2xl rotate-3 transform transition-transform hover:rotate-0 relative group">
                    <img
                      src={
                        profileUser?.avatar ||
                        `https://ui-avatars.com/api/?name=${profileUser?.username}&background=random`
                      }
                      alt={profileUser?.username}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-6 tracking-tight">
                    {profileUser?.username}
                  </h1>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest mt-1 uppercase flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified Scholar
                  </p>
                  
                  <div className="mt-6 flex justify-center gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rating</p>
                       <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                         <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                         {profileUser?.rating?.toFixed(1) || "5.0"}
                       </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sessions</p>
                       <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                         <Users className="w-3.5 h-3.5 text-blue-500" />
                         {profileUser?.sessionsTaughtCount || 0}
                       </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
                  <Button 
                    onClick={() => setIsRequestModalOpen(true)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Connect & Book
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-sm font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    onClick={() => toast.info("Messaging feature coming soon!")}
                  >
                    Send Private Message
                  </Button>
                </div>
              </div>

              {/* Badges/Achievements Sidebar Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Award className="w-4 h-4 text-yellow-500" /> Achievements
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-800">
                         <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white">Profile Complete</p>
                         <p className="text-[10px] text-slate-500">All information verified</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 opacity-50">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                         <Star className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white">Top Teacher</p>
                         <p className="text-[10px] text-slate-500">5+ five-star reviews</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-10">
                <div className="flex items-center gap-2 mb-6">
                   <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 pointer-events-none rounded-md px-2 py-0.5 text-[10px] uppercase font-black">Bio</Badge>
                   <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">About {profileUser?.username}</h2>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner italic">
                  "{profileUser?.bio || `Hi, I'm ${profileUser?.username}! I'm passionate about sharing my skills and learning from others. Let's connect and build something amazing together.`}"
                </p>

                <div className="grid sm:grid-cols-2 gap-6 mt-10">
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                         <MapPin className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Location</p>
                         <p className="font-bold text-slate-900 dark:text-white">{profileUser?.location || "Remote / Earth"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/30">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                         <BarChart className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Experience</p>
                         <p className="font-bold text-slate-900 dark:text-white">Expert Level</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Teaching Showcase */}
              <div className="space-y-4">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2 ml-4">
                   <div className="w-2 h-6 bg-blue-600 rounded-full" />
                   Mastery Showcase
                 </h2>
                 <div className="grid sm:grid-cols-2 gap-4">
                    {teachingSkills.map((skill: any) => (
                      <div key={skill.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                           {skill.icon_class && <i className={`${skill.icon_class} text-6xl`} />}
                         </div>
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                               <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                  {skill.icon_class && (
                                    <i className={`${skill.icon_class} text-xl ${skill.color_class || "colored"}`} />
                                  )}
                               </div>
                               <h3 className="font-bold text-slate-900 dark:text-white">{skill.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                               <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none text-[10px] uppercase font-black rounded-md">
                                 {skill.proficiency}
                               </Badge>
                            </div>
                         </div>
                      </div>
                    ))}
                    {teachingSkills.length === 0 && (
                       <div className="sm:col-span-2 py-10 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                          <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-30" />
                          <p className="text-slate-400 font-medium italic">This user hasn't listed any teaching skills yet.</p>
                       </div>
                    )}
                 </div>
              </div>

               {/* Availability Public Section */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800/50">
                      <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Teaching Hours</h2>
                      <p className="text-xs text-slate-500 font-medium">Standard local time slots</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {profileUser?.availability && profileUser.availability.length > 0 ? (
                    profileUser.availability.map((time: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-green-600 dark:hover:border-green-500 transition-all cursor-crosshair group shadow-sm"
                      >
                         <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="text-slate-900 dark:text-white font-black text-sm">{time}</span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-slate-400 font-bold italic text-sm">No regular hours listed. Try messaging them!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

         </div>
       </div>
    </div>
  );

  return (
    <>
      {isOwnProfile ? renderMyProfile() : renderPublicProfile()}
      
      <SessionRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        match={profileUser ? {
          id: profileUser.id,
          teacher: {
            id: profileUser.id,
            username: profileUser.username,
          },
          skills: profileUser.userSkills.filter((s: any) => s.type === "TEACH")
        } as any : null}
      />
    </>
  );
};
