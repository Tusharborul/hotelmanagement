import React from "react";
import pic1 from "../assets/treasure/pic.png";
import getImageUrl from '../utils/getImageUrl';

const Treasure = ({ hotel }) => {
    // Use treasures from hotel data if available, otherwise show empty
    const treasures = hotel?.treasures || [];

    if (treasures.length === 0) {
        return null; // Don't show section if no treasures
    }

    return (
        <div className="mb-12 mt-20">
            <h2 className="text-[26px] font-bold bg-linear-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-10">Treasure to Choose</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 place-items-center lg:place-items-start">
                {treasures.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center lg:items-start group cursor-pointer">
                        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                            <img 
                                src={ item.image ? getImageUrl(item.image, pic1) : pic1 } 
                                alt={item.title} 
                                className="rounded-2xl object-cover w-[263px] h-[180px] group-hover:scale-110 transition-transform duration-700" 
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {item.popular && (
                                <div className="absolute top-0 right-0 bg-linear-to-r from-[#3256e2] to-[#5b7cff] text-white px-6 py-2 rounded-tl-2xl rounded-br-2xl text-lg font-bold shadow-lg flex items-center animate-pulse" style={{ minWidth: '170px', justifyContent: 'center' }}>
                                    <span className="font-bold">Popular</span> <span className="font-normal ml-2">Choice</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-[21px] font-bold text-[#1a237e] group-hover:text-[#3252DF] transition-colors duration-300">{item.title}</div>
                        <div className="text-[16px] text-gray-600">{item.subtitle}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Treasure;