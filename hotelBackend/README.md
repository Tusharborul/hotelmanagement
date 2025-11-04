# Hotel Management Backend API

Backend API for Hotel Management System built with Express and MongoDB.

## Features

- User authentication with JWT
- Hotel management (CRUD operations)
- Booking system
- File upload for hotel images and documents
- Role-based access control (User, Hotel Owner, Admin)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotelManagement
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user (Protected)
- `PUT /api/users/me` - Update user details (Protected)

### Hotels
- `GET /api/hotels` - Get all hotels (with optional filters: ?popular=true&mostPicked=true)
- `GET /api/hotels/:id` - Get single hotel
- `POST /api/hotels` - Create new hotel (Protected, requires authentication)
- `PUT /api/hotels/:id` - Update hotel (Protected, owner only)
- `DELETE /api/hotels/:id` - Delete hotel (Protected, owner only)
- `POST /api/hotels/:id/reviews` - Add review to hotel (Protected)

### Bookings
- `GET /api/bookings` - Get all user bookings (Protected)
- `GET /api/bookings/:id` - Get single booking (Protected)
- `POST /api/bookings` - Create new booking (Protected)
- `PUT /api/bookings/:id` - Update booking (Protected, owner only)
- `DELETE /api/bookings/:id` - Cancel booking (Protected, owner only)
- `GET /api/bookings/hotel/:hotelId` - Get hotel bookings (Protected, hotel owner only)

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- CORS for cross-origin requests
