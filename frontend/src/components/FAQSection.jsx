import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-3 md:py-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <HelpCircle
            className={`text-purple-400/50 group-hover:text-purple-400 transition-colors ${isOpen ? "text-purple-400" : ""}`}
            size={20}
          />
          <span
            className={`text-base md:text-lg font-light tracking-wide transition-colors ${isOpen ? "text-white" : "text-white/70"}`}
          >
            {question}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-white/60"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm md:text-base text-white/50 leading-relaxed font-light pl-9">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqItems = [
    { question: "क्या मेरी बातचीत गोपनीय रहेगी?", answer: "हाँ, नोवा साथी पर आपकी हर बातचीत पूरी तरह गोपनीय और सुरक्षित रहती है।" },
    { question: "एस्ट्रो-गाइड से कैसे बात करें?", answer: "आप 'स्टार और फ्यूचर' सेक्शन में जाकर किसी भी उपलब्ध विशेषज्ञ से चैट कर सकते हैं।" },
    { question: "क्या यह सेवा मुफ्त है?", answer: "शुरुआती 5 मिनट का परामर्श बिल्कुल मुफ्त है, उसके बाद मामूली शुल्क लागू होता है।" },
    { question: "मूड ट्रैकर कैसे काम करता है?", answer: "मूड ट्रैकर आपकी भावनाओं के आधार पर आपको ज्योतिषीय अंतर्दृष्टि और व्यक्तिगत सुझाव प्रदान करता है।" }
  ];

  return (
    <section className="py-12 md:py-24 bg-black relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          src="/faq.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black"></div>
      </div>
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-purple-900/10 blur-[100px] rounded-full"></div>

      <div className="container mx-auto px-3 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extralight tracking-tight  mb-4">
            अक्सर पूछे जाने वाले{" "}
            <span className="text-purple-400 italic font-medium">
              सवाल
            </span>
          </h2>
          <div className="w-24 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent mx-auto"></div>
        </div>

        <div className="max-w-3xl mx-auto bg-white/2 p-4 md:p-12 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          {faqItems.map((faq, idx) => (
            <FAQItem
              key={idx}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
