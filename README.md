# Hotel Management System

A full-stack hotel management application with Express.js backend and React frontend.

## Project Structure

```
hotelManagement/
├── hotelBackend/          # Express.js + MongoDB backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & file upload middleware
│   │   └── server.js      # Main server file
│   ├── uploads/           # Uploaded files storage
│   ├── .env              # Environment variables
│   └── package.json
│
└── hotelFrontend/         # React + Vite frontend
    ├── src/
    │   ├── services/      # API service layer
    │   ├── Home/          # Home page components
    │   ├── Login/         # Login component
    │   ├── Register/      # Registration components
    │   ├── HotelDetails/  # Hotel details components
    │   ├── Booking/       # Booking components
    │   └── App.jsx        # Main app component
    ├── .env              # Environment variables
    └── package.json
```

## Features

### Backend
- ✅ User authentication with JWT
- ✅ Hotel CRUD operations
- ✅ Booking system
- ✅ File upload (hotel images & documents)
- ✅ Role-based access control (User, Hotel Owner, Admin)
- ✅ MongoDB integration with Mongoose

### Frontend
- ✅ User registration and login
- ✅ Hotel owner registration
- ✅ Browse hotels (Most Picked & Popular)
- ✅ View hotel details
- ✅ Book hotels with payment simulation
- ✅ Responsive design with Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd hotelBackend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your settings:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (change to a secure random string)
# - PORT (default: 5000)

# Start MongoDB (if running locally)
# mongod

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

#### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd hotelFrontend

# Install dependencies
npm install

# The .env file is already configured to point to localhost:5000
# If your backend runs on a different port, update VITE_API_URL in .env

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user (requires auth)

### Hotels
- `GET /api/hotels` - Get all hotels (optional filters: ?popular=true&mostPicked=true)
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel (requires auth)
- `PUT /api/hotels/:id` - Update hotel (requires auth, owner only)
- `DELETE /api/hotels/:id` - Delete hotel (requires auth, owner only)
- `POST /api/hotels/:id/reviews` - Add review (requires auth)

### Bookings
- `GET /api/bookings` - Get user bookings (requires auth)
- `GET /api/bookings/:id` - Get booking by ID (requires auth)
- `POST /api/bookings` - Create booking (requires auth)
- `PUT /api/bookings/:id` - Update booking (requires auth)
- `DELETE /api/bookings/:id` - Cancel booking (requires auth)

## Usage Flow

### For Regular Users
1. **Register** - Create an account at `/register`
2. **Login** - Sign in at `/login`
3. **Browse Hotels** - View hotels on home page
4. **View Details** - Click on a hotel to see full details
5. **Book** - Select dates and make a booking
6. **Payment** - Complete payment (simulated)

### For Hotel Owners
1. **Register Hotel** - Go to `/registerhotel`
2. Fill in both user details and hotel information
3. Upload hotel images and documents
4. Submit for approval
5. Manage your hotel after approval

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Development Tips

### Adding Sample Hotels
To populate your database with hotels, you can:
1. Use the hotel registration form at `/registerhotel`
2. Or use MongoDB Compass/Shell to insert directly
3. Or create a seed script in the backend

### Testing the API
Use tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

### Common Issues

**CORS Errors**: Make sure the backend's `CLIENT_URL` in `.env` matches your frontend URL

**MongoDB Connection**: Verify your MongoDB is running and the connection string is correct

**File Upload Issues**: Ensure the `uploads` directory exists and has write permissions

**Authentication Issues**: Check that JWT_SECRET is set in backend `.env`

## Next Steps

- [ ] Add admin dashboard
- [ ] Implement payment gateway integration
- [ ] Add email notifications
- [ ] Implement search and filtering
- [ ] Add hotel availability calendar
- [ ] Add user profile management
- [ ] Implement reviews and ratings display
- [ ] Add image optimization
- [ ] Deploy to production (Vercel/Netlify + MongoDB Atlas)

## License

This project is for educational purposes.

## Support

For issues and questions, please create an issue in the repository.
