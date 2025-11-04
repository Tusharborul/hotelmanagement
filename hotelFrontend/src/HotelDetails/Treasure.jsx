import React from "react";
import pic1 from "../assets/treasure/pic.png";
import pic2 from "../assets/treasure/pic (1).png";
import pic3 from "../assets/treasure/pic (2).png";
import pic4 from "../assets/treasure/pic (3).png";

const treasures = [
    {
        image: pic1,
        title: "Green Lake",
        subtitle: "Nature",
        popular: false
    },
    {
        image: pic2,
        title: "Dog Clubs",
        subtitle: "Pool",
        popular: false
    },
    {
        image: pic3,
        title: "Labour and Wait",
        subtitle: "Shopping",
        popular: true
    },
    {
        image: pic4,
        title: "Snorkeling",
        subtitle: "Beach",
        popular: false
    }
];

const Treasure = () => {
    return (
        <div className=" mb-6 mt-20 ">
            <h2 className="text-[20px] font-medium text-[#1a237e] mb-8">Treasure to Choose</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 place-items-center lg:place-items-start">
                {treasures.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center lg:items-start">
                        <div className="relative">
                            <img src={item.image} alt={item.title} className="rounded-2xl object-cover w-[263px] h-[180px]" />
                            {item.popular && (
                                <div className="absolute top-0 right-0 bg-[#3256e2] text-white px-6 py-2 rounded-tl-2xl rounded-br-2xl text-lg font-semibold shadow-md flex items-center" style={{ minWidth: '170px', justifyContent: 'center' }}>
                                    <span className="font-bold">Popular</span> <span className="font-normal ml-2">Choice</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-[20px] font-semibold text-[#1a237e]">{item.title}</div>
                        <div className="text-[15px] text-gray-400">{item.subtitle}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Treasure;