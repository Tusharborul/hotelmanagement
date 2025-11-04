import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Head from "../head.jsx";
import Foot from "../Home/Foot.jsx";
import Photos from "./photos.jsx";
import Details from "./Details.jsx";
import Treasure from "./Treasure.jsx";
import { hotelService } from "../services/hotelService";


const HotelDetails = () => {
    const [searchParams] = useSearchParams();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const hotelId = searchParams.get('id');

    useEffect(() => {
        const fetchHotelDetails = async () => {
            if (hotelId) {
                try {
                    const response = await hotelService.getHotel(hotelId);
                    setHotel(response.data);
                } catch (error) {
                    console.error('Error fetching hotel details:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchHotelDetails();
    }, [hotelId]);

    if (loading) {
        return (
            <>
                <Head />
                <div className="max-w-7xl mx-auto px-8 w-full py-12 text-center">
                    Loading hotel details...
                </div>
                <Foot />
            </>
        );
    }

    return (
        <>
            <Head />
            <div className="max-w-7xl mx-auto px-8 w-full">
                <Photos hotel={hotel} />
                <Details hotel={hotel} hotelId={hotelId} />
                <Treasure hotel={hotel} />
            </div>
            <Foot />
        </>
    );
};

export default HotelDetails;