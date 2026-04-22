import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CardSection = () => {

  // Generate random stars for the background
  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      id: Math.random(),
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      size: Math.random() * 2 + 1 + "px",
      animationDuration: Math.random() * 3 + 2 + "s",
      animationDelay: Math.random() * 2 + "s",
      opacity: Math.random() * 0.4 + 0.2,
    }));
  }, []);

  return (
    <section className="relative w-full py-12 px-6 md:px-12 lg:px-24 bg-black overflow-hidden font-serif antialiased border-t border-white/5">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          src="/tarot.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-[#08040f]/60 to-[#130821]"></div>
      </div>
      {/* Starry Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
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
          ></div>
        ))}
      </div>

      {/* Mystic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col mb-12">
          <h2 className="text-5xl md:text-6xl text-white font-light tracking-tight">
            Tarot <span className="italic font-serif">Readings</span>
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: The Arch Cards (Login & Signup) */}
          <div className="flex gap-4 md:gap-8 w-full lg:w-1/2 items-end">
            {/* Login Arch Card */}
            <motion.div
              className="flex-1 bg-white/2 backdrop-blur-2xl rounded-t-full h-[400px] md:h-[500px] hover:h-[450px] md:hover:h-[600px] hover:-translate-y-4 border border-white/10 border-t-white/20 border-l-white/20 relative flex flex-col items-center justify-between py-12 px-6 text-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)] overflow-hidden group transition-all duration-500 ease-out"
            >
              {/* Background Image Layer */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop"
                  alt="Mystical Nature"
                  className="w-full h-full object-cover opacity-25 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent"></div>
              </div>

              <span className="text-xs font-sans tracking-[0.4em] text-yellow-500/60  relative z-10 font-semibold">
                Members
              </span>

              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 mx-auto border border-yellow-500/10 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md shadow-inner">
                  <svg
                    className="w-6 h-6 text-yellow-500/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl md:text-4xl text-white font-light tracking-tight leading-tight">
                  Daily <br />{" "}
                  <span className="text-yellow-500 font-serif italic">
                    Log In
                  </span>
                </h3>
              </div>

              <Link to="/login" className="relative z-10 px-2 md:px-8 py-2 md:py-3 border border-yellow-500/20 rounded-full text-[7px] md:text-[10px] md:text-xs font-sans tracking-[0.3em] text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-500  font-semibold bg-black/40 backdrop-blur-lg">
                Access Portal
              </Link>
            </motion.div>

            {/* Signup Arch Card (Red Style) */}
            <motion.div
              className="flex-1 bg-white/2 backdrop-blur-2xl rounded-t-full h-[450px] md:h-[600px] hover:h-[500px] md:hover:h-[720px] hover:-translate-y-4 border border-red-500/20 border-t-white/20 border-l-white/20 relative flex flex-col items-center justify-between py-14 px-6 text-center shadow-[0_-20px_50px_rgba(127,29,29,0.3)] overflow-hidden group transition-all duration-500 ease-out"
            >
              {/* Background Image Layer */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=1000&auto=format&fit=crop"
                  alt="Cosmic Portal"
                  className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-red-950 via-transparent to-black/20"></div>
              </div>

              <span className="text-xs font-sans tracking-[0.4em] text-orange-200/40  relative z-10 font-semibold">
                Join Now
              </span>

              <div className="space-y-6 relative z-10 w-full">
                <h3 className="text-3xl md:text-4xl text-white font-light italic leading-tight">
                  Universal <br />{" "}
                  <span className="text-orange-300 font-sans not-italic font-semibold tracking-tighter">
                    Sign Up
                  </span>
                </h3>

                {/* Decorative Experience Divider */}
                <div className="flex flex-col items-center py-4">
                  <div className="w-px h-16 bg-linear-to-b from-transparent via-white/40 to-transparent"></div>
                  <span className="text-[9px] tracking-[0.6em]  text-white/85 py-4 font-sans">
                    Experience
                  </span>
                  <div className="w-px h-16 bg-linear-to-b from-transparent via-white/40 to-transparent"></div>
                </div>
              </div>

              <Link to="/signup" className="relative z-10 px-8 py-4 bg-red-600/20 hover:bg-red-600 border border-red-500/40 rounded-full text-[10px] md:text-xs font-sans tracking-[0.3em] text-white transition-all duration-500 shadow-2xl  font-semibold backdrop-blur-md">
                Register Today..
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: Date & Content Section */}
          <div className="w-full lg:w-1/2 flex flex-col gap-10 items-start pt-10 lg:pt-0">
            {/* Content Container */}
            <div className="w-full space-y-8">
              <div className="flex items-baseline space-x-4">
                <span className="text-6xl font-sans font-light text-white">
                  09
                </span>
                <div className="flex flex-col border-l border-yellow-500/30 pl-4">
                  <span className="text-2xl text-yellow-500  tracking-widest">
                    March
                  </span>
                  <span className="text-xs text-white/70  tracking-tighter">
                    Monday Morning
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xl text-white font-serif italic border-b border-yellow-900/40 pb-2">
                  Card of the Moment
                </h4>
                <p className="text-sm text-gray-400 font-sans leading-relaxed tracking-wide">
                  Mystical alignment suggests a period of transition. The energy today is focused on internal growth and revealing hidden truths through the arts of intuition.
                </p>
              </div>

              {/* Wider Insight Card positioned BELOW the status */}
              <motion.div
                className="w-full h-[200px] md:h-[300px] bg-white/2 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden relative shadow-2xl group mt-6"
              >
                <img
                  src="/tarotcard.png"
                  alt="Crystal Ball"
                  className="w-full h-full object-cover "
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardSection;
