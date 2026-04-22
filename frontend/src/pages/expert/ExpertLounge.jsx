import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Clock, 
  Send,
  X,
  Filter,
  CheckCircle2,
  MoreVertical,
  BadgeCheck,
  LayoutGrid,
  Trash2,
  Edit2,
  List as ListIcon,
  Zap,
  Lock,
  Unlock,
  Play,
  MapPin,
  Briefcase,
  Phone
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ExpertLayout from "../../components/ExpertLayout";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../context/ToastContext";

/**
 * EXPERT LOUNGE — Dashboard Edition
 * Single form entry and table-based data display for efficiency.
 */

const ExpertLounge = () => {
    const { api, user } = useAuth();
    const { toast } = useToast();
    
    // Core State
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("feed"); 
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    // UI State
    const [selectedGig, setSelectedGig] = useState(null);
    const [applyMessage, setApplyMessage] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [viewingGig, setViewingGig] = useState(null);

    // Form State
    const [newGig, setNewGig] = useState({ 
        title: "", 
        description: "", 
        budgetRange: "", 
        skillsNeeded: "",
        category: "Astrology",
        urgency: "Normal"
    });
    const [editingGigId, setEditingGigId] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ show: false, action: null, gig: null, title: "", message: "" });

    const categories = ["Astrology", "Counseling", "Pooja Services", "Technical", "Content", "Vastu"];

    const fetchGigs = useCallback(async (view = null) => {
        try {
            setLoading(true);
            const currentView = view || activeTab;
            const res = await api.get(`/gigs/feed?view=${currentView}`);
            setGigs(res.data.data || []);
        } catch (err) {
            toast("Connection error. Could not retrieve projects.", "error");
        } finally {
            setLoading(false);
        }
    }, [api, toast, activeTab]);

    useEffect(() => {
        fetchGigs(activeTab);
    }, [fetchGigs, activeTab]);

    const handleApply = async () => {
        if (!applyMessage.trim()) return toast("Please enter a proposal message.", "error");
        try {
            setIsApplying(true);
            await api.post("/gigs/apply", { gigId: selectedGig.id, message: applyMessage });
            toast("Proposal submitted successfully.", "success");
            setSelectedGig(null);
            setApplyMessage("");
            fetchGigs();
        } catch (err) {
            toast("Submission failed.", "error");
        } finally {
            setIsApplying(false);
        }
    };

    const handleCreateGig = async (e) => {
        if (e) e.preventDefault();
        if (!newGig.title || !newGig.description || !newGig.budgetRange) {
            return toast("Please fill in all required fields.", "error");
        }
        try {
            setIsPosting(true);
            const skillsArray = typeof newGig.skillsNeeded === 'string' ? newGig.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean) : newGig.skillsNeeded;
            
            if (editingGigId) {
                await api.patch(`/gigs/${editingGigId}/status`, { ...newGig, skillsNeeded: skillsArray });
                toast("Project updated.", "success");
            } else {
                await api.post("/gigs/create", { ...newGig, skillsNeeded: skillsArray });
                toast("Project broadcasted.", "success");
            }

            setIsFormVisible(false);
            setIsPosting(false); // Close Modal
            setEditingGigId(null);
            setNewGig({ title: "", description: "", budgetRange: "", skillsNeeded: "", category: "Astrology", urgency: "Normal" });
            fetchGigs();
        } catch (err) {
            toast(editingGigId ? "Update failed." : "Post failed.", "error");
        } finally {
            setIsPosting(false);
        }
    };

    const handleEditClick = (gig) => {
        setEditingGigId(gig.id);
        setNewGig({
            title: gig.title,
            description: gig.description,
            budgetRange: gig.budgetRange,
            skillsNeeded: Array.isArray(gig.skillsNeeded) ? gig.skillsNeeded.join(", ") : gig.skillsNeeded,
            category: gig.category || "Astrology",
            urgency: gig.urgency || "Normal"
        });
        setIsFormVisible(true);
    };

    const handleDeleteGig = async (id) => {
        try {
            await api.delete(`/gigs/${id}`);
            toast("Project removed successfully.", "success");
            fetchGigs();
        } catch (err) {
            toast("Failed to delete project.", "error");
        } finally {
            setConfirmConfig({ show: false, action: null, gig: null });
        }
    };

    const updateProjectStatus = async (gigId, newStatus) => {
        try {
            await api.patch(`/gigs/${gigId}/status`, { status: newStatus });
            toast(`Project moved to ${newStatus.replace('_', ' ')}`, "success");
            fetchGigs();
            setConfirmConfig({ show: false, action: null, gig: null });
        } catch (err) {
            toast("Failed to update status", "error");
        }
    };

    const handleToggleStatus = (gig) => {
        let nextStatus = 'OPEN';
        if (gig.status === 'OPEN') nextStatus = 'IN_PROGRESS';
        else if (gig.status === 'IN_PROGRESS') nextStatus = 'CLOSED';
        
        updateProjectStatus(gig.id, nextStatus);
    };

    const isAdmin = useMemo(() => user?.role?.toUpperCase() === 'ADMIN', [user]);

    const filteredGigs = useMemo(() => {
        // Now mostly just search filtering, as tab filtering is handled by API
        return gigs.filter(g => 
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [gigs, searchQuery]);

    const Layout = isAdmin ? AdminLayout : ExpertLayout;
    
    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                
                {/* Header Context */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Collaboration Marketplace</h1>
                        <p className="text-[11px] text-white/40 font-medium mt-1">Direct expert-to-expert project marketplace</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (!isFormVisible) {
                                setNewGig({ title: "", description: "", budgetRange: "", skillsNeeded: "", category: "Astrology", urgency: "Normal" });
                                setEditingGigId(null);
                            }
                            setIsFormVisible(!isFormVisible);
                        }}
                        className={`px-8 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                            isFormVisible ? 'bg-rose-500/10 text-rose-500' : 'bg-white text-black hover:bg-purple-600 hover:text-white'
                        }`}
                    >
                        {isFormVisible ? <X size={16} /> : <Plus size={16} />} 
                        {isFormVisible ? "Close form" : "Create new project"}
                    </button>
                </div>

                {/* Single Form Area */}
                <AnimatePresence>
                    {isFormVisible && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-[#12131a] border border-white/10 rounded-xl p-8 mb-8 shadow-2xl">
                                <div className="lg:col-span-1 space-y-6">
                                    <h3 className="text-xs font-bold text-white">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/40 ml-1">Category</label>
                                            <select 
                                                value={newGig.category}
                                                onChange={(e) => setNewGig({...newGig, category: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500/40"
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-white/40 ml-1">Project Title</label>
                                            <input 
                                                value={newGig.title}
                                                onChange={(e) => setNewGig({...newGig, title: e.target.value})}
                                                placeholder="e.g. Need help with Sanskrit translation"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500/40"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-1 space-y-6">
                                    <h3 className="text-xs font-bold text-white uppercase">Project Details</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-white/40 ml-1">Budget Description</label>
                                            <input 
                                                value={newGig.budgetRange}
                                                onChange={(e) => setNewGig({...newGig, budgetRange: e.target.value})}
                                                placeholder="₹ 2000 - 5000"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500/40"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-bold text-white/40 ml-1">Skills (Comma sep.)</label>
                                            <input 
                                                value={newGig.skillsNeeded}
                                                onChange={(e) => setNewGig({...newGig, skillsNeeded: e.target.value})}
                                                placeholder="Sanskrit, Vedic, Typing"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500/40"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-1 space-y-6 flex flex-col">
                                    <h3 className="text-xs font-bold text-white uppercase">Description</h3>
                                    <textarea 
                                        rows={4}
                                        value={newGig.description}
                                        onChange={(e) => setNewGig({...newGig, description: e.target.value})}
                                        placeholder="Briefly describe what you need..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-purple-500/40 resize-none flex-1"
                                    />
                                    <button 
                                        onClick={handleCreateGig}
                                        disabled={isPosting}
                                        className="w-full bg-white text-black py-4 rounded-xl font-bold text-[11px] hover:bg-white/90 transition-all disabled:opacity-50"
                                    >
                                        {isPosting ? "Posting project..." : (editingGigId ? "Update project" : "Post project")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table View Area */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-8">
                            {["feed", "my_gigs", "my_applications"].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative text-[10px] font-bold pb-2 transition-all ${
                                        activeTab === tab ? 'text-purple-400' : 'text-white/30 hover:text-white'
                                    }`}
                                >
                                    {tab === "feed" ? (isAdmin ? "Global Marketplace" : "Project feed") : 
                                     tab === "my_gigs" ? (isAdmin ? "Project management" : "My gigs") :
                                     tab === "my_applications" ? "My applications" : ""}
                                    {activeTab === tab && <motion.div layoutId="tabMarker" className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500" />}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter table..."
                                className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-[10px] text-white outline-none focus:border-purple-500/30 transition-all font-bold uppercase tracking-wider"
                            />
                        </div>
                    </div>

                    <div className="bg-[#12131a] border border-white/10 rounded-xl overflow-hidden overflow-x-auto shadow-2xl">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider">Posted By</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider">Project Title</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider text-center">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider text-center">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider text-center">Budget</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-white/30 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="border-b border-white/5 animate-pulse">
                                            <td colSpan={6} className="h-16 px-6 bg-white/[0.01]" />
                                        </tr>
                                    ))
                                ) : filteredGigs.length > 0 ? (
                                    filteredGigs.map(gig => (
                                        <tr key={gig.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={gig.poster?.profileImage || `https://ui-avatars.com/api/?name=${gig.poster?.displayName}&background=6D28D9&color=FFFFFF`} className="w-7 h-7 rounded-full object-cover" alt="" />
                                                    <span className="text-[11px] font-bold text-white/70">{gig.poster?.displayName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-white group-hover:text-purple-400 transition-colors uppercase truncate max-w-[200px]">{gig.title}</span>
                                                    <span className="text-[8px] text-white/20 uppercase tracking-widest">{new Date(gig.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 font-medium">
                                                    <MapPin size={11} className="text-purple-400/50" />
                                                    {gig.poster?.location || "Remote"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-white/5 rounded text-[9px] text-white/40 font-bold">{gig.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-bold text-emerald-400 truncate">₹{gig.budgetRange}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <button 
                                                        disabled={gig.postedBy !== user?.id && !isAdmin}
                                                        onClick={() => {
                                                            let nextStatus = 'OPEN';
                                                            if (gig.status === 'OPEN') nextStatus = 'IN_PROGRESS';
                                                            else if (gig.status === 'IN_PROGRESS') nextStatus = 'CLOSED';

                                                            setConfirmConfig({
                                                                show: true,
                                                                gig: gig,
                                                                action: () => updateProjectStatus(gig.id, nextStatus),
                                                                title: gig.status === 'OPEN' ? "Move to In Progress?" : 
                                                                       gig.status === 'IN_PROGRESS' ? "Close project?" : 
                                                                       "Reopen project?",
                                                                currentStatus: gig.status,
                                                                nextStatus: nextStatus,
                                                                message: "Click a status above to change.",
                                                                confirmText: "Yes, Confirm",
                                                                type: "status"
                                                            });
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1.5 transition-all shadow-sm group/status ${
                                                            gig.status === 'OPEN' ? 'text-emerald-400 bg-emerald-400/10 shadow-emerald-500/10 hover:bg-emerald-400/20' : 
                                                            gig.status === 'IN_PROGRESS' ? 'text-amber-400 bg-amber-400/10 shadow-amber-500/10 hover:bg-amber-400/20' :
                                                            'text-white/20 bg-white/5 hover:bg-white/10'
                                                        } ${(gig.postedBy === user?.id || isAdmin) ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                                                    >
                                                        {gig.status === 'OPEN' ? <Zap size={8} className="animate-pulse" /> : 
                                                         gig.status === 'IN_PROGRESS' ? <Play size={8} /> :
                                                         <CheckCircle2 size={8} />}
                                                        {gig.status.replace('_', ' ')}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(gig.postedBy === user?.id || isAdmin) ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <button 
                                                                onClick={() => {
                                                                    let nextStatus = 'OPEN';
                                                                    if (gig.status === 'OPEN') nextStatus = 'IN_PROGRESS';
                                                                    else if (gig.status === 'IN_PROGRESS') nextStatus = 'CLOSED';

                                                                    setConfirmConfig({
                                                                        show: true,
                                                                        gig: gig,
                                                                        action: () => updateProjectStatus(gig.id, nextStatus),
                                                                        title: "Update Project Status?",
                                                                        currentStatus: gig.status,
                                                                        nextStatus: nextStatus,
                                                                        message: `Are you sure you want to transition this project?`,
                                                                        confirmText: "Update status",
                                                                        type: "status"
                                                                    });
                                                                }}
                                                                className={`p-2 transition-all ${
                                                                    gig.status === 'OPEN' ? 'text-emerald-400/40 hover:text-emerald-400' : 
                                                                    gig.status === 'IN_PROGRESS' ? 'text-amber-400/40 hover:text-amber-400' :
                                                                    'text-indigo-400/40 hover:text-indigo-400'
                                                                }`}
                                                                title="Cycle Status"
                                                            >
                                                                {gig.status === 'OPEN' ? <Play size={14} /> : 
                                                                 gig.status === 'IN_PROGRESS' ? <Lock size={14} /> : 
                                                                 <Unlock size={14} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditClick(gig)}
                                                                className="p-2 text-indigo-400/40 hover:text-indigo-400 transition-colors"
                                                                title="Edit Project"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setConfirmConfig({
                                                                    show: true,
                                                                    gig: gig,
                                                                    action: () => handleDeleteGig(gig.id),
                                                                    title: "Confirm Deletion",
                                                                    message: "This action cannot be undone. All applications for this project will be lost.",
                                                                    confirmText: "Yes, Delete",
                                                                    type: "delete"
                                                                })}
                                                                className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors"
                                                                title="Delete Project"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        {gig.applications?.length > 0 && (
                                                            <button 
                                                                onClick={() => setViewingGig(gig)}
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/40 text-[9px] font-bold rounded-lg transition-all"
                                                            >
                                                                {gig.applications.length} Applications
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        {gig.applications?.some(a => a.applicantId === user?.id) ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-400/50">
                                                                <CheckCircle2 size={12} />
                                                                <span className="text-[9px] font-bold">Applied</span>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => setSelectedGig(gig)}
                                                                className="px-4 py-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 rounded-lg text-[9px] font-black transition-all"
                                                            >
                                                                Apply
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-white/10 text-xs italic tracking-widest uppercase">The marketplace is currently quiet...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Application Modal (Kept simple for proposal entry) */}
            <AnimatePresence>
                {selectedGig && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedGig(null)}
                        />
                        <motion.div 
                            initial={{ y: 20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.9 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-10 relative shadow-2xl space-y-8"
                        >
                            <div className="space-y-4 text-center">
                                <h3 className="text-xl font-black text-white italic">Submit <span className="text-purple-500">Proposal</span></h3>
                                <p className="text-[10px] text-white/30 font-medium px-4 leading-relaxed">Briefly explain why you're the perfect fit for "{selectedGig.title}"</p>
                                
                                <textarea 
                                    rows={4}
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-5 text-xs text-white outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setSelectedGig(null)} className="flex-1 py-3.5 bg-white/5 text-white/30 text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all">Cancel</button>
                                <button 
                                    onClick={handleApply}
                                    disabled={isApplying}
                                    className="flex-1 py-3.5 bg-purple-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isApplying ? "Sending..." : "Send Proposal"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Gig Modal */}
            <AnimatePresence>
                {isPosting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => setIsPosting(false)}
                        />
                        <motion.div 
                            initial={{ y: 30, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 30, opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-[2rem] w-full max-w-lg p-10 relative shadow-2xl space-y-8"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-white tracking-tight">{editingGigId ? "Edit Project" : "Create project"}</h2>
                                    <p className="text-[10px] text-white/30 font-medium">Fill in the details to find a collaborator.</p>
                                </div>
                                <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateGig} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 ml-1">Project title</label>
                                            <input required value={newGig.title} onChange={(e) => setNewGig({ ...newGig, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium" placeholder="Project name" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 ml-1">Category</label>
                                            <select value={newGig.category} onChange={(e) => setNewGig({ ...newGig, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium">
                                                <option value="General">General</option>
                                                <option value="Vedic">Vedic</option>
                                                <option value="Research">Research</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 ml-1">Description</label>
                                        <textarea required rows={4} value={newGig.description} onChange={(e) => setNewGig({ ...newGig, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all resize-none font-medium" placeholder="Describe your project requirements..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 ml-1">Budget</label>
                                            <input value={newGig.budgetRange} onChange={(e) => setNewGig({ ...newGig, budgetRange: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium" placeholder="₹1000 - ₹5000" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 ml-1">Urgency</label>
                                            <select value={newGig.urgency} onChange={(e) => setNewGig({ ...newGig, urgency: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium">
                                                <option value="Normal">Normal</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl text-[11px] font-bold shadow-lg transition-all active:scale-[0.98]">
                                    {editingGigId ? "Update project" : "Create project"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Application Viewer Modal (For Poster) */}
            <AnimatePresence>
                {viewingGig && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setViewingGig(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#12131a] border border-white/10 rounded-xl w-full max-w-xl p-8 md:p-12 relative shadow-2xl space-y-10"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Project Applications</h2>
                                    <p className="text-[10px] text-white/30 font-bold">Collaborators for "{viewingGig.title}"</p>
                                </div>
                                <button onClick={() => setViewingGig(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                                {viewingGig.applications.map((app) => (
                                    <div key={app.id} className="p-7 bg-white/[0.02] border border-white/5 rounded-xl space-y-5 hover:border-purple-500/20 transition-all group">
                                        <div className="flex items-start gap-5">
                                            <img src={app.applicant?.profileImage || `https://ui-avatars.com/api/?name=${app.applicant?.displayName}&background=6D28D9&color=FFFFFF`} className="w-16 h-16 rounded-xl object-cover shadow-2xl" alt="" />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-base font-bold text-white">{app.applicant?.displayName}</h4>
                                                    <span className="text-[9px] text-white/20 font-bold">{new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
                                                        <MapPin size={12} className="text-purple-400/50" /> {app.applicant?.location || "Remote"}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
                                                        <Briefcase size={12} className="text-purple-400/50" /> {app.applicant?.experience || 0} Years Exp.
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black">
                                                        <Phone size={12} /> +91 {app.applicant?.user?.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {app.applicant?.specializations?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {app.applicant.specializations.slice(0, 4).map(s => (
                                                    <span key={s} className="px-2.5 py-1 bg-white/5 text-white/40 text-[8px] font-black rounded-lg uppercase tracking-wider">{s}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="p-5 bg-black/40 rounded-xl text-xs text-white/70 leading-relaxed italic border border-white/5 group-hover:border-purple-500/10 transition-colors">
                                            "{app.message || "No personalized proposal message was provided."}"
                                        </div>

                                        <button 
                                            onClick={() => {
                                                const nextStatus = viewingGig.status === 'OPEN' ? 'IN_PROGRESS' : 'CLOSED';
                                                setConfirmConfig({
                                                    show: true,
                                                    gig: viewingGig,
                                                    action: () => {
                                                        updateProjectStatus(viewingGig.id, nextStatus);
                                                        setViewingGig(null);
                                                    },
                                                    title: "Confirm Assignment",
                                                    currentStatus: viewingGig.status,
                                                    nextStatus: nextStatus,
                                                    message: `Assign this project to ${app.applicant?.displayName}?`,
                                                    confirmText: "Yes, Assign Expert",
                                                    type: "status"
                                                });
                                            }}
                                            className="w-full py-3 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <BadgeCheck size={14} /> Hire & Update Status
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Confirmation Modal */}
            <AnimatePresence>
                {confirmConfig.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => setConfirmConfig({ show: false, action: null })}
                        />
                        <motion.div 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ y: 20, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.9 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-3xl w-full max-w-xs p-10 relative shadow-2xl space-y-8 text-center"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setConfirmConfig({ show: false, action: null })}
                                className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-all"
                            >
                                <X size={16} />
                            </button>

                            <div className="space-y-4 pt-4">
                                <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                                    confirmConfig.type === 'delete' ? 'bg-rose-500/10 text-rose-500' : 'bg-purple-500/10 text-purple-500'
                                }`}>
                                    {confirmConfig.type === 'delete' ? <Trash2 size={24} /> : <Clock size={24} />}
                                </div>
                                {confirmConfig.type === 'status' && (
                                    <div className="flex flex-wrap items-center justify-center gap-3 py-6">
                                        {['OPEN', 'IN_PROGRESS', 'CLOSED'].map((s, i) => (
                                            <button 
                                                key={s}
                                                onClick={() => {
                                                    if (s === confirmConfig.currentStatus) return;
                                                    setConfirmConfig(prev => ({
                                                        ...prev,
                                                        nextStatus: s,
                                                        title: s === 'OPEN' ? "Reopen project?" : 
                                                               s === 'IN_PROGRESS' ? "Move to In Progress?" : 
                                                               "Close project?",
                                                        confirmText: s === 'OPEN' ? "Yes, Reopen" : 
                                                                    s === 'IN_PROGRESS' ? "Yes, Move to Progress" : 
                                                                    "Yes, Close Project",
                                                        action: () => updateProjectStatus(confirmConfig.gig.id, s)
                                                    }));
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 border ${
                                                    confirmConfig.nextStatus === s ? 
                                                    'bg-purple-600 text-white border-purple-500 shadow-xl shadow-purple-900/40 scale-105' : 
                                                    confirmConfig.currentStatus === s ? 
                                                    'bg-white/5 text-white/20 border-white/5 cursor-default' : 
                                                    s === 'OPEN' ? 'bg-emerald-500/5 text-emerald-400/40 border-emerald-500/10 hover:bg-emerald-500/10 hover:text-emerald-400' :
                                                    s === 'IN_PROGRESS' ? 'bg-amber-500/5 text-amber-400/40 border-amber-500/10 hover:bg-amber-500/10 hover:text-amber-400' :
                                                    'bg-white/10 text-white/40 border-white/10 hover:bg-white/20 hover:text-white'
                                                }`}
                                            >
                                                {s === 'IN_PROGRESS' ? 'Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white tracking-tight">{confirmConfig.title}</h3>
                                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">{confirmConfig.message}</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={confirmConfig.action}
                                    className={`w-full py-4 text-white text-[10px] font-black rounded-xl shadow-lg transition-all active:scale-[0.98] ${
                                        confirmConfig.type === 'delete' ? 'bg-rose-600 shadow-rose-900/20' : 'bg-purple-600 shadow-purple-900/20'
                                    }`}
                                >
                                    {confirmConfig.confirmText || "Yes, Confirm"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default ExpertLounge;
