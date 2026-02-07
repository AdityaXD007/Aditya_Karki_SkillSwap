import React from "react";
import { Link } from "react-router-dom";
import { Star, Calendar, BookOpen, User } from "lucide-react";
import type { Match } from "@/services";

interface SkillCardProps {
  match: Match;
  onBookSession?: (matchId: number) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  match,
  onBookSession,
}) => {
  const { teacher, skills } = match as any;

  // Handle both old format (single skill) and new format (multiple skills)
  const skillList = skills || (match.skill ? [match.skill] : []);
  const matchId = match.id || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <Link to={`/profile/${teacher.id}`} className="flex-shrink-0 transition-transform hover:scale-110">
          <img
            src={
              teacher.profile_image_url ||
              teacher.profile_image ||
              `https://ui-avatars.com/api/?name=${teacher.username}&background=random`
            }
            alt={teacher.username}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-500 transition-all shadow-sm"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Link to={`/profile/${teacher.id}`} className="group">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                {teacher.username}
              </h3>
            </Link>
            <div className="flex items-center space-x-1 text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-100 dark:border-green-800">
              <span className="font-medium text-[10px] uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Rating (Placeholder) */}
          <div className="flex items-center space-x-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">5.0</span>
            <span className="text-sm text-gray-500 dark:text-gray-500">rating</span>
          </div>

          {/* Bio */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {teacher.bio || "No bio available"}
          </p>

          {/* Skills */}
          <div className="space-y-2 mb-4">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Can Teach:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {skillList.map((skill: any, idx: number) => {
                  const name = skill.name || skill.skill_details?.name;
                  const iconClass =
                    skill.icon_class || skill.skill_details?.icon_class;
                  const colorClass =
                    skill.color_class || skill.skill_details?.color_class;
                  const proficiency =
                    skill.proficiency_level || skill.proficiency;

                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800"
                    >
                      {iconClass && (
                        <i
                          className={`${iconClass} ${
                            colorClass || "text-blue-500"
                          } mr-1.5`}
                        ></i>
                      )}
                      {name} {proficiency && `(${proficiency})`}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Link
              to={`/profile/${teacher.id}`}
              className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </Link>
            <button
              onClick={() => onBookSession?.(matchId)}
              className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
