const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create a payment intent for a given amount (authenticated users)
router.post('/create-payment-intent', protect, paymentController.createPaymentIntent);

// Admin refund endpoint - refunds the configured refund amount for a booking
router.post('/refund', protect, authorize('admin'), paymentController.refundPayment);

// Retrieve payment intent (optional)
router.get('/intent/:id', protect, authorize('admin'), paymentController.getPaymentIntent);

// Debug: get booking payment details (admin only)
router.get('/booking/:id', protect, authorize('admin'), paymentController.getBookingPaymentDetails);
// Attach booking to payment intent (ensure metadata + booking has stripe ids)
router.post('/attach-booking', protect, authorize('admin','user'), paymentController.attachBookingToPaymentIntent);

module.exports = router;
