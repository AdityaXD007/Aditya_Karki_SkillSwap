import React from "react";
import { Star, Calendar, MessageCircle, BookOpen } from "lucide-react";
import type { Match } from "@/services/api";

interface SkillCardProps {
  match: Match;
  onConnect?: (matchId: number) => void;
  onBookSession?: (matchId: number) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  match,
  onConnect,
  onBookSession,
}) => {
  const { teacher, skills } = match as any;

  // Handle both old format (single skill) and new format (multiple skills)
  const skillList = skills || (match.skill ? [match.skill] : []);
  const matchId = match.id || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <img
          src={
            teacher.profile_image ||
            `https://ui-avatars.com/api/?name=${teacher.full_name}&background=random`
          }
          alt={teacher.full_name || teacher.username}
          className="w-16 h-16 rounded-full object-cover"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {teacher.full_name || teacher.username}
            </h3>
            <div className="flex items-center space-x-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded-full">
              <span className="font-medium text-xs">Active</span>
            </div>
          </div>

          {/* Rating (Placeholder) */}
          <div className="flex items-center space-x-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm text-gray-700">5.0</span>
            <span className="text-sm text-gray-500">rating</span>
          </div>

          {/* Bio */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {teacher.bio || "No bio available"}
          </p>

          {/* Skills */}
          <div className="space-y-2 mb-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Can Teach:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {skillList.map((skill: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {skill.name} ({skill.proficiency_level})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => onConnect?.(matchId)}
              className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect</span>
            </button>
            <button
              onClick={() => onBookSession?.(matchId)}
              className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
