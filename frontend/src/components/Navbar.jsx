import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Parts", path: "/parts" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact Us", path: "/contact-us" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);
  
  const isNavActive = (linkPath, currentPath) => {
    if (linkPath === "/") return currentPath === "/";
    if (linkPath === "/products" && currentPath.startsWith("/product/")) return true;
    return currentPath === linkPath;
  };

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/20`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
        borderBottom: '1px solid #eef2f7'
      }}
    >
      <div className="w-full max-w-[1520px] mx-auto px-6 md:px-12 flex items-center justify-between h-[72px] transition-all duration-500">
        {/* ── Logo + Brand Name ── */}
        <Link to="/" onClick={handleHomeClick} className="flex items-center gap-4 group flex-shrink-0">
          <img
            src={logo}
            alt="DDInfra and Co"
            className="h-12 w-auto drop-shadow-xl group-hover:scale-105 transition-all duration-500"
          />
          <div className="hidden sm:flex flex-col leading-tight pt-1">
            <span className="font-display font-black text-heading text-[18px] tracking-tight transition-all duration-500">
              DD<span className="text-primary drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">Infra</span>
            </span>
            <span className="font-display font-black text-[11px] md:text-[12px] text-primary uppercase tracking-[0.38em] mt-1 transition-all duration-300 opacity-100 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              AND CO
            </span>
          </div>
        </Link>

        {/* ── Desktop Search Bar ── */}
        <div className="hidden md:flex flex-1 justify-center px-6">
          <form onSubmit={handleSearch} className="w-full max-w-[400px] bg-muted/30 backdrop-blur-md rounded-full p-1 shadow-sm flex items-center gap-2 border border-border/60 focus-within:ring-2 focus-within:ring-primary/30 transition-all duration-300 hover:bg-muted/50">
            <div className="flex-1 flex items-center gap-2.5 px-4">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Equipment & Infrastructure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] text-heading placeholder:text-muted-foreground w-full font-medium py-1.5"
              />
            </div>
            <button type="submit" className="bg-primary text-white px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm hover:bg-primary-dark transition-all">
              Search
            </button>
          </form>
        </div>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-center flex-shrink-0">
          <div className="flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={link.path === "/" ? handleHomeClick : undefined}
                className={`relative font-display text-[14px] font-extrabold transition-all duration-500 py-2 group ${
                  isNavActive(link.path, location.pathname)
                    ? "text-primary drop-shadow-[0_2px_8px_rgba(245,160,0,0.3)]"
                    : "text-slate-600 hover:text-primary hover:drop-shadow-[0_2px_8px_rgba(245,160,0,0.15)]"
                }`}
              >
                {link.label}
                {/* Hover Underline for Inactive Links */}
                {!isNavActive(link.path, location.pathname) && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-primary/40 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                )}
                {/* Active Underline */}
                {isNavActive(link.path, location.pathname) && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #f5a000, #d97706)",
                      boxShadow: "0 2px 12px rgba(245, 160, 0, 0.6)",
                    }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Mobile toggle ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-heading p-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden border-t border-border/30"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="container-section py-8 flex flex-col gap-3">
              {/* ── Mobile Search ── */}
              <div className="px-6 mb-2">
                <form onSubmit={handleSearch} className="bg-muted/30 rounded-full p-1 shadow-sm flex items-center gap-2 border border-border/40 focus-within:ring-2 focus-within:ring-primary/30">
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search Equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-[14px] w-full py-2.5 font-medium"
                    />
                  </div>
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-wider shadow-sm">
                    Search
                  </button>
                </form>
              </div>

              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    to={link.path}
                    onClick={link.path === "/" ? handleHomeClick : undefined}
                    className={`font-display text-lg font-extrabold py-3.5 px-6 rounded-xl transition-all duration-300 block ${
                      isNavActive(link.path, location.pathname)
                        ? "text-primary bg-primary/10 shadow-[inner_0_0_0_1px_rgba(245,158,11,0.2)]"
                        : "text-heading hover:bg-muted/50 hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
