import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import location1 from "../assets/location/pic-1.png";
import getImageUrl from '../utils/getImageUrl';

const Popular = () => {
	const [places, setPlaces] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchHotels = async () => {
			try {
				const response = await hotelService.getHotels({ popular: true });
				if (response.data && response.data.length > 0) {
					const popularHotels = response.data.slice(0, 8).map(hotel => ({
						id: hotel._id,
						name: hotel.name,
						location: hotel.location,
						image: hotel.mainImage ? getImageUrl(hotel.mainImage, location1) : location1,
						popular: hotel.isPopular
					}));
					setPlaces(popularHotels);
				}
			} catch (error) {
				console.error('Error fetching popular hotels:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchHotels();
	}, []);

	const handleHotelClick = (hotelId) => {
		if (hotelId) {
			navigate(`/hoteldetails?id=${hotelId}`);
		}
	};

	if (loading) {
		return <div className="mt-12 mb-12 text-center text-lg font-medium bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">Loading popular hotels...</div>;
	}

	if (!places || places.length === 0) {
		return <div className="mt-12 mb-12 text-center text-lg text-gray-500">No popular hotels available at the moment.</div>;
	}

	return (
	<div className="mt-16 mb-20">
		<h2 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">Popular Hotels</h2>
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
			{places.map((place, idx) => (
				<div key={place.id || idx} className="flex flex-col items-start group cursor-pointer">
					<div 
						className="relative w-full rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
						onClick={() => handleHotelClick(place.id)}
					>
						<img src={place.image} alt={place.name} className="w-full h-[170px] object-cover group-hover:scale-110 transition-transform duration-700" />
						<div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						{place.popular && (
							<div className="absolute top-0 left-0 bg-linear-to-r from-[#3256e2] to-[#5b7cff] text-white px-4 py-2 rounded-br-3xl font-semibold text-sm shadow-lg animate-pulse">
								⭐ Popular Choice
							</div>
						)}
					</div>
					<div className="mt-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-300">
						<div className="text-lg font-semibold text-[#1a237e] group-hover:text-[#3252DF] transition-colors duration-300">{place.name}</div>
						<div className="text-sm text-[#90a4ae] flex items-center gap-2 mt-1">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
							</svg>
							{place.location}
						</div>
					</div>
				</div>
			))}
		</div>
	</div>
	);
};

export default Popular;
