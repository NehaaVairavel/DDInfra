import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, useInView, useScroll } from "framer-motion";
import { Truck, Wrench, Banknote, Headphones, Globe, ArrowRight, Shield, Award } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import AnimatedGear from "@/components/AnimatedGear";
import SectionReveal from "@/components/SectionReveal";
import BrandCarousel from "@/components/BrandCarousel";
import HeroMediaSlider from "@/components/HeroMediaSlider";
import productService from "@/services/productService";
import settingsService from "@/services/settingsService";
import { socket } from "@/socket";
import { MACHINERY_CATEGORIES } from "@/constants/categories";
import { useProductStore } from "@/store/useProductStore";
import excavatorImg from "@/assets/category/excavator.jpg";
import backhoeImg from "@/assets/category/backhoe.jpg";
import dozerImg from "@/assets/category/dozer.jpg";
import wheelLoaderImg from "@/assets/category/wheel-loader.jpg";
import graderImg from "@/assets/category/grader.jpg";
import rollerImg from "@/assets/category/roller.jpg";
import skidSteerImg from "@/assets/category/skid-steer.jpg";
import bucketsImg from "@/assets/category/buckets.jpg";
import materialHandlerImg from "@/assets/category/material-handler.jpg";
import othersImg from "@/assets/category/others.jpg";
import uaeFlag from "@/assets/flags/uae.png";

const stats = [
  { value: 15, suffix: "+", label: "Years Operating", icon: Shield },
  { value: 500, suffix: "+", label: "Units Delivered", icon: Truck },
  { value: 200, suffix: "+", label: "Machines Exported", icon: Award },
  { value: 10, suffix: "+", label: "Countries Served", icon: Globe },
];

const categoryImageMap = {
  "Excavators": excavatorImg,
  "Backhoe Loaders": backhoeImg,
  "Dozers": dozerImg,
  "Wheel Loaders": wheelLoaderImg,
  "Graders": graderImg,
  "Rollers": rollerImg,
  "Skid Steer": skidSteerImg,
  "Buckets": bucketsImg,
  "Material Handlers": materialHandlerImg,
  "Others": othersImg
};

const categoriesData = MACHINERY_CATEGORIES.map(name => ({
  name,
  image: categoryImageMap[name] || othersImg
}));

const markets = [
  { name: "UAE", code: "ae" },
  { name: "Middle East", code: "sa" },
  { name: "Africa", code: "za" },
  { name: "Europe", code: "eu" },
  { name: "India", code: "in" },
  { name: "North America", code: "us" },
];

const useCountUp = (target, duration = 2500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { count, ref };
};

const StatCard = ({ stat, i }) => {
  const { count, ref } = useCountUp(stat.value);
  const IconComp = stat.icon;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.12 }}
      className="text-center card-premium rounded-2xl p-3 md:p-4 border-accent-left group"
    >
      <div className="icon-container w-9 h-9 rounded-xl mx-auto mb-2 relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <IconComp size={18} className="text-primary group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 relative z-10" />
      </div>
      <div className="text-2xl md:text-3xl industrial-value text-shimmer tracking-tight">
        {count}{stat.suffix}
      </div>
      <div className="industrial-label mt-1.5">{stat.label}</div>
    </motion.div>
  );
};

const wordVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 } 
  }
};

const Index = () => {
  const navigate = useNavigate();
  const allProducts = useProductStore((state) => state.products);

  const [siteSettings, setSiteSettings] = useState(null);

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

  const heroRef = useRef(null);
  const { scrollY } = useScroll();

  const shapeY1 = useTransform(scrollY, [0, 1000], [0, 100]);

  // Text parallax on scroll
  const heroTextOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroTextY = useTransform(scrollY, [0, 380], [0, -44]);

  const heroTitle = siteSettings?.hero_text || "Premium Heavy Equipment & Infrastructure Solutions";

  return (
    <div className="overflow-hidden">

      {/* ══════════════════════════════════════════════
          HERO SECTION — Split Layout (40% Text / 60% Slider)
          ══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="container-section flex flex-col md:flex-row items-stretch gap-4 md:gap-6 mt-[88px] mb-[16px] h-auto md:h-[400px] lg:h-[460px]"
      >
        {/* Left Panel (40%) - Text Content */}
        <motion.div
          className="w-full md:w-[45%] lg:w-[40%] relative rounded-[28px] p-8 lg:p-10 xl:p-12 flex flex-col justify-center items-start shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-[#F3F3F3] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 backdrop-blur-md bg-[#FCFCFC]"
          style={{ 
            opacity: heroTextOpacity, 
            y: heroTextY,
            background: "linear-gradient(135deg, #FCFCFC 0%, rgba(250,250,250,0.9) 100%)"
          }}
        >
          {/* Soft construction grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          
          {/* Blueprint style accent lines */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-[0.02] pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 C30,60 70,40 100,0" stroke="black" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M0,80 C40,50 80,30 100,-20" stroke="black" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* Machinery Outline Watermark */}
          <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover:scale-105 group-hover:opacity-[0.04]">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-slate-900"><path d="M21.5,14.5L19,10.5V8A1,1 0 0,0 18,7H15.5L13,3H9V5L12,9.5V13A1,1 0 0,0 13,14H15L17,17V20A1,1 0 0,0 18,21H21.5A0.5,0.5 0 0,0 22,20.5V15A0.5,0.5 0 0,0 21.5,14.5M19.5,19.5H18.5V17.5L16.2,14.5H14V13.5L11,9H9.5V4.5H12L14.2,8H17V10.2L19.5,14.2V19.5Z" /></svg>
          </div>

          {/* Soft orange glow in corner */}
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/15 transition-all duration-700" />
          
          {/* Gentle glow on hover */}
          <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Premium Left Accent */}
          <div className="absolute left-0 top-[10%] bottom-[10%] w-[6px] bg-gradient-to-b from-primary via-orange-500 to-amber-400 rounded-r-full shadow-[3px_0_20px_rgba(245,158,11,0.3)] opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white mb-8 relative z-10 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[#F3F3F3] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] transition-shadow duration-500"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-primary"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-display font-extrabold text-[10px] text-slate-700 tracking-[0.18em] uppercase flex items-center gap-1.5">
              PREMIUM INFRASTRUCTURE EQUIPMENT <Globe size={12} className="text-slate-400 ml-1" />
            </span>
          </motion.div>

          {/* Heading */}
          <div
            className="font-display font-[800] text-slate-900 leading-[1.12] mb-7 relative z-10"
            style={{ fontSize: "clamp(24px, 2.2vw, 32px)", letterSpacing: "-0.01em", textShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
          >
            {heroTitle.split(" ").map((word, i) => {
              const isDubai = word.replace(/[^a-zA-Z]/g, "") === "Dubai";
              return (
                <motion.span
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={wordVariants}
                  className={`inline-block mr-2 lg:mr-2.5 ${isDubai ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600 drop-shadow-sm relative" : ""}`}
                >
                  {word}
                </motion.span>
              );
            })}
          </div>

          {/* Subtitle / Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-3.5 mb-10 relative z-10"
          >
            {["Reliable Machinery", "Transparent Trade", "Premium Infrastructure"].map((point, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-[22px] h-[22px] rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-[15px] lg:text-[16px] text-slate-500 font-medium tracking-wide">
                  {point}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-auto md:mt-0 relative z-10 w-full md:w-auto"
          >
            <Link
              to="/products"
              className="group relative inline-flex items-center justify-center gap-3 text-[15px] font-display font-bold text-white rounded-[18px] overflow-hidden transition-all duration-400 hover:-translate-y-1 shadow-[0_8px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.4)] backdrop-blur-sm"
              style={{ height: "54px", padding: "0 36px" }}
            >
              {/* Button Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-amber-500 group-hover:scale-[1.05] transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="relative z-10 flex items-center gap-2.5 text-white shadow-sm">
                Explore Products
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Panel (60%) - Hero Slider */}
        <div className="w-full md:w-[55%] lg:w-[60%] relative rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-[320px] md:h-full">
          <HeroMediaSlider />
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORIES SECTION
          ══════════════════════════════════════ */}
      <section className="section-tinted pt-[10px] pb-8 section-divider-top relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="container-section relative z-10">
          <SectionReveal className="text-center mb-4">
            <h2 className="font-display font-black text-heading mb-1 heading-decorated tracking-tight" style={{ fontSize: "32px", lineHeight: "1.1" }}>
              Premium <span className="text-gradient drop-shadow-sm">Categories</span>
            </h2>
            <p className="text-muted-foreground text-[12px] text-center whitespace-nowrap mx-auto mt-1 font-semibold" style={{ lineHeight: "1.4" }}>Explore our diverse range of high-quality heavy equipment ready for global export</p>
          </SectionReveal>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
            {categoriesData.map((cat) => {
              const count = allProducts.filter(p => p.category === cat.name).length;
              return (
                <motion.div key={cat.name} variants={staggerItem}>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="group relative overflow-hidden rounded-[1.5rem] aspect-[16/10] block card-premium shadow-premium">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:scale-[1.05] group-hover:brightness-110 group-hover:contrast-[1.05]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/90 z-10" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                      <h3 className="font-display font-extrabold text-xl text-white drop-shadow-md transform transition-transform duration-500 group-hover:translate-y-[-4px]">{cat.name}</h3>
                      <div className="flex items-center gap-2 mt-2 overflow-hidden">
                        <div className="h-[2px] w-0 bg-primary group-hover:w-8 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-white/0 group-hover:text-white/90 text-[10px] font-black uppercase tracking-wider transition-all duration-500 translate-x-[-15px] group-hover:translate-x-0">View Products</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 z-30">
                      <div className="bg-primary/95 backdrop-blur-md text-white px-3 py-1 rounded-full text-[12px] font-black shadow-lg shadow-primary/30 flex items-center justify-center min-w-[32px] border border-white/20">
                        {count}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
          
          <div className="mt-8 text-center">
            <Link to="/products" className="btn-secondary-glass inline-flex items-center gap-2 text-sm px-6 py-2.5">
              Browse All Products <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <BrandCarousel />

      {/* ══════════════════════════════════════
          MARKETS SECTION
          ══════════════════════════════════════ */}
      <section className="section-base py-6 md:py-8 section-divider-top relative overflow-hidden">
        <motion.div style={{ y: shapeY1 }} className="absolute top-[20%] right-[10%] opacity-[0.03] text-primary">
          <Globe size={400} />
        </motion.div>
        
        <div className="container-section text-center relative z-10">
          <SectionReveal>
            <h2 className="text-3xl md:text-4xl font-display font-black text-heading mb-3 heading-decorated tracking-tight flex items-center justify-center gap-3">
              <Globe className="text-primary drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" size={28} />
              Markets We <span className="text-gradient drop-shadow-sm">Serve</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-[520px] mx-auto mb-6 mt-2 font-semibold">Strategic location in Dubai enabling seamless delivery to global markets</p>
          </SectionReveal>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto">
            {markets.map((m) => (
              <motion.div key={m.name} variants={staggerItem} whileHover={{ y: -6 }} className="group bg-white/90 backdrop-blur-md border border-border/50 rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:shadow-premium hover:border-primary/50 shadow-sm relative overflow-hidden cursor-default">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md transition-transform duration-500 group-hover:scale-110 relative z-10 bg-white">
                  <img src={m.name === "UAE" ? uaeFlag : `https://flagcdn.com/w80/${m.code}.png`} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-extrabold text-heading text-[13px] tracking-tight relative z-10">{m.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS SECTION
          ══════════════════════════════════════ */}
      <section className="section-warm industrial-dots py-6 md:py-8 section-divider-top overflow-hidden">
        <div className="container-section relative z-10">
          <SectionReveal className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-display font-black text-heading mb-3 heading-decorated tracking-tight">
              Our Global <span className="text-gradient drop-shadow-sm">Presence</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-[520px] mx-auto mt-2 font-semibold">Delivering excellence in heavy equipment trading across global markets</p>
          </SectionReveal>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
              {stats.map((s, i) => <StatCard key={i} stat={s} i={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
          ══════════════════════════════════════ */}
      <section className="gradient-cta py-5 md:py-7 max-h-[240px] relative overflow-hidden flex items-center">
        <div className="container-section text-center relative z-20 w-full">
          <SectionReveal>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-black text-white mb-2 drop-shadow-lg tracking-tight">Ready to Upgrade Your Fleet?</h2>
            <p className="text-white/90 mb-3 max-w-[480px] mx-auto text-sm font-semibold drop-shadow-md">Get competitive pricing, global shipping logistics, and expert consultation from our Dubai headquarters.</p>
            <div className="flex flex-col items-center justify-center gap-1.5">
              <a href={`https://wa.me/${siteSettings?.whatsapp || "919342429045"}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-white text-primary px-5 py-2 rounded-xl font-display font-black text-sm hover:scale-[1.03] hover:brightness-105 shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-400 group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">Start Your Enquiry <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" /></span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              </a>
              <p className="text-white/80 text-[12px] font-semibold tracking-wide text-center">Get instant response from our team</p>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
};

export default Index;
