const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

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
      .populate('user', 'name email phone')
      .populate('hotel', 'name location price mainImage')
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
      .populate('user', 'name email phone')
      .populate('hotel', 'name location price mainImage')
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
    let { hotel, checkInDate, checkOutDate, days, paymentDetails } = req.body;

    // Check if hotel exists
    const hotelData = await Hotel.findById(hotel);
    if (!hotelData) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Calculate total price and initial payment
    const totalPrice = hotelData.price * days;
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

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      hotel,
      checkInDate,
      checkOutDate: calculatedCheckOutDate,
      days,
      totalPrice,
      initialPayment,
      paymentDetails,
      status: 'confirmed'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name location price mainImage')
      .populate('cancelledBy', 'name email')
      .populate('refundedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
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
  // Record cancellation reason without exposing actor names: user.near (user), lankastay (admin)
  booking.cancellationReason = req.user.role === 'admin' ? 'lankastay' : 'user.near';
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
      .populate('hotel', 'name location price mainImage');

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

    // Simulate refund processing. In production, integrate payment gateway here.
    booking.refundStatus = 'issued';
    booking.refundedAt = new Date();
    booking.refundedBy = req.user.id;
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
