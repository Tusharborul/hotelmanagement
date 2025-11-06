import api from './api';

// Booking services
export const bookingService = {
  // Get all bookings for current user
  getBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  // Get single booking
  getBooking: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Update booking
  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  // Get bookings for a hotel (hotel owner only)
  getHotelBookings: async (hotelId) => {
    const response = await api.get(`/bookings/hotel/${hotelId}`);
    return response.data;
  },

  // Admin date-wise bookings
  getAdminBookings: async (params) => {
    const search = new URLSearchParams(params || {});
    const response = await api.get(`/admin/bookings?${search.toString()}`);
    return response.data;
  }
};
