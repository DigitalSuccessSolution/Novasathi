import React, { useState, useEffect } from "react";
import { 
    ShieldCheck, 
    ArrowLeft, 
    Clock, 
    FileText, 
    CheckCircle, 
    XCircle, 
    Search, 
    Filter, 
    Mail, 
    Phone, 
    MapPin, 
    Check,
    Eye,
    Edit3,
    ExternalLink,
    AlertCircle,
    UserCircle,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Standard Admin Expert Verification Hub.
 * Supports status-wise filtration (Pending, Approved, Rejected).
 */
const ExpertVerifications = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [experts, setExperts] = useState([]);
    const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [processingId, setProcessingId] = useState(null);
    
    const [selectedExpert, setSelectedExpert] = useState(null);
    const [editMode, setEditMode] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [masterCategories, setMasterCategories] = useState([]);

    const fetchExperts = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/experts?status=${statusFilter}`);
            if (res.data?.data) {
                setExperts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch experts:", err);
            toast("Failed to load expert queue.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCounts = async () => {
        try {
            const res = await api.get("/admin/experts/counts");
            if (res.data?.success && res.data?.data) {
                setCounts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch counts:", err);
        }
    };

    const fetchMetadata = async () => {
        try {
            const res = await api.get("/admin/master/categories");
            setMasterCategories(res.data.data || []);
        } catch (err) {
            console.error("Metadata sync failed");
        }
    };

    useEffect(() => {
        fetchExperts();
        fetchCounts();
        fetchMetadata();
    }, [api, statusFilter]);

    const handleApprove = async (expertId) => {
        const commission = prompt("Enter Commission Percentage (0-100):", "30");
        if (commission === null) return;

        try {
            setProcessingId(expertId);
            await api.patch(`/admin/experts/${expertId}/approve`, {
                commissionPercent: parseFloat(commission)
            });
            toast("Expert approved successfully.", "success");
            setSelectedExpert(null);
            fetchExperts(); 
        } catch (err) {
            toast("Approval failed: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (expertId) => {
        const reason = prompt("Reason for rejection:");
        if (!reason) return;

        try {
            setProcessingId(expertId);
            await api.patch(`/admin/experts/${expertId}/reject`, { reason });
            toast("Expert application rejected.", "info");
            setSelectedExpert(null);
            fetchExperts();
        } catch (err) {
            toast("Rejection failed.", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const startEditing = (expert) => {
        setEditMode(expert.id);
        const userFields = expert.user || {};
        setEditForm({ 
            ...expert,
            gender: userFields.gender || "",
            dateOfBirth: userFields.dateOfBirth || "",
            displayName: expert.displayName || userFields.name
        });
    };

    const handleSaveDetails = async () => {
        try {
            setProcessingId(editMode);
            
            const cleanArray = (val) => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                return [];
            };

            const payload = {
                ...editForm,
                gender: editForm.gender,
                dateOfBirth: editForm.dateOfBirth,
                displayName: editForm.displayName,
                experience: parseInt(editForm.experience) || 0,
                pricePerMinute: parseFloat(editForm.pricePerMinute) || 0,
                specializations: editForm.specializations,
                languages: cleanArray(editForm.languages),
                category: editForm.category
            };

            await api.patch(`/admin/experts/${editMode}`, payload);
            toast("Expert records updated.", "success");
            setEditMode(null);
            if (selectedExpert?.id === editMode) {
                const updatedStatus = { ...selectedExpert, ...payload };
                setSelectedExpert(updatedStatus);
            }
            fetchExperts();
        } catch (err) {
            toast("Update failed: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredExperts = experts.filter(e => 
        (e.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.user?.phone || "").includes(searchTerm) ||
        (e.specializations || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- RENDERERS ---

    const renderTableView = () => (
        <div className="w-full overflow-hidden bg-[#121212] border border-white/10 rounded-2xl shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left font-sans">
                    <thead className="bg-white/5 border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                            <th className="px-6 py-4">Expert Profile</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Exp.</th>
                            <th className="px-6 py-4">Rate</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredExperts.map((expert) => (
                            <tr key={expert.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={expert.user?.avatar || expert.profileImage || `https://ui-avatars.com/api/?name=${expert.user?.name || "E"}&background=6366f1&color=fff`} 
                                            className="w-10 h-10 rounded-lg object-cover"
                                            onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Expert"; }}
                                        />
                                        <div>
                                            <div className="font-bold text-white/90">{expert.user?.name || "Unnamed"}</div>
                                            <div className="text-[11px] text-white/40">{expert.user?.email || expert.user?.phone}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold w-fit ${
                                            expert.category === 'STAR_AND_FUTURE' ? 'bg-purple-500/10 text-purple-400' : 
                                            expert.category === 'DIL_KI_BAAT' ? 'bg-rose-500/10 text-rose-400' : 
                                            'bg-white/5 text-white/30'
                                        }`}>
                                            {expert.category ? expert.category.replace(/_/g, ' ') : 'UNCATEGORIZED'}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {expert.specializations?.slice(0, 1).map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/60">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-white/70 font-medium">{expert.experience || 0} Yrs</td>
                                <td className="px-6 py-4 text-indigo-400 font-bold">₹{expert.pricePerMinute}/min</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                        expert.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                        expert.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                                        'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {expert.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => startEditing(expert)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all"
                                        ><Edit3 size={16} /></button>
                                        <button 
                                            onClick={() => setSelectedExpert(expert)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                                        >View</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDetailView = (expert) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button 
                onClick={() => setSelectedExpert(null)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all uppercase"
            >
                <ArrowLeft size={16} /> Back to {statusFilter} Experts
            </button>

            <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-8 items-center">
                    <img 
                        src={expert.user?.avatar || expert.profileImage || "https://ui-avatars.com/api/?name=Expert"} 
                        className="w-24 h-24 rounded-2xl object-cover ring-2 ring-indigo-600/20"
                    />
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <h2 className="text-2xl font-bold text-white">{expert.user?.name}</h2>
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full w-fit mx-auto md:mx-0 ${
                                expert.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                expert.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-amber-500/10 text-amber-500'
                            }`}>{expert.status}</span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-white/40">
                             <div className="flex items-center gap-2"><Mail size={14} /> {expert.user?.email}</div>
                             <div className="flex items-center gap-2"><Phone size={14} /> {expert.user?.phone}</div>
                             <div className="flex items-center gap-2"><MapPin size={14} /> {expert.location || "Location Not Set"}</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => startEditing(expert)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"><Edit3 size={18} /></button>
                        {expert.status === 'PENDING' && (
                            <button onClick={() => handleApprove(expert.id)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-xl flex items-center gap-2 font-sans"><Check size={18} /> Approve</button>
                        )}
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest">Profile Abstract</h3>
                            <div className="bg-white/5 rounded-xl p-6 text-sm text-white/70 leading-relaxed font-sans">
                                {expert.bio || "No biography provided."}
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-white/20 uppercase tracking-tighter">Educational Credentials</span>
                                <p className="text-sm text-white/80 font-medium">{expert.education || "Not specified"}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-white/20 uppercase tracking-tighter">Experience Level</span>
                                <p className="text-sm text-white/80 font-medium">{expert.experience || 0} Years in Field</p>
                            </div>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest">Verification Documents</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {expert.documents?.map(doc => (
                                    <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-indigo-400" />
                                            <span className="text-xs font-bold text-white/60 uppercase">{doc.type}</span>
                                        </div>
                                        <ExternalLink size={14} className="text-white/20" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-4">
                            <h3 className="text-xs font-bold text-white/20 uppercase">Specializations</h3>
                            <div className="flex flex-wrap gap-2">
                                {expert.specializations?.map(s => (
                                    <span key={s} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[11px] font-bold rounded-lg border border-indigo-500/20">{s}</span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <span className="text-xs font-bold text-white/20 uppercase">Consultation Fee</span>
                                <p className="text-2xl font-bold text-indigo-400">₹{expert.pricePerMinute} <span className="text-xs text-white/40 font-normal">/ minute</span></p>
                            </div>
                        </section>

                        <section className="bg-white/5 rounded-xl p-6 border border-white/5 space-y-3">
                            <h3 className="text-xs font-bold text-white/20 uppercase">Financial Routing</h3>
                            <div className="space-y-3">
                                <div><label className="text-[10px] text-white/20 font-bold block uppercase">Bank</label><span className="text-xs text-white/80 font-bold">{expert.bankName || "N/A"}</span></div>
                                <div><label className="text-[10px] text-white/20 font-bold block uppercase">Account</label><span className="text-xs text-white/80 font-mono">{expert.accountNumber || "N/A"}</span></div>
                                <div><label className="text-[10px] text-white/20 font-bold block uppercase">IFSC</label><span className="text-xs text-white/80 font-mono">{expert.ifscCode || "N/A"}</span></div>
                                <div><label className="text-[10px] text-white/20 font-bold block uppercase">UPI</label><span className="text-xs text-indigo-400 font-bold">{expert.upiId || "N/A"}</span></div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center text-[11px] text-white/20">
                    <div className="flex items-center gap-2"><Clock size={14} /><span>First Registered: {new Date(expert.createdAt).toLocaleString()}</span></div>
                    {expert.status === 'PENDING' && <button onClick={() => handleReject(expert.id)} className="text-rose-500 font-bold uppercase hover:underline">Reject Applicant</button>}
                </div>
            </div>
        </motion.div>
    );

    return (
        <AdminLayout>
            <div className="space-y-6 text-left max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><CheckCircle2 className="text-indigo-500" /> Expert Verifications</h1>
                        <div className="flex bg-[#121212] border border-white/10 rounded-xl p-1 mt-3 w-fit">
                            {["PENDING", "APPROVED", "REJECTED"].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => { setStatusFilter(status); setSelectedExpert(null); }}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all flex items-center gap-2 ${
                                        statusFilter === status ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                                    }`}
                                >
                                    {status}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${statusFilter === status ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30'}`}>
                                        {counts[status] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {!selectedExpert && (
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 items-center gap-3 flex-1 md:w-80 group focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all font-sans">
                                <Search className="w-4 h-4 text-white/30" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, phone or domain..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-white/20" 
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4"><div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Synchronizing Records...</p></div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {selectedExpert ? (
                                <div key="detail">{renderDetailView(selectedExpert)}</div>
                            ) : filteredExperts.length > 0 ? (
                                <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{renderTableView()}</motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/10 rounded-3xl opacity-20">
                                     <UserCircle size={48} className="mb-4" />
                                     <h3 className="text-xl font-bold">No {statusFilter.toLowerCase()} experts found</h3>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Edit Modal (Copy-pasted from prev with field expansion) */}
            <AnimatePresence>
                {editMode && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditMode(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl relative z-20 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Edit Expert Details</h2>
                                <button onClick={() => setEditMode(null)} className="p-2 hover:bg-white/5 rounded-lg text-white/40"><XCircle size={20} /></button>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-left font-sans">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Full Name</label><input value={editForm.displayName || ""} onChange={(e) => setEditForm({...editForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white" /></div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Rate/Min</label><input type="number" value={editForm.pricePerMinute || 0} onChange={(e) => setEditForm({...editForm, pricePerMinute: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-indigo-400 font-bold" /></div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-indigo-400 uppercase">Override Status</label>
                                         <select value={editForm.status || ""} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 transition-all cursor-pointer">
                                             <option value="PENDING">PENDING</option>
                                             <option value="APPROVED">APPROVED</option>
                                             <option value="REJECTED">REJECTED</option>
                                         </select>
                                     </div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Gender</label><select value={editForm.gender || ""} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white appearance-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">DOB</label><input type="date" value={editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString().split('T')[0] : ""} onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white [color-scheme:dark]" /></div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Education</label><input value={editForm.education || ""} onChange={(e) => setEditForm({...editForm, education: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white" /></div>
                                     <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Experience (Yrs)</label><input type="number" value={editForm.experience || 0} onChange={(e) => setEditForm({...editForm, experience: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white" /></div>
                                     <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Location</label><input value={editForm.location || ""} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white" /></div>
                                     <div className="col-span-2 space-y-1">
                                         <label className="text-[10px] font-bold text-white/30 uppercase">Primary Category</label>
                                         <select 
                                             value={editForm.category || ""} 
                                             onChange={(e) => setEditForm({...editForm, category: e.target.value, specializations: []})} 
                                             className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white"
                                         >
                                             <option value="">Select Category</option>
                                             {masterCategories.map(cat => (
                                                 <option key={cat.id} value={cat.code}>{cat.name}</option>
                                             ))}
                                         </select>
                                     </div>

                                     <div className="col-span-2 space-y-3">
                                         <label className="text-[10px] font-bold text-white/30 uppercase">Specializations (Select Tags)</label>
                                         <div className="flex flex-wrap gap-2">
                                             {(masterCategories.find(c => c.code === editForm.category)?.skills || []).map(skill => {
                                                 const isSelected = editForm.specializations?.includes(skill.name);
                                                 return (
                                                     <button
                                                         key={skill.id}
                                                         type="button"
                                                         onClick={() => {
                                                             const current = editForm.specializations || [];
                                                             const updated = isSelected 
                                                                 ? current.filter(t => t !== skill.name)
                                                                 : [...current, skill.name];
                                                             setEditForm({...editForm, specializations: updated});
                                                         }}
                                                         className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                                             isSelected 
                                                             ? 'bg-indigo-600 border-indigo-400 text-white' 
                                                             : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                         }`}
                                                     >
                                                         {skill.name}
                                                     </button>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="space-y-1"><label className="text-[10px] font-bold text-white/30 uppercase">Bio</label><textarea rows={3} value={editForm.bio || ""} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/60 resize-none" /></div>
                                 <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                     <div className="space-y-1"><label className="text-[11px] font-bold text-indigo-400 uppercase">Bank Name</label><input value={editForm.bankName || ""} onChange={(e) => setEditForm({...editForm, bankName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white" /></div>
                                     <div className="space-y-1"><label className="text-[11px] font-bold text-indigo-400 uppercase">IFSC</label><input value={editForm.ifscCode || ""} onChange={(e) => setEditForm({...editForm, ifscCode: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white font-mono" /></div>
                                     <div className="space-y-1"><label className="text-[11px] font-bold text-indigo-400 uppercase">Account No</label><input value={editForm.accountNumber || ""} onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white font-mono" /></div>
                                     <div className="space-y-1"><label className="text-[11px] font-bold text-indigo-400 uppercase">UPI ID</label><input value={editForm.upiId || ""} onChange={(e) => setEditForm({...editForm, upiId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white" /></div>
                                 </div>
                            </div>
                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
                                 <button onClick={() => setEditMode(null)} className="px-4 py-2 text-xs font-bold text-white/30 uppercase">Cancel</button>
                                 <button disabled={processingId === editMode} onClick={handleSaveDetails} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xl flex items-center gap-2">{processingId === editMode ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={16} />} Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default ExpertVerifications;
