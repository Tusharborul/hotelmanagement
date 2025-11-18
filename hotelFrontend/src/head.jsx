import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { authService } from "./services/authService";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());
  // store current user object so we can check role presence
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const navigate = useNavigate();
  const location = useLocation();

  const handleHotelsClick = (e) => {
    e.preventDefault();
    const lastViewedHotelId = localStorage.getItem('lastViewedHotelId');
    if (lastViewedHotelId) {
      navigate(`/hoteldetails?id=${lastViewedHotelId}`);
    } else {
      navigate('/home');
    }
  };

  const isActive = (name) => {
    const path = location.pathname || '';
    if (name === 'hotels') {
      return path.startsWith('/hotels') || path.includes('hoteldetails');
    }
    if (name === 'home') return path === '/' || path === '/home';
    return false;
  };

  const handleAuthClick = () => {
    if (isLoggedIn) {
      // Logout
      authService.logout();
      setIsLoggedIn(false);
      navigate('/home');
    } else {
      // Login
      navigate('/login');
    }
  };

  const goToDashboard = () => {
    const user = authService.getCurrentUser();
    if (!user) return navigate('/login');
    if (user.role === 'admin') return navigate('/dashboard/admin');
    if (user.role === 'hotelOwner') return navigate('/dashboard/owner');
    if (user.role === 'user') return navigate('/dashboard/hotels');
    return navigate('/dashboard');
  };

  // Check login status on component mount and when navigation changes
  React.useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
    };
    
    checkAuth();
    // Listen for storage changes (for cross-tab login/logout)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

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
        <div className="text-[22px] sm:text-[26px] font-bold flex items-center">
          <span className="bg-linear-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent font-bold">Lanka</span>
          <span className="text-gray-900 font-bold ml-1">Stay.</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center justify-start gap-10">
          <nav className="flex gap-4 sm:gap-6 lg:gap-8 font-[Poppins]">
            <a href="/home" className={`${isActive('home') ? 'text-[#3252DF] font-semibold' : 'text-[#152C5B]'} text-[16px]`}>Home</a>
            <a href="#" onClick={handleHotelsClick} className={`${isActive('hotels') ? 'text-[#3252DF] font-semibold' : 'text-[#152C5B]'} hover:text-[#3252DF] transition cursor-pointer`}>Hotels</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">Rooms</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">About</a>
            <a href="#" className="text-[#152C5B] hover:text-[#3252DF] transition">Contact</a>
            
          </nav>
          {currentUser && currentUser.role && (
            <button
              className="text-blue-600 border-2 border-blue-600 font-semibold rounded-xl px-5 py-2.5 shadow-md hover:bg-blue-50 hover:scale-105 transition-all duration-300 focus:outline-none cursor-pointer"
              onClick={goToDashboard}
            >
              Dashboard
            </button>
          )}
          <button
            className="bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl px-8 py-2.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none cursor-pointer"
            onClick={handleAuthClick}
          >
            {isLoggedIn ? 'Logout' : 'Login'}
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
          <div className="fixed inset-0 w-full h-full bg-white shadow-2xl z-50 flex flex-col lg:hidden overflow-auto pt-6 px-6 animate-slide-in">
            {/* Logo at top */}
            <div className="w-full flex items-center justify-between mb-8">
              <div className="text-[22px] sm:text-[26px] font-bold flex items-center">
                <span className="bg-linear-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent font-bold">Lanka</span>
                <span className="text-gray-900 font-bold ml-1">Stay.</span>
              </div>
              {/* Close button */}
              <button
                className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-4 font-[Poppins] w-full mt-4">
              <a href="/home" className="text-[#3252DF] text-[18px] w-full text-left py-3 px-4 rounded-xl hover:bg-blue-50 transition-all duration-200" onClick={() => setMenuOpen(false)}>Home</a>
              <a href="#" onClick={(e) => { handleHotelsClick(e); setMenuOpen(false); }} className="text-[#152C5B] hover:text-[#3252DF] hover:bg-blue-50 transition-all duration-200 cursor-pointer w-full text-left py-3 px-4 rounded-xl">Hotels</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] hover:bg-blue-50 transition-all duration-200 w-full text-left py-3 px-4 rounded-xl" onClick={() => setMenuOpen(false)}>Rooms</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] hover:bg-blue-50 transition-all duration-200 w-full text-left py-3 px-4 rounded-xl" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#" className="text-[#152C5B] hover:text-[#3252DF] hover:bg-blue-50 transition-all duration-200 w-full text-left py-3 px-4 rounded-xl" onClick={() => setMenuOpen(false)}>Contact</a>
              {currentUser && currentUser.role && (
                <button
                  className="text-blue-600 border-2 border-blue-600 font-semibold rounded-xl px-5 py-3 shadow-md hover:bg-blue-50 transition-all duration-200 focus:outline-none w-full text-left"
                  onClick={() => { setMenuOpen(false); goToDashboard(); }}
                >
                  Dashboard
                </button>
              )}
            </nav>
            <button
              className="bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl px-8 py-3 mt-6 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none w-full max-w-sm"
              onClick={() => {
                setMenuOpen(false);
                handleAuthClick();
              }}
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>
        )}
      </div>
   
    
     </header>
  );
};

export default Header;
