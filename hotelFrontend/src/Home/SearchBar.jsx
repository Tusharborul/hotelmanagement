import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import person from "../assets/Logos/Vector.png";
import location from "../assets/Logos/add_location_alt.png";
import calendar from "../assets/Logos/Frame.png";
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import { hotelService } from '../services/hotelService';
import getImageUrl from '../utils/getImageUrl';
import { formatINR } from '../utils/currency';
import { uniqueLocations, formatLocation } from '../utils/location';


const SearchBar = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [persons, setPersons] = useState(2);
  const [locationValue, setLocationValue] = useState("");
  const dateInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  React.useEffect(() => {
    fetchHotels();
  }, []);

  // Auto-filter whenever location changes
  React.useEffect(() => {
    filterHotels();
  }, [locationValue, hotels]);

  const filterHotels = () => {
    let filtered = [...hotels];

    // Filter by location if specified
    if (locationValue) {
      filtered = filtered.filter((hotel) =>
        hotel.location.toLowerCase().includes(locationValue.toLowerCase())
      );
    }

    setFilteredHotels(filtered);
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotels();
      const hotelsData = response.data || [];
      setHotels(hotelsData);
      setFilteredHotels(hotelsData);

      // Get unique locations with normalization and consistent display
      setLocations(uniqueLocations(hotelsData.map(h => h.location)).sort());
      setError("");
    } catch (err) {
      setError("Failed to load hotels. Please try again.");
      console.error("Error fetching hotels:", err);
      setLocations([]);
      setHotels([]);
      setFilteredHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    // All fields are optional now. Keep function for compatibility but always return true.
    return true;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Filtering now happens automatically via useEffect
    // This just prevents page reload on form submit
  };

  const onReset = (e) => {
    e?.preventDefault();
    // Reset date back to today
    setDate(new Date().toISOString().split('T')[0]);
    setPersons(2);
    setLocationValue("");
    setErrors({});
    setFilteredHotels(hotels); // Reset to show all hotels
  };

  // Fetch per-hotel availability for selected date (single-night) when date changes
  React.useEffect(() => {
    const fetchAvailabilityForHotels = async () => {
      if (!date) {
        setAvailabilityMap({});
        return;
      }
      // show loading state per-hotel immediately
      const initial = {};
      filteredHotels.forEach(h => { initial[h._id] = { loading: true }; });
      setAvailabilityMap(initial);

      const map = { ...initial };
      await Promise.all(
        filteredHotels.map(async (h) => {
          try {
            const res = await hotelService.checkAvailability(h._id, date, 1);
            if (res && res.success && res.data) {
              map[h._id] = res.data;
            } else {
              // mark as unavailable to indicate fetch finished without data
              map[h._id] = { error: true };
            }
          } catch (err) {
            console.error('Availability fetch error for', h._id, err?.message || err);
            map[h._id] = { error: true };
          }
        })
      );

      setAvailabilityMap(map);
    };

    fetchAvailabilityForHotels();
    // only when date or filteredHotels change
  }, [date, filteredHotels]);

  const handleHotelClick = (hotelId) => {
    navigate(`/hoteldetails?id=${hotelId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner label="Loading hotels..." />
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSearch} className=" mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Date */}
        <div>
          <label htmlFor="date" className="text-xs text-gray-500 mb-1 inline-block">Check Available</label>
            <div className="flex items-center bg-white rounded-xl px-3 py-2.5 shadow-inner border-2 border-blue-100 cursor-pointer" onClick={() => {
              const el = dateInputRef.current;
              if (!el) return;
              if (typeof el.showPicker === 'function') {
                try { el.showPicker(); return; } catch (e) { /* fallthrough */ }
              }
              try { el.click(); return; } catch (e) { /* fallthrough */ }
              el.focus();
            }}>
              <img src={calendar} alt="Calendar" width={20} height={20} className="mr-3 shrink-0" />
              <input
                id="date"
                name="date"
                aria-label="Check Available Date"
                type="date"
                ref={dateInputRef}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full cursor-pointer"
              />
            </div>
          {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
        </div>

        {/* Persons */}
        <div>
          <label htmlFor="persons" className="text-xs text-gray-500 mb-1 inline-block">Persons</label>
          <div>
            <Select
              id="persons"
              name="persons"
              value={persons}
              onChange={(v) => setPersons(Number(v))}
              options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]}
              placeholder={null}
              icon={person}
              iconAlt="Person"
            />
          </div>
          {errors.persons && <div className="text-red-500 text-xs mt-1">{errors.persons}</div>}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="locationValue" className="text-xs text-gray-500 mb-1 inline-block">Location</label>
          <div>
            <Select
              id="locationValue"
              name="locationValue"
              value={locationValue}
              onChange={(v) => setLocationValue(v)}
              options={[{ value: '', label: 'All locations' }, ...(locations || []).map((loc) => ({ value: loc, label: loc }))]}
              placeholder={null}
              icon={location}
              iconAlt="Location"
            />
          </div>
          {errors.location && <div className="text-red-500 text-xs mt-1">{errors.location}</div>}
        </div>

        {/* Actions: Reset + Search */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="bg-white border-2 border-blue-100 text-gray-600 rounded-xl px-3 py-2.5 shadow-inner hover:bg-gray-50 transition flex items-center justify-center"
            title="Reset"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>

          {/* <button type="submit" className="bg-[#6f46ff] text-white font-semibold rounded-lg px-8 py-2.5 shadow-md hover:bg-[#5935d6] transition-all">
            Search
          </button> */}
        </div>
      </div>
    </form>

    {/* Error Message */}
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {error}
      </div>
    )}

    {/* Hotels Grid */}
    {filteredHotels.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 mb-4">
          No hotels found for your search criteria
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredHotels.map((hotel) => (
          <div
            key={hotel._id}
            onClick={() => handleHotelClick(hotel._id)}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
          >
            {/* Hotel Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={getImageUrl(hotel.mainImage)}
                alt={hotel.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
              {hotel.isPopularChoice && (
                <div className="absolute top-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Popular Choice
                </div>
              )}
              {/* Availability pill overlay (top-right) */}
              <div className="absolute top-3 right-3">
                {(() => {
                  const val = availabilityMap[hotel._id];
                  if (!val) {
                    return null;
                  }
                  if (val.loading) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700 shadow">
                        <svg className="w-3 h-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      </span>
                    );
                  }
                  if (val.error) {
                    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 shadow">N/A</span>;
                  }
                  if (val.dailyCapacity === 0 || val.remaining === null) {
                    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 shadow" title="Available" aria-label="Available">Available</span>;
                  }
                  if (val.available) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 shadow" title={`${val.remaining} rooms available`} aria-label={`${val.remaining} rooms available`}>
                        {val.remaining} rooms available
                      </span>
                    );
                  }
                  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 shadow">Full</span>;
                })()}
              </div>
            </div>

            {/* Hotel Info */}
            <div className="p-4">
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
                {formatLocation(hotel.location)}
              </p>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatINR(hotel.price)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">
                    per night
                  </span>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
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
    </>
  );
};

export default SearchBar;