import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { bookingService } from "../services/bookingService";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { days = 2, checkInDate, totalPrice = 400, hotelId, hotelName, hotelLocation } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    bank: '',
    expDate: '',
    cvv: ''
  });

  // Calculate check-out date
  let checkOutDate = '';
  if (checkInDate) {
    const dateObj = new Date(checkInDate);
    dateObj.setDate(dateObj.getDate() + days);
    checkOutDate = dateObj.toISOString().split('T')[0];
  }

  const handleInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async () => {
    if (!hotelId) {
      setError('Hotel information is missing. Please go back and select a hotel.');
      return;
    }

    // Basic validation
    if (!paymentData.cardNumber || !paymentData.bank || !paymentData.expDate || !paymentData.cvv) {
      setError('Please fill in all payment details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        hotel: hotelId,
        checkInDate,
        days,
        paymentDetails: {
          cardNumber: paymentData.cardNumber.slice(-4), // Only store last 4 digits
          bank: paymentData.bank,
          expDate: paymentData.expDate
        }
      };

      await bookingService.createBooking(bookingData);
      
      // Navigate to success page
      navigate("/sucess", { 
        state: { 
          hotelName, 
          hotelLocation,
          checkInDate, 
          checkOutDate 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-white pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6">
      {/* Logo */}
      <div className="text-xl sm:text-2xl font-bold text-[#3252DF] mb-6 sm:mb-8">
        Lanka<span className="text-[#1a237e]">Stay.</span>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
          ✓
        </span>
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
          ✓
        </span>
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm sm:text-base">
          3
        </span>
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1a237e] mb-2 text-center px-4">
        Payment
      </h2>
      <p className="text-gray-400 mb-6 sm:mb-8 text-center text-sm sm:text-base px-4">
        Kindly follow the instructions below
      </p>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-start justify-center w-full max-w-3xl mx-auto gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
        {/* Left: Payment Info */}
        <div className="flex flex-col items-start w-full sm:w-[400px] mx-auto lg:mx-0">
          <span className="text-base sm:text-lg text-[#1a237e] mb-2 font-semibold">
            Transfer LankaStay:
          </span>
          <span className="text-sm sm:text-base text-[#1a237e] mb-2">
            {days} Day{days > 1 ? 's' : ''} at {hotelName || 'Blue Origin Fams'},<br />{hotelLocation || 'Galle, Sri Lanka'}
          </span>
          <span className="text-sm sm:text-base text-[#1a237e] mb-2">
            Check-in: <span className="font-bold">{checkInDate || '-'}</span><br />
            Check-out: <span className="font-bold">{checkOutDate || '-'}</span>
          </span>
          <span className="text-base sm:text-lg text-[#1a237e] mb-2">
            Total: <span className="font-bold">${totalPrice} USD</span>
          </span>
          <span className="text-base sm:text-lg text-[#1a237e] mb-2">
            Initial Payment: <span className="font-bold">${Math.round((totalPrice/2))}</span>
          </span>
        </div>

        {/* Right: Payment Form */}
        <form className="flex flex-col gap-4 sm:gap-6 w-full sm:max-w-md mx-auto lg:mx-0">
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2 text-sm sm:text-base">Card Number</label>
            <input
              type="text"
              name="cardNumber"
              value={paymentData.cardNumber}
              onChange={handleInputChange}
              placeholder="Payment card number"
              className="bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2 text-sm sm:text-base">Bank</label>
            <input
              type="text"
              name="bank"
              value={paymentData.bank}
              onChange={handleInputChange}
              placeholder="Select Bank"
              className="bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2 text-sm sm:text-base">Exp Date</label>
            <input
              type="text"
              name="expDate"
              value={paymentData.expDate}
              onChange={handleInputChange}
              placeholder="MM/YY"
              className="bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2 text-sm sm:text-base">CVV</label>
            <input
              type="text"
              name="cvv"
              value={paymentData.cvv}
              onChange={handleInputChange}
              placeholder="Beside the card"
              className="bg-gray-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-3 sm:gap-4 mb-8">
        <button 
          className="bg-[#0057FF] text-white text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow hover:bg-[#003bb3] transition disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        <button className="bg-gray-100 text-gray-400 text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow" onClick={() => navigate("/booking")}>Cancel</button>
      </div>
    </div>
  );
};

export default Payment;
