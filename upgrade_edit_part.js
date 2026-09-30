const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/admin/EditPart.jsx', 'utf8');

// 1. Add pricing_mode to initial state
code = code.replace(
  'price: "",\n    currency: "USD",\n    description: "",',
  'price: "",\n    currency: "USD",\n    pricing_mode: "Show Price",\n    description: "",\n    reference_no: "",'
);

// 2. Fetch part logic
code = code.replace(
  'description: data.description || "",\n          compatible_machines: data.compatible_machines || "",\n        });\n        setExistingImages(data.images || []);',
  `description: data.description || "",
          compatible_machines: data.compatible_machines || "",
          pricing_mode: data.pricing_mode || "Show Price",
          reference_no: data.reference_no || "",
        });
        setExistingImages(data.images || []);
        setExistingVideos(data.videos || []);`
);

// 3. New state variables
code = code.replace(
  'const [images, setImages] = useState([]);',
  `const [images, setImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [videos, setVideos] = useState([]);
  const videoInputRef = useRef(null);`
);

// 4. Increase max images to 20
code = code.replace('const maxAllowed = 10 - existingImages.length;', 'const maxAllowed = 20 - existingImages.length;');
code = code.replace('Max 10 total', 'Max 20 total');

// 5. Video handlers
const handleImageSelectRegex = /const handleImageSelect =.*?};/s;
code = code.replace(
  handleImageSelectRegex,
  `$&

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith("video/"));
    if (valid.length !== files.length) toast.error("Only videos allowed");
    
    const maxAllowed = 5 - existingVideos.length;
    setVideos(prev => [...prev, ...valid].slice(0, maxAllowed));
    if (errors.videos) setErrors(prev => ({ ...prev, videos: undefined }));
  };

  const removeNewVideo = (idx) => {
    setVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingVideo = (idx) => {
    setExistingVideos(prev => prev.filter((_, i) => i !== idx));
  };`
);

// 6. Pricing UI
code = code.replace(
  '<Select label="Currency" name="currency"',
  `<Select label="Pricing Mode" name="pricing_mode" value={formData.pricing_mode} onChange={handleChange} options={["Show Price", "Ask For Price"]} />
              {formData.pricing_mode !== "Ask For Price" ? (
                <div className="grid grid-cols-[100px_1fr] gap-x-4">
                  <Select label="Currency" name="currency" value={formData.currency} onChange={handleChange} options={currencies?.map(c => c.code) || ["USD", "AED"]} />
                  <Input label="Price (Optional)" name="price" type="text" value={formData.price} onChange={handleChange} placeholder="e.g. 1500" hint="Numbers only" />
                </div>
              ) : (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={16} color="#1D4ED8" />
                  <span style={{ fontSize: 13, color: "#1D4ED8" }}>Price will be hidden. Users must inquire.</span>
                </div>
              )}
              {/* Dummy block to replace the original below */}`
);

code = code.replace(
  /<div className="grid grid-cols-\[100px_1fr\] gap-x-4">\s*<Select label="Currency".*?<\/div>/s,
  ''
);

// 7. Payload modifications
code = code.replace(
  'let uploadedUrls = [];',
  `let uploadedUrls = [];
      let uploadedVideoUrls = [];`
);

code = code.replace(
  'uploadedUrls = uploadRes.urls || [];\n      }',
  `uploadedUrls = uploadRes.urls || [];
      }
      if (videos.length > 0) {
        const vidRes = await partService.uploadVideos(videos);
        uploadedVideoUrls = vidRes.urls || [];
      }`
);

code = code.replace(
  'images: [...existingImages, ...uploadedUrls],',
  `images: [...existingImages, ...uploadedUrls],
        videos: [...existingVideos, ...uploadedVideoUrls],`
);

code = code.replace(
  'price: String(formData.price).replace(/,/g, "")',
  'price: formData.pricing_mode === "Ask For Price" ? "" : String(formData.price).replace(/,/g, "")'
);

// 8. Description Char Counter
code = code.replace(
  '<Section id="content" title="Description" icon={Info}>',
  `const descLen = (formData.description || "").length;
  
          <Section id="content" title="Description" icon={Info}>`
);

code = code.replace(
  '<label style={{ display: "block", fontFamily: "\'Inter\',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Detailed Description</label>',
  `<div className="flex justify-between mb-1">
                <label style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151" }}>Detailed Description</label>
                <span style={{ fontSize: 11, color: descLen > 1000 ? "#EF4444" : "#94A3B8" }}>{descLen} / 1000</span>
              </div>`
);

code = code.replace(
  'style={{ resize: "vertical", minHeight: 120 }}',
  'maxLength={1000}\n                style={{ resize: "vertical", minHeight: 120, borderColor: descLen >= 1000 ? "#EF4444" : undefined }}'
);

// 9. Read-only Reference Number UI
code = code.replace(
  '<Input label="Part Number" name="part_number"',
  `<div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                  Reference No. (System Generated)
                </label>
                <input
                  className="admin-input"
                  style={{ background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                  value={formData.reference_no}
                  readOnly
                  disabled
                />
              </div>
              <Input label="Part Number" name="part_number"`
);
// We need to adjust grid to account for 3 items now
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">\n              <Input label="Part Number" name="part_number"',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">\n              <div style={{ marginBottom: 16 }}>'
);
// Above regex missed the exact string. Let's do it manually.
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">'
);

// 10. PreviewCard update
code = code.replace(
  'const formattedPrice = price > 0 ? `${symbol}${price.toLocaleString()}` : "Ask For Price";',
  'const formattedPrice = formData.pricing_mode === "Ask For Price" ? "PRICE ON REQUEST" : (price > 0 ? `${symbol}${price.toLocaleString()}` : "—");'
);

// 11. Video UI
const mediaSectionRegex = /<\/Section>\s*<Section id="content" title="Description" icon=\{Info\}>/s;
code = code.replace(
  mediaSectionRegex,
  `  {/* Video Upload section */}
            <div className="mt-4 border-t border-slate-100 pt-5">
              <h4 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                <UploadCloud size={16} /> Videos (Optional)
              </h4>
              <div
                onClick={() => videoInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-[14px] p-6 flex flex-col items-center justify-center cursor-pointer transition-all"
              >
                <UploadCloud size={20} className="text-slate-400 mb-2" />
                <p className="font-sora font-bold text-[13px] text-heading">Upload Videos</p>
                <p className="font-inter text-[11px] text-slate-500">MP4, WebM up to 50MB (Max 5 total)</p>
                <input type="file" ref={videoInputRef} onChange={handleVideoSelect} multiple accept="video/*" className="hidden" />
              </div>
              
              {(existingVideos.length > 0 || videos.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {existingVideos.map((url, idx) => (
                    <div key={\`exist-vid-\${idx}\`} className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 group">
                      <video src={url} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeExistingVideo(idx); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {videos.map((file, idx) => (
                    <div key={\`new-vid-\${idx}\`} className="relative aspect-video rounded-xl overflow-hidden bg-blue-900 border-2 border-blue-400 group">
                      <video src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">NEW</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeNewVideo(idx); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section id="content" title="Description" icon={Info}>`
);


fs.writeFileSync('frontend/src/pages/admin/EditPart.jsx', code);
console.log('Done transforming EditPart.jsx');
