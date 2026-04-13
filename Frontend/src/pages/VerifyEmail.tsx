import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'invalid'>('loading');
  const [emailForResend, setEmailForResend] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/verify/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
        } else {
          // Check if data.error mentions expired
          if (data.error && data.error.toLowerCase().includes('expired')) {
            setStatus('expired');
          } else {
            setStatus('invalid');
          }
        }
      } catch (err) {
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForResend) return;

    setIsResending(true);
    setResendMessage('');
    
    try {
      const response = await fetch('http://localhost:8000/api/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailForResend }),
      });
      const data = await response.json();
      setResendMessage(data.message || "If that email exists, a new link has been sent.");
    } catch (err: any) {
      setResendMessage("Network error. Please try again.");
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

      {/* Right Side: Verify Email Card in center */}
      <div className="w-full h-full flex items-center justify-center p-4 relative z-10 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px] relative z-30"
        >
          <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] px-8 py-10 border border-white/60 dark:border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col items-center text-center">
            
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                <h2 className="text-[24px] font-extrabold text-slate-900 dark:text-white mb-2">Verifying...</h2>
                <p className="text-slate-500 dark:text-slate-400">Please wait while we verify your email address.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h2 className="text-[24px] font-extrabold text-slate-900 dark:text-white mb-2">Email Verified!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Your account is now fully active.</p>
                <Link
                  to="/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-14 rounded-xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Continue to Login</span>
                  <ArrowRight size={20} />
                </Link>
              </>
            )}

            {status === 'expired' && (
              <>
                <AlertCircle className="w-20 h-20 text-yellow-500 mb-6" />
                <h2 className="text-[24px] font-extrabold text-slate-900 dark:text-white mb-2">Link Expired</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Your verification link has expired. Please enter your email to request a new one.</p>
                
                {resendMessage && (
                  <div className="mb-4 w-full p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">
                    {resendMessage}
                  </div>
                )}
                
                <form onSubmit={handleResend} className="w-full space-y-4">
                  <input
                    type="email"
                    required
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-400/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800/80 px-4 h-[48px] rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg h-12 rounded-xl flex items-center justify-center space-x-2 transition-all"
                  >
                    {isResending ? 'Sending...' : 'Request a new link'}
                  </button>
                </form>
              </>
            )}

            {status === 'invalid' && (
              <>
                <XCircle className="w-20 h-20 text-red-500 mb-6" />
                <h2 className="text-[24px] font-extrabold text-slate-900 dark:text-white mb-2">Invalid Link</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">This verification link is invalid or has already been used.</p>
                <Link
                  to="/register"
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-lg h-14 rounded-xl flex items-center justify-center transition-all"
                >
                  Try registering again
                </Link>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </div>
  );
};
