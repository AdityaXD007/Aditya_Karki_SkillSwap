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
} from "lucide-react";
import { skillsAPI, authAPI, type Skill } from "@/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Profile: React.FC = () => {
  const { user, updateUser, refreshUserSkills, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newAvailabilityTime, setNewAvailabilityTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const fetchSkills = async () => {
      try {
        console.log(
          "Attempting to fetch skills... isAuthenticated:",
          isAuthenticated,
        );
        const response = await skillsAPI.getAllSkills();
        console.log(
          "Skills response received:",
          response.status,
          response.data,
        );

        if (Array.isArray(response.data)) {
          setAvailableSkills(response.data);
          setError(null);
        } else {
          console.error("Data is not an array:", response.data);
          setError("Server returned an unexpected data format.");
        }
      } catch (err: any) {
        console.error(
          "Fetch skills error:",
          err.response?.status,
          err.response?.data || err.message,
        );

        if (err.response?.status === 401 && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying fetch skills (${retryCount}/${maxRetries})...`);
          setTimeout(fetchSkills, 1000);
        } else if (isAuthenticated) {
          setError(
            `Database connection issue (${
              err.response?.status || "Network Error"
            }). Please check if the backend is running.`,
          );
        }
      }
    };

    if (isAuthenticated) {
      fetchSkills();
    } else {
      console.log("Waiting for authentication to fetch skills...");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await authAPI.uploadProfileImage(formData);

      // Update user with new image URL
      updateUser({ avatar: response.data.profile_image_url });
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      // Reset file input
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
      await skillsAPI.addUserSkill({
        skill_id: pendingSkill.id,
        skill_type: pendingSkill.type,
        proficiency_level: level,
        description: "",
      });
      await refreshUserSkills();
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
        await skillsAPI.addUserSkill({
          skill_id: skill.id,
          skill_type: "LEARN",
          proficiency_level: "BEGINNER",
          description: "",
        });
        await refreshUserSkills();
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
      toast.success("Skill removed");
    } catch (error) {
      toast.error("Failed to remove skill");
    }
  };

  const handleSaveAvailability = async () => {
    if (!newAvailabilityTime || !user) return;

    const currentAvailability = user.availability || [];
    const newAvailability = [...currentAvailability, newAvailabilityTime];

    setIsLoading(true);
    try {
      await authAPI.updateProfile({
        availability: newAvailability.join(","),
      });
      updateUser({ availability: newAvailability });
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
    if (!user) return;
    const newAvailability = (user.availability || []).filter(
      (_, i) => i !== index,
    );

    try {
      await authAPI.updateProfile({
        availability: newAvailability.join(","),
      });
      updateUser({ availability: newAvailability });
      toast.success("Availability removed");
    } catch (error) {
      toast.error("Failed to remove availability");
    }
  };

  const teachingSkills =
    user?.userSkills.filter((s) => s.type === "TEACH") || [];
  const learningSkills =
    user?.userSkills.filter((s) => s.type === "LEARN") || [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={
                    user?.avatar ||
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACUCAMAAABY3hBoAAAAMFBMVEXk5ueutLersbTn6eq0ubzh4+S3vL/Gysy+w8W6v8HJzc/c3+DDx8nU19na3N7M0NKx/X9MAAAD+ElEQVR4nO2cSZLDIAxFAYHjAcz9b9vg2ImTeAIkoKr9V1n04pUQ4huJZuzWrVu3bt26devWrX8oAGBMKTX/qkQAg+l12zm1re6NqoENmDItF1wIwb2E/8m1UawoHICneiKtJYTUplzcgBm5QfViM4WiBqbZo5rZGlOADNQJ1oTWDbnRoD+lmsh43qCB6s7DNaO1ObkGeZXLZ5rKxmUuUz2VKdFgvB6unGQwhmK55RwycKngeDlJ+jxTTQQXF5KaCy7XiS8yTcxl47gcmSXdABGJ/yKjTDO4cD7ugrV0IQMTz+XIDBmYkglcrmaQgfUpAaPM/yQsupDFl4qXiMxZWoZxb2gpwILNzhYZyWH+SF5JLh4UIUsPGE36D+kBcxrRuSCxiD1FUMogyof9gOG7n8TjaBF+kiUYnrXQzQ9GFZvAsC0GTu5TZL9GAkMvsS0OGEf3sZFfRz9qsMES3P6H5A12g+2o2uSvtlzUWmARPpGeYNhHEhoYuoWt1fawAQcM3ygiWWv8dgQgfFbS3KuE3+5vCf/zrd4PXowSS3JFUO+lCkvflx0JV/qHkrAkYIylglHdDqeWMrrL4dTrdLIORJrFIMswlnZg0twML6q1yZVQMojbgtH9N0FTW1eK3Jl0O3IRxN1e5xgjiNkAeUZCwtupmSaPah2hmVYzYOhIjhkntQLGtLq8s4pXKy3lAblDNtQ5CuhnOu1JpgmePVyL+sNxU1twElaZbhNNiLbUFOybzTbSTzQvI83uh+xstrnEAwGo0T7appFOXdvbsYop8KeAzSzACq/gSrChwkDuBBjGaZR/ZdJk0+remsE/O8hPuOTVlOw/+1LMW0D3ZsgXPh8no+X0uOCs8Ps/6OyQ4dWBi5TRzW+MjvFka0fKwAFTtuMBjmcdOqkHori5StoGReo3cD1+3ICNm49DAtm4tKj55o+dZKqFTeMZWvWIyat9tG7EiBoMqFgTmrMeqWSAG603Wpe2oGAD3mAEoul41w0jFdaE5ox3FBpgNXX30aK+OMFQhmsm449wMKTppzO00E1w5f0YElpI5cCaYrtGpi+TYTXmr5J1Fz+pcHq5IWTyWkmjrhJbZFe2ANasTBAZPycrweV0FjMoxOVidphn2fN+paPncVjDrlESzT4XzmhFNNlupUUa34kn2+uDlUr8N9lmY6dogs3a7OaXXkgv0W8sZvGF9PodyEt7CIimjcZ5aaRZ374xswU70FeLGumpCoK+QlZHhk36mHmGagL2uTELH5KfWk/lQX43faCV/4l7xk+l1dOlmlZy/aC8G+pG/d1Ausoj3p9XI/UFnAXoaxrhR7e+xKjMVK8wh7Ddb1U/M/1KmrvHpJl/1/yVE3eJEGKbUAAAAASUVORK5CYII="
                  }
                  alt={user?.username || user?.name}
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
                onClick={handleImageClick}
                disabled={isUploadingImage}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 shadow-md transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
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
                      {user?.username}
                    </h1>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {user?.username || user?.email?.split("@")[0]}
                  </p>
                  {user?.name && user.name !== user.username && (
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">{user.name}</p>
                  )}
                </div>

                <Button
                  onClick={() =>
                    isEditing ? handleSaveProfile() : setIsEditing(true)
                  }
                  disabled={isLoading}
                  className={
                    isEditing
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
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
                    {user?.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {user?.location || "Remote"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Joined Jan 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              About Me
            </h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="w-full p-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 dark:bg-slate-800 dark:text-white"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg italic">
                {user?.bio || "No bio added yet."}
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
              {teachingSkills.map((skill) => (
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
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                    Add New Skill
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onSkillSelect(Number(e.target.value), "TEACH");
                        e.target.value = "";
                      }
                    }}
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-700"
                  >
                    <option value="">+ Find a skill to teach...</option>
                    {availableSkills
                      .filter(
                        (s) => !teachingSkills.find((ts) => ts.skill_id === s.id),
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
              {learningSkills.map((skill) => (
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Add New Interest
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onSkillSelect(Number(e.target.value), "LEARN");
                    e.target.value = "";
                  }
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-700"
              >
                <option value="">+ Find a skill to learn...</option>
                {availableSkills
                  .filter(
                    (s) => !learningSkills.find((ls) => ls.skill_id === s.id),
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
                className="border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Time
              </Button>
            )}
          </div>

          {isAddingAvailability && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50 flex flex-col sm:flex-row gap-3">
              <input
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
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
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
                  className="text-slate-500 dark:text-slate-400 flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user?.availability && user.availability.length > 0 ? (
              user.availability.map((time, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 transition-all group"
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
              <p className="text-slate-400 dark:text-slate-500 col-span-full italic py-4">
                No availability set yet. Add your preferred times for learning
                sessions.
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
