import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Trash2,
  ChevronRight,
  Lock,
  X,
  Key,
  AlertCircle,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import { authAPI } from "@/services";
import { motion, AnimatePresence } from "framer-motion";

interface SettingItem {
  icon: any;
  label: string;
  description: string;
  link?: string;
  action?: string;
  toggle?: boolean;
  active?: boolean;
  onToggle?: () => void;
  count?: number;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const Settings: React.FC = () => {
  const { user } = useAuth();

  // States for toggles
  const { updateUser } = useAuth();
  const [emailNotif, setEmailNotif] = useState(user?.emailNotificationsEnabled ?? true);
  const [pushNotif, setPushNotif] = useState(user?.pushNotificationsEnabled ?? false);
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Sync state when user data is available/changes
  React.useEffect(() => {
    if (user) {
      setEmailNotif(user.emailNotificationsEnabled);
      setPushNotif(user.pushNotificationsEnabled);
      setIsPublic(user.isPublic);
    }
  }, [user]);

  const performToggleEmail = async (value: boolean) => {
    setEmailNotif(value);
    try {
      await authAPI.updateProfile({ email_notifications_enabled: value });
      updateUser({ emailNotificationsEnabled: value });
    } catch (err) {
      console.error("Failed to update email notification preference:", err);
      setEmailNotif(!value);
    }
  };

  const performTogglePush = async (value: boolean) => {
    setPushNotif(value);
    try {
      await authAPI.updateProfile({ push_notifications_enabled: value });
      updateUser({ pushNotificationsEnabled: value });
    } catch (err) {
      console.error("Failed to update push notification preference:", err);
      setPushNotif(!value);
    }
  };

  const performTogglePublic = async (value: boolean) => {
    setIsPublic(value);
    try {
      await authAPI.updateProfile({ is_public: value });
      updateUser({ isPublic: value });
    } catch (err) {
      console.error("Failed to update privacy preference:", err);
      setIsPublic(!value);
    }
  };

  const handleToggleEmail = () => {
    const newValue = !emailNotif;
    if (!newValue) {
      setConfirmModal({
        show: true,
        title: "Disable Email Notifications?",
        message: "You might miss important updates about your skill swaps and messages.",
        onConfirm: () => {
          performToggleEmail(false);
          setConfirmModal((prev) => ({ ...prev, show: false }));
        },
      });
    } else {
      performToggleEmail(true);
    }
  };

  const handleTogglePush = () => {
    const newValue = !pushNotif;
    if (!newValue) {
      setConfirmModal({
        show: true,
        title: "Disable Push Notifications?",
        message: "We won't be able to notify you instantly when someone wants to swap skills with you.",
        onConfirm: () => {
          performTogglePush(false);
          setConfirmModal((prev) => ({ ...prev, show: false }));
        },
      });
    } else {
      performTogglePush(true);
    }
  };

  const handleTogglePublic = () => {
    const newValue = !isPublic;
    if (!newValue) {
      setConfirmModal({
        show: true,
        title: "Go Private?",
        message: "Your profile will no longer be visible in search results, and others won't be able to find you to swap skills.",
        onConfirm: () => {
          performTogglePublic(false);
          setConfirmModal((prev) => ({ ...prev, show: false }));
        },
      });
    } else {
      performTogglePublic(true);
    }
  };

  // States for Password Change Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null,
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authAPI.deleteAccount();
      await logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, error: null, success: null });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus({
        loading: false,
        error: "New passwords do not match",
        success: null,
      });
      return;
    }

    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setPasswordStatus({
        loading: false,
        error: null,
        success: "Password updated successfully!",
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordStatus({ loading: false, error: null, success: null });
      }, 2000);
    } catch (err: any) {
      setPasswordStatus({
        loading: false,
        error:
          err.response?.data?.error ||
          err.response?.data?.confirm_password?.[0] ||
          "Failed to update password",
        success: null,
      });
    }
  };

  const sections: SettingSection[] = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile Information",
          description: user
            ? `${user.name} (@${user.username})`
            : "Name, bio, and avatar settings",
          link: "/profile",
        },
        {
          icon: Lock,
          label: "Password",
          description: user?.email
            ? `Linked to ${user.email}`
            : "Change your security password",
          action: "Change",
          onToggle: () => setIsPasswordModalOpen(true),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Email Notifications",
          description: "Manage what you receive via email",
          toggle: true,
          active: emailNotif,
          onToggle: handleToggleEmail,
        },
        {
          icon: Bell,
          label: "Push Notifications",
          description: "Browser and mobile alerts",
          toggle: true,
          active: pushNotif,
          onToggle: handleTogglePush,
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Shield,
          label: "Public Profile",
          description: "Allow others to find your profile",
          toggle: true,
          active: isPublic,
          onToggle: handleTogglePublic,
        },
        {
          icon: Globe,
          label: "Connected Accounts",
          description: user ? [
            user.isGoogleConnected && "Google",
            user.isGithubConnected && "GitHub"
          ].filter(Boolean).join(", ") || "No accounts connected" : "Google, Github, etc.",
          count: (user?.isGoogleConnected ? 1 : 0) + (user?.isGithubConnected ? 1 : 0),
        },
        {
          icon: FileText,
          label: "Terms and Conditions",
          description: "Review your platform agreement",
          link: "/terms",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                  {section.title}
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      item.link
                        ? (window.location.href = item.link)
                        : item.onToggle?.()
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {item.toggle ? (
                        <button
                          className={`w-11 h-6 rounded-full transition-colors relative ${item.active ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${item.active ? "translate-x-5" : ""}`}
                          />
                        </button>
                      ) : item.action ? (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {item.action}
                        </span>
                      ) : item.count ? (
                        <span className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Dangerous Zone */}
          <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 overflow-hidden mt-12">
            <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider text-sm">
                Danger Zone
              </h2>
            </div>
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Delete Account
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Permanently remove all your data and account. This action
                  cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Change Password
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {passwordStatus.error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-start space-x-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                      {passwordStatus.error}
                    </p>
                  </div>
                )}

                {passwordStatus.success && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl flex items-start space-x-3 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                      {passwordStatus.success}
                    </p>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Current Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={passwordForm.old_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            old_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white pr-12"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={passwordForm.confirm_password}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordStatus.loading}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center"
                    >
                      {passwordStatus.loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/30"
                >
                  Yes, Turn Off
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-red-500/20 p-10"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  Delete Account?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  This action is <span className="text-red-600 dark:text-red-400 font-bold underline">permanent</span>. You will lose all your matches, messages, and profile data. We'll be sad to see you go!
                </p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full px-4 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Everything</span>
                  )}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="w-full px-4 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-colors"
                >
                  No, I Want to Stay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
