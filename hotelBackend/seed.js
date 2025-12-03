const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hotel = require('./src/models/Hotel');
const User = require('./src/models/User');
const Room = require('./src/models/Room');

// Sample hotels data
const sampleHotels = [
  {
    name: "Blue Origin Fams",
    location: "Goa, India",
    address: "Baga Beach Road, Goa",
    description: "A beautiful beachfront property with stunning ocean views. Perfect for families and couples looking for a relaxing getaway.",
    priceAc: 55,
    priceNonAc: 45,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-1.png", public_id: null },
    isMostPicked: true,
    isPopular: false,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "50 mbp/s",
      unitsReady: 5,
      refrigerator: 1,
      television: 2
    },
    treasures: [
      {
        title: "Green Lake",
        subtitle: "Nature",
        popular: false,
        image: null
      },
      {
        title: "Dog Clubs",
        subtitle: "Pool",
        popular: false,
        image: null
      },
      {
        title: "Labour and Wait",
        subtitle: "Shopping",
        popular: true,
        image: null
      },
      {
        title: "Snorkeling",
        subtitle: "Beach",
        popular: false,
        image: null
      }
    ],
    status: 'approved'
  },
  {
    name: "Shangri-La Resort",
    location: "Mumbai, India",
    address: "Bandra West, Mumbai",
    description: "Luxury resort in the heart of Colombo with world-class amenities and services.",
    priceAc: 130,
    priceNonAc: 110,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-2.png", public_id: null },
    isMostPicked: true,
    isPopular: true,
    facilities: {
      bedrooms: 3,
      livingrooms: 2,
      bathrooms: 3,
      diningrooms: 1,
      wifi: "100 mbp/s",
      unitsReady: 10,
      refrigerator: 2,
      television: 3
    },
    treasures: [
      {
        title: "City Center Mall",
        subtitle: "Shopping",
        popular: true,
        image: null
      },
      {
        title: "Spa & Wellness",
        subtitle: "Relaxation",
        popular: false,
        image: null
      },
      {
        title: "Rooftop Bar",
        subtitle: "Dining",
        popular: true,
        image: null
      }
    ],
    status: 'approved'
  },
  {
    name: "Green Villa",
    location: "Manali, India",
    address: "Old Manali Road, Manali",
    description: "Peaceful hill country retreat surrounded by lush tea plantations.",
    priceAc: 80,
    priceNonAc: 70,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-3.png", public_id: null },
    isMostPicked: true,
    isPopular: false,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "30 mbp/s",
      unitsReady: 4,
      refrigerator: 1,
      television: 2
    },
    treasures: [
      {
        title: "Tea Plantation Tours",
        subtitle: "Nature",
        popular: true,
        image: null
      },
      {
        title: "Temple of the Tooth",
        subtitle: "Culture",
        popular: true,
        image: null
      },
      {
        title: "Botanical Gardens",
        subtitle: "Nature",
        popular: false,
        image: null
      }
    ],
    status: 'approved'
  },
  {
    name: "Ocean Breeze",
    location: "Varkala, India",
    address: "North Cliff Beach Road, Varkala",
    description: "Cozy beachside accommodation perfect for surfers and beach lovers.",
    priceAc: 50,
    priceNonAc: 40,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-4.png", public_id: null },
    isMostPicked: true,
    isPopular: true,
    facilities: {
      bedrooms: 1,
      livingrooms: 1,
      bathrooms: 1,
      diningrooms: 1,
      wifi: "25 mbp/s",
      unitsReady: 8,
      refrigerator: 1,
      television: 1
    },
    treasures: [
      {
        title: "Surf School",
        subtitle: "Beach",
        popular: true,
        image: null
      },
      {
        title: "Turtle Hatchery",
        subtitle: "Nature",
        popular: true,
        image: null
      },
      {
        title: "Coral Reef Diving",
        subtitle: "Beach",
        popular: false,
        image: null
      }
    ],
    status: 'approved'
  },
  {
    name: "Mountain View Lodge",
    location: "Ooty, India",
    address: "Coonoor Road, Ooty",
    description: "Cool climate mountain lodge with breathtaking views and cozy fireplaces.",
    priceAc: 75,
    priceNonAc: 65,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-5.png", public_id: null },
    isMostPicked: true,
    isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "40 mbp/s",
      unitsReady: 6,
      refrigerator: 1,
      television: 2
    },
    treasures: [
      {
        title: "Horton Plains",
        subtitle: "Nature",
        popular: true,
        image: null
      },
      {
        title: "Gregory Lake",
        subtitle: "Nature",
        popular: false,
        image: null
      },
      {
        title: "Strawberry Farms",
        subtitle: "Experience",
        popular: true,
        image: null
      }
    ],
    status: 'approved'
  },
  {
    name: "Top View",
    location: "Alappuzha, India",
    address: "Punnamada, Alappuzha",
    description: "Beautiful property with panoramic ocean views and modern amenities.",
    priceAc: 65,
    priceNonAc: 55,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Top%20View.png", public_id: null },
  isMostPicked: false,
  isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "50 mbp/s",
      unitsReady: 4,
      refrigerator: 1,
      television: 2
    },
    treasures: [],
    status: 'approved'
  },
  {
    name: "Wodden Pit",
    location: "Munnar, India",
    address: "Tea Estate Road, Munnar",
    description: "Charming wooden cottage with traditional Indian architecture.",
    priceAc: 50,
    priceNonAc: 40,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Wodden%20Pit.png", public_id: null },
    isMostPicked: false,
    isPopular: true,
    facilities: {
      bedrooms: 1,
      livingrooms: 1,
      bathrooms: 1,
      diningrooms: 1,
      wifi: "30 mbp/s",
      unitsReady: 3,
      refrigerator: 1,
      television: 1
    },
    treasures: [],
    status: 'approved'
  },
  {
    name: "Boutiqe",
    location: "Jaipur, India",
    address: "MI Road, Jaipur",
    description: "Boutique hotel in the cultural heart of India.",
    priceAc: 95,
    priceNonAc: 80,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Boutiqe.png", public_id: null },
    isMostPicked: false,
    isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "60 mbp/s",
      unitsReady: 5,
      refrigerator: 1,
      television: 2
    },
    treasures: [],
    status: 'approved'
  },
  {
    name: "Modern",
    location: "Shimla, India",
    address: "Mall Road, Shimla",
    description: "Contemporary design meets mountain tranquility.",
    priceAc: 82,
    priceNonAc: 70,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Modern.png", public_id: null },
    isMostPicked: false,
    isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "70 mbp/s",
      unitsReady: 6,
      refrigerator: 1,
      television: 2
    },
    treasures: [],
    status: 'approved'
  },
  {
    name: "Silver Rain",
    location: "Chennai, India",
    address: "ECR, Chennai",
    description: "Elegant seaside property with modern comforts.",
    priceAc: 72,
    priceNonAc: 60,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Silver%20Rain.png", public_id: null },
    isMostPicked: false,
    isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "45 mbp/s",
      unitsReady: 7,
      refrigerator: 1,
      television: 2
    },
    treasures: [],
    status: 'approved'
  },
  {
    name: "Cashville",
    location: "Udaipur, India",
    address: "Lake Pichola, Udaipur",
    description: "Peaceful lakeside retreat surrounded by nature.",
    priceAc: 60,
    priceNonAc: 50,
  mainImage: { url: "https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Cashville.png", public_id: null },
    isMostPicked: false,
    isPopular: true,
    facilities: {
      bedrooms: 2,
      livingrooms: 1,
      bathrooms: 2,
      diningrooms: 1,
      wifi: "35 mbp/s",
      unitsReady: 4,
      refrigerator: 1,
      television: 1
    },
    treasures: [],
    status: 'approved'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Indiastay';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a default admin user if doesn't exist
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@Indiatstay.com',
        phone: '0912345678',
        countryCode: '+91',
        country: 'India',
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }

    // Create a dummy hotel owner user if doesn't exist
    let hotelOwner = await User.findOne({ username: 'hotelowner' });
    if (!hotelOwner) {
      hotelOwner = await User.create({
        name: 'John Silva',
        email: 'john.silva@hotels.lk',
        phone: '0912345679',
        countryCode: '+91',
        country: 'India',
        username: 'hotelowner',
        password: 'owner123',
        role: 'hotelOwner'
      });
      console.log('Created hotel owner user');
    } else {
      console.log('Hotel owner already exists');
    }

    // Create a regular test user for quick testing
    let testUser = await User.findOne({ username: 'testuser' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '0910000000',
        countryCode: '+91',
        country: 'India',
        username: 'testuser',
        password: 'test123',
        role: 'user'
      });
      console.log('Created test user');
    } else {
      console.log('Test user already exists');
    }

    // Clear existing hotels and rooms if CLEAR_DB env var is set to 'true'
    if ((process.env.CLEAR_DB || '').toLowerCase() === 'true') {
      await Hotel.deleteMany({});
      await Room.deleteMany({});
      console.log('Cleared existing hotels');
    } else {
      console.log('Preserving existing hotels (set CLEAR_DB=true to clear)');
    }

    // Add hotels with the hotel owner as owner
    for (const hotelData of sampleHotels) {
      const existingHotel = await Hotel.findOne({ name: hotelData.name });
      if (!existingHotel) {
        const regNo = `REG-${Date.now().toString(36).toUpperCase().slice(-8)}`;
        const hotel = await Hotel.create({
          ...hotelData,
          owner: hotelOwner._id,
          registrationNo: regNo
        });
        // Seed rooms: default 5 AC + 6 Non-AC
        const baseAc = 5;
        const baseNon = 6;
        const roomDocs = [];
        for (let i = 1; i <= baseAc; i++) roomDocs.push({ hotel: hotel._id, number: `A${i}`, type: 'AC' });
        for (let i = 1; i <= baseNon; i++) roomDocs.push({ hotel: hotel._id, number: `N${i}`, type: 'Non-AC' });
        if (roomDocs.length) {
          await Room.insertMany(roomDocs);
          hotel.dailyCapacity = roomDocs.length; // sync to AC+Non-AC
          await hotel.save();
        }
        console.log(`Added hotel: ${hotelData.name} with ${baseAc} AC and ${baseNon} Non-AC rooms`);
      } else {
        console.log(`Hotel already exists: ${hotelData.name}`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('\n--- Admin User ---');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n--- Hotel Owner ---');
    console.log('Username: hotelowner');
    console.log('Password: owner123');
    console.log('\n⚠️  Please change passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
