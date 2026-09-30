const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/admin/AddPart.jsx', 'utf8');

// 1. Fix store import
code = code.replace(
  'import { useProductStore } from "@/store/useProductStore";',
  'import { usePartStore } from "@/store/usePartStore";'
);
code = code.replace(
  'const { optimisticCreate } = useProductStore();',
  'const { optimisticCreate } = usePartStore();' // wait, AddPart didn't even use optimisticCreate yet? Let's check
);

// Actually, AddPart.jsx lines 154-155:
// export default function AddPart() {
//   const navigate = useNavigate();
code = code.replace(
  'export default function AddPart() {',
  'export default function AddPart() {\n  const { optimisticCreate } = usePartStore();'
);

// 2. Increase max images to 20
code = code.replace('.slice(0, 10)', '.slice(0, 20)');
code = code.replace('Max 10', 'Max 20');

// 3. Videos state and refs
code = code.replace(
  'const [images, setImages] = useState([]);',
  `const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const videoInputRef = useRef(null);`
);

// 4. Video handlers
const handleImageSelectRegex = /const handleImageSelect =.*?};/s;
code = code.replace(
  handleImageSelectRegex,
  `$&
  
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
  };`
);

// 5. FormData pricing_mode
code = code.replace(
  'price: "",\n    currency: "USD",\n    description: "",',
  'price: "",\n    currency: "USD",\n    pricing_mode: "Show Price",\n    description: "",'
);

// 6. handleSubmit modifications for pricing_mode and videos
code = code.replace(
  '// 1. Upload images',
  `// 1. Upload images & videos
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
`
);

code = code.replace(
  'const uploadRes = await partService.uploadImages(images);\n      if (!uploadRes.urls || uploadRes.urls.length === 0) {\n        throw new Error("Failed to upload images");\n      }',
  ''
);

code = code.replace(
  'images: uploadRes.urls,',
  `images: finalImages,
        image: finalImages[0] || null,
        videos: finalVideos,`
);

code = code.replace(
  'price: String(formData.price).replace(/,/g, "")',
  'price: formData.pricing_mode === "Ask For Price" ? "" : String(formData.price).replace(/,/g, "")'
);

code = code.replace(
  'await partService.create(payload);',
  `const created = await partService.create(payload);
      optimisticCreate(created);`
);

// 7. Pricing Mode UI
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
  /maxLength=\{1000\}/,
  ''
);

code = code.replace(
  'style={{ resize: "vertical", minHeight: 120 }}',
  'maxLength={1000}\n                style={{ resize: "vertical", minHeight: 120, borderColor: descLen >= 1000 ? "#EF4444" : undefined }}'
);

// 9. Video Upload UI
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
                <p className="font-inter text-[11px] text-slate-500">MP4, WebM up to 50MB (Max 5)</p>
                <input type="file" ref={videoInputRef} onChange={handleVideoSelect} multiple accept="video/*" className="hidden" />
              </div>
              {videos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {videos.map((file, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 group">
                      <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeVideo(idx); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
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

// 10. Update PreviewCard
code = code.replace(
  'const formattedPrice = price > 0 ? `${symbol}${price.toLocaleString()}` : "Ask For Price";',
  'const formattedPrice = formData.pricing_mode === "Ask For Price" ? "PRICE ON REQUEST" : (price > 0 ? `${symbol}${price.toLocaleString()}` : "—");'
);

code = code.replace(
  'const { navigate } = useNavigate();',
  ''
);

fs.writeFileSync('frontend/src/pages/admin/AddPart.jsx', code);
console.log('Done transforming AddPart.jsx');
