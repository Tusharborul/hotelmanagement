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
  }
};
