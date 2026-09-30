import api from '../api/api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/admin/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        role: response.data.role
      }));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
