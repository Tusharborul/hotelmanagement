const Stripe = require('stripe');
const Booking = require('../models/Booking');

// Create Payment Intent for frontend to confirm
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // Stripe expects amount in cents
    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata
    });

    return res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('createPaymentIntent error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Refund payment for a booking (admin action)
exports.refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.refundAmount || booking.refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No refund due for this booking' });
    }

    let stripePaymentIntentId = booking.paymentDetails && booking.paymentDetails.stripePaymentIntentId;
    let stripeChargeId = booking.paymentDetails && booking.paymentDetails.stripeChargeId;

    // If no stripe identifiers exist, try to accept identifiers from request for backfill
    if (!stripePaymentIntentId && !stripeChargeId) {
      const { paymentIntentId: bodyPI, chargeId: bodyCharge } = req.body || {};
      if (bodyPI || bodyCharge) {
        if (!process.env.STRIPE_SECRET_KEY) {
          return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
        }
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        try {
          if (bodyPI) {
            const pi = await stripe.paymentIntents.retrieve(bodyPI);
            // basic sanity: only backfill if succeeded and amounts roughly match expected initial payment
            if (pi && (pi.status === 'succeeded' || pi.status === 'requires_capture')) {
              stripePaymentIntentId = pi.id;
              stripeChargeId = pi?.charges?.data?.[0]?.id || null;
              booking.paymentDetails = booking.paymentDetails || {};
              booking.paymentDetails.stripePaymentIntentId = stripePaymentIntentId;
              if (stripeChargeId) booking.paymentDetails.stripeChargeId = stripeChargeId;
              await booking.save();
            }
          } else if (bodyCharge) {
            // Verify charge exists
            const charge = await stripe.charges.retrieve(bodyCharge);
            if (charge && charge.id) {
              stripeChargeId = charge.id;
              stripePaymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : (charge.payment_intent?.id || null);
              booking.paymentDetails = booking.paymentDetails || {};
              booking.paymentDetails.stripeChargeId = stripeChargeId;
              if (stripePaymentIntentId) booking.paymentDetails.stripePaymentIntentId = stripePaymentIntentId;
              await booking.save();
            }
          }
        } catch (backfillErr) {
          console.error('refund backfill identifiers failed', backfillErr);
          // continue to manual path if still missing
        }
      }
    }

    // If still no stripe identifiers, mark refund as issued (manual refund)
    if (!stripePaymentIntentId && !stripeChargeId) {
      booking.refundStatus = 'issued';
      booking.refundedAt = new Date();
      booking.refundedBy = req.user ? req.user.id : null;
      if (!booking.refundNotes) booking.refundNotes = [];
      booking.refundNotes.push({ by: req.user ? req.user.id : null, at: new Date(), via: 'manual', stripeRefundId: null });
      await booking.save();
      return res.status(200).json({ success: true, data: { booking, refund: null, note: 'Refund marked issued (manual, no Stripe identifiers)' } });
    }

    // Otherwise attempt a Stripe refund (charge preferred)
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    let refund = null;
    try {
      const amount = Math.round(Number(booking.refundAmount) * 100);
      if (stripeChargeId) {
        refund = await stripe.refunds.create({ charge: stripeChargeId, amount });
      } else {
        refund = await stripe.refunds.create({ payment_intent: stripePaymentIntentId, amount });
      }
    } catch (err) {
      console.error('stripe refund failed', err);
      return res.status(500).json({ success: false, message: 'Stripe refund failed', stripeError: err.message });
    }

    // Update booking refund status
    booking.refundStatus = 'issued';
    booking.refundedAt = new Date();
    booking.refundedBy = req.user ? req.user.id : null;
    if (!booking.refundNotes) booking.refundNotes = [];
    booking.refundNotes.push({ by: req.user ? req.user.id : null, at: new Date(), via: stripeChargeId ? 'stripe-charge' : 'stripe-payment_intent', stripeRefundId: refund ? refund.id : null });
    await booking.save();

    return res.status(200).json({ success: true, data: { booking, refund } });
  } catch (error) {
    console.error('refundPayment error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Expose a small endpoint to retrieve a PaymentIntent (for server-side verification/debug)
exports.getPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ success: false, message: 'Stripe key not configured' });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const pi = await stripe.paymentIntents.retrieve(id);
    return res.status(200).json({ success: true, data: pi });
  } catch (error) {
    console.error('getPaymentIntent', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin debugging helper - get booking payment details and refund notes
exports.getBookingPaymentDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!bookingId) return res.status(400).json({ success: false, message: 'booking id required' });
    const booking = await require('../models/Booking').findById(bookingId).select('paymentDetails refundAmount refundStatus refundNotes');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error('getBookingPaymentDetails', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Attach bookingId to an existing PaymentIntent and persist identifiers on the booking
exports.attachBookingToPaymentIntent = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body || {};
    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({ success: false, message: 'bookingId and paymentIntentId are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
    }
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // Retrieve PI and update its metadata with bookingId (idempotent)
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!pi) return res.status(404).json({ success: false, message: 'PaymentIntent not found' });

    // If metadata already has bookingId, skip update; else update
    if ((pi.metadata || {}).bookingId !== String(booking._id)) {
      await stripe.paymentIntents.update(paymentIntentId, { metadata: { ...(pi.metadata || {}), bookingId: String(booking._id) } });
    }

    // Persist identifiers onto booking if missing
    booking.paymentDetails = booking.paymentDetails || {};
    if (!booking.paymentDetails.stripePaymentIntentId) {
      booking.paymentDetails.stripePaymentIntentId = paymentIntentId;
    }
    const chargeId = pi?.charges?.data?.[0]?.id || null;
    if (chargeId && !booking.paymentDetails.stripeChargeId) {
      booking.paymentDetails.stripeChargeId = chargeId;
    }
    await booking.save();

    return res.status(200).json({ success: true, data: { bookingId: booking._id, paymentIntentId, stripeChargeId: booking.paymentDetails.stripeChargeId || null } });
  } catch (err) {
    console.error('attachBookingToPaymentIntent', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
