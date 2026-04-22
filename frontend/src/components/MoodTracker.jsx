import { useNavigate } from "react-router-dom";

const moods_config = [
  { image: "/numb.png", key: "numb" },
  { image: "/mood_sad.png", key: "sad" },
  { image: "/mood_angry.png", key: "frustrated" },
  { image: "/mood_anxious.png", key: "anxious" },
  { image: "/mood_heartbroken.png", key: "heartbroken" },
  { image: "/mood_confused.png", key: "confused" },
];
    
const MoodTracker = () => {
  const navigate = useNavigate();

  const moodLabels = {
    numb: "Kuch feel hi nahi ho raha",
    sad: "Andar se toot gaya hoon",
    frustrated: "Sab pe gussa aa raha hai",
    anxious: "Anxiety on full mode hai",
    heartbroken: "Dil toot gaya yaar",
    confused: "Sab gad-mad hai dimag mein",
  };

  return (
    <section id="mood-tracker" className="relative w-full py-12 md:py-16 px-2 flex justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          src="/feeling.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#020205] via-[#08040f]/20 to-[#130821]/50"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center md:items-start">
        <h2 className="text-2xl md:text-3xl lg:text-4xl text-white font-serif tracking-wide mb-6 md:mb-10 text-center md:text-left drop-shadow-md">
          Aaj ka mood kya hai?
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 md:gap-5 w-full">
          {moods_config.map((mood, index) => (
            <button
              key={index}
              onClick={() => navigate(`/feeling/${mood.key}`)}
              className="relative p-px rounded-2xl md:rounded-3xl bg-linear-to-br from-purple-900/50 via-white/50 to-purple-900/50 hover:from-purple-500 hover:via-white hover:to-purple-500 transition-all duration-500 group cursor-pointer overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center w-full h-full py-4 md:py-8 px-2 md:px-6 rounded-[15px] md:rounded-[23px] bg-[#0b0c11] group-hover:bg-[#07080c] transition-colors duration-300">
                <div className="relative mb-3 md:mb-4">
                  {/* Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-60 transition-opacity duration-500 ${index % 2 === 0 ? "bg-purple-600" : "bg-blue-600"}`}
                  ></div>

                  {/* Image Container */}
                  <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-white/10 group-hover:border-white/40 overflow-hidden bg-white/2 backdrop-blur-2xl transition-all duration-500 shadow-2xl flex items-center justify-center p-0.5">
                    <img
                      src={mood.image}
                      alt={moodLabels[mood.key]}
                      className="w-full h-full object-cover rounded-full transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <span className="text-[10px] md:text-sm text-gray-400 font-medium tracking-wide group-hover:text-white transition-colors duration-300">
                  {moodLabels[mood.key]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MoodTracker;
