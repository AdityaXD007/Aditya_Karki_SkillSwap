import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
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
  HelpCircle,
  UserCircle,
  Moon,
  ChevronRight,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
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
          ? "bg-white/90 backdrop-blur-md border-b border-gray-200/50"
          : "bg-white border-b border-gray-200"
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
              <span className="font-bold text-xl text-gray-900">SkillSwap</span>
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
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative group focus:outline-none"
                  >
                    <Bell className="w-5 h-5 group-hover:text-gray-900" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                      </div>
                      <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No notification for now</p>
                        <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                      {/* User Header */}
                      <div className="px-4 py-3 flex items-start space-x-3 border-b border-gray-100 bg-gray-50/50">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user?.name || user?.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate mb-1">
                            @{user?.username}
                          </p>
                        </div>
                      </div>

                      {/* Section 1: Account */}
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <UserCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1">Profile</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1 text-left">Sign out</span>
                        </button>
                      </div>

                      {/* Section 2: Preferences */}
                      <div className="border-t border-gray-100 py-1.5">
                        <button className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                          <Moon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1 text-left">Appearance: Device theme</span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1">Settings</span>
                        </Link>
                      </div>

                      {/* Section 3: Help */}
                      <div className="border-t border-gray-100 py-1.5">
                        <button className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                          <HelpCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1 text-left">Help</span>
                        </button>
                        <button className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                          <MessageCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-600" />
                          <span className="flex-1 text-left">Send feedback</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              {isAuthenticated && (
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-50"
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
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                      isActive(to)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
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
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
