import React from "react";
import location1 from "../assets/location/pic-1.png"
import location2 from "../assets/location/pic-2.png"
import location3 from "../assets/location/pic-3.png"
import location4 from "../assets/location/pic-4.png"
import location5 from "../assets/location/pic-5.png"    

const places = [
  {
    name: "Blue Origin Fams",
    location: "Galle, Sri Lanka",
    price: "$50 per night",
    image: location1,
  },
  {
    name: "Ocean Land",
    location: "Trincomalee, Sri Lanka",
    price: "$22 per night",
    image: location2,
  },
  {
    name: "Stark House",
    location: "Dehiwala, Sri Lanka",
    price: "$856 per night",
    image: location3,
  },
  {
    name: "Vinna Vill",
    location: "Beruwala, Sri Lanka",
    price: "$62 per night",
    image: location4,
  },
  {
    name: "Bobox",
    location: "Kandy, Sri Lanka",
    price: "$72 per night",
    image: location5,
  },
];

const MostPicked = () => (
  <div className="mt-12 mb-12">
    <h2 className="text-2xl font-semibold text-[#1a237e] mb-6">Most Picked</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* First item: spans 2 rows */}
      <div className="relative rounded-2xl overflow-hidden shadow-md lg:row-span-2">
        <img src={places[0].image} alt={places[0].name} className="w-full h-full object-cover min-h-[220px] lg:min-h-[360px]" />
        <div className="absolute top-0 right-0 bg-[#3256e2] text-white px-4 py-2 rounded-bl-2xl font-semibold">
          {places[0].price}
        </div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <div className="text-lg font-semibold">{places[0].name}</div>
          <div className="text-sm">{places[0].location}</div>
        </div>
      </div>
      {/* Remaining 4 items */}
      {places.slice(1).map((place, idx) => (
        <div key={idx} className="relative rounded-2xl overflow-hidden shadow-md">
    <img src={place.image} alt={place.name} className="w-full h-full object-cover min-h-[170px]" />
          <div className="absolute top-0 right-0 bg-[#3256e2] text-white px-4 py-2 rounded-bl-2xl font-semibold">
            {place.price}
          </div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <div className="text-lg font-semibold">{place.name}</div>
            <div className="text-sm">{place.location}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MostPicked;