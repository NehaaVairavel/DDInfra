import api from '../api/api';

const enquiryService = {
  getAll: async () => {
    const response = await api.get('/enquiries');
    return response.data;
  },

  submit: async (data) => {
    const response = await api.post('/enquiries', data);
    return response.data;
  },

  // Update any field on an enquiry (including status)
  update: async (id, data) => {
    const response = await api.put(`/enquiries/${id}`, data);
    return response.data;
  },

  // Dedicated status update — hits the /status sub-route on backend
  updateStatus: async (id, status) => {
    const response = await api.put(`/enquiries/${id}/status`, { status });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/enquiries/${id}/read`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/enquiries/${id}`);
    return response.data;
  }
};

export default enquiryService;
