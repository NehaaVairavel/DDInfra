import api from '../api/api';

const partService = {
  getPaginated: async (params) => {
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
    
    const response = await api.get(`/parts?${queryParams.toString()}`);
    return response.data;
  },
  
  getAll: async (params = {}) => {
    const response = await api.get('/parts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/parts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/parts', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/parts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/parts/${id}`);
    return response.data;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadVideos: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  duplicate: async (id) => {
    const response = await api.post(`/parts/${id}/duplicate`);
    return response.data;
  }
};

export default partService;
