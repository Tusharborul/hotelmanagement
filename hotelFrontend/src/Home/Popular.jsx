import React from "react";
import shangriLa from "../assets/location/Shangri-La.png";
import topView from "../assets/location/Top View.png";
import greenVilla from "../assets/location/Green Villa.png";
import woddenPit from "../assets/location/Wodden Pit.png";
import boutiqe from "../assets/location/Boutiqe.png";
import modern from "../assets/location/Modern.png";
import silverRain from "../assets/location/Silver Rain.png";
import cashville from "../assets/location/Cashville.png";


const places = [
	{
		name: "Shangri-La",
		location: "Colombo, Sri Lanka",
		image: shangriLa,
		popular: true,
	},
	{
		name: "Top View",
		location: "Hikkaduwe, Sri Lanka",
		image: topView,
		popular: false,
	},
	{
		name: "Green Villa",
		location: "Kandy, Sri Lanka",
		image: greenVilla,
		popular: false,
	},
	{
		name: "Wodden Pit",
		location: "Ambalangode, Sri Lanka",
		image: woddenPit,
		popular: false,
	},
	{
		name: "Boutiqe",
		location: "Kandy, Sri Lanka",
		image: boutiqe,
		popular: false,
	},
	{
		name: "Modern",
		location: "Nuwereilya, Sri Lanka",
		image: modern,
		popular: false,
	},
	{
		name: "Silver Rain",
		location: "Dehiwala, Sri Lanka",
		image: silverRain,
		popular: false,
	},
	{
		name: "Cashville",
		location: "Ampara, Sri Lanka",
		image: cashville,
		popular: true,
	},
];

const Popular = () => (
	<div className="mt-12 mb-12">
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
			{places.map((place, idx) => (
				<div key={idx} className="flex flex-col items-start">
					<div className="relative w-full rounded-2xl overflow-hidden shadow-md">
						<img src={place.image} alt={place.name} className="w-full h-[170px] object-cover" />
						{place.popular && (
							<div className="absolute top-0 left-0 bg-[#3256e2] text-white px-4 py-2 rounded-br-2xl font-semibold text-sm">
								Popular Choice
							</div>
						)}
                        
					</div>
					<div className="mt-4 ml-1">
						<div className="text-lg font-semibold text-[#1a237e]">{place.name}</div>
						<div className="text-sm text-[#90a4ae]">{place.location}</div>
					</div>
				</div>
			))}
		</div>
	</div>
);

export default Popular;
