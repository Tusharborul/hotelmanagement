import React from 'react';
import { useNavigate } from 'react-router-dom';
import Img from '../assets/Logos/Group 1 1.png';

const Sucess = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-white pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6">
            {/* Logo */}
            <div className="text-xl sm:text-2xl font-bold text-[#3252DF] mb-6 sm:mb-8">
                India<span className="text-[#1a237e]">Stay.</span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-center mb-6 sm:mb-8">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">✓</span>
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">✓</span>
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-sm sm:text-base">✓</span>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a237e] mb-4 sm:mb-6 text-center px-4">Yay! Payment Completed</h2>

            {/* Illustration */}
            <img src={Img} alt="Success" className="w-[280px] sm:w-[320px] h-[190px] sm:h-[220px] mb-4 sm:mb-6" />

            {/* Info Text */}
            <p className="text-[#3252DF] text-center mb-2 text-base sm:text-lg px-4">Please check your email & phone Message.<br />We have sent all the Information</p>
            <button
                className="bg-[#0057FF] text-white text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 px-6 sm:px-8 shadow hover:bg-[#003bb3] transition mt-2"
                onClick={() => navigate('/dashboard')}
            >
                Go to Dashboard
            </button>
        </div>
    );
};

export default Sucess;