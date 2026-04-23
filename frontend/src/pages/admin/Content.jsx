import React, { useState, useEffect } from "react";
import { 
    Sparkles, 
    Plus, 
    Image as ImageIcon, 
    FileText, 
    Trash2, 
    Edit, 
    Search,
    Loader2,
    X,
    CheckCircle,
    Calendar,
    User,
    ExternalLink,
    Book,
    GripVertical,
    Save
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Admin Content Management - Mystical Broadcast Center
 */
const AdminContent = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("MESSAGE"); // MESSAGE, MEDIA, BLOG
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [contentItems, setContentItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    const [form, setForm] = useState({
        type: "MESSAGE",
        title: "",
        content: "",
        author: "",
        mediaUrl: "",
        isActive: true,
        publishDate: new Date().toISOString().split('T')[0]
    });

    const categoryTabs = [
         { id: "MESSAGE", label: "Daily Guidance", icon: Sparkles },
        // { id: "MEDIA", label: "Media Library", icon: ImageIcon },
        // { id: "BLOG", label: "Knowledge Hub", icon: FileText },
        { id: "HANDBOOK", label: "Expert Handbook", icon: Book }
    ];

    const fetchContent = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/daily/content`, { params: { type: activeTab } });
            setContentItems(Array.isArray(res.data.data) ? res.data.data : []);
            setHasOrderChanged(false);
        } catch (err) {
            console.error("🌌 [CONTENT_SYNC_ERROR]", err);
            toast("Failed to sync cosmic content", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
        setForm(prev => ({ ...prev, type: activeTab }));
    }, [api, activeTab]);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setForm({
            type: activeTab,
            title: "",
            content: "",
            author: "",
            mediaUrl: "",
            isActive: true,
            publishDate: new Date().toISOString().split('T')[0]
        });
        setIsAdding(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setForm({
            type: item.type,
            title: item.title || "",
            content: item.content || "",
            author: item.author || "",
            mediaUrl: item.mediaUrl || "",
            isActive: item.isActive,
            publishDate: new Date(item.publishDate).toISOString().split('T')[0]
        });
        setIsAdding(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingItem) {
                await api.patch(`/daily/content/${editingItem.id}`, form);
                toast("Archive updated successfully", "success");
            } else {
                await api.post("/daily/content", form);
                toast("Cosmic message broadcasted!", "success");
            }
            setIsAdding(false);
            fetchContent();
        } catch (err) {
            toast(err.response?.data?.message || "Operation failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            const newStatus = !item.isActive;
            await api.patch(`/daily/content/${item.id}`, { isActive: newStatus });
            toast(newStatus ? "Broadcasting live!" : "Moved to orbit", "info");
            fetchContent();
        } catch (err) {
            toast("Cosmic toggle failed", "error");
        }
    };

    const handleReorder = (newOrder) => {
        setContentItems(newOrder);
        setHasOrderChanged(true);
    };

    const handleSaveOrder = async () => {
        try {
            setSavingOrder(true);
            const orders = contentItems.map((item, index) => ({
                id: item.id,
                priority: index
            }));
            await api.patch("/daily/content-priority", { orders });
            toast("New sequence synchronized", "success");
            setHasOrderChanged(false);
        } catch (err) {
            toast("Failed to save sequence", "error");
        } finally {
            setSavingOrder(false);
        }
    };

    const filteredItems = contentItems.filter(item => 
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6 text-left">
                
                {/* Header Context */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                             <Sparkles size={20} />
                        </div>
                        <div className="text-left">
                             <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/50 uppercase">Admin Content</h2>
                             <h1 className="text-xl font-bold text-white">Manage <span className="text-orange-400">Resources</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === "HANDBOOK" && hasOrderChanged && (
                            <button 
                                onClick={handleSaveOrder}
                                disabled={savingOrder}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                            >
                                {savingOrder ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                                Save Sequence
                            </button>
                        )}
                        <button 
                            onClick={handleOpenAdd}
                            className={`px-6 py-2 ${activeTab === 'HANDBOOK' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'} text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2`}
                        >
                            <Plus size={14} /> New Entry
                        </button>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#121212] border border-white/10 rounded-lg">
                    <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg overflow-x-auto no-scrollbar">
                        {categoryTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-md text-[9px] font-bold tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === tab.id 
                                    ? "bg-orange-600 text-white shadow-lg" 
                                    : "text-white/30 hover:text-white/60"
                                }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-black/40 border border-white/10 rounded-lg px-4 py-2 items-center gap-3 w-full sm:w-64 group focus-within:border-orange-500/50 transition-all">
                        <Search size={14} className="text-white/20 group-focus-within:text-orange-400" />
                        <input 
                            type="text" 
                            placeholder="Search library..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-[10px] font-bold text-white placeholder:text-white/10 w-full" 
                        />
                    </div>
                </div>

                {/* Content Table */}
                <div className="bg-[#121212] border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-320px)]">
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="bg-black/40 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-white/40 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 w-12"></th>
                                    <th className="px-6 py-4">Protocol Entry</th>
                                    <th className="px-6 py-4">Attributes</th>
                                    <th className="px-6 py-4">Publish Detail</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <Reorder.Group 
                                as="tbody" 
                                axis="y" 
                                values={contentItems} 
                                onReorder={handleReorder}
                                className="divide-y divide-white/5"
                            >
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <Loader2 size={32} className="text-orange-500 animate-spin mx-auto mb-4" />
                                            <span className="text-[10px] font-bold tracking-[0.4em] text-white/10 uppercase italic">Retrieving Archives...</span>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <span className="text-[10px] font-bold tracking-[0.4em] text-white/10 uppercase italic">Archives are empty</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <Reorder.Item 
                                            as="tr" 
                                            key={item.id} 
                                            value={item}
                                            dragListener={activeTab === "HANDBOOK"}
                                            className="hover:bg-white/[0.01] transition-colors group cursor-default active:bg-white/[0.03]"
                                        >
                                            <td className="px-6 py-4">
                                                {activeTab === "HANDBOOK" ? (
                                                    <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-emerald-500 transition-colors">
                                                        <GripVertical size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-white/10" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-[400px]">
                                                <div className="flex flex-col gap-1.5 text-left">
                                                    <span className={`text-xs font-bold text-white transition-colors truncate ${activeTab === 'HANDBOOK' ? 'group-hover:text-emerald-400' : 'group-hover:text-orange-400'}`}>{item.title || "Untitled Guidance"}</span>
                                                    <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed italic">"{item.content}"</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-left">
                                                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-tight">
                                                        <User size={10} className={activeTab === 'HANDBOOK' ? 'text-emerald-500/50' : 'text-orange-500/50'} />
                                                        <span>{item.author || "Cosmic Bot"}</span>
                                                    </div>
                                                    {item.mediaUrl && (
                                                        <a href={item.mediaUrl} target="_blank" className="flex items-center gap-1.5 text-[9px] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest font-bold">
                                                            <ExternalLink size={10} /> View Media
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-left">
                                                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold">
                                                        <Calendar size={10} />
                                                        <span>{new Date(item.publishDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Stellar Schedule</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleToggleActive(item)}
                                                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                                                            item.isActive ? (activeTab === 'HANDBOOK' ? 'bg-emerald-600' : 'bg-orange-600') : 'bg-white/10'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                                                item.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                                                            }`}
                                                        />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                                    >
                                                        <Edit size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-red-500/40 hover:text-red-500 transition-all hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </Reorder.Item>
                                    ))
                                )}
                            </Reorder.Group>
                        </table>
                    </div>
                </div>

                <p className="text-center text-[9px] font-sans font-semibold tracking-[0.5em] text-white/5 italic">
                    Universal Broadcast Layer • Guidance Distribution Active
                </p>
            </div>

            {/* Add Content Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                             <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                          {editingItem ? <Edit size={16} /> : <Plus size={16} />}
                                      </div>
                                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">{editingItem ? "Update Entry" : "Add New Content"}</h3>
                                  </div>
                                 <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                                     <X size={20} />
                                 </button>
                             </div>
 
                             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {form.type !== "HANDBOOK" ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Category</label>
                                                <select 
                                                    value={form.type}
                                                    onChange={(e) => setForm({...form, type: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                                                >
                                                    <option value="MESSAGE">Daily Guidance</option>
                                                    <option value="MEDIA">Media Library</option>
                                                    <option value="BLOG">Knowledge Hub</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Publish Date</label>
                                                <input 
                                                    type="date"
                                                    value={form.publishDate}
                                                    onChange={(e) => setForm({...form, publishDate: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Library Title</label>
                                            <input 
                                                type="text"
                                                placeholder="Enter title..."
                                                value={form.title}
                                                onChange={(e) => setForm({...form, title: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Description</label>
                                            <textarea 
                                                rows="4"
                                                value={form.content}
                                                onChange={(e) => setForm({...form, content: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all resize-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Author</label>
                                                <input 
                                                    type="text"
                                                    value={form.author}
                                                    onChange={(e) => setForm({...form, author: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Media URL</label>
                                                <input 
                                                    type="url"
                                                    value={form.mediaUrl}
                                                    onChange={(e) => setForm({...form, mediaUrl: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Specialized Handbook Form */}
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-4">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                <Book size={12} /> Expert Manual Protocol
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Section Title</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g., Communication Guidelines"
                                                value={form.title}
                                                onChange={(e) => setForm({...form, title: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-6 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Protocol Description (Paragraph Content)</label>
                                            <textarea 
                                                rows="6"
                                                placeholder="Draft the official guidance here..."
                                                value={form.content}
                                                onChange={(e) => setForm({...form, content: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-6 py-4 text-sm font-medium text-white/70 outline-none focus:border-emerald-500/50 transition-all resize-none leading-relaxed"
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-3 py-2">
                                    <input 
                                        type="checkbox"
                                        id="isActive"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({...form, isActive: e.target.checked})}
                                        className={`w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-offset-0 ${form.type === 'HANDBOOK' ? 'text-emerald-600 focus:ring-emerald-600' : 'text-orange-600 focus:ring-orange-600'}`}
                                    />
                                    <label htmlFor="isActive" className="text-[10px] font-bold text-white/40 uppercase tracking-widest cursor-pointer">Live in Expert Panel</label>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-4 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 mt-4 ${
                                        form.type === 'HANDBOOK' 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' 
                                        : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/30'
                                    }`}
                                >
                                    {submitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>{editingItem ? "Sync Manual Entry" : "Establish Protocol"} <CheckCircle size={16} /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminContent;
