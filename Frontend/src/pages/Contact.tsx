import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight, CheckCircle2, Twitter, Linkedin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { supportAPI } from '@/services';

export const Contact: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (!fullName.trim()) {
      errors.fullName = "Full Name is required";
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email address";
      isValid = false;
    }

    if (!message.trim()) {
      errors.message = "Message is required";
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
      await supportAPI.submitContact({
        full_name: fullName,
        email,
        subject,
        message
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
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
      <div className="hidden lg:flex w-[45%] h-full flex-col justify-center pl-24 pr-12 relative z-10 select-none overflow-hidden bg-gradient-to-br from-purple-600/10 to-blue-600/10">
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaRmgD54TuDDggSfyOOxkmvCQJf0efvI8pWg&s" 
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
              <span className="text-xs font-bold text-white">⚡ Replies within 24 hours</span>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg space-y-4"
          >
            <h1 className="text-6xl font-black text-white leading-[1] tracking-tighter mb-3">
              Get in Touch
            </h1>
            
            <h2 className="text-lg text-white font-medium leading-relaxed max-w-md transition-colors">
              Have questions or feedback? We'd love to hear from you. Our team typically replies within 24 hours.
            </h2>
            
            <div className="flex flex-col space-y-4 pt-4">
              <div className="flex items-center space-x-3 text-white font-medium">
                <Mail className="w-6 h-6 text-white" />
                <span>support@skillswap.com</span>
              </div>
              <div className="flex items-center space-x-3 text-white font-medium">
                <Twitter className="w-6 h-6 text-white" />
                <span>@skillswap</span>
              </div>
              <div className="flex items-center space-x-3 text-white font-medium">
                <Linkedin className="w-6 h-6 text-white" />
                <span>SkillSwap</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center space-x-4 mt-8"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#fcfcfd] dark:border-slate-950 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm transition-all hover:scale-110 hover:z-10 cursor-pointer">
                  <img src={`https://i.pravatar.cc/150?u=${i + 70}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm text-white font-bold">Our support team is ready for you</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Glass Contact Card */}
      <div className="w-full lg:w-[55%] h-full flex items-center justify-center p-4 relative z-10 overflow-hidden">
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[520px] relative z-30"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] px-[40px] py-[32px] max-h-[100vh] overflow-y-auto border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all">
            
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center py-8"
                >
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-[28px] font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Message Sent!</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-base max-w-sm mb-8">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-12 rounded-xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Back to Home
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center mb-[24px]">
                    <h2 className="text-[28px] font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">Contact Us</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-1">Send us a message and we'll get back to you shortly.</p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-[12px] flex flex-col">
                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: "" });
                        }}
                        className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 h-[44px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                        placeholder="John Doe"
                      />
                      {fieldErrors.fullName && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.fullName}</p>}
                    </div>

                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                        }}
                        className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 h-[44px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                        placeholder="john@example.com"
                      />
                      {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.email}</p>}
                    </div>

                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Subject</label>
                      <div className="relative">
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 h-[44px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white font-medium text-sm shadow-sm focus:shadow-md appearance-none cursor-pointer"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Bug Report">Bug Report</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: "" });
                        }}
                        className={`w-full bg-slate-400/5 dark:bg-white/5 border ${fieldErrors.message ? 'border-red-500' : 'border-slate-200/50 dark:border-white/5'} focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 py-3 h-[90px] resize-none rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm shadow-sm focus:shadow-md`}
                        placeholder="How can we help you?"
                      />
                      {fieldErrors.message && <p className="text-[10px] font-bold text-red-500 ml-2">{fieldErrors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-[48px] rounded-xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-[0.98] !mt-[20px]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-slate-500 dark:text-slate-400 font-medium text-xs">
                    or reach us directly at support@skillswap.com
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
