import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Maximize, X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Masonry from "react-masonry-css";
import AnimatedGear from "@/components/AnimatedGear";
import galleryService from "@/services/galleryService";
import "@/styles/gallery.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Shipping", "Logistics", "Workshop", "Others"];
const PAGE_SIZE = 12; // Multiples of 4 for clean grid rows

// ─── Animation variants ───────────────────────────────────────────────────────

const gridVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ─── GalleryCard (memoized) ───────────────────────────────────────────────────

const GalleryCard = React.memo(({ item, globalIndex, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      variants={itemVariant}
      layout
      className="gallery-card"
      onClick={() => onClick(globalIndex)}
    >
      {/* Fluid height wrapper — respects image aspect ratio */}
      <div className="gallery-card__inner">
        {/* Skeleton shown until image loads */}
        {!loaded && (
          <div className="gallery-card__skeleton" />
        )}

        <img
          src={item.image_url}
          alt={`Gallery – ${item.category}`}
          className={`gallery-card__img${loaded ? " gallery-card__img--loaded" : ""}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />

        {/* Hover overlay */}
        <div className="gallery-card__overlay" />

        {/* Hover content */}
        <div className="gallery-card__hover-content">
          <span className="gallery-card__category-badge">{item.category}</span>
          <div className="gallery-card__zoom-icon">
            <Maximize size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
GalleryCard.displayName = "GalleryCard";

// ─── Grid Skeleton ────────────────────────────────────────────────────────────

const GallerySkeleton = () => (
  <Masonry
    breakpointCols={{
      default: 4,
      1280: 4,
      1024: 3,
      640: 2,
      480: 1
    }}
    className="flex w-auto -ml-5"
    columnClassName="pl-5 bg-clip-padding flex flex-col gap-5"
  >
    {Array.from({ length: 12 }).map((_, i) => (
      <div 
        key={i} 
        className="gallery-skeleton-card" 
        style={{ height: `${200 + Math.random() * 200}px` }} 
      />
    ))}
  </Masonry>
);

// ─── Pagination Controls ──────────────────────────────────────────────────────

const Pagination = React.memo(({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
    ) {
      pages.push(p);
    } else if (p === page - 2 || p === page + 2) {
      pages.push("...");
    }
  }
  const dedupedPages = pages.filter(
    (v, i, arr) => !(v === "..." && arr[i - 1] === "...")
  );

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-4 select-none">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      <div className="flex items-center gap-1.5">
        {dedupedPages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="text-slate-400 font-bold px-1 w-10 text-center">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-[14px] font-bold transition-all ${
                p === page
                  ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/25"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
});
Pagination.displayName = "Pagination";

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = React.memo(({ item, index, total, onClose, onPrev, onNext }) => {
  // Touch / swipe handling
  const touchStartX = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      dx < 0 ? onNext() : onPrev();
    }
    touchStartX.current = null;
  }, [onNext, onPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        aria-label="Close gallery"
        className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full z-20"
        onClick={onClose}
      >
        <X size={22} />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-[13px] font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm z-20">
        {index + 1} / {total}
      </div>

      {/* Prev */}
      <button
        aria-label="Previous image"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full text-white hover:bg-primary/80 transition-all z-20 disabled:opacity-30"
        disabled={total <= 1}
      >
        <ChevronLeft size={24} />
      </button>

      {/* Next */}
      <button
        aria-label="Next image"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full text-white hover:bg-primary/80 transition-all z-20 disabled:opacity-30"
        disabled={total <= 1}
      >
        <ChevronRight size={24} />
      </button>

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="max-w-5xl w-full max-h-[85vh] relative rounded-2xl overflow-hidden flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={item.image_url}
            alt={`Gallery – ${item.category}`}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
          />
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
            <span className="inline-block bg-primary/90 px-3 py-1 rounded-full text-xs font-bold text-white tracking-wider">
              {item.category}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
});
Lightbox.displayName = "Lightbox";

// ─── Main Gallery Page ────────────────────────────────────────────────────────

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ── 1. Fetch ALL gallery items exactly once ──────────────────────────────
  const { data: allGallery = [], isLoading } = useQuery({
    queryKey: ["gallery", "all"],
    queryFn: () => galleryService.getAll(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ── 2. Filter from master array (always, never from a derived slice) ──────
  const filteredGallery = useMemo(() => {
    if (activeCategory === "All") return allGallery;
    return allGallery.filter((item) => item.category === activeCategory);
  }, [allGallery, activeCategory]);

  // ── 3. Paginate the filtered result ─────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredGallery.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGallery.slice(start, start + PAGE_SIZE);
  }, [filteredGallery, currentPage]);

  // ── 4. Category change: reset page 1 ────────────────────────────────────
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setLightboxIndex(null);
  }, []);

  // ── 5. Page change (safe clamp) ──────────────────────────────────────────
  const handlePageChange = useCallback((p) => {
    setCurrentPage(Math.max(1, Math.min(p, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalPages]);

  // ── 6. Lightbox navigation (within filteredGallery) ──────────────────────
  const openLightbox = useCallback((index) => setLightboxIndex(index), []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const navigateLightbox = useCallback((dir) => {
    setLightboxIndex((prev) => {
      if (prev === null) return null;
      return (prev + dir + filteredGallery.length) % filteredGallery.length;
    });
  }, [filteredGallery.length]);

  // ── 7. Keyboard navigation ───────────────────────────────────────────────
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")  navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, navigateLightbox, closeLightbox]);

  // ── 8. Preload next page ─────────────────────────────────────────────────
  useEffect(() => {
    if (currentPage < totalPages) {
      const start = currentPage * PAGE_SIZE;
      const nextItems = filteredGallery.slice(start, start + PAGE_SIZE);
      nextItems.forEach((item) => {
        const img = new Image();
        img.src = item.image_url;
      });
    }
  }, [currentPage, totalPages, filteredGallery]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="pt-28 pb-16 min-h-screen bg-white relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-[120px] pointer-events-none" />
      <div className="absolute right-[5%] top-[15%] opacity-[0.03] pointer-events-none hidden lg:block">
        <AnimatedGear size={220} className="[animation-direction:reverse]" />
      </div>

      <div className="container-section relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-heading mb-4">
            Our <span className="text-gradient">Gallery</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Visual highlights of our machinery, global shipments, and facilities.
          </p>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-start md:justify-center items-center gap-3 md:gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide"
        >
          {CATEGORIES.map((category) => (
            <motion.button
              key={category}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryChange(category)}
              className={`px-7 py-3 rounded-full text-[13px] font-display font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap ${
                activeCategory === category
                  ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/20"
                  : "bg-gray-100/80 text-heading/60 hover:bg-white hover:text-primary border border-transparent hover:border-primary/20"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Gallery body ── */}

        {/* Initial skeleton — shown only during the very first load */}
        {isLoading && <GallerySkeleton />}

        {/* After data is loaded */}
        {!isLoading && (
          <>
            {filteredGallery.length === 0 ? (
              /* Empty state */
              <div className="text-center py-24 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200">
                  <Images size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-heading mb-2">
                  No images available
                </h3>
                <p className="text-slate-500">
                  No images available in this category.
                </p>
              </div>
            ) : (
              <>
                {/* Page info */}
                <p className="text-center text-slate-400 text-sm mb-8">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredGallery.length)} of{" "}
                  {filteredGallery.length} images
                  {activeCategory !== "All" && ` in ${activeCategory}`}
                </p>

                {/* Premium Masonry Grid */}
                <motion.div
                  key={`${activeCategory}-${currentPage}`}
                  variants={gridVariant}
                  initial="hidden"
                  animate="visible"
                >
                  <Masonry
                    breakpointCols={{
                      default: 4,
                      1280: 4,
                      1024: 3,
                      640: 2,
                      480: 1
                    }}
                    className="flex w-auto -ml-5"
                    columnClassName="pl-5 bg-clip-padding flex flex-col gap-5"
                  >
                    {pageItems.map((item, idx) => {
                      const globalIndex = (currentPage - 1) * PAGE_SIZE + idx;
                      return (
                        <GalleryCard
                          key={item.id}
                          item={item}
                          globalIndex={globalIndex}
                          onClick={openLightbox}
                        />
                      );
                    })}
                  </Masonry>
                </motion.div>

                {/* Pagination */}
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
          <Lightbox
            item={filteredGallery[lightboxIndex]}
            index={lightboxIndex}
            total={filteredGallery.length}
            onClose={closeLightbox}
            onPrev={() => navigateLightbox(-1)}
            onNext={() => navigateLightbox(1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
