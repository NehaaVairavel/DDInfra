import api from '../api/api';
import { MACHINERY_CATEGORIES } from '../constants/categories';

const FALLBACK_CATEGORIES = MACHINERY_CATEGORIES;

const productService = {
  getPaginated: async (params) => {
    // Need to convert arrays (like brands, categories, locations) to comma-separated strings
    const queryParams = new URLSearchParams();
    queryParams.append('paginated', 'true');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            queryParams.append(key, value.join(','));
          }
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },
  
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByRef: async (ref) => {
    const response = await api.get(`/products/ref/${ref}`);
    return response.data;
  },

  // Creates a product — sends JSON (images as URLs from R2 upload)
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    // Backend may return either `{ message, product }` or the product directly
    return response.data?.product ?? response.data;
  },

  // Bulk reorder — sends array of { id, display_order } pairs
  reorder: async (items) => {
    const response = await api.put('/products/reorder', { items });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Uploads raw file objects to R2 via backend
  uploadImages: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data; // returns { urls: [...] }
  },

  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return Array.isArray(response.data) && response.data.length > 0
        ? response.data
        : FALLBACK_CATEGORIES;
    } catch {
      return FALLBACK_CATEGORIES;
    }
  }
};

export default productService;
