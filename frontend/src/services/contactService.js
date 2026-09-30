import api from '../api/api';

const contactService = {
  getAll: async (params) => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  submit: async (data) => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/contacts/${id}/status`, { status });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/contacts/${id}/read`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  }
};

export default contactService;
