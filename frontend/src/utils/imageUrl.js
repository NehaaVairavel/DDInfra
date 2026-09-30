const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Remove /api from the end to get the base domain
const API_BASE = API_URL.replace(/\/api$/, '');

export const getImageUrl = (image, updatedAt) => {
  if (!image) return null;
  
  let finalUrl = image;
  
  // If it's already an absolute URL with http or https, return as is
  if (!image.startsWith('http://') && !image.startsWith('https://') && !image.startsWith('blob:')) {
    // If it's a relative URL starting with '/', just prepend API_BASE
    if (image.startsWith('/')) {
      finalUrl = `${API_BASE}${image}`;
    } else {
      // If it's a relative URL like 'uploads/...', prepend API_BASE/
      finalUrl = `${API_BASE}/${image}`;
    }
  }
  
  // Add version parameter for cache busting if updatedAt is provided
  if (updatedAt) {
    const v = typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).getTime();
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}v=${v}`;
  }
  
  return finalUrl;
};
