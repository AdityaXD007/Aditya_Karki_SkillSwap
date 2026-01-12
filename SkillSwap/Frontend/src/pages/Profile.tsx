import React, { useState } from 'react';
import { useAuth } from '@/components/Context/AuthContext';
import { Camera, Star, MapPin, Clock, Edit2, Save } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skillsTeaching: user?.skillsTeaching.join(', ') || '',
    skillsLearning: user?.skillsLearning.join(', ') || '',
  });

  const handleSave = () => {
    updateUser({
      name: formData.name,
      bio: formData.bio,
      skillsTeaching: formData.skillsTeaching.split(',').map(s => s.trim()).filter(Boolean),
      skillsLearning: formData.skillsLearning.split(',').map(s => s.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              )}
              <p className="text-gray-600 mt-1">{user?.email}</p>
              <div className="flex items-center justify-center md:justify-start space-x-4 mt-3">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{user?.rating}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Remote</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600">{user?.bio}</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Teaching Skills */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Skills I Teach</h2>
            {isEditing ? (
              <input
                type="text"
                value={formData.skillsTeaching}
                onChange={(e) => setFormData({ ...formData, skillsTeaching: e.target.value })}
                placeholder="React, Node.js, TypeScript"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.skillsTeaching.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Learning Skills */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Skills I Want to Learn</h2>
            {isEditing ? (
              <input
                type="text"
                value={formData.skillsLearning}
                onChange={(e) => setFormData({ ...formData, skillsLearning: e.target.value })}
                placeholder="UI/UX, Figma, Design"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.skillsLearning.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Availability</h2>
          </div>
          <div className="space-y-2">
            {user?.availability?.map((time, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
