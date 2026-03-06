import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import {
  matchesApi,
  sessionsAPI,
  requestsAPI,
  type Match,
  type LearningSession,
  type SessionRequest,
} from "@/services";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const taughtCount = user?.sessionsTaughtCount || 0;
  const isProUnlocked = taughtCount >= 5;
  const [matches, setMatches] = useState<Match[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<LearningSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesResponse, sessionsResponse, requestsResponse] = await Promise.all([
          matchesApi.getRecommended(),
          sessionsAPI.getSessions(),
          requestsAPI.getRequests(),
        ]);
        
        setMatches(matchesResponse.data.slice(0, 3));
        setUpcomingSessions(
          sessionsResponse.data
            .filter((s) => s.status === "SCHEDULED")
            .slice(0, 3),
        );

        // Filter for requests where the current user is the partner (recipient)
        if (Array.isArray(requestsResponse.data)) {
          const pending = requestsResponse.data.filter(
            (req: any) => req.status === "PENDING" && req.partner_details?.username === user?.username
          );
          setPendingRequests(pending);
        } else {
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username || user?.name?.split("@")[0]}! 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your learning journey
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Teaching Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {user?.skillsTeaching.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Learning Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {user?.skillsLearning.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isProUnlocked ? "Total Lessons Taught" : "Lessons Taught"}
                </p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {taughtCount}
                  </p>
                  {!isProUnlocked && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">/ 5 for Pro</p>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isProUnlocked ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${isProUnlocked ? 100 : Math.min((taughtCount / 5) * 100, 100)}%` }}
              ></div>
            </div>
            {user?.canCharge && (
              <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">✨ Pro Mode Eligible</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Lessons Learned
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {user?.sessionsLearnedCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Match Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {user?.rating || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    You have {pendingRequests.length} new session {pendingRequests.length === 1 ? 'request' : 'requests'}!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Other users want to learn from you. Head over to the sessions page to accept or decline.
                  </p>
                  <Link
                    to="/bookings"
                    className="inline-flex items-center space-x-2 mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                  >
                    <span>Manage Requests</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Upcoming Sessions
                </h2>
                <Link
                  to="/bookings"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {(session.teacher_name || "U")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {session.skill_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          with {session.teacher_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(
                            session.scheduled_time,
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-end">
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
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Matches</h2>
                <Link
                  to="/matches"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  See more
                </Link>
              </div>

              <div className="space-y-4">
                {matches
                  .map((match: any) => {
                    const skills = match.skills || (match.skill ? [match.skill] : []);
                    if (skills.length === 0) return null;
                    
                    const firstSkill = skills[0];
                    const skillName = firstSkill.name || firstSkill.skill_details?.name;
                    const iconClass = firstSkill.icon_class || firstSkill.skill_details?.icon_class;
                    const colorClass = firstSkill.color_class || firstSkill.skill_details?.color_class;
                    const proficiency = match.proficiency_level || firstSkill.proficiency_level || firstSkill.proficiency;

                    return (
                      <div key={match.id} className="flex items-center space-x-3">
                        <img
                          src={
                            match.teacher?.profile_image_url ||
                            match.teacher?.profile_image ||
                            `https://ui-avatars.com/api/?name=${match.teacher?.username || 'user'}&background=random`
                          }
                          alt={match.teacher.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {match.teacher.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                            {iconClass && (
                              <i
                                className={`${iconClass} ${
                                  colorClass || "text-blue-500"
                                } mr-1.5`}
                              ></i>
                            )}
                            Teaches {skillName || "Unknown skill"}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          {proficiency}
                        </span>
                      </div>
                    );
                  })}
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
