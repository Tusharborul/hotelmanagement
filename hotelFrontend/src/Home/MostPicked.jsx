import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import location1 from "../assets/location/pic-1.png"

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
            price: `$${hotel.price} per night`,
            image: hotel.mainImage ? `http://localhost:5000/uploads/${hotel.mainImage}` : location1
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
    return <div className="mt-12 mb-12 text-center">Loading hotels...</div>;
  }

  if (!places || places.length === 0) {
    return <div className="mt-12 mb-12 text-center">No hotels available at the moment.</div>;
  }

  return (
  <div className="mt-12 mb-12">
    <h2 className="text-2xl font-semibold text-[#1a237e] mb-6">Most Picked</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* First item: spans 2 rows */}
      <div 
        className="relative rounded-2xl overflow-hidden shadow-md lg:row-span-2 cursor-pointer hover:shadow-lg transition"
        onClick={() => handleHotelClick(places[0]?.id)}
      >
        <img src={places[0]?.image} alt={places[0]?.name} className="w-full h-full object-cover min-h-[220px] lg:min-h-[360px]" />
        <div className="absolute top-0 right-0 bg-[#3256e2] text-white px-4 py-2 rounded-bl-2xl font-semibold">
          {places[0]?.price}
        </div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <div className="text-lg font-semibold">{places[0]?.name}</div>
          <div className="text-sm">{places[0]?.location}</div>
        </div>
      </div>
      {/* Remaining 4 items */}
      {places.slice(1).map((place, idx) => (
        <div 
          key={place?.id || idx} 
          className="relative rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition"
          onClick={() => handleHotelClick(place?.id)}
        >
    <img src={place?.image} alt={place?.name} className="w-full h-full object-cover min-h-[170px]" />
          <div className="absolute top-0 right-0 bg-[#3256e2] text-white px-4 py-2 rounded-bl-2xl font-semibold">
            {place?.price}
          </div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <div className="text-lg font-semibold">{place?.name}</div>
            <div className="text-sm">{place?.location}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

export default MostPicked;