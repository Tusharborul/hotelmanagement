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
    expDate: String,
    // Stripe identifiers to enable refunds
    stripePaymentIntentId: String,
    stripeChargeId: String,
    // optional: payment method id (can help with support/debug)
    stripePaymentMethodId: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'issued', 'none'],
    default: 'none'
  },
  refundedAt: {
    type: Date
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundNotes: {
    type: [
      {
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        via: { type: String },
        stripeRefundId: { type: String }
      }
    ],
    default: []
  },
  // Track who created the booking if different from the booked user (offline owner/admin action)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Flag offline cash booking
  offlineCash: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate check-out date and days if not provided
bookingSchema.pre('save', function(next) {
  // Normalize check-in/check-out times to 10:00 AM (local server time)
  if (this.checkInDate) {
    const ci = new Date(this.checkInDate);
    ci.setHours(10, 0, 0, 0);
    this.checkInDate = ci;
  }

  if (this.checkOutDate) {
    const co = new Date(this.checkOutDate);
    co.setHours(10, 0, 0, 0);
    this.checkOutDate = co;
  }

  // Calculate check-out date and normalize to 10:00 AM if not provided
  if (this.checkInDate && this.days && !this.checkOutDate) {
    const checkOut = new Date(this.checkInDate);
    checkOut.setDate(checkOut.getDate() + this.days);
    checkOut.setHours(10, 0, 0, 0);
    this.checkOutDate = checkOut;
  }

  if (!this.initialPayment && this.totalPrice) {
    this.initialPayment = Math.round(this.totalPrice / 2);
  }
  
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
