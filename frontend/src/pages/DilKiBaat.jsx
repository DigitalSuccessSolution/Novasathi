import React, { useState, useEffect } from "react";
import { 
  Search, 
  MessageSquare, 
  Phone, 
  Video, 
  CheckCircle, 
  Star, 
  ChevronRight,
  User,
  ArrowLeft,
  Languages,
  Briefcase
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { motion as m, AnimatePresence } from "framer-motion";
import { useCall } from "../context/CallContext";
import IntakeForm from "../components/IntakeForm";
import StatusPopup from "../components/StatusPopup";
import socket from "../lib/socket";

const DilKiBaat = () => {
    const navigate = useNavigate();
    const { token, api, setIsLoginModalOpen } = useAuth();
    const { toast } = useToast();
    const { initiateCall, callActive } = useCall();

    const [listeners, setListeners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    // Intake Form State
    const [isIntakeOpen, setIsIntakeOpen] = useState(false);
    const [intakeExpert, setIntakeExpert] = useState(null);
    const [intakeType, setIntakeType] = useState('CHAT');
    const [statusModal, setStatusModal] = useState({ open: false, expert: null, type: 'busy' });

    const [filters, setFilters] = useState([
        { id: "all", label: "all experts" },
        { id: "online", label: "currently online" },
        { id: "top", label: "top rated" }
    ]);

    const fetchListeners = async () => {
        try {
            setLoading(true);
            const res = await api.get("/experts?category=dilkibaat");
            setListeners(res.data.data.experts || []);
        } catch (err) {
            console.error("🌌 [FETCH_ERROR]", err);
            toast("failed to load experts", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const res = await api.get("/experts/meta/categories");
            const dilCat = res.data.data.find(c => c.code === 'dilkibaat');
            if (dilCat) {
                const dynamicFilters = [
                    { id: "all", label: "all experts" },
                    { id: "online", label: "currently online" },
                    { id: "top", label: "top rated" },
                    ...dilCat.skills.map(s => ({ id: s.name.toLowerCase(), label: s.name.toLowerCase() }))
                ];
                setFilters(dynamicFilters);
            }
        } catch (err) {
            console.error("Meta load failed");
        }
    };

    useEffect(() => {
        fetchListeners();
        fetchMetadata();

        // Listen for real-time status updates
        const handleStatusUpdate = ({ expertId, status }) => {
            setListeners(prev => prev.map(expert => 
                expert.id === expertId ? { 
                    ...expert, 
                    onlineStatus: status,
                    isOnline: status !== 'offline'
                } : expert
            ));
        };

        socket.on('expert_status_update', handleStatusUpdate);

        return () => {
            socket.off('expert_status_update', handleStatusUpdate);
        };
    }, []);

    const openIntake = (expert, type) => {
        if (!token) {
            setIsLoginModalOpen(true);
            return;
        }
        if (expert.onlineStatus === 'busy') {
            setStatusModal({ open: true, expert, type: 'busy' });
            return;
        }
        if (!expert.isOnline) {
            setStatusModal({ open: true, expert, type: 'offline' });
            return;
        }
        setIntakeExpert(expert);
        setIntakeType(type);
        setIsIntakeOpen(true);
    };

    const handleIntakeSubmit = async (formData) => {
        try {
            const res = await api.post("/chat/start", { 
                expertId: intakeExpert._id || intakeExpert.id, 
                type: intakeType,
                intakeData: formData
            });
            const session = res.data.data.session;
            let url = `/chat/${session.id}`;
            
            if (intakeType === 'CALL' || intakeType === 'VIDEO') {
                url += `?autoCall=true&type=${intakeType === 'VIDEO' ? 'video' : 'voice'}`;
                if (!callActive) {
                    const partnerInfo = {
                        name: intakeExpert.displayName || "Expert",
                        avatar: intakeExpert.profileImage || null
                    };
                    initiateCall(session.id, intakeType === 'VIDEO' ? 'video' : 'voice', partnerInfo);
                }
            }
            navigate(url);
        } catch (err) {
            toast(err.response?.data?.message || "expert is busy", "error");
        } finally {
            setIsIntakeOpen(false);
        }
    };

    const filteredListeners = listeners.filter(listener => {
        const displayName = listener.displayName || "Expert";
        const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = listener.category === 'dilkibaat';
        
        if (activeFilter === "online") return matchesSearch && listener.isOnline && matchesCategory;
        if (activeFilter === "top") return matchesSearch && listener.avgRating >= 4.5 && matchesCategory;
        if (activeFilter === "all") return matchesSearch && matchesCategory;
        
        // Skill matching
        const matchesSkill = (listener.specializations || []).some(s => s.toLowerCase() === activeFilter);
        return matchesSearch && matchesCategory && matchesSkill;
    });

    return (
      <div className="min-h-screen bg-[#0d0f17] text-[#e2e8f0] pb-24">
        <IntakeForm isOpen={isIntakeOpen} onClose={() => setIsIntakeOpen(false)} onSubmit={handleIntakeSubmit} expert={intakeExpert} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <header className="pt-24 md:pt-32 pb-12">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-medium ">back</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white ">Dil Ki Baat</h1>
                <p className="text-slate-400 text-lg font-light  max-w-xl leading-relaxed">
                  connect with verified professionals for personalized consultation and guidance.
                </p>
              </div>

              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="search experts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161922] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 shadow-inner"
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
                    ? "bg-indigo-600 text-white"
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
                {filteredListeners.map((listener) => (
                  <m.div
                    key={listener._id || listener.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => navigate(`/expert/${listener._id || listener.id}`)}
                    className="group relative bg-[#161922] border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:bg-[#1c212e] hover:border-indigo-500/20 cursor-pointer shadow-xl flex flex-col sm:flex-row gap-6"
                  >
                    {/* Avatar Block */}
                    <div className="relative shrink-0 w-24 h-24">
                      <div className="w-full h-full rounded-full overflow-hidden border border-white/5 group-hover:border-indigo-500/30 transition-all duration-500">
                        <img
                          src={listener.profileImage || `https://ui-avatars.com/api/?name=${listener.displayName}&background=6366f1&color=fff`}
                          alt={listener.displayName}
                          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#161922] shadow-2xl ${listener.onlineStatus === 'busy' ? 'bg-amber-500' : listener.isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        {(listener.onlineStatus === 'busy' || listener.isOnline) && <div className={`w-full h-full rounded-full bg-white ${listener.onlineStatus === 'busy' ? '' : 'animate-pulse'} opacity-40`} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-medium text-white group-hover:text-indigo-400 transition-colors truncate ">
                            {listener.displayName}
                          </h2>
                          <CheckCircle size={14} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded-md border border-white/5">
                          <Star size={10} className="text-indigo-400 fill-indigo-400" />
                          <span className="text-[10px] font-bold text-white">{listener.avgRating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                         <div className="flex items-center gap-1.5">
                            <Briefcase size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-400 font-medium ">{listener.experience || 5}y experience</span>
                         </div>
                         <div className="w-1 h-1 bg-slate-700 rounded-full" />
                         <div className="flex items-center gap-1.5">
                            <Languages size={12} className="text-slate-500" />
                            <span className="text-[10px] text-slate-400 font-medium truncate ">{listener.languages?.slice(0, 2).join(", ") || "english, hindi"}</span>
                         </div>
                      </div>

                      <p className="text-xs text-slate-500 font-light leading-relaxed mb-3 line-clamp-2  opacity-80">
                        {listener.shortBio || "verified professional guide offering consultation and advice."}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {(listener.specializations || listener.categories || ['consultant']).slice(0, 3).map(spec => (
                           <span key={spec} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10 text-[9px] font-medium text-indigo-400 ">
                             {spec}
                           </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-medium text-white">₹{listener.pricePerMinute}</span>
                          <span className="text-[10px] text-slate-600 font-light ">/min</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); if(listener.onlineStatus !== 'busy') openIntake(listener, 'CHAT'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all  ${
                              listener.onlineStatus === 'busy' 
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-wait"
                              : listener.isOnline 
                              ? "bg-white text-black hover:bg-slate-200 shadow-lg" 
                              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            <MessageSquare size={14} />
                            <span>{listener.onlineStatus === 'busy' ? 'busy' : 'chat'}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if(listener.onlineStatus !== 'busy') openIntake(listener, 'CALL'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all  ${
                              listener.onlineStatus === 'busy' 
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-wait"
                              : listener.isOnline 
                              ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
                              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            <Phone size={14} />
                            <span>{listener.onlineStatus === 'busy' ? 'busy' : 'call'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <StatusPopup 
            isOpen={statusModal.open}
            onClose={() => setStatusModal({ ...statusModal, open: false })}
            expert={statusModal.expert}
            type={statusModal.type}
        />
      </div>
    );
};

export default DilKiBaat;
