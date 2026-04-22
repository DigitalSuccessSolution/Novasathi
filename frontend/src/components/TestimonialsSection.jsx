import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials_config = [
  {
    image: "https://tse3.mm.bing.net/th/id/OIP.hzs888DgZf-PWWIP7Lp_YAHaLI?pid=Api&h=220&P=0",
    bgColor: "bg-amber-900/20",
  },
  {
    image: "https://tse1.mm.bing.net/th/id/OIP.KlhEBNtw-zwk_MBvXhe-DgHaLH?pid=Api&h=220&P=0",
    bgColor: "bg-blue-900/20",
  },
  {
    image: "https://tse4.mm.bing.net/th/id/OIP.sapC1cM4WIT8jxR16bju-wHaMG?pid=Api&h=220&P=0",
    bgColor: "bg-rose-900/20",
  },
  {
    image: "https://tse1.mm.bing.net/th/id/OIP.7TjG1GOARrLdpDRfWtZo7wHaL3?pid=Api&h=220&P=0",
    bgColor: "bg-emerald-900/20",
  },
];

const TestimonialsSection = () => {
  const testimonials_data = useMemo(() => {
    const items = [
      { name: "प्रिया शर्मा", topic: "कैरियर मार्गदर्शन", text: "नोवा साथी के ज्योतिष परामर्श ने मुझे मेरे कैरियर के बारे में बहुत स्पष्टता दी। सुझाव बहुत सटीक थे।" },
      { name: "राहुल वर्मा", topic: "भावनात्मक स्वास्थ्य", text: "ब्रेकअप के बाद मैं बहुत अकेला महसूस कर रहा था। 'दिल की बात' सेक्शन ने मुझे फिर से संभलने में मदद की।" },
      { name: "अंजलि गुप्ता", topic: "टैरो रीडिंग", text: "टैरो कार्ड्स की भविष्यवाणियां डरावनी रूप से सटीक थीं! इसने मुझे कठिन निर्णय लेने में विश्वास दिलाया।" },
      { name: "विकास यादव", topic: "दैनिक कल्याण", text: "हर सुबह मैं अपना लकी नंबर और रंग देखता हूं। यह मेरे दिन को सकारात्मक शुरुआत देता है।" }
    ];
    return testimonials_config.map((item, index) => ({
      ...item,
      ...items[index]
    }));
  }, []);

  const extendedTestimonials = [...testimonials_data, ...testimonials_data, ...testimonials_data];
  const totalItems = testimonials_data.length;
  
  const [currentIndex, setCurrentIndex] = useState(totalItems);
  const [isJumping, setIsJumping] = useState(false);
  const [cardsToShow, setCardsToShow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCardsToShow(1);
      else if (window.innerWidth < 1024) setCardsToShow(2);
      else setCardsToShow(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slideToIndex = (index) => {
    setIsJumping(false);
    setCurrentIndex(index);
  };

  const nextSlide = () => slideToIndex(currentIndex + 1);
  const prevSlide = () => slideToIndex(currentIndex - 1);

  const handleTransitionEnd = () => {
    if (currentIndex >= totalItems * 2) {
      setIsJumping(true);
      setCurrentIndex(currentIndex - totalItems);
    } else if (currentIndex < totalItems) {
      setIsJumping(true);
      setCurrentIndex(currentIndex + totalItems);
    }
  };

  const onDragEnd = (event, info) => {
    const threshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) nextSlide();
    else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) prevSlide();
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <section className="w-full py-16 md:py-24 px-4 flex justify-center bg-black relative overflow-hidden text-sans text-shadow-none">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          src="/testimonials.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/60 to-black"></div>
      </div>
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl w-full flex flex-col items-center relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 mb-3"
          >
            <span className="text-[#dca743] text-[9px] md:text-xs font-semibold tracking-[0.4em] ">
              ग्राहक के अनुभव
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-serif tracking-tight">
            हमारे <span className="italic">संतुष्ट उपयोगकर्ता</span>
          </h2>
        </div>

        <div className="w-full relative flex items-center gap-1 md:gap-4">
          <button
            onClick={prevSlide}
            className="flex shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 bg-white/5 items-center justify-center text-white/85 hover:text-[#dca743] hover:bg-white/10 transition-all duration-300 z-20 backdrop-blur-md group"
            aria-label="Previous story"
          >
            <span className="text-sm md:text-base transform group-hover:-translate-x-0.5 transition-transform">←</span>
          </button>

          <div className="flex-1 overflow-hidden py-4 px-1">
            <motion.div 
              className="flex gap-4 md:gap-6 cursor-grab active:cursor-grabbing select-none"
              drag="x"
              dragElastic={0.1}
              onDragEnd={onDragEnd}
              animate={{ x: `-${(currentIndex * 100) / extendedTestimonials.length}%` }}
              onAnimationComplete={handleTransitionEnd}
              transition={isJumping ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 35 }}
              style={{ width: `${(extendedTestimonials.length / cardsToShow) * 100}%` }}
            >
              {extendedTestimonials.map((testimonial, idx) => (
                <div
                  key={`${testimonial.name}-${idx}`}
                  className="flex-1 min-w-0 px-1 md:px-0"
                  style={{ width: `${100 / extendedTestimonials.length}%` }}
                >
                  <div className="h-full bg-white/2 backdrop-blur-2xl border border-white/10 border-t-white/20 border-l-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col gap-4 shadow-2xl hover:bg-white/5 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 shadow-lg overflow-hidden shrink-0">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name} 
                          className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-500"
                          onError={(e) => {
                            e.target.src = "https://ui-avatars.com/api/?name=" + testimonial.name + "&background=random";
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[#dca743] font-semibold text-xs md:text-sm tracking-wide truncate">
                          {testimonial.name}
                        </h4>
                        <span className="text-white/70 text-[9px] md:text-[10px] font-medium  tracking-widest mt-0.5 truncate">
                          {testimonial.topic}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-xs md:text-base font-light leading-relaxed italic font-serif flex-1 relative z-10 line-clamp-4">
                      "{testimonial.text}"
                    </p>

                    <div className="absolute bottom-3 right-6 text-white/5 text-5xl font-serif pointer-events-none select-none">
                      ”
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <button
            onClick={nextSlide}
            className="flex shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 bg-white/5 items-center justify-center text-white/85 hover:text-[#dca743] hover:bg-white/10 transition-all duration-300 z-20 backdrop-blur-md group"
            aria-label="Next story"
          >
            <span className="text-sm md:text-base transform group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        <div className="flex md:hidden text-[10px] text-gray-600 mt-2  tracking-[0.2em] animate-pulse">
           ← एक्सप्लोर करने के लिए स्वाइप करें →
        </div>

        <div className="flex justify-center items-center w-full gap-2 mt-8 md:mt-12">
          {testimonials_data.map((_, idx) => (
            <button
              key={idx}
              onClick={() => slideToIndex(totalItems + idx)}
              className="relative p-1 group"
              aria-label={`Go to testimonial ${idx + 1}`}
            >
              <div
                className={`transition-all duration-500 rounded-full h-1 ${
                  (currentIndex % totalItems) === idx
                    ? "w-8 bg-[#dca743]"
                    : "w-1.5 bg-white/10 group-hover:bg-white/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
export default TestimonialsSection;
