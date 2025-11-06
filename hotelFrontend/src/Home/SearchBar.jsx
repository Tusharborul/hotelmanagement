import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import person from "../assets/Logos/Vector.png";
import location from "../assets/Logos/add_location_alt.png";
import calendar from "../assets/Logos/Frame.png";
import arrowDown from "../assets/Logos/arrow-down.png";
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
        // Set default location if available
        if (uniqueLocations.length > 0) setLocationValue(uniqueLocations[0]);
      } catch (err) {
        setLocations([]);
      }
    }
    fetchLocations();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!date) newErrors.date = "Please select a date.";
    if (!persons) newErrors.persons = "Please select number of persons.";
    if (!locationValue) newErrors.location = "Please select a location.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const params = new URLSearchParams({ date: date || "", persons: String(persons), location: locationValue });
    navigate(`/hotels?${params.toString()}`);
  };

  return (
  <form onSubmit={onSearch} className="mt-10 mb-10 p-10 w-full bg-[#eaf0ff] rounded-[45px] flex flex-col lg:flex-row items-center justify-between shadow-sm py-4 lg:py-6">
      {/* Check Available (date) */}
      <div className="flex flex-col w-full lg:w-auto mb-3 lg:mb-0">
        <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <span className="mr-3">
            <img src={calendar} alt="Calendar" width={24} height={24} />
          </span>
          <input
            aria-label="Check Available Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent outline-none text-sm"
          />
        </div>
        {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
      </div>

      {/* Person */}
      <div className="flex flex-col w-full lg:w-auto mb-3 lg:mb-0">
        <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <span className="mr-3">
            <img src={person} alt="Person" width={24} height={24} />
          </span>
          <label htmlFor="persons" className="font-semibold text-black mr-3">Person</label>
          <select id="persons" value={persons} onChange={(e) => setPersons(Number(e.target.value))} className="text-sm bg-transparent outline-none">
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        {errors.persons && <div className="text-red-500 text-xs mt-1">{errors.persons}</div>}
      </div>

      {/* Select Location */}
      <div className="flex flex-col w-full lg:w-auto mb-3 lg:mb-0">
        <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <span className="mr-3">
            <img src={location} alt="Location" width={24} height={24} />
          </span>
          <select value={locationValue} onChange={(e) => setLocationValue(e.target.value)} className="text-sm bg-transparent outline-none">
            <option value="" disabled>Select location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        {errors.location && <div className="text-red-500 text-xs mt-1">{errors.location}</div>}
      </div>

      {/* Search Button */}
      <button type="submit" className="bg-[#3256e2] text-white font-semibold rounded-xl px-8 py-3 shadow-sm hover:bg-blue-700 transition w-full lg:w-auto">
        Search
      </button>
    </form>
  );
};

export default SearchBar;