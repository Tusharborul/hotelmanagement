const express = require('express');
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  addReview,
  getMyHotels,
  setMainImage,
  addImages,
  deleteImage,
  addTreasure,
  updateTreasure,
  deleteTreasure,
  checkAvailability,
  addRooms,
  listRooms,
  deleteRoom,
  updateRoom,
  calendarAvailability
} = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router
  .route('/')
  .get(getHotels)
  .post(
    protect,
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 }
    ]),
    createHotel
  );

// Owner's hotels - MUST come before /:id to avoid matching "owner" as id
router.get('/owner/mine', protect, authorize('hotelOwner','admin'), getMyHotels);

// Media management - specific routes before /:id
router.put('/:id/main-image', protect, authorize('hotelOwner','admin'), upload.single('image'), setMainImage);
router.post('/:id/images', protect, authorize('hotelOwner','admin'), upload.array('images', 10), addImages);
router.delete('/:id/images/:filename', protect, authorize('hotelOwner','admin'), deleteImage);

// Treasures management - specific routes before /:id
router.post('/:id/treasures', protect, authorize('hotelOwner','admin'), upload.single('image'), addTreasure);
router.put('/:id/treasures/:treasureId', (req, res, next) => {
  console.log('PUT /hotels/:id/treasures/:treasureId route hit', { id: req.params.id, treasureId: req.params.treasureId });
  next();
}, protect, authorize('hotelOwner','admin'), upload.single('image'), updateTreasure);
router.delete('/:id/treasures/:treasureId', (req, res, next) => {
  console.log('DELETE /hotels/:id/treasures/:treasureId route hit', { id: req.params.id, treasureId: req.params.treasureId });
  next();
}, protect, authorize('hotelOwner','admin'), deleteTreasure);

// Reviews
router.post('/:id/reviews', protect, addReview);

// Availability check (public)
router.get('/:id/availability', checkAvailability);
// Calendar availability (public)
router.get('/:id/calendar-availability', calendarAvailability);

// Rooms management
router.post('/:id/rooms', protect, authorize('hotelOwner','admin'), addRooms);
router.get('/:id/rooms', protect, authorize('hotelOwner','admin'), listRooms);
router.put('/:id/rooms/:roomId', protect, authorize('hotelOwner','admin'), updateRoom);
router.delete('/:id/rooms/:roomId', protect, authorize('hotelOwner','admin'), deleteRoom);

// Generic hotel CRUD - MUST be last to avoid capturing specific routes
router
  .route('/:id')
  .get(getHotel)
  .put(protect, updateHotel)
  .delete(protect, deleteHotel);

module.exports = router;
