const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please provide check-in date']
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please provide check-out date']
  },
  days: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  initialPayment: {
    type: Number,
    required: true
  },
  paymentDetails: {
    cardNumber: String,
    bank: String,
    expDate: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate check-out date and days if not provided
bookingSchema.pre('save', function(next) {
  if (this.checkInDate && this.days && !this.checkOutDate) {
    const checkOut = new Date(this.checkInDate);
    checkOut.setDate(checkOut.getDate() + this.days);
    this.checkOutDate = checkOut;
  }
  
  if (!this.initialPayment && this.totalPrice) {
    this.initialPayment = Math.round(this.totalPrice / 2);
  }
  
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
