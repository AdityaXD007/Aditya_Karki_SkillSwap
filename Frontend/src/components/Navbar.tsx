import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { requestsAPI } from "@/services";
import {
  Menu,
  X,
  User,
  LogOut,
  Home,
  Users,
  Calendar,
  MessageCircle,
  Bell,
  Settings,
  UserCircle,
  Moon,
  Sun,
  ChevronRight,
  ArrowLeft,
  Check,
  Monitor,
  AlertCircle,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [showAppearanceMenu, setShowAppearanceMenu] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications (pending requests)
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const response = await requestsAPI.getRequests();
        
        if (Array.isArray(response.data)) {
          const pending = response.data.filter(
            (req: any) => {
              return req.status === "PENDING" && req.partner_details?.username === user?.username;
            }
          );
          setPendingCount(pending.length);
        } else {
          setPendingCount(0);
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setShowAppearanceMenu(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
        setShowAppearanceMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/matches", label: "Find Skills", icon: Users },
    { to: "/bookings", label: "Sessions", icon: Calendar },
    { to: "/messages", label: "Messages", icon: MessageCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on the landing page for transparent navbar
  const isLandingPage =
    location.pathname === "/landing" || location.pathname === "/";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isLandingPage
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50"
          : "bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/landing"}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SS</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white transition-colors">SkillSwap</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive(to)
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors relative group focus:outline-none"
                  >
                    <Bell className="w-5 h-5 group-hover:text-gray-900 dark:group-hover:text-white" />
                    {pendingCount > 0 && (
                      <span className="absolute top-2 right-2.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900 text-[10px] text-white flex items-center justify-center font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                        {pendingCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-bold">
                            {pendingCount} New
                          </span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {pendingCount > 0 ? (
                          <div className="p-4">
                            <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">New Session Requests</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  You have {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'} to teach.
                                </p>
                                <Link
                                  to="/bookings"
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="inline-block mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View all requests
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No notification for now</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something happens</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors focus:outline-none"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                   {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                      {!showAppearanceMenu ? (
                        <>
                          {/* User Header */}
                          <div className="px-4 py-3 flex items-start space-x-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user?.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                {user?.name || user?.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                                {user?.username}
                              </p>
                            </div>
                          </div>

                          {/* Section 1: Account */}
                          <div className="py-1.5">
                            <Link
                              to="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <UserCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                              <span className="flex-1">Profile</span>
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                              <span className="flex-1 text-left">Sign out</span>
                            </button>
                          </div>

                          {/* Section 2: Preferences */}
                          <div className="border-t border-gray-100 dark:border-slate-800 py-1.5">
                            <button
                              onClick={() => setShowAppearanceMenu(true)}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <Moon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                              <span className="flex-1 text-left">
                                Appearance: {theme === "system" ? "Device theme" : theme === "dark" ? "Dark" : "Light"}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </button>
                            <Link
                              to="/settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                              <span className="flex-1">Settings</span>
                            </Link>
                          </div>

                          {/* Section 3: Help */}
                          <div className="border-t border-gray-100 dark:border-slate-800 py-1.5">
                            <Link
                              to="/feedback"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <MessageCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                              <span className="flex-1 text-left">Send feedback</span>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="animate-in slide-in-from-right-4 duration-200">
                          {/* Appearance Submenu Header */}
                          <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-2 py-1.5">
                            <button
                              onClick={() => setShowAppearanceMenu(false)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</span>
                          </div>

                          <div className="py-1">
                            <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                              Setting applies to this browser only
                            </p>
                            
                            <button
                              onClick={() => setTheme("system")}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                {theme === "system" ? <Check className="w-4 h-4 text-blue-600" /> : <Monitor className="w-5 h-5 text-gray-400" />}
                              </div>
                              <span className="flex-1 text-left">Use device theme</span>
                            </button>

                            <button
                              onClick={() => setTheme("dark")}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                {theme === "dark" ? <Check className="w-4 h-4 text-blue-600" /> : <Moon className="w-5 h-5 text-gray-400" />}
                              </div>
                              <span className="flex-1 text-left">Dark theme</span>
                            </button>

                            <button
                              onClick={() => setTheme("light")}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                                {theme === "light" ? <Check className="w-4 h-4 text-blue-600" /> : <Sun className="w-5 h-5 text-gray-400" />}
                              </div>
                              <span className="flex-1 text-left">Light theme</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              {isAuthenticated && (
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors relative focus:outline-none">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-slate-950"></span>
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive(to)
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
