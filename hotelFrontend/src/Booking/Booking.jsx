import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import placeImg from "../assets/location/Shangri-La.png"; // Use your actual image path

const Booking = () => {
  const navigate = useNavigate();
  // State for days and date
  const [days, setDays] = useState(2);
  const [checkInDate, setCheckInDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  // Price per day (can be dynamic or fetched from API)
  const pricePerDay = 200;
  const totalPrice = days * pricePerDay;
  return (
  <div className="w-full min-h-screen flex flex-col items-center bg-white pt-8">
    {/* Logo */}
    <div className="text-2xl font-bold text-[#3252DF] mb-8">
      Lanka<span className="text-[#1a237e]">Stay.</span>
    </div>

    {/* Progress Bar */}
    <div className="flex items-center justify-center mb-8">
      <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-4">
        ✓
      </span>
      <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold mr-4">
        2
      </span>
      <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
        3
      </span>
    </div>

    {/* Title */}
    <h2 className="text-3xl font-bold text-[#1a237e] mb-2 text-center">
      Booking Information
    </h2>
    <p className="text-gray-400 mb-8 text-center">
      Please fill up the blank fields below
    </p>

    {/* Main Content */}
    <div className="flex flex-row items-start justify-between w-full max-w-3xl mx-auto gap-8 mb-12 flex-wrap">
      {/* Left: Place Info */}
      <div className="flex flex-col items-center w-[320px]">
        <img
          src={placeImg}
          alt="Place"
          className="rounded-xl w-[320px] h-[180px] object-cover mb-2"
        />
        <div className="flex flex-col items-start w-full">
          <span className="text-lg font-semibold text-[#1a237e]">
            Blue Origin Fams
          </span>
          <span className="text-sm text-gray-400">Galle, Sri Lanka</span>
        </div>
      </div>

      {/* Right: Booking Form */}
      <div className="flex flex-col gap-6 w-full max-w-xs">
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
              value={checkInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setCheckInDate(e.target.value)}
            />
            <span className="ml-2 text-gray-400 text-sm">Check-in</span>
          </div>
        </div>

        {/* Price Info */}
        <div>
          <span className="text-gray-400 text-lg">You will pay</span>
          <span className="text-[#1a237e] font-bold text-2xl ml-2">${totalPrice} USD</span>
          <span className="text-gray-400 text-lg ml-2">for</span>
          <span className="text-[#1a237e] font-bold text-2xl ml-2">{days} Day{days > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-4">
      <button
        className="bg-[#0057FF] text-white text-lg font-medium rounded-lg py-3 w-full shadow hover:bg-[#003bb3] transition"
        onClick={() => navigate('/payment', {
          state: {
            days,
            checkInDate,
            totalPrice
          }
        })}
      >
        Book Now
      </button>
      <button className="bg-gray-100 text-gray-400 text-lg font-medium rounded-lg py-3 w-full shadow" onClick={() => navigate('/hoteldetails')}>
        Cancel
      </button>
    </div>
  </div>
  );
};

export default Booking;
