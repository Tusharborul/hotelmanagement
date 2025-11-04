import React from "react";
import vacationImg from '../assets/Home/sofa.jpg';
import usersIcon from '../assets/Logos/users.png';
import treasureIcon from '../assets/Logos/treasure.png';
import citiesIcon from '../assets/Logos/cities.png';

const StartNewVacation = () => (
  <div className="pt-20 flex flex-col lg:flex-row bg-white gap-6 lg:gap-8 items-center box-border">
    {/* Left Side */}
    <div className="flex-1 flex flex-col justify-center items-start text-left">
      <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-[#152C5B] leading-tight mb-4">Forget Busy Work,<br className="hidden sm:block" />Start Next Vacation</h1>
      <p className="text-gray-400 text-sm lg:text-[16px] mb-6 lg:mb-8 w-full lg:w-[335px]">We provide what you need to enjoy your holiday with family. Time to make another memorable moments.</p>
      <button className="bg-[#3252DF] text-white text-base lg:text-[20px] font-medium rounded-lg px-6 lg:px-[55px] py-2 lg:py-2.5 shadow hover:bg-[#1d3bb3] transition w-fit">Show More</button>
      <div className="flex gap-6 lg:gap-12 mt-8 lg:mt-12 flex-wrap">
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px]">
          <img src={usersIcon} alt="Users" className="w-6 h-6 lg:w-8 lg:h-8 mb-1" />
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">2500</span>
            <span className="text-gray-400 text-sm lg:text-[16px]">Users</span>
          </div>
        </div>
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px]">
          <img src={treasureIcon} alt="Treasure" className="w-6 h-6 lg:w-8 lg:h-8 mb-1" />
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">200</span>
            <span className="text-gray-400 text-sm lg:text-[16px]">treasure</span>
          </div>
        </div>
        <div className="flex flex-col min-w-[72px] lg:w-[87px] h-[69px]">
          <img src={citiesIcon} alt="Cities" className="w-6 h-6 lg:w-8 lg:h-8 mb-1" />
          <div className="flex flex-row items-center gap-1">
            <span className="text-[#3252DF] text-sm lg:text-[16px] font-bold">100</span>
            <span className="text-gray-400 text-sm lg:text-[16px]">cities</span>
          </div>
        </div>
      </div>
    </div>
    {/* Right Side */}
    <div className="flex-1 flex justify-center items-center relative mt-6 lg:mt-0">
  <div className="absolute -bottom-8 -right-8 w-[360px] sm:w-[460px] lg:w-[560px] h-[240px] sm:h-80 lg:h-[450px] rounded-2xl border-2 border-gray-200 bg-white z-0"></div>
  <img src={vacationImg} alt="Vacation" className="w-[320px] sm:w-[420px] lg:w-[520px] h-[200px] sm:h-[300px] lg:h-[410px] object-cover rounded-2xl border-2 border-white shadow-lg z-10 relative" />
    </div>
  </div>
);

export default StartNewVacation;
