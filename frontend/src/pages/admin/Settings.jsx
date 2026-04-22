import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Percent, Shield, CreditCard, Loader2, AlertTriangle, Clock } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Admin Platform Settings
 */
const AdminSettings = () => {
    const { api } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        platformCommissionPercent: 30,
        freeMinutesSignup: 5,
        freeMinutesDailySOS: 10,
        minRechargeAmount: 50,
        lowBalanceThreshold: 20,
        freeMinutesResetType: "one_time",
        sosEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/admin/settings");
                if (res.data.data) setSettings(res.data.data);
            } catch (err) {
                console.error("[SETTINGS_ERROR]", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [api]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.patch("/admin/settings", settings);
            toast("Settings updated successfully", "success");
        } catch (err) {
            toast("Failed to update settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const settingCards = [
        { icon: Percent, label: "Platform Commission", key: "platformCommissionPercent", suffix: "%", desc: "Revenue share from each expert session" },
        { icon: Clock, label: "Signup Bonus Minutes", key: "freeMinutesSignup", suffix: "Mins", desc: "Free minutes given to new users on signup" },
        { icon: Shield, label: "Daily SOS Minutes", key: "freeMinutesDailySOS", suffix: "Mins", desc: "Free daily minutes for SOS / Dil Ki Baat" },
        { icon: CreditCard, label: "Min Recharge Amount", key: "minRechargeAmount", suffix: "₹", desc: "Minimum wallet recharge amount" },
        { icon: AlertTriangle, label: "Low Balance Alert", key: "lowBalanceThreshold", suffix: "₹", desc: "Threshold to trigger low balance warnings" },
    ];

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 text-left">
                
                <div className="flex items-center justify-between gap-4 group text-left">
                    <div className="flex items-center gap-4 text-white/85 group-hover:text-white transition-colors text-left">
                        <SettingsIcon size={20} className="text-purple-400" />
                        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">Platform Settings</h2>
                    </div>
                    <button 
                        disabled={saving || loading}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                        <Loader2 size={32} className="text-purple-500 animate-spin" />
                        <span className="text-[10px] font-sans font-semibold tracking-[0.5em] text-white/40 uppercase italic">
                            Loading Settings...
                        </span>
                    </div>
                ) : (
                    <>
                        {/* Numeric Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {settingCards.map((card) => (
                                <div key={card.key} className="p-5 bg-[#121212] border border-white/10 rounded-lg group hover:border-white/20 transition-all text-left">
                                    <div className="flex items-center justify-between mb-4 text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-purple-400 border border-white/5">
                                                <card.icon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white/90">{card.label}</span>
                                                <span className="text-[10px] text-white/40">{card.desc}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus-within:border-purple-500/50 transition-all">
                                        <input 
                                            type="number"
                                            value={settings[card.key]}
                                            onChange={(e) => updateField(card.key, e.target.value)}
                                            className="bg-transparent border-none outline-none text-base font-bold text-white flex-1 font-sans"
                                        />
                                        <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{card.suffix}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Toggle Settings */}
                        <div className="bg-[#121212] border border-white/10 rounded-lg divide-y divide-white/5">
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white/90">SOS Module</span>
                                    <span className="text-[10px] text-white/40">Enable/disable the SOS emergency support feature</span>
                                </div>
                                <button 
                                    onClick={() => updateField('sosEnabled', !settings.sosEnabled)}
                                    className={`w-11 h-6 rounded-full relative transition-colors ${settings.sosEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${settings.sosEnabled ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white/90">Free Minutes Reset</span>
                                    <span className="text-[10px] text-white/40">How free minutes are allocated to users</span>
                                </div>
                                <select
                                    value={settings.freeMinutesResetType}
                                    onChange={(e) => updateField('freeMinutesResetType', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50 cursor-pointer"
                                >
                                    <option value="one_time">One Time (Signup Only)</option>
                                    <option value="daily">Daily Reset</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
