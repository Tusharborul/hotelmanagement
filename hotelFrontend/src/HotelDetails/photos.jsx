import { formatLocation } from "../utils/location";
import React, { useEffect, useRef, useState } from "react";
import pic1 from "../assets/Home/Rectangle 5.png";
import pic2 from "../assets/Home/bedroom.png";
import pic3 from "../assets/Home/washroom.png";
import getImageUrl from '../utils/getImageUrl';
import Breadcrumb from '../Dashboard/components/Breadcrumb';

const Photos = ({ hotel, inModal = false }) => {
    if (!hotel) return null;

    // Compose images list with fallbacks
    const imgs = [];
    imgs.push(hotel.mainImage ? getImageUrl(hotel.mainImage, pic1) : pic1);
    if (hotel.images && hotel.images.length) {
        hotel.images.forEach((it, i) => imgs.push(getImageUrl(it, i === 0 ? pic2 : i === 1 ? pic3 : pic1)));
    } else {
        imgs.push(pic2, pic3);
    }

    const total = imgs.length;
    const [index, setIndex] = useState(0);
    const autoplay = true;
    const intervalRef = useRef(null);
    const isHover = useRef(false);
    const touchStartX = useRef(null);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') setIndex((s) => (s - 1 + total) % total);
            if (e.key === 'ArrowRight') setIndex((s) => (s + 1) % total);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [total]);

    useEffect(() => {
        if (!autoplay) return;
        intervalRef.current = setInterval(() => {
            if (!isHover.current) setIndex((s) => (s + 1) % total);
        }, 5000);
        return () => clearInterval(intervalRef.current);
    }, [total]);

    const prev = () => setIndex((s) => (s - 1 + total) % total);
    const next = () => setIndex((s) => (s + 1) % total);

    const onTouchStart = (e) => {
        touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    };
    const onTouchEnd = (e) => {
        if (touchStartX.current == null) return;
        const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const dx = endX - touchStartX.current;
        if (dx > 40) prev();
        else if (dx < -40) next();
        touchStartX.current = null;
    };

    return (
        <div className="w-full flex flex-col">
            {/* Breadcrumb and Title */}
                        <div className="mb-8 mt-8">
                                {!inModal && (
                                    <div className="text-gray-500 text-base mb-6">
                                        {/* Use shared Breadcrumb component for consistency */}
                                        <Breadcrumb showHome />
                                    </div>
                                )}
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl md:text-[42px] font-bold text-[#1a237e] mb-3 text-center">{hotel.name}</h1>
                    <div className="text-[16px] md:text-[18px] text-gray-600 text-center flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#3256e2]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {formatLocation(hotel.location)}
                    </div>
                </div>
            </div>

            {/* Carousel container */}
            <div className="w-full max-w-[1150px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-100">
                <div
                    className="relative"
                    onMouseEnter={() => (isHover.current = true)}
                    onMouseLeave={() => (isHover.current = false)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Slides */}
                    <div className="flex transition-transform duration-700" style={{ transform: `translateX(-${index * 100}%)` }}>
                        {imgs.map((src, i) => (
                            <div key={i} className="shrink-0 w-full h-64 md:h-96 lg:h-[520px] overflow-hidden">
                                <img src={src} alt={`${hotel.name} ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Prev / Next */}
                    <button onClick={prev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl focus:outline-none transition-all duration-300 hover:scale-110 border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m15 18-6-6 6-6"></path></svg>
                    </button>
                    <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-lg hover:shadow-xl focus:outline-none transition-all duration-300 hover:scale-110 border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m9 18 6-6-6-6"></path></svg>
                    </button>

                    {/* Pagination dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                        {imgs.map((_, i) => (
                            <button key={i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? 'bg-white w-8' : 'bg-white/60 hover:bg-white/80'}`} aria-label={`Go to ${i + 1}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Photos;