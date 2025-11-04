const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hotel name'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  address: {
    type: String,
    required: [true, 'Please provide address']
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Please provide price per night']
  },
  images: [{
    type: String
  }],
  mainImage: {
    type: String
  },
  facilities: {
    bedrooms: { type: Number, default: 1 },
    livingrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    diningrooms: { type: Number, default: 1 },
    wifi: { type: String, default: '10 mbp/s' },
    unitsReady: { type: Number, default: 1 },
    refrigerator: { type: Number, default: 1 },
    television: { type: Number, default: 1 }
  },
  registrationNo: {
    type: String,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerNIC: {
    type: String
  },
  documents: [{
    type: String
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  isMostPicked: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  treasures: [{
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    popular: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hotel', hotelSchema);
