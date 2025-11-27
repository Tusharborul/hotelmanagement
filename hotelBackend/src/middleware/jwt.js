const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = this.generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      // include avatar so frontend has immediate access after login/register
      avatar: user.avatar || { url: '', public_id: '' }
    }
  });
};
