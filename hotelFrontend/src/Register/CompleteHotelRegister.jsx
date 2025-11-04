import React from "react";
import { useNavigate } from "react-router-dom";
import Lanka from "../Register/Lanka";

import LoginImg from '../assets/Login/login.png';

const CompleteHotelRegister = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Background scenic image */}
      <img src={LoginImg} alt="Scenic" className="absolute inset-0 w-full h-full object-cover z-0" />
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-4xl mx-auto my-auto flex flex-col items-center justify-center rounded-[40px] overflow-hidden shadow-xl" style={{minHeight: '60vh'}}>
        {/* Frosted overlay */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-lg" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full py-12 px-4">
          <span className="text-[48px] font-bold text-center select-none mb-8">
            <span className="text-blue-600">Lanka</span><span className="text-gray-900">Stay.</span>
          </span>
          {/* Green check icon */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-8">
            <circle cx="40" cy="40" r="36" stroke="#38C976" strokeWidth="6" fill="none" />
            <path d="M28 41L38 51L54 33" stroke="#38C976" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-[32px] font-semibold text-blue-600 mb-8 text-center">Once we verified, You can Access Dashboard</div>
          <button
            className="bg-[#2056F6] text-white text-[28px] font-bold rounded-xl px-10 py-4 shadow hover:bg-[#003bb3] transition mb-2"
            onClick={() => navigate('/home')}
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteHotelRegister;
