import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import person from "../assets/Logos/Vector.png";
import location from "../assets/Logos/add_location_alt.png";
import calendar from "../assets/Logos/Frame.png";
import arrowDown from "../assets/Logos/arrow-down.png";


const SearchBar = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [persons, setPersons] = useState(2);
  const [locationValue, setLocationValue] = useState("Galle");

  const locations = ["Galle", "Colombo", "Kandy", "Trincomalee"];

  const onSearch = (e) => {
    e.preventDefault();
    // navigate to /hotels with query params (you can change the route as needed)
    const params = new URLSearchParams({ date: date || "", persons: String(persons), location: locationValue });
    navigate(`/hotels?${params.toString()}`);
  };

  return (
  <form onSubmit={onSearch} className="mt-40 p-10 w-full bg-[#eaf0ff] rounded-[45px] flex flex-col lg:flex-row items-center justify-between shadow-sm py-4 lg:py-6">
      {/* Check Available (date) */}
      <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm w-full lg:w-auto mb-3 lg:mb-0">
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

      {/* Person */}
      <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm w-full lg:w-auto mb-3 lg:mb-0">
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

      {/* Select Location */}
      <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm w-full lg:w-auto mb-3 lg:mb-0">
        <span className="mr-3">
          <img src={location} alt="Location" width={24} height={24} />
        </span>
        <select value={locationValue} onChange={(e) => setLocationValue(e.target.value)} className="text-sm bg-transparent outline-none">
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Search Button */}
      <button type="submit" className="bg-[#3256e2] text-white font-semibold rounded-xl px-8 py-3 shadow-sm hover:bg-blue-700 transition w-full lg:w-auto">
        Search
      </button>
    </form>
  );
};

export default SearchBar;