import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { requestsAPI, type SessionRequest } from "@/services";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";
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
  const [pendingRequests, setPendingRequests] = React.useState<SessionRequest[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications (pending requests)
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const response = await requestsAPI.getRequests();
        
        // 1. Filter pending requests sent to me
        const pending = Array.isArray(response.data) 
          ? response.data.filter(
              (req: any) => req.status === "PENDING" && req.partner_details?.username === user?.username
            )
          : [];
        
        setPendingRequests(pending);

        // 2. Update count
        const currentCount = pending.length;
        setPendingCount(currentCount);

        // 3. Handle badge persistence
        const lastSeenCount = parseInt(localStorage.getItem('lastSeenNotificationCount') || '0');
        if (currentCount > lastSeenCount) {
          setHasNewNotifications(true);
        } else if (currentCount === 0) {
          setHasNewNotifications(false);
        }
        
        // Clear if we're on certain pages
        if (location.pathname === '/bookings') {
          localStorage.setItem('lastSeenNotificationCount', currentCount.toString());
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

  const handleRequestAction = async (id: number, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await requestsAPI.acceptRequest(id);
        toast.success("Request accepted! Check your sessions.");
      } else {
        await requestsAPI.rejectRequest(id);
        toast.error("Request rejected.");
      }
      
      // Update local state and count
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error(`Failed to ${action} request.`);
    }
  };

  // Check if we're on an auth page or landing page
  const isLandingPage =
    location.pathname === "/landing" || location.pathname === "/";
  
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/signup";

  if (isAuthPage) {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                <img src="/favicon.png" alt="SkillSwap" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">SkillSwap</span>
            </Link>

            {/* Auth Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                {location.pathname === "/login" ? "Don't have an account?" : "Already have an account?"}
              </span>
              <Link
                to={location.pathname === "/login" ? "/register" : "/login"}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
              >
                {location.pathname === "/login" ? "Sign Up" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <>
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
              className="flex items-center space-x-2 group"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform overflow-hidden shadow-sm">
                <img src="/favicon.png" alt="SkillSwap" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg md:text-xl text-gray-900 dark:text-white transition-colors">SkillSwap</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                    isActive(to)
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Menu / Actions */}
          <div className="flex items-center space-x-1 md:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-1 md:space-x-2">
                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        if (!isNotificationsOpen) {
                          setHasNewNotifications(false);
                          localStorage.setItem('lastSeenNotificationCount', pendingCount.toString());
                        }
                      }}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full transition-colors relative group focus:outline-none"
                    >
                      <Bell className="w-5 h-5 group-hover:text-gray-900 dark:group-hover:text-white" />
                      {hasNewNotifications && pendingCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 text-[9px] text-white flex items-center justify-center font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                          {pendingCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {pendingCount} New
                            </span>
                          )}
                        </div>
                        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                          {pendingRequests.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                              {pendingRequests.map((req) => (
                                <div
                                  key={req.id}
                                  className="p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors group relative"
                                >
                                  <div className="flex items-start space-x-3">
                                    <Link 
                                      to={`/profile/${req.requester_details.id}`}
                                      onClick={() => setIsNotificationsOpen(false)}
                                      className="shrink-0"
                                    >
                                      {req.requester_details.profile_image_url || req.requester_details.profile_image ? (
                                        <img
                                          src={req.requester_details.profile_image_url || req.requester_details.profile_image || ''}
                                          alt={req.requester_details.username}
                                          className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all shadow-sm"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-sm">
                                          {req.requester_details.username[0].toUpperCase()}
                                        </div>
                                      )}
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">New Session</span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                          {req.created_at ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true }) : 'Just now'}
                                        </span>
                                      </div>
                                      
                                      <p className="text-sm text-gray-900 dark:text-white leading-snug">
                                        <span className="font-bold">{req.requester_details.username}</span>
                                        <span className="text-gray-500 dark:text-gray-400"> wants to learn </span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{req.skill_learn_details.name}</span>
                                      </p>
                                      
                                      {req.message && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 italic bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-gray-100 dark:border-slate-700">
                                          "{req.message}"
                                        </p>
                                      )}

                                      <div className="flex items-center space-x-2 mt-3">
                                        <button
                                          onClick={() => handleRequestAction(req.id, 'accept')}
                                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleRequestAction(req.id, 'reject')}
                                          className="flex-1 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          Decline
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30">
                                <Link
                                  to="/bookings"
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="block w-full py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                                >
                                  Manage Session History
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:rotate-12">
                                <Bell className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                              </div>
                              <h4 className="text-base font-bold text-gray-900 dark:text-white">Stay Tuned!</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[200px] leading-relaxed">
                                No new notification alerts right now.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop User Dropdown */}
                  <div className="hidden md:block relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors focus:outline-none"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-800 shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </button>

                    {/* Desktop Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                        {!showAppearanceMenu ? (
                          <>
                            {/* User Header */}
                            <div className="px-4 py-4 flex items-start space-x-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                              {user?.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user?.name}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <User className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {user?.name || user?.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  @{user?.username}
                                </p>
                              </div>
                            </div>

                            {/* Section 1: Account */}
                            <div className="py-2">
                              <Link
                                to="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                              >
                                <UserCircle className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="flex-1">Profile Overview</span>
                              </Link>
                              <Link
                                to="/settings"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                              >
                                <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="flex-1">Settings</span>
                              </Link>
                            </div>

                            {/* Section 2: Preferences */}
                            <div className="border-t border-gray-100 dark:border-slate-800 py-2">
                              <button
                                onClick={() => setShowAppearanceMenu(true)}
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                              >
                                <Moon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="flex-1 text-left">
                                  Appearance
                                </span>
                                <div className="flex items-center text-xs text-gray-400">
                                  {theme === "system" ? "Auto" : theme === "dark" ? "Dark" : "Light"}
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                              </button>
                            </div>

                            {/* Section 3: Logout */}
                            <div className="border-t border-gray-100 dark:border-slate-800 py-2">
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                              >
                                <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                                <span className="flex-1 text-left font-bold">Sign Out</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="animate-in slide-in-from-right-4 duration-200">
                            {/* Appearance Submenu Header */}
                            <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-2 py-3">
                              <button
                                onClick={() => setShowAppearanceMenu(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                              >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="ml-2 text-sm font-bold text-gray-900 dark:text-gray-100">Appearance Settings</span>
                            </div>

                            <div className="py-2">
                              <button
                                onClick={() => setTheme("light")}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${theme === 'light' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                              >
                                <Sun className="w-5 h-5 mr-3" />
                                <span className="flex-1 text-left">Light Mode</span>
                                {theme === "light" && <Check className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => setTheme("dark")}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                              >
                                <Moon className="w-5 h-5 mr-3" />
                                <span className="flex-1 text-left">Dark Mode</span>
                                {theme === "dark" && <Check className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => setTheme("system")}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${theme === 'system' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                              >
                                <Monitor className="w-5 h-5 mr-3" />
                                <span className="flex-1 text-left">Device Default</span>
                                {theme === "system" && <Check className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                >
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900 transition-all focus:outline-none"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 animate-in spin-in-90 duration-300" />
                ) : (
                  <Menu className="w-6 h-6 animate-in slide-in-from-right-2 duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* Mobile Full-Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[45] bg-white dark:bg-slate-950 flex flex-col pt-16 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {isAuthenticated ? (
              <>
                {/* User Mobile Profile Card */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-slate-800">
                  {user?.avatar ? (
                    <img src={user.avatar} className="w-14 h-14 rounded-full object-cover shadow-md" alt={user.name} />
                  ) : (
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                      {user?.name?.[0] || user?.username?.[0]}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 dark:text-white truncate lg:text-lg">{user?.name || user?.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {navLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        isActive(to)
                          ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20"
                          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isActive(to) ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span className="text-sm font-bold">{label}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 w-full p-4 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 font-bold active:bg-gray-100"
                  >
                    <UserCircle className="w-5 h-5 text-blue-500" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 w-full p-4 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 font-bold active:bg-gray-100"
                  >
                    <Settings className="w-5 h-5 text-blue-500" />
                    <span>App Settings</span>
                  </Link>
                  <button
                    onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                    className="flex items-center space-x-3 w-full p-4 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 font-bold active:bg-gray-100 text-left"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-3 w-full p-4 rounded-2xl text-red-600 bg-red-50 dark:bg-red-900/10 font-bold active:bg-red-100 transition-colors mt-8"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout From App</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col h-full justify-center space-y-4">
                <div className="text-center mb-10">
                   <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl rotate-6">
                      <img src="/favicon.png" className="w-12 h-12 brightness-0 invert" alt="SkillSwap" />
                   </div>
                   <h2 className="text-3xl font-bold dark:text-white">Welcome back!</h2>
                   <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to continue your journey</p>
                </div>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-4 text-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-600/25 active:scale-95 transition-transform"
                >
                  Login Session
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-4 text-center rounded-2xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold text-lg active:scale-95 transition-transform"
                >
                  Create New Account
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-4 text-center text-gray-500 dark:text-gray-400 font-medium hover:text-blue-600 transition-colors mt-4"
                >
                  Support & Contact
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};
