import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheckEmail: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || "your email address";
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email === "your email address" ? "" : email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Verification email resent successfully.");
      } else {
        setError(data.error || "Failed to resend email.");
      }
    } catch (err: any) {
      setError("Network error. Please try again later.");
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

      {/* Left Side: Empty space or minimal feature */}
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
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter mb-3">
              Verify Your <br />
              <span className="text-blue-600">Email</span>
            </h1>
            
            <h2 className="text-lg text-white font-medium leading-relaxed max-w-md transition-colors">
              You are just one step away from connecting with the active community.
            </h2>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Check Email Card */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 relative z-10 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[480px] relative z-30"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] px-8 py-10 max-h-[100vh] overflow-y-auto border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col items-center text-center">
            
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h2 className="text-[28px] font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Check your email</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-base mb-2">
              We sent a verification link to <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              Click the link in your inbox to activate your account.
            </p>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 w-full p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-semibold"
                >
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 w-full p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm font-semibold"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-14 rounded-xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98] mb-6"
            >
              {isResending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <span>Resend Email</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <Link
              to="/register"
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium text-sm"
            >
              <ArrowLeft size={16} />
              <span>Wrong email? Go back</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
