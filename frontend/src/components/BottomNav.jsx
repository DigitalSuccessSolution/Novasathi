import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide BottomNav on Chat Screen
  if (location.pathname.startsWith("/chat/")) {
    return null;
  }

  const isStarsActive = location.pathname === "/stars-and-future" || location.pathname === "/";
  const isDilActive = location.pathname === "/dil-ki-baat";

  const highlightGradient = isDilActive 
    ? "from-amber-400 via-yellow-500 to-amber-600" 
    : "from-indigo-600 to-violet-600";

  const glowShadow = isDilActive 
    ? "shadow-[0_0_20px_rgba(245,158,11,0.5)]" 
    : "shadow-[0_0_20px_rgba(139,92,246,0.5)]";

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px]">
      <div className="relative flex items-center bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-full p-1 overflow-hidden">
        
        {/* Sliding Highlight */}
        <div 
          className={`absolute h-[calc(100%-10px)] w-[calc(50%-5px)] bg-gradient-to-r ${highlightGradient} rounded-full transition-all duration-500 ease-in-out z-0 ${
            isDilActive ? "left-[calc(50%+2.5px)]" : "left-[2.5px]"
          } ${glowShadow}`}
        />

        {/* Stars & Future Button */}
        <button 
          onClick={() => navigate("/stars-and-future")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-full transition-all duration-300 ${
            isStarsActive ? "text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isStarsActive ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={isStarsActive ? 1.5 : 2}
            stroke="currentColor"
            className={`w-5 h-5 transition-transform duration-300 ${isStarsActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "scale-100"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
          <span className={`text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${isStarsActive ? "text-white shadow-sm" : ""}`}>सितारे और भविष्य</span>
        </button>

        {/* Dil Ki Baat Button */}
        <button 
          onClick={() => navigate("/dil-ki-baat")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-full transition-all duration-300 ${
            isDilActive ? "text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isDilActive ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={isDilActive ? 1.5 : 2}
            stroke="currentColor"
            className={`w-5 h-5 transition-transform duration-300 ${isDilActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "scale-100"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
          <span className={`text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${isDilActive ? "text-white shadow-sm" : ""}`}>दिल की बात</span>
        </button>

      </div>
    </div>

  );
};

export default BottomNav;

