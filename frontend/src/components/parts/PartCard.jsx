import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Settings, Cpu } from 'lucide-react';
import ProductCarousel from '../products/ProductCarousel';
import { cleanPrice } from '@/utils/priceFormatter';
import { useCurrency } from '@/context/CurrencyContext';
import '@/styles/cards.css';

const itemVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const normalizeCardAvailability = (value) => {
  const v = (value ?? "").toString().trim().toLowerCase();
  if (v === "sold") return "sold";
  if (v === "coming_soon" || v === "coming soon") return "coming_soon";
  return "in_stock";
};

const PartCard = React.memo(({ part, setSelectedPart, setEnquiryOpen }) => {
  const navigate = useNavigate();
  const status = normalizeCardAvailability(part.availability);
  const isSold = status === "sold";
  const isComingSoon = status === "coming_soon";
  const isInStock = status === "in_stock";
  
  const refNumber = part.reference_number || part.reference_no || `PART-000`;
  const { formatPrice } = useCurrency();
  const priceStr = cleanPrice(part.price);
  const sourceCurrency = part.currency || 'USD';

  // Extract number for formatPrice (removing non-digits except decimals)
  const numericValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  const displayPrice = formatPrice(numericValue, sourceCurrency);
  const isAskForPrice = part.pricing_mode === 'Ask For Price' || numericValue === 0;

  const handleCardClick = (e) => {
    // Only navigate if it wasn't a click on the Enquiry button or Carousel arrows
    if (e.target.closest('button')) return;
    navigate(`/part/${part.id}`);
  };

  return (
    <motion.div
      variants={itemVariant}
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
      onClick={isSold ? undefined : handleCardClick}
      className={`relative bg-white rounded-[22px] overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group flex flex-col h-full ${isSold ? "opacity-90" : "hover:shadow-premium hover:-translate-y-2 hover:ring-1 hover:ring-primary/20"}`}
    >
      {/* 1. Image Section */}
      <div className="relative h-[160px] overflow-hidden shrink-0">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]">
          <ProductCarousel 
            images={part.images} image={part.image_url || part.image} photo={part.image_url}
            isSold={isSold} name={part.name} id={part.id} updatedAt={part.updatedAt}
          />
        </div>

        {/* Unified Status Badges */}
        <div className="absolute top-3 right-3 z-20">
          {isInStock && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white font-black text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full shadow-md border border-green-400/20">
              In Stock
            </div>
          )}
          {isComingSoon && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full shadow-md border border-orange-400/20">
              Coming Soon
            </div>
          )}
          {isSold && (
            <div className="bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full shadow-md border border-red-400/20">
              SOLD
            </div>
          )}
        </div>

        {/* Overlays */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-900/20 backdrop-grayscale-[0.8] z-10 pointer-events-none" />
        )}
        {isComingSoon && (
          <div className="absolute inset-0 bg-slate-900/10 z-10 pointer-events-none" />
        )}
      </div>
      
      {/* 2. Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{part.brand || 'Premium'}</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">#{refNumber}</span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <Link to={`/part/${part.id}`} className="flex-1">
              <h3 className="text-lg font-display font-[800] tracking-[-0.3px] text-[#0F172A] leading-tight group-hover:text-primary transition-colors line-clamp-2 uppercase">
                {part.name}
              </h3>
            </Link>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mt-1">{part.part_number}</div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-lg shrink-0">
              <Settings size={12} className="text-slate-400" />
            </div>
            <span className="industrial-value text-[12px] truncate">{part.machine_type || 'Universal'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-lg shrink-0">
              <Cpu size={12} className="text-slate-400" />
            </div>
            <span className="industrial-value text-[12px] truncate">{part.category || 'General'}</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="pt-3 border-t border-slate-50 flex items-end justify-between mb-3">
            <div style={{ flex: 1 }}>
              <span className="industrial-label mb-0.5 block">Price</span>
              {isAskForPrice ? (
                <div className="mt-1 flex items-center">
                  <div className="inline-flex items-center bg-amber-50 text-amber-800 text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full border-2 border-amber-300 shadow-sm">
                    Available On Request
                  </div>
                </div>
              ) : (
                <div className={`font-display font-[800] flex items-baseline gap-1 ${isSold ? 'text-slate-400 line-through decoration-2 decoration-slate-300' : 'price-cat'} text-2xl`}>
                  {displayPrice}
                </div>
              )}
            </div>
            <div className="text-[10px] font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg uppercase ml-2">
              {part.condition || 'New'}
            </div>
          </div>
          
          {/* Actions */}
          {isSold ? (
            <div className="grid grid-cols-2 gap-2">
              <button disabled className="flex items-center justify-center h-[38px] rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-widest cursor-not-allowed opacity-60">
                Details
              </button>
              <button disabled className="flex items-center justify-center gap-2 h-[38px] rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-widest cursor-not-allowed opacity-60">
                <MessageCircle size={14} />
                {isAskForPrice ? 'Get Price' : 'Enquire'}
              </button>
            </div>
          ) : isComingSoon ? (
            <div className="grid grid-cols-2 gap-2">
              <Link 
                to={`/part/${part.id}`}
                className="flex items-center justify-center h-[38px] rounded-xl border-2 border-[#0F172A] text-[#0F172A] font-bold text-[11px] uppercase tracking-widest hover:bg-[#0F172A] hover:text-white transition-all"
              >
                Details
              </Link>
              <button disabled className="flex items-center justify-center gap-2 h-[38px] rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-widest cursor-not-allowed opacity-60">
                <MessageCircle size={14} />
                {isAskForPrice ? 'Get Price' : 'Enquire'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link 
                to={`/part/${part.id}`}
                className="flex items-center justify-center h-[38px] rounded-xl border-2 border-[#0F172A] text-[#0F172A] font-bold text-[11px] uppercase tracking-widest hover:bg-[#0F172A] hover:text-white transition-all"
              >
                Details
              </Link>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPart(part); setEnquiryOpen(true); }}
                className="flex items-center justify-center gap-2 h-[38px] rounded-xl bg-primary text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                <MessageCircle size={14} />
                {isAskForPrice ? 'Get Price' : 'Enquire'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
PartCard.displayName = "PartCard";

export default PartCard;
