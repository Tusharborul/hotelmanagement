import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { days = 2, checkInDate, totalPrice = 400 } = location.state || {};
  // Calculate check-out date
  let checkOutDate = '';
  if (checkInDate) {
    const dateObj = new Date(checkInDate);
    dateObj.setDate(dateObj.getDate() + days);
    checkOutDate = dateObj.toISOString().split('T')[0];
  }
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
        <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-4">
          ✓
        </span>
        <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
          3
        </span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-[#1a237e] mb-2 text-center">
        Payment
      </h2>
      <p className="text-gray-400 mb-8 text-center">
        Kindly follow the instructions below
      </p>

      {/* Main Content */}
      <div className="flex flex-row items-start justify-between w-full max-w-3xl mx-auto gap-12 mb-12">
        {/* Left: Payment Info */}
        <div className="flex flex-col items-start w-[400px] min-w-[320px]">
          <span className="text-lg text-[#1a237e] mb-2 font-semibold">
            Transfer LankaStay:
          </span>
          <span className="text-base text-[#1a237e] mb-2">
            {days} Day{days > 1 ? 's' : ''} at Blue Origin Fams,<br />Galle, Sri Lanka
          </span>
          <span className="text-base text-[#1a237e] mb-2">
            Check-in: <span className="font-bold">{checkInDate || '-'}</span><br />
            Check-out: <span className="font-bold">{checkOutDate || '-'}</span>
          </span>
          <span className="text-lg text-[#1a237e] mb-2">
            Total: <span className="font-bold">${totalPrice} USD</span>
          </span>
          <span className="text-lg text-[#1a237e] mb-2">
            Initial Payment: <span className="font-bold">${Math.round((totalPrice/2))}</span>
          </span>
        </div>

        {/* Right: Payment Form */}
        <form className="flex flex-col gap-6 w-full max-w-md min-w-[320px]">
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2">Card Number</label>
            <input
              type="text"
              placeholder="Payment card number"
              className="bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2">Bank</label>
            <input
              type="text"
              placeholder="Select Bank"
              className="bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2">Exp Date</label>
            <input
              type="text"
              placeholder="Validation date"
              className="bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div>
            <label className="block text-[#1a237e] font-semibold mb-2">CVV</label>
            <input
              type="text"
              placeholder="Beside the card"
              className="bg-gray-100 rounded-lg px-4 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </form>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-4">
        <button className="bg-[#0057FF] text-white text-lg font-medium rounded-lg py-3 w-full shadow hover:bg-[#003bb3] transition" onClick={() => navigate("/sucess")}>Pay Now</button>
        <button className="bg-gray-100 text-gray-400 text-lg font-medium rounded-lg py-3 w-full shadow" onClick={() => navigate("/booking")}>Cancel</button>
      </div>
    </div>
  );
};

export default Payment;
