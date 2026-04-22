import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { moodContent } from "../data/moodContent";

const Section = ({ title, children, theme, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`mb-14 pb-14 border-b ${theme.border} border-opacity-30 last:border-none last:mb-0 last:pb-0`}
  >
    <h2 className={`text-2xl md:text-3xl font-serif font-semibold mb-6 ${theme.text}`}>{title}</h2>
    {children}
  </motion.div>
);

const MoodDetail = () => {
  const { mood: moodId } = useParams();
  const navigate = useNavigate();
  const mood = moodContent[moodId];

  const starsArr = useMemo(
    () =>
      Array.from({ length: 35 }).map(() => ({
        id: Math.random(),
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        size: Math.random() * 2 + 1 + "px",
        dur: Math.random() * 3 + 2 + "s",
        del: Math.random() * 2 + "s",
        op: Math.random() * 0.35 + 0.15,
      })),
    []
  );

  if (!mood) {
    return (
      <div className="min-h-screen bg-[#080010] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-5xl mb-4">🌌</p>
          <h2 className="text-xl font-semibold mb-4">Mood not found</h2>
          <button onClick={() => navigate("/#mood-tracker")} className="text-purple-400 underline">
            Go back to Mood Tracker
          </button>
        </div>
      </div>
    );
  }

  const { theme, insight, why, tips, lucky, affirmation } = mood;

  return (
    <div className="min-h-screen bg-[#060010] text-white relative overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          src="/feeling.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[#060010]/65" />
      </div>

      {/* Stars */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {starsArr.map((s) => (
          <div
            key={s.id}
            className="absolute bg-white rounded-full animate-pulse"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDuration: s.dur, animationDelay: s.del, opacity: s.op }}
          />
        ))}
      </div>

      {/* Glow blobs */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] ${theme.glow} rounded-full blur-[160px] pointer-events-none z-0 opacity-50`} />
      <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] ${theme.glow} rounded-full blur-[130px] pointer-events-none z-0 opacity-25`} />

      <div className="relative z-10 max-w-3xl mx-auto px-2 md:px-4 py-12">

        {/* ── BACK BUTTON ── */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => navigate("/#mood-tracker")}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-10 group text-sm font-medium"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Mood badlo
        </motion.button>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className={`rounded-3xl border ${theme.border} overflow-hidden mb-14 relative`}
        >
          <img
            src={`/${moodId}.png`}
            alt={mood.label}
            className="w-full h-52 md:h-72 object-cover opacity-70"
            onError={(e) => (e.target.style.display = "none")}
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#060010] via-[#060010]/10 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 md:p-10">
            <div className="flex items-center gap-4">
              {/* <span className="text-5xl">{mood.emoji}</span> */}
              <h1 className={`text-3xl md:text-5xl font-serif font-semibold ${theme.text}`}>{mood.label}</h1>
            </div>
            <p className="text-gray-300 text-sm md:text-lg font-light">{mood.tagline}</p>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            SECTION 1 — COSMIC INSIGHT
        ══════════════════════════════════════════ */}
        <Section title={insight.title} theme={theme} delay={0.1}>
          <div className={`rounded-2xl bg-linear-to-br ${theme.soft} border ${theme.border} p-3 md:p-8`}>
            {insight.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-gray-300 leading-8 text-sm md:text-base mb-4 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 2 — WHY YOU FEEL THIS
        ══════════════════════════════════════════ */}
        <Section title={why.title} theme={theme} delay={0.2}>
          {/* Planetary */}
          <div className={`mb-6 rounded-2xl border ${theme.border} bg-white/2 p-3 md:p-8`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl">🪐</span>
              <h3 className={`text-lg font-semibold ${theme.text}`}>{why.planetary.heading}</h3>
            </div>
            <ul className="space-y-5">
              {why.planetary.points.map((pt, i) => (
                <li key={i} className="flex gap-4">
                  <span className={`mt-1 shrink-0 w-2 h-2 rounded-full bg-linear-to-br ${theme.color} shadow-lg`} style={{ marginTop: "8px" }} />
                  <p className="text-gray-300 text-sm md:text-base leading-7">{pt}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Lifestyle */}
          <div className={`rounded-2xl border ${theme.border} bg-white/2 p-3 md:p-8`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl">🧬</span>
              <h3 className={`text-lg font-semibold ${theme.text}`}>{why.lifestyle.heading}</h3>
            </div>
            <ul className="space-y-5">
              {why.lifestyle.points.map((pt, i) => (
                <li key={i} className="flex gap-4">
                  <span className={`shrink-0 w-2 h-2 rounded-full bg-linear-to-br ${theme.color}`} style={{ marginTop: "8px" }} />
                  <p className="text-gray-300 text-sm md:text-base leading-7">{pt}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 3 — WHAT TO DO
        ══════════════════════════════════════════ */}
        <Section title={tips.title} theme={theme} delay={0.3}>
          <p className="text-white/70 text-sm md:text-base leading-7 mb-8">{tips.intro}</p>
          <div className="space-y-6">
            {tips.list.map((tip, i) => (
              <div
                key={i}
                className={`rounded-2xl border ${theme.border} bg-white/2 p-3 md:p-8 flex gap-5`}
              >
                <span className="text-3xl shrink-0">{tip.icon}</span>
                <div>
                  <h3 className={`text-base md:text-lg font-semibold mb-3 ${theme.text}`}>{tip.heading}</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-7">{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 4 — LUCKY THINGS TODAY
        ══════════════════════════════════════════ */}
        <Section title={lucky.title} theme={theme} delay={0.4}>
          <div className={`rounded-2xl bg-linear-to-br ${theme.soft} border ${theme.border} p-3 md:p-8 space-y-8`}>
            {/* Color */}
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">🎨</div>
              <div>
                <p className={`text-xs  tracking-widest mb-1 ${theme.text} font-semibold`}>Lucky Color</p>
                <p className="text-white font-semibold text-lg mb-2">{lucky.color.value}</p>
                <p className="text-gray-400 text-sm leading-6">{lucky.color.reason}</p>
              </div>
            </div>
            <div className={`border-t ${theme.border} opacity-30`} />

            {/* Number */}
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">🔢</div>
              <div>
                <p className={`text-xs  tracking-widest mb-1 ${theme.text} font-semibold`}>Lucky Number</p>
                <p className="text-white font-semibold text-lg mb-2">{lucky.number.value}</p>
                <p className="text-gray-400 text-sm leading-6">{lucky.number.reason}</p>
              </div>
            </div>
            <div className={`border-t ${theme.border} opacity-30`} />

            {/* Time */}
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">⏰</div>
              <div>
                <p className={`text-xs  tracking-widest mb-1 ${theme.text} font-semibold`}>Lucky Time</p>
                <p className="text-white font-semibold text-lg mb-2">{lucky.time.value}</p>
                <p className="text-gray-400 text-sm leading-6">{lucky.time.reason || lucky.time.detail}</p>
              </div>
            </div>
            <div className={`border-t ${theme.border} opacity-30`} />

            {/* Activity */}
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">✨</div>
              <div>
                <p className={`text-xs  tracking-widest mb-1 ${theme.text} font-semibold`}>Lucky Activity</p>
                <p className="text-white font-semibold text-lg mb-2">{lucky.activity.value}</p>
                <p className="text-gray-400 text-sm leading-6">{lucky.activity.reason}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 5 — AFFIRMATION
        ══════════════════════════════════════════ */}
        <Section title={affirmation.title} theme={theme} delay={0.5}>
          <div className={`rounded-3xl bg-linear-to-br ${theme.soft} border ${theme.border} p-8 md:p-12 text-center`}>
            <p className="text-3xl mb-6">{mood.emoji}</p>
            <blockquote className="text-white text-lg md:text-2xl font-serif leading-10 mb-6 italic">
              {affirmation.line}
            </blockquote>
            <p className="text-gray-400 text-sm leading-7 max-w-xl mx-auto">{affirmation.note}</p>
          </div>
        </Section>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/dil-ki-baat")}
            className={`px-8 py-4 rounded-2xl ${theme.btn} text-white font-semibold shadow-xl hover:opacity-90 hover:scale-105 transition-all duration-300`}
          >
            Kisi Se Baat Karo 💬
          </button>
          <button
            onClick={() => navigate("/#mood-tracker")}
            className={`px-8 py-4 rounded-2xl border ${theme.border} text-white font-semibold hover:bg-white/5 transition-all duration-300`}
          >
            Doosra Mood Choose Karo
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodDetail;
