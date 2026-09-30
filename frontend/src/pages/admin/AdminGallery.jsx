import { useState, useRef, useEffect } from "react";
import galleryService from "@/services/galleryService";
import {
  Search,
  Trash2,
  Eye,
  UploadCloud,
  Image as ImageIcon,
  FolderOpen,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  HardDrive,
  Download,
  Folder
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/socket";
import "@/styles/admin.css";

const categories = ["Shipping", "Logistics", "Workshop", "Events", "Others"];

const AdminGallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch all media
  const fetchGallery = async () => {
    try {
      const data = await galleryService.getAll();
      setImages(data);
    } catch (error) {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();

    const handleAdded = (newItem) => {
      setImages(prev => {
        if (prev.some(img => img.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    };

    const handleUpdated = (updatedItem) => {
      setImages(prev => prev.map(img => img.id === updatedItem.id ? updatedItem : img));
    };

    const handleDeleted = ({ id }) => {
      setImages(prev => prev.filter(img => img.id !== id));
    };

    socket.on("gallery:imageAdded", handleAdded);
    socket.on("gallery:imageUpdated", handleUpdated);
    socket.on("gallery:imageDeleted", handleDeleted);

    return () => {
      socket.off("gallery:imageAdded", handleAdded);
      socket.off("gallery:imageUpdated", handleUpdated);
      socket.off("gallery:imageDeleted", handleDeleted);
    };
  }, []);

  // Format bytes helper
  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === undefined || bytes === null) return "—";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Format Date helper
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Filter media based on search & category
  const filteredMedia = images.filter((img) => {
    const matchesCategory =
      activeCategory === "All" || img.category === activeCategory;
    
    const displayName = img.name || img.image_url?.split("/").pop() || "";
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Handle image delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset permanently?")) return;
    try {
      await galleryService.delete(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Asset deleted successfully");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // Handle Multi-file Upload
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} asset(s) to Dubai Hub...`);
    
    const category = activeCategory === "All" ? "Others" : activeCategory;
    
    try {
      // Use uploadFiles multi-upload service method
      await galleryService.uploadFiles(files, category);
      await fetchGallery();
      toast.success("Asset(s) uploaded successfully!", { id: toastId });
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Start renaming inline
  const startRename = (media) => {
    setEditingId(media.id);
    setEditName(media.name || media.image_url?.split("/").pop() || "");
  };

  // Save rename inline
  const saveRename = async (id) => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await galleryService.update(id, { name: editName.trim() });
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, name: editName.trim() } : img))
      );
      setEditingId(null);
      toast.success("Asset renamed");
    } catch (error) {
      toast.error("Rename failed");
    }
  };

  // Change category of an asset
  const handleCategoryChange = async (id, newCategory) => {
    try {
      await galleryService.update(id, { category: newCategory });
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, category: newCategory } : img))
      );
      toast.success(`Moved to ${newCategory}`);
    } catch (error) {
      toast.error("Failed to move asset");
    }
  };

  // Lightbox keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % filteredMedia.length);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredMedia]);

  if (loading) {
    return (
      <div className="admin-loading">
        <span>Loading Media Vault...</span>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s ease", paddingBottom: "48px" }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Media Assets</h1>
          <p className="admin-page-subtitle">
            Manage high-res machinery inventory, workshop, and logistics imagery.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
          disabled={uploading}
        >
          <UploadCloud size={17} />
          {uploading ? "Uploading..." : "Upload Assets"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* ── Upload Drop Zone ── */}
      <div
        className={`upload-zone flex flex-col items-center justify-center p-10 mb-7 ${
          isDragging ? "dragging" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "#FEF9EC",
            color: "#F5B301",
          }}
        >
          <UploadCloud size={24} />
        </div>
        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#111827",
            marginBottom: "4px",
          }}
        >
          Drag & Drop multiple files here
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#64748B",
            textAlign: "center",
            maxWidth: "350px",
          }}
        >
          Supports bulk selection of high-res operational photos. PNG, JPG up to 10MB.
        </p>
      </div>

      {/* ── Category Filter + Search ── */}
      <div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-7"
        style={{
          background: "#ffffff",
          border: "1px solid #EAECEF",
          borderRadius: "22px",
          padding: "14px 20px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        {/* Category tabs */}
        <div
          className="flex p-1 overflow-x-auto"
          style={{
            background: "#F1F3F7",
            borderRadius: "14px",
            gap: "2px",
          }}
        >
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeCategory === cat ? "#ffffff" : "transparent",
                color: activeCategory === cat ? "#111827" : "#64748B",
                boxShadow:
                  activeCategory === cat
                    ? "0 2px 8px rgba(15,23,42,0.08)"
                    : "none",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="relative"
          style={{ width: "100%", maxWidth: "300px" }}
        >
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2"
            size={15}
            style={{ color: "#94A3B8" }}
          />
          <input
            type="text"
            placeholder="Search images or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: "40px", height: "42px" }}
          />
        </div>
      </div>

      {/* ── Image Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedia.map((media, index) => {
          const isEditing = editingId === media.id;
          const name = media.name || media.image_url?.split("/").pop() || "";
          
          return (
            <div
              key={media.id}
              className="group overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid #EAECEF",
                borderRadius: "22px",
                boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 18px 40px rgba(15,23,42,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(15,23,42,0.04)";
              }}
            >
              {/* Image & Action Overlay */}
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: "4/3", background: "#F8FAFC" }}
              >
                <img
                  src={media.image_url}
                  alt={name}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.6s ease",
                  }}
                  className="group-hover:scale-105"
                />

                {/* Hover overlay with main quick actions */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3"
                  style={{ background: "rgba(17,24,39,0.6)" }}
                >
                  <button
                    onClick={() => setLightboxIndex(index)}
                    title="View Fullscreen"
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F5B301";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <Eye size={18} />
                  </button>
                  
                  <a
                    href={media.image_url}
                    download={name}
                    target="_blank"
                    rel="noreferrer"
                    title="Download Original"
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F5B301";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <Download size={18} />
                  </a>

                  <button
                    onClick={() => handleDelete(media.id)}
                    title="Delete permanently"
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EF4444";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "#111827";
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Category label badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="admin-label-small"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(4px)",
                      color: "#1F2937",
                      borderRadius: "8px",
                      padding: "4px 10px",
                      fontSize: "9px",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.1)",
                    }}
                  >
                    {media.category}
                  </span>
                </div>
              </div>

              {/* Asset Information Card Body */}
              <div
                className="p-5 flex-1 flex flex-col justify-between"
                style={{ borderTop: "1px solid #F1F3F7", gap: 12 }}
              >
                {/* Title and rename toggle */}
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="admin-input"
                        style={{ height: "32px", padding: "4px 8px", fontSize: "12px", flex: 1 }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(media.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => saveRename(media.id)}
                        className="flex items-center justify-center bg-emerald-500 text-white rounded-lg"
                        style={{ width: "32px", height: "32px", border: "none", cursor: "pointer" }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg"
                        style={{ width: "32px", height: "32px", border: "none", cursor: "pointer" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#1F2937",
                          margin: 0,
                          lineHeight: 1.3,
                          wordBreak: "break-all",
                          flex: 1,
                        }}
                        title={name}
                      >
                        {name}
                      </h4>
                      <button
                        onClick={() => startRename(media)}
                        title="Rename file"
                        className="text-gray-400 hover:text-primary transition-colors"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata info */}
                <div className="space-y-1.5 pt-2" style={{ borderTop: "1px dashed #E5E7EB" }}>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Calendar size={12} className="text-gray-400 shrink-0" />
                    <span>Uploaded:</span>
                    <span className="font-semibold text-gray-700 ml-auto">
                      {formatDate(media.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <HardDrive size={12} className="text-gray-400 shrink-0" />
                    <span>File Size:</span>
                    <span className="font-semibold text-gray-700 ml-auto">
                      {formatBytes(media.size)}
                    </span>
                  </div>
                  
                  {/* Category Dropdown (inline change) */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                    <Folder size={12} className="text-gray-400 shrink-0" />
                    <span>Move to:</span>
                    <select
                      value={media.category || "Others"}
                      onChange={(e) => handleCategoryChange(media.id, e.target.value)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#4B5563",
                        background: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        padding: "2px 4px",
                        cursor: "pointer",
                        outline: "none",
                        marginLeft: "auto"
                      }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filteredMedia.length === 0 && (
          <div
            className="col-span-full admin-empty-state"
            style={{ gridColumn: "1 / -1" }}
          >
            <div className="admin-empty-icon">
              <FolderOpen size={28} />
            </div>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                color: "#111827",
                marginBottom: "6px",
              }}
            >
              No media assets found
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                color: "#64748B",
              }}
            >
              Try updating your category filter or search keywords.
            </p>
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxIndex !== null && filteredMedia[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 10, 12, 0.95)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {/* Header Controls */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "24px",
              right: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#ffffff",
              zIndex: 10000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>
                {filteredMedia[lightboxIndex].name || filteredMedia[lightboxIndex].image_url?.split("/").pop()}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9CA3AF", fontFamily: "'Inter', sans-serif" }}>
                Image {lightboxIndex + 1} of {filteredMedia.length} &bull; {filteredMedia[lightboxIndex].category}
              </p>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#ffffff",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxHeight: "80vh",
              gap: "20px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#ffffff",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F5B301"; e.currentTarget.style.color = "#111827"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.color = "#ffffff"; }}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Target Image wrapper */}
            <div
              style={{
                position: "relative",
                maxWidth: "calc(100% - 140px)",
                maxHeight: "80vh",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                background: "#000000"
              }}
            >
              <img
                src={filteredMedia[lightboxIndex].image_url}
                alt="Fullscreen Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* Next Arrow */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev + 1) % filteredMedia.length)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#ffffff",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F5B301"; e.currentTarget.style.color = "#111827"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.color = "#ffffff"; }}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              textAlign: "center",
              color: "#9CA3AF",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              zIndex: 10000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0 }}>
              Use <kbd style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: "4px" }}>&larr;</kbd> and <kbd style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: "4px" }}>&rarr;</kbd> keys to navigate. Press <kbd style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: "4px" }}>ESC</kbd> to exit.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminGallery;
