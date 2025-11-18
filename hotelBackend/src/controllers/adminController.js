const User = require('../models/User');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// Parse a YYYY-MM-DD string into a Date at local 00:00:00 (start) or 23:59:59.999 (end)
const parseDateOnly = (s, endOfDay = false) => {
  if (!s) return null;
  // expect YYYY-MM-DD
  const parts = s.split('-').map((p) => Number(p));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  if (endOfDay) return new Date(y, m - 1, d, 23, 59, 59, 999);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

// Helper for pagination
const paginate = async (modelQuery, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    modelQuery.skip(skip).limit(limit),
    modelQuery.model.countDocuments(modelQuery.getQuery())
  ]);
  return { data, total, page, pages: Math.ceil(total / limit), limit };
};

// GET /api/admin/users?role=user|hotelOwner|admin&page=&limit=
exports.getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    let query = User.find(role ? { role } : {} ).sort({ createdAt: -1 });
    const result = await paginate(query, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const fields = {};
    ['name','username','email','role','phone','country','ownerApproved'].forEach(k=>{
      if (req.body[k] !== undefined) fields[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/owners - list hotel owners with hotel status
exports.getOwners = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { role: 'hotelOwner' } },
      { $lookup: { from: 'hotels', localField: '_id', foreignField: 'owner', as: 'hotels' } },
      { $project: { 
        username: 1, 
        name:1, 
        createdAt:1, 
        ownerApproved: 1,
        hotelCount: { $size: '$hotels' }, 
        statuses: '$hotels.status',
        hotels: {
          $map: {
            input: '$hotels',
            as: 'h',
            in: { _id: '$$h._id', status: '$$h.status' }
          }
        }
      } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];
    const data = await User.aggregate(pipeline);
    const total = await User.countDocuments({ role: 'hotelOwner' });
    res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total/limit), limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/hotels/:id/status - update hotel status (pending/approved/rejected)
exports.updateHotelStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    // If hotel is moved out of 'approved' state (e.g., rejected or pending), cancel & refund active bookings
    try {
      if (status !== 'approved') {
        const Booking = require('../models/Booking');
        const bookings = await Booking.find({ hotel: hotel._id, status: { $in: ['pending','confirmed'] } });
        for (const b of bookings) {
          b.status = 'cancelled';
          b.cancelledAt = new Date();
          b.cancelledBy = req.user.id; // admin
          // Use short token to avoid exposing admin/owner names in cancellation reason
          // tokens: 'user.near' (user), 'lankastay' (admin), 'hotel' (hotel owner)
          b.cancellationReason = 'lankastay';
          const refundAmount = b.initialPayment || 0;
          b.refundAmount = refundAmount;
          if (refundAmount > 0) {
            b.refundStatus = 'issued';
            b.refundedAt = new Date();
            b.refundedBy = req.user.id;
          } else {
            b.refundStatus = 'none';
          }
          await b.save();
          console.log(`[auto-refund][admin-status-change] booking=${b._id} status=${status} refund=${b.refundAmount} reason=${b.cancellationReason}`);
        }
      }
    } catch (err) {
      console.error('Error auto-refunding bookings during admin status change:', err);
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/owners/:id/hotels - list minimal hotel docs for an owner
exports.getOwnerHotels = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const hotels = await Hotel.find({ owner: ownerId }).select('_id status createdAt').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: hotels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/owners/:id/hotels/status - bulk update all hotels of an owner
exports.bulkUpdateOwnerHotelsStatus = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const { status } = req.body;
    if (!status || !['pending','approved','rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const hotels = await Hotel.find({ owner: ownerId });
    const results = [];
    for (const hotel of hotels) {
      // update status
      hotel.status = status;
      await hotel.save({ validateModifiedOnly: true });

      // mirror the auto-refund logic when moving away from approved
      if (status !== 'approved') {
        try {
          const bookings = await Booking.find({ hotel: hotel._id, status: { $in: ['pending','confirmed'] } });
          for (const b of bookings) {
            b.status = 'cancelled';
            b.cancelledAt = new Date();
            b.cancelledBy = req.user.id;
            b.cancellationReason = 'lankastay';
            const refundAmount = b.initialPayment || 0;
            b.refundAmount = refundAmount;
            if (refundAmount > 0) {
              b.refundStatus = 'issued';
              b.refundedAt = new Date();
              b.refundedBy = req.user.id;
            } else {
              b.refundStatus = 'none';
            }
            await b.save();
          }
        } catch (err) {
          console.error('bulkUpdateOwnerHotelsStatus refund loop error:', err);
        }
      }
      results.push({ _id: hotel._id, status: hotel.status });
    }
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/hotels - list hotels for admin review
exports.getHotelsForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = {};
    if (status) queryObj.status = status;
    const q = Hotel.find(queryObj)
      .populate('owner', 'name email username')
      .sort({ createdAt: -1 });
    const result = await paginate(q, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/bookings?start=YYYY-MM-DD&end=YYYY-MM-DD&field=created|checkin
// field=checkin will filter by booking.checkInDate instead of booking.createdAt
exports.getBookingsByDate = async (req, res) => {
  try {
    const { start, end, page = 1, limit = 20, field } = req.query;
    const query = {};

    // determine which date field to filter: createdAt (default) or checkInDate
    const dateField = field === 'checkin' ? 'checkInDate' : 'createdAt';

    // Only apply a date range filter if start or end provided. Parse YYYY-MM-DD safely.
    if (start || end) {
      const sDate = start ? parseDateOnly(start, false) : null;
      const eDate = end ? parseDateOnly(end, true) : null;
      // If parsing failed, return bad request
      if ((start && !sDate) || (end && !eDate)) {
        return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD for start and end.' });
      }
      query[dateField] = {};
      if (sDate) query[dateField].$gte = sDate;
      if (eDate) query[dateField].$lte = eDate;
    }

    const q = Booking.find(query)
      .populate('user','name username')
      .populate('hotel','name location price')
      .populate('cancelledBy', 'name email')
      .populate('refundedBy', 'name email')
      // sort by the chosen date field so results match the filter ordering
      .sort({ [dateField]: -1 });
    const result = await paginate(q, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
