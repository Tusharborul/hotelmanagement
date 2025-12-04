const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Stripe = require('stripe');
const { inrToUsd } = require('../utils/currency');

// Normalize room type inputs/values to either 'AC' or 'Non-AC'
const normalizeRoomType = (t) => {
  if (!t && t !== 0) return '';
  const s = String(t || '').trim();
  if (/^ac$/i.test(s)) return 'AC';
  if (/^non[_\-\s]?ac$/i.test(s) || /^nonac$/i.test(s)) return 'Non-AC';
  return s;
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query;

    // If user is not admin, only show their bookings
    if (req.user.role !== 'admin') {
      query = Booking.find({ user: req.user.id });
    } else {
      query = Booking.find();
    }

    const bookings = await query
      .populate('user', 'name email phone username')
      .populate('hotel', 'name location price mainImage')
      .populate('room', 'number type')
      .populate('cancelledBy', 'name email')
      .populate('refundedBy', 'name email');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone username')
      .populate('hotel', 'name location price mainImage')
      .populate('room', 'number type')
      .populate('cancelledBy', 'name email')
      .populate('refundedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    // Prevent admins and hotel owners from creating bookings
    if (req.user && (req.user.role === 'admin' || req.user.role === 'hotelOwner')) {
      return res.status(403).json({ success: false, message: 'Admins and hotel owners are not allowed to create bookings.' });
    }
    let { hotel, checkInDate, checkOutDate, days, paymentDetails, roomType, roomsCount } = req.body;
    const qty = Math.max(1, Number(roomsCount) || 1);

    // Check if hotel exists
    const hotelData = await Hotel.findById(hotel);
    if (!hotelData) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Determine per-night price by room type
    const perNight = (() => {
      if (roomType) {
        const norm = normalizeRoomType(roomType);
        if (norm === 'AC') return Number(hotelData.priceAc) || 0;
        if (norm === 'Non-AC') return Number(hotelData.priceNonAc) || 0;
      }
      return 0;
    })();
    if (perNight <= 0) {
      console.warn(`[booking] pricing missing: hotel=${hotelData._id} roomType=${String(roomType).toUpperCase().replace('-', '_')} priceAc=${hotelData.priceAc} priceNonAc=${hotelData.priceNonAc}`);
      return res.status(400).json({ success:false, message:'Invalid or missing pricing for selected room type.' });
    }
    const totalPrice = perNight * days * qty;
    const initialPayment = Math.round(totalPrice / 2);

    // Normalize check-in/out times to 10:00 AM
    if (checkInDate) {
      const ci = new Date(checkInDate);
      ci.setHours(10, 0, 0, 0);
      checkInDate = ci.toISOString();
    }

    // Calculate check-out date if not provided, and normalize check-out to 10:00 AM
    let calculatedCheckOutDate = checkOutDate;
    if (calculatedCheckOutDate) {
      const co = new Date(calculatedCheckOutDate);
      co.setHours(10, 0, 0, 0);
      calculatedCheckOutDate = co.toISOString();
    } else if (checkInDate && days) {
      const checkOut = new Date(checkInDate);
      checkOut.setDate(checkOut.getDate() + days);
      checkOut.setHours(10, 0, 0, 0);
      calculatedCheckOutDate = checkOut.toISOString();
    }

    // Room-based availability and assignment
    const rooms = await Room.find({ hotel: hotelData._id, active: true }).lean();
    const usesRooms = rooms && rooms.length > 0;

    let assignedRoom = null;
    let assignedRoomNumber = '';
    let availableRooms = [];

    if (usesRooms) {
      const wantedType = normalizeRoomType(roomType);
      if (!(wantedType === 'AC' || wantedType === 'Non-AC')) {
        return res.status(400).json({ success: false, message: 'roomType is required (AC or Non-AC)' });
      }
      const candidates = rooms.filter(r => normalizeRoomType(r.type) === wantedType);
      if (candidates.length === 0) {
        return res.status(409).json({ success: false, message: `No rooms configured for type ${wantedType}` });
      }
      const start = new Date(checkInDate);
      const end = new Date(calculatedCheckOutDate);
      // Count how many rooms are available across the entire range
      let availableCount = 0;
      availableRooms = [];
      for (const r of candidates) {
        const overlap = await Booking.findOne({
          hotel: hotelData._id,
          room: r._id,
          status: 'confirmed',
          // overlap if (existing.checkIn < new.checkOut) && (existing.checkOut > new.checkIn)
          checkInDate: { $lt: end },
          checkOutDate: { $gt: start }
        }).select('_id');
        if (!overlap) { availableCount++; availableRooms.push(r); }
      }
      if (availableCount < qty) {
        return res.status(409).json({ success: false, message: `Only ${availableCount} ${wantedType} room(s) available for the selected dates.` });
      }
      // Assign the first available room as primary (for backward compat), and keep list for multi-booking
      assignedRoom = availableRooms[0]._id;
      assignedRoomNumber = availableRooms[0].number;
    } else {
      // Legacy per-day capacity across the whole stay when configured (>0)
      try {
        if (checkInDate && calculatedCheckOutDate) {
          const start = new Date(checkInDate);
          start.setHours(10, 0, 0, 0);
          const end = new Date(calculatedCheckOutDate);
          end.setHours(10, 0, 0, 0);
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const day = new Date(d);
            day.setHours(10, 0, 0, 0);
            const existingCount = await Booking.countDocuments({
              hotel: hotelData._id,
              status: 'confirmed',
              checkInDate: { $lte: day },
              checkOutDate: { $gt: day }
            });
            if (hotelData.dailyCapacity <= 0 || existingCount + qty > hotelData.dailyCapacity) {
              const msgDate = day.toISOString().split('T')[0];
              return res.status(409).json({ success: false, message: `Hotel is fully booked for ${msgDate}.` });
            }
          }
        }
      } catch (capErr) {
        console.error('Capacity check error:', capErr);
      }
    }

    // If paymentDetails contains a Stripe payment intent id, verify payment succeeded
    if (paymentDetails && paymentDetails.stripePaymentIntentId) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
      }
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentDetails.stripePaymentIntentId);
        if (pi.status !== 'succeeded') {
          return res.status(402).json({ success: false, message: 'Payment not completed' });
        }
        // Verify amount roughly matches initialPayment (allow tiny rounding)
        // Stored prices are in INR; Stripe amount is in USD cents
        const usd = await inrToUsd(Number(initialPayment));
        const expected = Math.round(Number(usd) * 100);
        if (Math.abs((pi.amount || 0) - expected) > 5) {
          // potential mismatch
          return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
        }
        // store charge id if available
        paymentDetails.stripeChargeId = (pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].id) || null;
      } catch (err) {
        console.error('Stripe verify error', err);
        return res.status(500).json({ success: false, message: 'Error verifying payment' });
      }
    }
    // Create one or multiple bookings based on qty
    if (qty === 1 || !usesRooms) {
      const booking = await Booking.create({
        user: req.user.id,
        hotel,
        roomType: usesRooms ? normalizeRoomType(roomType) : undefined,
        room: usesRooms ? assignedRoom : undefined,
        roomNumber: usesRooms ? assignedRoomNumber : '',
        roomsCount: qty,
        checkInDate,
        checkOutDate: calculatedCheckOutDate,
        days,
        totalPrice,
        initialPayment,
        paymentDetails,
        status: 'confirmed'
      });
      const populatedBooking = await Booking.findById(booking._id)
        .populate('user', 'name email phone username')
        .populate('hotel', 'name location priceAc priceNonAc mainImage')
        .populate('room', 'number type')
        .populate('cancelledBy', 'name email')
        .populate('refundedBy', 'name email');
      return res.status(201).json({ success: true, data: populatedBooking });
    }

    // Multi-room: create N bookings, each with per-room totals; verify Stripe PI only once above
    const perRoomTotal = perNight * days;
    const perRoomInitial = Math.round(perRoomTotal / 2);
    const created = [];
    for (let i = 0; i < qty; i++) {
      const r = availableRooms[i];
      const booking = await Booking.create({
        user: req.user.id,
        hotel,
        roomType: normalizeRoomType(roomType),
        room: r._id,
        roomNumber: r.number,
        roomsCount: 1,
        checkInDate,
        checkOutDate: calculatedCheckOutDate,
        days,
        totalPrice: perRoomTotal,
        initialPayment: perRoomInitial,
        paymentDetails,
        status: 'confirmed'
      });
      const populated = await Booking.findById(booking._id)
        .populate('user', 'name email phone username')
        .populate('hotel', 'name location priceAc priceNonAc mainImage')
        .populate('room', 'number type');
      created.push(populated);
    }
    return res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('hotel', 'name location price');

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete/Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Log attempt baseline
    console.log(`[booking-delete] user=${req.user.id} role=${req.user.role} booking=${booking._id} checkIn=${booking.checkInDate || booking.checkIn || booking.startDate}`);

    // Enforce cancellation policy: users may cancel only if check-in is more than 24 hours away.
    // Admins bypass this rule.
    const ms24 = 24 * 60 * 60 * 1000;
    const checkIn = booking.checkInDate || booking.checkIn || booking.startDate || null;
    if (req.user.role !== 'admin') {
      if (!checkIn) {
        return res.status(400).json({
          success: false,
          message: 'Cannot determine check-in date for this booking; cancellation denied.'
        });
      }
      const checkInTime = new Date(checkIn).getTime();
      if (Number.isNaN(checkInTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid check-in date on booking; cancellation denied.'
        });
      }
      const now = Date.now();
      if (checkInTime - now <= ms24) {
        return res.status(400).json({
          success: false,
          message: 'Bookings can only be cancelled at least 24 hours before check-in.'
        });
      }
    }

  // Update status to cancelled instead of deleting; record who and when
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user.id;
  // Record cancellation reason without exposing actor names: user.near (user), Indiastay (admin)
  booking.cancellationReason = req.user.role === 'admin' ? 'Indiastay' : 'user.near';
  // Calculate refund: policy = full initialPayment refund if cancelled >24h before check-in (or admin cancels)
  try {
    const now = Date.now();
    const ms24 = 24 * 60 * 60 * 1000;
    const checkInTime = new Date(booking.checkInDate || booking.checkIn || booking.startDate).getTime();
    let refundAmount = 0;
    if (req.user.role === 'admin') {
      refundAmount = booking.initialPayment || 0;
    } else if (!Number.isNaN(checkInTime) && (checkInTime - now > ms24)) {
      refundAmount = booking.initialPayment || 0;
    } else {
      refundAmount = 0;
    }

    booking.refundAmount = refundAmount;
    booking.refundStatus = refundAmount > 0 ? 'pending' : 'none';
    await booking.save();

    console.log(`[booking-cancelled] user=${req.user.id} booking=${booking._id} cancelledAt=${booking.cancelledAt} refund=${booking.refundAmount}`);
    } catch (err) {
    // If refund calc/save fails, still mark cancelled and continue
    console.error('[booking-cancel-error]', err);
    await booking.save();
  }

    // Return the updated populated booking so the frontend can reflect exact server state
    const populated = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name location priceAc priceNonAc mainImage')
      .populate('room', 'number type');

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Hard delete booking (admin only)
// @route   DELETE /api/bookings/:id/hard
// @access  Private (admin)
exports.hardDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.deleteOne();
    console.log(`[booking-hard-delete] admin=${req.user.id} booking=${booking._id}`);

    return res.status(200).json({
      success: true,
      message: 'Booking permanently deleted'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Issue refund for a booking (admin only)
// @route   POST /api/bookings/:id/refund
// @access  Private (admin)
exports.issueRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.refundAmount || booking.refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No refund due for this booking' });
    }

    if (booking.refundStatus === 'issued') {
      return res.status(400).json({ success: false, message: 'Refund already issued' });
    }

    // If a Stripe payment intent exists, try to issue a refund through Stripe
    const stripePaymentIntentId = booking.paymentDetails && booking.paymentDetails.stripePaymentIntentId;
    let stripeRefund = null;
    if (stripePaymentIntentId || (booking.paymentDetails && booking.paymentDetails.stripeChargeId)) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Stripe secret key not configured but booking has stripe payment identifiers');
        return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
      }
      try {
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const amount = Math.round((booking.refundAmount || 0) * 100);
        const stripeChargeId = booking.paymentDetails && booking.paymentDetails.stripeChargeId;
        if (stripeChargeId) {
          // Prefer refunding the charge id when available
          stripeRefund = await stripe.refunds.create({ charge: stripeChargeId, amount });
        } else {
          // Fall back to refunding by payment_intent
          stripeRefund = await stripe.refunds.create({ payment_intent: stripePaymentIntentId, amount });
        }
      } catch (stripeErr) {
        console.error('Stripe refund error', stripeErr);
        return res.status(500).json({ success: false, message: 'Failed to process refund via Stripe', stripeError: stripeErr.message });
      }
    } else {
      // No stripe payment attached: mark refund issued but note that no gateway refund was performed
      console.warn(`No stripe identifiers for booking ${booking._id}; marking refund as issued without gateway refund.`);
    }

    // Mark booking refunded (regardless of whether Stripe refund was performed)
    booking.refundStatus = 'issued';
    booking.refundedAt = new Date();
    booking.refundedBy = req.user.id;
    if (!booking.refundNotes) booking.refundNotes = [];
    booking.refundNotes.push({
      by: req.user.id,
      at: new Date(),
      via: stripePaymentIntentId ? 'stripe' : 'manual',
      stripeRefundId: stripeRefund ? stripeRefund.id : null
    });
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name location price mainImage')
      .populate('cancelledBy', 'name email')
      .populate('refundedBy', 'name email');

    console.log(`[refund-issued] admin=${req.user.id} booking=${booking._id} amount=${booking.refundAmount}`);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for a hotel
// @route   GET /api/hotels/:hotelId/bookings
// @access  Private (Hotel Owner)
exports.getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Make sure user is hotel owner
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access these bookings'
      });
    }

    const bookings = await Booking.find({ hotel: req.params.hotelId })
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create offline booking (cash) by hotel owner/admin
// @route   POST /api/bookings/offline
// @access  Private (Hotel Owner, Admin)
exports.createOfflineBooking = async (req, res) => {
  try {
    const { hotel: hotelId, checkInDate, checkOutDate, days, guestName, guestPhone, guestEmail, guestCountry, guestCountryCode, guestUsername, guestPassword, userId, roomType, roomsCount } = req.body;
    const qty = Math.max(1, Number(roomsCount) || 1);

    // Only hotelOwner or admin allowed
    if (!(req.user && (req.user.role === 'hotelOwner' || req.user.role === 'admin'))) {
      return res.status(403).json({ success: false, message: 'Not authorized to create offline bookings' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    // If hotelOwner, ensure they own the hotel
    if (req.user.role === 'hotelOwner' && hotel.owner.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized for this hotel' });
    }

    // Compute derived values
    const stayDays = days && Number(days) > 0 ? Number(days) : (() => {
      if (checkInDate && checkOutDate) {
        const ci = new Date(checkInDate);
        const co = new Date(checkOutDate);
        const diff = Math.ceil((co - ci) / (24 * 60 * 60 * 1000));
        return Math.max(diff, 1);
      }
      return 1;
    })();
    const perNightOffline = (() => {
      if (roomType) {
        const norm = normalizeRoomType(roomType);
        if (norm === 'AC') return Number(hotel.priceAc) || 0;
        if (norm === 'Non-AC') return Number(hotel.priceNonAc) || 0;
      }
      return 0;
    })();
    if (perNightOffline <= 0) {
      return res.status(400).json({ success:false, message:'Invalid or missing pricing for selected room type.' });
    }
    const totalPrice = perNightOffline * stayDays * qty;
    const initialPayment = totalPrice; // cash received fully or partially; default assume full cash

    // Compute normalized check-in and check-out at 10:00 AM
    let normalizedCheckIn = checkInDate ? new Date(checkInDate) : null;
    if (normalizedCheckIn) normalizedCheckIn.setHours(10, 0, 0, 0);
    let normalizedCheckOut = checkOutDate ? new Date(checkOutDate) : null;
    if (!normalizedCheckOut && normalizedCheckIn && stayDays) {
      const co = new Date(normalizedCheckIn);
      co.setDate(co.getDate() + stayDays);
      co.setHours(10, 0, 0, 0);
      normalizedCheckOut = co;
    } else if (normalizedCheckOut) {
      normalizedCheckOut.setHours(10, 0, 0, 0);
    }

    // Room-based assignment or legacy capacity
    const rooms = await Room.find({ hotel: hotel._id, active: true }).lean();
    const usesRooms = rooms && rooms.length > 0;
    let assignedRoom = null;
    let assignedRoomNumber = '';
    if (usesRooms) {
      const wantedType = normalizeRoomType(roomType);
      if (!(wantedType === 'AC' || wantedType === 'Non-AC')) {
        return res.status(400).json({ success: false, message: 'roomType is required (AC or Non-AC)' });
      }
      const candidates = rooms.filter(r => normalizeRoomType(r.type) === wantedType);
      if (!candidates.length) return res.status(409).json({ success: false, message: `No rooms configured for type ${wantedType}` });
      const start = normalizedCheckIn;
      const end = normalizedCheckOut;
      // Ensure qty rooms available for full range
      let availableCount = 0;
      for (const r of candidates) {
        const overlap = await Booking.findOne({
          hotel: hotel._id,
          room: r._id,
          status: 'confirmed',
          checkInDate: { $lt: end },
          checkOutDate: { $gt: start }
        }).select('_id');
        if (!overlap) availableCount++;
      }
      if (availableCount < qty) return res.status(409).json({ success: false, message: `Only ${availableCount} ${wantedType} room(s) available for the selected dates.` });
      // Assign at least one room
      for (const r of candidates) {
        const overlap = await Booking.findOne({
          hotel: hotel._id,
          room: r._id,
          status: 'confirmed',
          checkInDate: { $lt: end },
          checkOutDate: { $gt: start }
        }).select('_id');
        if (!overlap) { assignedRoom = r._id; assignedRoomNumber = r.number; break; }
      }
      if (!assignedRoom) return res.status(409).json({ success: false, message: `No available ${wantedType} rooms for selected dates.` });
    } else {
      try {
        if (hotel.dailyCapacity && hotel.dailyCapacity > 0 && normalizedCheckIn) {
          const start = new Date(normalizedCheckIn);
          const end = new Date(normalizedCheckOut);
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const day = new Date(d);
            day.setHours(10, 0, 0, 0);
            const existingCount = await Booking.countDocuments({
              hotel: hotel._id,
              status: 'confirmed',
              checkInDate: { $lte: day },
              checkOutDate: { $gt: day }
            });
            if (existingCount > (hotel.dailyCapacity - qty)) {
              const msgDate = day.toISOString().split('T')[0];
              return res.status(409).json({ success: false, message: `Hotel is fully booked for ${msgDate}.` });
            }
          }
        }
      } catch (capErr) {
        console.error('Capacity check error (offline):', capErr);
      }
    }

    // Create booking: store guest details in paymentDetails meta
    // Validate required guest fields when not using an existing userId
    if (!userId) {
      const missing = [];
      if (!guestName) missing.push('guestName');
      if (!guestEmail) missing.push('guestEmail');
      if (!guestPhone) missing.push('guestPhone');
      const country = guestCountry || 'India';
      if (!country) missing.push('guestCountry');
      if (!guestCountryCode) missing.push('guestCountryCode');
      if (!guestUsername) missing.push('guestUsername');
      if (!guestPassword) missing.push('guestPassword');
      if (missing.length) {
        return res.status(400).json({ success:false, message:`Missing required fields: ${missing.join(', ')}` });
      }
    }

    // Determine / create target user for the booking
    const User = require('../models/User');
    let targetUser = null;

    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      // Try reuse by email/username
      if (guestEmail) {
        const existingByEmail = await User.findOne({ email: guestEmail.toLowerCase() });
        if (existingByEmail) {
          return res.status(409).json({ success:false, message:'User already exists with this email. Please use the existing account.' });
        }
      }
      if (guestUsername) {
        const existingByUsername = await User.findOne({ username: guestUsername });
        if (existingByUsername) {
          return res.status(409).json({ success:false, message:'Username already taken. Choose a different username.' });
        }
      }
      // Create a new user with provided credentials
      targetUser = await User.create({
        name: guestName,
        email: guestEmail.toLowerCase(),
        phone: guestPhone,
        country: guestCountry || 'India',
        countryCode: guestCountryCode,
        username: guestUsername,
        password: guestPassword,
        role: 'user'
      });
    }

    if (!targetUser) {
      return res.status(400).json({ success:false, message:'Unable to resolve user for offline booking' });
    }

    const booking = await Booking.create({
      user: targetUser._id,
      hotel: hotel._id,
      roomType: usesRooms ? (roomType || '').toUpperCase() : undefined,
      room: usesRooms ? assignedRoom : undefined,
      roomNumber: usesRooms ? assignedRoomNumber : '',
      checkInDate: normalizedCheckIn ? normalizedCheckIn.toISOString() : undefined,
      checkOutDate: normalizedCheckOut ? normalizedCheckOut.toISOString() : undefined,
      days: stayDays,
      roomsCount: qty,
      totalPrice,
      initialPayment,
      paymentDetails: {
        method: 'cash',
        received: true,
        guestName: guestName || targetUser.name,
        guestPhone: guestPhone || targetUser.phone
      },
      status: 'confirmed',
      createdBy: req.user.id,
      offlineCash: true
    });

    const populated = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name location priceAc priceNonAc mainImage');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createOfflineBooking error', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
