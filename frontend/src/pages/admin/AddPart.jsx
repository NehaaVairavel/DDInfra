import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import partService from "@/services/partService";
import {
  ArrowLeft, UploadCloud, Trash2, Image as ImageIcon,
  Send, Info, DollarSign, Eye,
  CheckCircle, Zap, RefreshCw,
  Settings, Tag, Wrench, LayoutGrid, Package
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency, CURRENCY_META } from "@/context/CurrencyContext";
import { usePartStore } from "@/store/usePartStore";
import {
  PARTS_MACHINE_TYPES,
  PARTS_BRANDS_BY_TYPE,
  PARTS_MODELS_BY_BRAND,
  PARTS_CATEGORIES
} from "@/data/partsData";
import "@/styles/admin.css";

/* ── Compatible Machines Chip Input ── */
const CompatibleMachinesInput = ({ value = [], onChange }) => {
  const [inputVal, setInputVal] = useState("");

  const addChip = (raw) => {
    const chips = raw.split(",").map(s => s.trim()).filter(Boolean);
    const unique = [...new Set([...value, ...chips])];
    onChange(unique);
    setInputVal("");
  };

  const removeChip = (idx) => onChange(value.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      addChip(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && value.length) {
      removeChip(value.length - 1);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        Compatible Machines <span style={{ fontWeight: 400, color: "#94A3B8" }}>(Optional)</span>
      </label>
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 12,
          background: "#FAFAFA", minHeight: 44, cursor: "text"
        }}
        onClick={() => document.getElementById("compat-input")?.focus()}
      >
        {value.map((chip, idx) => (
          <span key={idx} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8,
            padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#1D4ED8"
          }}>
            {chip}
            <button type="button" onClick={() => removeChip(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1D4ED8", lineHeight: 1, padding: 0, fontSize: 12 }}>×</button>
          </span>
        ))}
        <input
          id="compat-input"
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputVal.trim() && addChip(inputVal)}
          placeholder={value.length === 0 ? "Type model and press Enter or comma…" : ""}
          style={{
            flex: 1, minWidth: 160, border: "none", outline: "none",
            background: "transparent", fontFamily: "'Inter',sans-serif",
            fontSize: 12, color: "#374151"
          }}
        />
      </div>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Type a model name and press Enter or comma to add it as a chip.</p>
    </div>
  );
};

/* ── Status badge preview ── */
const STATUS_CFG = {
  in_stock:    { label: "In Stock",    bg: "linear-gradient(135deg,#22c55e,#16a34a)", shadow: "rgba(34,197,94,0.45)", pulse: true },
  coming_soon: { label: "Coming Soon", bg: "linear-gradient(135deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,0.40)", pulse: false },
  sold:        { label: "Sold",        bg: "linear-gradient(135deg,#ef4444,#b91c1c)", shadow: "rgba(239,68,68,0.40)", pulse: false },
};

const StatusPreview = ({ status }) => {
  const cfg = STATUS_CFG[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800,
      fontFamily: "'Inter',sans-serif", color: "#fff", textTransform: "uppercase",
      letterSpacing: "0.06em", background: cfg.bg,
      boxShadow: `0 4px 14px ${cfg.shadow}`,
      animation: cfg.pulse ? "badge-glow 2s ease-in-out infinite" : "none",
    }}>
      {cfg.pulse && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.9)", animation: "dot-pulse 1.8s ease-in-out infinite" }} />}
      {cfg.label}
    </span>
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
  const { formatPrice } = useCurrency();
  const price = parseFloat(String(formData.price).replace(/[^0-9.]/g, "")) || 0;
  const formattedPrice = formatPrice(price, formData.currency || "USD");
  const mainImg = images.length > 0 ? URL.createObjectURL(images[0]) : null;
  const isSold = formData.availability === "sold";
  const refNumber = formData.part_number || "REF-XXX";
  const displayPrice = formData.pricing_mode === "Ask For Price" || price === 0 ? "Ask For Price" : formattedPrice;

  return (
    <div className={`product-card group ${isSold ? "card-sold-state" : ""}`} style={{ pointerEvents: "none", opacity: isSold ? 0.75 : 1, display: "flex", flexDirection: "column" }}>
      <div className="product-card-image-section" style={{ position: "relative" }}>
        <div className={isSold ? "img-sold-overlay" : ""} style={{ width: "100%", height: "100%", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {mainImg ? (
            <img src={mainImg} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <ImageIcon size={40} color="#CBD5E1" />
          )}
        </div>
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <StatusPreview status={formData.availability} />
        </div>
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
          padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800,
          fontFamily: "'Inter',sans-serif", color: "#1E293B", textTransform: "uppercase",
          letterSpacing: "0.05em", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", zIndex: 10
        }}>
          {formData.condition || "New"}
        </div>
      </div>

      <div className="product-card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 className={`product-card-name ${isSold ? "text-slate-400" : ""}`}>{formData.name || "Part Name"}</h3>
          {formData.machine_type && (
            <div style={{
              padding: "4px 10px", border: "1.5px solid #f97316", color: "#ea580c",
              borderRadius: "8px", fontSize: "10px", fontWeight: "bold",
              letterSpacing: "0.05em", backgroundColor: "#fff",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", flexShrink: 0, textTransform: "uppercase"
            }}>
              {formData.machine_type}
            </div>
          )}
        </div>

        <div className="product-card-specs">
          {formData.brand ? <span className="flex items-center gap-1"><Tag size={11} />{formData.brand}</span> : <span className="flex items-center gap-1"><Tag size={11} />Brand</span>}
          <span className="separator">•</span>
          {formData.category ? <span className="flex items-center gap-1"><LayoutGrid size={11} />{formData.category}</span> : <span className="flex items-center gap-1"><LayoutGrid size={11} />Category</span>}
        </div>

        <div className="product-card-middle-section">
          <div>
            <div className="product-card-label">PART PRICE</div>
            {formData.pricing_mode === "Ask For Price" ? (
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
          </div>
        </div>
        
        <div className="admin-card-buttons">
          <button className="admin-btn admin-btn-edit" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Edit3 size={11} /> Edit
          </button>
          <button className="admin-btn admin-btn-delete" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Trash2 size={11} /> Delete
          </button>
          <div style={{ position: "relative", gridColumn: "1 / -1" }}>
            <button
              style={{
                width: "100%", height: 28, background: "transparent", border: "none", borderTop: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700,
                color: "#94A3B8", paddingTop: 4,
              }}
            >
              Update Status <ChevronDown size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function AddPart() {
  const { optimisticCreate } = usePartStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currencies } = useCurrency();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    part_number: "",
    machine_type: "",
    brand: "",
    model: "",
    category: "",
    condition: "New",
    availability: "in_stock",
    price: "",
    currency: "USD",
    pricing_mode: "Show Price",
    description: "",
    compatible_machines: [],
  });

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const videoInputRef = useRef(null);

  // Compute dependent dropdown options
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    if (formData.machine_type) {
      setAvailableBrands(PARTS_BRANDS_BY_TYPE[formData.machine_type] || []);
    } else {
      setAvailableBrands([]);
    }
  }, [formData.machine_type]);

  useEffect(() => {
    if (formData.brand && PARTS_MODELS_BY_BRAND[formData.brand]) {
      const brandData = PARTS_MODELS_BY_BRAND[formData.brand];
      // Try to get models specific to machine type, else get all, else empty
      const models = formData.machine_type ? brandData[formData.machine_type] : null;
      setAvailableModels(models || Object.values(brandData).flat());
    } else {
      setAvailableModels([]);
    }
  }, [formData.brand, formData.machine_type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "machine_type") {
        next.brand = "";
        next.model = "";
      }
      if (name === "brand") {
        next.model = "";
      }
      return next;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith("image/"));
    if (valid.length !== files.length) toast.error("Only images allowed");
    setImages(prev => [...prev, ...valid].slice(0, 20)); // max 10
    if (errors.images) setErrors(prev => ({ ...prev, images: undefined }));
  };
  
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith("video/"));
    if (valid.length !== files.length) toast.error("Only videos allowed");
    setVideos(prev => [...prev, ...valid].slice(0, 5)); // max 5 videos
    if (errors.videos) setErrors(prev => ({ ...prev, videos: undefined }));
  };

  const removeVideo = (idx) => {
    setVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Part name is required";
    if (!formData.part_number.trim()) errs.part_number = "Part number is required";
    if (!formData.machine_type) errs.machine_type = "Machine Type is required";
    if (!formData.brand) errs.brand = "Brand is required";
    if (!formData.category) errs.category = "Category is required";
    if (formData.pricing_mode !== "Ask For Price" && !formData.price) errs.price = "Price is required when Show Price is selected";
    if (images.length === 0) errs.images = "At least one image is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix form errors");
      const firstErr = document.querySelector(".admin-input[style*='EF4444'], .admin-select[style*='EF4444']");
      firstErr?.focus();
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving spare part...");

    try {
      // 1. Upload images & videos
      let finalImages = [];
      if (images.length > 0) {
        const uploadRes = await partService.uploadImages(images);
        if (!uploadRes.urls || uploadRes.urls.length === 0) throw new Error("Failed to upload images");
        finalImages = uploadRes.urls;
      }
      
      let finalVideos = [];
      if (videos.length > 0) {
        const vidRes = await partService.uploadVideos(videos);
        if (vidRes.urls) finalVideos = vidRes.urls;
      }

      

      // 2. Prepare payload
      const payload = {
        ...formData,
        images: finalImages,
        image: finalImages[0] || null,
        videos: finalVideos,
        price: formData.pricing_mode === "Ask For Price" ? "" : String(formData.price).replace(/,/g, ""),
        compatible_machines: Array.isArray(formData.compatible_machines)
          ? formData.compatible_machines
          : formData.compatible_machines.split(",").map(s => s.trim()).filter(Boolean)
      };

      // 3. Save part
      const created = await partService.create(payload);
      optimisticCreate(created);

      toast.success("Spare part added successfully!", { id: loadingToast });
      navigate("/admin/parts");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save part", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease", maxWidth: 1300, margin: "0 auto", paddingBottom: 80 }}>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between py-4 mb-6"
        style={{ background: "#F6F7FB", borderBottom: "1px solid #EAECEF", marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/parts")} className="flex items-center justify-center transition-all"
            style={{ width: 38, height: 38, borderRadius: 11, background: "#fff", border: "1px solid #EAECEF", color: "#64748B", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#F5B301"; e.currentTarget.style.color = "#F5B301"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#EAECEF"; e.currentTarget.style.color = "#64748B"; }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Add New Spare Part</h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Create a premium spare part listing for the catalog
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/admin/parts")} className="admin-btn-outline h-11 px-5" disabled={isSubmitting} style={{ borderRadius: 12 }}>
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="btn-accent flex items-center gap-2"
            style={{
              opacity: isSubmitting ? 0.8 : 1,
              background: isSubmitting ? "#94A3B8" : undefined,
              transition: "all 0.25s ease",
            }}
          >
            {isSubmitting
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Publishing...</>
              : <><Send size={15} /> Publish Part</>}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* Left Column (Forms) */}
        <div className="flex-1 w-full flex flex-col gap-5">
          
          <Section id="basic" title="Basic Information" icon={Settings}>
            <Input label="Part Name" name="name" value={formData.name} onChange={handleChange} required error={errors.name} placeholder="e.g. Excavator Main Hydraulic Pump" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Input label="Part Number" name="part_number" value={formData.part_number} onChange={handleChange} required error={errors.part_number} placeholder="e.g. 384-0678" hint="OEM or Aftermarket part number" />
              <Select label="Condition" name="condition" value={formData.condition} onChange={handleChange} options={["New", "Used", "Refurbished", "Aftermarket"]} />
            </div>
          </Section>

          <Section id="hierarchy" title="Machine Fitment" subtitle="Specify which machine this part belongs to" icon={Wrench}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
              <Select label="Machine Type" name="machine_type" value={formData.machine_type} onChange={handleChange} required error={errors.machine_type} options={PARTS_MACHINE_TYPES} />
              <Select label="Brand" name="brand" value={formData.brand} onChange={handleChange} required error={errors.brand} options={availableBrands} disabled={!formData.machine_type} />
              <Select label="Machine Model" name="model" value={formData.model} onChange={handleChange} options={availableModels} disabled={!formData.brand || availableModels.length === 0} hint="Leave blank if universal fit" />
            </div>
            <Input label="Compatible Machines — Manual Override (comma-separated)" name="compatible_machines_text" value="" onChange={() => {}} style={{ display: 'none' }} />
            <CompatibleMachinesInput
              value={Array.isArray(formData.compatible_machines) ? formData.compatible_machines : []}
              onChange={(chips) => setFormData(prev => ({ ...prev, compatible_machines: chips }))}
            />
          </Section>

          <Section id="details" title="Categorization & Pricing" icon={LayoutGrid}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Select label="Category" name="category" value={formData.category} onChange={handleChange} required error={errors.category} options={PARTS_CATEGORIES} />
              <Select label="Availability" name="availability" value={formData.availability} onChange={handleChange} options={[
                { id: "in_stock", name: "In Stock" },
                { id: "coming_soon", name: "Coming Soon" },
                { id: "sold", name: "Previously Sold" },
              ]} />
            </div>
            <div className="mt-4">
              <Select label="Pricing Mode" name="pricing_mode" value={formData.pricing_mode} onChange={handleChange} options={["Show Price", "Ask For Price"]} />
              {formData.pricing_mode !== "Ask For Price" ? (
                <div className="grid grid-cols-[100px_1fr] gap-x-4">
                  <Select label="Currency" name="currency" value={formData.currency} onChange={handleChange} options={currencies?.map(c => c.code) || ["USD", "AED"]} />
                  <Input label="Price" name="price" type="text" value={formData.price} onChange={handleChange} required error={errors.price} placeholder="e.g. 1500" hint="Numbers only" />
                </div>
              ) : (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={16} color="#1D4ED8" />
                  <span style={{ fontSize: 13, color: "#1D4ED8" }}>Price will be hidden. Users must inquire.</span>
                </div>
              )}
            </div>
          </Section>

          <Section id="media" title="Media & Images" subtitle="First image will be the cover" icon={ImageIcon}>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-[20px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${errors.images ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/50"}`}
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-primary">
                <UploadCloud size={24} />
              </div>
              <p className="font-sora font-bold text-[15px] text-heading mb-1">Click to upload images</p>
              <p className="font-inter text-[12px] font-medium text-slate-500">JPG, PNG, WebP up to 5MB (Max 20)</p>
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} multiple accept="image/*" className="hidden" />
            </div>
            {errors.images && <p className="text-[12px] text-red-500 font-bold mt-2 text-center">⚠ {errors.images}</p>}

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-5">
                {images.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-[14px] overflow-hidden bg-slate-100 border border-slate-200 group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section id="content" title="Description" icon={Info}>
            <div style={{ marginBottom: 16 }}>
              <div className="flex justify-between mb-1">
                <label style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151" }}>Detailed Description</label>
                <span style={{ fontSize: 11, color: (formData.description || "").length > 1000 ? "#EF4444" : "#94A3B8" }}>{(formData.description || "").length} / 1000</span>
              </div>
              <textarea
                className="admin-input"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe the condition, exact fitment details, warranty, etc."
                maxLength={1000}
                style={{ resize: "vertical", minHeight: 120, borderColor: (formData.description || "").length >= 1000 ? "#EF4444" : undefined }}
              />
            </div>
          </Section>
        </div>

        {/* Right Column (Preview & Nav) */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
          <div className="sticky top-24">
            <h3 className="font-sora font-bold text-[14px] text-slate-800 mb-4 flex items-center gap-2">
              <Eye size={16} className="text-primary" /> Live Preview
            </h3>
            <PreviewCard formData={formData} images={images} />
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-6">
              <h4 className="text-[13px] font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Info size={14} /> Quick Tips
              </h4>
              <ul className="text-[11px] font-medium text-blue-800 space-y-2">
                <li>• Ensure the <strong className="font-bold">Part Number</strong> matches the OEM spec exactly.</li>
                <li>• Use <strong className="font-bold">Compatible Machines</strong> to list out every model this fits if it's a cross-model part.</li>
                <li>• The first image you upload will be the cover photo in the gallery.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
