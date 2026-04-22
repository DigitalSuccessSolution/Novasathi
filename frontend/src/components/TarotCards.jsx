import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X, Flame, Droplets, Wind, Mountain, Moon, Sun, Star } from "lucide-react";

const zodiacs_config = [
  { 
    name: "मेष", 
    date: "Mar 21 - Apr 19", 
    image: "/aries.png",
    element: "Fire",
    planet: "Mars",
    icon: Flame,
    color: "#ff4d4d",
    description: "The pioneer and trailblazer. You possess an uncompromising energy and the courage to lead where others hesitate. Your spirit is fueled by passion and the thrill of new beginnings.",
    traits: ["Brave", "Passionate", "Independent"]
  },
  { 
    name: "वृषभ", 
    date: "Apr 20 - May 20", 
    image: "/taurus.png",
    element: "Earth",
    planet: "Venus",
    icon: Mountain,
    color: "#2ecc71",
    description: "The anchor of the zodiac. Grounded and patient, you find beauty in the tangible world. Your strength lies in your unwavering loyalty and your ability to build lasting foundations.",
    traits: ["Loyal", "Stubborn", "Practical"]
  },
  { 
    name: "मिथुन", 
    date: "May 21 - Jun 20", 
    image: "/gemini.png",
    element: "Air",
    planet: "Mercury",
    icon: Wind,
    color: "#3498db",
    description: "The cosmic messenger. Your mind is a whirlwind of ideas and curiosity. You bridge worlds through communication, ever-adapting and seeking the next intellectual adventure.",
    traits: ["Versatile", "Witty", "Expressive"]
  },
  { 
    name: "कर्क", 
    date: "Jun 21 - Jul 22", 
    image: "/cancer.png",
    element: "Water",
    planet: "Moon",
    icon: Droplets,
    color: "#9b59b6",
    description: "The celestial nurturer. Deeply intuitive and emotionally attuned, you carry the tides of the moon within. You create sanctuary for yourself and those you love.",
    traits: ["Empathetic", "Protective", "Creative"]
  },
  { 
    name: "सिंह", 
    date: "Jul 23 - Aug 22", 
    image: "/leo.png",
    element: "Fire",
    planet: "Sun",
    icon: Sun,
    color: "#f1c40f",
    description: "The royal heart. Radiant and charismatic, you lead with generosity and warmth. Your presence lights up the world, driven by a desire to leave a legacy of joy and creativity.",
    traits: ["Generous", "Confident", "Ambitious"]
  },
  { 
    name: "कन्या", 
    date: "Aug 23 - Sep 22", 
    image: "/virgo.png",
    element: "Earth",
    planet: "Mercury",
    icon: Mountain,
    color: "#16a085",
    description: "The sacred analyst. You see the divine in the details. Your path is one of service and refinement, bringing order and purity to the chaos of the world.",
    traits: ["Modest", "Diligent", "Reliable"]
  },
  { 
    name: "तुला", 
    date: "Sep 23 - Oct 22", 
    image: "/libra.png",
    element: "Air",
    planet: "Venus",
    icon: Wind,
    color: "#ff9ff3",
    description: "The seeker of harmony. You navigate life through the lens of balance and beauty. A diplomat of the spirit, you strive to create connection and justice in all things.",
    traits: ["Charming", "Fair", "Social"]
  },
  { 
    name: "वृश्चिक", 
    date: "Oct 23 - Nov 21", 
    image: "/scorpio.png",
    element: "Water",
    planet: "Pluto",
    icon: Droplets,
    color: "#c0392b",
    description: "The alchemist of the soul. Your intensity is your power. You dive into the depths where others fear to tread, emerging transformed and ever-resilient.",
    traits: ["Determined", "Brave", "Secretive"]
  },
  { 
    name: "धनु", 
    date: "Nov 22 - Dec 21", 
    image: "/sagittarius.png",
    element: "Fire",
    planet: "Jupiter",
    icon: Flame,
    color: "#e67e22",
    description: "The eternal traveler. Your bow is aimed at the highest truths. Fueled by optimism and a thirst for wisdom, you find home in the journey and the unknown.",
    traits: ["Honest", "Wise", "Carefree"]
  },
  { 
    name: "मकर", 
    date: "Dec 22 - Jan 19", 
    image: "/capricorn.png",
    element: "Earth",
    planet: "Saturn",
    icon: Mountain,
    color: "#2c3e50",
    description: "The mountain climber. With unyielding discipline and time as your ally, you scale the peaks of ambition. You represent the strength of endurance and tradition.",
    traits: ["Patient", "Hardworking", "Resilient"]
  },
  { 
    name: "कुंभ", 
    date: "Jan 20 - Feb 18", 
    image: "/aquarius.png",
    element: "Air",
    planet: "Uranus",
    icon: Wind,
    color: "#00d2d3",
    description: "The cosmic visionary. You live for the future and the collective good. Independent and original, you break old molds to envision a more awakened world.",
    traits: ["Original", "Independent", "Logical"]
  },
  { 
    name: "मीन", 
    date: "Feb 19 - Mar 20", 
    image: "/pisces.png",
    element: "Water",
    planet: "Neptune",
    icon: Droplets,
    color: "#45aaf2",
    description: "The dreamer of deep waters. Dissolving boundaries, you feel the interconnectedness of all life. Your soul is a vast ocean of compassion and artistic intuition.",
    traits: ["Kind", "Intuitive", "Gentle"]
  },
];

export default function TarotCards() {
  const [index, setIndex] = useState(2);
  const [selectedSign, setSelectedSign] = useState(null);
  const dragX = useMotionValue(0);

  // Generate random stars for the background
  const starsArr = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      id: Math.random(),
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      size: Math.random() * 2 + 1 + "px",
      animationDuration: Math.random() * 3 + 2 + "s",
      animationDelay: Math.random() * 2 + "s",
      opacity: Math.random() * 0.4 + 0.2,
    }));
  }, []);

  const nextZodiac = () => setIndex((prev) => (prev + 1) % zodiacs_config.length);
  const prevZodiac = () =>
    setIndex((prev) => (prev - 1 + zodiacs_config.length) % zodiacs_config.length);

  const visibleZodiacs = useMemo(() => {
    const range = [-2, -1, 0, 1, 2];
    return range.map((offset) => {
      const idx = (index + offset + zodiacs_config.length) % zodiacs_config.length;
      return { ...zodiacs_config[idx], offset };
    });
  }, [index]);

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-hidden flex flex-col items-center justify-center font-serif py-12 md:py-24 relative">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          src="/tarot.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black"></div>
      </div>
      {/* Stary Background Effect */}
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
          ></div>
        ))}
      </div>
      {/* Background Glow  */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="container mx-auto px-3 md:px-12 relative z-10 flex flex-col items-center">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-16"
        >
          <span className="text-xs  tracking-[0.5em] text-purple-500/80 mb-3 block">
            The Zodiac Circle
          </span>
          <h1 className="text-4xl md:text-6xl tracking-tight  font-extralight mb-4">
            Celestial{" "}
            <span className="text-purple-400 italic font-medium">Wisdom</span>
          </h1>
          <div className="w-24 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-white/85 text-sm md:text-lg leading-relaxed tracking-wide font-light">
            Journey through the ancient mysteries of the stars. Discover how your zodiac sign unveils the cosmic blueprints of your personality, destiny, and spiritual path.
          </p>
        </motion.div>

        {/* Carousel / Arc Container */}
        <div className="relative w-full max-w-7xl h-[320px] md:h-[550px] flex items-center justify-center">
          {/* Navigation Arrows */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center z-50 pointer-events-none px-4 md:px-0 md:-mx-8 lg:-mx-16">
            <button
              onClick={prevZodiac}
              className="pointer-events-auto group opacity-40 hover:opacity-100 transition-all p-3 bg-black/20 rounded-full hover:bg-white/5 active:scale-90"
            >
              <svg
                width="45"
                height="45"
                viewBox="0 0 100 100"
                className="rotate-180"
              >
                <path
                  d="M20 50 L80 50 M65 35 L80 50 L65 65"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              onClick={nextZodiac}
              className="pointer-events-auto group opacity-40 hover:opacity-100 transition-all p-3 bg-black/20 rounded-full hover:bg-white/5 active:scale-90"
            >
              <svg width="45" height="45" viewBox="0 0 100 100">
                <path
                  d="M20 50 L80 50 M65 35 L80 50 L65 65"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Fanned Cards Container */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center perspective-1000 cursor-grab active:cursor-grabbing"
            drag="x"
            style={{ x: dragX }}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(e, { offset }) => {
              const swipe = offset.x;
              if (swipe < -60) nextZodiac();
              else if (swipe > 60) prevZodiac();
              dragX.set(0);
            }}
          >
            <AnimatePresence mode="popLayout">
              {visibleZodiacs.map((sign) => {
                const isMobile =
                  typeof window !== "undefined" && window.innerWidth < 768;

                const xSpread = isMobile ? 55 : 240;
                const ySpread = isMobile ? 12 : 55;
                
                const xBase = sign.offset * xSpread;
                const yBase = Math.abs(sign.offset) * ySpread;
                
                return (
                  <motion.div
                    key={sign.name}
                    initial={false}
                    animate={{
                      x: xBase,
                      y: yBase,
                      rotate: sign.offset * (isMobile ? 6 : 12),
                      scale: 1 - Math.abs(sign.offset) * (isMobile ? 0.12 : 0.15),
                      opacity: 1 - Math.abs(sign.offset) * (isMobile ? 0.4 : 0.45),
                      zIndex: 10 - Math.abs(sign.offset),
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 32,
                      mass: 0.5,
                    }}
                    className={`absolute ${sign.offset === 0 ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
                    onClick={() => sign.offset === 0 && setSelectedSign(sign)}
                  >
                    <div
                      className={`relative w-[135px] h-[190px] md:w-[260px] md:h-[360px] bg-[#0a0a12] border rounded-lg flex flex-col items-center justify-center shadow-2xl select-none overflow-hidden transition-all duration-500 ${
                        sign.offset === 0
                          ? "border-purple-500/60 shadow-purple-900/30 ring-1 ring-purple-500/20"
                          : "border-white/10"
                      }`}
                    >
                      {/* Inner Decorative Border */}
                      <div className="absolute inset-2 border border-white/5 rounded-md pointer-events-none"></div>

                      {/* Image Section */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img
                          src={sign.image}
                          alt={sign.name}
                          className={`w-full h-full object-cover transition-all duration-700 ${sign.offset === 0 ? "opacity-70 grayscale-0" : "opacity-40 grayscale-40"}`}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a12] via-transparent to-transparent"></div>
                      </div>

                      {/* Zodiac Name for the center card */}
                      {sign.offset === 0 && (
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                           <span className="text-white text-lg md:text-2xl font-light tracking-widest ">
                             {sign.name}
                           </span>
                        </div>
                      )}
                      
                    
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 md:mt-20 text-center"
        >
          <p className="text-sm md:text-base font-extralight tracking-[0.4em]  opacity-60">
            Ancient Wisdom for the <br />
            <span className="font-medium tracking-[0.2em] text-purple-300">
              Modern Soul
            </span>
          </p>
        </motion.div>
      </div>

      {/* Detailed View Modal/Overlay */}
      <AnimatePresence>
        {selectedSign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSign(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0a12]/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row scrollbar-hide"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedSign(null)}
                className="fixed md:absolute top-8 right-8 p-2 rounded-full bg-black/40 md:bg-white/5 hover:bg-white/10 transition-colors z-[110] backdrop-blur-md"
              >
                <X size={24} className="text-white/70" />
              </button>

              {/* Left Side: Image/Symbol */}
              <div className="w-full md:w-2/5 h-[220px] md:h-auto min-h-[220px]   md:min-h-0 relative shrink-0">
                <img 
                  src={selectedSign.image} 
                  alt={selectedSign.name} 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-linear-to-b md:bg-linear-to-r from-transparent to-[#0a0a12]"></div>
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0a12] via-transparent to-transparent"></div>
                
          
              </div>

              {/* Right Side: Details */}
              <div className="w-full md:w-3/5 p-6 md:p-12 flex flex-col justify-center relative overflow-hidden">
                {/* Background Text - Hidden on very small screens or smaller */}
                <div className="hidden lg:block absolute -top-10 -right-10 text-[150px] font-semibold text-white/[0.02] select-none pointer-events-none ">
                  {selectedSign.name}
                </div>

                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-purple-400 tracking-[0.3em]  text-[10px] md:text-xs mb-2 block"
                >
                  {selectedSign.date}
                </motion.span>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-7xl font-light  tracking-tighter mb-3 md:mb-8"
                >
                  {selectedSign.name}
                </motion.h2>

                <div className="flex gap-6 md:gap-8 mb-6 md:mb-8">
                  <div className="flex flex-col">
                    <span className="text-white/60 text-[9px] md:text-[10px]  tracking-widest mb-1">Element</span>
                    <div className="flex items-center gap-2">
                      <selectedSign.icon size={14} color={selectedSign.color} className="md:w-4 md:h-4" />
                      <span className="text-sm md:text-base text-white/80">{selectedSign.element}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/60 text-[9px] md:text-[10px]  tracking-widest mb-1">Ruling Planet</span>
                    <div className="flex items-center gap-2">
                       <Star size={12} className="md:w-3.5 md:h-3.5 text-purple-400" />
                      <span className="text-sm md:text-base text-white/80">{selectedSign.planet}</span>
                    </div>
                  </div>
                </div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/85 text-base md:text-lg leading-relaxed font-light mb-8 md:mb-10 max-w-lg"
                >
                  {selectedSign.description}
                </motion.p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {selectedSign.traits.map((trait, i) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      key={trait}
                      className="px-3 py-1.5 md:px-4 md:py-2 border border-white/5 bg-white/[0.02] rounded-full"
                    >
                      <span className="text-[10px] md:text-sm text-white/85 tracking-widest ">{trait}</span>
                    </motion.div>
                  )) || null}
                </div>

                {/* Call to Action or Footer */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.6 }}
                   className="mt-8 md:mt-12 flex items-center gap-4 group cursor-pointer"
                >
                  <div className="h-px w-6 md:w-8 bg-purple-500 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-[10px] md:text-xs  tracking-[0.3em] text-white/50 group-hover:text-purple-400 transition-colors">Discover Your Full Horoscope</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
