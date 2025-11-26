const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  // we'll add hardDeleteBooking and issueRefund below
  hardDeleteBooking,
  issueRefund,
  getHotelBookings,
  createOfflineBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router
  .route('/:id')
  .get(protect, getBooking)
  .put(protect, updateBooking)
  .delete(protect, deleteBooking);

// Admin-only hard delete
router.delete('/:id/hard', protect, authorize('admin'), hardDeleteBooking);
router.post('/:id/refund', protect, authorize('admin'), issueRefund);

// Get bookings for a specific hotel
router.get('/hotel/:hotelId', protect, authorize('hotelOwner', 'admin'), getHotelBookings);

// Offline booking (cash) by hotel owner/admin
router.post('/offline', protect, authorize('hotelOwner', 'admin'), createOfflineBooking);

module.exports = router;
