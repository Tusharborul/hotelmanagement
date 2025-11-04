import React from 'react';
import { useNavigate } from 'react-router-dom';
import Img from '../assets/Logos/Group 1 1.png';

const Sucess = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-white pt-8">
            {/* Logo */}
            <div className="text-2xl font-bold text-[#3252DF] mb-8">
                Lanka<span className="text-[#1a237e]">Stay.</span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-center mb-8">
                <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-4">✓</span>
                <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-4">✓</span>
                <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">✓</span>
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-[#1a237e] mb-6 text-center">Yay! Payment Completed</h2>

            {/* Illustration */}
            <img src={Img} alt="Success" className="w-[320px] h-[220px] mb-6" />

            {/* Info Text */}
            <p className="text-[#3252DF] text-center mb-2 text-lg">Please check your email & phone Message.<br />We have sent all the Information</p>
            <button
                className="bg-[#0057FF] text-white text-lg font-medium rounded-lg py-3 px-6 shadow hover:bg-[#003bb3] transition mt-2"
                onClick={() => navigate('/home')}
            >
                Go to Dashboard
            </button>
        </div>
    );
};

export default Sucess;