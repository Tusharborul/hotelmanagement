const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  updateUser,
  deleteUser,
  getOwners,
  getHotelsForAdmin,
  updateHotelStatus,
  getBookingsByDate,
  getOwnerHotels,
  bulkUpdateOwnerHotelsStatus
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/owners', getOwners);
router.get('/owners/:id/hotels', getOwnerHotels);
router.get('/hotels', getHotelsForAdmin);
router.put('/hotels/:id/status', updateHotelStatus);
router.put('/owners/:id/hotels/status', bulkUpdateOwnerHotelsStatus);

router.get('/bookings', getBookingsByDate);

module.exports = router;
