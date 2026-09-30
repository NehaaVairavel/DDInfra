import { useState, useMemo, useCallback } from "react";
import { socket } from "@/socket";
import { Link } from "react-router-dom";
import partService from "@/services/partService";
import {
  Search, Plus, Trash2, LayoutGrid, List, SlidersHorizontal, X, CheckSquare,
  Edit, Image as ImageIcon, GripVertical, ArrowUpDown, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";
import { usePartStore } from "@/store/usePartStore";
import { PARTS_CATEGORIES } from "@/constants/categories";
import AdminPartCard from "@/components/admin/AdminPartCard";
import { cleanPrice } from "@/utils/priceFormatter";
import { motion, AnimatePresence } from "framer-motion";
import "@/styles/admin.css";
import "@/styles/cards.css";

// dnd-kit — already installed (used in AdminHeroMedia)
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Human-readable labels for status filter chips
const STATUS_LABELS = {
  in_stock: "In Stock",
  coming_soon: "Coming Soon",
  sold: "Sold",
};

// ─── Sortable Row Component (Reorder Tab) ────────────────────────────────────
const SortablePartRow = ({ part, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : "auto",
    position: "relative",
  };

  const statusColors = {
    in_stock: { bg: "#ECFDF5", text: "#16a34a", label: "In Stock" },
    coming_soon: { bg: "#FFFBEB", text: "#D97706", label: "Coming Soon" },
    sold: { bg: "#FEF2F2", text: "#DC2626", label: "Sold" },
  };
  const statusCfg = statusColors[part.availability] || statusColors.in_stock;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-[16px] p-[12px] pr-[16px] flex items-center gap-3 transition-all duration-150 border-2 ${
        isDragging
          ? "shadow-2xl scale-[1.02] border-[#F5B301] ring-4 ring-[#F5B301]/20"
          : "border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0"
        title="Drag to reorder"
      >
        <GripVertical size={20} />
      </div>

      {/* Position badge */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: isDragging ? "#FEF9EC" : "#F8FAFC",
          border: `1.5px solid ${isDragging ? "#F5B301" : "#E5E7EB"}`,
        }}
      >
        <span
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 800,
            fontSize: 12,
            color: isDragging ? "#D97706" : "#64748B",
          }}
        >
          {index + 1}
        </span>
      </div>

      {/* Thumbnail */}
      <div
        className="w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200"
        style={{ minWidth: 56 }}
      >
        {part.image ? (
          <img
            src={part.image}
            alt={part.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon size={14} />
          </div>
        )}
      </div>

      {/* Name + brand */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#111827",
            margin: 0,
          }}
        >
          {part.name}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: "#94A3B8",
            margin: "2px 0 0",
          }}
        >
          {[part.brand, part.model].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Category */}
      <div className="hidden md:block flex-shrink-0" style={{ width: 120 }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: "#64748B",
          }}
        >
          {part.category}
        </span>
      </div>

      {/* Ref number */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: 90 }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "#94A3B8",
            background: "#F8FAFC",
            padding: "2px 8px",
            borderRadius: 6,
            border: "1px solid #E5E7EB",
          }}
        >
          {part.reference_number || part.reference_no || "—"}
        </span>
      </div>

      {/* Status pill */}
      <div className="flex-shrink-0">
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            fontWeight: 800,
            color: statusCfg.text,
            background: statusCfg.bg,
            padding: "3px 10px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {statusCfg.label}
        </span>
      </div>
    </div>
  );
};


// ─── Main AdminParts Component ─────────────────────────────────────────────
const AdminParts = () => {
  const { parts, loading, error, optimisticDelete, optimisticUpdate, reorderParts } =
    usePartStore();

  // Active tab: "manage" or "reorder"
  const [activeTab, setActiveTab] = useState("manage");

  // ── Manage tab state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [hoveredPart, setHoveredPart] = useState(null);
  const [tableDeleteId, setTableDeleteId] = useState(null);
  const { formatPrice, currency, setCurrency, currencies, convertAll, rates } = useCurrency();

  // ── Reorder tab state ─────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);

  // dnd-kit sensors — 5px drag distance to avoid blocking button clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Manage tab: filtered parts ─────────────────────────────────────────
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesSearch =
        (part.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (part.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (part.model || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || part.category === activeCategory;
      const matchesStatus =
        activeStatus === "All" || part.availability === activeStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, activeCategory, activeStatus, parts]);

  // ── Reorder tab: parts sorted by display_order ─────────────────────────
  // This is the definitive ordering — all parts, no filters
  const sortedForReorder = useMemo(() => {
    return [...parts].sort((a, b) => {
      const aOrder = a.display_order ?? 999999;
      const bOrder = b.display_order ?? 999999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Tiebreaker: newer parts first (same as backend default)
      return (b.id || "").localeCompare(a.id || "");
    });
  }, [parts]);

  // ── Manage tab handlers ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await partService.delete(id);
      optimisticDelete(id);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success("Part deleted successfully");
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      console.error("[Delete] Error:", status, msg, error);
      if (status === 404) {
        optimisticDelete(id);
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        toast.info("Part removed from cache (already deleted from server).");
      } else {
        toast.error(
          status === 401
            ? "Session expired — please log out and log back in."
            : `Failed to delete part (${status || "network error"}): ${msg}`
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map((id) => partService.delete(id)));
      ids.forEach((id) => optimisticDelete(id));
      setSelectedIds(new Set());
      toast.success(`${ids.length} part${ids.length > 1 ? "s" : ""} deleted`);
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const handleBulkMarkSold = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    try {
      const updatedParts = await Promise.all(
        ids.map((id) => partService.update(id, { availability: "sold" }))
      );
      updatedParts.forEach((p) => { if (p) optimisticUpdate(p); });
      setSelectedIds(new Set());
      toast.success(`${ids.length} part${ids.length > 1 ? "s" : ""} marked as sold`);
    } catch {
      toast.error("Bulk update failed");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredParts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParts.map((p) => p.id)));
    }
  };

  // ── Reorder tab: drag end handler ─────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedForReorder.findIndex((p) => p.id === active.id);
      const newIndex = sortedForReorder.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Build new ordered array
      const newOrder = arrayMove(sortedForReorder, oldIndex, newIndex);

      // Assign display_order = index for each part
      const reordered = newOrder.map((p, idx) => ({ ...p, display_order: idx }));

      // 1. Optimistic UI — instant feedback
      reorderParts(reordered);

      // 2. Persist to backend
      setIsSaving(true);
      try {
        await partService.reorder(
          reordered.map((p) => ({ id: p.id, display_order: p.display_order }))
        );
        toast.success("✓ Part order updated successfully", { duration: 2500 });
      } catch (err) {
        console.error("[Reorder] Error:", err);
        toast.error("Failed to save order — please try again");
        // Revert optimistic update on failure
        reorderParts(sortedForReorder);
      } finally {
        setIsSaving(false);
      }
    },
    [sortedForReorder, reorderParts]
  );

  const categories = ["All", ...PARTS_CATEGORIES];

  if (loading)
    return (
      <div className="admin-loading">
        <span>Loading Fleet...</span>
      </div>
    );

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Parts Management</h1>
        </div>
        <Link to="/admin/add-part" className="btn-primary" style={{ textDecoration: "none" }}>
          <Plus size={17} />
          Add New Part
        </Link>
      </div>

      {/* ── Tab Bar ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#F1F3F7",
          borderRadius: 14,
          padding: 4,
          marginBottom: 20,
          width: "fit-content",
        }}
      >
        <button
          onClick={() => setActiveTab("manage")}
          style={{
            height: 36,
            padding: "0 18px",
            borderRadius: 10,
            border: "none",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: activeTab === "manage" ? "#fff" : "transparent",
            color: activeTab === "manage" ? "#111827" : "#94A3B8",
            boxShadow: activeTab === "manage" ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
            transition: "all 0.15s",
          }}
        >
          <LayoutGrid size={14} />
          Manage Parts
        </button>
        <button
          onClick={() => setActiveTab("reorder")}
          style={{
            height: 36,
            padding: "0 18px",
            borderRadius: 10,
            border: "none",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: activeTab === "reorder" ? "#fff" : "transparent",
            color: activeTab === "reorder" ? "#111827" : "#94A3B8",
            boxShadow: activeTab === "reorder" ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
            transition: "all 0.15s",
          }}
        >
          <ArrowUpDown size={14} />
          Reorder
          <span
            style={{
              background: activeTab === "reorder" ? "#FEF9EC" : "#F1F3F7",
              color: activeTab === "reorder" ? "#D97706" : "#94A3B8",
              border: `1px solid ${activeTab === "reorder" ? "#FDE68A" : "transparent"}`,
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 7px",
            }}
          >
            {parts.length}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════
          MANAGE TAB (existing view)
          ════════════════════════════════ */}
      {activeTab === "manage" && (
        <>
          {/* ── Filter Bar ── */}
          <div
            className="admin-filter-bar mb-4"
            style={{ backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
          >
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "240px", maxWidth: "360px" }}>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2"
                size={15}
                style={{ color: "#94A3B8" }}
              />
              <input
                type="text"
                placeholder="Search by name or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input"
                style={{ paddingLeft: "40px" }}
              />
            </div>

            <div className="hidden xl:block w-px h-8" style={{ background: "#EAECEF" }} />

            {/* Filters */}
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={15} style={{ color: "#94A3B8" }} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
                  color: "#374151", background: "transparent", border: "none",
                  outline: "none", cursor: "pointer",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="w-px h-5" style={{ background: "#EAECEF" }} />

              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
                  color: "#374151", background: "transparent", border: "none",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="All">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Currency toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F1F3F7", borderRadius: 10, padding: 3 }}>
              {["USD", "AED", "EUR", "INR"].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    const found = (currencies || []).find((c) => c.code === code);
                    if (found) setCurrency(found);
                  }}
                  style={{
                    height: 28, padding: "0 10px", borderRadius: 7, border: "none",
                    fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700,
                    background: currency?.code === code ? "#fff" : "transparent",
                    color: currency?.code === code ? "#111827" : "#94A3B8",
                    boxShadow: currency?.code === code ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="w-px h-7" style={{ background: "#EAECEF" }} />

            {/* View toggle */}
            <div style={{ marginLeft: "auto" }}>
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                >
                  <LayoutGrid size={15} /><span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                >
                  <List size={15} /><span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Filter Chips ── */}
          <div className="flex flex-wrap gap-2 mb-6">
            {activeCategory !== "All" && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <span>Category: {activeCategory}</span>
                <button onClick={() => setActiveCategory("All")} className="hover:text-red-500 ml-1">
                  <X size={12} />
                </button>
              </div>
            )}
            {activeStatus !== "All" && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <span>Status: {STATUS_LABELS[activeStatus] || activeStatus}</span>
                <button onClick={() => setActiveStatus("All")} className="hover:text-red-500 ml-1">
                  <X size={12} />
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <span>Search: "{searchQuery}"</span>
                <button onClick={() => setSearchQuery("")} className="hover:text-red-500 ml-1">
                  <X size={12} />
                </button>
              </div>
            )}
            {(activeCategory !== "All" || activeStatus !== "All" || searchQuery) && (
              <button
                onClick={() => { setActiveCategory("All"); setActiveStatus("All"); setSearchQuery(""); }}
                className="text-xs font-semibold text-amber-500 hover:text-amber-600 px-2 underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* ── Bulk Action Bar ── */}
          {selectedIds.size > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#111827", borderRadius: 14, padding: "10px 16px",
              marginBottom: 16, animation: "fadeIn 0.2s ease",
            }}>
              <CheckSquare size={16} style={{ color: "#F5B301" }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {selectedIds.size} selected
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button
                  onClick={handleBulkMarkSold}
                  style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "none", background: "#22C55E", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Mark Sold
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Delete All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  style={{ height: 32, width: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── Select All row ── */}
          {viewMode === "grid" && filteredParts.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={toggleSelectAll}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#64748B", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid #CBD5E1", background: selectedIds.size === filteredParts.length ? "#F5B301" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedIds.size === filteredParts.length && (
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                {selectedIds.size === filteredParts.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8" }}>
                {filteredParts.length} part{filteredParts.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center">
              {filteredParts.map((part) => (
                <AdminPartCard
                  key={part.id}
                  part={part}
                  handleDelete={handleDelete}
                  isSelected={selectedIds.has(part.id)}
                  onSelect={toggleSelect}
                  onHover={setHoveredPart}
                />
              ))}
            </div>
          )}

          {/* ── Quick Preview Panel ── */}
          <AnimatePresence>
            {hoveredPart && (
              <motion.div
                key={hoveredPart.id}
                initial={{ opacity: 0, x: 20, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "fixed", right: 24, bottom: 24, zIndex: 1000,
                  width: 280, background: "#fff",
                  borderRadius: 20, border: "1px solid #EEF1F5",
                  boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredPart(hoveredPart)}
                onMouseLeave={() => setHoveredPart(null)}
              >
                <div style={{ height: 150, background: "#F1F5F9", position: "relative", overflow: "hidden" }}>
                  {(hoveredPart.images?.[0] || hoveredPart.image) ? (
                    <img
                      src={hoveredPart.images?.[0] || hoveredPart.image}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: hoveredPart.availability === "sold" ? "grayscale(50%)" : "none" }}
                    />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#CBD5E1" }}>
                      <span style={{ fontSize: 36 }}>📷</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(to bottom, rgba(15,23,42,0.55), transparent)", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>👁 Quick Preview</span>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{hoveredPart.reference_number || hoveredPart.reference_no || "EXC-000"}</span>
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>
                    {hoveredPart.brand} · {hoveredPart.category}
                  </p>
                  <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 6px", lineHeight: 1.2 }}>
                    {hoveredPart.name}
                  </h4>
                  {hoveredPart.full_description && (
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {hoveredPart.full_description}
                    </p>
                  )}
                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: hoveredPart.availability === "sold" ? "#94A3B8" : "#F5B301", textDecoration: hoveredPart.availability === "sold" ? "line-through" : "none" }}>
                        {formatPrice(parseFloat(cleanPrice(hoveredPart.price).replace(/[^0-9.]/g, "")) || 0, hoveredPart.currency || "USD")}
                      </span>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>export</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Table View ── */}
          {viewMode === "table" && filteredParts.length > 0 && (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="admin-table" style={{ minWidth: "700px" }}>
                  <thead>
                    <tr>
                      <th className="admin-table-header text-left">Part</th>
                      <th className="admin-table-header text-left">Category</th>
                      <th className="admin-table-header text-left">Status</th>
                      <th className="admin-table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => (
                      <tr key={part.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#F1F3F7", overflow: "hidden", flexShrink: 0 }}>
                              {part.image ? (
                                <img src={part.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ color: "#CBD5E1" }}>
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: "#111827" }}>{part.name}</div>
                              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#94A3B8" }}>{part.brand} · {part.model}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "#374151" }}>{part.category}</span>
                        </td>
                        <td>
                          {(() => {
                            const status = part.availability || "in_stock";
                            const label = status === "in_stock" ? "In Stock" : status === "coming_soon" ? "Coming Soon" : "Sold";
                            const cssClass = `status-pill status-pill-${status.replace("_", "-")}`;
                            return <span className={cssClass}>{label}</span>;
                          })()}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/edit-part/${part.id}`} className="admin-btn-edit" style={{ textDecoration: "none" }}>
                              <Edit size={13} /> Edit
                            </Link>
                            {tableDeleteId === part.id ? (
                              <div className="flex items-center gap-2">
                                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#64748B", fontWeight: 600 }}>Confirm?</span>
                                <button onClick={() => { setTableDeleteId(null); handleDelete(part.id); }} className="admin-btn-delete" style={{ padding: "0 10px" }}>Yes</button>
                                <button onClick={() => setTableDeleteId(null)} style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer" }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setTableDeleteId(part.id)} className="admin-btn-delete">
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {filteredParts.length === 0 && (
            <div className="admin-card flex flex-col items-center justify-center text-center" style={{ minHeight: "360px", borderRadius: "24px", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {searchQuery || activeCategory !== "All" || activeStatus !== "All" ? "🔍" : "📦"}
              </div>
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                {searchQuery || activeCategory !== "All" || activeStatus !== "All" ? "No results found" : "Your inventory is empty"}
              </p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: "#64748B", marginBottom: 20, maxWidth: 320 }}>
                {searchQuery || activeCategory !== "All" || activeStatus !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first part to start building your global inventory."}
              </p>
              {(activeCategory !== "All" || activeStatus !== "All" || searchQuery) && (
                <button
                  onClick={() => { setActiveCategory("All"); setActiveStatus("All"); setSearchQuery(""); }}
                  style={{ height: 36, padding: "0 18px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer", marginBottom: 10 }}
                >
                  Clear all filters
                </button>
              )}
              {!searchQuery && activeCategory === "All" && activeStatus === "All" && (
                <Link to="/admin/add-part" className="btn-primary" style={{ textDecoration: "none" }}>
                  <Plus size={16} /> Add First Part
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════
          REORDER TAB
          ════════════════════════════════ */}
      {activeTab === "reorder" && (
        <div>
          {/* Info banner */}
          <div
            className="rounded-xl px-5 py-3 mb-5 flex items-center gap-3"
            style={{ background: "#FEF9EC", border: "1px solid #FDE68A" }}
          >
            <Info size={16} style={{ color: "#D97706", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#92400E", margin: 0 }}>
              <strong>Drag to reorder.</strong> The homepage and Parts page will show parts in this order. Changes save automatically — no refresh needed.
            </p>
            {isSaving && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#D97706",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5B301", display: "inline-block", animation: "badge-pulse 1s ease-in-out infinite" }} />
                Saving…
              </span>
            )}
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 28px 56px 1fr 120px 90px 80px",
              gap: 12,
              padding: "0 16px 8px",
              borderBottom: "1px solid #F1F5F9",
              marginBottom: 8,
            }}
            className="hidden md:grid"
          >
            {["", "#", "", "Part", "Category", "Ref No", "Status"].map((h, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Draggable list */}
          {sortedForReorder.length === 0 ? (
            <div className="admin-card text-center py-16">
              <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#111827" }}>No parts yet</p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#64748B", marginTop: 4 }}>Add parts first, then come back here to set their display order.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedForReorder.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {sortedForReorder.map((part, index) => (
                    <SortablePartRow
                      key={part.id}
                      part={part}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Bottom hint */}
          {sortedForReorder.length > 0 && (
            <p
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 11,
                color: "#CBD5E1",
                textAlign: "center",
                marginTop: 20,
                fontWeight: 600,
              }}
            >
              {sortedForReorder.length} parts · Drag the ⠿ handle to change order
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
};

export default AdminParts;
