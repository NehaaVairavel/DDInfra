import { useState, useRef, useEffect } from "react";
import heroMediaService from "@/services/heroMediaService";
import {
  UploadCloud,
  Trash2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  RefreshCw,
  X,
  GripVertical,
  Maximize,
  Minimize,
  Youtube,
  Link as LinkIcon,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/socket";
import "@/styles/admin.css";

// Dnd Kit Imports
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

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

const resolveUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${R2_PUBLIC_URL}/${url}`;
};

const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
    /youtube\.com\/shorts\/([^&?/\s]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// ─── Sortable Item Component ───
const SortableMediaItem = ({ item, index, setPreviewItem, handleToggleEnabled, handleToggleFit, handleDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : "auto",
    position: "relative",
  };

  const isYouTube = item.slider_type === "youtube" || item.media_type === "youtube";
  const isVideo = item.media_type === "video" && !isYouTube;
  const isContain = item.fit === "contain";

  // Thumbnail source
  let thumbnailSrc = "";
  if (isYouTube) {
    const vid = getYouTubeId(item.youtube_url || item.url);
    thumbnailSrc = item.thumbnail || (vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : "");
  } else {
    thumbnailSrc = resolveUrl(item.url);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-[18px] p-[14px] pr-[18px] flex items-center gap-4 transition-all duration-200 border-2 ${
        item.enabled ? "border-[#FDE68A]" : "border-[#EAECEF]"
      } ${isDragging ? "shadow-2xl scale-[1.02] border-primary ring-4 ring-primary/20" : "shadow-sm"} ${
        !item.enabled && !isDragging ? "opacity-55" : "opacity-100"
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical size={20} />
      </div>

      {/* Order Number */}
      <div className="flex flex-col items-center justify-center w-6">
        <span className="font-['Sora'] font-extrabold text-[13px] text-slate-800">
          {index + 1}
        </span>
      </div>

      {/* Thumbnail */}
      <div
        className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 cursor-pointer relative group"
        onClick={() => setPreviewItem(item)}
      >
        {isYouTube ? (
          <>
            <img src={thumbnailSrc} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play size={18} className="text-white" fill="white" />
            </div>
          </>
        ) : isVideo ? (
          <video src={thumbnailSrc} className="w-full h-full object-cover" muted playsInline />
        ) : (
          <img src={thumbnailSrc} alt={item.name} className={`w-full h-full ${isContain ? "object-contain bg-slate-200" : "object-cover"}`} loading="lazy" />
        )}
        {!isYouTube && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-['Inter'] uppercase tracking-widest border ${
            isYouTube
              ? "bg-red-50 text-red-700 border-red-200"
              : isVideo
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}>
            {isYouTube ? <Youtube size={9} /> : isVideo ? <Film size={9} /> : <ImageIcon size={9} />}
            {isYouTube ? "YouTube" : isVideo ? "Video" : "Image"}
          </span>
          {!item.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-['Inter'] uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
              Disabled
            </span>
          )}
        </div>
        <p className="font-['Inter'] font-semibold text-[13px] text-slate-900 m-0 truncate">
          {item.name}
        </p>
        <p className="font-['Inter'] text-[10px] text-slate-400 mt-0.5 mb-0">
          {new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Fit Toggle (Only for images) */}
        {!isVideo && !isYouTube && (
          <button
            onClick={() => handleToggleFit(item)}
            title={isContain ? "Switch to Cover Mode" : "Switch to Contain Mode"}
            className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-[#F6F7FB] text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {isContain ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        )}

        <button
          onClick={() => handleToggleEnabled(item)}
          title={item.enabled ? "Disable slide" : "Enable slide"}
          className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] border font-['Inter'] text-xs font-bold transition-all ${
            item.enabled
              ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] hover:bg-[#FEF3C7]"
              : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
          {item.enabled ? "Enabled" : "Disabled"}
        </button>

        <button
          onClick={() => handleDelete(item.id)}
          title="Delete"
          className="flex items-center justify-center w-[34px] h-[34px] rounded-[9px] border border-slate-200 bg-[#F6F7FB] text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};


// ─── Main Component ───
const AdminHeroMedia = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  // YouTube form state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeName, setYoutubeName] = useState("");
  const [addingYoutube, setAddingYoutube] = useState(false);
  const [showYoutubeForm, setShowYoutubeForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchItems = async () => {
    try {
      const data = await heroMediaService.getAll();
      setItems(data.sort((a, b) => a.order - b.order));
    } catch {
      toast.error("Failed to load hero media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const handleAdded = (item) => {
      setItems(prev => {
        if (prev.some(i => i.id === item.id)) return prev;
        return [...prev, item].sort((a,b) => a.order - b.order);
      });
    };
    const handleUpdated = (item) => {
      setItems(prev => {
        const newItems = prev.map(i => i.id === item.id ? item : i);
        return newItems.sort((a, b) => a.order - b.order);
      });
    };
    const handleDeleted = ({ id }) => {
      setItems(prev => prev.filter(i => i.id !== id));
    };

    socket.on("hero:added", handleAdded);
    socket.on("hero:updated", handleUpdated);
    socket.on("hero:deleted", handleDeleted);

    return () => {
      socket.off("hero:added", handleAdded);
      socket.off("hero:updated", handleUpdated);
      socket.off("hero:deleted", handleDeleted);
    };
  }, []);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);
    try {
      await heroMediaService.upload(files);
      toast.success(`${files.length} file(s) uploaded!`, { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Validate YouTube URL
  const getYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/,
      /youtube\.com\/shorts\/([^&?/\s]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddYouTube = async (e) => {
    e.preventDefault();
    const trimmed = youtubeUrl.trim();
    if (!trimmed) return;

    const videoId = getYouTubeId(trimmed);
    if (!videoId) {
      toast.error("Invalid YouTube URL. Please use a valid youtube.com or youtu.be link.");
      return;
    }

    setAddingYoutube(true);
    try {
      await heroMediaService.addYouTube({
        youtube_url: trimmed,
        name: youtubeName.trim() || `YouTube Video`,
      });
      toast.success("YouTube video added to slider!");
      setYoutubeUrl("");
      setYoutubeName("");
      setShowYoutubeForm(false);
    } catch {
      toast.error("Failed to add YouTube video");
    } finally {
      setAddingYoutube(false);
    }
  };

  const handleToggleEnabled = async (item) => {
    const updated = { ...item, enabled: !item.enabled };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try {
      await heroMediaService.update(item.id, { enabled: !item.enabled });
      toast.success(updated.enabled ? "Slide enabled" : "Slide disabled");
    } catch {
      toast.error("Failed to update");
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    }
  };

  const handleToggleFit = async (item) => {
    const newFit = item.fit === "contain" ? "cover" : "contain";
    const updated = { ...item, fit: newFit };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try {
      await heroMediaService.update(item.id, { fit: newFit });
      toast.success(`Display mode set to ${newFit}`);
    } catch {
      toast.error("Failed to update display mode");
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hero media item permanently?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await heroMediaService.delete(id);
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
      fetchItems();
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        const reordered = newArr.map((item, index) => ({ ...item, order: index }));
        Promise.all(reordered.map(item => heroMediaService.update(item.id, { order: item.order })))
          .catch(() => {
            toast.error("Failed to save new order");
            fetchItems();
          });
        return reordered;
      });
    }
  };

  if (loading) return <div className="admin-loading"><span>Loading Hero Media...</span></div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease", paddingBottom: 48 }}>
      {/* ─── Page Header ─── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Home Page Hero Banner</h1>
          <p className="admin-page-subtitle">
            Manage the main full-width banner slider on the homepage. Upload images, videos, or add YouTube links. Drag to reorder slides and toggle visibility.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={fetchItems} className="btn-secondary" title="Refresh">
            <RefreshCw size={15} style={{ color: "#F5B301" }} />
            Refresh
          </button>
          <button
            onClick={() => setShowYoutubeForm(v => !v)}
            className="btn-secondary"
            style={{ borderColor: showYoutubeForm ? "#ef4444" : undefined, color: showYoutubeForm ? "#ef4444" : undefined }}
          >
            <Youtube size={15} style={{ color: "#ef4444" }} />
            Add YouTube
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-primary" disabled={uploading}>
            <UploadCloud size={17} />
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
            multiple
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* ─── YouTube URL Form ─── */}
      {showYoutubeForm && (
        <div className="bg-white border-2 border-red-100 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Youtube size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>Add YouTube Video</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#64748B", margin: 0 }}>Paste a YouTube URL — it will appear as a thumbnail with a play button on the hero slider</p>
            </div>
          </div>
          <form onSubmit={handleAddYouTube} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>
            <div className="w-full sm:w-44">
              <input
                type="text"
                value={youtubeName}
                onChange={e => setYoutubeName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={addingYoutube || !youtubeUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-['Inter'] text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <Youtube size={14} />
              {addingYoutube ? "Adding..." : "Add Video"}
            </button>
          </form>
          {youtubeUrl && getYouTubeId(youtubeUrl) && (
            <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <img
                src={`https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/default.jpg`}
                className="w-16 h-10 object-cover rounded-lg"
                alt="Preview"
              />
              <div>
                <p className="text-[11px] font-bold text-green-700 m-0">✓ Valid YouTube URL detected</p>
                <p className="text-[10px] text-green-600 m-0">Video ID: {getYouTubeId(youtubeUrl)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Upload Drop Zone ─── */}
      <div
        className={`upload-zone flex flex-col items-center justify-center p-10 mb-7 ${isDraggingFile ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => { e.preventDefault(); setIsDraggingFile(false); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FEF9EC", color: "#F5B301", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <UploadCloud size={26} />
        </div>
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>
          Drag & Drop Banner Images Here
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#64748B", textAlign: "center", maxWidth: 380 }}>
          Supports JPG, PNG, WEBP images and MP4, WEBM videos. Or use the <strong>Add YouTube</strong> button above for video links.
        </p>
      </div>

      {/* ─── Info Banner ─── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <span className="text-xl leading-none">💡</span>
        <p className="font-['Inter'] text-[13px] text-amber-900 m-0">
          <strong>Tip:</strong> Drag the grip icon to reorder slides. Images auto-advance every 3 seconds. YouTube videos will autoplay silently in the background and auto-advance when finished. Visitors can unmute or click to watch in fullscreen.
        </p>
      </div>

      {/* ─── Media Grid (Draggable) ─── */}
      {items.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Film size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-['Sora'] font-bold text-lg text-slate-900">No hero media yet</p>
          <p className="font-['Inter'] text-sm text-slate-500 mt-1">Upload images/videos or add a YouTube link to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  index={index}
                  setPreviewItem={setPreviewItem}
                  handleToggleEnabled={handleToggleEnabled}
                  handleToggleFit={handleToggleFit}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ─── Preview Modal ─── */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-[9999] bg-[#0A0A0C]/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-[85vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            {(previewItem.slider_type === "youtube" || previewItem.media_type === "youtube") ? (
              <div className="w-[min(85vw,800px)] aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${(function() {
                    const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/, /youtube\.com\/shorts\/([^&?/\s]{11})/];
                    for (const p of patterns) { const m = (previewItem.youtube_url || previewItem.url || "").match(p); if (m) return m[1]; }
                    return "";
                  })()}?autoplay=1&rel=0`}
                  title="YouTube Preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : previewItem.media_type === "video" ? (
              <video src={resolveUrl(previewItem.url)} controls autoPlay className="max-w-full max-h-[85vh] block object-contain" />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                {previewItem.fit === "contain" && (
                  <img src={resolveUrl(previewItem.url)} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl scale-110" alt="blur bg" />
                )}
                <img src={resolveUrl(previewItem.url)} alt={previewItem.name} className={`relative max-w-full max-h-[85vh] block ${previewItem.fit === "contain" ? "object-contain" : "object-cover"}`} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default AdminHeroMedia;
