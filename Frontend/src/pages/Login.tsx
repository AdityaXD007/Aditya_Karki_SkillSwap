import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, Github } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
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
    // You should replace this with your actual GitHub Client ID
    const GITHUB_CLIENT_ID = "Ov23liUfmlj2LYBHgOTe"; 
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    window.location.href = githubUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] dark:bg-slate-950 flex overflow-hidden relative font-sans">
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
      <div className="hidden lg:flex w-1/2 flex-col justify-center pl-24 pr-12 relative z-10 select-none overflow-hidden">
        {/* Background Decorative Image */}
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" 
            alt="background ornament" 
            className="w-full h-full object-cover opacity-[0.4] dark:opacity-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fcfcfd]/80 via-transparent to-transparent dark:from-slate-950/80"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 max-w-lg relative z-10"
        >
          <div className="relative inline-block mb-4 pt-10">
            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter">
              Learning <br />
              <span className="text-blue-600">Reimagined</span>
            </h1>
          </div>
          
          <h2 className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-6 transition-colors">
            Trade your skills for knowledge. Join a community of creators, builders, and learners.
          </h2>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center space-x-4 mt-8"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#fcfcfd] dark:border-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm transition-all hover:scale-110 hover:z-10 cursor-pointer">
                <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="avatar" />
              </div>
            ))}
          </div>
          <div className="transition-colors">
            <div className="text-base font-bold text-slate-900 dark:text-white">10.2k+ Members</div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Exchanging skills daily</div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Glass Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-start lg:pl-12 p-4 relative z-10 overflow-hidden">
        {/* Decorative Background Elements for Right Side */}
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Floating Glassmorphic Badges */}
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-8 hidden xl:flex items-center space-x-2 px-4 py-2 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-20 pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-xs leading-none">✓</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Skills Verified</div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] right-12 hidden xl:flex items-center space-x-3 px-5 py-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-20 pointer-events-none"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/150?u=${i + 40}`} alt="" />
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Join 500+ <br/> Experts Online</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px] relative z-30 ml-4 lg:ml-0"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] p-8 md:p-10 border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all">
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Hello!</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Sign in to continue your growth.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center space-x-3 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10 font-medium text-base shadow-sm focus:shadow-md"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-12 py-3.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 relative z-10 font-medium text-base shadow-sm focus:shadow-md"
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-3.5 rounded-2xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-transparent px-3 text-slate-400 font-black tracking-widest transition-colors">or sign in with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 py-3 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm active:scale-95 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Google</span>
              </button>
              <button 
                type="button" 
                onClick={handleGithubLogin}
                className="flex items-center justify-center space-x-2 py-3 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm active:scale-95 group"
              >
                <Github size={20} className="dark:text-white group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Github</span>
              </button>
            </div>

            <p className="mt-8 text-center text-slate-500 dark:text-slate-400 font-medium font-sm">
              Join the community?{" "}
              <Link
                to="/signup"
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
