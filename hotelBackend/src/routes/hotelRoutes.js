const express = require('express');
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  addReview
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

router
  .route('/:id')
  .get(getHotel)
  .put(protect, updateHotel)
  .delete(protect, deleteHotel);

router.post('/:id/reviews', protect, addReview);

module.exports = router;
