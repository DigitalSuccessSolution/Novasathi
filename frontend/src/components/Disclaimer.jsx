import React from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const Disclaimer = () => {
  return (
    <section className="w-full py-8 md:py-12 px-4 flex justify-center bg-black relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        <div className="relative overflow-hidden rounded-2xl p-4 md:p-6 bg-[#080404] border border-red-900/40 shadow-2xl text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 relative z-10">
            <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
            
            <p className="text-red-700 text-xs md:text-sm font-medium tracking-wide">
              नोवा साथी ज्योतिषीय अंतर्दृष्टि और भावनात्मक समर्थन के माध्यम से मनोरंजन और कल्याण प्रदान करता है। यह चिकित्सा या कानूनी परामर्श का विकल्प नहीं है।
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Disclaimer;
