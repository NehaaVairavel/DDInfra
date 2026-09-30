import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RotateCcw, ChevronDown, LayoutGrid, Tag, X,
  ChevronLeft, ChevronRight, Package, Wrench, Settings,
  ArrowRight, MessageCircle, Cpu, Check, SlidersHorizontal
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import settingsService from "@/services/settingsService";
import SectionReveal from "@/components/SectionReveal";
import EnquiryModal from "@/components/EnquiryModal";
import {
  PARTS_BRANDS_BY_TYPE,
  PARTS_MODELS_BY_BRAND,
  PARTS_CATEGORIES,
  PARTS_MACHINE_TYPES,
  sortBrands
} from "@/data/partsData";
import "@/styles/products.css";
import "@/styles/parts.css";

import partService from "@/services/partService";
import { usePartStore } from "@/store/usePartStore";
import PartCard from "@/components/parts/PartCard";

// ─── Animation Variants ───────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeAvail = (v = "") => {
  const s = v.trim().toLowerCase();
  if (s === "previously sold" || s === "sold") return "sold";
  if (s === "coming soon" || s === "coming_soon") return "coming_soon";
  return "in_stock";
};

const PAGE_SIZE = 12;

// ─── HoverDropdown (identical to Products page) ───────────────────────────────

const HoverDropdown = ({ label, value, options, onChange, isOpen, onInteract }) => (
  <div
    className="relative w-full h-[48px]"
    onMouseEnter={() => onInteract(label)}
    onMouseLeave={() => onInteract(null)}
  >
    <div className="absolute left-4 top-[8px] flex flex-col pointer-events-none z-10">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">{label}</span>
    </div>
    <div
      className={`w-full pl-4 pr-10 pt-3 h-full bg-white border ${isOpen ? "border-[#FF8A00] shadow-[0_0_0_4px_rgba(255,138,0,0.12)]" : "border-[#E5E7EB]"} rounded-[14px] text-[15px] font-bold text-heading flex items-center transition-all cursor-pointer shadow-sm`}
      onClick={() => onInteract(isOpen ? null : label)}
    >
      <span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
    </div>
    <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 ${isOpen ? "rotate-180 text-[#F59E0B]" : ""}`} />
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E5E7EB] rounded-[14px] shadow-xl z-50 overflow-hidden py-1"
        >
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); onInteract(null); }}
              className={`px-4 py-2.5 text-[14px] font-bold cursor-pointer transition-colors ${value === opt.value ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              {opt.label}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── FilterAccordion (identical to Products page) ─────────────────────────────

const FilterAccordion = ({ title, badge, icon: Icon, children, count = 0, isOpen, onToggle }) => (
  <div className="border-b border-[#EEF2F7] last:border-0 pb-[9px] mb-[9px] last:pb-0 last:mb-0 px-2" style={{ width: "100%", boxSizing: "border-box" }}>
    <button
      onClick={() => onToggle(isOpen ? null : title)}
      className={`w-full flex items-center justify-between px-[16px] h-[52px] rounded-[16px] transition-all duration-300 group ${isOpen ? "bg-white border border-[#EEF2F7] shadow-sm" : "bg-white border border-transparent hover:bg-white hover:border-[#EEF2F7] hover:shadow-md hover:-translate-y-[2px] hover:scale-[1.01]"}`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={18} className={`${isOpen ? "text-[#F59E0B]" : "text-slate-400 group-hover:text-[#F59E0B]"} transition-colors`} />}
        <div className="flex items-center">
          <span className={`font-sora text-[14px] font-[800] tracking-[0.12em] uppercase ${isOpen ? "text-heading" : "text-slate-600"}`}>{title}</span>
          {badge > 0 && <span className={`font-semibold text-[11px] ml-1.5 ${isOpen ? "text-orange-600/80" : "text-slate-400"}`}>({badge})</span>}
        </div>
        {count > 0 && (
          <span className="ml-1 bg-orange-50 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-100 animate-in zoom-in-50 duration-300">{count}</span>
        )}
      </div>
      <ChevronDown size={16} strokeWidth={2.5} className={`text-slate-500 transition-transform duration-500 ease-out ${isOpen ? "rotate-180 text-[#F59E0B]" : ""}`} />
    </button>
    <div className="overflow-hidden" style={{ maxHeight: isOpen ? "1200px" : "0px", opacity: isOpen ? 1 : 0, transition: "max-height .35s ease, opacity .2s ease", width: "100%", boxSizing: "border-box" }}>
      <div className="px-4 pb-4 pt-4 w-full box-border">{children}</div>
    </div>
  </div>
);

// ─── CheckList (reusable checkbox filter list) ────────────────────────────────

const CheckList = React.memo(({ items, selected, onToggle, onSeeMore, showCount = 5 }) => {
  const visible = items.slice(0, showCount);
  const hasMore = items.length > showCount;
  return (
    <div className="flex flex-col gap-2.5 pt-1">
      {visible.map(item => {
        const isSel = selected.includes(item);
        return (
          <label key={item} className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="hidden" checked={isSel} onChange={() => onToggle(item)} />
            <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 border-[1.5px] shrink-0 ${isSel ? "bg-orange-500 border-orange-500 shadow-sm" : "bg-white border-slate-300 group-hover:border-orange-400"}`}>
              {isSel && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span className={`font-sora text-[13px] font-semibold transition-colors leading-tight ${isSel ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}>{item}</span>
          </label>
        );
      })}
      {hasMore && (
        <button
          onClick={onSeeMore}
          className="mt-1 text-[12px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors"
        >
          <SlidersHorizontal size={13} />
          See {items.length - showCount} more…
        </button>
      )}
    </div>
  );
});
CheckList.displayName = "CheckList";

// ─── FilterPopupModal ─────────────────────────────────────────────────────────

const FilterPopupModal = ({ title, items, selected, onToggle, onClose, onApply }) => {
  const [search, setSearch] = useState("");
  const [local, setLocal] = useState(new Set(selected));
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter(i => i.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const toggle = (item) => {
    setLocal(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[600px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-[17px] font-display font-black text-heading">{title}</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-0.5">{local.size} selected</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-heading placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-[13px] py-8">No results for "{search}"</p>
          ) : (
            filtered.map(item => {
              const isSel = local.has(item);
              return (
                <label key={item} className="flex items-center gap-3 cursor-pointer group py-1">
                  <input type="checkbox" className="hidden" checked={isSel} onChange={() => toggle(item)} />
                  <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 border-[1.5px] shrink-0 ${isSel ? "bg-orange-500 border-orange-500" : "bg-white border-slate-300 group-hover:border-orange-400"}`}>
                    {isSel && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[14px] font-semibold transition-colors ${isSel ? "text-primary" : "text-slate-600 group-hover:text-primary"}`}>{item}</span>
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-[13px] hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onApply([...local]); onClose(); }}
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold text-[13px] shadow-lg shadow-primary/20 hover:bg-orange-500 transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
// ─── Sidebar Filter Content (shared for desktop + mobile drawer) ──────────────

const SidebarFilters = ({
  selectedMachineTypes, setSelectedMachineTypes,
  selectedBrands, setSelectedBrands,
  selectedModels, setSelectedModels,
  selectedPartCategories, setSelectedPartCategories,
  expandedFilter, setExpandedFilter,
  totalResults, handleReset, showFilters,
  openPopup,
}) => {
  const hasAny = selectedMachineTypes.length + selectedBrands.length + selectedModels.length + selectedPartCategories.length > 0;

  const availableBrands = useMemo(() => {
    if (!selectedMachineTypes.length) {
      return sortBrands(Object.values(PARTS_BRANDS_BY_TYPE).flat());
    }
    const brands = new Set();
    selectedMachineTypes.forEach(t => (PARTS_BRANDS_BY_TYPE[t] || []).forEach(b => brands.add(b)));
    return sortBrands([...brands]);
  }, [selectedMachineTypes]);

  const availableModels = useMemo(() => {
    if (selectedMachineTypes.length === 0) return [];

    const noModelsTypes = ["Buckets & Attachments", "Others"];
    const validTypes = selectedMachineTypes.filter(t => !noModelsTypes.includes(t));
    
    if (validTypes.length === 0) return [];

    const models = new Set();
    const brandsToSearch = selectedBrands.length > 0 ? selectedBrands : availableBrands;
    
    brandsToSearch.forEach(brand => {
      const byBrand = PARTS_MODELS_BY_BRAND[brand] || {};
      validTypes.forEach(t => {
        (byBrand[t] || byBrand["All"] || []).forEach(m => models.add(m));
      });
    });
    return [...models].sort();
  }, [selectedBrands, selectedMachineTypes, availableBrands]);

  return (
    <div className="products-sidebar flex flex-col w-full box-border" style={{ width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div className="px-5 pt-[20px] pb-3 border-b border-[#EEF2F7] mb-2 bg-white rounded-t-[28px]">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-bold text-slate-400 tracking-[3px] uppercase">FILTERS</div>
          {hasAny && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary bg-orange-50 px-2 py-0.5 rounded-full">{totalResults} results</span>
              <button onClick={handleReset} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md transition-colors border border-orange-100">Clear All</button>
            </div>
          )}
        </div>
        <h2 className="text-[22px] font-display font-[700] text-heading leading-tight mt-1">Refine Search</h2>
      </div>

      {/* Active filter chips */}
      {hasAny && (
        <div className="px-5 pb-4 mb-3 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {selectedMachineTypes.map(t => (
              <div key={t} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                <Settings size={12} className="opacity-70" />{t}
                <button onClick={() => setSelectedMachineTypes(selectedMachineTypes.filter(x => x !== t))}><X size={12} strokeWidth={3} /></button>
              </div>
            ))}
            {selectedBrands.map(b => (
              <div key={b} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                <Tag size={12} className="opacity-70" />{b}
                <button onClick={() => setSelectedBrands(selectedBrands.filter(x => x !== b))}><X size={12} strokeWidth={3} /></button>
              </div>
            ))}
            {selectedModels.map(m => (
              <div key={m} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                <Wrench size={12} className="opacity-70" />{m}
                <button onClick={() => setSelectedModels(selectedModels.filter(x => x !== m))}><X size={12} strokeWidth={3} /></button>
              </div>
            ))}
            {selectedPartCategories.map(c => (
              <div key={c} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                <LayoutGrid size={12} className="opacity-70" />{c}
                <button onClick={() => setSelectedPartCategories(selectedPartCategories.filter(x => x !== c))}><X size={12} strokeWidth={3} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Machine Type */}
      <FilterAccordion title="Machine Type" icon={Settings} badge={PARTS_MACHINE_TYPES.length} count={selectedMachineTypes.length} isOpen={expandedFilter === "Machine Type"} onToggle={setExpandedFilter}>
        <CheckList
          items={PARTS_MACHINE_TYPES}
          selected={selectedMachineTypes}
          onToggle={t => {
            const next = selectedMachineTypes.includes(t)
              ? selectedMachineTypes.filter(x => x !== t)
              : [...selectedMachineTypes, t];
            setSelectedMachineTypes(next);
            // Reset brand + model when machine type changes
            setSelectedBrands([]);
            setSelectedModels([]);
          }}
          showCount={5}
          onSeeMore={() => openPopup("Machine Type", PARTS_MACHINE_TYPES, selectedMachineTypes, v => {
            setSelectedMachineTypes(v); setSelectedBrands([]); setSelectedModels([]);
          })}
        />
      </FilterAccordion>

      {/* Brand */}
      <FilterAccordion title="Brand" icon={Tag} badge={availableBrands.length} count={selectedBrands.length} isOpen={expandedFilter === "Brand"} onToggle={setExpandedFilter}>
        <CheckList
          items={availableBrands}
          selected={selectedBrands}
          onToggle={b => {
            const next = selectedBrands.includes(b)
              ? selectedBrands.filter(x => x !== b)
              : [...selectedBrands, b];
            setSelectedBrands(next);
            setSelectedModels([]); // reset model when brand changes
          }}
          showCount={5}
          onSeeMore={() => openPopup("Brand", availableBrands, selectedBrands, v => {
            setSelectedBrands(v); setSelectedModels([]);
          })}
        />
      </FilterAccordion>

      {/* Machine Model */}
      {(() => {
        const noModelsTypes = ["Buckets & Attachments", "Others"];
        const onlyNoModelsTypes = selectedMachineTypes.length > 0 && selectedMachineTypes.every(t => noModelsTypes.includes(t));
        const isDisabled = selectedMachineTypes.length === 0 || onlyNoModelsTypes;
        
        let message = null;
        if (selectedMachineTypes.length === 0) {
          message = "Please select a Machine Type first";
        } else if (onlyNoModelsTypes) {
          message = "This machine type does not use machine models.";
        }

        return (
          <FilterAccordion 
            title="Machine Model" 
            icon={Wrench} 
            badge={isDisabled ? 0 : availableModels.length} 
            count={selectedModels.length} 
            isOpen={expandedFilter === "Machine Model"} 
            onToggle={setExpandedFilter}
          >
            {isDisabled ? (
              <div className="py-3 px-1 text-center text-[12px] font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                {message}
              </div>
            ) : (
              <CheckList
                items={availableModels}
                selected={selectedModels}
                onToggle={m => {
                  const next = selectedModels.includes(m)
                    ? selectedModels.filter(x => x !== m)
                    : [...selectedModels, m];
                  setSelectedModels(next);
                }}
                showCount={5}
                onSeeMore={() => openPopup("Machine Model", availableModels, selectedModels, setSelectedModels)}
              />
            )}
          </FilterAccordion>
        );
      })()}

      {/* Parts Category */}
      <FilterAccordion title="Categories" icon={LayoutGrid} badge={PARTS_CATEGORIES.length} count={selectedPartCategories.length} isOpen={expandedFilter === "Categories"} onToggle={setExpandedFilter}>
        <CheckList
          items={PARTS_CATEGORIES}
          selected={selectedPartCategories}
          onToggle={c => {
            const next = selectedPartCategories.includes(c)
              ? selectedPartCategories.filter(x => x !== c)
              : [...selectedPartCategories, c];
            setSelectedPartCategories(next);
          }}
          showCount={5}
          onSeeMore={() => openPopup("Category", PARTS_CATEGORIES, selectedPartCategories, setSelectedPartCategories)}
        />
      </FilterAccordion>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Parts = () => {
  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured");
  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [selectedMachineTypes, setSelectedMachineTypes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedPartCategories, setSelectedPartCategories] = useState([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null);
  const [expandedFilter, setExpandedFilter] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  // ── Popup modal state ──────────────────────────────────────────────────────
  const [popup, setPopup] = useState(null); // { title, items, selected, onApply }

  const { currency, setCurrency, currencies } = useCurrency();

  // ── Settings ───────────────────────────────────────────────────────────────
  useEffect(() => {
    settingsService.get().then(setSiteSettings).catch(() => {});
  }, []);

  const { parts, loading: isLoadingParts, fetchParts } = usePartStore();

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Reset page when filters change ────────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [
    debouncedSearch, selectedCondition, activeSort, selectedAvailability,
    selectedMachineTypes, selectedBrands, selectedModels, selectedPartCategories
  ]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  // Order: Search → Filters → Pagination
  const filteredParts = useMemo(() => {
    let result = parts;

    // 1. Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.part_number.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q) ||
        p.machine_type.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // 2. Machine Type
    if (selectedMachineTypes.length) {
      result = result.filter(p => selectedMachineTypes.includes(p.machine_type));
    }

    // 3. Brand
    if (selectedBrands.length) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // 4. Model
    if (selectedModels.length) {
      result = result.filter(p => selectedModels.includes(p.model));
    }

    // 5. Part Category
    if (selectedPartCategories.length) {
      result = result.filter(p => selectedPartCategories.includes(p.category));
    }

    // 6. Condition
    if (selectedCondition !== "All") {
      result = result.filter(p => p.condition === selectedCondition);
    }

    // 7. Availability
    if (selectedAvailability !== "All") {
      const availMap = {
        "Available": "in_stock",
        "Previously Sold": "sold",
        "Coming Soon": "coming_soon"
      };
      const target = availMap[selectedAvailability];
      result = result.filter(p => normalizeAvail(p.availability) === target);
    }

    // 8. Sorting
    if (activeSort === "Newest" || activeSort === "Latest Added") {
      result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (activeSort === "Oldest") {
      result = [...result].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (activeSort === "Price Low to High" || activeSort === "Price: Low → High") {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (activeSort === "Price High to Low" || activeSort === "Price: High → Low") {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (activeSort === "Name (A–Z)") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeSort === "Name (Z–A)") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [parts, debouncedSearch, selectedMachineTypes, selectedBrands, selectedModels, selectedPartCategories, selectedCondition, activeSort, selectedAvailability]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredParts.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredParts.slice(start, start + PAGE_SIZE);
  }, [filteredParts, currentPage]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCondition("All");
    setActiveSort("Featured");
    setSelectedAvailability("All");
    setSelectedMachineTypes([]);
    setSelectedBrands([]);
    setSelectedModels([]);
    setSelectedPartCategories([]);
    setCurrentPage(1);
    if (currencies?.length) setCurrency(currencies.find(c => c.code === "USD") || currencies[0]);
  }, [currencies, setCurrency]);

  // ── Enquiry ────────────────────────────────────────────────────────────────
  const handleEnquire = useCallback((part) => {
    setSelectedPart(part);
    setEnquiryOpen(true);
  }, []);

  // ── Popup open helper ──────────────────────────────────────────────────────
  const openPopup = useCallback((title, items, selected, onApply) => {
    setPopup({ title, items, selected, onApply });
  }, []);

  // ── Sidebar props bundle ───────────────────────────────────────────────────
  const sidebarProps = {
    selectedMachineTypes, setSelectedMachineTypes,
    selectedBrands, setSelectedBrands,
    selectedModels, setSelectedModels,
    selectedPartCategories, setSelectedPartCategories,
    expandedFilter, setExpandedFilter,
    totalResults: filteredParts.length,
    handleReset,
    openPopup,
  };

  const hasFilters = searchQuery || selectedCondition !== "All" || activeSort !== "Featured" || selectedAvailability !== "All"
    || selectedMachineTypes.length || selectedBrands.length || selectedModels.length || selectedPartCategories.length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] relative font-body antialiased pt-[72px]">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="relative pt-[26px] pb-[14px] overflow-hidden bg-gradient-to-b from-white to-[#F8FAFC] border-bottom border-slate-100">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0B1533_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="container-section relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full mb-3 shadow-sm"
          >
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Spare Parts Marketplace</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 className="text-[22px] md:text-[26px] lg:text-[32px] font-display font-black text-heading mb-2 heading-decorated tracking-tight relative">
              Genuine <span className="text-gradient drop-shadow-sm">Spare Parts</span> Catalog
              <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
            </h1>
            <p className="text-muted-foreground text-[13px] max-w-[520px] mx-auto mt-1 mb-[14px] font-semibold">
              OEM-quality replacement parts for all major heavy machinery brands.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 2. FILTER TOOLBAR ────────────────────────────────────────────── */}
      <section className="relative z-40 pt-2 pb-3 -mt-2 transition-all duration-300">
        <div className="container-section max-w-[1700px] mx-auto px-4 md:px-8">
          <div className="products-toolbar-wrapper">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="rounded-[20px] py-[10px] px-[14px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_48px_140px_160px_150px_120px] items-center gap-3 transition-all my-0 mx-auto"
              style={{
                width: "calc(100% - 48px)",
                maxWidth: "1650px",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 20px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.6)"
              }}
            >
              {/* Search */}
              <div className="relative group w-full h-[48px] transition-all duration-300">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-slate-50 flex items-center justify-center pointer-events-none group-focus-within:bg-orange-50 transition-colors">
                  <Search className="text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search spare parts, part numbers, brands…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-12 pr-4 bg-white border border-[#E5E7EB] rounded-[14px] text-[15px] font-semibold text-heading placeholder:text-[#94A3B8] placeholder:font-medium focus:outline-none focus:border-[#FF8A00] focus:shadow-[0_0_0_4px_rgba(255,138,0,0.12)] transition-all shadow-sm"
                />
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                title="Reset Filters"
                className="h-[48px] w-[48px] bg-slate-50 text-slate-500 hover:text-orange-600 rounded-[14px] hover:bg-orange-50 transition-all flex items-center justify-center shadow-sm active:scale-95 border border-[#E5E7EB] shrink-0"
              >
                <RotateCcw size={18} />
              </button>

              {/* Condition */}
              <HoverDropdown
                label="CONDITION"
                value={selectedCondition}
                options={[
                  { value: "All", label: "All" },
                  { value: "New", label: "New" },
                  { value: "Used", label: "Used" },
                  { value: "Refurbished", label: "Refurbished" }
                ]}
                onChange={setSelectedCondition}
                isOpen={openDropdown === "CONDITION"}
                onInteract={setOpenDropdown}
              />

              {/* Sort By */}
              <HoverDropdown
                label="SORT BY"
                value={activeSort}
                options={[
                  { value: "Featured", label: "Featured" },
                  { value: "Latest Added", label: "Latest Added" },
                  { value: "Oldest", label: "Oldest" },
                  { value: "Name (A–Z)", label: "Name (A–Z)" },
                  { value: "Name (Z–A)", label: "Name (Z–A)" },
                  { value: "Price: Low → High", label: "Price: Low → High" },
                  { value: "Price: High → Low", label: "Price: High → Low" }
                ]}
                onChange={setActiveSort}
                isOpen={openDropdown === "SORT BY"}
                onInteract={setOpenDropdown}
              />

              {/* Availability */}
              <HoverDropdown
                label="AVAILABILITY"
                value={selectedAvailability}
                options={[
                  { value: "All", label: "All Parts" },
                  { value: "Available", label: "Available" },
                  { value: "Previously Sold", label: "Previously Sold" },
                  { value: "Coming Soon", label: "Coming Soon" }
                ]}
                onChange={setSelectedAvailability}
                isOpen={openDropdown === "AVAILABILITY"}
                onInteract={setOpenDropdown}
              />

              {/* Currency */}
              <HoverDropdown
                label="CURRENCY"
                value={currency?.code || "USD"}
                options={(currencies || []).map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                onChange={code => {
                  const sel = currencies.find(c => c.code === code);
                  if (sel) setCurrency(sel);
                }}
                isOpen={openDropdown === "CURRENCY"}
                onInteract={setOpenDropdown}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div className="container-section max-w-[1750px] mx-auto pt-1 pb-10 mt-0 px-4 md:px-6 lg:px-5">

        {/* Mobile filter button */}
        <div className="lg:hidden flex items-center justify-between mb-4 mt-2">
          <span className="text-[13px] font-bold text-slate-500">
            {filteredParts.length} part{filteredParts.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <SlidersHorizontal size={16} />
            Filters
            {(selectedMachineTypes.length + selectedBrands.length + selectedModels.length + selectedPartCategories.length) > 0 && (
              <span className="ml-1 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {selectedMachineTypes.length + selectedBrands.length + selectedModels.length + selectedPartCategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed top-0 left-0 h-full w-[85vw] max-w-[340px] bg-white z-[70] shadow-2xl overflow-y-auto lg:hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <h2 className="font-display font-black text-[18px] text-heading">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <SidebarFilters {...sidebarProps} showFilters />
                <div className="p-5 border-t border-slate-100 sticky bottom-0 bg-white">
                  <div className="flex gap-3">
                    <button onClick={() => { handleReset(); setMobileFiltersOpen(false); }} className="flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-[13px] hover:bg-slate-100 transition-colors">Reset</button>
                    <button onClick={() => setMobileFiltersOpen(false)} className="flex-1 h-11 rounded-xl bg-primary text-white font-bold text-[13px] shadow-lg shadow-primary/20 hover:bg-orange-500 transition-colors">View Results</button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-[20px] items-stretch mt-[8px]">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-full lg:w-[260px] shrink-0 z-30">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full lg:sticky lg:top-[100px] transition-all duration-200 ease-in-out"
              style={{
                background: "#F8FAFC",
                borderRadius: "28px",
                border: "1px solid #EEF2F7",
                boxShadow: scrolled ? "0 8px 24px rgba(15,23,42,0.04)" : "none"
              }}
            >
              <SidebarFilters {...sidebarProps} showFilters />
            </motion.div>
          </aside>

          {/* Parts Grid */}
          <main className="flex-1 min-w-0 pb-[40px]">
            {filteredParts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package size={40} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-display font-black text-heading mb-3">No parts match your filters.</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">Try adjusting your machine type, brand, or category to find the right part.</p>
                <button onClick={handleReset} className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-[13px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10">
                  Reset Filters
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {/* Result count */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[13px] font-bold text-slate-500">
                    {filteredParts.length} part{filteredParts.length !== 1 ? "s" : ""} found
                    {hasFilters && <span className="ml-2 text-primary bg-orange-50 px-2 py-0.5 rounded-full text-[11px] border border-orange-100">Filtered</span>}
                  </p>
                  <span className="text-[12px] text-slate-400">Page {currentPage} of {totalPages}</span>
                </div>

                {/* Grid */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="grid gap-4 items-start auto-rows-min"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
                >
                  <AnimatePresence mode="popLayout">
                    {pageItems.map(part => (
                      <PartCard key={part.id} part={part} setSelectedPart={setSelectedPart} setEnquiryOpen={setEnquiryOpen} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                    <button
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {[...Array(totalPages)].map((_, idx) => {
                        const p = idx + 1;
                        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                          return (
                            <button
                              key={p}
                              onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl text-[14px] font-bold transition-all ${p === currentPage ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
                            >
                              {p}
                            </button>
                          );
                        } else if (p === currentPage - 2 || p === currentPage + 2) {
                          return <span key={p} className="text-slate-400 font-bold px-1">…</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── 4. CTA ────────────────────────────────────────────────────────── */}
      <section className="gradient-cta py-5 md:py-7 max-h-[240px] relative overflow-hidden flex items-center rounded-t-[32px] md:rounded-t-[48px]">
        <div className="container-section text-center relative z-20 w-full">
          <SectionReveal>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-black text-white mb-2 drop-shadow-lg tracking-tight">Can't Find Your Part?</h2>
            <p className="text-white/90 mb-3 max-w-[480px] mx-auto text-sm font-semibold drop-shadow-md">Our parts specialists source genuine OEM and aftermarket parts globally. Send us a request and we'll find it for you.</p>
            <div className="flex flex-col items-center justify-center gap-1.5">
              <a
                href={`https://wa.me/${siteSettings?.whatsapp || "971558599045"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-white text-primary px-5 py-2 rounded-xl font-display font-black text-sm hover:scale-[1.03] hover:brightness-105 shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-400 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">Send Parts Request <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" /></span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              </a>
              <p className="text-white/80 text-[12px] font-semibold tracking-wide text-center">Worldwide sourcing · OEM &amp; Aftermarket</p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Filter Popup Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {popup && (
          <FilterPopupModal
            title={popup.title}
            items={popup.items}
            selected={popup.selected}
            onToggle={() => {}}
            onClose={() => setPopup(null)}
            onApply={(val) => { popup.onApply(val); setPopup(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Enquiry Modal ─────────────────────────────────────────────────── */}
      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        productName={selectedPart ? `${selectedPart.name} (${selectedPart.part_number})` : ""}
        product={selectedPart}
      />
    </div>
  );
};

export default Parts;
