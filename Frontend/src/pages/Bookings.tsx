import React, { useState, useEffect } from "react";
import { sessionsAPI, requestsAPI } from "@/services";
import { useAuth } from "@/components/Context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Unified type for display
interface DisplayBooking {
  id: number;
  isRequest: boolean;
  skill: string;
  partnerName: string;
  partnerAvatar?: string;
  date: Date;
  time: string;
  duration: number;
  location: string;
  type: "teaching" | "learning";
  status: string; // PENDING, ACCEPTED, COMPLETED, EXPIRED, WITHDRAWN, CANCELLED, etc.
  requesterUsername: string;
}

export const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<{ id: number; msg: string } | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, requestsRes] = await Promise.all([
        sessionsAPI.getSessions(),
        requestsAPI.getRequests(),
      ]);

      const displayItems: DisplayBooking[] = [];

      // Map Requests (Pending stuff mostly)
      requestsRes.data.forEach((req: any) => {
        const isRequester = req.requester_details?.username === user?.username;
        const partner = isRequester ? req.partner_details : req.requester_details;

        displayItems.push({
          id: req.id,
          isRequest: true,
          skill: req.skill_learn_details?.name || "Skill Exchange",
          partnerName: partner?.full_name || partner?.username || "Unknown User",
          partnerAvatar: partner?.profile_image || undefined,
          date: new Date(req.created_at), // Requests use created date until scheduled
          time: "TBD",
          duration: req.session_length,
          location: "Online",
          type: isRequester ? "learning" : "teaching",
          status: req.status,
          requesterUsername: req.requester_details?.username || "",
        });
      });

      // Map Sessions (Confirmed/Scheduled)
      sessionsRes.data.forEach((sess: any) => {
        const isTeacher = sess.teacher_name === user?.name || sess.teacher_name === user?.username;
        const partnerName = isTeacher ? sess.student_name : sess.teacher_name;

        displayItems.push({
          id: sess.id,
          isRequest: false,
          skill: sess.skill_name,
          partnerName: partnerName,
          partnerAvatar: undefined,
          date: new Date(sess.scheduled_time),
          time: new Date(sess.scheduled_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: sess.duration,
          location: sess.meeting_link || "Online",
          type: isTeacher ? "teaching" : "learning",
          status: sess.status === 'SCHEDULED' ? 'ACCEPTED' : sess.status, // Map SCHEDULED to ACCEPTED for UI as requested
          requesterUsername: sess.student_username || "",
        });
      });

      setItems(displayItems);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleAccept = async (id: number) => {
    try {
      await requestsAPI.acceptRequest(id);
      fetchData();
    } catch (e) {
      console.error("Failed to accept", e);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await requestsAPI.rejectRequest(id);
      fetchData();
    } catch (e) {
      console.error("Failed to reject", e);
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      setWithdrawingId(id);
      setWithdrawError(null);
      await requestsAPI.withdrawRequest(id);
      
      // Feature 1: Silently remove card on success (without notifying current user, but here we just update UI)
      setItems(prev => prev.filter(item => !(item.isRequest && item.id === id)));
      setShowWithdrawConfirm(null);
    } catch (e) {
      console.error("Failed to withdraw", e);
      setWithdrawError({ id, msg: "Failed to withdraw. Please try again." });
    } finally {
      setWithdrawingId(null);
    }
  };

  // Feature 2 & 3: Tabs Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingItems = items.filter((b) => {
    // Hidden everywhere: EXPIRED and WITHDRAWN
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;
    
    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);

    // Upcoming: session_date >= today AND status is PENDING or ACCEPTED
    return itemDate >= today && (b.status === "PENDING" || b.status === "ACCEPTED");
  });

  const pastItems = items.filter((b) => {
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;

    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);

    // Past: session_date < today AND status is ACCEPTED or COMPLETED
    return itemDate < today && (b.status === "ACCEPTED" || b.status === "COMPLETED");
  });

  const displayedItems = activeTab === "upcoming" ? upcomingItems : pastItems;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ACCEPTED":
      case "SCHEDULED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "EXPIRED":
        return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-400";
      case "WITHDRAWN":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "CANCELLED":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your learning and teaching sessions
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-slate-800">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "upcoming"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Upcoming ({upcomingItems.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "past"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Past ({pastItems.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : displayedItems.length > 0 ? (
          <div className="space-y-4">
            {displayedItems.map((item) => {
              const itemDate = new Date(item.date);
              const isExpired = item.status === "PENDING" && (Date.now() - itemDate.getTime()) > (3 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={`${item.isRequest ? "req" : "sess"}-${item.id}`}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        {item.partnerAvatar ? (
                          <img
                            src={item.partnerAvatar}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (item.partnerName || "U")[0]
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {item.skill}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span>with {item.partnerName}</span>
                          <span className="text-gray-400 dark:text-gray-600">•</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.type === "teaching"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            }`}
                          >
                            {item.type === "teaching" ? "Teaching" : "Learning"}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{itemDate.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {item.time} ({item.duration} min)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 col-span-2">
                            <MapPin className="w-4 h-4" />
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center gap-2">
                        {isExpired && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium dark:bg-slate-800 dark:text-gray-400">
                            Expired
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 items-end">
                        {/* Withdraw Button: Visible only to requester and only on PENDING sessions */}
                        {item.status === "PENDING" && item.requesterUsername === user?.username && (
                          <div className="relative">
                            {showWithdrawConfirm === item.id ? (
                              <div className="flex flex-col items-end gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Withdraw request?</span>
                                <div className="flex gap-2">
                                  <button
                                    disabled={withdrawingId !== null}
                                    onClick={() => handleWithdraw(item.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                  >
                                    {withdrawingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                                  </button>
                                  <button
                                    disabled={withdrawingId !== null}
                                    onClick={() => setShowWithdrawConfirm(null)}
                                    className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowWithdrawConfirm(item.id)}
                                className="text-sm text-red-600 dark:text-red-500 hover:underline font-medium flex items-center gap-1"
                              >
                                Withdraw
                              </button>
                            )}
                            {withdrawError?.id === item.id && (
                              <p className="text-[10px] text-red-600 mt-1">{withdrawError.msg}</p>
                            )}
                          </div>
                        )}

                        {/* Accept/Reject: Only for pending recipients (teaching) */}
                        {item.status === "PENDING" && item.type === "teaching" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAccept(item.id)}
                              className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Accept Request"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="p-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No {activeTab} sessions</p>
          </div>
        )}
      </div>
    </div>
  );
};
