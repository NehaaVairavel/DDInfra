import api from '../api/api';

const settingsService = {
  get: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  update: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  }
};

export default settingsService;
