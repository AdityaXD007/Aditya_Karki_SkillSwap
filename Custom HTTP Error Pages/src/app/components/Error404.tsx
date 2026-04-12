export default function Error404() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Books with Cartoon Style */}
        <div className="absolute top-[10%] left-[15%] animate-bounce-rotate" style={{ animationDelay: '0s' }}>
          <div className="relative" style={{ transform: 'perspective(600px) rotateY(-25deg) rotateX(15deg)' }}>
            <div className="w-20 h-24 bg-gradient-to-br from-[#FF6B6B] to-[#FF8787] rounded-lg shadow-2xl border-4 border-[#FF5252]" style={{ transform: 'translateZ(12px)' }}>
              <div className="w-full h-1 bg-[#FF5252] mt-2"></div>
              <div className="w-full h-1 bg-[#FF5252] mt-2"></div>
            </div>
            <div className="absolute top-0 right-0 w-6 h-24 bg-gradient-to-r from-[#FF5252] to-[#E64545] rounded-r-lg" style={{ transform: 'rotateY(90deg) translateX(10px) translateZ(2px)' }}></div>
          </div>
        </div>

        <div className="absolute bottom-[20%] right-[12%] animate-bounce-rotate" style={{ animationDelay: '1.5s' }}>
          <div className="relative" style={{ transform: 'perspective(600px) rotateY(30deg) rotateX(-10deg)' }}>
            <div className="w-16 h-20 bg-gradient-to-br from-[#4ECDC4] to-[#5FE3DA] rounded-lg shadow-2xl border-4 border-[#3DBDB4]" style={{ transform: 'translateZ(10px)' }}>
              <div className="w-full h-1 bg-[#3DBDB4] mt-2"></div>
            </div>
            <div className="absolute top-0 right-0 w-5 h-20 bg-gradient-to-r from-[#3DBDB4] to-[#2DAD9E] rounded-r-lg" style={{ transform: 'rotateY(90deg) translateX(8px) translateZ(2px)' }}></div>
          </div>
        </div>

        {/* Cartoon Pencil */}
        <div className="absolute top-[30%] right-[20%] animate-wiggle" style={{ animationDelay: '0.5s' }}>
          <div style={{ transform: 'perspective(600px) rotateZ(-45deg) rotateY(20deg)' }}>
            <div className="relative">
              <div className="w-6 h-32 bg-gradient-to-b from-[#FFD93D] to-[#FFC107] rounded-full border-4 border-[#FFA000] shadow-xl"></div>
              <div className="w-6 h-8 bg-[#FF6B6B] absolute -top-8 left-0 rounded-t-full border-4 border-t-[#FF5252] border-x-[#FF5252]"></div>
              <div className="w-8 h-10 absolute -bottom-2 left-1/2 -translate-x-1/2" style={{
                background: 'linear-gradient(to bottom, #8B4513 0%, #6B3410 100%)',
                clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
              }}></div>
              <div className="w-2 h-2 bg-[#2C1810] absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Cartoon Graduation Cap */}
        <div className="absolute top-[15%] right-[8%] animate-spin-slow">
          <div style={{ transform: 'perspective(600px) rotateX(45deg) rotateY(-15deg)' }}>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-[#050525] border-4 border-primary shadow-2xl" style={{
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                transform: 'translateZ(8px)'
              }}></div>
              <div className="w-20 h-6 bg-primary rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-[#050525]"></div>
              <div className="w-1 h-16 bg-[#FFD93D] absolute top-full left-1/2 -translate-x-1/2"></div>
              <div className="w-6 h-6 bg-[#FFD93D] rounded-full absolute top-full left-1/2 -translate-x-1/2 mt-16 border-2 border-[#FFA000] animate-swing"></div>
            </div>
          </div>
        </div>

        {/* Cartoon Light Bulb with Glow */}
        <div className="absolute bottom-[25%] left-[10%] animate-pulse-glow">
          <div style={{ transform: 'perspective(600px) rotateY(-15deg)' }}>
            <div className="relative">
              <div className="w-16 h-20 bg-gradient-to-b from-[#FFD93D] to-[#FFC107] rounded-t-full border-4 border-[#FFA000] shadow-xl relative">
                <div className="absolute inset-0 bg-[#FFEB3B] rounded-t-full opacity-50 animate-ping-slow"></div>
              </div>
              <div className="w-16 h-4 bg-gradient-to-b from-[#9E9E9E] to-[#757575] border-4 border-[#616161] border-t-0"></div>
              <div className="w-12 h-2 bg-[#424242] mx-auto"></div>
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/60 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-6 h-1 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Cartoon Stack of Papers */}
        <div className="absolute top-[50%] left-[5%] animate-bounce-slow" style={{ animationDelay: '2s' }}>
          <div style={{ transform: 'perspective(600px) rotateY(-35deg) rotateX(20deg)' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-20 bg-white border-4 border-muted-foreground/40 rounded-sm shadow-lg absolute"
                style={{
                  top: `${i * 4}px`,
                  left: `${i * 4}px`,
                  transform: `translateZ(${i * 4}px) rotate(${i * 2}deg)`,
                  zIndex: 10 - i
                }}
              >
                <div className="w-10 h-1 bg-muted-foreground/30 mt-3 ml-2"></div>
                <div className="w-12 h-1 bg-muted-foreground/30 mt-2 ml-2"></div>
                <div className="w-8 h-1 bg-muted-foreground/30 mt-2 ml-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Cartoon Stars */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 217, 61, 0.5))' }}>
              ⭐
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - Cartoon Character & Text */}
      <div className="text-center space-y-8 max-w-2xl z-10 relative">
        {/* Cartoon Character (Confused Student) */}
        <div className="flex justify-center mb-8">
          <div className="relative animate-float-character">
            {/* Head */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-b from-[#FFE4C4] to-[#FFD4A4] rounded-full border-4 border-[#D4A574] mx-auto relative overflow-hidden">
                {/* Face */}
                <div className="absolute top-12 left-8">
                  <div className="flex gap-6">
                    <div className="w-4 h-6 bg-[#2C1810] rounded-full"></div>
                    <div className="w-4 h-6 bg-[#2C1810] rounded-full"></div>
                  </div>
                  <div className="w-8 h-4 bg-[#FF6B6B] rounded-full mx-auto mt-4"></div>
                </div>
                {/* Question Marks */}
                <div className="absolute -top-8 -right-8 text-6xl animate-bounce-question">❓</div>
                <div className="absolute -top-6 -left-6 text-4xl animate-bounce-question" style={{ animationDelay: '0.3s' }}>❓</div>
              </div>
              {/* Body */}
              <div className="w-40 h-24 bg-gradient-to-b from-[#4ECDC4] to-[#3DBDB4] rounded-3xl border-4 border-[#2DAD9E] mx-auto -mt-4"></div>
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <div className="space-y-4">
          <div style={{ perspective: '1200px' }}>
            <h1 className="text-[140px] leading-none tracking-tight font-['Outfit'] font-bold animate-3d-bounce" style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #FFD93D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.1))'
            }}>
              404
            </h1>
          </div>
          <h2 className="font-['Outfit'] font-medium text-primary text-2xl">
            Oops! This lesson got lost!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Looks like this page went on a field trip and forgot to come back. Don't worry, we'll get you back on track!
          </p>
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-[#050525] text-primary-foreground rounded-2xl hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[#030213]/50 border-4 border-primary/20 font-medium text-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Learning
        </button>
      </div>

      <style>{`
        @keyframes bounce-rotate {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-25px) rotate(-8deg);
          }
          50% {
            transform: translateY(-35px) rotate(0deg);
          }
          75% {
            transform: translateY(-25px) rotate(8deg);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: perspective(600px) rotateZ(-45deg) rotateY(20deg);
          }
          25% {
            transform: perspective(600px) rotateZ(-50deg) rotateY(25deg);
          }
          75% {
            transform: perspective(600px) rotateZ(-40deg) rotateY(15deg);
          }
        }

        @keyframes spin-slow {
          from {
            transform: perspective(600px) rotateX(45deg) rotateZ(0deg);
          }
          to {
            transform: perspective(600px) rotateX(45deg) rotateZ(360deg);
          }
        }

        @keyframes swing {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(255, 217, 61, 0.5));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(255, 217, 61, 0.8));
            transform: scale(1.05);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50%, 100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }

        @keyframes float-character {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes bounce-question {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(15deg);
          }
        }

        @keyframes 3d-bounce {
          0%, 100% {
            transform: perspective(1200px) rotateX(5deg) rotateY(-5deg) translateY(0px);
          }
          50% {
            transform: perspective(1200px) rotateX(-5deg) rotateY(5deg) translateY(-10px);
          }
        }

        .animate-bounce-rotate {
          animation: bounce-rotate 5s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 4s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-swing {
          animation: swing 2s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-float-character {
          animation: float-character 3s ease-in-out infinite;
        }

        .animate-bounce-question {
          animation: bounce-question 2s ease-in-out infinite;
        }

        .animate-3d-bounce {
          animation: 3d-bounce 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
