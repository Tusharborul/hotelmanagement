import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Register/Register.jsx';
import HomePage from './Home/HomePage';
import Hotels from './Home/Hotels.jsx';
import HotelDetails from './HotelDetails/HotelDetails.jsx';
import Booking from './Booking/Booking.jsx';
import Payment from './Booking/Payment.jsx';
import Success from './Booking/Sucess.jsx';
import Hotel from './Register/RegisterHotel.jsx';
import Login from './Login/Login.jsx';  
import CompleteHotelRegister from './Register/CompleteHotelRegister.jsx';
import RegisterSucess from './Register/RegisterSucess.jsx';
import AdminDashboard from './Dashboard/AdminDashboard.jsx';
import OwnerDashboard from './Dashboard/OwnerDashboard.jsx';
import UserDashboard from './Dashboard/UserDashboard.jsx';
import DashboardEntry from './Dashboard/DashboardEntry.jsx';
// Admin pages
import AdminUsers from './Dashboard/Admin/Users.jsx';
import AdminOwners from './Dashboard/Admin/Owners.jsx';
import AdminHotels from './Dashboard/Admin/Hotels.jsx';
import AdminBookingDetails from './Dashboard/Admin/BookingDetails.jsx';
import AdminRefunds from './Dashboard/Admin/Refunds.jsx';
// Owner pages
import OwnerObjectives from './Dashboard/Owner/Objectives.jsx';
import OwnerBookings from './Dashboard/Owner/Bookings.jsx';
import OwnerPhotos from './Dashboard/Owner/Photos.jsx';
import OwnerTreasures from './Dashboard/Owner/Treasures.jsx';
import OwnerRefunds from './Dashboard/Owner/Refunds.jsx';
import OwnerRooms from './Dashboard/Owner/Rooms.jsx';
// ...existing code...
// User pages
import UserBookings from './Dashboard/User/Bookings.jsx';
import UserHotels from './Dashboard/User/Hotels.jsx';
import UserRefunds from './Dashboard/User/Refunds.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
function App() {
  return (
    <Router>
     
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/hotels" element={<Hotels />} />
         <Route path="/hoteldetails" element={<HotelDetails />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/sucess" element={<Success />} />
        <Route path="/registerhotel" element={<Hotel />} />
         <Route path="/login" element={<Login />} />
          <Route path="/completehotelregister" element={<CompleteHotelRegister />} />
          <Route path="/registersucess" element={<RegisterSucess />} />
          {/* Dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={["user","admin","hotelOwner"]}>
              <DashboardEntry />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/users" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/owners" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminOwners />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/hotels" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminHotels />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/bookings" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminBookingDetails />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/refunds" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminRefunds />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/objectives" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerObjectives />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/bookings" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerBookings />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/photos" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerPhotos />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/treasures" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerTreasures />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/rooms" element={
            <ProtectedRoute roles={["hotelOwner","admin"]}>
              <OwnerRooms />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/refunds" element={
            <ProtectedRoute roles={["hotelOwner"]}>
              <OwnerRefunds />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/photos" element={
            <ProtectedRoute roles={["hotelOwner","admin"]}>
              <OwnerPhotos />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/owner/treasures" element={
            <ProtectedRoute roles={["hotelOwner","admin"]}>
              <OwnerTreasures />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/bookings" element={
            <ProtectedRoute roles={["user","admin","hotelOwner"]}>
              <UserBookings />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hotels" element={
            <ProtectedRoute roles={["user","admin","hotelOwner"]}>
              <UserHotels />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/refunds" element={
            <ProtectedRoute roles={["user","admin","hotelOwner"]}>
              <UserRefunds />
            </ProtectedRoute>
          } />
      </Routes>
    </Router>
  );
}

export default App
