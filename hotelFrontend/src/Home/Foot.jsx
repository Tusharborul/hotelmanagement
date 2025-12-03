import React from "react";
import { useNavigate } from "react-router-dom";

const Foot = () => {
	const navigate = useNavigate();
	return (
		<footer className="bg-linear-to-br from-gray-50 to-blue-50 pt-12 border-t border-gray-200">
			<div className="max-w-7xl mx-auto px-8 w-full flex flex-col md:flex-row justify-between items-start gap-8 pb-16">
				<div className="flex-1">
					<h2 className="text-3xl font-bold mb-3">
						<span className="bg-linear-to-r from-[#3256e2] to-[#5b7cff] bg-clip-text text-transparent">India</span>
						<span className="text-[#1a237e]">Stay.</span>
					</h2>
					<p className="mt-3 text-gray-600 max-w-xs leading-relaxed">We kaboom your beauty holiday instantly and memorable.</p>
				</div>
				<div className="flex flex-col items-start md:items-end gap-4">
					<h3 className="text-lg font-semibold text-[#1a237e] mb-2">Become Hotel Owner</h3>
					<button className="bg-linear-to-r from-[#3256e2] to-[#5b7cff] text-white px-8 py-3 text-[14px] font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate("/registerhotel")}>Register Now</button>
				</div>
			</div>
			<div className="bg-linear-to-r from-[#3256e2] to-[#5b7cff] text-white text-center py-4 text-sm">
				Copyright 2024 • All rights reserved • Salman Faris
			</div>
		</footer>
	);
};

export default Foot;
