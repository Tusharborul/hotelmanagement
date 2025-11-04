import React from "react";
import { useNavigate } from "react-router-dom";
import bedroom from "../assets/Details/ic_bedroom.png";
import livingroom from "../assets/Details/ic_livingroom.png";
import bathroom from "../assets/Details/bathroom.png";
import diningroom from "../assets/Details/ic_diningroom.png";
import wifi from "../assets/Details/ic_wifi.png";
import unit from "../assets/Details/ic_ac.png";
import fridge from "../assets/Details/ic_kulkas.png";
import tv from "../assets/Details/ic_tv.png";



const Details = ({ hotel, hotelId }) => {
    const navigate = useNavigate();
    
    // Default values if hotel data is not available
    const defaultDescription = "Minimal techno is a minimalist subgenre of techno music. It is characterized by a stripped-down aesthetic that exploits the use of repetition and understated development. Minimal techno is thought to have been originally developed in the early 1990s by Detroit-based producers Robert Hood and Daniel Bell.";
    const defaultPrice = 200;
    const defaultFacilities = {
        bedrooms: 1,
        livingrooms: 1,
        bathrooms: 1,
        diningrooms: 1,
        wifi: '10 mbp/s',
        unitsReady: 7,
        refrigerator: 1,
        television: 2
    };

    const description = hotel?.description || defaultDescription;
    const price = hotel?.price || defaultPrice;
    const facilities = hotel?.facilities || defaultFacilities;

    const handleBooking = () => {
        if (hotelId) {
            navigate(`/booking?hotelId=${hotelId}`);
        } else {
            navigate('/booking');
        }
    };

    return (
        <div className=" mb-6 mt-20 ">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: About the place */}
                <div className="flex-1">
                    <h2 className="text-[20px] font-semibold text-[#1a237e] mb-4">About the place</h2>
                    <p className="text-[16px] text-gray-400 mb-2">
                        {description}
                    </p>
                    {hotel?.name && (
                        <p className="text-[16px] text-gray-400">
                            Located in {hotel.location}, this property offers a comfortable stay with modern amenities.
                        </p>
                    )}
                </div>
                {/* Right: Booking Card */}
                <div className="w-full lg:w-[487px] h-auto lg:h-[230px] bg-white rounded-2xl shadow-md flex flex-col justify-center border border-gray-200 p-6 lg:p-20">
                    <div className="text-[20px] text-[#1a237e] font-semibold mb-2">Start Booking</div>
                    <div className="text-[36px] font-bold text-[#2ad3b3] mb-2">${price} <span className="text-[18px] text-gray-400 font-normal">per Day</span></div>
                    <button
                        className="bg-[#3256e2] w-full lg:w-[347px] h-[41px] text-white font-semibold rounded-xl px-8 py-3 shadow-sm hover:bg-blue-700 transition mt-4"
                        onClick={handleBooking}
                    >
                        Book Now!
                    </button>
                </div>
            </div>
            {/* Bottom: Features icons and labels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mt-12 px-2 items-center">
                {/* Example icons, replace src with your actual icon paths */}
                <div className="flex flex-col items-left">
                    <img src={bedroom} alt="Bedroom" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.bedrooms}</span> bedroom</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={livingroom} alt="Living Room" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.livingrooms}</span> living room</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={bathroom} alt="Bathroom" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.bathrooms}</span> bathroom</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={diningroom} alt="Dining Room" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.diningrooms}</span> dining room</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={wifi} alt="WiFi" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.wifi}</span></span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={unit} alt="Unit Ready" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.unitsReady}</span> unit ready</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={fridge} alt="Refrigerator" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.refrigerator}</span> refrigerator</span>
                </div>
                <div className="flex flex-col items-left">
                    <img src={tv} alt="Television" className="w-9 h-9 mb-2" />
                    <span className="text-lg text-gray-400"><span className="font-semibold text-[#1a237e]">{facilities.television}</span> television</span>
                </div>
            </div>
        </div>
    );
};

export default Details;