import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  MessageSquare, 
  Tag, 
  ShieldCheck,
  Share2,
  ChevronRight,
  ChevronLeft,
  Globe,
  MapPin,
  Phone,
  Hash,
  Clock,
  Settings,
  Info,
  Truck,
  FileText,
  Lock,
  Check,
  Wrench
} from "lucide-react";
import { useState, useEffect } from "react";
import partService from "@/services/partService";
import EnquiryModal from "@/components/EnquiryModal";
import AnimatedGear from "@/components/AnimatedGear";
import { useCurrency } from "@/context/CurrencyContext";
import CurrencyToggle from "@/components/CurrencyToggle";
import { cleanPrice } from "@/utils/priceFormatter";

import { usePartStore } from "@/store/usePartStore";

const normalizeAvail = (v = "") => {
  const s = v.trim().toLowerCase();
  if (s === "previously sold" || s === "sold") return "sold";
  if (s === "coming soon" || s === "coming_soon") return "coming_soon";
  return "in_stock";
};

const PartDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [activeImage, setActiveImage] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const { parts, loading: storeLoading } = usePartStore();
  
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findPart = async () => {
      setLoading(true);
      // Try finding in store first
      let data = parts.find(p => p.id === id || p.reference_number === id || p.reference_no === id);
      
      if (!data && !storeLoading) {
        // Fallback fetch if not in store
        try {
          data = await partService.getById(id);
        } catch (e) {
          console.error("Error fetching part", e);
        }
      }
      
      if (data) {
        setPart(data);
      }
      setLoading(false);
    };

    findPart();
  }, [id, parts, storeLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: part?.name || 'DDInfra Part',
        text: `Check out this ${part?.name} on DDInfra and Co`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const images = part?.images || [];
  const isSold = part?.availability === "sold";
  const refNumber = part?.reference_number || part?.reference_no || `EXC-000`;
  const priceStr = cleanPrice(part?.price || "0");
  const numericValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  const sourceCurrency = part?.currency || 'USD';
  const displayPrice = formatPrice(numericValue, sourceCurrency);
  const isAskForPrice = part?.pricing_mode === 'Ask For Price' || (!part?.price && numericValue === 0);

  const nextImage = () => {
    setDirection(1);
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const lightboxNext = () => setLightboxIndex((prev) => (prev + 1) % images.length);
  const lightboxPrev = () => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') lightboxNext();
      if (e.key === 'ArrowLeft') lightboxPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, images.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <AnimatedGear size={80} className="text-primary/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="mt-6 font-display font-black text-heading/40 uppercase tracking-[0.2em] text-xs">Loading Part Specs...</p>
    </div>
  );

  if (!part) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100">
            <Info size={40} className="text-gray-300" />
          </div>
          <h2 className="text-3xl font-display font-black text-heading mb-4 tracking-tight">Part Not Found</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">The part you are looking for might have been sold or removed from our catalog.</p>
          <Link to="/parts" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all inline-flex items-center gap-3">
            <ArrowLeft size={18} /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const specifications = [
    { label: "Category", value: part.category, icon: Tag },
    { label: "Brand", value: part.brand, icon: Settings },
    { label: "Model Number", value: part.model || "Universal", icon: Info },
    { label: "Machine Type", value: part.machine_type || "N/A", icon: Settings },
    { label: "Condition", value: part.condition || "New", icon: ShieldCheck },
    { label: "Availability", value: normalizeAvail(part.availability) === "sold" ? "Sold" : normalizeAvail(part.availability) === "coming_soon" ? "Coming Soon" : "In Stock", icon: Clock },
    { label: "Part Number", value: part.part_number || "N/A", icon: Hash },
    { label: "Reference No", value: refNumber, icon: Hash },
  ];

  return (
    <div className="min-h-fit bg-[#FAF9F6] relative pt-[72px] pb-4 font-jakarta max-w-[1500px] mx-auto">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px] pointer-events-none" />

      <div className="container-section relative z-10 mt-4">
        {/* Breadcrumbs & Actions */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link to="/parts" className="flex items-center gap-2.5 text-slate-400 hover:text-primary transition-all font-medium uppercase tracking-wider text-[11px] group">
            <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
              <ArrowLeft size={14} />
            </div>
            Back to Global Catalog
          </Link>
          
          <button onClick={handleShareLink} className="h-10 px-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-primary/30 hover:bg-primary/5 text-heading/60 hover:text-primary transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
            {isCopied ? <><CheckCircle2 size={16} className="text-green-500" /> Copied</> : <><Share2 size={16} /> Share Part</>}
          </button>
        </div>

        <div className="grid lg:grid-cols-[55%_45%] gap-12 items-start h-auto">
          {/* Left Column: Gallery */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="relative h-[420px] rounded-[24px] overflow-hidden bg-white border border-slate-100 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.05),0_32px_64px_-16px_rgba(0,0,0,0.1)] group cursor-zoom-in"
              onClick={() => openLightbox(activeImage)}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.img
                  key={activeImage}
                  src={images[activeImage] || "https://images.unsplash.com/photo-1541888009187-54b38dcd2b31?auto=format&fit=crop&q=80&w=1200"}
                  custom={direction}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                  alt={part.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[2s] ease-out"
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 flex justify-between z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-xl flex items-center justify-center text-heading hover:bg-primary hover:text-white transition-all pointer-events-auto active:scale-95">
                    <ChevronLeft size={22} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-xl flex items-center justify-center text-heading hover:bg-primary hover:text-white transition-all pointer-events-auto active:scale-95">
                    <ChevronRight size={22} />
                  </button>
                </div>
              )}

              {/* Click to zoom hint */}
              <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                Click to zoom
              </div>
              
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                {isSold && (
                  <div className="bg-rose-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl font-black uppercase tracking-[0.15em] text-[10px]">
                    Sold Out
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
              className="flex gap-3 mt-3 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible sm:flex-wrap hide-scrollbar"
            >
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setDirection(idx > activeImage ? 1 : -1); setActiveImage(idx); }} 
                  className={`shrink-0 aspect-[4/3] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative group ${activeImage === idx ? 'border-primary shadow-[0_4px_16px_rgba(245,160,0,0.3)] scale-105 z-10 ring-2 ring-primary/20' : 'border-transparent bg-slate-50 opacity-75 hover:opacity-100 hover:border-primary/40 hover:scale-[1.02]'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110" />
                </button>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Info & CTAs */}
          <div className="flex flex-col">
            <div className="flex flex-col">
              {/* Top Metadata Cluster */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="inline-flex items-center h-[30px] mb-4 bg-white border border-slate-200/80 rounded-[8px] shadow-[0_2px_10px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(0,0,0,0.04)] self-start"
              >
                <div className="flex items-center justify-center px-3 h-full text-[9px] font-black uppercase tracking-[0.15em] text-amber-700 bg-amber-50/50 rounded-l-[8px]">
                  {part.category}
                </div>
                <div className="h-[14px] w-px bg-slate-200" />
                <div className="flex items-center justify-center px-3 h-full text-[9px] font-black uppercase tracking-widest text-slate-800">
                  <span className="text-slate-400 mr-1.5 font-bold">REF:</span> {refNumber}
                </div>
                <div className="h-[14px] w-px bg-slate-200" />
                <div className="flex items-center justify-center gap-1.5 px-3 h-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <MapPin size={11} className="text-slate-400" /> {part.location || "India"}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="mb-3"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-[26px] lg:text-[38px] font-extrabold text-[#0F172A] leading-[1.1] tracking-[-0.03em] uppercase">{part.name}</h1>
                  {!isAskForPrice && (
                    <button onClick={() => setEnquiryOpen(true)} className="px-4 py-1.5 border-[1.5px] border-orange-500 text-orange-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-orange-50 transition-colors w-fit shadow-sm">Make an Offer</button>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
                whileHover={{ y: -4, boxShadow: "0 20px 48px -8px rgba(0,0,0,0.1), 0 2px 10px rgba(0,0,0,0.02)" }}
                className="bg-white border border-slate-200/60 rounded-[22px] p-4 lg:px-6 lg:py-4 shadow-[0_2px_12px_rgba(0,0,0,0.03),0_12px_32px_-8px_rgba(0,0,0,0.08)] mb-3 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-1000">
                  <AnimatedGear size={65} />
                </div>
                
                <div className="relative z-10">
                  {isAskForPrice ? (
                    <div className="flex flex-col pb-2">
                      <span className="industrial-label text-slate-400 mb-1.5 block">Premium Export Price</span>
                      <h2 className="text-[20px] lg:text-[24px] font-extrabold text-slate-800 tracking-[-0.5px] leading-tight">
                        Price Available Upon Request
                      </h2>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="industrial-label text-slate-400 mb-0.5">Premium Export Price</span>
                        <h2 className={`text-[28px] lg:text-[34px] font-black tracking-[-1.5px] leading-none transition-all duration-300 ${isSold ? "text-gray-300 line-through" : "price-cat"}`}>
                          {displayPrice}
                        </h2>
                      </div>
                      <CurrencyToggle />
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="grid grid-cols-2 gap-3 mb-5"
              >
                {specifications.map((spec, i) => {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
                      whileHover={{
                        y: -3,
                        boxShadow: "0 12px 28px -4px rgba(245, 158, 11, 0.15)",
                      }}
                      className="relative flex items-center gap-3 rounded-[18px] p-3.5 cursor-default group transition-all duration-300 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.02),0_1px_3px_rgba(15,23,42,0.03)] border border-slate-200/70 border-l-[3px] border-l-amber-400 hover:border-amber-300/80 hover:shadow-[0_2px_16px_rgba(245,158,11,0.08)]"
                    >
                      <div className="absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/60 pointer-events-none" />
                      <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-colors duration-300 bg-amber-50 group-hover:bg-amber-100">
                        <spec.icon
                          size={16}
                          className="transition-colors duration-300 text-amber-600"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8.5px] uppercase font-bold tracking-[0.2em] mb-1 leading-none text-slate-400/80">
                          {spec.label}
                        </span>
                        <span className="truncate leading-snug font-black text-[16px] text-slate-950 tracking-tight font-mono">
                          {spec.value}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="grid grid-cols-2 gap-3 mt-1"
              >
                <motion.button
                  whileHover={{ y: -4, boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 16px 36px rgba(245, 160, 0, 0.25)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  onClick={() => !isSold && setEnquiryOpen(true)}
                  disabled={isSold}
                  className={`h-[50px] px-6 flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 ${isSold ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "enquire-btn-animated text-white"}`}
                >
                  <MessageSquare size={16} className="shrink-0" /> {isSold ? "Part Sold" : (isAskForPrice ? 'Get Price' : "Enquire Now")}
                </motion.button>
                
                <motion.a 
                  href={`https://wa.me/918778868739?text=Hi, I am interested in ${part.name} (Ref: ${refNumber})`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  whileHover={{ y: -4, boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 16px 36px rgba(37, 211, 102, 0.25)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className={`group h-[50px] px-6 flex items-center justify-center gap-2.5 rounded-xl transition-all duration-300 font-black uppercase tracking-widest text-[11px] shadow-[0_2px_8px_rgba(37,211,102,0.08)] ${isSold ? "opacity-50 pointer-events-none bg-gray-100 text-gray-400" : "bg-gradient-to-b from-[#f2fbf5] to-[#e8f8ed] text-[#16a34a] border border-[#25D366]/40 hover:from-[#25D366] hover:to-[#1fa650] hover:text-white hover:border-[#1fa650]"}`}
                >
                  <div className={`flex items-center justify-center w-[26px] h-[26px] rounded-full transition-colors duration-300 shrink-0 shadow-sm ${isSold ? "bg-gray-200 text-gray-400" : "bg-[#25D366]/20 text-[#16a34a] group-hover:bg-white/25 group-hover:text-white"}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  WhatsApp
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="mt-12"
        >
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-[20px] lg:text-[24px] font-black text-[#0F172A] tracking-wider leading-none uppercase translate-y-[1px]">Technical Overview</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/40 to-transparent opacity-80" />
          </div>
          
          <div className="bg-white border border-slate-200/80 rounded-[16px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02),0_16px_48px_-12px_rgba(245,158,11,0.03)]">
            
            {/* Part Overview Box */}
            <div className="p-6 lg:p-8 border-b border-stone-200/60 bg-slate-50/40">
              <h3 className="text-[13px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-3 mb-3">
                <div className="w-1 h-3.5 rounded-full bg-amber-500" />
                Executive Summary
              </h3>
              <p className="text-slate-600 font-medium leading-[1.8] text-[15px] lg:w-[70%]">
                This {part.year} {part.brand} {part.model} has been thoroughly inspected and verified by our technical hub. It is in excellent operational condition, with all core hydraulic and engine components passing standard export stress tests. The unit is fully documented, cleaned, and structurally sound for immediate global deployment.
              </p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-wrap gap-2.5 mt-4"
              >
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-[6px] border border-stone-200 shadow-sm cursor-default hover:border-amber-300 transition-colors">
                   <ShieldCheck size={12} className="text-amber-500" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-stone-700">Export Certified</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-[6px] border border-stone-200 shadow-sm cursor-default hover:border-amber-300 transition-colors">
                   <CheckCircle2 size={12} className="text-green-500" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-stone-700">Inspection Passed</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-[6px] border border-stone-200 shadow-sm cursor-default hover:border-amber-300 transition-colors">
                   <Settings size={12} className="text-blue-500" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-stone-700">Operationally Verified</span>
                 </div>
              </motion.div>
            </div>

            {/* Technical Specs Grid */}
            <div className="p-6 lg:p-8">
               <h3 className="text-[13px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-3 mb-4">
                <Settings size={16} className="text-slate-400" />
                Technical Specifications
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                {[
                  { label: "Part Name", value: part.name },
                  { label: "Brand", value: part.brand },
                  { label: "Machine Type", value: part.machine_type || "N/A" },
                  { label: "Model Number", value: part.model || "Universal" },
                  { label: "Part Number", value: part.part_number },
                  { label: "Category", value: part.category },
                  { label: "Condition", value: part.condition || "New" },
                  { label: "Availability", value: isSold ? "Sold Out" : "Available" }
                ].map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    key={idx} 
                    className="flex justify-between items-center border-b border-stone-200/60 py-3 group hover:bg-amber-50/20 border-l-2 border-l-transparent hover:border-l-amber-400 transition-all px-3 -mx-3"
                  >
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-400/90 group-hover:text-amber-700 transition-colors">{item.label}</span>
                    <span className="text-[14px] font-bold text-slate-900 tracking-tight">{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Compatible Machines */}
            {(part.compatible_machines && part.compatible_machines.length > 0) && (
              <div className="p-6 lg:p-8 border-t border-stone-200/60 bg-white">
                <h3 className="text-[13px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-3 mb-4">
                  <Wrench size={16} className="text-slate-400" />
                  Compatible Machines
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(part.compatible_machines) ? part.compatible_machines.map((cm, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold tracking-wide border border-slate-200">
                      {cm}
                    </span>
                  )) : (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold tracking-wide border border-slate-200">
                      {part.compatible_machines}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        </motion.div>


      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX;
              if (Math.abs(dx) > 50) { if (dx < 0) lightboxNext(); else lightboxPrev(); }
              setTouchStartX(null);
            }}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur border border-white/20 text-white text-[12px] font-bold px-4 py-2 rounded-full">
                {lightboxIndex + 1} / {images.length}
              </div>
            )}

            {/* Prev arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main lightbox image */}
            <motion.img
              key={lightboxIndex}
              src={images[lightboxIndex]}
              alt={part.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {/* Next arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                    className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === lightboxIndex ? 'border-primary scale-110 shadow-lg' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <EnquiryModal 
        open={enquiryOpen} 
        onClose={() => setEnquiryOpen(false)} 
        partName={part.name} 
        part={part} 
      />

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex gap-3">
        <a 
          href={`https://wa.me/918778868739?text=Hi, I am interested in ${part.name}`} 
          className="flex-1 h-12 bg-[#1fa855] text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[11px] tracking-wider"
        >
          <Phone size={16} /> WhatsApp
        </a>
        <button 
          onClick={() => !isSold && setEnquiryOpen(true)}
          className="flex-1 h-12 bg-primary text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[11px] tracking-wider shadow-lg shadow-primary/20"
        >
          <MessageSquare size={16} /> {part?.pricing_mode === 'Ask For Price' || !part?.price ? 'Get Price' : 'Enquire'}
        </button>
      </div>
    </div>
  );
};

export default PartDetail;
