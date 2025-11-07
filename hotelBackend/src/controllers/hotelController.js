const Hotel = require('../models/Hotel');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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
  const hotels = await Hotel.find(query).populate('owner', 'name email').lean();

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
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
    const hotel = await Hotel.findById(req.params.id).populate('owner', 'name email phone');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

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

// @desc    Get hotels for current owner
// @route   GET /api/hotels/mine
// @access  Private (Hotel Owner)
exports.getMyHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.id });
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
      price,
      facilities,
      registrationNo,
      ownerNIC
    } = req.body;

  // Handle file uploads (Cloudinary stores full CDN URL in file.path)
  const mainImage = req.files?.images ? req.files.images[0].path : '';
  const documents = req.files?.documents ? req.files.documents.map(file => file.filename) : [];

    // Create hotel
    const hotel = await Hotel.create({
      name,
      location,
      address,
      description,
      price,
      facilities: facilities ? JSON.parse(facilities) : {},
      registrationNo,
      ownerNIC,
      mainImage,
      documents,
      owner: req.user.id,
      status: 'pending'
    });

    // Update user role to hotelOwner
    await User.findByIdAndUpdate(req.user.id, { role: 'hotelOwner' });

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

    hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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

    // Cloudinary returns the public CDN URL in req.file.path
    // We don't remove files from local disk anymore
    hotel.mainImage = req.file.path;
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

  const files = (req.files || []).map(f => f.path);
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

  const { filename } = req.params;
  // filename is expected to be the stored URL or identifier. Remove matching entries.
  hotel.images = (hotel.images || []).filter(img => img !== filename);
  // Also clear mainImage if this file was used as main
  if (hotel.mainImage === filename) hotel.mainImage = '';
  await hotel.save();

  // Note: Cloudinary deletion (remote) can be implemented if you store public_id.
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
  const image = req.file ? req.file.path : undefined;
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
      // Replace image URL with the new Cloudinary URL
      t.image = req.file.path;
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
    // If images are stored in Cloudinary, remove locally stored file logic.
    // Remote deletion requires Cloudinary public_id which isn't tracked here.
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
    return res.status(200).json({ success: true, data: { mainImage: hotel.mainImage, images: hotel.images || [] } });
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
  const filename = req.file ? req.file.path : null;
  if (!filename) return res.status(400).json({ success: false, message: 'Image file is required' });
  hotel.mainImage = filename;
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
  const filenames = files.map(f => f.path);
  hotel.images = [...(hotel.images || []), ...filenames];
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
    hotel.images.splice(idx, 1);
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
