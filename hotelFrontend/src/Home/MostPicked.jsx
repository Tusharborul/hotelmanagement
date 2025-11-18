import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import location1 from "../assets/location/pic-1.png"
import getImageUrl from '../utils/getImageUrl';
import { formatINR } from '../utils/currency';

const MostPicked = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await hotelService.getHotels({ mostPicked: true });
        if (response.data && response.data.length > 0) {
          const hotels = response.data.slice(0, 5).map(hotel => ({
            id: hotel._id,
            name: hotel.name,
            location: hotel.location,
            price: `${formatINR(hotel.price)} per night`,
            image: hotel.mainImage ? getImageUrl(hotel.mainImage, location1) : location1
          }));
          setPlaces(hotels);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const handleHotelClick = (hotelId) => {
    if (hotelId) {
      navigate(`/hoteldetails?id=${hotelId}`);
    }
  };

  if (loading) {
    return <div className="mt-12 mb-12 text-center text-lg font-medium bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">Loading hotels...</div>;
  }

  if (!places || places.length === 0) {
    return <div className="mt-12 mb-12 text-center text-lg text-gray-500">No hotels available at the moment.</div>;
  }

  return (
  <div className="mt-16 mb-16">
    <h2 className="text-3xl font-bold bg-linear-to-r from-[#1a237e] to-[#3252DF] bg-clip-text text-transparent mb-8">Most Picked</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* First item: spans 2 rows */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-lg lg:row-span-2 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-500 group"
        onClick={() => handleHotelClick(places[0]?.id)}
      >
        <img src={places[0]?.image} alt={places[0]?.name} className="w-full h-full object-cover min-h-[220px] lg:min-h-[360px] group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 bg-linear-to-br from-[#3256e2] to-[#5b7cff] text-white px-5 py-3 rounded-bl-3xl font-semibold shadow-lg">
          {places[0]?.price}
        </div>
        <div className="absolute bottom-0 left-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
          <div className="text-xl font-bold mb-1">{places[0]?.name}</div>
          <div className="text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {places[0]?.location}
          </div>
        </div>
      </div>
      {/* Remaining 4 items */}
      {places.slice(1).map((place, idx) => (
        <div 
          key={place?.id || idx} 
          className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-500 group"
          onClick={() => handleHotelClick(place?.id)}
        >
          <img src={place?.image} alt={place?.name} className="w-full h-full object-cover min-h-[170px] group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 bg-linear-to-br from-[#3256e2] to-[#5b7cff] text-white px-5 py-3 rounded-bl-3xl font-semibold shadow-lg">
            {place?.price}
          </div>
          <div className="absolute bottom-0 left-0 p-5 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
            <div className="text-lg font-bold mb-1">{place?.name}</div>
            <div className="text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {place?.location}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

export default MostPicked;