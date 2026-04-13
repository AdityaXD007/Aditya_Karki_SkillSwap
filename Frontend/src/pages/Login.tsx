import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, Github, CheckCircle2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Google login failed");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError("Google login was unsuccessful. Try again later."),
  });

  const handleGithubLogin = () => {
    const GITHUB_CLIENT_ID = "Ov23liUfmlj2LYBHgOTe"; 
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    window.location.href = githubUrl;
  };

  const validate = () => {
    const errors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setResendMessage("");
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setError(err.message || "Please verify your email before logging in.");
        setErrorCode("EMAIL_NOT_VERIFIED");
      } else {
        setError(err.message || "Incorrect email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      const response = await fetch('http://localhost:8000/api/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResendMessage(data.message || "Verification email sent.");
    } catch (err) {
      setResendMessage("Failed to send verification email. Try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#fcfcfd] dark:bg-slate-950 flex overflow-hidden relative font-sans lg:flex-row flex-col">
      {/* Animated Background Blobs */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -50, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] pointer-events-none" 
      />

      {/* Left Side: Branding & Hero Message */}
      <div className="hidden lg:flex w-1/2 h-full flex-col justify-center pl-24 pr-12 relative z-10 select-none overflow-hidden bg-gradient-to-br from-purple-600/10 to-blue-600/10">
        {/* Background Decorative Image */}
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" 
            alt="background ornament" 
            className="w-full h-full object-cover opacity-[0.4] dark:opacity-[0.35]"
          />
          <div className="absolute inset-0 bg-black/5 dark:bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 via-slate-900/5 to-transparent dark:from-slate-950/30 dark:via-transparent"></div>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Anchored Badges */}
          <div className="flex flex-wrap gap-3 mb-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Skills Verified</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full shadow-sm"
            >
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i + 40}`} alt="" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Join 500+ Experts Online</span>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter mb-3">
              Learning <br />
              <span className="text-blue-600">Reimagined</span>
            </h1>
            
            <h2 className="text-lg text-white font-medium leading-relaxed max-w-md transition-colors">
              Trade your skills for knowledge. Join a community of creators, builders, and learners.
            </h2>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center space-x-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#fcfcfd] dark:border-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm transition-all hover:scale-110 hover:z-10 cursor-pointer">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mb-1">
                10.2k+ Members
              </div>
              <div className="text-xs text-white font-medium">Exchanging skills daily</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Glass Login Card */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 relative z-10 overflow-hidden">
        {/* Decorative Background Elements for Right Side */}
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px] relative z-30"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] px-8 py-6 sm:px-10 sm:py-8 max-h-[100vh] overflow-y-auto border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all">
            
            <div className="text-center mb-5">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">Hello!</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Sign in to continue your growth.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 flex flex-col space-y-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  {errorCode === "EMAIL_NOT_VERIFIED" && (
                    <div className="pt-2">
                       <button 
                         type="button" 
                         onClick={handleResend}
                         disabled={isResending}
                         className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 rounded border border-red-200 dark:border-red-800 transition-colors"
                       >
                         {isResending ? "Sending..." : "Resend verification email"}
                       </button>
                    </div>
                  )}
                   {resendMessage && (
                    <div className="pt-1 text-green-600 dark:text-green-400 font-medium">
                      {resendMessage}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                    }}
                    className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-4 h-11 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10 font-medium text-base shadow-sm focus:shadow-md`}
                    placeholder="name@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[10px] font-bold text-red-500 ml-2 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Password</label>
                  <Link to="/forgot-password" title="Recover Password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                    }}
                    className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.password ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-12 h-11 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10 font-medium text-base shadow-sm focus:shadow-md`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] font-bold text-red-500 ml-2 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-12 !mt-5 rounded-2xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-4 mb-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[12px]"><span className="bg-white dark:bg-[#0f172a] px-3 text-slate-400 font-medium transition-colors">or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 h-[44px] bg-transparent border border-slate-200/50 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 active:scale-95 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Google</span>
              </button>
              <button 
                type="button" 
                onClick={handleGithubLogin}
                className="flex items-center justify-center space-x-2 h-[44px] bg-transparent border border-slate-200/50 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 active:scale-95 group"
              >
                <Github size={20} className="dark:text-white group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Github</span>
              </button>
            </div>

            <p className="mt-3 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
              Join the community?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-black hover:text-blue-700 transition-colors ml-1"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
