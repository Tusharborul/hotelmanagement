import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import placeImg from "../assets/location/Shangri-La.png"; // Use your actual image path
import { hotelService } from "../services/hotelService";
import { authService } from "../services/authService";
import getImageUrl from '../utils/getImageUrl';
import { formatINR } from '../utils/currency';

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
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  
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
  <div className="w-full min-h-screen flex flex-col items-center bg-linear-to-br from-gray-50 to-blue-50 pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6">
    {/* Logo */}
    <div className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
      <span className="bg-linear-to-r from-[#3252DF] to-[#5b7cff] bg-clip-text text-transparent">Lanka</span>
      <span className="text-[#1a237e] ml-1">Stay.</span>
    </div>

    {/* Progress Bar */}
    <div className="flex items-center justify-center mb-6 sm:mb-8">
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base shadow-lg">
        ✓
      </span>
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base shadow-lg">
        2
      </span>
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm sm:text-base">
        3
      </span>
    </div>

    {/* Title */}
    <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1a237e] to-[#3252DF] bg-clip-text text-transparent mb-2 text-center px-4">
      Booking Information
    </h2>
    <p className="text-gray-500 mb-6 sm:mb-8 text-center text-sm sm:text-base px-4">
      Please fill up the blank fields below
    </p>

    {/* Main Content */}
    <div className="flex flex-col md:flex-row items-start justify-center w-full max-w-3xl mx-auto gap-6 sm:gap-8 mb-8 sm:mb-12">
      {/* Left: Place Info */}
      <div className="flex flex-col items-center w-full sm:w-[320px] mx-auto md:mx-0">
        <div className="relative rounded-2xl overflow-hidden shadow-xl w-full sm:w-[320px] h-[180px] mb-3 group">
          <img
            src={hotelImage}
            alt="Place"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
        </div>
        <div className="flex flex-col items-start w-full">
          <span className="text-base sm:text-lg font-semibold text-[#1a237e]">
            {hotelName}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {hotelLocation}
          </span>
        </div>
      </div>

      {/* Right: Booking Form */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-xs mx-auto md:mx-0">
        {/* Stay Duration */}
        <div>
          <label className="block text-gray-700 mb-3 font-medium">
            How long you will stay?
          </label>
          <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
            <button
              className="bg-linear-to-br from-red-500 to-red-600 text-white px-5 py-3 font-bold text-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 cursor-pointer"
              onClick={() => setDays(prev => Math.max(1, prev - 1))}
              aria-label="Decrease days"
            >
              -
            </button>
            <span className="flex-1 text-center py-3 text-lg font-semibold text-[#1a237e] bg-white">
              {days} Day{days > 1 ? 's' : ''}
            </span>
            <button
              className="bg-linear-to-br from-green-400 to-green-500 text-white px-5 py-3 font-bold text-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 cursor-pointer"
              onClick={() => setDays(prev => prev + 1)}
              aria-label="Increase days"
            >
              +
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-gray-700 mb-3 font-medium">
            Pick a Date
          </label>
          <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
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
              className="text-[#1a237e] font-medium bg-white border-none outline-none px-2 py-1 rounded cursor-pointer"
              name="checkInDate" value={checkInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setCheckInDate(e.target.value)}
            />
            <span className="ml-2 text-gray-500 text-sm">Check-in</span>
          </div>
        </div>

        {/* Price Info */}
        <div className="text-sm sm:text-base">
          <span className="text-gray-400 text-base sm:text-lg">You will pay</span>
          <span className="text-[#1a237e] font-bold text-xl sm:text-2xl ml-2">{formatINR(totalPrice)}</span>
          <span className="text-gray-400 text-base sm:text-lg ml-2">for</span>
          <span className="text-[#1a237e] font-bold text-xl sm:text-2xl ml-2">{days} Day{days > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-3 sm:gap-4 mb-8">
      <button
        className="bg-linear-to-r from-[#0057FF] to-[#5b7cff] text-white text-base sm:text-lg font-medium rounded-2xl py-3 sm:py-3.5 w-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
        onClick={async () => {
          setError('');
          if (!hotelId) {
            setError('Missing hotel information. Please go back and select a hotel again.');
            return;
          }
          const nights = Number(days);
          if (!Number.isFinite(nights) || nights < 1) {
            setError('Please select at least 1 day.');
            return;
          }
          if (!checkInDate) {
            setError('Please choose a check-in date.');
            return;
          }
          const chosen = new Date(checkInDate);
          const today = new Date();
          today.setHours(0,0,0,0);
          if (Number.isNaN(chosen.getTime()) || chosen < today) {
            setError('Check-in date must be today or later.');
            return;
          }
          try {
            setChecking(true);
            // Pre-check availability so users aren't surprised on payment page
            const resp = await hotelService.checkAvailability(hotelId, checkInDate, days);
            // hotelService returns the axios response data, but be defensive
            const payload = resp?.data || resp;
            if (payload && payload.available === false) {
              const dates = payload.dates || (payload.date ? [payload.date] : []);
              if (dates.length > 0) {
                const formattedDates = dates.map(d => {
                  const dt = new Date(d);
                  const dd = String(dt.getDate()).padStart(2, '0');
                  const mm = String(dt.getMonth() + 1).padStart(2, '0');
                  const yyyy = dt.getFullYear();
                  return `${dd}/${mm}/${yyyy}`;
                });
                let formatted;
                if (formattedDates.length === 1) formatted = formattedDates[0];
                else if (formattedDates.length === 2) formatted = `${formattedDates[0]} and ${formattedDates[1]}`;
                else formatted = `${formattedDates.slice(0, -1).join(', ')} and ${formattedDates[formattedDates.length - 1]}`;
                setError(`Hotel is fully booked for ${formatted}. Please select another day.`);
                return;
              }
              setError('Hotel is not available for the selected stay. Please choose another date.');
              return;
            }
            navigate('/payment', {
              state: {
                days,
                checkInDate,
                totalPrice,
                hotelId,
                hotelName,
                hotelLocation
              }
            });
          } catch (err) {
            console.error('Availability check failed', err);
            setError(err.response?.data?.message || 'Availability check failed. Please try again.');
          }
          finally {
            setChecking(false);
          }
        }}
        disabled={checking}
        aria-busy={checking}
      >
        {checking ? 'Checking...' : 'Book Now'}
      </button>
      {error && <div className="text-red-500 mt-2 bg-red-50 p-3 rounded-xl border border-red-200">{error}</div>}
      <button 
        className="bg-white border-2 border-gray-300 text-gray-600 text-base sm:text-lg font-medium rounded-2xl py-3 sm:py-3.5 w-full shadow-md hover:shadow-lg hover:border-gray-400 transition-all duration-300 cursor-pointer" 
        onClick={() => hotelId ? navigate(`/hoteldetails?id=${hotelId}`) : navigate('/home')}
      >
        Cancel
      </button>
    </div>
    {/* Full-screen loader overlay during checking */}
    {checking && (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
        <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100 text-[#1a237e] font-medium">Checking availability...</div>
      </div>
    )}
  </div>
  );
};

export default Booking;
