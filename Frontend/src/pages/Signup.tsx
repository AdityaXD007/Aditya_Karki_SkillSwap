import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Context/AuthContext';
import { Mail, User as UserIcon, Lock, AlertCircle, Eye, EyeOff, ArrowRight, Github, CheckCircle2, X } from 'lucide-react';
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from 'framer-motion';
import { TermsContent } from './Terms';

export const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      setIsLoading(true);
      setError('');
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Google signup failed");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError("Google signup was unsuccessful. Try again later."),
  });

  const handleGithubLogin = () => {
    const GITHUB_CLIENT_ID = "Ov23liUfmlj2LYBHgOTe"; 
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    window.location.href = githubUrl;
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (!username) {
      errors.username = "Username is required";
      isValid = false;
    } else if (!/^[a-zA-Z0-9@.+_-]+$/.test(username)) {
      errors.username = "Letters, numbers, and @/./+/-/_ only";
      isValid = false;
    }

    if (!firstName) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    if (!lastName) {
      errors.lastName = "Last name is required";
      isValid = false;
    }

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      errors.password = "Min. 8 characters";
      isValid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (!agreedToTerms) {
      errors.terms = "You must agree to the Terms and Conditions";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

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
      navigate('/check-email', { state: { email } });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
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
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000">
          <img 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
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
                {[5, 6, 7].map(i => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i + 60}`} alt="" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">500+ Experts Joined Today</span>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter mb-3">
              Empower <br />
              <span className="text-blue-600">Each Other</span>
            </h1>
            
            <h2 className="text-lg text-white font-medium leading-relaxed max-w-md transition-colors">
              The world's first skill-based bartering platform. Share what you know, learn what you need.
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
                  <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mb-1">
                Active Community
              </div>
              <div className="text-xs text-white font-medium">Ready to start with you</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Glass Signup Card */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 relative z-10 overflow-hidden">
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[520px] relative z-30"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] px-7 py-6 sm:px-9 sm:py-7 max-h-[100vh] overflow-y-auto border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all">
            
            <div className="text-center mb-4">
              <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">Create Account</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Let's set up your expertise profile.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-[10px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">First Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: "" });
                      }}
                      className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.firstName ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-4 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                      placeholder="Jane"
                    />
                  </div>
                  {fieldErrors.firstName && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: "" });
                      }}
                      className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.lastName ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-4 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                      placeholder="Smith"
                    />
                  </div>
                  {fieldErrors.lastName && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                    }}
                    className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-4 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                    placeholder="jane@example.com"
                  />
                </div>
                {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Choose Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
                    }}
                    className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.username ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-4 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                    placeholder="janesmith"
                  />
                </div>
                {fieldErrors.username && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.username}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                      }}
                      className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.password ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-10 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Confirm</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                      }}
                      className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 pl-10 pr-10 h-[42px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex flex-col space-y-1 mt-3 ml-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (fieldErrors.terms) setFieldErrors({ ...fieldErrors, terms: "" });
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight select-none">
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer">Terms and Conditions</button>
                  </label>
                </div>
                {fieldErrors.terms && <p className="text-[10px] font-bold text-red-500">{fieldErrors.terms}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-12 rounded-xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98] !mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-4 mb-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[12px]"><span className="bg-white dark:bg-[#0f172a] px-3 text-slate-400 font-medium transition-colors">or join with</span></div>
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
              Already a member?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-black hover:text-blue-700 transition-colors ml-1"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Terms and Conditions
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar">
                <TermsContent />
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
