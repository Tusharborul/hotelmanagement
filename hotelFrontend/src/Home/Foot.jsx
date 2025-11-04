import React from "react";
import { useNavigate } from "react-router-dom";

const Foot = () => {
	const navigate = useNavigate();
	return (
		<footer className="bg-white pt-8 border-t border-gray-200">
			<div className="max-w-7xl mx-auto px-8 w-full   flex justify-between items-start pb-16">
				<div>
					<h2 className="text-2xl font-bold text-[#3256e2] inline">Lanka<span className="text-[#1a237e]">Stay.</span></h2>
					<p className="mt-3 text-[#b0b7c3] max-w-xs">We kaboom your beauty holiday instantly and memorable.</p>
				</div>
				<div className="flex flex-col ">
					<h3 className="text-lg font-semibold text-[#1a237e] mb-2">Become hotel Owner</h3>
					<button className="bg-[#3256e2] text-white w-36 h-8 text-[14px] font-medium rounded-md shadow hover:bg-blue-700 transition" onClick={() => navigate("/registerhotel")}>Register Now</button>
				</div>
			</div>
			<div className="bg-[#3256e2] text-white text-center py-2 text-sm">
				Copyright 2024 • All rights reserved • Salman Faris
			</div>
		</footer>
	);
};

export default Foot;
