import api from '../api/api';

const heroMediaService = {
  getAll: async () => {
    const response = await api.get('/hero-media');
    return response.data;
  },

  // Upload one or more image/video files
  upload: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    const response = await api.post('/hero-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const result = response.data;
    return Array.isArray(result) ? result : [result];
  },

  // Add a YouTube video slide by URL
  addYouTube: async ({ youtube_url, name }) => {
    const response = await api.post('/hero-media/youtube', { youtube_url, name });
    return response.data;
  },

  // Update enabled/order/fit fields
  update: async (id, data) => {
    const response = await api.put(`/hero-media/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/hero-media/${id}`);
    return response.data;
  },
};

export default heroMediaService;
