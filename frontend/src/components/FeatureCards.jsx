import React from "react";
import { motion } from "framer-motion";
import { Stars, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnimatedStars = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px md:w-0.5 md:h-0.5 bg-white rounded-full"
          initial={{
            x: Math.random() * 400,
            y: Math.random() * 200,
            opacity: Math.random(),
          }}
          animate={{
            x: [null, Math.random() * 400],
            y: [null, Math.random() * 200],
            opacity: [0.1, 0.7, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 15,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

const FeatureCards = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "stars",
      title: "सितारे और भविष्य",
      desc1: "Career mein stuck? Love life confusing? ✨ Sitare sab jaante hain bhai.",
      desc2: "",
      cta: "Explore Destiny",
      icon: Stars,
      color: "from-blue-600/10 to-purple-600/10",
      accent: "text-purple-400",
      glow: "group-hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]",
      link: "/stars-and-future",
    },
    {
      id: "dil",
      title: " दिल की बात",
      desc1: "Akela feel ho raha hai? 🫂 Yahan koi timer nahi, koi judgment nahi — bas bol.",
      desc2: "",
      cta: "Connect Now",
      icon: MessageCircle,
      color: "from-pink-600/10 to-rose-600/10",
      accent: "text-rose-400",
      glow: "group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]",
      link: "/dil-ki-baat",
    },
    {
      id: "expert-hub",
      title: "एक्स्पर्ट हब",
      desc1: "Are you an expert? 🤝 Join our marketplace, find projects, and grow your professional network.",
      desc2: "",
      cta: "Join Now",
      icon: Stars,
      color: "from-emerald-600/10 to-teal-600/10",
      accent: "text-emerald-400",
      glow: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
      link: "/expert-signup",
    },
  ];

  return (
    <div className="w-full bg-linear-to-b from-[#020205] via-black to-[#020205] relative  ">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileTap={{ scale: 0.97 }}
                className={`group relative overflow-hidden rounded-xl p-4 md:p-5 bg-white/3 backdrop-blur-3xl border border-white/10 transition-all duration-500 ${card.glow}`}
              >
                {/* Animated Stars Background */}
                <AnimatedStars />

                {/* Gradient Secondary Background */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${card.color} opacity-30 group-hover:opacity-60 transition-opacity duration-500`}
                />

                <div className="relative z-10 flex flex-col items-start">
                  <div
                    className={`flex items-center gap-2.5 mb-2 ${card.accent}`}
                  >
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-white tracking-tight">
                      {card.title}
                    </h3>
                  </div>

                  <div className="mb-3 text-[13px] md:text-sm leading-tight">
                    <span className="text-gray-300 font-medium mr-1">
                      {card.desc1}
                    </span>
                    <span className="text-gray-400">{card.desc2}</span>
                  </div>

                  <a
                    href={card.link}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-[11px] font-semibold transition-all duration-300 hover:bg-white/20 group-hover:gap-2`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(card.link);
                    }}
                  >
                    {card.cta}
                    <ArrowRight
                      size={12}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </a>
                </div>

                {/* Decorative Glow */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 blur-xl rounded-full" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;
