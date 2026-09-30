import { motion } from "framer-motion";
import SectionReveal from "@/components/SectionReveal";

// Import local brand assets
import hyundai from "@/assets/brands/hyundai-removebg-preview.png";
import wirtgen from "@/assets/brands/WIRTGEN_Logo.png";
import sany from "@/assets/brands/sany-removebg-preview.png";
import caseLogo from "@/assets/brands/case_construction-removebg-preview.png";
import xcmg from "@/assets/brands/xcmg-removebg-preview.png";
import jcb from "@/assets/brands/jcb-removebg-preview.png";
import volvo from "@/assets/brands/Volvo.png";
import kobelco from "@/assets/brands/kobelco-removebg-preview.png";
import metso from "@/assets/brands/metso.png";

const brands = [
  { name: "Hyundai", logo: hyundai },
  { name: "Wirtgen", logo: wirtgen },
  { name: "SANY", logo: sany },
  { name: "CASE", logo: caseLogo },
  { name: "XCMG", logo: xcmg },
  { name: "JCB", logo: jcb },
  { name: "Volvo", logo: volvo },
  { name: "Kobelco", logo: kobelco },
  { name: "Metso", logo: metso },
];

const BrandCarousel = () => {
  return (
    <section className="bg-white py-8 md:py-10 section-divider-top relative overflow-hidden">
      <div className="container-section text-center relative z-10 mb-6">
        <SectionReveal>
          {/* Exact heading match to reference */}
          <h2 className="text-3xl md:text-4xl font-display font-black text-heading mb-3 heading-decorated tracking-tight">
            Top <span className="text-gradient drop-shadow-sm">Heavy Equipment</span> Brands
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto mt-2 font-medium">
            Trusted global brands powering our heavy equipment trading and export network.
          </p>
        </SectionReveal>
      </div>

      {/* Full-width Carousel Container */}
      <div className="relative w-full overflow-hidden py-4 z-10 bg-white">
        
        {/* Transparent gradient masks for smooth fade at edges */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none"></div>

        {/* Scrolling Track - Never stops on hover */}
        <div className="flex w-max animate-infinite-scroll will-change-transform">
          {/* Render the set 3 times to guarantee a flawless loop even on ultrawide screens */}
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <div 
              key={i} 
              className="w-[180px] md:w-[240px] shrink-0 flex items-center justify-center px-4 md:px-8
                         transition-transform duration-500 ease-out cursor-pointer"
              title={brand.name}
            >
              <img 
                src={brand.logo} 
                alt={`${brand.name} logo`} 
                className="w-full h-[40px] md:h-[50px] object-contain object-center transition-all duration-300 hover:scale-[1.20] hover:brightness-110 will-change-transform relative hover:z-10"
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;
