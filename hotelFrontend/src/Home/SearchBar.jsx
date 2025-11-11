import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import person from "../assets/Logos/Vector.png";
import location from "../assets/Logos/add_location_alt.png";
import calendar from "../assets/Logos/Frame.png";
import { hotelService } from '../services/hotelService';


const SearchBar = () => {

  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [persons, setPersons] = useState(2);
  const [locationValue, setLocationValue] = useState("");
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);

  React.useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await hotelService.getHotels();
        const hotels = response.data || [];
        // Get unique locations
        const uniqueLocations = Array.from(new Set(hotels.map(hotel => hotel.location).filter(Boolean)));
        setLocations(uniqueLocations);
      } catch (err) {
        setLocations([]);
      }
    }
    fetchLocations();
  }, []);

  const validate = () => {
    // All fields are optional now. Keep function for compatibility but always return true.
    return true;
  };

  const onSearch = (e) => {
    e.preventDefault();
    // validation removed - all fields optional
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (persons) params.append('persons', String(persons));
    if (locationValue) params.append('location', locationValue);
    const qs = params.toString();
    navigate(qs ? `/hotels?${qs}` : `/hotels`);
  };

  const onReset = (e) => {
    e?.preventDefault();
    setDate("");
    setPersons(2);
    setLocationValue("");
    setErrors({});
  };

  return (
    <form onSubmit={onSearch} className="mt-10 mb-10 p-6 w-full bg-[#f5f7ff] rounded-2xl shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Date */}
        <div>
          <label htmlFor="date" className="text-xs text-gray-500 mb-1 inline-block">Check Available</label>
          <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-inner border border-gray-100">
            <img src={calendar} alt="Calendar" width={20} height={20} className="mr-3" />
            <input
              id="date"
              name="date"
              aria-label="Check Available Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
        </div>

        {/* Persons */}
        <div>
          <label htmlFor="persons" className="text-xs text-gray-500 mb-1 inline-block">Persons</label>
          <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-inner border border-gray-100">
            <img src={person} alt="Person" width={20} height={20} className="mr-3" />
            <select
              id="persons"
              name="persons"
              value={persons}
              onChange={(e) => setPersons(Number(e.target.value))}
              className="text-sm bg-transparent outline-none w-full cursor-pointer"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          {errors.persons && <div className="text-red-500 text-xs mt-1">{errors.persons}</div>}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="locationValue" className="text-xs text-gray-500 mb-1 inline-block">Location</label>
          <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-inner border border-gray-100">
            <img src={location} alt="Location" width={20} height={20} className="mr-3" />
            <select
              id="locationValue"
              name="locationValue"
              value={locationValue}
              onChange={(e) => setLocationValue(e.target.value)}
              className="text-sm bg-transparent outline-none w-full cursor-pointer"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          {errors.location && <div className="text-red-500 text-xs mt-1">{errors.location}</div>}
        </div>

        {/* Actions: Reset + Search */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-lg px-3 py-2 hover:bg-gray-50"
            title="Reset"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4v5h.5A6.5 6.5 0 1010 3.5V3a7 7 0 11-6 3z" clipRule="evenodd" />
            </svg>
          </button>

          <button type="submit" className="ml-auto bg-[#6f46ff] text-white font-semibold rounded-lg px-6 py-2 shadow hover:brightness-95 transition">
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;