import React from "react";
import Head from "../head.jsx";
import Foot from "../Home/Foot.jsx";
import Photos from "./photos.jsx";
import Details from "./Details.jsx";
import Treasure from "./Treasure.jsx";


const HotelDetails = () => {
    return (
        <>
            <Head />
            <div className="max-w-7xl mx-auto px-8 w-full">
                <Photos />
                <Details />
                <Treasure />
            </div>
            <Foot />
        </>
    );
};

export default HotelDetails;