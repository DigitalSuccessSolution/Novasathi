import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart
} from "lucide-react";

/**
 * Premium Sanctuary Footer - A high-fidelity, polished footer for NovaSathi.
 * Features glassmorphism, subtle animations, and semantic structure.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Sanctuary",
      links: [
        { name: "Home", href: "/" },
        { name: "Stars & Future", href: "/stars-and-future" },
        { name: "Dil Ki Baat", href: "/dil-ki-baat" },
        { name: "Meet Experts", href: "/experts" },
      ],
    },
    {
      title: "Community",
      links: [
        { name: "Become a Guide", href: "/expert-signup" },
        { name: "Expert login", href: "/expert-login" },
        { name: "The Lounge", href: "/expert-lounge" },
        { name: "Ritual Terms", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "FAQ", href: "#" },
        { name: "Contact Us", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Instagram size={18} />, href: "#", name: "Instagram" },
    { icon: <Twitter size={18} />, href: "#", name: "Twitter" },
    { icon: <Facebook size={18} />, href: "#", name: "Facebook" },
  ];

  return (
    <footer className="relative bg-[#05060b] text-white/80 pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Cinematic Auras */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-100px] right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none opacity-50"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Brand Manifesto */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/20">
                <Sparkles className="text-purple-400" size={20} />
              </div>
              <span className="text-2xl font-light tracking-tight italic text-white">
                Nova <span className="font-semibold not-italic">Sathi</span>
              </span>
            </Link>
            
            <p className="text-[13px] leading-relaxed font-medium text-white/50 max-w-sm">
              यार, सब ठीक है ना? चल बात करते हैं। <br />
              At NovaSathi, we bridge the celestial and the human, providing a sanctuary for your soul to find balance, guidance, and peace in the digital age.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
                  className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-purple-500/40 transition-all duration-300"
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Dynamic Link Sections */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="lg:col-span-2 space-y-8">
              <h4 className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      to={link.href}
                      className="text-[13px] font-medium text-white/60 hover:text-white flex items-center gap-2 group transition-all"
                    >
                      <span className="w-1 h-1 bg-purple-500/30 rounded-full group-hover:w-2 group-hover:bg-purple-400 transition-all"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter / Contact CTA */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">
              Newsletter
            </h4>
            <div className="space-y-4">
                <p className="text-[11px] text-white/40 leading-relaxed font-semibold">Get weekly cosmic insights delivered to your realm.</p>
                <div className="relative group">
                    <input 
                        type="email" 
                        placeholder="your@soul.com" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                    <button className="absolute right-2 top-1.5 p-1.5 bg-white text-black rounded-lg hover:bg-purple-400 hover:text-white transition-all">
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
            <ShieldCheck size={14} className="opacity-50" />
            <span>End-to-End Encrypted Rituals</span>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white/40">
                Created with <Heart size={12} className="text-rose-500 fill-rose-500" /> by NovaSathi Team
            </div>
            <p className="text-[10px] font-medium text-white/20 tracking-widest uppercase">
              © {currentYear} NovaSathi Sanctuary. All rights manifesting.
            </p>
          </div>
        </div>
      </div>

      {/* Extreme Bottom Noise/Texture */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-purple-500/20 to-transparent"></div>
    </footer>
  );
};

export default Footer;
