import { useState, useRef, useEffect } from "react";

import { useNavigate, useParams } from "react-router-dom";
import productService from "@/services/productService";
import {
  ArrowLeft, UploadCloud, Trash2, Image as ImageIcon,
  Save, Info, DollarSign, MapPin, Clock, Eye,
  CheckCircle, Zap, RefreshCw, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency, CURRENCY_META } from "@/context/CurrencyContext";
import { useProductStore } from "@/store/useProductStore";
import "@/styles/admin.css";

/* ── Status badge preview ── */
const StatusPreview = ({ status }) => {
  const cfg = {
    in_stock:    { label: "In Stock",    bg: "linear-gradient(135deg,#22c55e,#16a34a)", shadow: "rgba(34,197,94,0.4)" },
    coming_soon: { label: "Coming Soon", bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,0.35)" },
    sold:        { label: "Sold",        bg: "linear-gradient(135deg,#ef4444,#b91c1c)", shadow: "rgba(239,68,68,0.35)" },
  }[status];
  if (!cfg) return null;
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800,
      fontFamily: "'Inter',sans-serif", color: "#fff", textTransform: "uppercase",
      letterSpacing: "0.06em", background: cfg.bg,
      boxShadow: `0 4px 12px ${cfg.shadow}`,
    }}>{cfg.label}</span>
  );
};

/* ── Section wrapper ── */
const Section = ({ title, subtitle, icon: Icon, children, id }) => (
  <div id={id} className="admin-card mb-5" style={{ borderRadius: 24, padding: "22px 24px" }}>
    <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid #F1F3F7" }}>
      <div className="flex items-center justify-center shrink-0"
        style={{ width: 34, height: 34, borderRadius: 10, background: "#FEF9EC", color: "#F5B301" }}>
        <Icon size={16} />
      </div>
      <div>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8", margin: "2px 0 0", fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

/* ── Validated Input ── */
const Input = ({ label, required, error, hint, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    <input
      className="admin-input"
      style={{ borderColor: error ? "#EF4444" : undefined, boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.1)" : undefined }}
      {...props}
    />
    {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</p>}
    {hint && !error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{hint}</p>}
  </div>
);

/* ── Select ── */
const Select = ({ label, required, options, error, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    <select className="admin-select"
      style={{ borderColor: error ? "#EF4444" : undefined }}
      {...props}>
      <option value="">Select {label}</option>
      {options && options.filter(Boolean).map(opt => (
        <option key={opt?.id || opt} value={opt?.id || opt}>{opt?.name || opt}</option>
      ))}
    </select>
    {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</p>}
  </div>
);

/* ── Live Preview Card ── */
const PreviewCard = ({ formData, images }) => {
  const price = parseFloat(String(formData.price).replace(/[^0-9.]/g, "")) || 0;
  const symbol = CURRENCY_META[formData.currency]?.symbol || "$";
  const isSold = formData.availability === "sold";

  return (
    <div style={{
      background: "#fff", borderRadius: 20, border: "1px solid #EEF1F5",
      boxShadow: "0 8px 32px rgba(15,23,42,0.08)", overflow: "hidden",
    }}>
      {/* Image */}
      <div style={{ height: 160, background: "#F1F5F9", position: "relative", overflow: "hidden" }}>
        {images[0] ? (
          <img src={images[0]} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: isSold ? "grayscale(80%)" : "none",
          }} />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: "#CBD5E1" }}>
            <ImageIcon size={36} />
          </div>
        )}
        {/* Status badge */}
        {formData.availability && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <StatusPreview status={formData.availability} />
          </div>
        )}
        {/* Year badge */}
        {formData.year && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "#fff", borderRadius: 999, padding: "4px 10px",
            fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700,
            color: "#111827", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>{formData.year}</div>
        )}
        {/* Image count */}
        {images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)",
            borderRadius: 999, padding: "3px 8px",
            fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, color: "#fff",
          }}>+{images.length - 1} more</div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
          {formData.brand || "Brand"} · {formData.category || "Category"}
        </p>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px", lineHeight: 1.2 }}>
          {formData.name || "Product Name"}
        </h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          {formData.engine_hours && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8" }}>
              <Clock size={10} /> {formData.engine_hours} Hrs
            </span>
          )}
          {formData.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8" }}>
              <MapPin size={10} /> {formData.location.split(",")[0]}
            </span>
          )}
        </div>
        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Export Price</p>
          <p style={{
            fontFamily: "'Sora',sans-serif", fontSize: formData.pricing_mode === "Ask For Price" ? 14 : 20, fontWeight: 800,
            color: isSold ? "#94A3B8" : "#F5B301",
            textDecoration: isSold ? "line-through" : "none", margin: 0,
          }}>
            {formData.pricing_mode === "Ask For Price" ? "PRICE ON REQUEST" : (price > 0 ? `${symbol}${price.toLocaleString()}` : "—")}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Main EditProduct Page ── */
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { optimisticUpdate } = useProductStore();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const { convertAll, ratesLoaded, rateDate } = useCurrency();

  // Existing images from server
  const [existingImages, setExistingImages] = useState([]);
  // New local files
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  // Unified display order: { type: 'existing'|'new', src, file? }
  const [imagesOrder, setImagesOrder] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [formData, setFormData] = useState({
    name: "", brand: "", model: "", year: "", category: "",
    condition: "Used", price: "", currency: "USD", pricing_mode: "Show Price",
    engine_hours: "", availability: "",
    location: "Dubai, UAE", full_description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [product, cats] = await Promise.all([
          productService.getById(id),
          productService.getCategories(),
        ]);

        setFormData({
          name: product.name || "",
          brand: product.brand || "",
          model: product.model || "",
          year: product.year || "",
          category: product.category || "",
          condition: product.condition || "Used",
          price: product.price || "",
          currency: product.currency || "USD",
          pricing_mode: product.pricing_mode || "Show Price",
          engine_hours: product.engine_hours || "",
          availability: product.availability || "",
          location: product.location || "Dubai, UAE",
          full_description: product.full_description || "",
        });

        // Strip ?v=... version params added by the backend serializer before storing.
        // Without this, each save cycle re-embeds the version param into the DB URL,
        // causing successive edits to accumulate ?v=...?v=... and break the image.
        const stripVersion = (url) => (url ? url.split("?")[0] : url);
        const imgs = product.images?.length > 0
          ? [...product.images].map(stripVersion)
          : product.image ? [stripVersion(product.image)] : [];
        const uniqueImgs = [...new Set(imgs.filter(Boolean))];
        setExistingImages(uniqueImgs);
        // Build unified order from existing images
        setImagesOrder(uniqueImgs.map(src => ({ type: 'existing', src })));
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        toast.error("Failed to load product");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleNewFiles = (files) => {
    const newFiles = Array.from(files);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setNewImageFiles(prev => [...prev, ...newFiles]);
    setNewImagePreviews(prev => [...prev, ...previews]);
    // Append to unified order
    setImagesOrder(prev => [...prev, ...newFiles.map((file, i) => ({ type: 'new', src: previews[i], file }))]);
    toast.success(`${newFiles.length} image(s) added`);
  };

  const removeImageByIndex = (idx) => {
    if (imagesOrder.length <= 1) { toast.error("At least one image is required"); return; }
    const item = imagesOrder[idx];
    const newOrder = imagesOrder.filter((_, i) => i !== idx);
    setImagesOrder(newOrder);
    if (item.type === 'existing') {
      setExistingImages(prev => prev.filter(s => s !== item.src));
    } else {
      URL.revokeObjectURL(item.src);
      setNewImageFiles(prev => prev.filter(f => f !== item.file));
      setNewImagePreviews(prev => prev.filter(s => s !== item.src));
    }
  };

  /* ── Drag & Drop reorder helpers ── */
  const handleDragStart = (idx) => setDragIndex(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIndex(idx); };
  const handleDrop = (idx) => {
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    const newOrder = [...imagesOrder];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(idx, 0, moved);
    setImagesOrder(newOrder);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const moveImage = (from, to) => {
    if (to < 0 || to >= imagesOrder.length) return;
    const newOrder = [...imagesOrder];
    [newOrder[from], newOrder[to]] = [newOrder[to], newOrder[from]];
    setImagesOrder(newOrder);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name) errs.name = "Product name is required";
    if (!formData.category) errs.category = "Category is required";
    const CURRENT_YEAR = new Date().getFullYear();
    const MAX_YEAR = CURRENT_YEAR + 2;
    if (!formData.year) errs.year = "Year is required";
    if (formData.year && (formData.year < 1980 || formData.year > MAX_YEAR)) errs.year = `Enter a valid year (1980–${MAX_YEAR})`;
    if (!formData.engine_hours) errs.engine_hours = "Engine hours required";
    if (!formData.price && formData.pricing_mode !== "Ask For Price") errs.price = "Price is required";
    if (!formData.availability) errs.availability = "Status is required";
    if (imagesOrder.length === 0) errs.images = "At least one image required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // ── Step 1: Upload new images ──
      let uploadedUrls = [];
      // Identify new files in the current imagesOrder
      const newItemsInOrder = imagesOrder.filter(item => item.type === 'new');
      if (newItemsInOrder.length > 0) {
        const filesToUpload = newItemsInOrder.map(item => item.file);
        const uploadToast = toast.loading(`Uploading ${filesToUpload.length} new image${filesToUpload.length > 1 ? "s" : ""}...`);
        try {
          const res = await productService.uploadImages(filesToUpload);
          toast.dismiss(uploadToast);

          if (!res || !Array.isArray(res.urls)) {
            throw new Error("Image upload failed — invalid server response.");
          }

          uploadedUrls = res.urls.filter(Boolean);

          if (res.failed && res.failed.length > 0) {
            toast.warning(`${res.failed.length} image(s) failed to upload and were skipped.`);
          }

          if (uploadedUrls.length > 0) {
            toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded ✓`);
          }
        } catch (uploadErr) {
          toast.dismiss(uploadToast);
          const uploadMsg =
            uploadErr?.response?.data?.message ||
            uploadErr?.response?.data?.error ||
            uploadErr?.message ||
            "Image upload failed. Please try again.";
          toast.error(`✕ ${uploadMsg}`);
          setSubmitting(false);
          return;
        }
      }

      // ── Step 2: Build final ordered image list ──
      // Replace 'new' type items with the uploaded URLs, preserving visual order
      let uploadIdx = 0;
      const stripVer = (url) => (url ? url.split("?")[0] : url);
      const allImages = imagesOrder.map(item => {
        if (item.type === 'existing') return stripVer(item.src);
        return stripVer(uploadedUrls[uploadIdx++] || null);
      }).filter(Boolean);
      const payload = {
        ...formData,
        price: formData.pricing_mode === "Ask For Price" ? "" : formData.price,
        currency: formData.pricing_mode === "Ask For Price" ? "" : formData.currency,
        images: allImages,
        image: allImages[0] || null,
        updated_at: new Date().toISOString(),
      };

      const saveToast = toast.loading("Saving changes...");
      try {
        const updated = await productService.update(id, payload);
        toast.dismiss(saveToast);

        // Instant UI sync across all subscribed pages
        if (updated?.id) optimisticUpdate(updated);
        toast.success("✓ Product updated successfully!", {
          description: "Changes are live across the marketplace.",
          duration: 3500,
        });
        navigate("/admin/products");
      } catch (saveErr) {
        toast.dismiss(saveToast);
        const errMsg =
          saveErr?.response?.data?.message ||
          saveErr?.response?.data?.error ||
          saveErr?.message ||
          "Failed to update product. Please try again.";
        toast.error(`✕ ${errMsg}`);
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "An unexpected error occurred.";
      toast.error(`✕ ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const priceNum = parseFloat(String(formData.price).replace(/[^0-9.]/g, "")) || 0;
  const conversions = priceNum > 0 ? convertAll(priceNum, formData.currency) : [];
  const descLen = (formData.full_description || "").length;
  const previewImages = imagesOrder.map(item => item.src);

  if (loading) return <div className="admin-loading"><span>Loading Product…</span></div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease", maxWidth: 1300, margin: "0 auto", paddingBottom: 80 }}>

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between py-4 mb-6"
        style={{ background: "#F6F7FB", borderBottom: "1px solid #EAECEF", marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center transition-all"
            style={{ width: 38, height: 38, borderRadius: 11, background: "#fff", border: "1px solid #EAECEF", color: "#64748B", cursor: "pointer" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Edit Equipment</h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Update listing for: {formData.name || "Product"}
            </p>
          </div>
        </div>
        <button disabled={submitting} onClick={handleSubmit} className="btn-accent flex items-center gap-2"
          style={{ opacity: submitting ? 0.65 : 1 }}>
          <Save size={15} />
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Section id="basic" title="Machine Specifications" subtitle="Core details shown on public marketplace" icon={Info}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Input label="Product Name" name="name" value={formData.name} onChange={handleInputChange} required error={errors.name} />
              <Select label="Category" name="category" value={formData.category} onChange={handleInputChange} options={categories} required error={errors.category} />
              <Input label="Brand" name="brand" value={formData.brand} onChange={handleInputChange} />
              <Input label="Model Number" name="model" value={formData.model} onChange={handleInputChange} />
              <Input label="Year" name="year" type="number" value={formData.year} onChange={handleInputChange} 
                required error={errors.year} />
              <Select label="Condition" name="condition" value={formData.condition} onChange={handleInputChange} options={["New", "Used", "Refurbished"]} required />
              <Input label="Engine Hours" name="engine_hours" type="number" value={formData.engine_hours} onChange={handleInputChange} required error={errors.engine_hours} />
              <Input label="Location" name="location" value={formData.location} onChange={handleInputChange} required error={errors.location} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Select label="Availability Status" name="availability" value={formData.availability} onChange={handleInputChange}
                  options={[{ id: "in_stock", name: "In Stock" }, { id: "coming_soon", name: "Coming Soon" }, { id: "sold", name: "Sold" }]}
                  required error={errors.availability} />
                {formData.availability && <div className="flex items-center gap-2 mt-1 mb-2"><StatusPreview status={formData.availability} /></div>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Description</label>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{descLen} / 1000</span>
              </div>
              <textarea name="full_description" value={formData.full_description} onChange={handleInputChange} className="admin-textarea" maxLength={1000} style={{ height: 100 }} />
            </div>
          </Section>

          <Section id="pricing" title="Pricing & Visibility" subtitle="Live-converted price shown to global buyers" icon={DollarSign}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Select label="Pricing Mode" name="pricing_mode" value={formData.pricing_mode} onChange={handleInputChange} options={[{ id: "Show Price", name: "Show Price" }, { id: "Ask For Price", name: "Ask For Price" }]} required />
              
              {formData.pricing_mode !== "Ask For Price" ? (
                <>
                  <Input label="Price" name="price" value={formData.price} onChange={handleInputChange} type="text" error={errors.price} />
                  <Select label="Currency" name="currency" value={formData.currency} onChange={handleInputChange} options={[{ id: "USD", name: "USD $" }, { id: "AED", name: "AED د.إ" }, { id: "EUR", name: "EUR €" }, { id: "INR", name: "INR ₹" }]} required />
                </>
              ) : (
                <div style={{ gridColumn: "1 / -1", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px", marginTop: "8px" }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#1D4ED8", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Info size={16} />
                    Price will not be displayed publicly. Customers will submit a price request and your team will handle the enquiry manually.
                  </p>
                </div>
              )}
            </div>
            {conversions.length > 0 && formData.pricing_mode !== "Ask For Price" && (
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}><Zap size={10} style={{ display: "inline", marginRight: 4 }} />Live Conversion Preview</p>
                  <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}><RefreshCw size={9} style={{ marginRight: 4 }} />{ratesLoaded && rateDate ? `Updated ${rateDate.toLocaleDateString()}` : "Loading..."}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {conversions.map(({ currency, symbol, flag, value }) => (
                    <div key={currency} style={{ background: "#fff", borderRadius: 8, padding: "6px 12px", border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 11, marginRight: 4 }}>{flag}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{currency} </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{symbol}{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section id="media" title="Media Gallery" subtitle="Drag to reorder — first image is the cover" icon={ImageIcon}>
            {imagesOrder.length <= 1 && (
              <div className="flex items-start gap-2 mb-3 p-2 rounded-lg" style={{ background: "#FEF9EC", border: "1px solid #FDE68A" }}>
                <AlertTriangle size={13} style={{ color: "#D97706", marginTop: 2 }} />
                <p style={{ fontSize: 11, color: "#92400E" }}>Min 1 image required.</p>
              </div>
            )}
            <div className={`upload-zone flex flex-col items-center justify-center p-6 mb-4 ${isDragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleNewFiles(e.dataTransfer.files); }}>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={e => e.target.files && handleNewFiles(e.target.files)} />
              <UploadCloud size={24} style={{ color: "#F5B301", marginBottom: 8 }} />
              <p style={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>Add Images</p>
            </div>

            {/* Unified draggable image grid */}
            {imagesOrder.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 5 }}>Drag to reorder · first = cover</p>
                <div className="grid grid-cols-3 gap-2">
                  {imagesOrder.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative group"
                      style={{
                        aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                        border: dragOverIndex === idx ? "2px dashed #F5B301" : item.type === 'new' ? "1px solid #86EFAC" : "1px solid #EAECEF",
                        opacity: dragIndex === idx ? 0.45 : 1,
                        cursor: "grab",
                        transition: "border 0.15s, opacity 0.15s",
                      }}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                    >
                      <img src={item.src} className="w-full h-full object-cover" alt="" />
                      {/* COVER badge */}
                      {idx === 0 && (
                        <div style={{ position: "absolute", top: 2, left: 2, background: "#F5B301", borderRadius: 4, padding: "1px 4px", fontSize: 7, fontWeight: 800, color: "#111827" }}>COVER</div>
                      )}
                      {/* NEW badge */}
                      {item.type === 'new' && (
                        <div style={{ position: "absolute", top: 2, right: 20, background: "#22C55E", borderRadius: 4, padding: "1px 4px", fontSize: 7, fontWeight: 800, color: "#fff" }}>NEW</div>
                      )}
                      {/* Remove */}
                      <button type="button" onClick={() => removeImageByIndex(idx)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ width: 18, height: 18, borderRadius: 4, background: "#EF4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={9} />
                      </button>
                      {/* Left/Right arrows */}
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}
                          style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <button type="button" onClick={() => moveImage(idx, idx + 1)} disabled={idx === imagesOrder.length - 1}
                          style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", cursor: idx === imagesOrder.length - 1 ? "not-allowed" : "pointer", opacity: idx === imagesOrder.length - 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section id="preview" title="Public Card Preview" subtitle="Real-time look on the marketplace" icon={Eye}>
            <PreviewCard formData={formData} images={previewImages} />
          </Section>

          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 16, padding: "16px" }}>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} style={{ color: "#16A34A", marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, color: "#15803D", margin: 0 }}>Changes Live Instantly</p>
                <p style={{ fontSize: 11, color: "#16A34A", opacity: 0.85, margin: "2px 0 0" }}>Saved updates reflect globally across all pages immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
};

export default EditProduct;
