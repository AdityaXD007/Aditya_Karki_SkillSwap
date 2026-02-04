import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import {
  matchesApi,
  sessionsAPI,
  type Match,
  type LearningSession,
} from "@/services/api";
import { Calendar, Users, BookOpen, TrendingUp, Clock } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<LearningSession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesResponse, sessionsResponse] = await Promise.all([
          matchesApi.getRecommended(),
          sessionsAPI.getSessions(),
        ]);
        setMatches(matchesResponse.data.slice(0, 3));
        setUpcomingSessions(
          sessionsResponse.data
            .filter((s) => s.status === "SCHEDULED")
            .slice(0, 3),
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username || user?.name?.split("@")[0]}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your learning journey
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Teaching Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user?.skillsTeaching.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Learning Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user?.skillsLearning.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Upcoming Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {upcomingSessions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Match Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user?.rating || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Sessions
                </h2>
                <Link
                  to="/bookings"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {(session.teacher_name || "U")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {session.skill_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          with {session.teacher_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(
                            session.scheduled_time,
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(session.scheduled_time).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No upcoming sessions</p>
                    <Link
                      to="/matches"
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Find Learning Partners
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Matches */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Top Matches</h2>
                <Link
                  to="/matches"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  See more
                </Link>
              </div>

              <div className="space-y-4">
                {matches
                  .filter((match) => match.skill)
                  .map((match) => (
                    <div key={match.id} className="flex items-center space-x-3">
                      <img
                        src={
                          match.teacher.profile_image ||
                          `https://ui-avatars.com/api/?name=${match.teacher.full_name}&background=random`
                        }
                        alt={match.teacher.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {match.teacher.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Teaches {match.skill?.name || "Unknown skill"}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {match.proficiency_level}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/matches"
                  className="block w-full text-left px-4 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <p className="font-medium">Find Learning Partners</p>
                  <p className="text-sm text-white text-opacity-90">
                    Browse skill matches
                  </p>
                </Link>
                <Link
                  to="/profile"
                  className="block w-full text-left px-4 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <p className="font-medium">Update Profile</p>
                  <p className="text-sm text-white text-opacity-90">
                    Add skills & availability
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
