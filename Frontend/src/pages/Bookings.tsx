import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sessionsAPI, requestsAPI, paymentAPI, type LearningSession } from "@/services";
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
  Star,
  ExternalLink,
  Wallet,
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

  // Feedback fields
  ratingByStudent?: number | null;
  ratingByTeacher?: number | null;
  feedbackByStudent?: string;
  feedbackByTeacher?: string;

  // Session IDs for teacher/student
  studentId?: number;
  teacherId?: number;
  partnerId?: number;

  // Pricing
  price?: number | string;
  isFree?: boolean;
  isPaid?: boolean;
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

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratedSessions, setRatedSessions] = useState<Set<number>>(new Set());

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
          partnerId: partner?.id,
          location: partner?.location || "Online",
          price: 0,
          isFree: true,
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
          meetingLink: sess.meeting_link,
          location: sess.meeting_link || partner?.location || "Online",
          type: isTeacher ? "teaching" : "learning",
          status: sess.status === "SCHEDULED" ? "ACCEPTED" : sess.status,
          requesterUsername: sess.student_username || "",

          rescheduleRequestedTime: sess.reschedule_requested_time,
          rescheduleReason: sess.reschedule_reason,
          rescheduleRequestedBy: sess.reschedule_requested_by,

          ratingByStudent: sess.rating_by_student,
          ratingByTeacher: sess.rating_by_teacher,
          feedbackByStudent: sess.feedback_by_student,
          feedbackByTeacher: sess.feedback_by_teacher,
          studentId: sess.student,
          teacherId: sess.teacher,
          partnerId: isTeacher ? sess.student : sess.teacher,
          price: sess.total_price,
          isFree: sess.is_free,
          isPaid: sess.is_paid,
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

  const handleEndSession = async (id: number) => {
    if (!window.confirm("Are you sure you want to end this session?")) return;
    try {
      await sessionsAPI.endSession(id);
      fetchData();
    } catch (e) {
      console.error("Failed to end session", e);
    }
  };

  const handleInitiatePayment = async (sessionId: number, method: string) => {
    setIsProcessingPayment(true);
    try {
      const response = await paymentAPI.initiatePayment(sessionId, 1000, method);
      if (response.data && response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        alert("Failed to initiate payment. Please try again.");
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert("An error occurred while initiating payment.");
      setIsProcessingPayment(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingItems = items.filter((b) => {
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;

    // Hide accepted requests to avoid duplicates with actual session cards
    if (b.isRequest && b.status === "ACCEPTED") return false;

    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);
    
    // ACCEPTED and ONGOING are always "Active" sessions, keep them in upcoming regardless of date
    if (b.status === "ACCEPTED" || b.status === "ONGOING") return true;

    // For PENDING, show only if it's today or in the future
    return itemDate >= today && b.status === "PENDING";
  });

  const pastItems = items.filter((b) => {
    if (b.status === "EXPIRED" || b.status === "WITHDRAWN") return false;
    
    // Hide completed requests to avoid duplicates with actual session cards
    if (b.isRequest && b.status === "COMPLETED") return false;

    // Always show terminal states in Past tab
    if (b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "REJECTED") return true;
    
    const itemDate = new Date(b.date);
    itemDate.setHours(0, 0, 0, 0);

    // PENDING requests that are old go to past
    return itemDate < today && b.status === "PENDING";
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
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "ONGOING":
        return "bg-green-100 text-green-700 dark:bg-green-900/10 dark:text-green-400 border border-green-200 dark:border-green-800";
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
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Wallet className="w-4 h-4" />
                                <span>
                                  {item.isFree
                                    ? "Free"
                                    : `Rs. ${item.price || 0}`}
                                </span>
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
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(item.status)}`}
                            >
                              {item.status === "ONGOING" && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                              )}
                              {item.status === "ONGOING" ? "LIVE" : item.status}
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

                            {/* Go to Chat Button */}
                            {(item.status === "ACCEPTED" ||
                              item.status === "ONGOING" ||
                              item.status === "PENDING") &&
                              item.partnerId && (
                                <Link
                                  to="/messages"
                                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 mt-2"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Go to Chat
                                </Link>
                              )}

                            {/* End Session Button for Teacher */}
                            {item.status === "ONGOING" &&
                              item.type === "teaching" && (
                                <button
                                  onClick={() => handleEndSession(item.id)}
                                  className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1.5 font-medium border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mt-2"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  End Session
                                </button>
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
                                 {item.type === "learning" && !item.isPaid && !item.isFree && (
                                    <button
                                      onClick={() => setShowPaymentModal(item.id)}
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                    >
                                      <Wallet className="w-4 h-4" />
                                      Pay Rs. {item.price}
                                    </button>
                                 )}
                                 {item.type === "learning" && item.isPaid && !item.isFree && (
                                    <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Paid
                                    </div>
                                 )}
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

                            {/* Rate Session button for COMPLETED sessions */}
                            {item.status === "COMPLETED" && !item.isRequest && (() => {
                              const isStudent = Number(user?.id) === Number(item.studentId);
                              const isTeacher = Number(user?.id) === Number(item.teacherId);
                              const hasRated = isStudent
                                ? (item.ratingByStudent != null || ratedSessions.has(item.id))
                                : isTeacher
                                ? (item.ratingByTeacher != null || ratedSessions.has(item.id))
                                : true;
                              
                              if (hasRated) {
                                const myRating = isStudent ? item.ratingByStudent : item.ratingByTeacher;
                                return (
                                  <div className="flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Rated</span>
                                    {myRating && (
                                      <span className="flex items-center gap-0.5 ml-1">
                                        {[1,2,3,4,5].map(s => (
                                          <Star key={s} className={`w-3 h-3 ${s <= myRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        ))}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={() => {
                                    setShowRatingModal(item.id);
                                    setRatingValue(0);
                                    setRatingHover(0);
                                    setFeedbackText("");
                                    setRatingError(null);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 mt-1"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  Rate Session
                                </button>
                              );
                            })()}
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

      {/* Rating Modal */}
      {showRatingModal !== null && (() => {
        const ratingItem = items.find(i => !i.isRequest && i.id === showRatingModal);
        const isStudent = Number(user?.id) === Number(ratingItem?.studentId);
        const submittedBy = isStudent ? 'student' as const : 'teacher' as const;

        const handleSubmitRating = async () => {
          if (!ratingValue) return;
          try {
            setRatingLoading(true);
            setRatingError(null);
            await sessionsAPI.submitFeedback(showRatingModal, ratingValue, feedbackText.trim(), submittedBy);
            setRatedSessions(prev => new Set(prev).add(showRatingModal));
            // Update the item in local state
            setItems(prev => prev.map(it => {
              if (!it.isRequest && it.id === showRatingModal) {
                return isStudent
                  ? { ...it, ratingByStudent: ratingValue, feedbackByStudent: feedbackText }
                  : { ...it, ratingByTeacher: ratingValue, feedbackByTeacher: feedbackText };
              }
              return it;
            }));
            setShowRatingModal(null);
          } catch (e: any) {
            setRatingError(e?.response?.data?.error || 'Failed to submit rating. Please try again.');
          } finally {
            setRatingLoading(false);
          }
        };

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rate Session</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">How was your experience?</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowRatingModal(null); setRatingError(null); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Star Selector */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingValue(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (ratingHover || ratingValue)
                              ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {ratingValue === 1 ? 'Poor' : ratingValue === 2 ? 'Fair' : ratingValue === 3 ? 'Good' : ratingValue === 4 ? 'Very Good' : ratingValue === 5 ? 'Excellent' : 'Select a rating'}
                  </p>
                </div>

                {/* Feedback Text */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  placeholder="Share your experience (optional)..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm resize-none outline-none transition-all"
                />

                {ratingError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {ratingError}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-5 border-t dark:border-slate-800 font-bold">
                <button
                  onClick={() => setShowRatingModal(null)}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={!ratingValue || ratingLoading}
                  className="flex-1 px-4 py-2.5 text-white bg-amber-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {ratingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {showPaymentModal !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Secure Payment</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose your payment method</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(null)} 
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isProcessingPayment ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Redirecting to payment gateway...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleInitiatePayment(showPaymentModal, 'KHALTI')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-purple-100 dark:border-purple-900/20 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xs font-sans">K</span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Khalti</p>
                        <p className="text-[10px] text-gray-500">Pay via Khalti Wallet / SDK</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleInitiatePayment(showPaymentModal, 'STRIPE')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900/20 hover:border-blue-500 dark:hover:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xs font-sans">S</span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Stripe / Card</p>
                        <p className="text-[10px] text-gray-500">Global Credit/Debit Cards</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 text-center">
              <p className="text-[10px] text-gray-400 font-medium">Your payment is secured and encrypted</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
