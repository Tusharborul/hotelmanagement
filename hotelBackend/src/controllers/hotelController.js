const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// Normalize room type inputs/values to either 'AC' or 'Non-AC'
const normalizeRoomType = (t) => {
  if (!t && t !== 0) return '';
  const s = String(t || '').trim();
  if (/^ac$/i.test(s)) return 'AC';
  if (/^non[_\-\s]?ac$/i.test(s) || /^nonac$/i.test(s)) return 'Non-AC';
  return s;
};

// Generate a reasonably unique registration number
const genRegistrationNo = () => {
  return `REG-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
};

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res) => {
  try {
    const { popular, mostPicked, location } = req.query;
    
    let query = { status: 'approved' };
    
    if (popular === 'true') {
      query.isPopular = true;
    }
    
    if (mostPicked === 'true') {
      query.isMostPicked = true;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

  // use .lean() to return plain objects (safer for serialization) and reduce memory
  let hotels = await Hotel.find(query).populate('owner', 'name email').lean();

    // Normalize images/mainImage to URL strings for frontend compatibility
    hotels = hotels.map(h => {
      const copy = { ...h };
      if (copy.mainImage && typeof copy.mainImage === 'object') copy.mainImage = copy.mainImage.url || '';
      if (Array.isArray(copy.images)) copy.images = copy.images.map(img => (typeof img === 'object' ? img.url || '' : img));
      return copy;
    });

    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    // Log full error for debugging in server logs
    console.error('Error in getHotels:', error);
    // Return 400 for validation errors to make client handling clearer
    const statusCode = (error && error.name === 'ValidationError') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
  try {
  const hotelDoc = await Hotel.findById(req.params.id).populate('owner', 'name email phone');
  const hotel = hotelDoc ? hotelDoc.toObject() : null;

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    if (hotel) {
      if (hotel.mainImage && typeof hotel.mainImage === 'object') hotel.mainImage = hotel.mainImage.url || '';
      if (Array.isArray(hotel.images)) hotel.images = hotel.images.map(img => (typeof img === 'object' ? img.url || '' : img));
    }
    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check hotel availability for a given check-in and length
// @route   GET /api/hotels/:id/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const { checkInDate, days, roomType } = req.query;
    if (!checkInDate || !days) return res.status(400).json({ success: false, message: 'checkInDate and days are required' });

    const start = new Date(checkInDate);
    start.setHours(10,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(days));
    end.setHours(10,0,0,0);

    // Determine if hotel uses room-based capacity
    const rooms = await Room.find({ hotel: hotel._id, active: true }).lean();
    const hasRooms = rooms && rooms.length > 0;

    if (hasRooms) {
      // Compute availability by type (normalized)
      const totalAc = rooms.filter(r => normalizeRoomType(r.type) === 'AC').length;
      const totalNonAc = rooms.filter(r => normalizeRoomType(r.type) === 'Non-AC').length;

      let minRemainingAc = totalAc;
      let minRemainingNonAc = totalNonAc;
      let fullyBookedDate = null;
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const day = new Date(d);
        day.setHours(10,0,0,0);

        // Count distinct rooms booked by type for that day
        const acBookedRooms = await Booking.distinct('room', {
          hotel: hotel._id,
          status: 'confirmed',
          roomType: 'AC',
          checkInDate: { $lte: day },
          checkOutDate: { $gt: day }
        });
        const nonAcBookedRooms = await Booking.distinct('room', {
          hotel: hotel._id,
          status: 'confirmed',
          roomType: 'Non-AC',
          checkInDate: { $lte: day },
          checkOutDate: { $gt: day }
        });

        const remainingAc = Math.max(0, totalAc - (acBookedRooms?.length || 0));
        const remainingNonAc = Math.max(0, totalNonAc - (nonAcBookedRooms?.length || 0));
        if (!fullyBookedDate && remainingAc + remainingNonAc <= 0) {
          fullyBookedDate = day.toISOString().split('T')[0];
        }
        if (remainingAc < minRemainingAc) minRemainingAc = remainingAc;
        if (remainingNonAc < minRemainingNonAc) minRemainingNonAc = remainingNonAc;
      }

      const remainingTotal = (minRemainingAc || 0) + (minRemainingNonAc || 0);
      const overallCap = totalAc + totalNonAc;
      const response = {
        available: remainingTotal > 0,
        dailyCapacity: overallCap,
        remaining: remainingTotal,
        remainingAc: minRemainingAc,
        remainingNonAc: minRemainingNonAc
      };
      if (fullyBookedDate) response.date = fullyBookedDate;
      const reqType = normalizeRoomType(roomType);
      if (reqType === 'AC') {
        response.available = minRemainingAc > 0;
        response.remaining = minRemainingAc;
      } else if (reqType === 'Non-AC') {
        response.available = minRemainingNonAc > 0;
        response.remaining = minRemainingNonAc;
      }
      return res.status(200).json({ success: true, data: response });
    }

    // Legacy capacity: If no rooms set, use hotel.dailyCapacity strictly (0 means no availability)
    if (hotel.dailyCapacity <= 0) {
      return res.status(200).json({ success: true, data: { available: false, dailyCapacity: 0, bookedCount: 0, remaining: 0 } });
    }

    let minRemaining = Number.POSITIVE_INFINITY;
    let maxBooked = 0;
    let fullyBookedDate = null;

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(10,0,0,0);
      const existingCount = await Booking.countDocuments({
        hotel: hotel._id,
        status: 'confirmed',
        checkInDate: { $lte: day },
        checkOutDate: { $gt: day }
      });

      const remainingForDay = hotel.dailyCapacity - existingCount;
      if (remainingForDay <= 0 && !fullyBookedDate) {
        fullyBookedDate = day.toISOString().split('T')[0];
      }

      if (remainingForDay < minRemaining) minRemaining = remainingForDay;
      if (existingCount > maxBooked) maxBooked = existingCount;
    }

    if (fullyBookedDate) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          date: fullyBookedDate,
          dailyCapacity: hotel.dailyCapacity,
          bookedCount: maxBooked,
          remaining: Math.max(0, minRemaining)
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        available: true,
        dailyCapacity: hotel.dailyCapacity,
        bookedCount: maxBooked,
        remaining: Math.max(0, minRemaining)
      }
    });
  } catch (err) {
    console.error('Error in checkAvailability:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get hotels for current owner
// @route   GET /api/hotels/mine
// @access  Private (Hotel Owner)
exports.getMyHotels = async (req, res) => {
  try {
    let hotels = await Hotel.find({ owner: req.user.id }).lean();
    hotels = hotels.map(h => {
      const copy = { ...h };
      if (copy.mainImage && typeof copy.mainImage === 'object') copy.mainImage = copy.mainImage.url || '';
      if (Array.isArray(copy.images)) copy.images = copy.images.map(img => (typeof img === 'object' ? img.url || '' : img));
      return copy;
    });
    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private (Hotel Owner)
exports.createHotel = async (req, res) => {
  try {
    const {
      name,
      location,
      address,
      description,
      priceAc,
      priceNonAc,
      dailyCapacity,
      acCount,
      nonAcCount,
      rooms: roomsRaw,
      facilities,
      registrationNo,
      ownerNIC
    } = req.body;

  // Handle file uploads (Cloudinary stores full CDN URL in file.path and public_id in file.filename)
  const mainImage = req.files?.images ? { url: req.files.images[0].path, public_id: req.files.images[0].filename } : null;
  const documents = req.files?.documents ? req.files.documents.map(file => file.filename) : [];

    // Create hotel
    // Derive required room-type prices; enforce AC > Non-AC if both provided
    const parsedPriceAc = Number(priceAc);
    const parsedPriceNonAc = Number(priceNonAc);
    if (!Number.isFinite(parsedPriceAc) || parsedPriceAc <= 0) {
      return res.status(400).json({ success:false, message:'AC room price (priceAc) is required and must be > 0' });
    }
    if (!Number.isFinite(parsedPriceNonAc) || parsedPriceNonAc <= 0) {
      return res.status(400).json({ success:false, message:'Non-AC room price (priceNonAc) is required and must be > 0' });
    }
    if (parsedPriceAc <= parsedPriceNonAc) {
      return res.status(400).json({ success:false, message:'AC price must be greater than Non-AC price' });
    }

    // Ensure we always have a unique registration number (avoid duplicate nulls)
    const finalRegistrationNo = registrationNo && String(registrationNo).trim() ? String(registrationNo).trim() : genRegistrationNo();

    const hotel = await Hotel.create({
      name,
      location,
      address,
      description,
      priceAc: parsedPriceAc,
      priceNonAc: parsedPriceNonAc,
      dailyCapacity: Number(dailyCapacity) || 0,
      facilities: facilities ? JSON.parse(facilities) : {},
      registrationNo: finalRegistrationNo,
      ownerNIC,
      mainImage,
      documents,
      owner: req.user.id,
      status: 'pending'
    });

    // Update user role to hotelOwner
    await User.findByIdAndUpdate(req.user.id, { role: 'hotelOwner' });

    // If owner provided counts or explicit rooms, create Room records
    try {
      const toCreate = [];
      // explicit rooms as JSON or array
      let roomsPayload = roomsRaw;
      if (typeof roomsPayload === 'string') {
        try { roomsPayload = JSON.parse(roomsPayload); } catch (_) { roomsPayload = null; }
      }
      if (Array.isArray(roomsPayload)) {
        roomsPayload.forEach(r => {
          if (!r) return;
          const number = String(r.number || r.no || '').trim();
          const typeRaw = normalizeRoomType(r.type || r.roomType || '');
          if (number && (typeRaw === 'AC' || typeRaw === 'Non-AC')) {
            toCreate.push({ hotel: hotel._id, number, type: typeRaw });
          }
        });
      } else {
        const acN = Number(acCount) || 0;
        const nonN = Number(nonAcCount) || 0;
        for (let i = 1; i <= acN; i++) {
          toCreate.push({ hotel: hotel._id, number: `A${i}`, type: 'AC' });
        }
        for (let i = 1; i <= nonN; i++) {
          toCreate.push({ hotel: hotel._id, number: `N${i}`, type: 'Non-AC' });
        }
      }
      if (toCreate.length) {
        await Room.insertMany(toCreate);
        // Always sync dailyCapacity to reflect total rooms
        const total = await Room.countDocuments({ hotel: hotel._id, active: true });
        hotel.dailyCapacity = total;
        await hotel.save();
      }
    } catch (roomErr) {
      console.error('createHotel/rooms error', roomErr);
    }

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add rooms (bulk) for a hotel
// @route   POST /api/hotels/:id/rooms
// @access  Private (Hotel Owner/Admin)
exports.addRooms = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { rooms: roomsRaw, acCount, nonAcCount } = req.body;
    const toCreate = [];
    let roomsPayload = roomsRaw;
    if (typeof roomsPayload === 'string') {
      try { roomsPayload = JSON.parse(roomsPayload); } catch (_) { roomsPayload = null; }
    }
    if (Array.isArray(roomsPayload)) {
      roomsPayload.forEach(r => {
        if (!r) return;
        const number = String(r.number || r.no || '').trim();
        const typeRaw = normalizeRoomType(r.type || r.roomType || '');
        if (number && (typeRaw === 'AC' || typeRaw === 'Non-AC')) {
          toCreate.push({ hotel: hotel._id, number, type: typeRaw });
        }
      });
    } else {
      const acN = Number(acCount) || 0;
      const nonN = Number(nonAcCount) || 0;
        const existing = await Room.find({ hotel: hotel._id }).lean();
      const usedNumbers = new Set((existing || []).map(r => r.number));
      let ai = 1; let ni = 1;
      for (let i = 0; i < acN; i++) {
        while (usedNumbers.has(`A${ai}`)) ai++;
        toCreate.push({ hotel: hotel._id, number: `A${ai}`, type: 'AC' }); ai++;
      }
      for (let i = 0; i < nonN; i++) {
        while (usedNumbers.has(`N${ni}`)) ni++;
        toCreate.push({ hotel: hotel._id, number: `N${ni}`, type: 'Non-AC' }); ni++;
      }
    }
    if (!toCreate.length) return res.status(400).json({ success: false, message: 'No rooms to add' });
    const created = await Room.insertMany(toCreate, { ordered: false });
    // sync dailyCapacity to total active rooms
    const total = await Room.countDocuments({ hotel: hotel._id, active: true });
    hotel.dailyCapacity = total;
    await hotel.save();
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('addRooms error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    List rooms for a hotel
// @route   GET /api/hotels/:id/rooms
// @access  Private (Hotel Owner/Admin)
exports.listRooms = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const rooms = await Room.find({ hotel: hotel._id }).sort({ type: 1, number: 1 });
    return res.status(200).json({ success: true, data: rooms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Deactivate (remove) a room if no overlapping future bookings
// @route   DELETE /api/hotels/:id/rooms/:roomId
// @access  Private (Hotel Owner/Admin)
exports.deleteRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const room = await Room.findOne({ _id: req.params.roomId, hotel: hotel._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // If room has never been booked (no booking records), hard delete; otherwise deactivate only
    const anyBooking = await Booking.findOne({ hotel: hotel._id, room: room._id }).select('_id');
    let action = 'deactivated';
    if (!anyBooking) {
      await room.deleteOne();
      action = 'deleted';
    } else {
      room.active = false;
      await room.save();
    }
    const total = await Room.countDocuments({ hotel: hotel._id, active: true });
    hotel.dailyCapacity = total;
    await hotel.save();
    return res.status(200).json({ success: true, data: room, action });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update room fields (currently supports toggling active)
// @route   PUT /api/hotels/:id/rooms/:roomId
// @access  Private (Hotel Owner/Admin)
exports.updateRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const room = await Room.findOne({ _id: req.params.roomId, hotel: hotel._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Toggle active status
    if (typeof req.body.active !== 'undefined') {
      const nextActive = Boolean(req.body.active);
      room.active = nextActive;
    }

    // Edit room number (ensure uniqueness within hotel)
    if (typeof req.body.number !== 'undefined') {
      const nextNumber = String(req.body.number || '').trim();
      if (!nextNumber) {
        return res.status(400).json({ success: false, message: 'Room number cannot be empty' });
      }
      // If unchanged, skip
      if (nextNumber !== room.number) {
        const exists = await Room.findOne({ hotel: hotel._id, number: nextNumber }).select('_id');
        if (exists) {
          return res.status(409).json({ success: false, message: 'A room with this number already exists' });
        }
        room.number = nextNumber;
      }
    }

    await room.save();
    // Sync hotel's dailyCapacity to active rooms count
    const total = await Room.countDocuments({ hotel: hotel._id, active: true });
    hotel.dailyCapacity = total;
    await hotel.save();

    return res.status(200).json({ success: true, data: room });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Calendar availability (per-day counts, by type)
// @route   GET /api/hotels/:id/calendar-availability?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Public
exports.calendarAvailability = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    const { start: startStr, end: endStr } = req.query;
    if (!startStr || !endStr) return res.status(400).json({ success: false, message: 'start and end are required (YYYY-MM-DD)' });
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(10,0,0,0); end.setHours(10,0,0,0);

    const rooms = await Room.find({ hotel: hotel._id, active: true }).lean();
    const totalAc = rooms.filter(r => normalizeRoomType(r.type) === 'AC').length;
    const totalNonAc = rooms.filter(r => normalizeRoomType(r.type) === 'Non-AC').length;

    const days = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(10,0,0,0);
      const acBookedRooms = await Booking.distinct('room', {
        hotel: hotel._id,
        status: 'confirmed',
        roomType: 'AC',
        checkInDate: { $lte: day },
        checkOutDate: { $gt: day }
      });
      const nonAcBookedRooms = await Booking.distinct('room', {
        hotel: hotel._id,
        status: 'confirmed',
        roomType: 'Non-AC',
        checkInDate: { $lte: day },
        checkOutDate: { $gt: day }
      });
      const remainingAc = Math.max(0, totalAc - (acBookedRooms?.length || 0));
      const remainingNonAc = Math.max(0, totalNonAc - (nonAcBookedRooms?.length || 0));
      days.push({
        date: day.toISOString().split('T')[0],
        availableAc: remainingAc,
        availableNonAc: remainingNonAc,
        availableTotal: remainingAc + remainingNonAc
      });
    }
    return res.status(200).json({ success: true, data: { days, totals: { ac: totalAc, nonAc: totalNonAc } } });
  } catch (err) {
    console.error('calendarAvailability error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private (Hotel Owner)
exports.updateHotel = async (req, res) => {
  try {
    let hotel = await Hotel.findById(req.params.id);

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
        message: 'Not authorized to update this hotel'
      });
    }

    const updatePayload = { ...req.body };
    if (typeof updatePayload.priceAc !== 'undefined' || typeof updatePayload.priceNonAc !== 'undefined') {
      const pA = Number(updatePayload.priceAc ?? hotel.priceAc);
      const pN = Number(updatePayload.priceNonAc ?? hotel.priceNonAc);
      if (!Number.isFinite(pA) || pA <= 0) return res.status(400).json({ success:false, message:'AC room price must be > 0' });
      if (!Number.isFinite(pN) || pN <= 0) return res.status(400).json({ success:false, message:'Non-AC room price must be > 0' });
      if (pA <= pN) return res.status(400).json({ success:false, message:'AC price must be greater than Non-AC price' });
    }
    hotel = await Hotel.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private (Hotel Owner)
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

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
        message: 'Not authorized to delete this hotel'
      });
    }

    // Before deleting the hotel, cancel and refund any active bookings for this hotel.
    try {
      const Booking = require('../models/Booking');
      const bookings = await Booking.find({ hotel: hotel._id, status: { $in: ['pending','confirmed'] } });
      for (const b of bookings) {
        b.status = 'cancelled';
        b.cancelledAt = new Date();
        b.cancelledBy = req.user.id; // owner or admin who triggered deletion
  b.cancellationReason = 'hotel';
        // Refund full initial payment if present
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
        console.log(`[auto-refund][hotel-delete] booking=${b._id} refund=${b.refundAmount}`);
      }
    } catch (err) {
      console.error('Error auto-refunding bookings during hotel delete:', err);
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ========== Owner Media Management ==========
// @desc    Set/replace main image for a hotel
// @route   PUT /api/hotels/:id/main-image
// @access  Private (Hotel Owner|Admin)
exports.setMainImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' });

      // Cloudinary returns the public CDN URL in req.file.path and public_id in req.file.filename
      // Save both so we can remove remote images later
      // Remove old mainImage from Cloudinary if present
      try {
        if (hotel.mainImage && hotel.mainImage.public_id) {
          await cloudinary.uploader.destroy(hotel.mainImage.public_id);
        }
      } catch (err) {
        console.error('Error destroying previous main image:', err);
      }
      hotel.mainImage = { url: req.file.path, public_id: req.file.filename };
    await hotel.save();
    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add gallery images to a hotel
// @route   POST /api/hotels/:id/images
// @access  Private (Hotel Owner|Admin)
exports.addImages = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

  const files = (req.files || []).map(f => ({ url: f.path, public_id: f.filename }));
  if (!files.length) return res.status(400).json({ success: false, message: 'No images uploaded' });

  hotel.images = [...(hotel.images || []), ...files];
    await hotel.save();
    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a gallery image from a hotel
// @route   DELETE /api/hotels/:id/images/:filename
// @access  Private (Hotel Owner|Admin)
exports.deleteImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

  const { filename } = req.params; // could be index, url, or public_id

  const tryDestroy = async (public_id) => {
    try {
      if (public_id) await cloudinary.uploader.destroy(public_id);
    } catch (err) {
      console.error('Cloudinary destroy error:', err);
    }
  };

  // If filename looks like an integer index, remove by index
  const idx = parseInt(filename, 10);
  if (!Number.isNaN(idx)) {
    if (idx >= 0 && idx < (hotel.images || []).length) {
      const removed = hotel.images.splice(idx, 1)[0];
      if (removed && removed.public_id) await tryDestroy(removed.public_id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }
  } else {
    // Otherwise try to match by url or public_id
    const images = hotel.images || [];
    const matchIndex = images.findIndex(img => img.url === filename || img.public_id === filename);
    if (matchIndex !== -1) {
      const removed = images.splice(matchIndex, 1)[0];
      if (removed && removed.public_id) await tryDestroy(removed.public_id);
      hotel.images = images;
    } else {
      // No match, just filter out any strings equal to filename (backwards compatibility)
      hotel.images = images.filter(img => img.url !== filename && img.public_id !== filename && img !== filename);
    }
  }

  // Also clear mainImage if this file was used as main (match by url or public_id)
  if (hotel.mainImage && (hotel.mainImage.url === filename || hotel.mainImage.public_id === filename || hotel.mainImage === filename)) {
    if (hotel.mainImage.public_id) await tryDestroy(hotel.mainImage.public_id);
    hotel.mainImage = { url: '', public_id: '' };
  }

  await hotel.save();
  return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ========== Owner Treasures Management ==========
// @desc    Add a treasure item to a hotel
// @route   POST /api/hotels/:id/treasures
// @access  Private (Hotel Owner|Admin)
exports.addTreasure = async (req, res) => {
  try {
    console.log('Add treasure request:', { hotelId: req.params.id, userId: req.user.id, body: req.body });
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      console.log('Hotel not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    console.log('Found hotel:', { id: hotel._id, owner: hotel.owner, treasuresCount: hotel.treasures.length });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { title, subtitle, popular } = req.body;
    if (!title || !subtitle) return res.status(400).json({ success: false, message: 'title and subtitle required' });
  const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;
    const treasure = { title, subtitle, popular: popular === 'true' || popular === true, image };
    hotel.treasures.push(treasure);
    await hotel.save();
    return res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a treasure item
// @route   PUT /api/hotels/:id/treasures/:treasureId
// @access  Private (Hotel Owner|Admin)
exports.updateTreasure = async (req, res) => {
  try {
    console.log('Update treasure request:', { hotelId: req.params.id, treasureId: req.params.treasureId, body: req.body });
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      console.log('Hotel not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const t = hotel.treasures.id(req.params.treasureId);
    if (!t) {
      console.log('Treasure not found with ID:', req.params.treasureId, 'Available treasures:', hotel.treasures.map(t => t._id.toString()));
      return res.status(404).json({ success: false, message: 'Treasure not found' });
    }

    const { title, subtitle, popular } = req.body;
    if (title !== undefined) t.title = title;
    if (subtitle !== undefined) t.subtitle = subtitle;
    if (popular !== undefined) t.popular = (popular === 'true' || popular === true);
    if (req.file) {
      // Replace image with new Cloudinary object; if previous image had public_id, remove it
      try {
        if (t.image && t.image.public_id) {
          await cloudinary.uploader.destroy(t.image.public_id);
        }
      } catch (err) {
        console.error('Error removing old treasure image from Cloudinary', err);
      }
      t.image = { url: req.file.path, public_id: req.file.filename };
    }

    await hotel.save();
    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a treasure item
// @route   DELETE /api/hotels/:id/treasures/:treasureId
// @access  Private (Hotel Owner|Admin)
exports.deleteTreasure = async (req, res) => {
  try {
    console.log('=== DELETE TREASURE REQUEST ===');
    console.log('Hotel ID:', req.params.id);
    console.log('Treasure ID to delete:', req.params.treasureId);
    console.log('User ID:', req.user.id);
    
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      console.log('ERROR: Hotel not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    console.log('Hotel found! Owner:', hotel.owner.toString());
    console.log('Hotel treasures count:', hotel.treasures.length);
    console.log('All treasure IDs in hotel:', hotel.treasures.map(t => ({ id: t._id.toString(), title: t.title })));
    
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('ERROR: Not authorized');
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const t = hotel.treasures.id(req.params.treasureId);
    if (!t) {
      console.log('ERROR: Treasure not found with ID:', req.params.treasureId);
      console.log('Available treasure IDs:', hotel.treasures.map(t => t._id.toString()));
      return res.status(404).json({ success: false, message: 'Treasure not found' });
    }
    
    console.log('Treasure found! Title:', t.title);
    // If images are stored in Cloudinary, remove remote resource if we have public_id
    try {
      if (t.image && t.image.public_id) {
        await cloudinary.uploader.destroy(t.image.public_id);
      }
    } catch (err) {
      console.error('Error deleting treasure image from Cloudinary', err);
    }
    t.deleteOne();
    await hotel.save();
    console.log('Treasure deleted successfully');
    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    console.log('ERROR in deleteTreasure:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====== Photos Management (Owner/Admin) ======
// @desc    Get hotel photos (main + gallery)
// @route   GET /api/hotels/:id/photos
// @access  Private (Hotel Owner/Admin)
exports.getHotelPhotos = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  // Normalize to URL strings for compatibility
  const mainImage = hotel.mainImage && typeof hotel.mainImage === 'object' ? hotel.mainImage.url || '' : (hotel.mainImage || '');
  const images = (hotel.images || []).map(img => (typeof img === 'object' ? img.url || '' : img));
  return res.status(200).json({ success: true, data: { mainImage, images } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update main image
// @route   PUT /api/hotels/:id/main-image
// @access  Private (Hotel Owner/Admin)
exports.updateMainImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  const uploaded = req.file ? { url: req.file.path, public_id: req.file.filename } : null;
  if (!uploaded) return res.status(400).json({ success: false, message: 'Image file is required' });
  // remove previous main image from Cloudinary if present
  try {
    if (hotel.mainImage && hotel.mainImage.public_id) {
      await cloudinary.uploader.destroy(hotel.mainImage.public_id);
    }
  } catch (err) {
    console.error('Error destroying previous main image in updateMainImage:', err);
  }
  hotel.mainImage = uploaded;
    await hotel.save();
    return res.status(200).json({ success: true, data: { mainImage: hotel.mainImage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add gallery images
// @route   POST /api/hotels/:id/images
// @access  Private (Hotel Owner/Admin)
exports.addHotelImages = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  const files = req.files || [];
  const fileObjs = files.map(f => ({ url: f.path, public_id: f.filename }));
  if (!fileObjs.length) return res.status(400).json({ success: false, message: 'No images uploaded' });
  hotel.images = [...(hotel.images || []), ...fileObjs];
    await hotel.save();
    return res.status(201).json({ success: true, data: hotel.images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete gallery image by index
// @route   DELETE /api/hotels/:id/images/:imgIndex
// @access  Private (Hotel Owner/Admin)
exports.deleteHotelImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const idx = parseInt(req.params.imgIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= (hotel.images || []).length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }
    const removed = hotel.images.splice(idx, 1)[0];
    try {
      if (removed && removed.public_id) await cloudinary.uploader.destroy(removed.public_id);
    } catch (err) {
      console.error('Error destroying cloudinary image on deleteHotelImage:', err);
    }
    await hotel.save();
    return res.status(200).json({ success: true, data: hotel.images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====== Treasures CRUD (Owner/Admin) ======
// @desc    Get treasures for a hotel
// @route   GET /api/hotels/:id/treasures
// @access  Private (Hotel Owner/Admin)
exports.getTreasures = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    return res.status(200).json({ success: true, data: hotel.treasures || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add hotel review
// @route   POST /api/hotels/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = hotel.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Hotel already reviewed'
      });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    hotel.reviews.push(review);

    // Update average rating
    hotel.rating = hotel.reviews.reduce((acc, item) => item.rating + acc, 0) / hotel.reviews.length;

    await hotel.save();

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
