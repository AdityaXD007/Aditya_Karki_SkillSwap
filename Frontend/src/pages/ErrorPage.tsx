import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ErrorPageProps {
  code?: number;
  message?: string;
  title?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ code: propCode, message: propMessage, title: propTitle }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Determine the error code (Priority: prop > URL param > default 404)
  const code = propCode || parseInt(searchParams.get('code') || '404');

  // Configuration map for different error states
  const errorConfigs: Record<number, { title: string; message: string; icon: string; accentColor: string }> = {
    400: {
      title: "Bad Request",
      message: "The request wasn't quite right. Let's get you back on track.",
      icon: "🤨",
      accentColor: "#f97316"
    },
    401: {
      title: "Unauthorized",
      message: "Please log in to continue your learning journey.",
      icon: "🔐",
      accentColor: "#8b5cf6"
    },
    403: {
      title: "Access Denied",
      message: "You don't have permission to view this specific lesson.",
      icon: "🚫",
      accentColor: "#ef4444"
    },
    404: {
        title: "Lesson Not Found",
        message: "Oops! This page went on a field trip and forgot to come back.",
        icon: "🧐",
        accentColor: "#FF6B6B"
    },
    500: {
      title: "Server Meltdown",
      message: "Our lab is experiencing some technical difficulties. We're on it!",
      icon: "😵‍💫",
      accentColor: "#ef4444"
    }
  };

  const config = errorConfigs[code] || {
    title: propTitle || "Oops!",
    message: propMessage || "Something went wrong with your learning session.",
    icon: "🤭",
    accentColor: "#FF6B6B"
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-4 overflow-hidden relative">
      {/* Animated Background Elements (Adapted from your reference) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Books */}
        <div className="absolute top-[10%] left-[15%] animate-bounce-rotate" style={{ animationDelay: '0s' }}>
          <div className="relative" style={{ transform: 'perspective(600px) rotateY(-25deg) rotateX(15deg)' }}>
            <div className="w-16 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#FF8787] rounded-lg shadow-2xl border-4 border-[#FF5252]">
              <div className="w-full h-1 bg-[#FF5252] mt-2"></div>
              <div className="w-full h-1 bg-[#FF5252] mt-2"></div>
            </div>
            <div className="absolute top-0 right-0 w-6 h-18 bg-gradient-to-r from-[#FF5252] to-[#E64545] rounded-r-lg" style={{ transform: 'rotateY(90deg) translateX(10px) translateZ(2px)' }}></div>
          </div>
        </div>

        {/* Floating Pencil */}
        <div className="absolute top-[30%] right-[20%] animate-wiggle" style={{ animationDelay: '0.5s' }}>
          <div style={{ transform: 'perspective(600px) rotateZ(-45deg) rotateY(20deg)' }}>
            <div className="relative">
              <div className="w-6 h-32 bg-gradient-to-b from-[#FFD93D] to-[#FFC107] rounded-full border-4 border-[#FFA000] shadow-xl"></div>
              <div className="w-6 h-8 bg-[#FF6B6B] absolute -top-8 left-0 rounded-t-full border-4 border-t-[#FF5252] border-x-[#FF5252]"></div>
              <div className="w-2 h-2 bg-[#2C1810] absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Light Bulb */}
        <div className="absolute bottom-[25%] left-[10%] animate-pulse-glow">
          <div style={{ transform: 'perspective(600px) rotateY(-15deg)' }}>
            <div className="relative">
              <div className="w-16 h-20 bg-gradient-to-b from-[#FFD93D] to-[#FFC107] rounded-t-full border-4 border-[#FFA000] shadow-xl relative">
                <div className="absolute inset-0 bg-[#FFEB3B] rounded-t-full opacity-50 animate-ping-slow"></div>
              </div>
              <div className="w-16 h-4 bg-gradient-to-b from-[#9E9E9E] to-[#757575] border-4 border-[#616161] border-t-0"></div>
            </div>
          </div>
        </div>

        {/* Cartoon Stars */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle text-4xl"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.3}s`,
              filter: 'drop-shadow(0 0 8px rgba(255, 217, 61, 0.5))'
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8 max-w-2xl z-10 relative">
        <div className="flex justify-center mb-8">
          <div className="relative animate-float-character">
            {/* Cartoon Character Body */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-b from-[#FFE4C4] to-[#FFD4A4] rounded-full border-4 border-[#D4A574] mx-auto relative overflow-hidden flex items-center justify-center">
                {/* CSS Face from Reference */}
                <div className="absolute top-12 left-8 flex flex-col items-center">
                  <div className="flex gap-6">
                    {/* Eyes */}
                    <div className={cn("w-4 h-6 bg-[#2C1810] rounded-full", code === 500 && "animate-pulse")} />
                    <div className={cn("w-4 h-6 bg-[#2C1810] rounded-full", code === 500 && "animate-pulse")} />
                  </div>
                  {/* Mouth */}
                  <div 
                    className={cn(
                        "w-8 h-4 rounded-full mt-4", 
                        code === 500 ? "bg-red-400 h-6 w-6" : "bg-[#FF6B6B]"
                    )} 
                  />
                </div>

                {/* Question marks only for 404/Default */}
                {(code === 404 || code < 400) && (
                  <>
                    <div className="absolute -top-1 -right-1 text-4xl animate-bounce-question" style={{ animationDelay: '0s' }}>❓</div>
                    <div className="absolute -top-2 -left-2 text-2xl animate-bounce-question" style={{ animationDelay: '0.3s' }}>❓</div>
                  </>
                )}
              </div>
              <div className="w-40 h-20 bg-gradient-to-b from-[#4ECDC4] to-[#3DBDB4] rounded-3xl border-4 border-[#2DAD9E] mx-auto -mt-4"></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div style={{ perspective: '1200px' }}>
            <h1 className="text-[120px] leading-none tracking-tight font-bold animate-3d-bounce" style={{
              background: `linear-gradient(135deg, ${config.accentColor} 0%, #4ECDC4 50%, #FFD93D 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.1))',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {code}
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {config.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-lg">
            {config.message}
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#030213] to-[#050525] text-white rounded-2xl hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#030213]/50 border-4 border-[#030213]/20 font-medium text-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <style>{`
        @keyframes bounce-rotate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-25px) rotate(-8deg); }
          50% { transform: translateY(-35px) rotate(0deg); }
          75% { transform: translateY(-25px) rotate(8deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: perspective(600px) rotateZ(-45deg); }
          50% { transform: perspective(600px) rotateZ(-35deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 217, 61, 0.5)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 40px rgba(255, 217, 61, 0.8)); transform: scale(1.05); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50%, 100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes float-character {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes 3d-bounce {
          0%, 100% { transform: perspective(1200px) rotateX(5deg) translateY(0px); }
          50% { transform: perspective(1200px) rotateX(-5deg) translateY(-10px); }
        }
        .animate-bounce-rotate { animation: bounce-rotate 5s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-ping-slow { animation: ping-slow 3s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-float-character { animation: float-character 3s ease-in-out infinite; }
        .animate-3d-bounce { animation: 3d-bounce 4s ease-in-out infinite; transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};
