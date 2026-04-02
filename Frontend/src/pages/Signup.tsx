import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Context/AuthContext';
import { Mail, User as UserIcon, AlertCircle, Eye, EyeOff, ArrowRight, Github } from 'lucide-react';
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from 'framer-motion';

export const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Google signup failed");
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
    setError('');

    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9@.+_-]+$/;
    if (!usernameRegex.test(username)) {
      setError('Invalid username (letters, numbers, and @/./+/-/_ only).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: confirmPassword
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
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
              Start Your <br />
              <span className="text-blue-600">Journey</span>
            </h1>
          </div>
          
          <h2 className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-6 transition-colors">
            Connect, exchange, and grow. Join thousands of users worldwide trading skills every day.
          </h2>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center space-x-4 mt-8"
        >
          <div className="flex -space-x-3">
            {[5, 6, 7, 8].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#fcfcfd] dark:border-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm transition-all hover:scale-110 hover:z-10 cursor-pointer">
                <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="avatar" />
              </div>
            ))}
          </div>
          <div className="transition-colors">
            <div className="text-base font-bold text-slate-900 dark:text-white">Active Community</div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Mentors ready to help you</div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Glass Signup Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-start lg:pl-12 p-4 relative z-10 overflow-hidden">
        {/* Decorative Background Elements for Right Side */}
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Floating Social Proof badges */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] right-20 hidden xl:flex items-center space-x-3 px-5 py-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-20 pointer-events-none"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.902 1.381H21.7l-4.783 3.475a2 2 0 0 0-.727 2.238L18.002 22 12 17.64 5.998 22l1.812-6.093a2 2 0 0 0-.727-2.238L2.3 10.194h5.886a2 2 0 0 0 1.902-1.381z"/></svg>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Top Rated</div>
            Most Trusted App
          </div>
        </motion.div>

        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] right-14 hidden xl:flex items-center space-x-3 px-4 py-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-20 pointer-events-none"
        >
          <div className="flex -space-x-3">
            {[9, 10, 11].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/150?u=${i + 50}`} alt="" />
              </div>
            ))}
          </div>
          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Real Experts <br/> Real Skills</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[500px] relative z-30 ml-4 lg:ml-0"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] p-8 md:p-10 border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all">
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">Create Account</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-tight">Join the skill exchange community.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center space-x-2 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm"
                    placeholder="First"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm"
                    placeholder="Last"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm"
                    placeholder="unique_username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm"
                      placeholder="8+ chars"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 ml-1 uppercase tracking-wider">Confirm</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 py-2.5 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm"
                      placeholder="Repeat"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-3 rounded-2xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white/80 dark:bg-slate-900 px-3 text-slate-400 font-black tracking-widest transition-colors">or join with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 py-2.5 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm active:scale-95 group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">Google</span>
              </button>
              <button 
                type="button" 
                onClick={handleGithubLogin}
                className="flex items-center justify-center space-x-2 py-2.5 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm active:scale-95 group"
              >
                <Github size={18} className="dark:text-white group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">Github</span>
              </button>
            </div>

            <p className="mt-6 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
              Already a member?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-black hover:text-blue-700 transition-colors ml-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
