import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import placeImg from "../assets/location/Shangri-La.png"; // Use your actual image path
import { hotelService } from "../services/hotelService";
import { authService } from "../services/authService";
import getImageUrl from '../utils/getImageUrl';

const Booking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');
  
  // State for days and date
  const [days, setDays] = useState(2);
  const [checkInDate, setCheckInDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Price per day (can be dynamic or fetched from API)
  const pricePerDay = hotel?.price || 200;
  const totalPrice = days * pricePerDay;

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Fetch hotel details if hotelId is provided
    const fetchHotel = async () => {
      if (hotelId) {
        try {
          const response = await hotelService.getHotel(hotelId);
          setHotel(response.data);
        } catch (error) {
          console.error('Error fetching hotel:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [hotelId, navigate]);

  const hotelImage = hotel?.mainImage ? getImageUrl(hotel.mainImage, placeImg) : placeImg;
  const hotelName = hotel?.name;
  const hotelLocation = hotel?.location;
  
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading booking details...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-400">Hotel not found.</div>
      </div>
    );
  }

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
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold mr-3 sm:mr-4 text-sm sm:text-base">
        2
      </span>
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm sm:text-base">
        3
      </span>
    </div>

    {/* Title */}
    <h2 className="text-2xl sm:text-3xl font-bold text-[#1a237e] mb-2 text-center px-4">
      Booking Information
    </h2>
    <p className="text-gray-400 mb-6 sm:mb-8 text-center text-sm sm:text-base px-4">
      Please fill up the blank fields below
    </p>

    {/* Main Content */}
    <div className="flex flex-col md:flex-row items-start justify-center w-full max-w-3xl mx-auto gap-6 sm:gap-8 mb-8 sm:mb-12">
      {/* Left: Place Info */}
      <div className="flex flex-col items-center w-full sm:w-[320px] mx-auto md:mx-0">
        <img
          src={hotelImage}
          alt="Place"
          className="rounded-xl w-full sm:w-[320px] h-[180px] object-cover mb-2"
        />
        <div className="flex flex-col items-start w-full">
          <span className="text-base sm:text-lg font-semibold text-[#1a237e]">
            {hotelName}
          </span>
          <span className="text-xs sm:text-sm text-gray-400">{hotelLocation}</span>
        </div>
      </div>

      {/* Right: Booking Form */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-xs mx-auto md:mx-0">
        {/* Stay Duration */}
        <div>
          <label className="block text-gray-600 mb-2 font-medium">
            How long you will stay?
          </label>
          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
            <button
              className="bg-red-500 text-white px-4 py-2 font-bold text-xl"
              onClick={() => setDays(prev => Math.max(1, prev - 1))}
              aria-label="Decrease days"
            >
              -
            </button>
            <span className="flex-1 text-center py-2 text-lg font-semibold text-[#1a237e] bg-white">
              {days} Day{days > 1 ? 's' : ''}
            </span>
            <button
              className="bg-green-400 text-white px-4 py-2 font-bold text-xl"
              onClick={() => setDays(prev => prev + 1)}
              aria-label="Increase days"
            >
              +
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-gray-600 mb-2 font-medium">
            Pick a Date
          </label>
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <span className="mr-2">
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="#3252DF"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="4"
                  stroke="#3252DF"
                  strokeWidth="2"
                />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  stroke="#3252DF"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <input
              type="date"
            className="text-[#1a237e] font-medium bg-white border-none outline-none px-2 py-1 rounded"
               name="checkInDate" value={checkInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setCheckInDate(e.target.value)}
            />
            <span className="ml-2 text-gray-400 text-sm">Check-in</span>
          </div>
        </div>

        {/* Price Info */}
        <div className="text-sm sm:text-base">
          <span className="text-gray-400 text-base sm:text-lg">You will pay</span>
          <span className="text-[#1a237e] font-bold text-xl sm:text-2xl ml-2">${totalPrice} USD</span>
          <span className="text-gray-400 text-base sm:text-lg ml-2">for</span>
          <span className="text-[#1a237e] font-bold text-xl sm:text-2xl ml-2">{days} Day{days > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-3 sm:gap-4 mb-8">
      <button
        className="bg-[#0057FF] text-white text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow hover:bg-[#003bb3] transition"
        onClick={() => navigate('/payment', {
          state: {
            days,
            checkInDate,
            totalPrice,
            hotelId,
            hotelName,
            hotelLocation
          }
        })}
      >
        Book Now
      </button>
      <button 
        className="bg-gray-100 text-gray-400 text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow" 
        onClick={() => hotelId ? navigate(`/hoteldetails?id=${hotelId}`) : navigate('/home')}
      >
        Cancel
      </button>
    </div>
  </div>
  );
};

export default Booking;
