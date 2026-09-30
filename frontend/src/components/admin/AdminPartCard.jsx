import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Clock, MapPin, ChevronDown, CheckCircle, AlertCircle, Edit3, Archive, Eye, Copy, RefreshCw, Tag, Wrench, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import ProductCarousel from '../products/ProductCarousel';
import { cleanPrice } from '@/utils/priceFormatter';
import { useCurrency } from '@/context/CurrencyContext';
import partService from '@/services/partService';

import { usePartStore } from '@/store/usePartStore';
import '@/styles/cards.css';

const itemVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } }
};

/* ── Status config ── */
const STATUS_CFG = {
  in_stock:    { label: "In Stock",    color: "#16a34a", icon: "🟢", bg: "linear-gradient(135deg,#22c55e,#16a34a)", shadow: "rgba(34,197,94,0.40)", pulse: true  },
  coming_soon: { label: "Coming Soon", color: "#ea580c", icon: "🟠", bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,0.35)", pulse: false },
  sold:        { label: "Sold",        color: "#dc2626", icon: "🔴", bg: "linear-gradient(135deg,#ef4444,#b91c1c)", shadow: "rgba(239,68,68,0.35)",   pulse: false },
};

/* ── Image Status Badge (on card image) ── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.in_stock;
  return (
    <div style={{
      position: "absolute", top: 10, left: 10,
      padding: "5px 11px", borderRadius: 999,
      background: cfg.bg, boxShadow: `0 4px 14px ${cfg.shadow}`,
      display: "flex", alignItems: "center", gap: 5, zIndex: 10,
    }}>
      <span style={{ fontSize: 9 }}>{cfg.icon}</span>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {cfg.label}
      </span>
      {cfg.pulse && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.85)", animation: "badge-pulse 1.8s ease-in-out infinite", display: "inline-block" }} />}
    </div>
  );
};

/* ── Minimal text-only Status Selector ── */
const StatusSelector = ({ partId, current }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { optimisticUpdate } = usePartStore();
  const cfg = STATUS_CFG[current] || STATUS_CFG.in_stock;
  const options = Object.entries(STATUS_CFG).map(([value, c]) => ({ value, ...c }));

  const handleSelect = async (value) => {
    setOpen(false);
    if (value === current) return;
    setLoading(true);
    try {
      const updated = await partService.update(partId, { availability: value, updated_at: new Date().toISOString() });
      if (updated?.id) optimisticUpdate(updated);
      toast.success(`Status → ${STATUS_CFG[value]?.label}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", gridColumn: "1 / -1" }} onClick={e => e.stopPropagation()}>
      {/* Trigger — text only, no background */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", height: 28,
          background: "transparent", border: "none", borderTop: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700,
          color: loading ? "#94A3B8" : cfg.color,
          cursor: "pointer", letterSpacing: "0.01em",
          transition: "opacity 0.15s",
          paddingTop: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {loading ? "Updating…" : cfg.label}
        <ChevronDown size={10} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", color: cfg.color }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
              background: "#fff", borderRadius: 10,
              boxShadow: "0 12px 32px rgba(15,23,42,0.14)", border: "1px solid #EEF1F5",
              overflow: "hidden", zIndex: 200,
            }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: "100%", padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: 7,
                  fontFamily: "'Inter',sans-serif", fontSize: 12,
                  fontWeight: current === opt.value ? 800 : 500,
                  color: current === opt.value ? opt.color : "#374151",
                  background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 11 }}>{opt.icon}</span>
                {opt.label}
                {current === opt.value && <CheckCircle size={10} style={{ marginLeft: "auto", color: opt.color }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Delete Confirmation Modal ── */
const DeleteModal = ({ partName, onConfirm, onCancel }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", maxWidth: 380, width: "100%", boxShadow: "0 32px 80px rgba(15,23,42,0.18)", textAlign: "center" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertCircle size={24} style={{ color: "#EF4444" }} />
        </div>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Delete Part?</h3>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#64748B", margin: "0 0 6px" }}>
          <strong style={{ color: "#374151" }}>{partName}</strong>
        </p>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#94A3B8", margin: "0 0 24px" }}>
          This action cannot be undone. All associated images will be permanently removed.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 42, borderRadius: 12, border: "1px solid #E2E8F0", background: "#F8FAFC", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 42, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#EF4444,#B91C1C)", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 6px 18px rgba(239,68,68,0.30)" }}>Delete</button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

/* ── Relative time ── */
function relativeTime(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── Main AdminPartCard ── */
const AdminPartCard = React.memo(({ part, handleDelete, isSelected, onSelect, onHover }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const isSold = part.availability === "sold";
  const refNumber = part.reference_number || part.reference_no || "EXC-000";
  const { formatPrice } = useCurrency();
  const priceStr = cleanPrice(part.price);
  const sourceCurrency = part.currency || 'USD';
  const numericValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  const displayPrice = formatPrice(numericValue, sourceCurrency);
  const isAskForPrice = part.pricing_mode === 'Ask For Price' || numericValue === 0;
  const statusRaw = part.availability || "in_stock";
  const updatedLabel = relativeTime(part.updatedAt || part.updated_at);

  const handleCardClick = () => navigate(`/admin/edit-part/${part.id}`);
  const stopProp = e => e.stopPropagation();

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    if (handleDelete) {
        await handleDelete(part.id);
    } else {
        try {
            await partService.delete(part.id);
            toast.success("Part deleted");
        } catch {
            toast.error("Failed to delete part");
        }
    }
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setIsDuplicating(true);
    const toastId = toast.loading("Duplicating...");
    try {
      await partService.duplicate(part.id);
      toast.success("Part duplicated successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to duplicate part", { id: toastId });
    } finally {
      setIsDuplicating(false);
    }
  };

  const images = Array.isArray(part.images) && part.images.length > 0
    ? part.images : (part.image ? [part.image] : []);

  return (
    <>
      {showDeleteModal && (
        <DeleteModal partName={part.name} onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
      )}

      <motion.div
        variants={itemVariant} layout
        className={`product-card group ${isSold ? "card-sold-state" : ""}`}
        onClick={handleCardClick}
        onMouseEnter={() => onHover?.(part)}
        onMouseLeave={() => onHover?.(null)}
        style={{ cursor: "pointer", position: "relative" }}
        whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(15,23,42,0.10)" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Bulk checkbox */}
        {onSelect && (
          <div
            onClick={e => { e.stopPropagation(); onSelect(part.id); }}
            style={{
              position: "absolute", top: 8, right: 8, zIndex: 20,
              width: 20, height: 20, borderRadius: 5,
              border: isSelected ? "none" : "2px solid rgba(255,255,255,0.7)",
              background: isSelected ? "#F5B301" : "rgba(255,255,255,0.20)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", cursor: "pointer",
            }}
          >
            {isSelected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
        )}

        {/* Image */}
        <div className="product-card-image-section" onClick={stopProp} style={{ position: "relative" }}>
          <div className={isSold ? "img-sold-overlay" : ""}>
            <ProductCarousel images={images} productName={part.name} />
          </div>
          <StatusBadge status={statusRaw} />
          
          {/* Condition Badge (Top Right) */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
            padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800,
            fontFamily: "'Inter',sans-serif", color: "#1E293B", textTransform: "uppercase",
            letterSpacing: "0.05em", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", zIndex: 10
          }}>
            {part.condition || "New"}
          </div>

          {isSold && (
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.72)", backdropFilter: "blur(4px)", borderRadius: 999, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5, zIndex: 10 }}>
              <Archive size={10} style={{ color: "#94A3B8" }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Archived Sale</span>
            </div>
          )}

          {/* Quick Actions (Bottom Right) */}
          <div className="absolute bottom-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/part/${part.id}`); }}
              style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              title="View Public Page"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              title="Duplicate Part"
            >
              {isDuplicating ? <RefreshCw size={12} className="animate-spin" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="product-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <h3 className={`product-card-name ${isSold ? "text-slate-400" : ""}`}>{part.name}</h3>
            {part.machine_type && (
              <div style={{
                padding: "4px 10px", 
                border: "1.5px solid #f97316", 
                color: "#ea580c", 
                borderRadius: "8px", 
                fontSize: "10px", 
                fontWeight: "bold", 
                letterSpacing: "0.05em", 
                backgroundColor: "#fff",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
                flexShrink: 0,
                textTransform: "uppercase"
              }}>
                {part.machine_type}
              </div>
            )}
          </div>

          <div className="product-card-specs">
            {part.brand && <span className="flex items-center gap-1"><Tag size={11} />{part.brand}</span>}
            {part.brand && part.category && <span className="separator">•</span>}
            {part.category && <span className="flex items-center gap-1"><LayoutGrid size={11} />{part.category}</span>}
          </div>

          {/* Price + Ref */}
          <div className="product-card-middle-section">
            <div>
              <div className="product-card-label">PART PRICE</div>
              {isAskForPrice ? (
                <div className="mt-1 flex items-center">
                  <div className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-200">
                    Available On Request
                  </div>
                </div>
              ) : (
                <div className={`product-card-price ${isSold ? "price-strikethrough" : ""}`}>{displayPrice}</div>
              )}
            </div>
            <div>
              <div className="product-card-ref-badge">
                <span className="product-card-ref-label">REF:</span>
                {refNumber}
              </div>
              {updatedLabel && (
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "#CBD5E1", textAlign: "right", marginTop: 3, fontWeight: 600 }}>
                  ↻ {updatedLabel}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons + minimal status */}
          <div className="admin-card-buttons" onClick={stopProp}>
            <button onClick={() => navigate(`/admin/edit-part/${part.id}`)} className="admin-btn admin-btn-edit" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Edit3 size={11} /> Edit
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="admin-btn admin-btn-delete" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={11} /> Delete
            </button>
            <StatusSelector partId={part.id} current={statusRaw} />
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes badge-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.75); } }
      `}</style>
    </>
  );
});

AdminPartCard.displayName = "AdminPartCard";

export default AdminPartCard;
