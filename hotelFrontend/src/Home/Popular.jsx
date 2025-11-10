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
		return <div className="mt-12 mb-12 text-center">Loading popular hotels...</div>;
	}

	if (!places || places.length === 0) {
		return <div className="mt-12 mb-12 text-center">No popular hotels available at the moment.</div>;
	}

	return (
	<div className="mt-12 mb-12">
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
			{places.map((place, idx) => (
				<div key={place.id || idx} className="flex flex-col items-start">
					<div 
						className="relative w-full rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition"
						onClick={() => handleHotelClick(place.id)}
					>
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
};

export default Popular;
