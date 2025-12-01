import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hotelService } from "../../services/hotelService";
import Layout from "../components/Layout";
import Spinner from '../../components/Spinner';
import SearchBar from "../../Home/SearchBar";
import getImageUrl from '../../utils/getImageUrl';

const Hotels = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get search parameters
  const date = searchParams.get("date") || "";
  const persons = searchParams.get("persons") || "2";
  const location = searchParams.get("location") || "";

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    filterHotels();
  }, [hotels, location]);

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
    if (location) {
      filtered = filtered.filter((hotel) =>
        hotel.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    setFilteredHotels(filtered);
  };

  // use shared helper

  const handleHotelClick = (hotelId) => {
    navigate(`/hoteldetails?id=${hotelId}`);
  };

  if (loading) {
    return (
      <Layout role="user" title="Hello, User" subtitle="Hotels">
        <div className="flex items-center justify-center h-48 py-12">
          <div className="flex items-center justify-center w-full">
            <Spinner label="Loading hotels..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
 
  <Layout role="user" title="Hello, User" subtitle="Hotels">
       
      <SearchBar />
      </Layout>
  );
};

export default Hotels;
