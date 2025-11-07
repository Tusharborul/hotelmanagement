import api from './api';

export const adminService = {
  getUsers: async ({ role, page=1, limit=20 } = {}) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    params.append('page', page);
    params.append('limit', limit);
    const res = await api.get(`/admin/users?${params.toString()}`);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  getOwners: async ({ page=1, limit=20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    const res = await api.get(`/admin/owners?${params.toString()}`);
    return res.data;
  },
  getHotels: async ({ status, page=1, limit=20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const res = await api.get(`/admin/hotels?${params.toString()}`);
    return res.data;
  },
  updateHotelStatus: async (hotelId, status) => {
    const res = await api.put(`/admin/hotels/${hotelId}/status`, { status });
    return res.data;
  },
  getBookings: async ({ start, end, page=1, limit=20, field } = {}) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (field) params.append('field', field);
    params.append('page', page);
    params.append('limit', limit);
    const res = await api.get(`/admin/bookings?${params.toString()}`);
    return res.data;
  }
  ,
  issueRefund: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/refund`);
    return res.data;
  }
};
