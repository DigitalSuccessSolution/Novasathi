import React, { useState, useEffect } from "react";
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Check, 
    X, 
    Loader2, 
    Search,
    ChevronRight,
    Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Ultra-Simple Category Management
 * Focuses on Name and Specializations in a clean list format.
 */
const CategoryManagement = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingSkill, setIsAddingSkill] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const [categoryForm, setCategoryForm] = useState({ name: "", code: "", description: "" });
    const [skillName, setSkillName] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/master/categories");
            setCategories(res.data.data || []);
        } catch (err) {
            toast("Failed to load categories", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            // Auto generate code from name
            await api.post("/admin/master/categories", categoryForm);
            toast("Category Added", "success");
            setIsAddingCategory(false);
            setCategoryForm({ name: "", code: "", description: "" });
            fetchData();
        } catch (err) {
            toast("Error adding category", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.patch(`/admin/master/categories/${editingCategory.id}`, categoryForm);
            toast("Category Updated", "success");
            setEditingCategory(null);
            fetchData();
        } catch (err) {
            toast("Error updating", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await api.delete(`/admin/master/categories/${id}`);
            toast("Deleted", "info");
            fetchData();
        } catch (err) {
            toast("Failed", "error");
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!skillName.trim()) return;
        try {
            setSubmitting(true);
            await api.post("/admin/master/skills", { name: skillName, categoryId: isAddingSkill });
            toast("Specialization Added", "success");
            setSkillName("");
            setIsAddingSkill(null);
            fetchData();
        } catch (err) {
            toast("Error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        try {
            await api.delete(`/admin/master/skills/${id}`);
            fetchData();
        } catch (err) {
            toast("Error", "error");
        }
    };

    const filtered = categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto py-10 px-4 text-left">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Categories</h1>
                        <p className="text-white/40 text-[11px] font-medium uppercase tracking-widest mt-1">Manage Domains & Specializations</p>
                    </div>
                    <button 
                        onClick={() => {
                            setCategoryForm({ name: "", code: "", description: "" });
                            setIsAddingCategory(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-indigo-500/30 transition-all"
                    />
                </div>

                {/* Categories List */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-white/20" size={32} />
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="p-20 text-center text-white/10 text-xs font-medium uppercase tracking-widest">No Categories Found</div>
                        ) : (
                            filtered.map((cat, idx) => (
                                <div key={cat.id} className={`p-6 flex flex-col gap-4 ${idx !== filtered.length-1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                                                <ChevronRight size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                                                <p className="text-[10px] text-white/20 font-mono uppercase">{cat.code}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setCategoryForm(cat); setEditingCategory(cat); }} className="p-2.5 hover:bg-white/5 text-white/30 hover:text-white rounded-lg transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Specializations inline */}
                                    <div className="flex flex-wrap items-center gap-2 pl-12">
                                        <div className="text-[10px] font-bold text-white/20 uppercase mr-2 tracking-widest">Specializations:</div>
                                        {cat.skills?.map(skill => (
                                            <div key={skill.id} className="group px-3 py-1 bg-white/5 border border-white/5 rounded-md text-[11px] text-white/60 flex items-center gap-2">
                                                {skill.name}
                                                <button onClick={() => handleDeleteSkill(skill.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => setIsAddingSkill(cat.id)}
                                            className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-[11px] font-bold hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(isAddingCategory || editingCategory) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{editingCategory ? "Edit" : "New"} Category</h2>
                                <button onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}><X size={20} className="text-white/20 hover:text-white" /></button>
                            </div>
                            <form className="p-6 space-y-4" onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                                    placeholder="Category Name"
                                    value={categoryForm.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const code = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        setCategoryForm({...categoryForm, name, code});
                                    }}
                                    required
                                />
                                {categoryForm.code && (
                                    <p className="text-[9px] text-white/20 font-mono flex items-center gap-1 mt-1">
                                        <Tag size={10} /> SYSTEM CODE: {categoryForm.code}
                                    </p>
                                )}
                                <button className="w-full bg-indigo-600 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg">
                                    {submitting ? <Loader2 size={16} className="animate-spin mx-auto"/> : (editingCategory ? "Update" : "Save")}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isAddingSkill && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">New Specialization</h2>
                                <button onClick={() => setIsAddingSkill(null)}><X size={20} className="text-white/20 hover:text-white" /></button>
                            </div>
                            <form className="p-6 space-y-4" onSubmit={handleAddSkill}>
                                <input 
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                                    placeholder="e.g., Vedic Astrologer"
                                    value={skillName}
                                    onChange={(e) => setSkillName(e.target.value)}
                                    required
                                />
                                <button className="w-full bg-indigo-600 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg">
                                    {submitting ? <Loader2 size={16} className="animate-spin mx-auto"/> : "Add Specialty"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default CategoryManagement;
