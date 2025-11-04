import React from "react";
import Head from "../head.jsx";
import Foot from "./Foot.jsx"
import StartNewVacation from "./StartNewVacation.jsx";
import SearchBar from "./SearchBar.jsx";
import MostPicked from "./MostPicked.jsx";
import Popular from "./Popular.jsx";
const HomePage = () => {
    return (
        <>
            <Head />
            <div className="max-w-7xl mx-auto px-8 w-full">
                
                <StartNewVacation />
                <SearchBar />
                <MostPicked />
                <Popular />
            </div>
            <Foot />
        </>
    )


}
export default HomePage;