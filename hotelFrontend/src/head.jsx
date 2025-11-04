import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Disable body scroll when menu is open
  React.useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-8 w-full  relative h-20 flex items-center justify-between">
      {/* Added max width, center, padding, and full width */}
      
        
        {/* Logo */}
        <div className="text-[22px] sm:text-[26px] font-medium flex items-center">
          <span className="text-blue-600 font-medium">Lanka</span>
          <span className="text-gray-900 font-medium ml-1">Stay.</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center justify-start gap-10">
          <nav className="flex gap-4 sm:gap-6 lg:gap-8 font-[Poppins]">
            <a href="home" className="text-[#3252DF] text-[16px]">Home</a>
            <a href="hoteldetails" className="text-[#152C5B] hover:text-[#3252DF] transition">Hotels</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">Rooms</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">About</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">Contact</a>
          </nav>
          <button
            className="bg-blue-600 text-white font-semibold rounded-lg px-8 py-2 shadow-lg hover:bg-blue-700 transition focus:outline-none"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>

        {/* Hamburger Icon (Mobile) */}
        <div className="flex items-center lg:hidden">
          <button
            className="text-blue-600 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 w-full h-full bg-white shadow-lg z-50 flex flex-col items-center py-6 px-6 lg:hidden overflow-hidden">
            {/* Logo at top */}
            <div className="w-full flex items-center justify-between mb-8">
              <div className="text-[22px] sm:text-[26px] font-medium flex items-center">
                <span className="text-blue-600 font-medium">Lanka</span>
                <span className="text-gray-900 font-medium ml-1">Stay.</span>
              </div>
              {/* Close button */}
              <button
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-5 font-[Poppins] items-center mt-10">
              <a href="home" className="text-[#3252DF] text-[18px]" onClick={() => setMenuOpen(false)}>Home</a>
              <a href="hoteldetails" className="text-[#152C5B] hover:text-[#3252DF] transition" onClick={() => setMenuOpen(false)}>Hotels</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition" onClick={() => setMenuOpen(false)}>Rooms</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition" onClick={() => setMenuOpen(false)}>Contact</a>
            </nav>
            <button
              className="bg-blue-600 text-white font-semibold rounded-lg px-8 py-2 mt-10 shadow-lg hover:bg-blue-700 transition focus:outline-none"
              onClick={() => {
                setMenuOpen(false);
                navigate("/login");
              }}
            >
              Login
            </button>
          </div>
        )}
      </div>
   
    
     </header>
  );
};

export default Header;
