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
} from "lucide-react";

// Unified type for display
interface DisplayBooking {
  id: number;
  isRequest: boolean; // true if from requestsAPI, false if from sessionsAPI
  skill: string;
  partnerName: string;
  partnerAvatar?: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: "teaching" | "learning" | "unknown";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  rawStatus: string;
}

export const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, requestsRes] = await Promise.all([
        sessionsAPI.getSessions(),
        requestsAPI.getRequests(),
      ]);

      const displayItems: DisplayBooking[] = [];

      // Map Requests (Pending stuff mostly)
      requestsRes.data.forEach((req) => {
        const isRequester = req.requester_details?.username === user?.username;
        const partner = isRequester
          ? req.partner_details
          : req.requester_details;

        displayItems.push({
          id: req.id,
          isRequest: true,
          skill: req.skill_learn_details?.name || "Skill Exchange",
          partnerName: partner?.full_name || partner?.username || "Unknown User",
          partnerAvatar: partner?.profile_image || undefined,
          date: new Date(req.created_at).toLocaleDateString(), // Requests don't have scheduled time yet usually
          time: "TBD",
          duration: req.session_length,
          location: "Online",
          type: isRequester ? "learning" : "teaching", // If I requested, I want to learn (usually)
          status: req.status.toLowerCase() as any, // PENDING, ACCEPTED, REJECTED
          rawStatus: req.status,
        });
      });

      // Map Sessions (Confirmed/Scheduled)
      sessionsRes.data.forEach((sess) => {
        // We need to deduce if we are teacher or student.
        // The API returns student_name and teacher_name.
        // We can compare with user.name or user.username if available.
        // Ideally the API should return normalized "partner" info, but let's guess.
        const headerName = user?.username || user?.name?.split("@")[0] || "";
        const isTeacher = sess.teacher_name === headerName;

        const partnerName = isTeacher ? sess.student_name : sess.teacher_name;

        // Status mapping
        let status: "confirmed" | "completed" | "cancelled" = "confirmed";
        if (sess.status === "COMPLETED") status = "completed";
        if (sess.status === "CANCELLED") status = "cancelled";

        displayItems.push({
          id: sess.id,
          isRequest: false,
          skill: sess.skill_name,
          partnerName: partnerName,
          partnerAvatar: undefined, // Session doesn't include avatar yet
          date: new Date(sess.scheduled_time).toLocaleDateString(),
          time: new Date(sess.scheduled_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: sess.duration,
          location: sess.meeting_link || "Online",
          type: isTeacher ? "teaching" : "learning",
          status: status,
          rawStatus: sess.status,
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
    fetchData();
  }, [user]); // Re-fetch if user changes, to re-calcluate "isTeacher" logic

  const handleAccept = async (id: number) => {
    try {
      await requestsAPI.acceptRequest(id);
      fetchData(); // Refresh list
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

  // Filtering
  const upcomingItems = items.filter(
    (b) =>
      b.status === "confirmed" ||
      b.status === "pending" ||
      b.rawStatus === "ACCEPTED",
  );
  // Past items
  const pastItems = items.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.rawStatus === "REJECTED",
  );

  const displayedItems = activeTab === "upcoming" ? upcomingItems : pastItems;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "ACCEPTED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed":
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelled":
      case "rejected":
      case "CANCELLED":
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
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
            {displayedItems.map((item) => (
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
                          <span>{item.date}</span>
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.rawStatus)}`}
                    >
                      {item.rawStatus}
                    </span>
                    {/* Show Accept/Reject only for pending requests where I am the recipient (teaching) */}
                    {item.isRequest &&
                      item.rawStatus === "PENDING" &&
                      item.type === "teaching" && (
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
            ))}
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
