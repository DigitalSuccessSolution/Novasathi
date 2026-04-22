import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IntakeForm = ({ isOpen, onClose, onSubmit, expert }) => {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'partner'
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    tob: '',
    isTimeAccurate: false,
    city: '',
    concern: '',
    partnerName: '',
    partnerGender: 'Female',
    partnerDob: '',
    partnerTob: '',
    partnerIsTimeAccurate: false,
    partnerCity: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ─── Load Saved Data ───
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem('global_intake_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          concern: '' // Always clear concern for new expert/session
        }));
      } else {
        // Only reset if no saved data
        setFormData({
          name: '',
          gender: 'Male',
          dob: '',
          tob: '',
          isTimeAccurate: false,
          city: '',
          concern: '',
          partnerName: '',
          partnerGender: 'Female',
          partnerDob: '',
          partnerTob: '',
          partnerIsTimeAccurate: false,
          partnerCity: ''
        });
      }
      setErrors({});
      setActiveTab('my');
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    if (!formData.tob) newErrors.tob = 'Time of Birth is required';
    if (!formData.city.trim()) newErrors.city = 'Place of Birth is required';
    if (!formData.concern.trim()) newErrors.concern = 'Please specify your concern';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Save global data (static info) to localStorage for future pre-filling
      const { concern, ...globalData } = formData;
      localStorage.setItem('global_intake_data', JSON.stringify(globalData));
      
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 text-[16px] focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-all placeholder:text-gray-400";
  const labelClasses = "text-[14px] font-semibold text-emerald-700 mb-1.5 block ml-0.5";

  const renderMyDetails = () => (
    <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <label className={labelClasses}>Full Name *</label>
            <input 
                type="text"
                placeholder="Enter your name"
                className={`${inputClasses} ${errors.name ? 'border-red-500 bg-red-50/30' : ''}`}
                value={formData.name}
                onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: null});
                }}
            />
            {errors.name && <p className="text-red-500 text-[13px] mt-1.5 font-medium ml-1">{errors.name}</p>}
        </div>

        <div>
            <label className={labelClasses}>Date of Birth *</label>
            <input 
                type="date"
                className={`${inputClasses} ${errors.dob ? 'border-red-500 bg-red-50/30' : ''}`}
                value={formData.dob}
                onChange={(e) => {
                    setFormData({...formData, dob: e.target.value});
                    if (errors.dob) setErrors({...errors, dob: null});
                }}
            />
            {errors.dob && <p className="text-red-500 text-[13px] mt-1.5 font-medium ml-1">{errors.dob}</p>}
        </div>

        <div>
            <label className={labelClasses}>Time of Birth *</label>
            <input 
                type="time"
                className={`${inputClasses} ${errors.tob ? 'border-red-500 bg-red-50/30' : ''}`}
                value={formData.tob}
                onChange={(e) => {
                    setFormData({...formData, tob: e.target.value});
                    if (errors.tob) setErrors({...errors, tob: null});
                }}
            />
            {errors.tob && <p className="text-red-500 text-[13px] mt-1.5 font-medium ml-1">{errors.tob}</p>}
        </div>

        <div>
            <label className={labelClasses}>Gender *</label>
            <div className="flex items-center gap-6 mt-1 ml-1">
                {['Male', 'Female'].map(g => (
                    <label
                        key={g}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative flex items-center justify-center">
                            <input
                                type="radio"
                                name="gender"
                                className="sr-only"
                                checked={formData.gender === g}
                                onChange={() => setFormData({...formData, gender: g})}
                            />
                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                                formData.gender === g 
                                ? 'border-emerald-600 bg-emerald-50' 
                                : 'border-gray-200 bg-white group-hover:border-gray-300'
                            }`}>
                                {formData.gender === g && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2.5 h-2.5 rounded-full bg-emerald-600"
                                    />
                                )}
                            </div>
                        </div>
                        <span className={`text-[16px] font-medium transition-colors ${
                            formData.gender === g ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                            {g}
                        </span>
                    </label>
                ))}
            </div>
        </div>

        <div>
            <label className={labelClasses}>Time Accuracy</label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input 
                        type="checkbox"
                        className="sr-only"
                        checked={formData.isTimeAccurate}
                        onChange={() => setFormData({...formData, isTimeAccurate: !formData.isTimeAccurate})}
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        formData.isTimeAccurate ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-50 border-gray-200 group-hover:border-gray-300'
                    }`}>
                        {formData.isTimeAccurate && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                </div>
                <span className="text-[16px] font-medium text-gray-700">Time is Accurate</span>
            </label>
        </div>

        <div>
            <label className={labelClasses}>Place of Birth *</label>
            <input 
                type="text"
                placeholder="Enter city of birth"
                className={`${inputClasses} ${errors.city ? 'border-red-500 bg-red-50/30' : ''}`}
                value={formData.city}
                onChange={(e) => {
                    setFormData({...formData, city: e.target.value});
                    if (errors.city) setErrors({...errors, city: null});
                }}
            />
            {errors.city && <p className="text-red-500 text-[13px] mt-1.5 font-medium ml-1">{errors.city}</p>}
        </div>

        <div>
            <label className={labelClasses}>Primary Concern *</label>
            <textarea 
                placeholder="What would you like to discuss? (e.g., Career, Love, Finance)"
                className={`${inputClasses} min-h-[100px] resize-none ${errors.concern ? 'border-red-500 bg-red-50/30' : ''}`}
                value={formData.concern}
                onChange={(e) => {
                    setFormData({...formData, concern: e.target.value});
                    if (errors.concern) setErrors({...errors, concern: null});
                }}
            />
            {errors.concern && <p className="text-red-500 text-[13px] mt-1.5 font-medium ml-1">{errors.concern}</p>}
        </div>
    </div>
  );

  const renderPartnerDetails = () => (
    <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <label className={labelClasses}>Partner Name</label>
            <input 
                type="text"
                placeholder="Enter partner name"
                className={inputClasses}
                value={formData.partnerName}
                onChange={(e) => setFormData({...formData, partnerName: e.target.value})}
            />
        </div>

        <div>
            <label className={labelClasses}>Partner Birth Date</label>
            <input 
                type="date"
                className={inputClasses}
                value={formData.partnerDob}
                onChange={(e) => setFormData({...formData, partnerDob: e.target.value})}
            />
        </div>

        <div>
            <label className={labelClasses}>Partner Birth Time</label>
            <input 
                type="time"
                className={inputClasses}
                value={formData.partnerTob}
                onChange={(e) => setFormData({...formData, partnerTob: e.target.value})}
            />
        </div>

        <div>
            <label className={labelClasses}>Partner Time Accuracy</label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input 
                        type="checkbox"
                        className="sr-only"
                        checked={formData.partnerIsTimeAccurate}
                        onChange={() => setFormData({...formData, partnerIsTimeAccurate: !formData.partnerIsTimeAccurate})}
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        formData.partnerIsTimeAccurate ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-50 border-gray-200 group-hover:border-gray-300'
                    }`}>
                        {formData.partnerIsTimeAccurate && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                </div>
                <span className="text-[14px] font-medium text-gray-700">Time is Accurate</span>
            </label>
        </div>

        <div>
            <label className={labelClasses}>Partner Gender</label>
            <div className="flex items-center gap-6 mt-1 ml-1">
                {['Male', 'Female'].map(g => (
                    <label
                        key={g}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative flex items-center justify-center">
                            <input
                                type="radio"
                                name="partnerGender"
                                className="sr-only"
                                checked={formData.partnerGender === g}
                                onChange={() => setFormData({...formData, partnerGender: g})}
                            />
                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                                formData.partnerGender === g 
                                ? 'border-emerald-600 bg-emerald-50' 
                                : 'border-gray-200 bg-white group-hover:border-gray-300'
                            }`}>
                                {formData.partnerGender === g && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2.5 h-2.5 rounded-full bg-emerald-600"
                                    />
                                )}
                            </div>
                        </div>
                        <span className={`text-[16px] font-medium transition-colors ${
                            formData.partnerGender === g ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                            {g}
                        </span>
                    </label>
                ))}
            </div>
        </div>

        <div>
            <label className={labelClasses}>Partner Birth Place</label>
            <input 
                type="text" 
                placeholder="Enter partner birth city"
                className={inputClasses} 
                value={formData.partnerCity} 
                onChange={(e) => setFormData({...formData, partnerCity: e.target.value})} 
            />
        </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-0 flex flex-col bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Share Your Details</h2>
                    <p className="text-[14px] text-gray-500 font-medium">Shared with expert for consultation</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                >
                  <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {[
                    { id: 'my', label: 'My Details', icon: User },
                    { id: 'partner', label: 'Partner Details', icon: CheckCircle2 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-[15px] font-semibold transition-all relative ${
                            activeTab === tab.id ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                    </button>
                ))}
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar min-h-[350px]">
            {activeTab === 'my' ? renderMyDetails() : renderPartnerDetails()}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/30">
            <button 
              disabled={loading || !formData.name || !formData.dob}
              onClick={handleSubmit}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale rounded-xl font-bold text-[16px] text-white transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-3 min-h-[56px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Start Consultation <ChevronRight size={16} /></>
              )}
            </button>
            <p className="text-center text-[12px] text-gray-400 mt-4 font-medium italic">100% Shared Information is Confidential</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IntakeForm;
