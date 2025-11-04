import React from "react";
import LoginImg from '../assets/Login/login.png';

const Lanka = () => {
  return (
     <div className="hidden lg:flex relative lg:w-1/2 h-64 lg:h-screen items-center justify-center">
        <img src={LoginImg} alt="Login" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 w-[90%] max-w-lg h-[80%] mx-auto my-auto flex items-center justify-center rounded-[30px] overflow-hidden shadow-xl border border-white/20">
            {/* background image clipped by rounded card */}
            <img src={LoginImg} alt="Login" className="absolute inset-0 w-full h-full object-cover" />
            {/* frosted white overlay */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-lg" />
            <div className="relative z-20 flex items-center justify-center w-full h-full">
              <span className="text-[48px] font-bold text-center select-none">
                <span className="text-blue-600">Lanka</span><span className="text-gray-900">Stay.</span>
              </span>
            </div>
          </div>
      </div>
  );
};

export default Lanka;
