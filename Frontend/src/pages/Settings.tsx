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
  const [pushNotif, setPushNotif] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Sync state when user data is available/changes
  React.useEffect(() => {
    if (user) {
      setEmailNotif(user.emailNotificationsEnabled);
    }
  }, [user]);

  const handleToggleEmail = async () => {
    const newValue = !emailNotif;
    setEmailNotif(newValue);
    try {
      await authAPI.updateProfile({ email_notifications_enabled: newValue });
      updateUser({ emailNotificationsEnabled: newValue });
    } catch (err) {
      console.error("Failed to update notification preference:", err);
      // Revert on failure
      setEmailNotif(!newValue);
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
          onToggle: () => setPushNotif(!pushNotif),
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
          onToggle: () => setIsPublic(!isPublic),
        },
        {
          icon: Globe,
          label: "Connected Accounts",
          description: "Google, Github, etc.",
          count: 1,
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
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
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
                    <input
                      type="password"
                      required
                      value={passwordForm.old_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          old_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          new_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirm_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-gray-900 dark:text-white"
                      placeholder="••••••••"
                    />
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
    </div>
  );
};
