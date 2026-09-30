import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedGear from "@/components/AnimatedGear";
import logo from "@/assets/logo.png";

const Footer = () => {
  const location = useLocation();

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-gradient-to-b from-[#0a0e14] via-[#0d1219] to-[#04060a] text-white relative overflow-hidden font-body">
      
      {/* Background vignette (darker edges) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000a0_100%)] pointer-events-none z-0" />

      {/* Deep depth layers & textures */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      
      {/* Very Subtle Gear Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className="grid grid-cols-5 gap-16 transform rotate-6 scale-150 mix-blend-screen">
          {[...Array(20)].map((_, i) => (
            <AnimatedGear key={i} size={150} className={i % 2 === 0 ? "animate-spin-slow" : "[animation-direction:reverse] animate-spin-slow"} />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container-section py-5 md:py-7 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 lg:gap-8">
          
          {/* LEFT: BRAND SECTION */}
          <div className="md:col-span-12 lg:col-span-5">
            <div className="flex items-center gap-3 mb-3 group cursor-default relative">
              <img 
                src={logo} 
                alt="DDInfra and Co" 
                className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.02] relative z-10" 
              />
              <div className="h-8 w-[1px] bg-white/20 mx-1.5 hidden sm:block relative z-10" />
              <div className="flex flex-col relative z-10">
                 <span className="font-display font-bold text-lg tracking-wide text-[#EAEAEA] leading-none antialiased">DDInfra</span>
                 <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mt-0.5">And Co</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="relative pl-3 mb-4">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full" />
              <p className="text-[#EAEAEA]/90 text-[12px] leading-snug max-w-sm font-normal antialiased">
                Your trusted partner for heavy infrastructure equipment. Delivering premium machinery solutions with excellence.
              </p>
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { Icon: Facebook, url: "https://facebook.com/[DDINFRA_FACEBOOK]", hoverClass: "hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10" },
                { Icon: Instagram, url: "https://www.instagram.com/[DDINFRA_INSTAGRAM]/", hoverClass: "hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10" },
                { Icon: Youtube, url: "https://www.youtube.com/@[DDINFRA_YOUTUBE]", hoverClass: "hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10" },
                { Icon: Linkedin, url: "https://www.linkedin.com/company/[DDINFRA_LINKEDIN]", hoverClass: "hover:text-[#0A66C2] hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10" }
              ].map(({ Icon, url, hoverClass }, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#EAEAEA]/70 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${hoverClass}`}>
                  <Icon size={15} strokeWidth={1.5} className="group-hover:brightness-110 transition-all duration-300 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* CENTER: NAVIGATION */}
          <div className="md:col-span-6 lg:col-span-3 lg:col-start-7">
            <h4 className="font-display font-bold text-[#EAEAEA] mb-3 text-[10px] uppercase tracking-[0.2em] antialiased">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Home", path: "/" },
                { label: "Products", path: "/products" },
                { label: "Parts", path: "/parts" },
                { label: "Gallery", path: "/gallery" },
                { label: "Contact Us", path: "/contact-us" },
                { label: "Terms & Conditions", path: "/terms" },
                { label: "Privacy Policy", path: "/privacy-policy" },
              ].map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={l.path === "/" ? handleHomeClick : undefined}
                  className="relative text-[#EAEAEA]/80 text-[13px] font-medium transition-all duration-300 w-fit hover:translate-x-1 group antialiased hover:text-primary overflow-hidden pb-1"
                >
                  <span className="relative z-10">{l.label}</span>
                  {/* Subtle underline */}
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300 ease-out" />
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT: CONTACT */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="font-display font-bold text-[#EAEAEA] mb-3 text-[10px] uppercase tracking-[0.2em] antialiased">
              Connect With Us
            </h4>
            <div className="flex flex-col">
              
              {/* Location */}
              <div className="flex items-start gap-3 group border-b border-white/5 pb-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                  <MapPin size={14} className="text-primary transition-all duration-300" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[9px] font-semibold text-[#EAEAEA]/60 uppercase tracking-[0.15em] mb-0.5">Our Location</span>
                  <span className="text-white text-[13px] font-medium antialiased group-hover:text-primary transition-colors duration-300">
                    [DDINFRA_ADDRESS]
                  </span>
                </div>
              </div>
              
              {/* Phone */}
              <div className="flex items-start gap-3 group border-b border-white/5 pb-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                  <Phone size={14} className="text-primary transition-all duration-300" />
                </div>
                <div className="flex flex-col pt-0.5 gap-1">
                  <span className="text-[9px] font-semibold text-[#EAEAEA]/60 uppercase tracking-[0.15em]">Call Now</span>
                  <a href="tel:[DDINFRA_PHONE]" className="text-[#EAEAEA] text-[13px] font-black tracking-wide hover:text-primary transition-colors antialiased">
                    [DDINFRA_PHONE]
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all duration-300">
                  <Mail size={14} className="text-primary transition-all duration-300" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[9px] font-semibold text-[#EAEAEA]/60 uppercase tracking-[0.15em] mb-0.5">Email Support</span>
                  <a href="mailto:[DDINFRA_EMAIL]" className="text-[#EAEAEA] text-[13px] font-medium hover:text-primary transition-colors antialiased">
                    [DDINFRA_EMAIL]
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-5 pt-4 relative flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
          
          <div className="text-[11px] text-[#EAEAEA]/70 font-medium uppercase tracking-[0.1em] antialiased hover:text-[#EAEAEA] transition-colors duration-300">
            © 2026 DDInfra and Co. All rights reserved.
          </div>
          
          <div className="flex items-center gap-3 text-[11px] text-[#EAEAEA]/70 font-medium uppercase tracking-[0.1em] antialiased text-center hover:text-[#EAEAEA] transition-colors duration-300">
             <span>[DDINFRA_DOMAIN]</span>
             <span className="text-primary/50 text-[14px] leading-none">•</span>
             <span>Infrastructure Excellence</span>
             <span className="text-primary/50 text-[14px] leading-none">•</span>
             <span>Premium Equipment</span>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
