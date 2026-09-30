import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, X, Volume2, VolumeX } from "lucide-react";
import heroMediaService from "@/services/heroMediaService";
import { socket } from "@/socket";
import YouTube from 'react-youtube';

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

const resolveUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${R2_PUBLIC_URL}/${url}`;
};

// Extract YouTube video ID from any youtube URL format
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

const getYouTubeThumbnail = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const SLIDE_DURATION = 3000;

// ─── YouTube Fullscreen Modal ────────────────────────────────────────
const YouTubeModal = ({ videoId, startSeconds = 0, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        aria-label="Close video"
      >
        <X size={20} />
      </button>
      <div
        className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=${Math.floor(startSeconds)}`}
          title="YouTube Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

// ─── YouTube Slide ────────────────────────────────────────────────────
const YouTubeSlide = ({ slide, isActive, isGlobalMuted, setGlobalMuted, onEnd, onPlayClick }) => {
  const videoId = getYouTubeId(slide.youtube_url || slide.url);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  
  useEffect(() => {
    if (playerRef.current && playerReady) {
      const player = playerRef.current;
      if (player && typeof player.playVideo === 'function') {
        if (isActive) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      }
    }
  }, [isActive, playerReady]);

  useEffect(() => {
    if (playerRef.current && playerReady) {
      const player = playerRef.current;
      if (player && typeof player.isMuted === 'function') {
        if (isGlobalMuted) {
          player.mute();
        } else {
          player.unMute();
        }
      }
    }
  }, [isGlobalMuted, playerReady]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      showinfo: 0,
      fs: 0,
      iv_load_policy: 3,
      mute: 1, // start muted for autoplay
      disablekb: 1
    },
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    if (isGlobalMuted) {
      event.target.mute();
    } else {
      event.target.unMute();
    }
    if (isActive) {
      event.target.playVideo();
    }
  };
  
  const handleStateChange = (event) => {
    if (event.data === 0 && onEnd && isActive) {
       onEnd();
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    setGlobalMuted(!isGlobalMuted);
  };
  
  const handleContainerClick = async () => {
    let currentTime = 0;
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      currentTime = await playerRef.current.getCurrentTime();
    }
    onPlayClick(videoId, currentTime);
  };

  return (
    <div
      className="absolute inset-0 transition-opacity ease-in-out bg-black overflow-hidden group"
      style={{
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 10 : 0,
        pointerEvents: isActive ? "auto" : "none",
        transitionDuration: "800ms",
      }}
    >
      <div className="absolute inset-0 pointer-events-none scale-[1.35] transform-gpu">
         {videoId && (
           <YouTube 
             videoId={videoId} 
             opts={opts} 
             onReady={onReady}
             onStateChange={handleStateChange}
             className="w-full h-full"
             iframeClassName="w-full h-full pointer-events-none"
           />
         )}
      </div>
      
      <div 
        className="absolute inset-0 z-10 cursor-pointer flex flex-col justify-end p-6" 
        onClick={handleContainerClick}
      >
          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ zIndex: 50 }}>
            <button 
              onClick={handleMuteToggle}
              className="w-12 h-12 md:w-14 md:h-14 mb-[80px] md:mb-[100px] mr-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-xl pointer-events-auto border border-white/20"
              aria-label={isGlobalMuted ? "Unmute video" : "Mute video"}
            >
              {isGlobalMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
      </div>
    </div>
  );
};

const HeroMediaSlider = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [youtubeStartTime, setYoutubeStartTime] = useState(0);
  const [isGlobalMuted, setGlobalMuted] = useState(true);
  const videoRefs = useRef({});
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  // ─── Fetch slides ───────────────────────────────────────────────
  useEffect(() => {
    heroMediaService.getAll().then((data) => {
      const enabled = data.filter((s) => s.enabled !== false);
      setSlides(enabled.sort((a, b) => a.order - b.order));
    }).catch(() => {});

    const handleAdded = (item) => {
      if (item.enabled === false) return;
      setSlides((prev) => {
        if (prev.some((s) => s.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.order - b.order);
      });
    };
    const handleUpdated = (item) => {
      setSlides((prev) => {
        const exists = prev.some((s) => s.id === item.id);
        if (item.enabled === false) return prev.filter((s) => s.id !== item.id);
        if (exists) return prev.map((s) => s.id === item.id ? item : s).sort((a, b) => a.order - b.order);
        return [...prev, item].sort((a, b) => a.order - b.order);
      });
    };
    const handleDeleted = ({ id }) => setSlides((prev) => prev.filter((s) => s.id !== id));

    socket.on("hero:added", handleAdded);
    socket.on("hero:updated", handleUpdated);
    socket.on("hero:deleted", handleDeleted);

    return () => {
      socket.off("hero:added", handleAdded);
      socket.off("hero:updated", handleUpdated);
      socket.off("hero:deleted", handleDeleted);
    };
  }, []);

  // Clamp current index when slides change
  useEffect(() => {
    if (slides.length > 0 && current >= slides.length) {
      setCurrent(0);
    }
  }, [slides, current]);

  // ─── Navigate ───────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    setActiveVideoId(null); // close any open modal
    setCurrent(idx);
  }, []);

  const goNext = useCallback(() => {
    if (slides.length < 2) return;
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const goPrev = useCallback(() => {
    if (slides.length < 2) return;
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  // ─── Auto-advance for image slides only ─────────────────────
  useEffect(() => {
    // Never auto-advance while a video modal is open
    if (activeVideoId) return;
    if (paused || slides.length < 2) return;

    const activeSlide = slides[current];
    // Skip auto-advance for YouTube slides AND mp4/webm videos
    if (!activeSlide) return;
    const isYouTube = activeSlide.slider_type === "youtube" || activeSlide.media_type === "youtube";
    const isVideo = activeSlide.media_type === "video";
    if (isYouTube || isVideo) return;

    timerRef.current = setTimeout(() => {
      goNext();
    }, SLIDE_DURATION);

    return () => clearTimeout(timerRef.current);
  }, [current, paused, slides, goNext, activeVideoId]);

  // ─── Video (mp4/webm) playback control ──────────────────────
  useEffect(() => {
    slides.forEach((slide, index) => {
      const el = videoRefs.current[index];
      if (el) {
        if (index === current && !paused) {
          el.play().catch(() => {});
        } else {
          el.pause();
          if (index !== current) el.currentTime = 0;
        }
      }
    });
  }, [current, paused, slides]);

  // ─── Touch swipe ────────────────────────────────────────────
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  if (slides.length === 0) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p className="text-white/60 text-sm font-semibold">No slides uploaded yet</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── YouTube Modal ─── */}
      {activeVideoId && (
        <YouTubeModal 
          videoId={activeVideoId} 
          startSeconds={youtubeStartTime}
          onClose={() => {
            setActiveVideoId(null);
            setYoutubeStartTime(0);
          }} 
        />
      )}

      <div
        className="relative w-full h-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Slide Area ── */}
        {slides.map((slide, index) => {
          const isActive = index === current;
          const slideUrl = resolveUrl(slide.url);
          const isYouTube = slide.slider_type === "youtube" || slide.media_type === "youtube";
          const isVideo = slide.media_type === "video" && !isYouTube;
          const isContain = slide.fit === "contain";

          if (isYouTube) {
            return (
              <YouTubeSlide
                key={slide.id}
                slide={slide}
                isActive={isActive}
                isGlobalMuted={isGlobalMuted}
                setGlobalMuted={setGlobalMuted}
                onEnd={goNext}
                onPlayClick={(vid, time) => {
                  setPaused(true); 
                  setYoutubeStartTime(time);
                  setActiveVideoId(vid); 
                }}
              />
            );
          }

          return (
            <div
              key={slide.id}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 10 : 0,
                pointerEvents: isActive ? "auto" : "none",
                transitionDuration: "800ms",
              }}
            >
              {isVideo ? (
                <video
                  ref={(el) => { videoRefs.current[index] = el; }}
                  src={slideUrl}
                  className={`w-full h-full ${isContain ? "object-contain bg-[#f8fafc]" : "object-cover"}`}
                  style={{ objectPosition: "center 35%" }}
                  muted
                  playsInline
                  loop={false}
                  onEnded={isActive ? goNext : undefined}
                />
              ) : (
                <img
                  src={slideUrl}
                  alt={slide.name || "Hero slide"}
                  className={`w-full h-full ${isContain ? "object-contain bg-[#f8fafc]" : "object-cover"}`}
                  style={{ objectPosition: "center 35%" }}
                  loading="eager"
                />
              )}
            </div>
          );
        })}

        {/* ── Bottom gradient overlay for controls ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
          style={{ zIndex: 15 }}
        />

        {/* ── Navigation Controls — Bottom Center ── */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6"
            style={{ zIndex: 20 }}
          >
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-colors duration-200"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((slide, i) => {
                const isYT = slide.slider_type === "youtube" || slide.media_type === "youtube";
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === current ? 24 : 8,
                      height: 8,
                      background: i === current
                        ? (isYT ? "#EF4444" : "#F59E0B")
                        : "rgba(255,255,255,0.4)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>

            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-colors duration-200"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HeroMediaSlider;
