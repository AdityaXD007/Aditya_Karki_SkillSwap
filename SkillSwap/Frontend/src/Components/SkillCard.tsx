import React from 'react';
import { Star, Calendar, MessageCircle } from 'lucide-react';
import type { Match } from '@/services/api';

interface SkillCardProps {
  match: Match;
  onConnect?: (matchId: string) => void;
  onBookSession?: (matchId: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ match, onConnect, onBookSession }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <img
          src={match.avatar}
          alt={match.name}
          className="w-16 h-16 rounded-full object-cover"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{match.name}</h3>
            <div className="flex items-center space-x-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded-full">
              <span className="font-medium">{match.matchScore}%</span>
              <span className="text-xs">Match</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm text-gray-700">{match.rating}</span>
            <span className="text-sm text-gray-500">rating</span>
          </div>

          {/* Bio */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{match.bio}</p>

          {/* Skills */}
          <div className="space-y-2 mb-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Can Teach:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.skillsOffered.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Wants to Learn:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.skillsWanted.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Availability */}
          {match.availability && match.availability.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500 uppercase">Available:</span>
              <p className="text-sm text-gray-600 mt-1">{match.availability[0]}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => onConnect?.(match.id)}
              className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect</span>
            </button>
            <button
              onClick={() => onBookSession?.(match.id)}
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
