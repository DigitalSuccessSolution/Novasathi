import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  MessageSquare, 
  Phone, 
  Video, 
  Star, 
  Clock, 
  Languages, 
  ShieldCheck,
  User,
  Activity,
  Calendar,
  Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCall } from "../context/CallContext";
import IntakeForm from "../components/IntakeForm";
import StatusPopup from "../components/StatusPopup";
import socket from "../lib/socket";

const ExpertDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, api, setIsLoginModalOpen } = useAuth();
    const { toast } = useToast();
    const { initiateCall, callActive } = useCall();
    
    const [expert, setExpert] = useState(null);
    const [loading, setLoading] = useState(true);

    // Intake Form State
    const [isIntakeOpen, setIsIntakeOpen] = useState(false);
    const [intakeType, setIntakeType] = useState('CHAT');
    const [statusModal, setStatusModal] = useState({ open: false, type: 'busy' });

    const fetchExpertDetail = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/experts/${id}`);
            setExpert(res.data.data);
        } catch (err) {
            console.error("🌌 [EXPERT_DETAIL_ERROR]", err);
            toast("failed to load expert details", "error");
            navigate("/dil-ki-baat");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpertDetail();

        // Listen for real-time status updates
        const handleStatusUpdate = ({ expertId, status }) => {
            if (id === expertId) {
                setExpert(prev => prev ? { 
                    ...prev, 
                    onlineStatus: status,
                    isOnline: status !== 'offline'
                } : prev);
            }
        };

        socket.on('expert_status_update', handleStatusUpdate);

        return () => {
            socket.off('expert_status_update', handleStatusUpdate);
        };
    }, [id]);

    const openIntake = (type = 'CHAT') => {
        if (!token) {
            setIsLoginModalOpen(true);
            return;
        }

        if (expert.onlineStatus === 'busy') {
            setStatusModal({ open: true, type: 'busy' });
            return;
        }

        if (!expert.isOnline) {
            setStatusModal({ open: true, type: 'offline' });
            return;
        }

        // Check if we have saved intake data for THIS expert in this browsing session
        const savedIntake = sessionStorage.getItem(`intake_expert_${id}`);
        if (savedIntake) {
            handleIntakeSubmit(JSON.parse(savedIntake), type);
            return;
        }

        setIntakeType(type);
        setIsIntakeOpen(true);
    };

    const handleIntakeSubmit = async (formData, overrideType) => {
        const finalType = overrideType || intakeType;
        try {
            // Save to session storage so we don't ask again for THIS expert in this browser tab
            sessionStorage.setItem(`intake_expert_${id}`, JSON.stringify(formData));

            const res = await api.post("/chat/start", { 
                expertId: id, 
                type: finalType,
                intakeData: formData
            });
            
            const session = res.data.data.session;
            let url = `/chat/${session.id}`;
            
            if (finalType === 'CALL' || finalType === 'VIDEO') {
                url += `?autoCall=true&type=${finalType === 'VIDEO' ? 'video' : 'voice'}`;
                
                if (!callActive) {
                    const partnerInfo = {
                        name: expert.displayName || "Expert",
                        avatar: expert.profileImage || null
                    };
                    initiateCall(session.id, finalType === 'VIDEO' ? 'video' : 'voice', partnerInfo);
                }
            }
            navigate(url);
        } catch (err) {
            toast(err.response?.data?.message || "expert is busy", "error");
        } finally {
            setIsIntakeOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0f17] flex flex-col items-center justify-center gap-6">
                <div className="w-10 h-10 border-[3px] border-white/5 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">loading expert</p>
            </div>
        );
    }

    if (!expert) return null;

    return (
        <div className="min-h-screen bg-[#0d0f17] text-[#e2e8f0]">
            <IntakeForm 
                isOpen={isIntakeOpen}
                onClose={() => setIsIntakeOpen(false)}
                onSubmit={handleIntakeSubmit}
                expert={expert}
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-8 md:pt-36 md:pb-12">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                <div className="relative shrink-0">
                                    <img 
                                        src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.displayName}&background=6366f1&color=fff`} 
                                        alt={expert.displayName}
                                        className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-[#0d0f17]"
                                    />
                                    {(expert.isOnline || expert.onlineStatus === 'busy') && (
                                        <div className={`absolute -bottom-1 right-2 flex items-center gap-1.5 px-3 py-1 bg-[#161922] border ${expert.onlineStatus === 'busy' ? 'border-amber-500/20' : 'border-emerald-500/20'} rounded-full shadow-lg`}>
                                            <div className={`w-1.5 h-1.5 ${expert.onlineStatus === 'busy' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'} rounded-full`} />
                                            <span className={`text-[10px] font-medium ${expert.onlineStatus === 'busy' ? 'text-amber-500' : 'text-emerald-500'} `}>{expert.onlineStatus === 'busy' ? 'busy' : 'online'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pt-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                        <h1 className="text-3xl md:text-4xl font-medium text-white ">{expert.displayName}</h1>
                                        <CheckCircle size={20} className="text-indigo-500" />
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-0">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5">
                                            <Star size={14} className="fill-indigo-400 text-indigo-400" />
                                            <span className="text-sm font-medium">{expert.avgRating.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500">
                                            <Zap size={14} />
                                            <span className="text-sm font-medium">{expert.totalSessions} sessions</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500">
                                            <Languages size={14} />
                                            <span className="text-xs font-medium">{expert.languages?.join(", ") || "english, hindi"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About Card */}
                        <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xs font-medium text-indigo-400 mb-6 flex items-center gap-2">
                                <User size={16} />
                                about expert
                            </h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-light whitespace-pre-wrap">
                                {expert.bio || expert.shortBio || "expert profile details are coming soon."}
                            </p>
                        </div>

                        {/* Reviews Card */}
                        <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xs font-medium text-indigo-400 mb-8 flex items-center gap-2">
                                <Activity size={16} />
                                user reviews
                            </h3>
                            
                            {expert.reviews && expert.reviews.length > 0 ? (
                                <div className="space-y-8">
                                    {expert.reviews.map((review) => (
                                        <div key={review.id} className="border-b border-white/5 pb-8 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}&background=1e293b&color=fff`}
                                                        className="w-10 h-10 rounded-full border-2 border-[#0d0f17]"
                                                        alt={review.user?.name}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{review.user?.name.toLowerCase()}</p>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={10} 
                                                                    className={i < review.rating ? "text-indigo-400 fill-indigo-400" : "text-slate-700"} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-light">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 italic font-light">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-slate-600 text-sm font-light">no reviews yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Consultation Card */}
                        <div className="bg-[#1c202d] border border-indigo-500/10 rounded-2xl p-8 shadow-2xl">
                            <div className="text-center mb-8">
                                <p className="text-slate-500 text-[10px] font-medium tracking-widest mb-1 uppercase">consultation price</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-medium text-white">₹{expert.pricePerMinute}</span>
                                    <span className="text-slate-500 text-sm font-light">/min</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => { if(expert.onlineStatus !== 'busy') openIntake('CHAT'); }}
                                    className={`w-full py-4 rounded-xl font-medium text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                                        expert.onlineStatus === 'busy'
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-wait shadow-none"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                                    }`}
                                >
                                    <MessageSquare size={18} />
                                    {expert.onlineStatus === 'busy' ? 'expert is busy' : 'start chat'}
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => { if(expert.onlineStatus !== 'busy') openIntake('CALL'); }}
                                        className={`py-4 rounded-xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                            expert.onlineStatus === 'busy'
                                            ? "bg-amber-500/5 text-amber-500/50 border-amber-500/10 cursor-wait"
                                            : "bg-[#161922] hover:bg-white/5 text-slate-400"
                                        }`}
                                    >
                                        <Phone size={16} />
                                        <span className="text-xs font-medium">call</span>
                                    </button>
                                    <button 
                                        onClick={() => { if(expert.onlineStatus !== 'busy') openIntake('VIDEO'); }}
                                        className={`py-4 rounded-xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                            expert.onlineStatus === 'busy'
                                            ? "bg-amber-500/5 text-amber-500/50 border-amber-500/10 cursor-wait"
                                            : "bg-[#161922] hover:bg-white/5 text-slate-400"
                                        }`}
                                    >
                                        <Video size={16} />
                                        <span className="text-xs font-medium">video</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expertise Card */}
                        <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 md:p-8">
                            <h4 className="text-[10px] font-medium text-slate-500 mb-4 uppercase tracking-widest">specializations</h4>
                            <div className="flex flex-wrap gap-2">
                                {(expert.categories || expert.specializations || ['General Support']).map(cat => (
                                    <span key={cat} className="px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs font-medium text-indigo-400">
                                        {cat.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Availability Card */}
                        <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 md:p-8">
                            <h4 className="text-[10px] font-medium text-slate-500 mb-4 uppercase tracking-widest">availability</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Calendar size={16} className="text-indigo-400" />
                                    <span className="text-sm font-light">monday — friday</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Clock size={16} className="text-indigo-400" />
                                    <span className="text-sm font-light">10:00 am — 08:00 pm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <StatusPopup 
                isOpen={statusModal.open}
                onClose={() => setStatusModal({ ...statusModal, open: false })}
                expert={expert}
                type={statusModal.type}
            />
        </div>
    );
};

export default ExpertDetail;
