import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, RotateCcw, ChevronDown, LayoutGrid, Tag, MapPin, Clock, DollarSign, X, ChevronLeft, ChevronRight } from "lucide-react";
import { MACHINERY_CATEGORIES } from "@/constants/categories";
import EnquiryModal from "@/components/EnquiryModal";
import SectionReveal from "@/components/SectionReveal";
import { useCurrency } from "@/context/CurrencyContext";
import settingsService from "@/services/settingsService";
import productService from "@/services/productService";
import ProductCard from "@/components/products/ProductCard";
import "@/styles/cards.css";
import "@/styles/products.css";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const FilterAccordion = ({ title, badge, icon: Icon, children, count = 0, isOpen, onInteract }) => {
  return (
    <div 
      className="border-b border-[#EEF2F7] last:border-0 pb-[9px] mb-[9px] last:pb-0 last:mb-0 px-2" 
      style={{ width: '100%', boxSizing: 'border-box' }}
      onMouseEnter={() => onInteract && onInteract(title)}
    >
      <button 
        onClick={() => onInteract && onInteract(isOpen ? null : title)}
        className={`w-full flex items-center justify-between px-[16px] h-[52px] rounded-[16px] transition-all duration-300 group
          ${isOpen ? 'bg-white border-[1px] border-[#EEF2F7] shadow-sm' : 'bg-white border-[1px] border-transparent hover:bg-[#F8FAFC] hover:border-[#EEF2F7]'}`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className={`${isOpen ? 'text-[#F59E0B]' : 'text-slate-400 group-hover:text-[#F59E0B]'} transition-colors`} />}
          <div className="flex items-center">
            <span className={`font-sora text-[14px] font-[800] tracking-[0.12em] uppercase ${isOpen ? 'text-heading' : 'text-slate-600'}`}>{title}</span>
            {badge && <span className={`font-semibold text-[11px] ml-1.5 ${isOpen ? 'text-orange-600/80' : 'text-slate-400'}`}>({badge})</span>}
          </div>
          {count > 0 && (
            <span className="ml-1 bg-orange-50 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-100 animate-in zoom-in-50 duration-300">
              {count}
            </span>
          )}
        </div>
        <ChevronDown size={16} strokeWidth={2.5} className={`text-slate-500 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-[#F59E0B]' : ''}`} />
      </button>
      <div 
        className="overflow-hidden"
        style={{
          maxHeight: isOpen ? '800px' : '0px',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height .35s ease, opacity .2s ease',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div className="px-4 pb-4 pt-4 w-full box-border">
          {children}
        </div>
      </div>
    </div>
  );
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const titleVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + (i * 0.1),
      duration: 0.6,
      ease: [0.215, 0.610, 0.355, 1.000]
    }
  })
};


const MASTER_CATEGORIES = ["All", ...MACHINERY_CATEGORIES];

// ── Pure helper: normalise availability string — defined OUTSIDE component so
//    it's never re-created on each render
const normalizeAvailability = (value) => {
  const v = (value ?? "").toString().trim().toLowerCase();
  if (v === "sold") return "sold";
  if (v === "in_stock" || v === "in stock" || v === "available") return "in_stock";
  if (v === "coming_soon" || v === "coming soon" || v === "reserved") return "coming_soon";
  return v || "in_stock";
};

const HoverDropdown = ({ label, value, options, onChange, isOpen, onInteract }) => {
  return (
    <div 
      className="relative w-full h-[48px]"
      onMouseEnter={() => onInteract(label)}
      onMouseLeave={() => onInteract(null)}
    >
      <div className="absolute left-4 top-[8px] flex flex-col pointer-events-none z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">{label}</span>
      </div>
      <div 
        className={`w-full pl-4 pr-10 pt-3 h-full bg-white border ${isOpen ? 'border-[#FF8A00] shadow-[0_0_0_4px_rgba(255,138,0,0.12)]' : 'border-[#E5E7EB]'} rounded-[14px] text-[15px] font-bold text-heading flex items-center transition-all cursor-pointer shadow-sm`}
        onClick={() => onInteract(isOpen ? null : label)}
      >
        <span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
      </div>
      <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#F59E0B]' : ''}`} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E5E7EB] rounded-[14px] shadow-xl z-50 overflow-hidden py-1"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onChange(opt.value); 
                  onInteract(null); 
                }}
                className={`px-4 py-2.5 text-[14px] font-bold cursor-pointer transition-colors ${
                  value === opt.value ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("category") ? searchParams.get("category").split(",") : []
  );
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [engineHours, setEngineHours] = useState(50000);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeSort, setActiveSort] = useState("Manual Order");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [page, setPage] = useState(1);
  const { currency, setCurrency, currencies } = useCurrency();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.get();
        setSiteSettings(settings);
      } catch (error) {
        console.error("Error fetching settings", error);
      }
    };
    fetchSettings();
  }, []);

  // ── Reset page to 1 when filters change ──────────────────────────
  useEffect(() => {
    setPage(1);
  }, [
    selectedCategories,
    selectedBrands,
    selectedLocations,
    engineHours,
    minPrice,
    maxPrice,
    selectedCondition,
    activeStatus,
    searchQuery,
    activeSort
  ]);

  // ── Fetch paginated data ──────────────────────────
  const { data: queryData, isLoading: queryLoading, isFetching } = useQuery({
    queryKey: ['products', {
      page,
      limit: 10,
      category: selectedCategories,
      brands: selectedBrands,
      locations: selectedLocations,
      engineHours,
      minPrice,
      maxPrice,
      condition: selectedCondition,
      status: activeStatus,
      search: searchQuery,
      sort: activeSort
    }],
    queryFn: () => productService.getPaginated({
      page,
      limit: 10,
      category: selectedCategories,
      brands: selectedBrands,
      locations: selectedLocations,
      engineHours: engineHours < 50000 ? engineHours : undefined,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 50000000 ? maxPrice : undefined,
      condition: selectedCondition,
      status: activeStatus,
      search: searchQuery,
      sort: activeSort
    }),
    keepPreviousData: true,
  });

  const filteredProducts = queryData?.products || [];
  const totalProducts = queryData?.total || 0;
  const totalPages = queryData?.totalPages || 1;
  const loading = queryLoading;

  // ── Memoised derived lists — avoid re-filtering on every render ────────────
  const availableProducts = useMemo(
    () => filteredProducts.filter(p => normalizeAvailability(p.availability) !== "sold"),
    [filteredProducts]
  );
  const soldProducts = useMemo(
    () => filteredProducts.filter(p => normalizeAvailability(p.availability) === "sold"),
    [filteredProducts]
  );


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    if (search !== null) setSearchQuery(search);
    if (category !== null) setSelectedCategories(category.split(","));
  }, [searchParams]);

  // ── Reset — useCallback so child components that receive it don’t re-render ─
  const handleReset = useCallback(() => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedLocations([]);
    setEngineHours(50000);
    setMinPrice(0);
    setMaxPrice(50000000);
    setSelectedCondition("All");
    setActiveStatus("All");
    setActiveSort("Manual Order");
    setPage(1);
    if (currencies && currencies.length > 0) {
      setCurrency(currencies.find(c => c.code === 'USD') || currencies[0]);
    }
    setSearchParams(new URLSearchParams());
  }, [currencies, setCurrency, setSearchParams]);


  if (loading && !isFetching) return (
    <div className="min-h-screen bg-[#F8FAFC] pt-[120px]">
      <div className="container-section">
        {/* Skeleton Hero */}
        <div className="w-full h-[200px] bg-white rounded-[32px] mb-12 animate-pulse" />
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Skeleton Sidebar */}
          <div className="w-full lg:w-[320px] h-[600px] bg-white rounded-[22px] animate-pulse shrink-0" />
          
          {/* Skeleton Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[450px] bg-white rounded-[22px] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative font-body antialiased pt-[72px]">
      {/* 1. COMPACT PREMIUM HERO SECTION */}
      <section className="relative pt-[26px] pb-[14px] overflow-hidden bg-gradient-to-b from-white to-[#F8FAFC] border-bottom border-slate-100">
        {/* Visual Depth Elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0B1533_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        
        {/* Soft blur circles for depth */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="container-section relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full mb-3 shadow-sm"
          >
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Export Hub Catalog</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 className="text-3xl md:text-4xl font-display font-black text-heading mb-2 heading-decorated tracking-tight relative">
              Our Heavy <span className="text-gradient drop-shadow-sm">Machinery</span> Fleet
              {/* Subtle glow behind heading */}
              <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
            </h1>
            
            <p className="text-muted-foreground text-[13px] max-w-[520px] mx-auto mt-1 mb-[14px] font-semibold">
              Engineered for performance, curated for global markets.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. PREMIUM SEARCH & FILTER TOOLBAR WRAPPER */}
      <section className="relative z-40 pt-2 pb-3 -mt-2 transition-all duration-300">
        <div className="container-section max-w-[1700px] mx-auto px-4 md:px-8">
        <div className="products-toolbar-wrapper">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="rounded-[20px] py-[10px] px-[14px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_48px_140px_160px_150px_120px] items-center gap-3 transition-all my-0 mx-auto"
            style={{ 
              width: 'calc(100% - 48px)', 
              maxWidth: '1650px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 8px 20px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.6)'
            }}
          >
            {/* 1. COMPACT LUXURY SEARCH BAR (White Card) */}
            <div className="relative group w-full h-[48px] transition-all duration-300">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-slate-50 flex items-center justify-center pointer-events-none group-focus-within:bg-orange-50 transition-colors">
                <Search className="text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search excavators, CAT 320D..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-12 pr-4 bg-white border border-[#E5E7EB] rounded-[14px] text-[15px] font-semibold text-heading placeholder:text-[#94A3B8] placeholder:font-medium focus:outline-none focus:border-[#FF8A00] focus:shadow-[0_0_0_4px_rgba(255,138,0,0.12)] transition-all shadow-sm"
              />
            </div>

            {/* 2. RESET BUTTON (Compact Icon Only) */}
            <button 
              onClick={handleReset}
              title="Reset Filters"
              className="h-[48px] w-[48px] bg-slate-50 text-slate-500 hover:text-orange-600 rounded-[14px] hover:bg-orange-50 transition-all flex items-center justify-center shadow-sm active:scale-95 border border-[#E5E7EB] shrink-0"
            >
              <RotateCcw size={18} />
            </button>

            {/* 3. CONDITION DROPDOWN */}
            <HoverDropdown
              label="CONDITION"
              value={selectedCondition}
              options={[
                { value: 'All', label: 'All' },
                { value: 'New', label: 'New' },
                { value: 'Used', label: 'Used' },
                { value: 'Refurbished', label: 'Refurbished' },
                { value: 'Rental', label: 'Rental' }
              ]}
              onChange={setSelectedCondition}
              isOpen={openDropdown === 'CONDITION'}
              onInteract={setOpenDropdown}
            />

            {/* 4. SORT DROPDOWN */}
            <HoverDropdown
              label="SORT BY"
              value={activeSort}
              options={[
                { value: 'Manual Order', label: 'Featured' },
                { value: 'Newest', label: 'Newest' },
                { value: 'Oldest', label: 'Oldest' },
                { value: 'Price Low to High', label: 'Price: Low-High' },
                { value: 'Price High to Low', label: 'Price: High-Low' }
              ]}
              onChange={setActiveSort}
              isOpen={openDropdown === 'SORT BY'}
              onInteract={setOpenDropdown}
            />

            {/* 5. AVAILABILITY DROPDOWN */}
            <HoverDropdown
              label="AVAILABILITY"
              value={activeStatus}
              options={[
                { value: 'All', label: 'All Fleet' },
                { value: 'Available', label: 'Available' },
                { value: 'Sold', label: 'Previously Sold' },
                { value: 'Coming Soon', label: 'Coming Soon' }
              ]}
              onChange={setActiveStatus}
              isOpen={openDropdown === 'AVAILABILITY'}
              onInteract={setOpenDropdown}
            />

            {/* 6. CURRENCY DROPDOWN */}
            <HoverDropdown
              label="CURRENCY"
              value={currency?.code || 'USD'}
              options={currencies.map(curr => ({
                value: curr.code,
                label: `${curr.code} (${curr.symbol})`
              }))}
              onChange={(code) => {
                const selected = currencies.find(c => c.code === code);
                if (selected) setCurrency(selected);
              }}
              isOpen={openDropdown === 'CURRENCY'}
              onInteract={setOpenDropdown}
            />
          </motion.div>
        </div>{/* end products-toolbar-wrapper */}
        </div>
      </section>

      <div className="container-section max-w-[1750px] mx-auto pt-1 pb-10 mt-0 px-4 md:px-6 lg:px-5">
        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between mb-4 mt-2">
          <span className="text-[13px] font-bold text-slate-500">
            {totalProducts} machine{totalProducts !== 1 ? 's' : ''} found
          </span>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filters
            {(selectedCategories.length + selectedBrands.length + selectedLocations.length) > 0 && (
              <span className="ml-1 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {selectedCategories.length + selectedBrands.length + selectedLocations.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
                onClick={() => setMobileFiltersOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed top-0 left-0 h-full w-[85vw] max-w-[340px] bg-white z-[70] shadow-2xl overflow-y-auto lg:hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <h2 className="font-display font-black text-[18px] text-heading">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="products-sidebar" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                  {(selectedCategories.length > 0 || selectedBrands.length > 0 || selectedLocations.length > 0) && (
                    <div className="px-5 pb-4 mb-3 border-b border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map(cat => (
                          <div key={cat} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                            <LayoutGrid size={12} className="opacity-70" />{cat}
                            <button onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}><X size={12} strokeWidth={3} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FilterAccordion title="Categories" badge="10" icon={LayoutGrid} count={selectedCategories.length} isOpen={expandedFilter === "Categories"} onInteract={setExpandedFilter}>
                    <div className="grid grid-cols-2 gap-[8px] pt-1">
                      {(showAllCategories ? MASTER_CATEGORIES.filter(c => c !== "All") : MASTER_CATEGORIES.filter(c => c !== "All").slice(0, 6)).map(cat => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <button key={cat} onClick={() => { const next = isSelected ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat]; setSelectedCategories(next); }} style={{ padding: '10px 12px', fontSize: '13px', minHeight: '42px', borderRadius: '12px' }} className={`flex items-center justify-center font-manrope transition-all duration-200 border text-center leading-tight ${isSelected ? 'bg-[#FFF9F0] border-[#F59E0B] text-heading font-[700] shadow-sm' : 'bg-white border-[#EEF2F7] text-slate-600 hover:bg-[#F8FAFC] hover:border-[#cbd5e1]'}`}>{cat}</button>
                        );
                      })}
                    </div>
                  </FilterAccordion>
                  <FilterAccordion title="Brands" badge="8" icon={Tag} count={selectedBrands.length} isOpen={expandedFilter === "Brands"} onInteract={setExpandedFilter}>
                    <div className="flex flex-col gap-2.5 pt-1">
                      {["CAT", "JCB", "Komatsu", "Volvo", "Hyundai", "Doosan", "Hitachi", "Sany"].map(brand => {
                        const isSelected = selectedBrands.includes(brand);
                        return (
                          <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="hidden" checked={isSelected} onChange={() => { const next = isSelected ? selectedBrands.filter(b => b !== brand) : [...selectedBrands, brand]; setSelectedBrands(next); }} />
                            <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 border-[1.5px] ${isSelected ? 'bg-orange-500 border-orange-500 shadow-sm' : 'bg-white border-slate-300 group-hover:border-orange-400'}`}>
                              {isSelected && <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>}
                            </div>
                            <span className={`font-sora text-[14px] font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{brand}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FilterAccordion>
                  <FilterAccordion title="Engine Hours" icon={Clock} count={engineHours > 0 && engineHours < 50000 ? 1 : 0} isOpen={expandedFilter === "Engine Hours"} onInteract={setExpandedFilter}>
                    <div className="pb-2 pt-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Max Hours</span>
                        <span className="text-[11px] font-bold text-primary">{engineHours.toLocaleString()} hrs</span>
                      </div>
                      <input type="range" min="0" max="50000" step="500" value={engineHours} onChange={(e) => setEngineHours(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                  </FilterAccordion>
                </div>
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
          
          <aside className="hidden lg:block w-full lg:w-[260px] shrink-0 z-30" onMouseLeave={() => setExpandedFilter(null)}>
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full lg:sticky lg:top-[100px] transition-all duration-200 ease-in-out"
              style={{
                background: '#F8FAFC',
                borderRadius: '28px',
                border: '1px solid #EEF2F7',
                boxShadow: scrolled ? '0 8px 24px rgba(15,23,42,0.04)' : 'none'
              }}
            >
              <div className="products-sidebar flex flex-col w-full box-border" style={{ width: '100%', boxSizing: 'border-box' }}>
              
              <div className="px-5 pt-[20px] pb-3 border-b border-[#EEF2F7] mb-2 bg-white rounded-t-[28px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-bold text-slate-400 tracking-[3px] uppercase">FILTERS</div>
                  {(selectedCategories.length > 0 || selectedBrands.length > 0 || selectedLocations.length > 0 || engineHours < 50000 || minPrice > 0 || maxPrice < 50000000 || selectedCondition !== "All" || activeStatus !== "All") && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-orange-50 px-2 py-0.5 rounded-full">{totalProducts} results</span>
                      <button onClick={handleReset} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md transition-colors border border-orange-100">Clear All</button>
                    </div>
                  )}
                </div>
                <h2 className="text-[22px] font-display font-[700] text-heading leading-tight mt-1">Refine Search</h2>
              </div>

              {/* Active Filters Section */}
              {(selectedCategories.length > 0 || selectedBrands.length > 0 || selectedLocations.length > 0) && (
                <div className="px-5 pb-4 mb-3 border-b border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(cat => (
                      <div key={cat} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                        <LayoutGrid size={12} className="opacity-70" />
                        {cat}
                        <button onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))} className="hover:text-orange-700"><X size={12} strokeWidth={3} /></button>
                      </div>
                    ))}
                    {selectedBrands.map(brand => (
                      <div key={brand} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                        <Tag size={12} className="opacity-70" />
                        {brand}
                        <button onClick={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))} className="hover:text-orange-700"><X size={12} strokeWidth={3} /></button>
                      </div>
                    ))}
                    {selectedLocations.map(loc => (
                      <div key={loc} className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">
                        <MapPin size={12} className="opacity-70" />
                        {loc}
                        <button onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== loc))} className="hover:text-orange-700"><X size={12} strokeWidth={3} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FilterAccordion title="Categories" badge="10" icon={LayoutGrid} count={selectedCategories.length} isOpen={expandedFilter === "Categories"} onInteract={setExpandedFilter}>
                <div className="grid grid-cols-2 gap-[8px] pt-1">
                  {(showAllCategories ? MASTER_CATEGORIES.filter(c => c !== "All") : MASTER_CATEGORIES.filter(c => c !== "All").slice(0, 6)).map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button 
                        key={cat}
                        onClick={() => {
                          const next = isSelected ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat];
                          setSelectedCategories(next);
                        }}
                        style={{ padding: '10px 12px', fontSize: '13px', minHeight: '42px', borderRadius: '12px' }}
                        className={`flex items-center justify-center font-manrope transition-all duration-200 border text-center leading-tight ${isSelected ? 'bg-[#FFF9F0] border-[#F59E0B] text-heading font-[700] shadow-sm' : 'bg-white border-[#EEF2F7] text-slate-600 hover:bg-[#F8FAFC] hover:border-[#cbd5e1]'}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                {!showAllCategories && MASTER_CATEGORIES.filter(c => c !== "All").length > 6 && (
                  <button 
                    onClick={() => setShowAllCategories(true)}
                    className="w-full mt-3 py-2 text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors border border-dashed border-[#EEF2F7] rounded-[12px] hover:border-slate-300 hover:bg-slate-50"
                  >
                    +{MASTER_CATEGORIES.filter(c => c !== "All").length - 6} More Categories
                  </button>
                )}
                {showAllCategories && (
                  <button 
                    onClick={() => setShowAllCategories(false)}
                    className="w-full mt-3 py-2 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Show Less
                  </button>
                )}
              </FilterAccordion>

              <FilterAccordion title="Brands" badge="8" icon={Tag} count={selectedBrands.length} isOpen={expandedFilter === "Brands"} onInteract={setExpandedFilter}>
                <div className="flex flex-col gap-2.5 pt-1">
                  {["CAT", "JCB", "Komatsu", "Volvo", "Hyundai", "Doosan", "Hitachi", "Sany"].map(brand => {
                    const isSelected = selectedBrands.includes(brand);
                    return (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => {
                            const next = isSelected ? selectedBrands.filter(b => b !== brand) : [...selectedBrands, brand];
                            setSelectedBrands(next);
                          }}
                        />
                        <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 border-[1.5px] ${isSelected ? 'bg-orange-500 border-orange-500 shadow-sm' : 'bg-white border-slate-300 group-hover:border-orange-400'}`}>
                          {isSelected && (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>
                        <span className={`font-sora text-[14px] font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}>{brand}</span>
                      </label>
                    );
                  })}
                </div>
              </FilterAccordion>

              <FilterAccordion title="Location" badge="6" icon={MapPin} count={selectedLocations.length} isOpen={expandedFilter === "Location"} onInteract={setExpandedFilter}>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {["UAE", "India", "Saudi", "Africa", "USA", "Europe"].map(loc => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <button 
                        key={loc}
                        onClick={() => {
                          const next = isSelected ? selectedLocations.filter(l => l !== loc) : [...selectedLocations, loc];
                          setSelectedLocations(next);
                        }}
                        className={`px-2 py-3 rounded-full font-sora text-[12px] font-bold uppercase border transition-all truncate ${isSelected ? 'bg-gradient-to-r from-[#ffb100] to-[#ff7a00] border-transparent text-white shadow-lg shadow-orange-500/20 -translate-y-0.5' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-white hover:-translate-y-0.5'}`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </FilterAccordion>

              <FilterAccordion title="Engine Hours" icon={Clock} count={engineHours > 0 && engineHours < 50000 ? 1 : 0} isOpen={expandedFilter === "Engine Hours"} onInteract={setExpandedFilter}>
                <div className="pb-2 pt-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Max Hours</span>
                    <span className="text-[11px] font-bold text-primary">{engineHours.toLocaleString()} hrs</span>
                  </div>
                  <input 
                    type="range" min="0" max="50000" step="500" value={engineHours}
                    onChange={(e) => setEngineHours(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-[9px] font-black text-slate-300 uppercase">
                    <span>0</span>
                    <span>50,000+</span>
                  </div>
                </div>
              </FilterAccordion>

              <FilterAccordion title="Price Range" icon={DollarSign} count={(minPrice > 0 || maxPrice < 50000000) ? 1 : 0} isOpen={expandedFilter === "Price Range"} onInteract={setExpandedFilter}>
                <div className="pb-2 pt-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Max Price</span>
                    <span className="text-[11px] font-bold text-primary">
                      {maxPrice >= 50000000 ? "Any" : (() => {
                        if (maxPrice >= 10000000) return `₹${(maxPrice / 10000000).toFixed(1).replace(/\.0$/, '')} Crore`;
                        if (maxPrice >= 100000) return `₹${(maxPrice / 100000).toFixed(1).replace(/\.0$/, '')} Lakh`;
                        return `₹${maxPrice.toLocaleString('en-IN')}`;
                      })()}
                    </span>
                  </div>
                  <input 
                    type="range" min="0" max="50000000" step="100000" value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-[9px] font-black text-slate-300 uppercase">
                    <span>₹0</span>
                    <span>₹5 Cr+</span>
                  </div>
                </div>
              </FilterAccordion>

              </div>
            </motion.div>
          </aside>

          {/* RIGHT SIDE PRODUCT GRID */}
          <main className="flex-1 min-w-0 pb-[40px]">
            {filteredProducts.length === 0 ? (
              /* 4. EMPTY STATE */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RotateCcw size={40} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-display font-black text-heading mb-3">No machinery matches your filters.</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">Try adjusting filters or search terms to find the perfect equipment for your needs.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-[13px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10"
                  >
                    Reset Filters
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {/* Active Inventory Grid */}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="grid gap-4 items-start auto-rows-min"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                  <AnimatePresence mode="popLayout">
                    {availableProducts.map((product) => (
                      <ProductCard key={product.id} product={product} setSelectedProduct={setSelectedProduct} setEnquiryOpen={setEnquiryOpen} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Previously Sold Units */}
                {activeStatus === "All" && availableProducts.length > 0 && soldProducts.length > 0 && (
                  <div className="mt-8 mb-6 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-full mb-1">
                      <div className="h-[1px] bg-slate-200/80 flex-1 max-w-[120px] md:max-w-[250px]" />
                      <h2 className="text-3xl md:text-4xl font-display font-black text-heading tracking-tight mx-5 relative heading-decorated mb-2">
                        Our <span className="text-gradient drop-shadow-sm">Sold Machinery</span> Fleet
                        <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full" />
                      </h2>
                      <div className="h-[1px] bg-slate-200/80 flex-1 max-w-[120px] md:max-w-[250px]" />
                    </div>
                    <p className="text-slate-400 text-[13px] max-w-[520px] mx-auto mt-2 font-semibold">Machines successfully exported to global buyers.</p>
                  </div>
                )}

                {soldProducts.length > 0 && (
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid gap-4 items-start auto-rows-min"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                  >
                    <AnimatePresence mode="popLayout">
                      {soldProducts.map((product) => (
                        <ProductCard key={product.id} product={product} setSelectedProduct={setSelectedProduct} setEnquiryOpen={setEnquiryOpen} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {[...Array(totalPages)].map((_, idx) => {
                        const p = idx + 1;
                        const isCurrent = p === page;
                        if (
                          p === 1 || 
                          p === totalPages || 
                          (p >= page - 1 && p <= page + 1)
                        ) {
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl text-[14px] font-bold transition-all ${
                                isCurrent 
                                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        } else if (p === page - 2 || p === page + 2) {
                          return <span key={p} className="text-slate-400 font-bold px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

      {/* 5. PREMIUM CTA SECTION (Mirrored from Home page) */}
      <section className="gradient-cta py-5 md:py-7 max-h-[240px] relative overflow-hidden flex items-center rounded-t-[32px] md:rounded-t-[48px]">
        <div className="container-section text-center relative z-20 w-full">
          <SectionReveal>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-black text-white mb-2 drop-shadow-lg tracking-tight">Ready to Upgrade Your Fleet?</h2>
            <p className="text-white/90 mb-3 max-w-[480px] mx-auto text-sm font-semibold drop-shadow-md">Get competitive pricing, global shipping logistics, and expert consultation from our Dubai headquarters.</p>
            <div className="flex flex-col items-center justify-center gap-1.5">
              <a 
                href={`https://wa.me/${siteSettings?.whatsapp || "971558599045"}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2.5 bg-white text-primary px-5 py-2 rounded-xl font-display font-black text-sm hover:scale-[1.03] hover:brightness-105 shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-400 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">Start Your Enquiry <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" /></span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              </a>
              <p className="text-white/80 text-[12px] font-semibold tracking-wide text-center">Get instant response from our team</p>
            </div>
          </SectionReveal>
        </div>
      </section>

      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} productName={selectedProduct?.name} product={selectedProduct} />
    </div>
  );
};

export default Products;
