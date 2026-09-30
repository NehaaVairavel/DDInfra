/**
 * Utility to clean price strings from common suffixes like FOB.
 */
export const cleanPrice = (price) => {
  if (!price) return "";
  // Case-insensitive removal of /FOB and FOB
  return price.toString().replace(/\/FOB/gi, '').replace(/FOB/gi, '').trim();
};
