import React, { useEffect, useRef, useState } from "react";
import pic1 from "../assets/Home/Rectangle 5.png";
import pic2 from "../assets/Home/bedroom.png";
import pic3 from "../assets/Home/washroom.png";
import getImageUrl from '../utils/getImageUrl';

const Photos = ({ hotel }) => {
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
            <div className="mb-6 mt-20">
                <div className="text-gray-400 text-xl mb-2">
                    <span>Home</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#1a237e] font-semibold">Hotel Details</span>
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl md:text-[36px] font-bold text-[#1a237e] mb-2 text-center">{hotel.name}</h1>
                    <div className="text-[14px] md:text-[18px] text-gray-400 text-center">{hotel.location}</div>
                </div>
            </div>

            {/* Carousel container */}
            <div className="w-full max-w-[1150px] mx-auto bg-white rounded-[15px] shadow-sm overflow-hidden">
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
                            <div key={i} className="flex-shrink-0 w-full h-64 md:h-96 lg:h-[520px] overflow-hidden">
                                <img src={src} alt={`${hotel.name} ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Prev / Next */}
                    <button onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m15 18-6-6 6-6"></path></svg>
                    </button>
                    <button onClick={next} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m9 18 6-6-6-6"></path></svg>
                    </button>

                    {/* Pagination dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {imgs.map((_, i) => (
                            <button key={i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i === index ? 'bg-blue-600' : 'bg-white border border-gray-300'}`} aria-label={`Go to ${i + 1}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Photos;