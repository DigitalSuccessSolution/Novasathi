import React, { useMemo } from "react";
import { motion } from "framer-motion";

const AboutSection = () => {
  // Generate stars specifically for this section
  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map(() => ({
      id: Math.random(),
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      size: Math.random() * 2 + 1 + "px",
      animationDuration: Math.random() * 3 + 2 + "s",
      animationDelay: Math.random() * 2 + "s",
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-linear-to-t from-black via-[#08040f] to-[#130821] font-sans ">
      {/* Background Stars */}
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
        {/* Mystic Smog/Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 z-10 relative">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          {/* Left Side: Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full md:w-1/2 flex justify-center"
          >
            <div className="relative group">
              {/* Outer Glow for Image */}
              {/* <div className="absolute -inset-4 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div> */}

              <img
                src="/about.png"
                alt="Mystical Circle"
                className="w-full max-w-[300px] md:max-w-full drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-slow-spin"
              />
            </div>
          </motion.div>

          {/* Right Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full md:w-1/2 text-center md:text-left space-y-6"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-serif leading-tight">
              We Can Help Find <br className="hidden lg:block" />
              Your Future <br className="hidden lg:block" />
              <span className="text-purple-400 italic">With Mystic Arts</span>
            </h2>

            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 font-light">
              Proper guidance is essential for resolving the complexities of
              life. Our expert advisors use ancient wisdom to help you navigate
              unpredictable paths and discover what the universe has planned for
              you.
            </p>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3.5 rounded-full bg-purple-700/60 hover:bg-purple-600 text-white font-medium text-lg transition-all duration-300 border border-purple-500/50 flex items-center justify-center gap-2 mx-auto md:mx-0 group overflow-hidden relative shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slow-spin {
          animation: slow-spin 60s linear infinite;
        }
      `,
        }}
      />
    </section>
  );
};

export default AboutSection;
