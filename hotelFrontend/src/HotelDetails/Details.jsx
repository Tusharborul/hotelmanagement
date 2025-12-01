import { formatLocation } from "../utils/location";
import React from "react";
import { formatINR } from "../utils/currency";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import bedroom from "../assets/Details/ic_bedroom.png";
import livingroom from "../assets/Details/ic_livingroom.png";
import bathroom from "../assets/Details/bathroom.png";
import diningroom from "../assets/Details/ic_diningroom.png";
import wifi from "../assets/Details/ic_wifi.png";
import unit from "../assets/Details/ic_ac.png";
import fridge from "../assets/Details/ic_kulkas.png";
import tv from "../assets/Details/ic_tv.png";



const Details = ({ hotel, hotelId, inModal = false }) => {
    const navigate = useNavigate();

    const handleBooking = () => {
        if (inModal) return; // disable booking when rendered inside a modal
        // Check if user is authenticated
        const isLoggedIn = authService.isAuthenticated();
        console.log('Is user logged in?', isLoggedIn);
        console.log('Token:', localStorage.getItem('token'));
        
        if (!isLoggedIn) {
            // Store the intended destination
            localStorage.setItem('redirectAfterLogin', `/booking?hotelId=${hotelId}`);
        
            navigate('/login');
            return;
        }

        // User is authenticated, proceed to booking
        if (hotelId) {
            navigate(`/booking?hotelId=${hotelId}`);
        } else {
            navigate('/booking');
        }
    };

    if (!hotel) {
        return <div className="mb-6 mt-20 text-center text-lg text-gray-500">No hotel details available.</div>;
    }

    return (
        <div className="mb-8 mt-20">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: About the place */}
                <div className="flex-1">
                    <h2 className="text-[22px] font-bold text-[#1a237e] mb-5">About the place</h2>
                    {hotel.description ? (
                        <>
                            <p className="text-[17px] text-gray-600 mb-4 leading-relaxed">
                                {hotel.description}
                            </p>
                            {hotel.location && (
                                <p className="text-[17px] text-gray-600 leading-relaxed">
                                    Located in {formatLocation(hotel.location)}, this property offers a comfortable stay with modern amenities.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-[17px] text-gray-500">No description available.</p>
                    )}
                </div>
                {/* Right: Booking Card */}
                <div className="w-full lg:w-[487px] h-auto lg:h-60 bg-white rounded-2xl shadow-xl flex flex-col justify-center border border-gray-200 p-6 lg:p-20 hover:shadow-2xl transition-shadow duration-300">
                    <div className="text-[20px] text-[#1a237e] font-bold mb-3">Start Booking</div>
                    <div className="text-[38px] font-bold text-[#3256e2] mb-3">
                        {hotel.price ? `${formatINR(hotel.price)}` : 'Price not available'}
                        {hotel.price && <span className="text-[18px] text-gray-500 font-normal"> per Day</span>}
                    </div>
                    <button
                        className="bg-[#3256e2] w-full lg:w-[347px] h-12 text-white font-semibold rounded-lg px-8 shadow-md hover:bg-[#2545c8] transition-colors duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3256e2]"
                        onClick={handleBooking}
                        disabled={inModal || !hotel.price}
                    >
                        Book Now!
                    </button>
                </div>
            </div>
            {/* Bottom: Features icons and labels */}
            {hotel.facilities && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mt-14 px-2 items-center">
                    {hotel.facilities.bedrooms && (
                        <div className="flex flex-col items-left">
                            <div className="bg-blue-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={bedroom} alt="Bedroom" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.bedrooms}</span> bedroom</span>
                        </div>
                    )}
                    {hotel.facilities.livingrooms && (
                        <div className="flex flex-col items-left">
                            <div className="bg-purple-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={livingroom} alt="Living Room" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.livingrooms}</span> living room</span>
                        </div>
                    )}
                    {hotel.facilities.bathrooms && (
                        <div className="flex flex-col items-left">
                            <div className="bg-cyan-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={bathroom} alt="Bathroom" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.bathrooms}</span> bathroom</span>
                        </div>
                    )}
                    {hotel.facilities.diningrooms && (
                        <div className="flex flex-col items-left">
                            <div className="bg-green-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={diningroom} alt="Dining Room" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.diningrooms}</span> dining room</span>
                        </div>
                    )}
                    {hotel.facilities.wifi && (
                        <div className="flex flex-col items-left">
                            <div className="bg-yellow-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={wifi} alt="WiFi" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.wifi}</span></span>
                        </div>
                    )}
                    {hotel.facilities.unitsReady && (
                        <div className="flex flex-col items-left">
                            <div className="bg-pink-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={unit} alt="Unit Ready" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.unitsReady}</span> unit ready</span>
                        </div>
                    )}
                    {hotel.facilities.refrigerator && (
                        <div className="flex flex-col items-left">
                            <div className="bg-indigo-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={fridge} alt="Refrigerator" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.refrigerator}</span> refrigerator</span>
                        </div>
                    )}
                    {hotel.facilities.television && (
                        <div className="flex flex-col items-left">
                            <div className="bg-blue-50 rounded-full p-2.5 w-fit mb-2.5">
                                <img src={tv} alt="Television" className="w-9 h-9" />
                            </div>
                            <span className="text-base text-gray-600"><span className="font-semibold text-[#1a237e]">{hotel.facilities.television}</span> television</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Details;