import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ExpertLayout from "../../components/ExpertLayout";

/**
 * ExpertTerms - Full Text Agreement UI
 * Extremely simple: Headings, Paragraphs, and Bullet points only.
 */
const ExpertTerms = () => {
    const navigate = useNavigate();

    return (
        <ExpertLayout>
            <div className="max-w-none py-6 px-6 pb-20 text-white/90">
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

                {/* Header Section */}
                <div className="mb-10 space-y-2">
                    <h1 className="text-4xl font-semibold tracking-tight">Expert Terms & Conditions</h1>
                    <p className="text-lg font-medium text-emerald-400">Astrologer, Counsellor & Listener Agreement</p>
                    <div className="pt-2 flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                        <span>Version 1.0  |  Effective April 2025  |  India Jurisdiction</span>
                        <span>Governed by: Information Technology Act 2000, Indian Contract Act 1872</span>
                    </div>
                </div>

                <div className="space-y-10 max-w-5xl">
                    {/* Intro */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white tracking-tight underline decoration-emerald-500/30 underline-offset-8">📋 Ye Document Kya Hai?</h2>
                        <p className="text-base font-medium text-white/70 leading-relaxed">
                            Ye Agreement Nova Sathi platform par kaam karne wale sabhi Experts — Astrologers, Vedic Pandits, Tarot Readers, Numerologists, Palmists, Counsellors aur Listeners — ke saath hai. Is document ko dhyan se padhein. Platform pe join karne ka matlab hai aap in sabhi terms se agree karte hain. Koi bhi sawal ho toh contact karein: support@novasathi.com
                        </p>
                    </div>

                    {/* Section 1 */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 1 — Definitions (Paribhasha)</h2>
                        <p className="text-base font-medium text-white/70">Is Agreement mein neeche diye gaye shabdon ka yahi arth hoga:</p>
                        <ul className="space-y-4">
                            {[
                                { t: "Platform / Nova Sathi", d: "Nova Sathi PWA website aur app — novasathi.com pe available" },
                                { t: "Expert", d: "Aap — jo is Agreement pe sign karte hain. Astrologer, Pandit, Tarot Reader, Numerologist, Palmist, Counsellor ya Listener." },
                                { t: "Company / Hum", d: "Nova Sathi — Vikram Purohi dwara operated, Rajasthan, India" },
                                { t: "User / Client", d: "Nova Sathi pe registered woh log jo aapke saath chat/call karte hain" },
                                { t: "Session", d: "Ek chat ya call interaction user ke saath — timed aur recorded" },
                                { t: "Wallet", d: "User ka in-platform credit balance — jisse sessions pay hote hain" },
                                { t: "Commission", d: "Platform ka cut — har session ki earnings mein se" },
                                { t: "KYC", d: "Know Your Customer — identity verification documents" },
                                { t: "Content", d: "Jo bhi aap platform pe type, bol ya share karein" }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <span className="text-emerald-500 font-semibold mt-1.5">•</span>
                                    <p className="text-base text-white/60 font-normal"><span className="text-white font-semibold">{item.t}</span>: {item.d}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 2 — Eligibility (Yogyata)</h2>
                        <p className="text-base font-medium text-white/70">Nova Sathi par Expert ban ne ke liye aapko neeche di gayi sabhi conditions poori karni hain:</p>
                        <ul className="space-y-3">
                            {[
                                "Aap Indian citizen hain aur India mein resident hain",
                                "Aapki umar 18 saal ya usse adhik hai",
                                "Aap apni declared specialization mein genuinely skilled hain — Vedic Astrology, Tarot, Numerology, Palmistry, Counselling, ya Listening",
                                "Aapke paas valid government-issued ID hai — Aadhaar aur PAN",
                                "Aap kisi bhi active criminal case mein involved nahi hain",
                                "Aapne kisi aur platform par fraud, misconduct ki wajah se ban nahi karaya gaya",
                                "Aap ek waqt mein sirf ek Expert account rakh sakte hain — multiple accounts prohibited hain"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <span className="text-emerald-500 font-semibold mt-1.5">•</span>
                                    <p className="text-base text-white/60 font-normal">{item}</p>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm font-semibold text-rose-500 bg-rose-500/5 p-4 border-l-2 border-rose-500 mt-6">
                            ⚠️ Important: Koi bhi galat information dena immediate permanent ban ka karan ban sakta hai.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 3 — KYC Verification & Onboarding</h2>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white/90 underline decoration-white/10 underline-offset-4">3.1 Documents Required</h3>
                            <ul className="space-y-2">
                                {["Aadhaar Card — front aur back", "PAN Card", "Professional Certification (Strongly Recommended)", "1-minute Introduction Video", "Bank Account Details"].map(i => (
                                    <li key={i} className="flex gap-4 items-start text-base text-white/60 font-normal">
                                        <span className="text-emerald-500 font-semibold">•</span> {i}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white/90 underline decoration-white/10 underline-offset-4">3.2 Approval Process</h3>
                            <ul className="space-y-2">
                                {["Admin review karega — 2-7 business days", "Admin interview/demo session le sakta hai", "Rejected application 30 din baad dubara submit ki ja sakti hai"].map(i => (
                                    <li key={i} className="flex gap-4 items-start text-base text-white/60 font-normal">
                                        <span className="text-emerald-500 font-semibold">•</span> {i}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold text-white tracking-tight uppercase tracking-widest text-emerald-500">Section 4 — Conduct & Rules</h2>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white/90">4.1 Mandatory Rules (Ye Hamesha Karna Hai)</h3>
                            <ul className="space-y-4">
                                {[
                                    { t: "R1 Presence", d: "Online status set karne par available hona zaroori hai. Fake online status warning ka karan banega." },
                                    { t: "R2 Intake Form", d: "Har session se pehle user ka intake form (Naam, DOB, Concern) dhyan se padhein." },
                                    { t: "R3 Professionalism", d: "Hindi, Hinglish ya English mein polite aur warm tone maintain karna zaroori hai." },
                                    { t: "R4 Crisis Protocol", d: "Agar user self-harm express kare — turant flag karo aur crisis helpline (9152987821) dein." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start">
                                        <span className="text-emerald-500 font-semibold mt-1.5">•</span>
                                        <div className="text-base">
                                            <span className="font-semibold text-white block mb-1 underline decoration-white/5 underline-offset-4">{item.t}</span>
                                            <span className="text-white/60 font-normal">{item.d}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-rose-500/20">
                            <h3 className="text-lg font-semibold text-rose-500 uppercase tracking-widest">4.2 Strict Prohibitions (STRICTLY BANNED)</h3>
                            <ul className="space-y-4">
                                {[
                                    { t: "P1 Personal Contact Share Karna", d: "WhatsApp, Instagram, Phone number share karne par pehli violation pe 30 din ban, doosri pe permanent ban." },
                                    { t: "P2 User Contact Maangna", d: "User se uska number ya ID maangna bilkul prohibited hai." },
                                    { t: "P3 Over-Promising", d: "100% guarantee ya pakka words use karna prohibited hai." },
                                    { t: "P5 Fake Information", d: "Qualification ya experience ke baare mein galat info dena = immediate permanent ban." },
                                    { t: "P6 Recording & Screenshot", d: "User session ka screenshot ya recording lena strictly prohibited hai." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start">
                                        <span className="text-rose-500 font-semibold mt-1.5">•</span>
                                        <div className="text-base">
                                            <span className="font-semibold text-white block mb-1 underline decoration-white/5 underline-offset-4">{item.t}</span>
                                            <span className="text-white/60 font-normal">{item.d}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Section 5 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 5 — Earnings & Payout Policy</h2>
                        <ul className="space-y-3">
                            {[
                                "Astro Session Rate: Aap khud set karte ho (₹5/min to ₹500/min)",
                                "Platform Commission: Har session ki revenue share onboarding pe communicate ki jayegi",
                                "Free Session Minutes: Iska payment nahi milega — ye user acquisition strategy hai",
                                "Payout Cycle: Weekly ya Bi-weekly admin dashboard se confirm hoga",
                                "Minimum Payout: ₹200 balance hona zaroori hai"
                            ].map(i => (
                                <li key={i} className="flex gap-4 items-start text-base text-white/60 font-normal">
                                    <span className="text-emerald-500 font-semibold">•</span> {i}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Section 6 */}
                    <div className="space-y-4 text-base text-white/60 font-normal">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 6 — Privacy & Confidentiality</h2>
                        <p>User data confidentiality ek legal obligation hai. User ki personal information kisi third party se share karna prohibited hai. IT Act 2000 Section 43A ke tahat misuse punishable hai.</p>
                        <p>Platform par automatic keyword filtering system active hai. WhatsApp aur Numbers automatically block ho jayenge.</p>
                    </div>

                    {/* Section 8 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-rose-500 tracking-tight">Section 8 — Immediate Permanent Ban Grounds</h2>
                        <p className="text-base font-semibold text-white/40 uppercase tracking-widest">🚫 Ye karne par turant permanent ban hoga:</p>
                        <ul className="space-y-2">
                            {[
                                "Personal contact share karna ya user se bahar deal karna",
                                "Sexual ya inappropriate interaction with users",
                                "User se direct payment lena",
                                "Fake identity ya qualifications",
                                "Minor (18-) ke saath inappropriate interaction"
                            ].map(i => (
                                <li key={i} className="flex gap-4 items-start text-base text-white/60 font-normal">
                                    <span className="text-rose-500 font-semibold">•</span> {i}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Section 11 */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">Section 11 — Disputes & Legal</h2>
                        <p className="text-base text-white/70 font-medium border-l-2 border-emerald-500/20 pl-6 py-1">
                            Is agreement se related koi bhi legal dispute **Rajasthan High Court** jurisdiction mein aayega. Governing law: Indian Contract Act 1872 aur Information Technology Act 2000.
                        </p>
                    </div>

                    {/* Final Acceptance */}
                    <div className="pt-10 border-t border-white/10 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-semibold text-emerald-400">Agreement & Acceptance</h2>
                            <p className="text-base text-white/60 font-medium leading-relaxed">
                                Main is Agreement ko poori tarah padhne ke baad in sabhi Terms & Conditions se agree karta/karti hoon. Main samajhta/samajhti hoon ki main ek independent contractor hoon, mere KYC documents genuine hain aur mera platform use is agreement ke rules ke under hoga.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="space-y-1">
                                <h4 className="text-lg font-semibold text-white">Vikram Purohi</h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-medium">Founder, Nova Sathi</p>
                                <p className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-semibold">novasathi.com | Rajasthan, India</p>
                            </div>
                            <div className="text-[10px] text-white/10 font-semibold uppercase tracking-[0.3em] text-right">
                                Sirf Experts Ke Liye • Distribution Prohibited<br />
                                © 2025 Nova Sathi India
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ExpertLayout>
    );
};

export default ExpertTerms;
