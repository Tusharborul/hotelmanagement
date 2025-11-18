import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import Header from "../head";
import SearchBar from "./SearchBar";
import getImageUrl from '../utils/getImageUrl';
import { formatINR } from '../utils/currency';

const Hotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    date: "",
    persons: 2,
    location: ""
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    filterHotels();
  }, [hotels, filters]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotels();
      setHotels(response.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load hotels. Please try again.");
      console.error("Error fetching hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterHotels = () => {
    let filtered = [...hotels];

    // Filter by location if specified
    if (filters.location) {
      filtered = filtered.filter((hotel) =>
        hotel.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // You can add more filters here (date, persons, etc.)

    setFilteredHotels(filtered);
  };

  const handleSearchFilter = (searchFilters) => {
    setFilters(searchFilters);
  };

  // use shared helper

  const handleHotelClick = (hotelId) => {
    navigate(`/hoteldetails?id=${hotelId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-white via-blue-50/30 to-white">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl font-medium bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">Loading hotels...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-blue-50/30 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SearchBar with filter callback */}
        <SearchBar onSearch={handleSearchFilter} />

        {/* Search Info */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Available Hotels
          </h1>
          <div className="text-gray-600">
            {filters.location && <span className="font-medium">Location: {filters.location}</span>}
            {filters.date && <span className="ml-4">Check-in: {filters.date}</span>}
            {filters.persons && <span className="ml-4">Persons: {filters.persons}</span>}
          </div>
          <p className="text-gray-500 mt-2">
            Found {filteredHotels.length} hotel{filteredHotels.length !== 1 ? "s" : ""}
          </p>
        </div> */}

        {/* Error Message */}
        {error && (
          <div className="bg-linear-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-md">
            <div className="font-semibold">{error}</div>
          </div>
        )}

        {/* Hotels Grid */}
        {filteredHotels.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏨</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              No hotels found for your search criteria
            </p>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={() => navigate("/home")}
              className="bg-[#3256e2] text-white px-6 py-2.5 rounded-lg hover:bg-[#2545c8] transition-colors font-medium"
            >
              ← Back to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel._id}
                onClick={() => handleHotelClick(hotel._id)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer border border-gray-100"
              >
                {/* Hotel Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={getImageUrl(hotel.mainImage)}
                    alt={hotel.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  {hotel.isPopularChoice && (
                    <div className="absolute top-3 left-3 bg-[#ff385c] text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      ⭐ Popular Choice
                    </div>
                  )}
                </div>

                {/* Hotel Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {hotel.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {hotel.location}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-[#3256e2]">
                        {formatINR(hotel.price)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1.5">
                        per night
                      </span>
                    </div>
                    <button className="bg-[#3256e2] text-white px-4 py-2 rounded-lg hover:bg-[#2545c8] transition-colors text-sm font-semibold">
                      View Details
                    </button>
                  </div>

                  {/* Facilities */}
                  {hotel.facilities && hotel.facilities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {hotel.facilities.slice(0, 3).map((facility, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {facility}
                          </span>
                        ))}
                        {hotel.facilities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{hotel.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/home")}
            className="text-[#3256e2] hover:text-[#2545c8] font-semibold text-base"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hotels;
