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
  X,
  CalendarClock,
  Ban,
  MessageSquare,
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

  // Proposed time from the student
  proposedTime?: string | null;

  // Reschedule proposal fields
  rescheduleRequestedTime?: string;
  rescheduleReason?: string;
  rescheduleRequestedBy?: number;
}

export const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<{
    id: number;
    msg: string;
  } | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState<number | null>(
    null,
  );

  // Cancel state
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState<number | null>(
    null,
  );
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Proposal actions state
  const [proposalLoading, setProposalLoading] = useState<number | null>(null);

  // Accept modal state
  const [showAcceptModal, setShowAcceptModal] = useState<number | null>(null);
  const [acceptDate, setAcceptDate] = useState("");
  const [acceptTime, setAcceptTime] = useState("");
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptingItem, setAcceptingItem] = useState<DisplayBooking | null>(null);

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
        const partner = isRequester
          ? req.partner_details
          : req.requester_details;

        displayItems.push({
          id: req.id,
          isRequest: true,
          skill: req.skill_learn_details?.name || "Skill Exchange",
          partnerName:
            partner?.full_name || partner?.username || "Unknown User",
          partnerAvatar: partner?.profile_image || undefined,
          date: new Date(req.created_at),
          time: req.proposed_time
            ? new Date(req.proposed_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBD",
          duration: req.session_length,
          location: "Online",
          type: isRequester ? "learning" : "teaching",
          status: req.status,
          requesterUsername: req.requester_details?.username || "",
          proposedTime: req.proposed_time,
        });
      });

      // Map Sessions (Confirmed/Scheduled)
      sessionsRes.data.forEach((sess: any) => {
        const isTeacher =
          sess.teacher_name === user?.name ||
          sess.teacher_name === user?.username;
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
          status: sess.status === "SCHEDULED" ? "ACCEPTED" : sess.status,
          requesterUsername: sess.student_username || "",

          rescheduleRequestedTime: sess.reschedule_requested_time,
          rescheduleReason: sess.reschedule_reason,
          rescheduleRequestedBy: sess.reschedule_requested_by,
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

  const openAcceptModal = (item: DisplayBooking) => {
    setShowAcceptModal(item.id);
    setAcceptingItem(item);
    setAcceptError(null);
    // Pre-fill with proposed time if available
    if (item.proposedTime) {
      const dt = new Date(item.proposedTime);
      setAcceptDate(dt.toISOString().split("T")[0]);
      setAcceptTime(
        dt.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    } else {
      setAcceptDate("");
      setAcceptTime("");
    }
  };

  const handleAcceptConfirm = async () => {
    if (!showAcceptModal) return;
    try {
      setAcceptLoading(true);
      setAcceptError(null);
      const payload: { scheduled_time?: string } = {};
      if (acceptDate && acceptTime) {
        payload.scheduled_time = `${acceptDate}T${acceptTime}:00`;
      }
      await requestsAPI.acceptRequest(showAcceptModal, payload);
      setShowAcceptModal(null);
      setAcceptingItem(null);
      fetchData();
    } catch (e: any) {
      console.error("Failed to accept", e);
      setAcceptError(
        e?.response?.data?.error || "Failed to accept. Please try again.",
      );
    } finally {
      setAcceptLoading(false);
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
      setItems((prev) =>
        prev.filter((item) => !(item.isRequest && item.id === id)),
      );
      setShowWithdrawConfirm(null);
    } catch (e) {
      console.error("Failed to withdraw", e);
      setWithdrawError({ id, msg: "Failed to withdraw. Please try again." });
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleCancel = async () => {
    if (!showCancelModal || !cancelReason.trim()) return;
    try {
      setCancelLoading(true);
      setCancelError(null);
      await sessionsAPI.cancelSession(showCancelModal, cancelReason.trim());
      setShowCancelModal(null);
      setCancelReason("");
      fetchData();
    } catch (e: any) {
      console.error("Failed to cancel session", e);
      setCancelError(
        e?.response?.data?.error || "Failed to cancel. Please try again.",
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (
      !showRescheduleModal ||
      !rescheduleDate ||
      !rescheduleTime ||
      !rescheduleReason.trim()
    )
      return;
    try {
      setRescheduleLoading(true);
      setRescheduleError(null);
      const newTime = `${rescheduleDate}T${rescheduleTime}:00`;
      await sessionsAPI.rescheduleSession(
        showRescheduleModal,
        newTime,
        rescheduleReason.trim(),
      );
      setShowRescheduleModal(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
      fetchData();
    } catch (e: any) {
      console.error("Failed to reschedule session", e);
      setRescheduleError(
        e?.response?.data?.error || "Failed to reschedule. Please try again.",
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleAcceptReschedule = async (id: number) => {
    try {
      setProposalLoading(id);
      await sessionsAPI.acceptReschedule(id);
      fetchData();
    } catch (e) {
      console.error("Failed to accept reschedule", e);
    } finally {
      setProposalLoading(null);
    }
  };

  const handleRejectReschedule = async (id: number) => {
    try {
      setProposalLoading(id);
      await sessionsAPI.rejectReschedule(id);
      fetchData();
    } catch (e) {
      console.error("Failed to reject reschedule", e);
    } finally {
      setProposalLoading(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingItems = items.filter((b) => {
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;
    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);
    return (
      itemDate >= today && (b.status === "PENDING" || b.status === "ACCEPTED")
    );
  });

  const pastItems = items.filter((b) => {
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;
    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);
    return (
      itemDate < today && (b.status === "ACCEPTED" || b.status === "COMPLETED")
    );
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

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Sessions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your learning and teaching sessions
            </p>
          </div>

          <div className="mb-6 border-b border-gray-200 dark:border-slate-800">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "upcoming" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                Upcoming ({upcomingItems.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "past" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                Past ({pastItems.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : displayedItems.length > 0 ? (
            <div className="space-y-4">
              {displayedItems.map((item) => {
                const itemDate = new Date(item.date);
                const isExpired =
                  item.status === "PENDING" &&
                  Date.now() - itemDate.getTime() > 3 * 24 * 60 * 60 * 1000;
                const hasRescheduleProposal = !!item.rescheduleRequestedTime;
                const isIRequestedReschedule =
                  item.rescheduleRequestedBy === user?.id;

                return (
                  <div
                    key={`${item.isRequest ? "req" : "sess"}-${item.id}`}
                    className="flex flex-col"
                  >
                    {/* Reschedule Request Banner */}
                    {hasRescheduleProposal && (
                      <div
                        className={`z-10 -mb-2 px-4 py-2 rounded-t-lg border-x border-t flex items-center justify-between text-xs font-medium transition-colors ${isIRequestedReschedule ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" : "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400"}`}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-3.5 h-3.5" />
                          <span>
                            {isIRequestedReschedule
                              ? `Reschedule requested for ${new Date(item.rescheduleRequestedTime!).toLocaleString()}`
                              : `New time proposed: ${new Date(item.rescheduleRequestedTime!).toLocaleString()}`}
                          </span>
                          {item.rescheduleReason && (
                            <span className="flex items-center gap-1 opacity-75">
                              <MessageSquare className="w-3 h-3" />"
                              {item.rescheduleReason}"
                            </span>
                          )}
                        </div>
                        {!isIRequestedReschedule && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleAcceptReschedule(item.id)}
                              disabled={proposalLoading === item.id}
                              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              {proposalLoading === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectReschedule(item.id)}
                              disabled={proposalLoading === item.id}
                              className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-md hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {isIRequestedReschedule && (
                          <span className="italic opacity-80">
                            Waiting for partner to respond...
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow ${hasRescheduleProposal ? "rounded-t-none border-t-blue-100 dark:border-t-blue-900/40" : ""}`}
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
                              <span className="text-gray-400 dark:text-gray-600">
                                •
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === "teaching" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}
                              >
                                {item.type === "teaching"
                                  ? "Teaching"
                                  : "Learning"}
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
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 items-end">
                            {item.status === "PENDING" &&
                              item.requesterUsername === user?.username && (
                                <div className="relative">
                                  {showWithdrawConfirm === item.id ? (
                                    <div className="flex flex-col items-end gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Withdraw request?
                                      </span>
                                      <div className="flex gap-2">
                                        <button
                                          disabled={withdrawingId !== null}
                                          onClick={() =>
                                            handleWithdraw(item.id)
                                          }
                                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                        >
                                          {withdrawingId === item.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            "Confirm"
                                          )}
                                        </button>
                                        <button
                                          disabled={withdrawingId !== null}
                                          onClick={() =>
                                            setShowWithdrawConfirm(null)
                                          }
                                          className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setShowWithdrawConfirm(item.id)
                                      }
                                      className="text-sm text-red-600 dark:text-red-500 hover:underline font-medium flex items-center gap-1"
                                    >
                                      Withdraw
                                    </button>
                                  )}
                                  {withdrawError?.id === item.id && (
                                    <p className="text-[10px] text-red-600 mt-1">
                                      {withdrawError.msg}
                                    </p>
                                  )}
                                </div>
                              )}

                            {item.status === "PENDING" &&
                              item.type === "teaching" && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openAcceptModal(item)}
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

                            {item.status === "ACCEPTED" && !item.isRequest && (
                              <div className="flex items-center gap-2 mt-1">
                                {!isIRequestedReschedule && (
                                  <button
                                    onClick={() => {
                                      setShowRescheduleModal(item.id);
                                      setRescheduleError(null);
                                      setRescheduleReason("");
                                      setRescheduleDate("");
                                      setRescheduleTime("");
                                    }}
                                    disabled={hasRescheduleProposal}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border ${hasRescheduleProposal ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500" : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"}`}
                                  >
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    Reschedule
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setShowCancelModal(item.id);
                                    setCancelError(null);
                                    setCancelReason("");
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 dark:border-red-800"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
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
              <p className="text-gray-600 dark:text-gray-400">
                No {activeTab} sessions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals remain the same but improved design */}
      {showCancelModal !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Cancel Session
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelError(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Please explain why you're cancelling..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
              />
              {cancelError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cancelError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t dark:border-slate-800 font-bold">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelLoading}
                className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {cancelLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Propose New Time
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRescheduleModal(null);
                  setRescheduleError(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={rescheduleDate}
                  min={getMinDate()}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                />
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={3}
                placeholder="Why do you need to reschedule?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
              />
              {rescheduleError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {rescheduleError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t dark:border-slate-800 font-bold">
              <button
                onClick={() => setShowRescheduleModal(null)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={
                  !rescheduleDate ||
                  !rescheduleTime ||
                  !rescheduleReason.trim() ||
                  rescheduleLoading
                }
                className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {rescheduleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Request Modal */}
      {showAcceptModal !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Accept & Schedule
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Confirm the session time
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAcceptModal(null);
                  setAcceptingItem(null);
                  setAcceptError(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {acceptingItem?.proposedTime && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                  <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      Student proposed:{" "}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {new Date(acceptingItem.proposedTime).toLocaleString(
                        undefined,
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Date & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={acceptDate}
                    min={getMinDate()}
                    onChange={(e) => setAcceptDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                  <input
                    type="time"
                    value={acceptTime}
                    onChange={(e) => setAcceptTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Confirm or change the session time. Leave empty to use the default.
                </p>
              </div>
              {acceptError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {acceptError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t dark:border-slate-800 font-bold">
              <button
                onClick={() => {
                  setShowAcceptModal(null);
                  setAcceptingItem(null);
                }}
                className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptConfirm}
                disabled={acceptLoading}
                className="flex-1 px-4 py-2.5 text-white bg-green-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {acceptLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Accept & Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
