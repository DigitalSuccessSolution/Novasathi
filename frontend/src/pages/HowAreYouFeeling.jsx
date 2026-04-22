import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const moods = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    color: "from-yellow-500/30 to-orange-500/30",
    border: "border-yellow-500/40",
    glow: "shadow-yellow-500/20",
    hoverBorder: "hover:border-yellow-400/60",
    textColor: "text-yellow-400",
    image: "/happy.png",
  },
  {
    id: "sad",
    label: "Sad",
    emoji: "😔",
    color: "from-blue-500/30 to-indigo-500/30",
    border: "border-blue-500/40",
    glow: "shadow-blue-500/20",
    hoverBorder: "hover:border-blue-400/60",
    textColor: "text-blue-400",
    image: "/sad.png",
  },
  {
    id: "anxious",
    label: "Anxious",
    emoji: "😰",
    color: "from-purple-500/30 to-violet-500/30",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/20",
    hoverBorder: "hover:border-purple-400/60",
    textColor: "text-purple-400",
    image: "/anxious.png",
  },
  {
    id: "heartbroken",
    label: "Heartbroken",
    emoji: "💔",
    color: "from-rose-500/30 to-pink-500/30",
    border: "border-rose-500/40",
    glow: "shadow-rose-500/20",
    hoverBorder: "hover:border-rose-400/60",
    textColor: "text-rose-400",
    image: "/heartbroken.png",
  },
  {
    id: "frustrated",
    label: "Frustrated",
    emoji: "😤",
    color: "from-orange-500/30 to-red-500/30",
    border: "border-orange-500/40",
    glow: "shadow-orange-500/20",
    hoverBorder: "hover:border-orange-400/60",
    textColor: "text-orange-400",
    image: "/frustrated.png",
  },
  {
    id: "confused",
    label: "Confused",
    emoji: "😕",
    color: "from-teal-500/30 to-cyan-500/30",
    border: "border-teal-500/40",
    glow: "shadow-teal-500/20",
    hoverBorder: "hover:border-teal-400/60",
    textColor: "text-teal-400",
    image: "/confused.png",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const HowAreYouFeeling = () => {
  const navigate = useNavigate();

  const starsArr = useMemo(
    () =>
      Array.from({ length: 50 }).map(() => ({
        id: Math.random(),
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        size: Math.random() * 2 + 1 + "px",
        animationDuration: Math.random() * 3 + 2 + "s",
        animationDelay: Math.random() * 2 + "s",
        opacity: Math.random() * 0.4 + 0.2,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-[#080010] text-white relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          src="/feeling.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[#080010]/60" />
      </div>

      {/* Starry overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {starsArr.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: star.animationDuration,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-700/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-blue-700/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen py-16 px-4">
        {/* Back Button */}
        <div className="w-full max-w-4xl mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-14 space-y-4"
        >
          <p className="text-purple-400/80 text-sm font-semibold  tracking-[0.3em]">NovaSathi · Emotional Wellness</p>
          <h1 className="text-4xl md:text-6xl font-serif font-semibold text-white leading-tight">
            How are you{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              feeling
            </span>{" "}
            today?
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto leading-relaxed font-light text-sm md:text-base">
            Choose your current emotion. We'll connect you with the right support and guidance just for you.
          </p>
        </motion.div>

        {/* Mood Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl"
        >
          {moods.map((mood) => (
            <motion.div
              key={mood.id}
              variants={cardVariants}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/feeling/${mood.id}`)}
              className={`relative group cursor-pointer rounded-2xl md:rounded-3xl border backdrop-blur-xl p-5 md:p-8 flex flex-col items-center gap-4 transition-all duration-400 shadow-xl ${mood.border} ${mood.hoverBorder} bg-white/3 hover:bg-white/6`}
              style={{ boxShadow: `0 8px 40px 0 rgba(0,0,0,0.4)` }}
            >
              {/* Glow on hover */}
              <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${mood.color} opacity-0 group-hover:opacity-100 transition-opacity duration-400`} />

              {/* Image */}
              <div className="relative z-10">
                <div className={`absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-400 bg-gradient-to-br ${mood.color}`} />
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 ${mood.border} overflow-hidden relative z-10 shadow-lg`}>
                  <img
                    src={mood.image}
                    alt={mood.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl">${mood.emoji}</div>`;
                    }}
                  />
                </div>
              </div>

              {/* Label */}
              <p className={`relative z-10 text-base md:text-xl font-semibold tracking-wide ${mood.textColor} group-hover:scale-105 transition-transform duration-300`}>
                {mood.label}
              </p>

              {/* Arrow indicator */}
              <div className={`relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${mood.textColor}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-12 text-gray-600 text-xs text-center max-w-sm"
        >
          All conversations are 100% anonymous &amp; confidential. You are not alone. 💜
        </motion.p>
      </div>
    </div>
  );
};

export default HowAreYouFeeling;
