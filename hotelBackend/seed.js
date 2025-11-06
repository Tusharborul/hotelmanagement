const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hotel = require('./src/models/Hotel');
const User = require('./src/models/User');

// Sample hotels data
const sampleHotels = [
  {
    name: "Blue Origin Fams",
    location: "Galle, Sri Lanka",
    address: "123 Beach Road, Galle",
    description: "A beautiful beachfront property with stunning ocean views. Perfect for families and couples looking for a relaxing getaway.",
    price: 50,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-1.png",
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
        popular: false
      },
      {
        title: "Dog Clubs",
        subtitle: "Pool",
        popular: false
      },
      {
        title: "Labour and Wait",
        subtitle: "Shopping",
        popular: true
      },
      {
        title: "Snorkeling",
        subtitle: "Beach",
        popular: false
      }
    ],
    status: 'approved'
  },
  {
    name: "Shangri-La Resort",
    location: "Colombo, Sri Lanka",
    address: "456 City Center, Colombo",
    description: "Luxury resort in the heart of Colombo with world-class amenities and services.",
    price: 120,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-2.png",
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
        popular: true
      },
      {
        title: "Spa & Wellness",
        subtitle: "Relaxation",
        popular: false
      },
      {
        title: "Rooftop Bar",
        subtitle: "Dining",
        popular: true
      }
    ],
    status: 'approved'
  },
  {
    name: "Green Villa",
    location: "Kandy, Sri Lanka",
    address: "789 Hill View, Kandy",
    description: "Peaceful hill country retreat surrounded by lush tea plantations.",
    price: 75,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-3.png",
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
        popular: true
      },
      {
        title: "Temple of the Tooth",
        subtitle: "Culture",
        popular: true
      },
      {
        title: "Botanical Gardens",
        subtitle: "Nature",
        popular: false
      }
    ],
    status: 'approved'
  },
  {
    name: "Ocean Breeze",
    location: "Hikkaduwa, Sri Lanka",
    address: "321 Beach Front, Hikkaduwa",
    description: "Cozy beachside accommodation perfect for surfers and beach lovers.",
    price: 45,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-4.png",
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
        popular: true
      },
      {
        title: "Turtle Hatchery",
        subtitle: "Nature",
        popular: true
      },
      {
        title: "Coral Reef Diving",
        subtitle: "Beach",
        popular: false
      }
    ],
    status: 'approved'
  },
  {
    name: "Mountain View Lodge",
    location: "Nuwara Eliya, Sri Lanka",
    address: "555 Mountain Road, Nuwara Eliya",
    description: "Cool climate mountain lodge with breathtaking views and cozy fireplaces.",
    price: 65,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/pic-5.png",
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
        popular: true
      },
      {
        title: "Gregory Lake",
        subtitle: "Nature",
        popular: false
      },
      {
        title: "Strawberry Farms",
        subtitle: "Experience",
        popular: true
      }
    ],
    status: 'approved'
  },
  {
    name: "Top View",
    location: "Hikkaduwe, Sri Lanka",
    address: "789 Beach Road, Hikkaduwe",
    description: "Beautiful property with panoramic ocean views and modern amenities.",
    price: 55,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Top%20View.png",
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
    location: "Ambalangode, Sri Lanka",
    address: "234 Coastal Road, Ambalangode",
    description: "Charming wooden cottage with traditional Sri Lankan architecture.",
    price: 40,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Wodden%20Pit.png",
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
    location: "Kandy, Sri Lanka",
    address: "567 Temple Street, Kandy",
    description: "Boutique hotel in the cultural heart of Sri Lanka.",
    price: 80,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Boutiqe.png",
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
    location: "Nuwereilya, Sri Lanka",
    address: "890 Hill Station Road, Nuwara Eliya",
    description: "Contemporary design meets mountain tranquility.",
    price: 70,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Modern.png",
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
    location: "Dehiwala, Sri Lanka",
    address: "345 Marine Drive, Dehiwala",
    description: "Elegant seaside property with modern comforts.",
    price: 60,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Silver%20Rain.png",
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
    location: "Ampara, Sri Lanka",
    address: "678 Lake View, Ampara",
    description: "Peaceful lakeside retreat surrounded by nature.",
    price: 50,
    mainImage:"https://raw.githubusercontent.com/Tusharborul/hotelmanagement/main/Assets/location/Cashville.png",
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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lankastay';
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
        email: 'admin@lankatstay.com',
        phone: '0771234567',
        countryCode: '+94',
        country: 'Sri Lanka',
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
        phone: '0771234568',
        countryCode: '+94',
        country: 'Sri Lanka',
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
        phone: '0770000000',
        countryCode: '+94',
        country: 'Sri Lanka',
        username: 'testuser',
        password: 'test123',
        role: 'user'
      });
      console.log('Created test user');
    } else {
      console.log('Test user already exists');
    }

    // Clear existing hotels if CLEAR_DB env var is set to 'true'
    if ((process.env.CLEAR_DB || '').toLowerCase() === 'true') {
      await Hotel.deleteMany({});
      console.log('Cleared existing hotels');
    } else {
      console.log('Preserving existing hotels (set CLEAR_DB=true to clear)');
    }

    // Add hotels with the hotel owner as owner
    for (const hotelData of sampleHotels) {
      const existingHotel = await Hotel.findOne({ name: hotelData.name });
      if (!existingHotel) {
        const regNo = `REG-${Date.now().toString(36).toUpperCase().slice(-8)}`;
        await Hotel.create({
          ...hotelData,
          owner: hotelOwner._id,
          registrationNo: regNo
        });
        console.log(`Added hotel: ${hotelData.name}`);
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
