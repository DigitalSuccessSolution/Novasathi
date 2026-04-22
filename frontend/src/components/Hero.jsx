import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const Hero = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          src="/hero2.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60"
        />

        {/* Bottom Fade to Black for smooth merged transition */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-t from-[#020205] to-transparent"></div>
      </div>

      {/* Navbar visible within the Hero */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Hero Content Centered */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center px-6 text-center max-w-full overflow-hidden">
        <div className="max-w-7xl space-y-2 lg:space-y-4 animate-fade-in-up mt-10 md:mt-40   py-12 px-3 md:px-6">
          
          <h1 className="text-3xl md:text-6xl  text-white leading-tight tracking-tight font-serif text-shadow-lg">
            यार, सब ठीक है ना? नहीं है? <span className="text-purple-200 italic">चल बात करते हैं। </span>
          </h1>
          <p className="text-xs md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light">
          Life mein sab confusing lag raha hai? Career, love, future — sab ek saath? Chill. Hum hain na. Pehle 5 min free mein baat kar — judge zero, pressure zero. 🙌</p>

          <div className="flex flex-row items-center justify-center gap-3 md:gap-6 pt-6 w-full">
            <Link 
              to="/dil-ki-baat"
              className="px-3 py-3 md:px-10 md:py-4 rounded-full bg-purple-600 text-white font-semibold text-xs md:text-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-purple-500 hover:shadow-[0_4px_30px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 flex-1 sm:flex-none sm:min-w-[200px]"
            >
               हाँ यार, बात करनी है
            </Link>
            <Link 
              to="/stars-and-future"
              className="px-3 py-3 md:px-10 md:py-4 rounded-full bg-white text-black font-semibold text-xs md:text-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-gray-200 hover:shadow-[0_4px_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 flex-1 sm:flex-none sm:min-w-[200px]"
            >
              Experts देखो
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
