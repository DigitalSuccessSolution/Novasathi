import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ExpertLayout from "../../components/ExpertLayout";

/**
 * HandBook - Ultra Simple Text Document UI
 */
const Handbook = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHandbook = async () => {
            try {
                setLoading(true);
                const res = await api.get("/daily/content", { params: { type: "HANDBOOK" } });
                setSections(res.data.data);
            } catch (err) {
                console.error("🌌 [HANDBOOK_SYNC_ERROR]", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHandbook();
    }, [api]);

    return (
        <ExpertLayout>
            <div className="max-w-none py-6 px-6 text-white/90">
                {/* Navigation */}
                <button 
                    onClick={() => navigate(-1)}
                    className="mb-6 group flex items-center gap-4 text-white/40 hover:text-white transition-all active:scale-95"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Back to Dashboard</span>
                </button>

                {/* Basic Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold mb-2">Expert Handbook</h1>
                    <p className="text-white/50 text-sm">Guidelines and professional standards for Nova Sathi experts.</p>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-20 text-center text-white/20">Loading content...</div>
                ) : sections.length > 0 ? (
                    <div className="space-y-8">
                        {sections.map((section) => (
                            <div key={section.id} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-semibold text-emerald-400 tracking-tight transition-colors">
                                        {section.title}
                                    </h2>
                                </div>
                                
                                <div className="text-white/70 text-base leading-relaxed font-medium whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center text-white/10">No content available.</div>
                )}

                {/* Simple Security Notice */}
                <div className="mt-20 border-t border-rose-500/20 pt-8">
                    <h3 className="text-rose-500 font-semibold uppercase tracking-widest text-sm mb-3">Safety Warning</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                        Strictly avoid sharing any personal contact details. Sharing phone numbers, emails, or social media handles will lead to permanent account suspension.
                    </p>
                </div>

                <div className="mt-20 text-center opacity-10 text-[10px] uppercase font-bold tracking-widest pb-10">
                    Nova Sathi Expert Operations Manual
                </div>
            </div>
        </ExpertLayout>
    );
};

export default Handbook;
