import api from './api';

// Hotel services
export const hotelService = {
  // Get all hotels with optional filters
  getHotels: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.popular) params.append('popular', 'true');
    if (filters.mostPicked) params.append('mostPicked', 'true');
    if (filters.location) params.append('location', filters.location);
    
    const response = await api.get(`/hotels?${params.toString()}`);
    return response.data;
  },

  // Get single hotel by ID
  getHotel: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },

  // Check availability for a hotel given checkInDate and days (optionally by type)
  checkAvailability: async (id, checkInDate, days, roomType) => {
    const params = new URLSearchParams();
    params.append('checkInDate', checkInDate);
    params.append('days', String(days));
    if (roomType) params.append('roomType', roomType);
    const res = await api.get(`/hotels/${id}/availability?${params.toString()}`);
    return res.data;
  },

  // Calendar availability between start and end (YYYY-MM-DD)
  getCalendarAvailability: async (id, start, end) => {
    const params = new URLSearchParams();
    params.append('start', start);
    params.append('end', end);
    const res = await api.get(`/hotels/${id}/calendar-availability?${params.toString()}`);
    return res.data;
  },

  // Rooms management (owner)
  addRooms: async (hotelId, payload) => {
    // payload: { rooms: [{number, type}] } OR { acCount, nonAcCount }
    const res = await api.post(`/hotels/${hotelId}/rooms`, payload);
    return res.data;
  },
  listRooms: async (hotelId) => {
    const res = await api.get(`/hotels/${hotelId}/rooms`);
    return res.data;
  },
  updateRoom: async (hotelId, roomId, payload) => {
    const res = await api.put(`/hotels/${hotelId}/rooms/${roomId}`, payload);
    return res.data;
  },
  deleteRoom: async (hotelId, roomId) => {
    const res = await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
    return res.data;
  },

  // Create new hotel (with file upload)
  createHotel: async (hotelData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(hotelData).forEach(key => {
      if (key !== 'images' && key !== 'documents') {
        if (key === 'facilities') {
          formData.append(key, JSON.stringify(hotelData[key]));
        } else {
          formData.append(key, hotelData[key]);
        }
      }
    });
    
    // Append images
    if (hotelData.images) {
      Array.from(hotelData.images).forEach(file => {
        formData.append('images', file);
      });
    }
    
    // Append documents
    if (hotelData.documents) {
      Array.from(hotelData.documents).forEach(file => {
        formData.append('documents', file);
      });
    }
    
    const response = await api.post('/hotels', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update hotel
  updateHotel: async (id, hotelData) => {
    const response = await api.put(`/hotels/${id}`, hotelData);
    return response.data;
  },

  // Delete hotel
  deleteHotel: async (id) => {
    const response = await api.delete(`/hotels/${id}`);
    return response.data;
  },

  // Add review to hotel
  addReview: async (hotelId, reviewData) => {
    const response = await api.post(`/hotels/${hotelId}/reviews`, reviewData);
    return response.data;
  },

  // Owner's hotels
  getMyHotels: async () => {
    const response = await api.get('/hotels/owner/mine');
    return response.data;
  },

  // Photos management
  getPhotos: async (hotelId) => {
    const res = await api.get(`/hotels/${hotelId}/photos`);
    return res.data;
  },
  updateMainImage: async (hotelId, file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await api.put(`/hotels/${hotelId}/main-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  addImages: async (hotelId, files) => {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    const res = await api.post(`/hotels/${hotelId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  deleteImage: async (hotelId, filename) => {
    const res = await api.delete(`/hotels/${hotelId}/images/${encodeURIComponent(filename)}`);
    return res.data;
  },

  // Treasures management
  getTreasures: async (hotelId) => {
    const res = await api.get(`/hotels/${hotelId}/treasures`);
    return res.data;
  },
  addTreasure: async (hotelId, { title, subtitle, popular, image }) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('subtitle', subtitle);
    if (typeof popular !== 'undefined') fd.append('popular', Boolean(popular));
    if (image) fd.append('image', image);
    const res = await api.post(`/hotels/${hotelId}/treasures`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  updateTreasure: async (hotelId, treasureId, { title, subtitle, popular, image }) => {
    const fd = new FormData();
    if (typeof title !== 'undefined') fd.append('title', title);
    if (typeof subtitle !== 'undefined') fd.append('subtitle', subtitle);
    if (typeof popular !== 'undefined') fd.append('popular', Boolean(popular));
    if (image) fd.append('image', image);
    const res = await api.put(`/hotels/${hotelId}/treasures/${treasureId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  deleteTreasure: async (hotelId, treasureId) => {
    const res = await api.delete(`/hotels/${hotelId}/treasures/${treasureId}`);
    return res.data;
  }
};
