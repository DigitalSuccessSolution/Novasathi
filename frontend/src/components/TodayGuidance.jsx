import React from "react";

const TodayGuidance = () => {
  return (
    <section className="w-full py-12 md:py-16 px-4 flex justify-center bg-[#130821] bg-linear-to-b from-[#130821] to-[#0a0a20]">
      <div className="max-w-4xl w-full flex flex-col items-center md:items-start">
        <h2 className="text-2xl md:text-3xl lg:text-4xl text-white font-serif tracking-wide mb-6 md:mb-10 text-center md:text-left drop-shadow-md">
          Today's Guidance
        </h2>

        <div className="flex flex-col gap-4 md:gap-5 w-full">
          {/* Daily Panchang Card */}
          <div className="w-full bg-[#0b0c11]/60 backdrop-blur-xl border border-yellow-700/20 rounded-2xl p-3 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-yellow-600/40 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-5 md:mb-6">
              <span className="text-2xl drop-shadow-md">🪔</span>
              <h3 className="text-lg md:text-xl text-gray-200 font-serif font-semibold tracking-wide">
                Daily Panchang
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <div className="bg-[#151720]/60 rounded-xl p-2 md:p-4">
                <p className="text-[11px] md:text-xs text-white/70 font-medium tracking-wider mb-1">
                  Tithi
                </p>
                <p className="text-xs md:text-base text-gray-300 font-medium">
                  Shukla Chaturthi
                </p>
              </div>
              <div className="bg-[#151720]/60 rounded-xl p-2 md:p-4">
                <p className="text-[11px] md:text-xs text-white/70 font-medium tracking-wider mb-1">
                  Nakshatra
                </p>
                <p className="text-xs md:text-base text-gray-300 font-medium">
                  Rohini
                </p>
              </div>
              <div className="bg-[#151720]/60 rounded-xl p-2 md:p-4">
                <p className="text-[11px] md:text-xs text-white/70 font-medium tracking-wider mb-1">
                  Yoga
                </p>
                <p className="text-xs md:text-base text-gray-300 font-medium">
                  Siddhi
                </p>
              </div>
              <div className="bg-[#151720]/60 rounded-xl p-2 md:p-4">
                <p className="text-[11px] md:text-xs text-white/70 font-medium tracking-wider mb-1">
                  Best Time
                </p>
                <p className="text-xs md:text-base text-[#dca743] font-medium">
                  10:30 AM - 12:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Daily Tip Card */}
          <div className="w-full bg-[#0b0c11]/60 backdrop-blur-xl border border-yellow-700/20 rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-start sm:items-center gap-4 hover:border-yellow-600/40 transition-colors duration-300">
            <span className="text-2xl mt-0.5 sm:mt-0 drop-shadow-md">💡</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 w-full">
              <h3 className="text-sm md:text-base text-[#dca743] font-serif font-semibold whitespace-nowrap">
                Daily Tip
              </h3>
              <span className="hidden sm:block text-gray-600">|</span>
              <p className="text-sm md:text-base text-gray-300">
                Good day for starting new learning activities
              </p>
            </div>
          </div>

          {/* Exam Stress Muhurat Card */}
          <div className="w-full bg-[#0b0c11]/60 backdrop-blur-xl border border-yellow-700/20 rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-start sm:items-center gap-4 hover:border-yellow-600/40 transition-colors duration-300">
            <span className="text-2xl mt-0.5 sm:mt-0 drop-shadow-md">📝</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 w-full">
              <h3 className="text-sm md:text-base text-gray-300 font-serif font-semibold whitespace-nowrap">
                Exam Stress Muhurat
              </h3>
              <span className="hidden sm:block text-gray-600">|</span>
              <p className="text-sm md:text-base text-gray-400">
                Best study time today:{" "}
                <span className="text-[#dca743] font-medium">
                  10:30 AM - 12:00 PM
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodayGuidance;
