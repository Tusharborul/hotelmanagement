const express = require('express');
const {
  register,
  login,
  getMe,
  updateUser,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
// allow profile photo upload as `image` field (multipart/form-data)
router.put('/me', protect, upload.single('image'), updateUser);
router.post('/change-password', protect, changePassword);

module.exports = router;
