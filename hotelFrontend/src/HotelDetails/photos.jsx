import React from "react";  
import pic1 from "../assets/Home/Rectangle 5.png";
import pic2 from "../assets/Home/bedroom.png";
import pic3 from "../assets/Home/washroom.png";

const Photos = ({ hotel }) => {
    if (!hotel) {
        return null;
    }

    // Handle image URLs - check if they start with http (external) or need localhost prefix
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return pic1;
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/uploads/${imageUrl}`;
    };

    const mainImage = hotel.mainImage ? getImageUrl(hotel.mainImage) : pic1;
    const image2 = hotel.images && hotel.images[0] ? getImageUrl(hotel.images[0]) : pic2;
    const image3 = hotel.images && hotel.images[1] ? getImageUrl(hotel.images[1]) : pic3;

    return (
        <div className="w-full flex flex-col ">
            {/* Breadcrumb and Title Section */}
            <div className=" mb-6 mt-20 ">
                <div className=" text-gray-400 text-xl mb-2">
                    <span >Home</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#1a237e] font-semibold">Hotel Details</span>
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-[36px] font-bold text-[#1a237e] mb-2 text-center">{hotel.name}</h1>
                    <div className="text-[18px] text-gray-400 text-center">{hotel.location}</div>
                </div>
            </div>
            {/* Photos Section */}
            <div className="grid gap-14 bg-white rounded-[15px]  w-full max-w-[1150px] mx-auto grid-cols-1 lg:grid-cols-[643px_487px]">
                <div className="col-span-1 lg:row-span-2">
                    <img src={mainImage} alt={hotel.name} className="object-cover rounded-2xl w-full" style={{ height: '500px' }} />
                </div>
                <div className="flex flex-col gap-3">
                    <img src={image2} alt="Hotel view 1" className="object-cover rounded-2xl w-full" style={{ height: '245px' }} />
                    <img src={image3} alt="Hotel view 2" className="object-cover rounded-2xl w-full" style={{ height: '245px' }} />
                </div>
            </div>
        </div>
    );
};

export default Photos;              