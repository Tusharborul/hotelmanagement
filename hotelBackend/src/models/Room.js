const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  number: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['AC', 'NON_AC'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.index({ hotel: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
