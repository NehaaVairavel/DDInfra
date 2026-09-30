import { Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { products } from "@/data/products";
import { getWhatsAppUrl } from "@/utils/whatsapp";

const FloatingActions = () => {
  const location = useLocation();
  
  // Logic to determine if we're on a product detail page and which product
  const getContextualWhatsAppUrl = () => {
    const match = location.pathname.match(/\/products\/([^/]+)/);
    if (match) {
      const productId = match[1];
      const product = products.find(p => p.id === productId);
      if (product) {
        return getWhatsAppUrl(product.name, product.refNumber);
      }
    }
    return getWhatsAppUrl(); // Fallback to general message
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4"
    >
      <AnimatePresence>
        {/* WhatsApp Button */}
        <motion.a
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          href={getContextualWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_8px_25px_rgba(37,211,102,0.4)] relative group overflow-hidden"
          aria-label="WhatsApp"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 animate-ping bg-[#25D366] rounded-full opacity-20 pointer-events-none" />
          <MessageCircle size={26} className="text-white relative z-10" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-4 bg-charcoal/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap tracking-wider border border-white/10 uppercase translate-x-2 group-hover:translate-x-0">
            WhatsApp Us
          </span>
        </motion.a>

        {/* Call Button (Mobile Only) */}
        <motion.a
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          href="tel:+971558599045"
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow relative group md:hidden"
          aria-label="Call Now"
        >
          <div className="absolute inset-0 animate-ping bg-primary rounded-full opacity-20 pointer-events-none" />
          <Phone size={24} className="text-primary-foreground relative z-10" />
          
          <span className="absolute right-full mr-4 bg-charcoal/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap tracking-wider border border-white/10 uppercase translate-x-2 group-hover:translate-x-0">
            Call Sales
          </span>
        </motion.a>
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingActions;
