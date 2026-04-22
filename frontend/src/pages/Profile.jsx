import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Save,
  Camera,
  Mail,
  Phone
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const Profile = () => {
  const { user, logout, api, setAuthUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    address: user?.address || "",
    isAnonymous: user?.isAnonymous || false
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (selectedFile) {
        formDataToSend.append('avatar', selectedFile);
      }

      const res = await api.patch("/users/profile", formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAuthUser(res.data.data);
      toast("Profile updated in our records", "success");
      setSelectedFile(null);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-10">
        <header>
          <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Account Settings</h1>
          <p className="text-[10px]  tracking-widest text-white/70 mt-1 font-semibold">Manage your celestial identity and preferences</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Avatar */}
          <div className="flex flex-col items-center">
            <div 
              className="relative group/avatar cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute -inset-1.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-full blur-md opacity-20 group-hover/avatar:opacity-100 transition duration-500"></div>
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 shadow-xl">
                <img 
                  src={previewUrl || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || "Spirit"}&background=6D28D9&color=FFFFFF`} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-[10px] mt-6 text-white/70  tracking-widest font-semibold">Change Avatar</p>
          </div>

          <div className="lg:col-span-2 space-y-6 bg-white/5 border border-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-3xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px]  tracking-widest text-purple-400/80 font-semibold ml-1">Identity Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/85" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/80 text-xs font-medium focus:border-purple-500/30 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px]  tracking-widest text-purple-400/80 font-semibold ml-1">Verified Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/85" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/80 text-xs font-medium focus:border-purple-500/30 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px]  tracking-widest text-emerald-400/80 font-semibold ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/85" />
                  <input 
                    type="text" 
                    value={formData.phone}
                    disabled
                    className="w-full bg-white/3 border border-white/5 text-gray-600 rounded-xl py-3 pl-10 pr-4 text-xs outline-hidden cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px]  tracking-widest text-blue-400/80 font-semibold ml-1">Birth Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/85" />
                  <input 
                    type="date" 
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/80 text-xs font-medium focus:border-blue-500/30 transition-all outline-hidden scheme-dark"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px]  tracking-widest text-blue-400/80 font-semibold ml-1">Gender</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/85" />
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-[#131424] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/80 text-xs font-medium focus:border-purple-500/30 transition-all outline-hidden appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#131424]">Select Gender</option>
                    <option value="male" className="bg-[#131424]">Male</option>
                    <option value="female" className="bg-[#131424]">Female</option>
                    <option value="other" className="bg-[#131424]">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2 py-4 border-t border-white/5">
              <input 
                type="checkbox" 
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500/50"
              />
              <label htmlFor="isAnonymous" className="text-[10px]  tracking-widest text-gray-400 font-semibold cursor-pointer">Enable Anonymous Identity in Chats</label>
            </div>

            <motion.button 
              onClick={handleSubmit}
              disabled={isSaving}
              whileHover={{ scale: 1.01, brightness: 1.1 }}
              whileTap={{ scale: 0.99 }}
              className="w-full mt-4 py-4 rounded-2xl bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold text-[10px] tracking-widest  shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? "Syncing..." : "Save Changes"}
            </motion.button>

            <button 
              onClick={handleLogout}
              className="w-full mt-4 py-3 rounded-2xl border border-rose-500/20 text-rose-500 font-semibold text-[10px] tracking-widest  hover:bg-rose-500/10 transition-all"
            >
              Sign Out of Sanctuary
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
