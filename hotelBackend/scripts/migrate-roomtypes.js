// Simple migration script to convert legacy 'NON_AC' room type values
// into the new 'Non-AC' stored format for both Room.type and Booking.roomType.

const mongoose = require('mongoose');
const Room = require('../src/models/Room');
const Booking = require('../src/models/Booking');
const Hotel = require('../src/models/Hotel');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/hotelmanagement';

async function run() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', MONGO);

    const rooms = await Room.updateMany({ type: 'NON_AC' }, { $set: { type: 'Non-AC' } });
    console.log(`Rooms updated: ${rooms.modifiedCount || rooms.nModified || 0}`);

    const bookings = await Booking.updateMany({ roomType: 'NON_AC' }, { $set: { roomType: 'Non-AC' } });
    console.log(`Bookings updated: ${bookings.modifiedCount || bookings.nModified || 0}`);

    // Also handle other legacy representations just in case
    const rooms2 = await Room.updateMany({ type: { $in: ['NON-AC', 'Non_AC', 'Non-AC'] } }, { $set: { type: 'Non-AC' } });
    console.log(`Additional room variants updated: ${rooms2.modifiedCount || rooms2.nModified || 0}`);

    const bookings2 = await Booking.updateMany({ roomType: { $in: ['NON-AC', 'Non_AC', 'Non-AC'] } }, { $set: { roomType: 'Non-AC' } });
    console.log(`Additional booking variants updated: ${bookings2.modifiedCount || bookings2.nModified || 0}`);

    // Fix hotels with missing registrationNo by assigning generated values
    const hotels = await Hotel.find({ $or: [ { registrationNo: null }, { registrationNo: { $exists: false } } ] }).lean();
    let updatedHotels = 0;
    for (const h of hotels) {
      const newReg = `REG-${Date.now().toString(36).toUpperCase().slice(-8)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      const res = await Hotel.updateOne({ _id: h._id }, { $set: { registrationNo: newReg } });
      updatedHotels += (res.modifiedCount || res.nModified || 0);
      // small sleep to vary timestamps
      await new Promise(r => setTimeout(r, 5));
    }
    console.log(`Hotels updated with registrationNo: ${updatedHotels}`);

    await mongoose.disconnect();
    console.log('Migration finished.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
