import React from "react";
import vacationImg from '../assets/Home/sofa.jpg';
import usersIcon from '../assets/Logos/users.png';
import treasureIcon from '../assets/Logos/treasure.png';
import citiesIcon from '../assets/Logos/cities.png';

const StartNewVacation = () => (
  <div className="mb-30 pt-20 flex flex-col lg:flex-row bg-linear-to-br from-white to-blue-50 rounded-3xl gap-6 lg:gap-8 items-center box-border p-8 lg:p-12">
    {/* Left Side */}
    <div className="flex-1 flex flex-col justify-center items-start text-left animate-fade-in">
      <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold bg-linear-to-r from-[#152C5B] to-[#3252DF] bg-clip-text text-transparent leading-tight mb-4 animate-slide-in-left">Forget Busy Work,<br className="hidden sm:block" />Start Next Vacation</h1>
      <p className="text-gray-500 text-sm lg:text-[16px] mb-6 lg:mb-8 w-full lg:w-[335px] leading-relaxed">We provide what you need to enjoy your holiday with family. Time to make another memorable moments.</p>
      <button className="bg-linear-to-r from-[#3252DF] to-[#5b7cff] text-white text-base lg:text-[20px] font-medium rounded-xl px-6 lg:px-[55px] py-3 lg:py-3.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 w-fit cursor-pointer">Show More</button>
      <div className="flex gap-6 lg:gap-12 mt-8 lg:mt-12 flex-wrap">
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px] group hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="bg-blue-100 rounded-full p-2 w-fit mb-2">
            <img src={usersIcon} alt="Users" className="w-6 h-6 lg:w-8 lg:h-8" />
          </div>
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">2500</span>
            <span className="text-gray-500 text-sm lg:text-[16px]">Users</span>
          </div>
        </div>
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px] group hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="bg-purple-100 rounded-full p-2 w-fit mb-2">
            <img src={treasureIcon} alt="Treasure" className="w-6 h-6 lg:w-8 lg:h-8" />
          </div>
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">200</span>
            <span className="text-gray-500 text-sm lg:text-[16px]">treasure</span>
          </div>
        </div>
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px] group hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="bg-green-100 rounded-full p-2 w-fit mb-2">
            <img src={citiesIcon} alt="Cities" className="w-6 h-6 lg:w-8 lg:h-8" />
          </div>
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">100</span>
            <span className="text-gray-500 text-sm lg:text-[16px]">cities</span>
          </div>
        </div>
      </div>
    </div>
    {/* Right Side */}
    <div className="flex-1 flex justify-center items-center relative mt-6 lg:mt-0 animate-fade-in">
      
      <img src={vacationImg} alt="Vacation" className="w-[320px] sm:w-[420px] lg:w-[520px] h-[200px] sm:h-[300px] lg:h-[410px] object-cover rounded-3xl border-2 border-white shadow-2xl z-10 relative hover:scale-105 transition-transform duration-500" />
    </div>
  </div>
);

export default StartNewVacation;
