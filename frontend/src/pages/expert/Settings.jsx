import React, { useState, useEffect } from "react";
import { Settings, ShieldCheck, Power, Bell, Sparkles, MessageSquare, Info, Smartphone, Eye, Clock, Save, Loader2 } from "lucide-react";
import ExpertLayout from "../../components/ExpertLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Expert Settings Sanctuary - Control Divine Presence
 */
const ExpertSettings = () => {
    const { user, api } = useAuth();
    const { toast } = useToast();
    const [presence, setPresence] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/experts/me");
            setPresence(res.data.data.expert.isOnline);
        } catch (err) {
            if (err.response?.status === 404) {
                // Silently handle or redirect? Let's redirect to overview which shows the prompt
                window.location.href = "/expert-panel";
            }
            console.error("🌌 [SETTINGS_ERROR] Resonance sync failed:", err);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [api]);

    const handleSaveStatus = async () => {
        try {
            setIsSaving(true);
            const res = await api.patch("/experts/toggle-online");
            setPresence(res.data.data.isOnline);
            toast(`Status Updated: You are now ${res.data.data.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        } catch (err) {
            toast("Alignment failed: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ExpertLayout>
            <div className="max-w-7xl mx-auto space-y-8 text-left">
                
                <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                         <Settings size={24} />
                    </div>
                    <div className="space-y-1">
                         <h2 className="text-[10px] font-sans font-semibold  tracking-[0.5em] text-white/85">Control Sanctuary</h2>
                         <h1 className="text-2xl font-light  tracking-tight italic">Sanctuary <span className="font-semibold not-italic text-purple-400">Configuration</span> ✨</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Presence Portal */}
                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-purple-500/10 hover:bg-white/5 transition-all duration-700 relative overflow-hidden active:scale-95 h-[220px]">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         
                         <div className="space-y-4 relative z-10">
                              <div className="flex items-center gap-4 text-white/85">
                                   <Power size={14} className="text-purple-400" />
                                   <span className="text-[10px] font-sans font-semibold  tracking-widest leading-none">Spiritual Presence</span>
                              </div>
                              <div className="space-y-1.5">
                                   <h3 className="text-lg font-light  tracking-tight text-white/80 group-hover:text-white transition-colors">{presence ? 'Accepting Seekers' : 'Resting Spirit'}</h3>
                                   <p className="text-[9px] font-sans font-semibold text-white/85  tracking-widest leading-loose italic">Toggle your visibility in the sanctuary search to accept new rituals.</p>
                              </div>
                         </div>
                         <button 
                             onClick={handleSaveStatus}
                             disabled={isSaving}
                             className={`w-full py-3 rounded-xl font-sans font-semibold text-[10px]  tracking-[0.4em] transition-all relative overflow-hidden flex items-center justify-center gap-3 ${presence ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600/20 text-rose-500 border border-rose-500/20'}`}
                         >
                               {isSaving ? <Loader2 size={14} className="animate-spin" /> : presence ? <Eye size={14} /> : <Eye size={14} className="opacity-40" />}
                               {presence ? 'Go Offline' : 'Go Online Now'}
                         </button>
                    </div>

                    {/* Divine Notifications */}
                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-purple-500/10 hover:bg-white/5 transition-all duration-700 relative overflow-hidden active:scale-95 h-[220px]">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="space-y-4 relative z-10">
                              <div className="flex items-center gap-4 text-white/85">
                                   <Bell size={14} className="text-amber-400" />
                                   <span className="text-[10px] font-sans font-semibold  tracking-widest leading-none">Vibration Alerts</span>
                              </div>
                              <div className="space-y-1.5">
                                   <h3 className="text-lg font-light  tracking-tight text-white/80 group-hover:text-white transition-colors">Aura Notifications</h3>
                                   <p className="text-[9px] font-sans font-semibold text-white/85  tracking-widest leading-loose italic">Receive celestial notifications via Browser and WhatsApp for new seekers.</p>
                              </div>
                         </div>
                         <div className="flex bg-black/40 border border-white/5 rounded-xl p-1.5 items-center justify-between mt-auto">
                              <span className="px-4 text-[10px] font-sans font-semibold  tracking-widest text-white/85">WhatsApp Sync</span>
                              <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full p-1 relative flex items-center transition-all ${notifications ? 'bg-emerald-600' : 'bg-white/10'}`}>
                                   <div className={`w-4 h-4 bg-white rounded-full shadow-2xl transition-all ${notifications ? 'ml-auto' : ''}`}></div>
                              </button>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-white/2 border border-white/5 rounded-xl space-y-4 group hover:bg-white/5 transition-all text-center">
                    <div className="flex items-center justify-center gap-4">
                         <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Smartphone size={16} /></div>
                         <div className="text-left">
                              <h4 className="text-[10px] font-sans font-semibold  tracking-[0.2em] text-white/85 font-sans">Verification Aura</h4>
                              <p className="text-[9px] font-sans font-semibold text-white/85  tracking-widest mt-0.5">Identity verified via device {user?.phone?.slice(0, 4)}XXXX{user?.phone?.slice(-4)}</p>
                         </div>
                    </div>
                </div>

                <div className="p-6 border border-dashed border-white/10 rounded-2xl group hover:border-purple-500/20 transition-all text-center space-y-4">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xl">
                          <ShieldCheck size={24} className="text-white/85" />
                     </div>
                     <div className="space-y-1.5">
                          <h4 className="text-[10px] font-sans font-semibold  tracking-[0.4em]">Privacy Sanctum</h4>
                          <p className="text-[9px] font-sans font-semibold text-white/85  tracking-wider leading-loose italic">Update your soul guides or security keys. Changes reflect within 300 cosmic seconds.</p>
                     </div>
                     <button className="px-8 py-3 bg-white text-black hover:bg-purple-600 hover:text-white rounded-xl font-sans font-semibold text-[10px]  tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3 mx-auto">
                          <Settings size={14} /> Advanced Ritual Protocol
                     </button>
                </div>
            </div>
        </ExpertLayout>
    );
};

export default ExpertSettings;
