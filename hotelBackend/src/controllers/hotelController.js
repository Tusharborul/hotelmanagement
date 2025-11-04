const Hotel = require('../models/Hotel');
const User = require('../models/User');

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

    const hotels = await Hotel.find(query).populate('owner', 'name email');

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    res.status(500).json({
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

    // Handle file uploads
    const images = req.files?.images ? req.files.images.map(file => file.filename) : [];
    const documents = req.files?.documents ? req.files.documents.map(file => file.filename) : [];
    const mainImage = images[0] || '';

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
      images,
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
