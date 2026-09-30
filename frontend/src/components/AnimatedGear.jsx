import { motion } from "framer-motion";

const AnimatedGear = ({ size = 200, className = "" }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`animate-gear-spin ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.3 }}
  >
    <path
      d="M50 15 L54 15 L56 8 L60 7 L64 12 L68 11 L69 4 L73 4 L75 11 L79 12 L83 7 L86 9 L84 16 L87 19 L94 18 L95 22 L88 25 L89 29 L96 31 L95 35 L88 35 L87 39 L93 44 L91 47 L84 44 L81 47 L85 54 L82 56 L76 51 L73 53 L75 60 L71 61 L67 55 L63 55 L62 62 L58 62 L56 55 L52 54 L48 60 L45 59 L45 52 L41 50 L35 55 L33 52 L38 47 L37 43 L30 42 L30 38 L37 36 L37 32 L30 29 L31 25 L38 26 L40 22 L35 17 L38 15 L43 20 L46 18 L46 11 L50 11 Z"
      fill="none"
      stroke="hsl(38, 92%, 50%)"
      strokeWidth="1.5"
      opacity="0.6"
    />
    <circle cx="50" cy="35" r="12" fill="none" stroke="hsl(38, 92%, 50%)" strokeWidth="1.5" opacity="0.4" />
    <circle cx="50" cy="35" r="6" fill="hsl(38, 92%, 50%)" opacity="0.15" />
  </motion.svg>
);

export default AnimatedGear;
