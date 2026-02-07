import React from "react";
import { User, Bell, Shield, Globe, Trash2, ChevronRight, Lock } from "lucide-react";

interface SettingItem {
  icon: any;
  label: string;
  description: string;
  link?: string;
  action?: string;
  toggle?: boolean;
  default?: boolean;
  count?: number;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const Settings: React.FC = () => {
  const sections: SettingSection[] = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Information", description: "Name, bio, and avatar settings", link: "/profile" },
        { icon: Lock, label: "Password", description: "Change your security password", action: "Change" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Bell, label: "Email Notifications", description: "Manage what you receive via email", toggle: true, default: true },
        { icon: Bell, label: "Push Notifications", description: "Browser and mobile alerts", toggle: true, default: false },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Shield, label: "Public Profile", description: "Allow others to find your profile", toggle: true, default: true },
        { icon: Globe, label: "Connected Accounts", description: "Google, LinkedIn, etc.", count: 1 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
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
                        <button className={`w-11 h-6 rounded-full transition-colors relative ${item.default ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${item.default ? 'translate-x-5' : ''}`} />
                        </button>
                      ) : item.action ? (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{item.action}</span>
                      ) : item.count ? (
                        <span className="text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">{item.count}</span>
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Delete Account</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Permanently remove all your data and account. This action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
