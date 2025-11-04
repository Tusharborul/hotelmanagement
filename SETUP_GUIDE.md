# Hotel Management System - Complete Setup Guide

## ✅ What Has Been Created

### Backend (hotelBackend/)
1. **Express.js Server** with MongoDB integration
2. **Three Main Models**:
   - User (authentication, roles)
   - Hotel (properties, facilities, images)
   - Booking (reservations, payments)

3. **API Endpoints**:
   - User authentication (register, login)
   - Hotel management (CRUD operations)
   - Booking system (create, read, update, cancel)

4. **Features**:
   - JWT authentication
   - Password hashing with bcrypt
   - File upload handling (Multer)
   - Role-based access control
   - CORS enabled

### Frontend (hotelFrontend/)
1. **React Application** with Vite
2. **Integrated Components**:
   - Login (with API integration)
   - Register (with API integration)
   - RegisterHotel (with file upload)
   - HomePage (fetches hotels from API)
   - HotelDetails (dynamic data from API)
   - Booking (API integrated)
   - Payment (creates bookings via API)

3. **Service Layer**:
   - API client with Axios
   - Auth service (login, register, token management)
   - Hotel service (CRUD operations)
   - Booking service (reservation management)

## 🚀 How to Start

### Step 1: Install MongoDB
Make sure MongoDB is installed and running on your system.

### Step 2: Install Dependencies

```bash
# Backend
cd hotelBackend
npm install

# Frontend (in new terminal)
cd hotelFrontend
npm install
```

### Step 3: Seed the Database (Optional but Recommended)

```bash
cd hotelBackend
npm run seed
```

This will create:
- Admin user (username: admin, password: admin123)
- 5 sample hotels with realistic data

### Step 4: Start the Servers

**Option A - Use the batch file (Windows):**
```bash
# From hotelManagement directory
start-all.bat
```

**Option B - Manual start (3 terminals):**

Terminal 1 - MongoDB:
```bash
mongod
```

Terminal 2 - Backend:
```bash
cd hotelBackend
npm run dev
```

Terminal 3 - Frontend:
```bash
cd hotelFrontend
npm run dev
```

### Step 5: Access the Application

Open your browser and go to: **http://localhost:5173**

## 🔑 Test the Application

### 1. Test as Regular User
1. Click "Create Account" or go to `/register`
2. Fill in the registration form
3. After registration, you'll be logged in automatically
4. Browse hotels on the home page
5. Click on a hotel to view details
6. Book a hotel by clicking "Book Now"
7. Complete the payment process

### 2. Test as Hotel Owner
1. Go to `/registerhotel`
2. Fill in both user details AND hotel information
3. Upload images and documents (any image/PDF file)
4. After submission, you'll be registered as a hotel owner
5. Your hotel will appear in the listings

### 3. Test with Seed Data
1. Login with admin credentials:
   - Username: `admin`
   - Password: `admin123`
2. Browse the pre-populated hotels
3. Make test bookings

## 📁 Project Structure

```
hotelManagement/
├── hotelBackend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── models/           # Database schemas
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth & upload
│   │   └── server.js         # Entry point
│   ├── uploads/              # File storage
│   ├── .env                  # Config
│   ├── seed.js               # Database seeder
│   └── package.json
│
├── hotelFrontend/
│   ├── src/
│   │   ├── services/         # API integration
│   │   ├── Home/             # Home components
│   │   ├── Login/            # Auth components
│   │   ├── Register/         # Registration
│   │   ├── HotelDetails/     # Hotel info
│   │   ├── Booking/          # Booking flow
│   │   └── App.jsx
│   ├── .env                  # Config
│   └── package.json
│
├── README.md                 # Main documentation
├── QUICKSTART.md             # Quick reference
└── start-all.bat             # Startup script
```

## 🔧 Configuration Files

### Backend .env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotelManagement
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend .env
```
VITE_API_URL=http://localhost:5000/api
```

## 🛠️ API Endpoints Reference

### Authentication
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user (Protected)

### Hotels
- `GET /api/hotels` - Get all hotels
  - Query params: `?popular=true`, `?mostPicked=true`, `?location=Colombo`
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel (Protected)
- `PUT /api/hotels/:id` - Update hotel (Protected, Owner only)
- `DELETE /api/hotels/:id` - Delete hotel (Protected, Owner only)
- `POST /api/hotels/:id/reviews` - Add review (Protected)

### Bookings
- `GET /api/bookings` - Get user bookings (Protected)
- `GET /api/bookings/:id` - Get booking (Protected)
- `POST /api/bookings` - Create booking (Protected)
- `PUT /api/bookings/:id` - Update booking (Protected)
- `DELETE /api/bookings/:id` - Cancel booking (Protected)

## 🎯 Key Features Implemented

✅ User authentication with JWT
✅ Password hashing with bcrypt
✅ File upload for hotel images/documents
✅ Role-based access (User, Hotel Owner, Admin)
✅ Protected routes in both backend and frontend
✅ Automatic token management
✅ Responsive design with Tailwind CSS
✅ Error handling and validation
✅ MongoDB integration with Mongoose
✅ RESTful API design
✅ CORS configuration
✅ Environment-based configuration

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Make sure MongoDB is running: `mongod`
- Check the connection string in `hotelBackend/.env`
- Try: `mongodb://localhost:27017/hotelManagement` or `mongodb://127.0.0.1:27017/hotelManagement`

### "CORS Error"
- Verify backend is running on port 5000
- Check `CLIENT_URL` in backend `.env` matches frontend URL
- Make sure frontend `.env` has correct `VITE_API_URL`

### "401 Unauthorized"
- Your JWT token may have expired
- Try logging out and logging back in
- Check that JWT_SECRET is set in backend `.env`

### "File upload not working"
- Check that `uploads/` directory exists in hotelBackend
- Verify file size is under 5MB
- Only images and PDFs are allowed

### "Frontend can't connect to backend"
- Verify backend is running on http://localhost:5000
- Check browser console for specific errors
- Verify VITE_API_URL in frontend `.env`

## 🎓 Next Steps

1. **Test all features** thoroughly
2. **Add more hotels** via the registration form
3. **Create multiple users** to test booking flow
4. **Customize styling** to match your design preferences
5. **Add more features**:
   - Search and filtering
   - User profile page
   - Booking history
   - Hotel reviews display
   - Email notifications
   - Payment gateway integration
   - Admin dashboard

## 📝 Important Notes

1. **Default Admin Credentials** (after running seed):
   - Username: `admin`
   - Password: `admin123`
   - ⚠️ Change this in production!

2. **File Storage**:
   - Currently uses local filesystem (`uploads/` folder)
   - For production, consider cloud storage (AWS S3, Cloudinary)

3. **Security**:
   - JWT_SECRET should be a strong, random string in production
   - Use HTTPS in production
   - Add rate limiting for API endpoints
   - Implement input sanitization

4. **Database**:
   - Currently using local MongoDB
   - For production, use MongoDB Atlas or similar cloud service

## 🎉 Success Indicators

You'll know everything is working when you can:
- ✅ Register a new user
- ✅ Login successfully
- ✅ See hotels on the home page
- ✅ Click a hotel and view its details
- ✅ Make a booking
- ✅ Complete payment
- ✅ Register as a hotel owner with file uploads

## 📧 Support

If you encounter any issues:
1. Check the console logs (both browser and terminal)
2. Verify all servers are running
3. Check the configuration files
4. Refer to the troubleshooting section above

---

**Made with ❤️ for hotel management**

Happy coding! 🚀
