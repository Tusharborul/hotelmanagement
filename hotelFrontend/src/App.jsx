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
      </Routes>
    </Router>
  );
}

export default App
