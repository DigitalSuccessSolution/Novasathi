import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Search, 
  Languages, 
  Briefcase, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Phone
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import IntakeForm from "../components/IntakeForm";

const StarsAndFuture = () => {
  const navigate = useNavigate();
  const { token, api, setIsLoginModalOpen } = useAuth();
  const { toast } = useToast();
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [experts, setExperts] = useState([]);

  // Intake Form State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [intakeType, setIntakeType] = useState('CHAT');

  const [filters, setFilters] = useState([{ id: "all", label: "All Sessions" }]);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const staticExperts = [
    {
      id: "s1",
      displayName: "arjun sharma",
      avgRating: 4.8,
      totalSessions: 342,
      shortBio: "senior consultant specializing in career guidance and academic planning.",
      pricePerMinute: 15,
      profileImage: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&q=80&w=200&h=200",
      languages: ["hindi", "english"],
      experience: 12,
      specializations: ["astrology", "career"],
      isOnline: true
    },
    {
      id: "s2",
      displayName: "maya d'souza",
      avgRating: 4.9,
      totalSessions: 518,
      shortBio: "professional expert with focus on relationship analysis and career growth.",
      pricePerMinute: 20,
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
      languages: ["english", "hindi"],
      experience: 8,
      specializations: ["tarot", "love"],
      isOnline: true
    },
    {
        id: "s3",
        displayName: "pandit ravi",
        avgRating: 4.9,
        totalSessions: 234,
        shortBio: "numerology professional focusing on business growth and financial planning.",
        pricePerMinute: 15,
        profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200",
        languages: ["hindi", "marathi"],
        experience: 15,
        specializations: ["numerology", "finance"],
        isOnline: false
    }
  ];

  useEffect(() => {
    const loadMetadata = async () => {
        try {
            const res = await api.get("/experts/meta/categories");
            const starCat = res.data.data.find(c => c.code === 'starandfuture');
            if (starCat) {
                const dynamicFilters = [
                    { id: "all", label: "All Sessions" },
                    ...starCat.skills.map(s => ({ id: s.name.toLowerCase(), label: s.name }))
                ];
                setFilters(dynamicFilters);
            }
        } catch (err) {
            console.error("Meta load failed");
        } finally {
            setMetaLoaded(true);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/experts?category=starandfuture");
            if (res.data.data.experts?.length > 0) {
                setExperts(res.data.data.experts);
            } else {
                setExperts(staticExperts);
            }
        } catch (err) {
            setExperts(staticExperts);
        } finally {
            setLoading(false);
        }
    };
    loadMetadata();
    loadData();
  }, []);

  const openIntake = (expert, type) => {
    if (!token) {
        setIsLoginModalOpen(true);
        return;
    }
    setSelectedExpert(expert);
    setIntakeType(type);
    setIsIntakeOpen(true);
  };

  const handleIntakeSubmit = async (formData) => {
    try {
        const res = await api.post("/chat/start", { 
            expertId: selectedExpert._id || selectedExpert.id, 
            type: intakeType,
            intakeData: formData
        });
        navigate(`/chat/${res.data.data.session.id}`);
    } catch (err) {
        toast("expert is busy", "error");
    } finally {
        setIsIntakeOpen(false);
    }
  };

  const filteredExperts = experts.filter(e => {
    const displayName = e.displayName || "expert";
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || (e.specializations || []).some(s => s.toLowerCase().includes(activeFilter));
    const matchesCategory = e.category === 'starandfuture';
    return matchesSearch && matchesFilter && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0d0f17] text-[#e2e8f0] pb-24">
      <IntakeForm isOpen={isIntakeOpen} onClose={() => setIsIntakeOpen(false)} onSubmit={handleIntakeSubmit} expert={selectedExpert} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <header className="pt-24 md:pt-32 pb-12">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-medium  tracking-wide">back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white ">Star & Future</h1>
              <p className="text-slate-400 text-lg font-light  max-w-xl leading-relaxed">
                Connect with verified experts for professional guidance and personal consultation.
              </p>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="search experts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161922] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto pb-10 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-6 py-2.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-[#161922] text-slate-500 border border-white/5 hover:border-white/10 hover:text-slate-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
            <div className="py-24 text-center space-y-4">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">loading</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              <AnimatePresence mode="popLayout">
                {filteredExperts.map((expert) => (
                  <motion.div
                    key={expert.id || expert._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => navigate(`/expert/${expert._id || expert.id}`)}
                    className="group relative bg-[#161922] border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:bg-[#1c212e] hover:border-indigo-500/20 cursor-pointer shadow-xl flex flex-col sm:flex-row gap-6"
                  >
                    {/* Avatar Block */}
                    <div className="relative shrink-0 w-24 h-24">
                      <div className="w-full h-full rounded-full overflow-hidden border border-white/5 group-hover:border-indigo-500/30 transition-all duration-500">
                        <img
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.displayName}&background=6366f1&color=fff`}
                          alt={expert.displayName}
                          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#161922] shadow-2xl ${expert.isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        {expert.isOnline && <div className="w-full h-full rounded-full bg-white animate-pulse opacity-40" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-medium text-white group-hover:text-indigo-400 transition-colors truncate ">
                            {expert.displayName}
                          </h2>
                          <CheckCircle size={14} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded-md border border-white/5">
                          <Star size={10} className="text-indigo-400 fill-indigo-400" />
                          <span className="text-[10px] font-bold text-white">{expert.avgRating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                         <div className="flex items-center gap-1.5">
                            <Briefcase size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-400 font-medium ">{expert.experience || 5}y experience</span>
                         </div>
                         <div className="w-1 h-1 bg-slate-700 rounded-full" />
                         <div className="flex items-center gap-1.5">
                            <Languages size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-400 font-medium truncate ">{expert.languages?.slice(0, 2).join(", ") || "english, hindi"}</span>
                         </div>
                      </div>

                      <p className="text-xs text-slate-500 font-light leading-relaxed mb-3 line-clamp-2  opacity-80">
                        {expert.shortBio || "verified professional guide offering consultation and advice."}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {(expert.specializations || expert.categories || ['consultant']).slice(0, 3).map(spec => (
                           <span key={spec} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10 text-[9px] font-medium text-indigo-400 ">
                             {spec}
                           </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-medium text-white">₹{expert.pricePerMinute}</span>
                          <span className="text-[10px] text-slate-600 font-light ">/min</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openIntake(expert, 'CHAT'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all  ${
                              expert.isOnline 
                              ? "bg-white text-black hover:bg-slate-200 shadow-lg" 
                              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            <MessageSquare size={14} />
                            <span>chat</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openIntake(expert, 'CALL'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all  ${
                              expert.isOnline 
                              ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
                              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            <Phone size={14} />
                            <span>call</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
};

export default StarsAndFuture;
