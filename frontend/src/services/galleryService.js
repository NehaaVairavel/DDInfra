import api from '../api/api';

const galleryService = {
  getPaginated: async (params) => {
    const queryParams = new URLSearchParams();
    queryParams.append('paginated', 'true');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/gallery?${queryParams.toString()}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/gallery');
    return response.data;
  },

  // Upload one or more files (pass array of File objects)
  uploadFiles: async (files, category = 'Others') => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    formData.append('category', category);
    const response = await api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Backend returns single object or array
    const result = response.data;
    return Array.isArray(result) ? result : [result];
  },

  // Legacy single-file upload (kept for backward compat)
  upload: async (formData) => {
    const response = await api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Rename or change category
  update: async (id, data) => {
    const response = await api.put(`/gallery/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  }
};

export default galleryService;

