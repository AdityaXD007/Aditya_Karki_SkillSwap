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
import { skillsAPI, authAPI, type Skill } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const handleAddSkill = async (skillId: number, type: "TEACH" | "LEARN") => {
    if (!skillId) return;
    try {
      await skillsAPI.addUserSkill({
        skill_id: skillId,
        skill_type: type,
        proficiency_level: "INTERMEDIATE",
        description: "",
      });
      await refreshUserSkills();
      toast.success("Skill added successfully");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.non_field_errors?.[0] || "Failed to add skill";
      toast.error(errorMsg);
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
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 backdrop-blur-sm bg-white/80">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <img
                  src={
                    user?.avatar ||
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACUCAMAAABY3hBoAAAAMFBMVEXk5ueutLersbTn6eq0ubzh4+S3vL/Gysy+w8W6v8HJzc/c3+DDx8nU19na3N7M0NKx/X9MAAAD+ElEQVR4nO2cSZLDIAxFAYHjAcz9b9vg2ImTeAIkoKr9V1n04pUQ4huJZuzWrVu3bt26devWrX8oAGBMKTX/qkQAg+l12zm1re6NqoENmDItF1wIwb2E/8m1UawoHICneiKtJYTUplzcgBm5QfViM4WiBqbZo5rZGlOADNQJ1oTWDbnRoD+lmsh43qCB6s7DNaO1ObkGeZXLZ5rKxmUuUz2VKdFgvB6unGQwhmK55RwycKngeDlJ+jxTTQQXF5KaCy7XiS8yTcxl47gcmSXdABGJ/yKjTDO4cD7ugrV0IQMTz+XIDBmYkglcrmaQgfUpAaPM/yQsupDFl4qXiMxZWoZxb2gpwILNzhYZyWH+SF5JLh4UIUsPGE36D+kBcxrRuSCxiD1FUMogyof9gOG7n8TjaBF+kiUYnrXQzQ9GFZvAsC0GTu5TZL9GAkMvsS0OGEf3sZFfRz9qsMES3P6H5A12g+2o2uSvtlzUWmARPpGeYNhHEhoYuoWt1fawAQcM3ygiWWv8dgQgfFbS3KuE3+5vCf/zrd4PXowSS3JFUO+lCkvflx0JV/qHkrAkYIylglHdDqeWMrrL4dTrdLIORJrFIMswlnZg0twML6q1yZVQMojbgtH9N0FTW1eK3Jl0O3IRxN1e5xgjiNkAeUZCwtupmSaPah2hmVYzYOhIjhkntQLGtLq8s4pXKy3lAblDNtQ5CuhnOu1JpgmePVyL+sNxU1twElaZbhNNiLbUFOybzTbSTzQvI83uh+xstrnEAwGo0T7appFOXdvbsYop8KeAzSzACq/gSrChwkDuBBjGaZR/ZdJk0+remsE/O8hPuOTVlOw/+1LMW0D3ZsgXPh8no+X0uOCs8Ps/6OyQ4dWBi5TRzW+MjvFka0fKwAFTtuMBjmcdOqkHori5StoGReo3cD1+3ICNm49DAtm4tKj55o+dZKqFTeMZWvWIyat9tG7EiBoMqFgTmrMeqWSAG603Wpe2oGAD3mAEoul41w0jFdaE5ox3FBpgNXX30aK+OMFQhmsm449wMKTppzO00E1w5f0YElpI5cCaYrtGpi+TYTXmr5J1Fz+pcHq5IWTyWkmjrhJbZFe2ANasTBAZPycrweV0FjMoxOVidphn2fN+paPncVjDrlESzT4XzmhFNNlupUUa34kn2+uDlUr8N9lmY6dogs3a7OaXXkgv0W8sZvGF9PodyEt7CIimjcZ5aaRZ374xswU70FeLGumpCoK+QlZHhk36mHmGagL2uTELH5KfWk/lQX43faCV/4l7xk+l1dOlmlZy/aC8pG/d1Ausoj3p9XI/UFnAXoaxrhR7e+xKjMVK8wh7Ddb1U/M/1KmrvHpJl/1/yVE3eJEGKbUAAAAASUVORK5CYII="
                  }
                  alt={user?.name}
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
                      className="text-3xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                      {user?.name}
                    </h1>
                  )}
                  <p className="text-slate-500 font-medium mt-1">
                    {user?.email}
                  </p>
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
                <div className="flex items-center space-x-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-700">
                    {user?.rating.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {user?.location || "Remote"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Joined Jan 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-10 pt-10 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
              About Me
            </h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-slate-600 leading-relaxed text-lg italic">
                {user?.bio || "No bio added yet."}
              </p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Teaching Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                Skills I Teach
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5 min-h-[40px]">
              {teachingSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors gap-2 text-sm font-semibold group"
                >
                  {skill.name}
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {teachingSkills.length === 0 && (
                <p className="text-slate-400 italic">
                  No teaching skills listed
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSkill(Number(e.target.value), "TEACH");
                    e.target.value = "";
                  }
                }}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="">+ Add a skill to teach...</option>
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
              {availableSkills.length === 0 && !error && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-amber-600 italic">
                    No skills loaded.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Refresh List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Learning Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="w-2 h-8 bg-purple-500 rounded-full" />
                Skills I want to learn
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5 min-h-[40px]">
              {learningSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 transition-colors gap-2 text-sm font-semibold group"
                >
                  {skill.name}
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {learningSkills.length === 0 && (
                <p className="text-slate-400 italic">
                  No learning skills listed
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSkill(Number(e.target.value), "LEARN");
                    e.target.value = "";
                  }
                }}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              >
                <option value="">+ Add a skill to learn...</option>
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
              {availableSkills.length === 0 && !error && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-blue-600 hover:underline block"
                >
                  Retry loading skills
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-green-50 rounded-xl">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Weekly Availability
              </h2>
            </div>
            {!isAddingAvailability && (
              <Button
                onClick={() => setIsAddingAvailability(true)}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Time
              </Button>
            )}
          </div>

          {isAddingAvailability && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Mon 10:00 - 12:00"
                value={newAvailabilityTime}
                onChange={(e) => setNewAvailabilityTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAvailability()}
                className="flex-1 p-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                  className="text-slate-500 flex-1 sm:flex-none"
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
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-green-200 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-slate-700 font-medium">{time}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAvailability(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove availability"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 col-span-full italic py-4">
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
