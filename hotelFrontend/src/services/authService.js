import api from './api';

// User authentication services
export const authService = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    // If a file is included, send multipart/form-data so backend (multer/cloudinary) can handle it
    let response;
    if (userData && (userData.photo instanceof File || userData.photo instanceof Blob)) {
      const form = new FormData();
      if (userData.name) form.append('name', userData.name);
      if (userData.email) form.append('email', userData.email);
      if (userData.phone) form.append('phone', userData.phone);
      if (userData.country) form.append('country', userData.country);
      // backend expects the image field as `image` (multer middleware used in routes)
      form.append('image', userData.photo);
      response = await api.put('/users/me', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else if (userData && userData.photo) {
      // non-File photo (e.g., preview URL) - still attempt to send as form to be safe
      const form = new FormData();
      if (userData.name) form.append('name', userData.name);
      if (userData.email) form.append('email', userData.email);
      if (userData.phone) form.append('phone', userData.phone);
      if (userData.country) form.append('country', userData.country);
      form.append('image', userData.photo);
      response = await api.put('/users/me', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      response = await api.put('/users/me', userData);
    }
    if (response.data && response.data.data) {
      const currentUser = authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data.data }));
    }
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};
