import React, { useState, useEffect } from "react";
import { 
    User as UserIcon, ShieldCheck, Mail, Phone, MapPin, Save, 
    FileText, Upload, Plus, CreditCard, Landmark, GraduationCap,
    CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Clock,
    Eye, Settings, Star, BadgeCheck, IndianRupee, FileCheck, UploadCloud, Award, Sparkles, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExpertLayout from "../../components/ExpertLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Expert Profile Management
 * Professional workspace for managing expert account and public profile.
 */
const ExpertProfile = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState("edit"); // 'edit' or 'preview'
    const [step, setStep] = useState(1);
    const [expertData, setExpertData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kycFiles, setKycFiles] = useState({
        aadhaar: null,
        pan: null,
        certification: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [masterCategories, setMasterCategories] = useState([]);

    useEffect(() => {
        const fetchExpertData = async () => {
            try {
                const res = await api.get("/experts/me");
                const raw = res.data.data.expert;

                // Broad normalization for null safety
                const data = {
                    ...raw,
                    displayName: raw.displayName || "",
                    bio: raw.bio || "",
                    location: raw.location || "",
                    education: raw.education || "",
                    category: raw.category || "",
                    bankName: raw.bankName || "",
                    accountNumber: raw.accountNumber || "",
                    ifscCode: raw.ifscCode || "",
                    upiId: raw.upiId || "",
                    pricePerMinute: raw.pricePerMinute || 0,
                    experience: raw.experience || 0,
                    specializations: Array.isArray(raw.specializations) ? raw.specializations : 
                                    (typeof raw.specializations === 'string' ? JSON.parse(raw.specializations) : []),
                    languages: Array.isArray(raw.languages) ? raw.languages : 
                               (typeof raw.languages === 'string' ? JSON.parse(raw.languages) : [])
                };

                setExpertData(data);
                if (data.profileImage) setPreviewImage(data.profileImage);
            } catch (err) {
                toast("Could not load expert profile data.", "error");
            } finally {
                setLoading(false);
            }
        };

        const fetchMetadata = async () => {
            try {
                const res = await api.get("/experts/meta/categories");
                setMasterCategories(res.data.data || []);
            } catch (err) {
                console.error("Master categories sync failed");
            }
        };

        fetchExpertData();
        fetchMetadata();
    }, [api]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
            setExpertData({ ...expertData, profileImageFile: file });
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const formData = new FormData();
            
            const fieldsToUpdate = [
                'displayName', 'bio', 'location', 'pricePerMinute', 
                'experience', 'education', 'bankName', 'accountNumber', 
                'ifscCode', 'upiId', 'specializations', 'languages', 'category'
            ];

            fieldsToUpdate.forEach(field => {
                if (expertData[field] !== undefined) {
                    const value = Array.isArray(expertData[field]) 
                        ? JSON.stringify(expertData[field]) 
                        : expertData[field];
                    formData.append(field, value);
                }
            });

            if (expertData.profileImageFile) {
                formData.append('profileImage', expertData.profileImageFile);
            }

            // Append KYC Files
            if (kycFiles.aadhaar) formData.append('aadhaar', kycFiles.aadhaar);
            if (kycFiles.pan) formData.append('pan', kycFiles.pan);
            if (kycFiles.certification) formData.append('certification', kycFiles.certification);

            const res = await api.patch("/experts/profile", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const raw = res.data.data;
            const updatedData = {
                ...raw,
                displayName: raw.displayName || "",
                bio: raw.bio || "",
                location: raw.location || "",
                education: raw.education || "",
                bankName: raw.bankName || "",
                accountNumber: raw.accountNumber || "",
                ifscCode: raw.ifscCode || "",
                upiId: raw.upiId || "",
                pricePerMinute: raw.pricePerMinute || 0,
                experience: raw.experience || 0,
                specializations: Array.isArray(raw.specializations) ? raw.specializations : 
                                (typeof raw.specializations === 'string' ? JSON.parse(raw.specializations) : []),
                languages: Array.isArray(raw.languages) ? raw.languages : 
                          (typeof raw.languages === 'string' ? JSON.parse(raw.languages) : [])
            };

            setExpertData(updatedData);
            if (updatedData.profileImage) setPreviewImage(updatedData.profileImage);
            
            setViewMode('preview');
            toast("Profile updated successfully.", "success");
        } catch (err) {
            toast(err.response?.data?.message || "Failed to update profile.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <ExpertLayout>
             <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/20 animate-pulse">Syncing Profile Data...</div>
             </div>
        </ExpertLayout>
    );

    if (!expertData) return (
        <ExpertLayout>
            <div className="text-center p-20 text-white/40 italic font-medium text-sm">No expert profile found. Please complete onboarding.</div>
        </ExpertLayout>
    );

    const steps = [
        { id: 1, title: "Identity", icon: UserIcon, subtitle: "Branding" },
        { id: 2, title: "Documents", icon: ShieldCheck, subtitle: "KYC Details" },
        { id: 3, title: "Rituals", icon: Sparkles, subtitle: "Specialization" }
    ];

    const getStatusStyles = (status) => {
        switch(status) {
            case 'Approved': case 'APPROVED': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'Rejected': case 'REJECTED': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
            default: return 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse';
        }
    };

    return (
        <ExpertLayout>
            <div className="max-w-7xl mx-auto py-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 mb-2">
                            <ShieldCheck size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Expert Account Management</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Manage Your <span className="text-emerald-400">Expert Profile</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                         <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 border ${getStatusStyles(expertData.status)}`}>
                            {['Approved', 'APPROVED'].includes(expertData.status) ? <CheckCircle2 size={16} /> : 
                             ['Rejected', 'REJECTED'].includes(expertData.status) ? <AlertCircle size={16} /> : <Clock size={16} />}
                            <span className="text-[10px] font-bold tracking-widest uppercase">{expertData.status || 'PENDING'}</span>
                        </div>
                        <button 
                            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all shadow-xl"
                            title={viewMode === 'edit' ? "Preview Profile" : "Edit Settings"}
                        >
                            {viewMode === 'edit' ? <Eye size={20} /> : <Settings size={20} />}
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                {viewMode === 'edit' ? (
                    <motion.div 
                        key="edit-mode"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Sidebar Navigation - Responsive Design */}
                        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-3 pb-4 lg:pb-0 hide-scrollbar scroll-smooth">
                            {steps.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(s.id)}
                                    className={`flex-shrink-0 lg:w-full p-4 lg:p-5 rounded-2xl flex items-center gap-4 lg:gap-5 transition-all relative overflow-hidden group border ${
                                        step === s.id 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                                        : 'bg-white/[0.02] lg:bg-transparent border-white/5 lg:border-transparent text-white/30 hover:bg-white/5 hover:text-white/60'
                                    }`}
                                >
                                    {step === s.id && (
                                        <motion.div 
                                            layoutId="active-tab"
                                            className="absolute left-0 lg:top-1/2 lg:-translate-y-1/2 bottom-0 lg:bottom-auto w-full lg:w-1 h-1 lg:h-8 bg-emerald-500 rounded-t-full lg:rounded-r-full lg:rounded-t-none" 
                                        />
                                    )}
                                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all ${
                                        step === s.id ? 'bg-emerald-500/10' : 'bg-white/5 group-hover:bg-white/10'
                                    }`}>
                                        <s.icon size={16} className="lg:scale-110" />
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5 lg:gap-1">
                                        <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">{s.title}</span>
                                        <span className={`hidden md:block text-[8px] font-medium uppercase tracking-widest opacity-40 ${step === s.id ? 'text-emerald-400/80' : ''}`}>
                                            {s.subtitle}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Form Content */}
                        <div className="lg:col-span-9 bg-white/[0.02] border border-white/5 p-6 md:p-14 rounded-3xl md:rounded-[3.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                             <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div 
                                        key="step1" 
                                        initial={{ opacity: 0, x: 20 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <div className="flex flex-col items-center gap-6 mb-2">
                                            <div className="relative group">
                                                <div className="w-28 h-28 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50 shadow-2xl">
                                                    {previewImage ? (
                                                        <img src={previewImage} className="w-full h-full object-cover" alt="Profile" />
                                                    ) : (
                                                        <UserIcon size={40} className="text-white/10" />
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-emerald-500 border-4 border-[#0a0a0a] shadow-lg transition-transform hover:scale-105 active:scale-95">
                                                    <Upload size={16} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                </label>
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-white text-sm font-bold tracking-tight">Public Avatar</h3>
                                                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-medium mt-1">Visible to all clients on the platform</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                    <UserIcon size={12} className="opacity-60" /> Display Name
                                                </label>
                                                <input 
                                                    value={expertData.displayName || ""}
                                                    onChange={(e) => setExpertData({...expertData, displayName: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 text-white outline-none focus:border-emerald-500/30 transition-all font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                    <Phone size={12} className="opacity-60" /> Registered Phone
                                                </label>
                                                <input 
                                                    value={expertData.user?.phone || ""}
                                                    readOnly
                                                    disabled
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-2.5 text-white/60 cursor-not-allowed font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                    <Mail size={12} className="opacity-60" /> Registered Email
                                                </label>
                                                <input 
                                                    value={expertData.user?.email || "Not Provided"}
                                                    readOnly
                                                    disabled
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-2.5 text-white/60 cursor-not-allowed font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400/60 ml-1 flex items-center gap-2">
                                                    <MapPin size={12} className="opacity-40" /> Location (City)
                                                </label>
                                                <input 
                                                    value={expertData.location || ""}
                                                    onChange={(e) => setExpertData({...expertData, location: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 text-white outline-none focus:border-emerald-500/30 transition-all font-medium text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Professional Biography</label>
                                                    <span className="text-[8px] font-mono text-white/10 tracking-widest">{expertData.bio?.length || 0}/500</span>
                                                </div>
                                                <textarea 
                                                    value={expertData.bio || ""}
                                                    onChange={(e) => setExpertData({...expertData, bio: e.target.value})}
                                                    rows={4}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-emerald-500/30 transition-all resize-none leading-relaxed text-[14px]"
                                                    placeholder="Tell us about your background and expertise..."
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {step === 2 && (
                                    <motion.div 
                                        key="step2" 
                                        initial={{ opacity: 0, x: 20 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {[
                                                { id: 'aadhaar', label: 'Aadhaar Card', icon: FileCheck, required: true },
                                                { id: 'pan', label: 'PAN Card', icon: FileCheck, required: true },
                                                { id: 'certification', label: 'Certifications', icon: Award, required: false }
                                            ].map((doc) => {
                                                const existingDoc = expertData.documents?.find(d => d.type === doc.id.toUpperCase());
                                                const selectedFile = kycFiles[doc.id];
                                                
                                                return (
                                                    <div key={doc.id} className="space-y-3">
                                                        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                            <doc.icon size={12} className="opacity-60" /> {doc.label} {doc.required && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        <div className={`relative group border-2 border-dashed transition-all rounded-3xl p-8 flex flex-col items-center justify-center gap-4 ${
                                                            selectedFile || existingDoc 
                                                            ? 'border-emerald-500/30 bg-emerald-500/5' 
                                                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                                        }`}>
                                                            {selectedFile || existingDoc ? (
                                                                <>
                                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                                                                        <FileText size={24} />
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-white text-[11px] font-bold tracking-tight truncate max-w-[200px]">
                                                                            {selectedFile ? selectedFile.name : `${doc.label} Uploaded`}
                                                                        </p>
                                                                        <p className="text-[9px] text-emerald-400/60 uppercase font-medium mt-1 tracking-widest">
                                                                            {existingDoc?.verified ? "Verified ✅" : "Pending Review ⏳"}
                                                                        </p>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-400 transition-colors">
                                                                        <UploadCloud size={24} />
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase group-hover:text-white transition-colors">Select {doc.label}</p>
                                                                        <p className="text-[8px] text-white/10 uppercase tracking-[0.2em] mt-1">Image/PDF • Max 5MB</p>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <input 
                                                                type="file" 
                                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                accept="image/*,.pdf"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file && file.size > 5 * 1024 * 1024) {
                                                                        toast("File too large (Max 5MB)", "error");
                                                                        return;
                                                                    }
                                                                    setKycFiles({...kycFiles, [doc.id]: file});
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex gap-5 items-start">
                                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Secure Storage</h4>
                                                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">Your documents are processed through an encrypted high-security gateway. They are not visible to the public and are only accessible by Authorized Super Admins for verification purposes.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div 
                                        key="step3" 
                                        initial={{ opacity: 0, x: 20 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 ml-1">Years of Experience</label>
                                                <div className="relative">
                                                     <Clock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                                                     <input 
                                                        type="number"
                                                        value={expertData.experience || ""}
                                                        onChange={(e) => setExpertData({...expertData, experience: e.target.value})}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-6 py-2.5 text-white outline-none focus:border-emerald-500/30 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 ml-1">Consultation Fee (₹ Per Min)</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                                                    <input 
                                                        type="number"
                                                        value={expertData.pricePerMinute || ""}
                                                        onChange={(e) => setExpertData({...expertData, pricePerMinute: e.target.value})}
                                                        className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl pl-16 pr-6 py-2.5 text-emerald-400 outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                    <BadgeCheck size={12} className="opacity-60" /> Select Primary Domain
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {masterCategories.map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setExpertData({...expertData, category: cat.code, specializations: []})}
                                                            className={`p-6 rounded-2xl border text-left transition-all group relative overflow-hidden ${
                                                                expertData.category === cat.code 
                                                                ? `bg-indigo-500/10 border-indigo-500/40 text-white shadow-xl` 
                                                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${expertData.category === cat.code ? `bg-indigo-500/20 text-indigo-400` : 'bg-white/5 text-white/20'}`}>
                                                                {cat.code === 'starandfuture' ? <Sparkles size={20} /> : <User size={20} />}
                                                            </div>
                                                            <div className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                                                {cat.name}
                                                            </div>
                                                            {expertData.category === cat.code && (
                                                                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse`} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {expertData.category && (
                                                <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                            <Star size={12} className="opacity-60" /> Specializations
                                                        </label>
                                                        <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest">{expertData.specializations?.length || 0} Selected</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {(masterCategories.find(c => c.code === expertData.category)?.skills || []).map((skill) => {
                                                            const isSelected = expertData.specializations?.includes(skill.name);
                                                            return (
                                                                <button
                                                                    key={skill.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = expertData.specializations || [];
                                                                        const updated = isSelected 
                                                                            ? current.filter(t => t !== skill.name)
                                                                            : [...current, skill.name];
                                                                        setExpertData({...expertData, specializations: updated});
                                                                    }}
                                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                                        isSelected 
                                                                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20' 
                                                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                                                                    }`}
                                                                >
                                                                    {skill.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="md:col-span-2 space-y-6 pt-4 border-t border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="opacity-60" /> Languages Known
                                                    </label>
                                                    <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest">{expertData.languages?.length || 0} Selected</span>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {[
                                                        "Hindi", "English", "Sanskrit", "Bengali", 
                                                        "Marathi", "Telugu", "Tamil", "Gujarati", "Punjabi", "Kannada"
                                                    ].map((lang) => {
                                                        const isSelected = expertData.languages?.includes(lang);
                                                        return (
                                                            <button
                                                                key={lang}
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = expertData.languages || [];
                                                                    const updated = isSelected 
                                                                        ? current.filter(l => l !== lang)
                                                                        : [...current, lang];
                                                                    setExpertData({...expertData, languages: updated});
                                                                }}
                                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                                    isSelected 
                                                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20' 
                                                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                                                                }`}
                                                            >
                                                                {lang}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-3 pt-4 border-t border-white/5">
                                                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 ml-1 flex items-center gap-2">
                                                    <GraduationCap size={12} className="opacity-60" /> Education & Certifications
                                                </label>
                                                <div className="relative">
                                                    <textarea 
                                                        value={expertData.education || ""}
                                                        onChange={(e) => setExpertData({...expertData, education: e.target.value})}
                                                        rows={2}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-emerald-500/30 transition-all text-sm resize-none"
                                                        placeholder="List your academic qualifications and professional certifications..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                             </AnimatePresence>

                             <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/5">
                                {step > 1 ? (
                                    <button 
                                        onClick={() => setStep(step - 1)}
                                        className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white font-bold text-[10px] tracking-widest uppercase transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                ) : <div />}

                                <button 
                                    onClick={step === 3 ? handleSave : () => setStep(step + 1)} 
                                    disabled={saving}
                                    className="px-10 py-3 bg-emerald-600 rounded-xl text-white font-bold text-[10px] tracking-widest uppercase flex items-center gap-3 hover:bg-emerald-500 shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? "Updating..." : (step === 3 ? "Save Profile Changes" : "Next Step")} 
                                    {step === 3 ? <Save size={16} /> : <ChevronRight size={16} />}
                                </button>
                             </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="preview-mode"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl"
                    >
                        {/* Profile Preview Mode */}
                        <div className="relative h-64 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-black" />
                            <div className="absolute bottom-10 left-10 flex items-end gap-8">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-[#0a0a0a] overflow-hidden shadow-2xl relative">
                                    {previewImage ? (
                                        <img src={previewImage} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-white/10 text-4xl">
                                            {expertData.displayName?.charAt(0) || 'E'}
                                        </div>
                                    )}
                                </div>
                                <div className="pb-4">
                                     <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{expertData.displayName}</h2>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <BadgeCheck size={14} /> Verified Expert
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-white/40 text-sm">
                                        <span className="flex items-center gap-2"><MapPin size={14} /> {expertData.location || 'Global'}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="flex items-center gap-2 text-emerald-400 font-medium tracking-wide font-mono uppercase text-[10px]">
                                            {masterCategories.find(c => c.code === expertData.category)?.name || 'Domain Not Set'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 p-8 md:p-16">
                            <div className="lg:col-span-2 space-y-10 md:space-y-16">
                                <div className="space-y-4 md:space-y-6">
                                    <h3 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.4em] text-emerald-400">About the Expert</h3>
                                    <p className="text-white/60 text-lg md:text-xl leading-relaxed font-light italic">
                                        "{expertData.bio}"
                                    </p>
                                </div>

                                <div className="space-y-6 md:space-y-10">
                                    <h3 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.4em] text-emerald-400">Core Expertise</h3>
                                    <div className="flex flex-wrap gap-3 md:gap-4">
                                        {expertData.specializations?.map((skill, idx) => (
                                            <div key={idx} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-[11px] md:text-xs font-bold uppercase tracking-widest hover:border-emerald-500/30 transition-colors">
                                                {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 md:space-y-10 border-t border-white/5 pt-10 md:pt-16">
                                    <h3 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.4em] text-emerald-400">Professional Background</h3>
                                    <div className="p-8 md:p-12 bg-white/5 rounded-[2.5rem] border border-white/10 flex gap-8 md:gap-10 items-start">
                                        <div className="p-4 md:p-5 rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-xl shadow-emerald-500/5">
                                            <GraduationCap size={28} />
                                        </div>
                                        <div className="space-y-4 md:space-y-6">
                                            <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight">Academic & Certifications</h4>
                                            <p className="text-white/40 text-[14px] md:text-[16px] leading-loose whitespace-pre-wrap font-medium">
                                                {expertData.education}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-10">
                                <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-8 md:space-y-10">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Service Fee</p>
                                        <div className="text-3xl md:text-4xl font-bold text-emerald-400">₹{expertData.pricePerMinute}<span className="text-xs text-white/20 font-medium ml-1">/min</span></div>
                                    </div>

                                    <div className="space-y-4 md:space-y-6 border-t border-white/5 pt-8 md:pt-10">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/20">Experience</span>
                                            <span className="text-white font-medium">{expertData.experience} Years</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/20">Languages</span>
                                            <span className="text-white font-medium text-right">
                                                {expertData.languages?.length > 0 ? expertData.languages.join(', ') : 'Not Specified'}
                                            </span>
                                        </div>
                                    </div>

                                    <button onClick={() => setViewMode('edit')} className="w-full py-4 md:py-5 bg-emerald-600 rounded-xl text-white font-bold text-[9px] md:text-[10px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl transition-transform hover:scale-[1.02]">
                                        Edit Profile <Settings size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                <p className="text-center mt-20 text-[10px] font-medium tracking-[0.6em] text-white/5 uppercase">Professional Expert Profile • NovaSathi</p>
            </div>
        </ExpertLayout>
    );
};

export default ExpertProfile;
