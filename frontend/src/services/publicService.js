import api from '../api/api';

const publicService = {
  // Dashboard stats — requires JWT (admin only)
  getDashboardStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Public health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default publicService;
